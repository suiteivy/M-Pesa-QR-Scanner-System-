import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const rawApiKey = process.env.REACT_APP_FIREBASE_API_KEY;
const isApiKeyConfigured = rawApiKey && rawApiKey !== 'your_firebase_api_key_here';

const firebaseConfig = {
  apiKey: isApiKeyConfigured ? rawApiKey : "AIzaSy_PLACEHOLDER_API_KEY_PLEASE_UPDATE_ENV",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "qr-payment-8a0f0.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "qr-payment-8a0f0",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "qr-payment-8a0f0.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "100000000000",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:100000000000:web:abcdef123456",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

if (!isApiKeyConfigured) {
  console.warn(
    "⚠️ Firebase API Key is not configured in mpesa-qr-frontend/.env - using safe placeholder until key is provided."
  );
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;