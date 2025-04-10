import express from "express";
import dotenv from "dotenv";
import authenticateToken from "../middlewares/authMiddleware.js";
import { pool } from "../index.js";

dotenv.config();

const router = express.Router();

// Send all users tasks undone
router.get("/", authenticateToken, async (req, res) => {
  const accountId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT 
        * 
      FROM 
        shopping_list 
      WHERE 
        account_id = $1 
        AND progress = false 
      ORDER BY 
        created_at ASC;
      `,
      [accountId],
    );
    return res.status(200).json({ message: "Shopping list retrieved successfully.", data: result.rows });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// Send top ten tasks undone
router.get("/topten", authenticateToken, async (req, res) => {
  const accountId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT 
        * 
      FROM 
        shopping_list 
      WHERE 
        account_id = $1 
        AND progress = false 
      ORDER BY 
        created_at ASC 
      LIMIT 10;
      `,
      [accountId],
    );
    return res.status(200).json({ message: "Shopping list retrieved successfully.", data: result.rows });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// make task done
router.post("/done", authenticateToken, async (req, res) => {
  const { taskId } = req.body;

  try {
    await pool.query(
      `UPDATE 
        shopping_list 
      SET 
        progress = true 
      WHERE 
        id = $1
      ;`,
      [taskId],
    );
    return res.status(200).json({ message: "Update shoppinglist successfully." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
