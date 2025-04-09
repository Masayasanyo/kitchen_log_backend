import express from "express";
import dotenv from "dotenv";
import authenticateToken from "../middlewares/authMiddleware.js";
import { pool } from "../index.js";

dotenv.config();

const router = express.Router();

// Send all users stock
router.get("/", authenticateToken, async (req, res) => {
  const accountId = req.user.id;

  try {
    const result = await pool.query(
      "SELECT * FROM stock WHERE account_id = $1 ORDER BY expiration_date ASC;",
      [accountId],
    );
    return res.status(200).json({ message: "Stock retrieved successfully.", data: result.rows });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// Send stock almost dead
router.get("/expiration", authenticateToken, async (req, res) => {
    const accountId = req.user.id;
  
    try {
      const result = await pool.query(
        "SELECT * FROM stock WHERE account_id = $1 ORDER BY expiration_date ASC LIMIT 6;",
        [accountId],
      );
      return res.status(200).json({ message: "Stock retrieved successfully.", data: result.rows });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error." });
    }
  });

// send specific stock data
router.post("/", authenticateToken, async (req, res) => {
    const { stockId } = req.body;
  
    if (!stockId) {
      return res.status(400).json({ error: "Stock id is required." });
    }
  
    try {
      const result = await pool.query(
        `SELECT * FROM stock WHERE id = $1;`,
        [stockId],
      );
      if (result.rows.length < 1) {
        return res.status(200).json({ message: "Stock not found." });
      }
      return res.status(200).json({ message: "Recipe data retrieved successfully.", data: result.rows });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error." });
    }
});

export default router;
