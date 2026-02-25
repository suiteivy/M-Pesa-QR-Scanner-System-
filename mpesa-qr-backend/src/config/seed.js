import { db } from './firebase.js';
import admin from 'firebase-admin';

async function seedDatabase() {
  // 1. SET YOUR TARGET MERCHANT ID HERE
  const targetMerchantId = "QuH2tp7vT8Nvf9uFnjMzTZ9zPAE2"; 
  console.log(`🌱 Seeding data for Merchant: ${targetMerchantId}...`);

  try {
    const startDate = new Date("2026-02-18T00:00:00Z");
    const endDate = new Date("2026-02-24T23:59:59Z");

    const batch = db.batch();

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      
      // Each day generate 3 Direct Transactions and 2 Guest Transactions
      for (let i = 0; i < 5; i++) {
        const docRef = db.collection('transactions').doc();
        const timestamp = new Date(d);
        timestamp.setHours(8 + i, Math.floor(Math.random() * 60));

        const isGuest = i >= 3; // Transactions 4 and 5 will be Guest Transactions
        const status = Math.random() > 0.2 ? 'success' : 'pending';
        const amount = Math.floor(Math.random() * 3000) + 200;

        const txData = {
          amount: amount,
          status: status,
          currency: "KES",
          transactionRef: `SEED_${isGuest ? 'GUEST' : 'DIR'}_${dateStr}_${i}`,
          createdAt: admin.firestore.Timestamp.fromDate(timestamp),
          updatedAt: admin.firestore.Timestamp.fromDate(timestamp),
        };

        if (isGuest) {
          // Test logic: merchantId is different, but originalMerchantId matches
          txData.merchantId = "some_other_id"; 
          txData.guestMerchantInfo = {
            originalMerchantId: targetMerchantId,
            shopName: "Guest Branch Alpha",
            createdAt: admin.firestore.Timestamp.fromDate(timestamp)
          };
        } else {
          // Standard logic
          txData.merchantId = targetMerchantId;
        }

        batch.set(docRef, txData);
      }
    }

    await batch.commit();
    console.log("✅ Seeding completed! Analytics will now aggregate both Direct and Guest data.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seedDatabase();