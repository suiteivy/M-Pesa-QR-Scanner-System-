import { admin } from "../config/firebase.js";
import { db } from "../config/firebase.js";

// --- UTILITY HELPERS ---

const getLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getEATDateString = (date) => {
  const eatDate = new Date(date.getTime() + (3 * 60 * 60 * 1000));
  return eatDate.getUTCFullYear() + '-' + 
         String(eatDate.getUTCMonth() + 1).padStart(2, '0') + '-' + 
         String(eatDate.getUTCDate()).padStart(2, '0');
};

function convertFirestoreTimestamp(timestamp) {
  if (!timestamp) return null;
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
  return serialized;
}

const getNormalizedTodayRevenue = (currentRevenue) => {
  const now = new Date();
  const hoursPassed = now.getHours() + (now.getMinutes() / 60);
  if (hoursPassed < 1) return currentRevenue; 
  const estimatedTotal = (currentRevenue / hoursPassed) * 24;
  return estimatedTotal * 0.8; 
};

function calculateTrend(dataPoints) {
  const n = dataPoints.length;
  if (n < 2) return { slope: 0, nextPeriodPrediction: 0, currentPeriodPrediction: 0, trend: 'stable' };
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  dataPoints.forEach(p => {
    sumX += p.x; sumY += p.y; sumXY += (p.x * p.y); sumXX += (p.x * p.x);
  });
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { 
    slope, 
    nextPeriodPrediction: Math.max(0, (slope * (n + 1)) + intercept),
    currentPeriodPrediction: Math.max(0, (slope * n) + intercept), 
    trend: slope > 0.5 ? 'growth' : slope < -0.5 ? 'decline' : 'stable'
  };
}

// --- CORE FETCHERS ---

/**
 * Optimized fetcher that uses Aggregations to save on READ costs.
 * It only fetches full documents for the "recent transactions" list.
 */
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

    docsSnapshot.forEach(doc => {
      const t = doc.data();
      if (t.status === 'success') {
        const dateObj = convertFirestoreTimestamp(t.createdAt);
        if (dateObj) {
          const dateKey = getEATDateString(dateObj);
          if (dailyMap[dateKey]) {
            dailyMap[dateKey].totalRevenue += Number(t.amount);
            dailyMap[dateKey].count++;
          }
          const eatHour = (dateObj.getUTCHours() + 3) % 24;
          hoursMap[eatHour]++;
          if (t.source?.includes('qr') || t.qrData) {
            qrRevenue += Number(t.amount);
            qrCount++;
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

// --- REMAINING MODULES ---

export async function getMerchantAllTransactions(req, res) {
  const merchantId = req.user.uid;
  const { period = 'all', limit = 100 } = req.query;
  try {
    const dQ = db.collection("transactions").where("merchantId", "==", merchantId);
    const gQ = db.collection("transactions").where("guestMerchantInfo.originalMerchantId", "==", merchantId);
    const [dSnap, gSnap] = await Promise.all([dQ.limit(Number(limit)).get(), gQ.limit(Number(limit)).get()]);
    const transactions = [...dSnap.docs, ...gSnap.docs]
      .map(doc => serializeTransaction({ id: doc.id, ...doc.data() }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, Number(limit));
    res.status(200).json({ status: 'success', transactions });
  } catch (error) { res.status(500).json({ error: error.message }); }
}

export async function createTransaction(req, res) {
  const { phoneNumber, amount, qrData, reference, description } = req.body;
  try {
    const docRef = await db.collection("transactions").add({
      merchantId: req.user.uid,
      transactionRef: reference || `Tx_${Date.now()}`,
      phoneNumber, amount: parseFloat(amount), status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      qrData: qrData || null, description: description || "Payment"
    });
    res.status(201).json({ status: "success", transactionId: docRef.id });
  } catch (error) { res.status(500).json({ error: error.message }); }
}

export async function getTransactionByCheckoutRequestID(checkoutRequestID) {
  try {
    const snap = await db.collection('transactions').where('mpesaResponse.CheckoutRequestID', '==', checkoutRequestID).limit(1).get();
    return snap.empty ? null : { id: snap.docs[0].id, data: snap.docs[0].data() };
  } catch (error) { return null; }
}

export async function updateTransactionStatus(req, res) {
  try {
    const ref = db.collection("transactions").doc(req.params.transactionId);
    await ref.update({ status: req.body.status, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    res.status(200).json({ status: 'success' });
  } catch (error) { res.status(500).json({ error: error.message }); }
}

export async function getAllTransactionsGlobal(req, res) {
  try {
    const snap = await db.collection("transactions").orderBy("createdAt", "desc").limit(50).get();
    const transactions = snap.docs.map(doc => serializeTransaction({ id: doc.id, ...doc.data() }));
    res.status(200).json({ status: 'success', transactions });
  } catch (error) { res.status(500).json({ error: error.message }); }
}

export async function getTransactionById(req, res) {
  try {
    const doc = await db.collection("transactions").doc(req.params.transactionId).get();
    res.status(200).json({ status: "success", transaction: serializeTransaction({ id: doc.id, ...doc.data() }) });
  } catch (error) { res.status(500).json({ error: error.message }); }
}

export async function debugTransactions(req, res) {
  try {
    const snap = await db.collection('transactions').where('merchantId', '==', req.user.uid).limit(5).get();
    res.status(200).json({ status: 'success', sample: snap.docs.map(d => d.data()) });
  } catch (error) { res.status(500).json({ error: error.message }); }
}

export async function getQRTransactionInsights(req, res) {
  try {
    const snap = await db.collection("transactions").where("merchantId", "==", req.user.uid).get();
    const qrTxs = snap.docs.filter(d => d.data().qrData);
    res.status(200).json({ status: 'success', count: qrTxs.length });
  } catch (error) { res.status(500).json({ error: error.message }); }
}

export { getTransactionByCheckoutRequestID as getByCheckoutID };