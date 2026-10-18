import * as admin from "firebase-admin";
import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serviceAccountPath = path.resolve(__dirname, "../qr-payment-adminsdk.json");

let app = null;
let auth = null;
let db = null;

if (fs.existsSync(serviceAccountPath)) {
  try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    app = !getApps().length ? initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
    }) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (err) {
    console.warn("⚠️ Firebase Admin Init Error:", err.message);
  }
} else {
  console.warn("⚠️ firebase-admin.js: qr-payment-adminsdk.json not found. Admin SDK skipped.");
}

export { admin, auth, db };