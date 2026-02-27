import { db } from "../config/firebase.js";

export const getFlashSaleConfig = async (req, res) => {
  try {
    const doc = await db.collection("system_configs").doc("marketing").get();
    
    if (!doc.exists) {
      return res.status(404).json({ status: "error", message: "Config not found" });
    }

    const { flashSale } = doc.data();

    // Verification: If the current time is past expiresAt, tell the frontend it's inactive
    const isExpired = new Date() > new Date(flashSale.expiresAt);
    
    res.status(200).json({
      status: "success",
      config: {
        ...flashSale,
        isActive: flashSale.isActive && !isExpired // Final safety check
      }
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};