import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';
import { admin, db } from '../config/firebase.js';
import moment from 'moment';

// --- INFRASTRUCTURE CONFIG ---
const MPESA_BASE_URL = process.env.MPESA_BASE_URL?.trim().replace(/\/+$/, "") || 'https://sandbox.safaricom.co.ke';

// ELITE FEATURE: Memory caching for the Access Token to prevent 429 Rate Limit errors in production
let tokenCache = {
  token: null,
  expiresAt: 0
};

/**
 * 1. ACCESS TOKEN PROVISIONING (with Caching)
 * Ensures we only call Safaricom once per hour.
 */
async function generateAccessToken() {
  const now = Date.now();
  if (tokenCache.token && now < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  try {
    const key = process.env.MPESA_CONSUMER_KEY?.trim();
    const secret = process.env.MPESA_CONSUMER_SECRET?.trim();
    const auth = Buffer.from(`${key}:${secret}`).toString('base64');

    const response = await axios.get(`${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${auth}` }
    });

    // Cache with a 5-minute safety buffer
    tokenCache = {
      token: response.data.access_token,
      expiresAt: now + (parseInt(response.data.expires_in) - 300) * 1000
    };

    console.log('✅ Access Token Synchronized');
    return response.data.access_token;
  } catch (error) {
    console.error('❌ Token Error:', error.response?.data || error.message);
    return null;
  }
}

/**
 * 2. SHARED STK PROVISIONING ENGINE
 * Core logic used by both Customer and Merchant triggers.
 */
