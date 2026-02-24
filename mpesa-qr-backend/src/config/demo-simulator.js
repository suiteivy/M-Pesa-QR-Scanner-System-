import { db, admin } from './firebase.js'; // Adjust path to your admin config

const DEMO_UID = "QuH2tp7vT8Nvf9uFnjMzTZ9zPAE2"

// Helper: Generate random Kenyan phone numbers (Format: 254XXXXXXXXX)
const generateRandomPhone = () => {
  const prefixes = ['2547', '2541'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const body = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return `${prefix}${body}`;
};

const injectLiveTransaction = async () => {
  try {
    // Matches schema enum exactly
    const statusOptions = ['success', 'success', 'success', 'success', 'failed', 'cancelled', 'pending', 'error'];
    const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
    const amount = Math.floor(Math.random() * 4500) + 50;
    const phone = generateRandomPhone();

    // Use Firestore Server Timestamp for absolute precision
    const now = admin.firestore.FieldValue.serverTimestamp();

    // Pre-generate the document reference so we can capture its ID
    const docRef = db.collection('transactions').doc();

    const transactionData = {
      id: docRef.id, // Aligned: Storing the auto-generated ID inside the document
      merchantId: DEMO_UID,
      phoneNumber: phone,
      amount: amount,
      status: status,
      description: "Demo QR Payment",
      transactionRef: `Tx_DEMO_${Date.now()}`,
      createdAt: now,
      updatedAt: now,
      mpesaResponse: {
        ResponseCode: status === 'success' ? "0" : "1",
        ResponseDescription: status === 'success' ? "Success" : "Insufficient Funds",
        MerchantRequestID: `MID_${Math.random().toString(36).substring(2, 9)}`,
        CheckoutRequestID: `CHk_${Math.random().toString(36).substring(2, 9)}`,
        CustomerMessage: status === 'success' ? "Success. Request accepted for processing" : "Request failed"
      },
      // Aligned: Only add paymentDetails for successful transactions
      ...(status === 'success' && {
        paymentDetails: {
          amount: amount,
          mpesaReceiptNumber: `R${Math.random().toString(36).toUpperCase().substring(2, 10)}`,
          transactionDate: new Date().toISOString(),
          phoneNumber: phone
        }
      }),
      // Aligned: Add error string for failed/error transactions
      ...((status === 'failed' || status === 'error') && {
        error: "Customer cancelled the STK push or insufficient funds."
      }),
      guestMerchantInfo: {
        originalMerchantId: DEMO_UID,
        isGuest: Math.random() > 0.7
      }
    };

    // Inject directly into Firestore
    await docRef.set(transactionData);

    console.log(`✅ [${new Date().toLocaleTimeString()}] Simulated ${status.toUpperCase()} payment of KES ${amount} from ${phone}`);

  } catch (error) {
    console.error("❌ Simulation injection error:", error);
  }

  // --- THE TIMING ENGINE (10 TRANSACTIONS PER HOUR) ---
  // Average of 1 transaction every 6 minutes (360,000 ms).
  // Randomizing between 5 and 7 minutes for organic traffic flow.
// --- THE TIMING ENGINE (25 TRANSACTIONS PER HOUR) ---
  // Average of 1 transaction every 2.4 minutes (144,000 ms).
  // Randomizing between 2 and 2.8 minutes for organic traffic flow.
  const minDelay = 120000; // 2 minutes in ms
  const maxDelay = 168000; // 2.8 minutes in ms
  const nextDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

  const minutes = Math.floor(nextDelay / 60000);
  const seconds = ((nextDelay % 60000) / 1000).toFixed(0);

  console.log(`⏳ Next transaction arriving in ${minutes}m ${seconds}s...`);

  // Recursively call itself after the random delay
  setTimeout(injectLiveTransaction, nextDelay);
};

// Export the trigger for your server.js to use
export const startDemoSimulator = () => {
  console.log(`🚀 Starting Live Demo Simulator for UID: ${DEMO_UID}`);
  console.log(`⚙️  Rate Limit: ~25 transactions per hour`);
  injectLiveTransaction();
};