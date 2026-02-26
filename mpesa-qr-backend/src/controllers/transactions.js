import { admin } from "../config/firebase.js";
import { db } from "../config/firebase.js";

// --- UTILITY HELPERS ---

/**
 * Safely converts a date object to a YYYY-MM-DD string based on LOCAL time (EAT).
 * Prevents the -1 day shift caused by UTC conversion in .toISOString().
 */
const getLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getEATDateString = (date) => {
  // Shift by 3 hours before converting to string
  const eatDate = new Date(date.getTime() + (3 * 60 * 60 * 1000));
  return eatDate.getUTCFullYear() + '-' +
    String(eatDate.getUTCMonth() + 1).padStart(2, '0') + '-' +
    String(eatDate.getUTCDate()).padStart(2, '0');
};

function convertFirestoreTimestamp(timestamp) {
  if (!timestamp) return null;
  // Handle Firestore Timestamp object or raw JS Date
  if (timestamp.toDate) return timestamp.toDate();
  if (timestamp._seconds) return new Date(timestamp._seconds * 1000);
  return new Date(timestamp);
}

function serializeTransaction(transaction) {
  if (!transaction) return null;
  const serialized = { ...transaction };
  ['createdAt', 'updatedAt', 'callbackReceivedAt', 'lastCallbackAt'].forEach(field => {
    if (serialized[field]) {
      const converted = convertFirestoreTimestamp(serialized[field]);
      serialized[field] = converted ? converted.toISOString() : null;
    }
  });
  if (serialized.guestMerchantInfo?.createdAt) {
    const converted = convertFirestoreTimestamp(serialized.guestMerchantInfo.createdAt);
    serialized.guestMerchantInfo.createdAt = converted ? converted.toISOString() : null;
  }
  if (serialized.paymentDetails?.completedAt) {
    const converted = convertFirestoreTimestamp(serialized.paymentDetails.completedAt);
    serialized.paymentDetails.completedAt = converted ? converted.toISOString() : null;
  }
  return serialized;
}



const getNormalizedTodayRevenue = (currentRevenue) => {
  const now = new Date();
  const hoursPassed = now.getHours() + (now.getMinutes() / 60);

  // Prevent division by zero and provide a minimum floor (e.g., start scaling after 1 AM)
  if (hoursPassed < 1) return currentRevenue;

  // Simple Linear Scaling: (Current / Hours Passed) * 24 
  // This estimates the 24-hour total based on the current hourly run-rate.
  const estimatedTotal = (currentRevenue / hoursPassed) * 24;

  // We apply a 20% "conservative buffer" so we don't over-predict 
  // early in the morning when data is volatile.
  return estimatedTotal * 0.8;
};

// Inside your main processing logic:
const prepareTrendData = (summaries) => {
  return summaries.map((day, index) => {
    const isToday = index === summaries.length - 1;
    let revenue = Number(day.totalRevenue || 0);

    // 🔥 Apply Option A: If it's the current ongoing day, scale it up
    if (isToday) {
      revenue = getNormalizedTodayRevenue(revenue);
    }

    return {
      x: index + 1,
      y: revenue
    };
  });
};

// Then call your existing function
/**
 * Linear Regression Trend Calculator
 * Predicts Current Period (Today) and Next Period (Tomorrow)
 */