async function executeSTKPush({ phoneNumber, amount, merchantId, source = 'QR_TERMINAL' }) {
  // A. FETCH MERCHANT IDENTITY (Siphoning)
  const merchantDoc = await db.collection('merchants').doc(merchantId).get();
  if (!merchantDoc.exists) throw new Error('Merchant Not Verified');
  const merchantData = merchantDoc.data();

  // B. DYNAMIC SWITCHBOARD LOGIC
  const isTill = merchantData.accountType?.toLowerCase() === 'till';
  const transactionType = isTill ? 'CustomerBuyGoodsOnline' : 'CustomerPayBillOnline';
  const partyB = merchantData.shortcode; // Siphoned from Firestore

  if (!partyB) throw new Error('Merchant Destination Not Provisioned');

  // C. SANITIZATION
  let formattedPhone = phoneNumber.replace(/\D/g, '');
  if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.slice(1);
  if (formattedPhone.length === 9) formattedPhone = '254' + formattedPhone;
  const parsedAmount = Math.ceil(parseFloat(amount));

  // D. AUTH & SECURITY
  const accessToken = await generateAccessToken();
  const timestamp = moment().format('YYYYMMDDHHmmss');
  const password = Buffer.from(
    `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
  ).toString('base64');

  // E. REFERENCE OPTIMIZATION (Strict length limits for Production)
  const rawRef = merchantData.accountReference || merchantData.name.replace(/\s/g, '').toUpperCase();
  const accountRef = rawRef.substring(0, 12); 
  const safeDesc = `Pay ${merchantData.name.substring(0, 9)}`;

  const stkPayload = {
    BusinessShortCode: process.env.MPESA_SHORTCODE, 
    Password: password,
    Timestamp: timestamp,
    TransactionType: transactionType,
    Amount: parsedAmount,
    PartyA: formattedPhone,
    PartyB: partyB, 
    PhoneNumber: formattedPhone,
    CallBackURL: `${process.env.SERVER_URL}/api/daraja/stk-callback`,
    AccountReference: accountRef,
    TransactionDesc: safeDesc
  };

  console.log(`📤 Dispatching STK | Merchant: ${merchantData.name} | Dest: ${partyB} | Type: ${transactionType}`);

  const response = await axios.post(
    `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
    stkPayload,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (response.data.ResponseCode === "0") {
    // F. SCHEMA-ALIGNED LOGGING
    const txnRecord = {
      merchantId,
      merchantName: merchantData.name,
      amount: parsedAmount,
      phoneNumber: formattedPhone,
      status: 'pending',
      transactionRef: accountRef,
      CheckoutRequestID: response.data.CheckoutRequestID, // Top-level for S22 Dashboard speed
      source: source,
      accountType: merchantData.accountType,
      mpesaResponse: response.data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('transactions').add(txnRecord);
    return response.data;
  } else {
    throw new Error(response.data.CustomerMessage || 'Gateway Handshake Failed');
  }
}

/**
 * 3. PUBLIC CUSTOMER TRIGGER
 */
async function triggerCustomerPayment(req, res) {
  try {
    const result = await executeSTKPush({ ...req.body, source: 'CUSTOMER_SCAN' });
    res.status(200).json({ success: true, message: 'STK Push Dispatched', checkoutRequestId: result.CheckoutRequestID });
  } catch (error) {
    console.error('❌ Customer Payment Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 4. SECURE MERCHANT TRIGGER (Terminal)
 */
async function triggerSTKPush(req, res) {
  try {
    const result = await executeSTKPush({ ...req.body, source: 'MERCHANT_TERMINAL' });
    res.status(200).json({ success: true, message: 'Terminal STK Initialized', checkoutRequestId: result.CheckoutRequestID });
  } catch (error) {
    console.error('❌ Merchant STK Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * 5. REAL-TIME CALLBACK SYNCHRONIZATION
 */
async function handleCallback(req, res) {
  try {
    const { Body } = req.body;
    if (!Body?.stkCallback) return res.json({ ResultCode: 1, ResultDesc: "Payload Rejected" });

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = Body.stkCallback;
    console.log(`🔔 Callback ID: ${CheckoutRequestID} | Result: ${ResultCode}`);

    let finalStatus = ResultCode === 0 ? 'success' : ResultCode === 1032 ? 'cancelled' : 'failed';

    const snapshot = await db.collection('transactions')
      .where('CheckoutRequestID', '==', CheckoutRequestID)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const meta = {};
      if (CallbackMetadata?.Item) {
        CallbackMetadata.Item.forEach(item => { meta[item.Name] = item.Value; });
      }

      await doc.ref.update({
        status: finalStatus,
        resultDesc: ResultDesc,
        receiptNumber: meta.MpesaReceiptNumber || null,
        callbackData: meta,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✅ ${doc.data().merchantName} Transaction Synced`);
    } else {
      await db.collection('orphaned_callbacks').add({ CheckoutRequestID, Body, receivedAt: admin.firestore.FieldValue.serverTimestamp() });
    }

    res.json({ ResultCode: 0, ResultDesc: "Success" });
  } catch (error) {
    console.error('❌ Callback Sync Error:', error);
    res.json({ ResultCode: 0, ResultDesc: "Internal Handled" });
  }
}

/**
 * 6. ASSET PROVISIONING (QR Generator)
 */
async function generateMerchantQR(req, res) {
  try {
    const merchantId = req.user.uid;
    const merchantDoc = await db.collection('merchants').doc(merchantId).get();
    if (!merchantDoc.exists) return res.status(404).json({ success: false, message: 'Identity Not Found' });
    const merchantData = merchantDoc.data();

    const accessToken = await generateAccessToken();
    const trxCode = merchantData.accountType === 'till' ? 'BG' : 'PB';

    const payload = {
      MerchantName: merchantData.name.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 25),
      RefNo: merchantData.accountReference || "PAYMENT",
      Amount: Math.max(1, Math.ceil(req.body.amount || 1)),
      TrxCode: trxCode,
      CPI: merchantData.shortcode,
      Size: "300"
    };

    const response = await axios.post(`${MPESA_BASE_URL}/mpesa/qrcode/v1/generate`, payload, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (response.data.ResponseCode === "00") {
      res.status(200).json({ success: true, data: { qrCode: response.data.QRCode, meta: payload } });
    } else {
      throw new Error(response.data.ResponseDescription);
    }
  } catch (error) {
    console.error('❌ QR Provisioning Failed:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: 'QR Engine Failure' });
  }
}

/**
 * 7. UTILITIES & HEALTH
 */
async function healthCheck(req, res) {
  const accessToken = await generateAccessToken();
  res.status(200).json({
    status: 'Elite',
    mpesa_connectivity: accessToken ? 'Active' : 'Handshake Failed',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
}

async function testMpesaConnection(req, res) {
  const token = await generateAccessToken();
  res.json({ success: !!token, message: token ? 'Handshake Success' : 'Handshake Failed' });
}

async function testRegister(req, res) {
  try {
    const { email, password, name } = req.body;
    const userRecord = await admin.auth().createUser({ email, password, displayName: name });
    res.status(201).json({ success: true, uid: userRecord.uid });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
}

async function createTestTransaction(req, res) {
  const { merchantId, amount, phoneNumber } = req.body;
  const txn = {
    merchantId,
    amount: parseFloat(amount),
    phoneNumber,
    status: 'success',
    CheckoutRequestID: `SIM-${Date.now()}`,
    source: 'simulation',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };
  const doc = await db.collection('transactions').add(txn);
  res.status(201).json({ success: true, id: doc.id });
}

export { 
  triggerSTKPush, triggerCustomerPayment, handleCallback, 
  generateMerchantQR, generateAccessToken, healthCheck, 
  testMpesaConnection, testRegister, createTestTransaction 
};