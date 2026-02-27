import express from "express";
import { getFlashSaleConfig } from "../controllers/marketing.js";

const router = express.Router();

// GET /api/system/marketing-config
router.get("/marketing-config", getFlashSaleConfig);

export default router;