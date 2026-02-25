// constants.js

// 1. ROBUST URL RESOLUTION
// We check for the variable you actually set (REACT_APP_API_URL)
// If that fails, we fallback to the IP you provided: https://merchantpro.cloudora.live
const ENV_URL = process.env.REACT_APP_API_URL || process.env.REACT_APP_BACKEND_URL;
const FALLBACK_URL = "https://merchantpro.cloudora.live";
const FRONTEND_URL = process.env.REACT_APP_FRONTEND_URL

// Remove trailing slashes to prevent double slash errors (e.g. //api)
export const API_BASE_URL = (ENV_URL || FALLBACK_URL).replace(/\/$/, "");
export const FRONTEND_BASE_URL = FRONTEND_URL ? FRONTEND_URL.replace(/\/$/, "") : window.location.origin;

console.log("🚀 API Base URL configured as:", API_BASE_URL);
console.log("🚀 Frontend Base URL configured as:", FRONTEND_BASE_URL);

// Payment Status Constants
export const STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  ERROR: 'error'
};

// API Endpoints
// IMPORTANT: Notice I removed the hardcoded '/api' strings here 
// because we will construct them safely, OR ensure your backend expects /api/api if base has it.
// Standard practice: Base URL = host:5000, Endpoints start with /api
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    SIGNUP: '/api/auth/signup',
    VERIFY: '/api/auth/verify-token'
  },
  MPESA: {
    CUSTOMER_PAYMENT: '/api/daraja/customer-payment',
    MERCHANT_PAYMENT: '/api/daraja/stk-push',
    STK_PUSH: '/api/daraja/stk-push',
    CALLBACK: '/api/daraja/stk-callback',
    GENERATE_QR: '/api/daraja/generate-qr'
  },
  TRANSACTIONS: {
    LIST: '/api/transactions',
    ANALYTICS: '/api/transactions/analytics', // This is the one we fixed!
    GET_BY_ID: '/api/transactions/:id',
    QR_INSIGHTS: '/api/transactions/qr-insights'
  },
  HEALTH: {
    CHECK: '/api/daraja/health-check',
    TEST_TOKEN: '/api/daraja/test-token'
  }
};

// M-Pesa Configuration
export const MPESA_CONFIG = {
  TEST_PHONE: '254708374149',
  SANDBOX_SHORTCODE: '174379',
  PRODUCTION_BASE_URL: 'https://api.safaricom.co.ke',
  SANDBOX_BASE_URL: 'https://sandbox.safaricom.co.ke'
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  TIMEOUT_ERROR: 'Request timeout. Please try again.',
  INVALID_PHONE: 'Please enter a valid phone number in format 254XXXXXXXXX',
  INVALID_AMOUNT: 'Please enter a valid amount greater than 0',
  INVALID_QR: 'Invalid QR code format. Please scan a valid payment QR code.',
  QR_SCAN_FAILED: 'Failed to scan QR code. Please try again.',
  PAYMENT_FAILED: 'Payment initiation failed. Please try again.',
  AUTH_REQUIRED: 'Authentication required. Please login.',
  MERCHANT_NOT_FOUND: 'Merchant not found. Please register first.',
  SANDBOX_PHONE_ONLY: 'Sandbox only works with test number 254708374149'
};

// UI Configuration
export const UI_CONFIG = {
  POLLING_INTERVAL: 5000, 
  MAX_POLL_ATTEMPTS: 12,  
  PAYMENT_TIMEOUT: 60000, 
};

// User Roles
export const USER_ROLES = {
  CUSTOMER: 'customer',
  MERCHANT: 'merchant'
};

// Drop this in your frontend (e.g., inside utility/constants.js or your component)
export const formatUIDate = (isoString) => {
  if (!isoString) return 'N/A';
  
  // Since the backend sent a clean ISO string, we just pass it straight to Date()
  return new Date(isoString).toLocaleString('en-KE', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};