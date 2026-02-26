import express from "express";
import { verifyToken } from "../middlewares/auth.js";
import { 
  createTransaction, 
  getTransactions, 
  getTransactionById, 
  getTransactionAnalytics,
  debugTransactions,
  getAllTransactionsGlobal,
  getMerchantAllTransactions,
  updateTransactionStatus, // Included for compatibility
  getQRTransactionInsights // Included for compatibility
} from "../controllers/transactions.js";

const router = express.Router();

// --- 1. Public / Global Endpoints ---
router.get('/all-transactions', getAllTransactionsGlobal);

// --- 2. Merchant Write Operations ---
router.post("/", verifyToken, createTransaction);
router.patch("/:transactionId/status", verifyToken, updateTransactionStatus);

// --- 3. Optimized Data Endpoints (Must be above /:transactionId) ---
// This is the heavy-lifter that uses the new Aggregation logic to save on READ costs
router.get("/analytics", verifyToken, getTransactionAnalytics);

// This is for the full ledger view
router.get("/all", verifyToken, getMerchantAllTransactions);

// Insights for QR specific adoption
router.get("/qr-insights", verifyToken, getQRTransactionInsights);

// Technical troubleshooting
router.get("/debug", verifyToken, debugTransactions);

// --- 4. Search / List Endpoints ---
router.get("/", verifyToken, getTransactions);

// --- 5. Parameterized Endpoints (Must be at the bottom) ---
router.get("/:transactionId", verifyToken, getTransactionById);

// Note: Removed the duplicate /:id to prevent route collision. 
// Standardized on /:transactionId to match your controller logic.

export default router;