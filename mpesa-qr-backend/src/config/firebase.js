// 1. Load Environment Variables
import 'dotenv/config'; 

// 2. Admin SDK Imports
import admin from "firebase-admin";

// 3. Load Service Account
import serviceAccount from "../qr-payment-adminsdk.json" with { type: "json" };

// 4. Initialize Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id 
  });
  console.log("🔥 Firebase Admin initialized for project:", serviceAccount.project_id);
}

// 5. Exports (Removing Client SDK to prevent API Key errors)
export const db = admin.firestore(); 
export const adminAuth = admin.auth(); 

export { admin };