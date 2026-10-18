// 1. Load Environment Variables
import 'dotenv/config'; 
import admin from "firebase-admin";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serviceAccountPath = path.resolve(__dirname, "../qr-payment-adminsdk.json");

// Load Service Account safely if available
let serviceAccount = null;
if (fs.existsSync(serviceAccountPath)) {
  try {
    serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  } catch (e) {
    console.warn("⚠️ Failed to parse service account JSON:", e.message);
  }
}

// 5. Initialize Admin SDK safely
if (!admin.apps.length) {
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id 
    });
    console.log("🔥 Firebase Admin initialized for project:", serviceAccount.project_id);
  } else {
    console.warn("⚠️ Firebase Admin: qr-payment-adminsdk.json not found. Admin SDK not initialized.");
  }
}

// 6. Client SDK Config with safe fallback
const rawApiKey = process.env.FIREBASE_API_KEY || process.env.REACT_APP_FIREBASE_API_KEY;
const isApiKeyConfigured = rawApiKey && rawApiKey !== 'your_firebase_api_key_here';

const firebaseConfig = {
  apiKey: isApiKeyConfigured ? rawApiKey : "AIzaSy_PLACEHOLDER_API_KEY_PLEASE_UPDATE_ENV",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "qr-payment-8a0f0.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "qr-payment-8a0f0",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "qr-payment-8a0f0.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "100000000000",
  appId: process.env.FIREBASE_APP_ID || "1:100000000000:web:abcdef123456"
};

// 7. Initialize Client SDK safely
const clientApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 8. Exports
export const adminAuth = admin.apps.length ? admin.auth() : null;
export const db = admin.apps.length ? admin.firestore() : null;
export const clientAuth = getAuth(clientApp); 

console.log("Checking API Key:", isApiKeyConfigured ? "✅ Found" : "⚠️ Missing (Using Placeholder)");

export { admin };