function calculateTrend(dataPoints) {
  const n = dataPoints.length;
  if (n < 2) return { slope: 0, nextPeriodPrediction: 0, currentPeriodPrediction: 0, trend: 'stable' };

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  dataPoints.forEach(p => {
    sumX += p.x;
    sumY += p.y;
    sumXY += (p.x * p.y);
    sumXX += (p.x * p.x);
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const currentVal = (slope * n) + intercept;
  const nextVal = (slope * (n + 1)) + intercept;

  return {
    slope,
    nextPeriodPrediction: Math.max(0, nextVal),
    currentPeriodPrediction: Math.max(0, currentVal),
    trend: slope > 0.5 ? 'growth' : slope < -0.5 ? 'decline' : 'stable'
  };
}

// --- CONTROLLERS ---

export async function getAllTransactionsGlobal(req, res) {
  try {
    const snapshot = await db.collection("transactions").orderBy("createdAt", "desc").limit(50).get();
    if (snapshot.empty) return res.status(200).json({ status: 'success', count: 0, transactions: [] });
    const transactions = snapshot.docs.map(doc => serializeTransaction({ id: doc.id, ...doc.data(), debugMode: true }));
    res.status(200).json({ status: 'success', count: transactions.length, transactions });
  } catch (error) {
    res.status(500).json({ error: `Database connectivity failed: ${error.message}` });
  }
}

async function executeQueriesWithFallback(directQuery, guestQuery, merchantId, period, filterDate, endFilterDate) {
  try {
    const [directSnapshot, guestSnapshot] = await Promise.all([directQuery.get(), guestQuery.get()]);
    return [directSnapshot, guestSnapshot];
  } catch (error) {
    const directSimple = db.collection("transactions").where("merchantId", "==", merchantId);
    const guestSimple = db.collection("transactions").where("guestMerchantInfo.originalMerchantId", "==", merchantId);
    const [dSnap, gSnap] = await Promise.all([directSimple.get(), guestSimple.get()]);
    return [dSnap, gSnap];
  }
}

export async function createTransaction(req, res) {
  const { phoneNumber, amount, qrData, reference, description } = req.body;
  const merchantId = req.user.uid;
  if (!phoneNumber || !amount) return res.status(400).json({ error: "Phone number and amount are required" });

  try {
    const transactionData = {
      merchantId,
      transactionRef: reference || `Tx_${Date.now()}`,
      phoneNumber,
      amount: parseFloat(amount),
      status: "pending",
      paymentType: 'merchant_initiated',
      source: qrData ? 'qr_generated' : 'api_direct',
      isValidMerchant: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (qrData) {
      transactionData.qrData = qrData;
      transactionData.description = description || qrData.description || 'QR Payment';
      transactionData.name = qrData.name;
    } else if (description) {
      transactionData.description = description;
    }
    const docRef = await db.collection("transactions").add(transactionData);
    res.status(201).json({ status: "Transaction successful", data: { transactionId: docRef.id } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getTransactions(req, res) {
  const merchantId = req.user.uid;
  const { period = 'all', status, startDate, endDate, limit = 100 } = req.query;

  try {
    const now = new Date();
    let filterDate = null;
    let endFilterDate = null;

    if (period === 'custom' && startDate && endDate) {
      filterDate = new Date(startDate);
      endFilterDate = new Date(endDate);
    } else if (period !== 'all') {
      filterDate = new Date();
      filterDate.setHours(0, 0, 0, 0);
      switch (period) {
        case 'today': endFilterDate = new Date(); break;
        case 'week': filterDate.setDate(now.getDate() - 7); break;
        case 'month': filterDate.setDate(now.getDate() - 30); break;
        case 'year': filterDate.setFullYear(now.getFullYear() - 1); break;
      }
    }

    let directQuery = db.collection("transactions").where("merchantId", "==", merchantId);
    let guestQuery = db.collection("transactions").where("guestMerchantInfo.originalMerchantId", "==", merchantId);

    if (filterDate) {
      const ts = admin.firestore.Timestamp.fromDate(filterDate);
      directQuery = directQuery.where("createdAt", ">=", ts);
      guestQuery = guestQuery.where("createdAt", ">=", ts);
    }

    const [dSnap, gSnap] = await executeQueriesWithFallback(directQuery.limit(Number(limit)), guestQuery.limit(Number(limit)), merchantId, period, filterDate, endFilterDate);
    const allDocs = [...dSnap.docs, ...gSnap.docs.filter(g => !dSnap.docs.some(d => d.id === g.id))];

    let transactions = allDocs.map(doc => serializeTransaction({ id: doc.id, ...doc.data() }));
    if (status && status !== 'all') transactions = transactions.filter(t => t.status === status);
    transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({ status: 'success', transactions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }

}

async function fetchRawMerchantTransactions(merchantId, period, limit = null) {
  const now = new Date();
  let filterDate = new Date();
  filterDate.setHours(0, 0, 0, 0);

  switch (period) {
    case 'today': break;
    case 'week': filterDate.setDate(now.getDate() - 7); break;
    case 'month': filterDate.setDate(now.getDate() - 30); break;
    case 'year': filterDate.setFullYear(now.getFullYear() - 1); break;
    default: filterDate = null;
  }

  let dQ = db.collection("transactions").where("merchantId", "==", merchantId);
  let gQ = db.collection("transactions").where("guestMerchantInfo.originalMerchantId", "==", merchantId);

  if (filterDate) {
    // Standardizing EAT Offset for Firestore Query
    const ts = admin.firestore.Timestamp.fromDate(new Date(filterDate.getTime() - (3 * 60 * 60 * 1000)));
    dQ = dQ.where("createdAt", ">=", ts);
    gQ = gQ.where("createdAt", ">=", ts);
  }

  const [dSnap, gSnap] = await Promise.all([
    limit ? dQ.limit(Number(limit)).get() : dQ.get(),
    limit ? gQ.limit(Number(limit)).get() : gQ.get()
  ]);

  // Deduplicate and return raw data
  const allDocs = [...dSnap.docs, ...gSnap.docs.filter(g => !dSnap.docs.some(d => d.id === g.id))];
  return allDocs.map(doc => ({ id: doc.id, ...doc.data() }));
}




export async function getTransactionAnalytics(req, res) {
  try {
    const merchantId = req.user.uid;
    const { period = 'week', status = 'all', limit = 50 } = req.query;
    const now = new Date();
    let filterDate = new Date();
    filterDate.setHours(0, 0, 0, 0);

    switch (period) {
      case 'today': break;
      case 'week': filterDate.setDate(now.getDate() - 7); break;
      case 'month': filterDate.setDate(now.getDate() - 30); break;
      case 'year': filterDate.setFullYear(now.getFullYear() - 1); break;
    }

    const ts = admin.firestore.Timestamp.fromDate(new Date(filterDate.getTime() - (3 * 60 * 60 * 1000)));

    // 1. CHEAP AGGREGATION: Get Total Revenue and Count (Cost: 1 READ)
    const baseQuery = db.collection('transactions')
      .where('merchantId', '==', merchantId)
      .where('createdAt', '>=', ts);

    const aggSnapshot = await baseQuery.where('status', '==', 'success').aggregate({
      totalRevenue: admin.firestore.AggregateField.sum('amount'),
      count: admin.firestore.AggregateField.count()
    }).get();

    const { totalRevenue, count } = aggSnapshot.data();

    // 2. DATA BUCKETING: We still need docs for the chart, but we limit fields if possible
    // (Firestore currently requires doc reads for daily grouping)
    const docsSnapshot = await baseQuery.get();
    const dailyMap = {};
    for (let d = new Date(filterDate); d <= now; d.setDate(d.getDate() + 1)) {
      const key = getEATDateString(d);
      dailyMap[key] = { date: key, totalRevenue: 0, count: 0 };
    }

    const hoursMap = new Array(24).fill(0);
    let qrRevenue = 0;
    let qrCount = 0;

// Inside getTransactionAnalytics loop:
docsSnapshot.forEach(doc => {
  const t = doc.data();
  const dateObj = convertFirestoreTimestamp(t.createdAt);
  if (dateObj) {
    const dateKey = getEATDateString(dateObj);
    if (dailyMap[dateKey]) {
      // 1. Revenue & Success Count
      if (t.status === 'success') {
        dailyMap[dateKey].totalRevenue += Number(t.amount);
        dailyMap[dateKey].count++;
      }
      // 2. Pending Count (Always tracked)
      if (t.status === 'pending') {
        dailyMap[dateKey].pendingCount = (dailyMap[dateKey].pendingCount || 0) + 1;
      }
      // 3. Failed Count (Always tracked)
      if (['failed', 'error'].includes(t.status)) {
        dailyMap[dateKey].failedCount = (dailyMap[dateKey].failedCount || 0) + 1;
      }
    }
  }
});

    const sortedSummaries = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
    const trendData = sortedSummaries.map((day, i) => ({
      x: i + 1,
      y: i === sortedSummaries.length - 1 ? getNormalizedTodayRevenue(day.totalRevenue) : day.totalRevenue
    }));
    const prediction = calculateTrend(trendData);

    // 3. PAGINATED RECENT LIST: Only fetch the first few (Cost: 'limit' READS)
    const recentDocs = docsSnapshot.docs
      .map(d => serializeTransaction({ id: d.id, ...d.data() }))
      .filter(t => status === 'all' || t.status === status)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, Number(limit));

    res.status(200).json({
      status: 'success',
      analytics: {
        period,
        summary: { totalTransactions: count, totalRevenue, qrRevenue, qrCount },
        insights: {
          peakTradingHour: `${hoursMap.indexOf(Math.max(...hoursMap)).toString().padStart(2, '0')}:00`,
          prediction: {
            trendDirection: prediction.trend,
            todayRevenueForecast: Math.round(prediction.currentPeriodPrediction),
            nextDayRevenue: Math.round(prediction.nextPeriodPrediction)
          }
        },
        dailySummaries: sortedSummaries
      },
      transactions: recentDocs
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
}

/**
 * UPDATED MERCHANT ALL TRANSACTIONS: Also uses the isolated fetcher
 */
export async function getMerchantAllTransactions(req, res) {
  const merchantId = req.user.uid;
  const { period = 'all', limit = 100 } = req.query;

  try {
    const rawData = await fetchRawMerchantTransactions(merchantId, period, limit);
    const transactions = rawData.map(doc => serializeTransaction(doc));
    transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({ status: 'success', transactions, count: transactions.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}


export async function getTransactionById(req, res) {
  const { transactionId } = req.params;
  const merchantId = req.user.uid;
  try {
    const doc = await db.collection("transactions").doc(transactionId).get();
    if (!doc.exists) return res.status(404).json({ error: "Not found" });
    const data = doc.data();
    if (data.merchantId !== merchantId && data.guestMerchantInfo?.originalMerchantId !== merchantId) {
      return res.status(403).json({ error: "Denied" });
    }
    res.status(200).json({ status: "success", transaction: serializeTransaction({ id: doc.id, ...data }) });
  } catch (error) { res.status(500).json({ error: error.message }); }
}

export async function updateTransactionStatus(req, res) {
  const { transactionId } = req.params;
  const { status, reason } = req.body;
  const merchantId = req.user.uid;
  try {
    const ref = db.collection("transactions").doc(transactionId);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: "Not found" });
    const data = doc.data();
    if (data.merchantId !== merchantId && data.guestMerchantInfo?.originalMerchantId !== merchantId) {
      return res.status(403).json({ error: "Denied" });
    }
    await ref.update({ status, updatedAt: admin.firestore.FieldValue.serverTimestamp(), updateReason: reason });
    res.status(200).json({ status: 'success' });
  } catch (error) { res.status(500).json({ error: error.message }); }
}

export async function getQRTransactionInsights(req, res) {
  const merchantId = req.user.uid;
  try {
    const snap = await db.collection("transactions").where("merchantId", "==", merchantId).get();
    const qrTxs = snap.docs.map(d => d.data()).filter(t => !!t.qrData);
    res.status(200).json({ status: 'success', insights: { qrCount: qrTxs.length } });
  } catch (error) { res.status(500).json({ error: error.message }); }
}

export async function getTransactionByCheckoutRequestID(checkoutRequestID) {
  try {
    // Schema shows CheckoutRequestID is nested inside mpesaResponse
    const snap = await db.collection('transactions')
      .where('mpesaResponse.CheckoutRequestID', '==', checkoutRequestID)
      .limit(1)
      .get();
    if (snap.empty) return null;
    return { id: snap.docs[0].id, data: snap.docs[0].data() };
  } catch (error) { return null; }
}
export async function debugTransactions(req, res) {
  const merchantId = req.user.uid;
  try {
    const snap = await db.collection('transactions').where('merchantId', '==', merchantId).limit(10).get();
    const transactions = snap.docs.map(doc => doc.data());
    res.status(200).json({ status: 'success', merchantId, sample: transactions });
  } catch (error) { res.status(500).json({ error: error.message }); }
}

export {
  getTransactionByCheckoutRequestID as getByCheckoutID // Exporting alias if needed
};