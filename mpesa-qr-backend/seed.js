import { db, admin } from './src/config/firebase.js';

const targetUID = "QuH2tp7vT8Nvf9uFnjMzTZ9zPAE2";
const name = "BACSI";

async function clearFebData() {
  console.log(`🗑️ Clearing February 2026 data for ${name}...`);
  const start = admin.firestore.Timestamp.fromDate(new Date("2026-02-01T00:00:00Z"));
  const end = admin.firestore.Timestamp.fromDate(new Date("2026-02-28T23:59:59Z"));

  const snapshot = await db.collection('transactions')
    .where('merchantId', '==', targetUID)
    .where('createdAt', '>=', start)
    .where('createdAt', '<=', end)
    .get();

  if (snapshot.empty) return;

  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  console.log(`✅ Cleaned up ${snapshot.size} transactions.`);
}

const generateBulkData = () => {
  const transactions = [];
  const startDate = new Date("2026-02-01T00:00:00Z");
  const today = new Date(); // Feb 25th

  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    // 1-3 transactions per day to keep total revenue controlled
    const dailyCount = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < dailyCount; i++) {
      const date = new Date(d);
      date.setHours(Math.floor(Math.random() * 12) + 8); 
      
      const statusOptions = ['success', 'success', 'success', 'failed', 'pending'];
      const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
      
      // Values between 5k and 25k to aim for ~45k daily average
      const amount = Math.floor(Math.random() * 20001) + 5000;

      transactions.push({
        merchantId: targetUID,
        phoneNumber: "254708374149",
        amount: amount,
        status: status,
        description: "Standard Daily Payment",
        transactionRef: `Tx_FEB_STABLE_${date.getTime()}_${i}`,
        createdAt: admin.firestore.Timestamp.fromDate(date),
        updatedAt: admin.firestore.Timestamp.fromDate(date),
        mpesaResponse: {
          ResponseCode: status === 'success' ? "0" : "1",
          ResponseDescription: status === 'success' ? "Success" : "Failed"
        },
        ...(status === 'success' && {
          paymentDetails: {
            amount: amount,
            mpesaReceiptNumber: `R${Math.random().toString(36).toUpperCase().substr(2, 8)}`,
            transactionDate: date.toISOString(),
            phoneNumber: "254708374149"
          }
        }),
        guestMerchantInfo: {
          originalMerchantId: targetUID,
          isGuest: i === 0 // Mixes some guest data
        }
      });
    }
  }
  return transactions;
};

async function run() {
  try {
    await clearFebData();
    const data = generateBulkData();
    
    // Calculate expected total for preview
    const expectedSuccess = data
      .filter(t => t.status === 'success')
      .reduce((sum, t) => sum + t.amount, 0);

    console.log(`🚀 Seeding ${data.length} transactions...`);
    console.log(`📊 Projected Successful Revenue: KES ${expectedSuccess.toLocaleString()}`);

    const batch = db.batch();
    data.forEach(tx => {
      const docRef = db.collection('transactions').doc();
      batch.set(docRef, tx);
    });

    await batch.commit();
    console.log(`✅ Success! Data seeded for ${name}. Total: KES ${expectedSuccess.toLocaleString()}`);
  } catch (error) {
    console.error("❌ Process failed:", error);
  } finally {
    process.exit();
  }
}

run();