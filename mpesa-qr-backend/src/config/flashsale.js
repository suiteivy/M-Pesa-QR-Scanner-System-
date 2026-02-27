import { db, admin } from './firebase.js'; // Using your new structured config

const initializeFlashSale = async () => {
  try {
    console.log("⏳ Initializing Launch Celebration Flash Sale...");

    // 1. Reference the document
    const marketingRef = db.collection("system_configs").doc("marketing");

    // 2. Use Firestore Server Timestamps for absolute precision
    const now = admin.firestore.FieldValue.serverTimestamp();

    const flashSaleData = {
      flashSale: {
        isActive: true,
        discountPercent: 10,
        // Synchronized expiration for all merchants
        expiresAt: "2026-03-01T23:59:59Z", 
        label: "Launch Celebration",
        updatedAt: now, // 🚀 Uses the official Google server time
        metadata: {
          initializedBy: "Admin CLI",
          version: "1.0.0"
        }
      }
    };

    // 3. Inject into Firestore with Merge to preserve other marketing configs
    await marketingRef.set(flashSaleData, { merge: true });

    console.log("--------------------------------------------------");
    console.log("✅ SUCCESS: Flash Sale live in system_configs/marketing");
    console.log(`🕒 Server Timestamp requested at: ${new Date().toLocaleTimeString()}`);
    console.log("--------------------------------------------------");

    process.exit(0);
  } catch (error) {
    console.error("❌ ERROR: Failed to initialize Flash Sale:", error.message);
    process.exit(1);
  }
};

// Auto-run when the script is called directly
initializeFlashSale();