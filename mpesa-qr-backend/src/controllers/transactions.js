import { admin } from "../config/firebase.js";
import { db } from "../config/firebase.js";

// --- UTILITY HELPERS ---

/**
 * Safely converts a date object to a YYYY-MM-DD strggeing based on LOCAL time (EAT).
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
/**
 * Predicts revenue using a hybrid of Linear Regression and Naive Forecasting
 * @param {Array} data - Array of { x: dayIndex, y: revenue }
 */
/**
 * Predicts revenue using a hybrid of Linear Regression and Naive Forecasting
 */


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



/**
 * Predicts revenue using a hybrid of Weighted Linear Regression 
 * and a recent-moving-average floor to handle outliers.
 */
const calculateTrend = (data) => {
  const n = data.length;
  if (n < 2) {
    const val = n === 1 ? data[0].y : 0;
    return { trend: 'stable', currentPeriodPrediction: val, nextDayRevenue: val };
  }

  // 🚀 WEIGHTED REGRESSION: Recent days (yesterday/today) have more influence
  let sumW = 0, sumWX = 0, sumWY = 0, sumWXY = 0, sumWX2 = 0;
  
  data.forEach((p, i) => {
    const weight = i + 1; 
    sumW += weight;
    sumWX += weight * p.x;
    sumWY += weight * p.y;
    sumWXY += weight * p.x * p.y;
    sumWX2 += weight * p.x * p.x;
  });

  const slope = (sumW * sumWXY - sumWX * sumWY) / (sumW * sumWX2 - sumWX * sumWX);
  const intercept = (sumWY - slope * sumWX) / sumW;

  const todayForecast = slope * data[n - 1].x + intercept;
  let nextDayForecast = slope * (data[n - 1].x + 1) + intercept;

  // 🛡️ RECENT MOVING AVERAGE FLOOR: Use 90% of last 3 days if regression hits 0
  const recentDays = data.slice(-3);
  const recentAvg = recentDays.reduce((a, b) => a + b.y, 0) / recentDays.length;
  
  if (nextDayForecast <= 0) nextDayForecast = recentAvg * 0.9; 

  return {
    trend: slope > 0.1 ? 'growth' : (slope < -0.1 ? 'decline' : 'stable'),
    currentPeriodPrediction: Math.max(todayForecast, data[n - 1].y),
    nextDayRevenue: nextDayForecast
  };
};

export async function getTransactionAnalytics(req, res) {
  try {
    const merchantId = req.user.uid;
    const { period = 'week', status = 'all', limit = 50 } = req.query;
    const now = new Date();
    let filterDate = new Date();
    filterDate.setHours(0, 0, 0, 0);

    // 1. DYNAMIC TIME FILTERING
    switch (period) {
      case 'today': break;
      case 'week': filterDate.setDate(now.getDate() - 7); break;
      case 'month': filterDate.setDate(now.getDate() - 30); break;
      case 'year': filterDate.setFullYear(now.getFullYear() - 1); break;
    }

    // Standardizing EAT Offset for Firestore (3-hour difference)
    const ts = admin.firestore.Timestamp.fromDate(new Date(filterDate.getTime() - (3 * 60 * 60 * 1000)));

    // 2. AGGREGATED TOTALS
    const baseQuery = db.collection('transactions')
      .where('merchantId', '==', merchantId)
      .where('createdAt', '>=', ts);

    const aggSnapshot = await baseQuery.where('status', '==', 'success').aggregate({
      totalRevenue: admin.firestore.AggregateField.sum('amount'),
      count: admin.firestore.AggregateField.count()
    }).get();

    const { totalRevenue, count } = aggSnapshot.data();

    // 3. DATA PROCESSING & BUCKETING
    const docsSnapshot = await baseQuery.get();
    const dailyMap = {};
    const hoursMap = new Array(24).fill(0);
    let qrRevenue = 0;
    let qrCount = 0;

    // Initialize map to prevent gaps in chart visual
    for (let d = new Date(filterDate); d <= now; d.setDate(d.getDate() + 1)) {
      const key = getEATDateString(d);
      dailyMap[key] = { date: key, totalRevenue: 0, count: 0, pendingCount: 0, failedCount: 0 };
    }

    docsSnapshot.forEach(doc => {
      const t = doc.data();
      const dateObj = convertFirestoreTimestamp(t.createdAt);
      if (dateObj) {
        const dateKey = getEATDateString(dateObj);
        const hour = dateObj.getHours();

        if (dailyMap[dateKey]) {
          if (t.status === 'success') {
            const amt = Number(t.amount || 0);
            dailyMap[dateKey].totalRevenue += amt;
            dailyMap[dateKey].count++;
            hoursMap[hour] += amt;

            // Fix for the 0 stats: Track QR specific revenue
            if (t.source === 'qr_generated' || t.qrData) {
              qrRevenue += amt;
              qrCount++;
            }
          } else if (t.status === 'pending') {
            dailyMap[dateKey].pendingCount++;
          } else if (['failed', 'error', 'cancelled'].includes(t.status)) {
            dailyMap[dateKey].failedCount++;
          }
        }
      }
    });

    const sortedSummaries = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    // 4. 🔥 REVENUE FORECASTING PIPELINE
    const trendData = sortedSummaries.map((day, i) => {
      const isToday = i === sortedSummaries.length - 1;
      let revenue = Number(day.totalRevenue || 0);

      // Scale "Today" based on current run-rate to prevent AI "crash" projection
      if (isToday && revenue > 0) {
        revenue = getNormalizedTodayRevenue(revenue);
      }
      return { x: i + 1, y: revenue };
    });

    const prediction = calculateTrend(trendData);

    // 5. PAGINATED RECENT LIST
    const recentDocs = docsSnapshot.docs
      .map(d => serializeTransaction({ id: d.id, ...d.data() }))
      .filter(t => status === 'all' || t.status === status)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, Number(limit));

    // 6. RESPONSE
    res.status(200).json({
      status: 'success',
      analytics: {
        period,
        summary: { 
          totalTransactions: count || 0, 
          totalRevenue: totalRevenue || 0,
          qrRevenue: qrRevenue || 0,
          qrCount: qrCount || 0
        },
        insights: {
          peakTradingHour: `${hoursMap.indexOf(Math.max(...hoursMap)).toString().padStart(2, '0')}:00`,
          prediction: {
            trendDirection: prediction.trend,
            todayRevenueForecast: Math.round(prediction.currentPeriodPrediction),
            nextDayRevenue: Math.round(prediction.nextDayRevenue)
          }
        },
        dailySummaries: sortedSummaries
      },
      transactions: recentDocs
    });
    console.log(res.json());

  } catch (error) {
    console.error("Analytics Failure:", error);
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