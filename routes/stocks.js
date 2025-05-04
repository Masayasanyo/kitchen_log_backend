import express from "express";
import dotenv from "dotenv";
import authenticateToken from "../middlewares/authMiddleware.js";
import { pool } from "../index.js";

dotenv.config();

const router = express.Router();


// Send all stocks
router.get("/", authenticateToken, async (req, res) => {
	const accountId = req.user.id;

	try {
		const result = await pool.query(
			"SELECT * FROM stock WHERE account_id = $1 ORDER BY expiration_date ASC;",
			[accountId],
		);
		return res.status(200).json({ message: "Stocks retrieved successfully.", data: result.rows });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: "Internal server error." });
	}
});


// Send stocks almost dead
router.get("/expiration", authenticateToken, async (req, res) => {
    const accountId = req.user.id;
  
    try {
		const result = await pool.query(
			"SELECT * FROM stock WHERE account_id = $1 ORDER BY expiration_date ASC LIMIT 6;",
			[accountId],
		);
		return res.status(200).json({ message: "Stocks retrieved successfully.", data: result.rows });
    } catch (error) {
		console.error(error);
		return res.status(500).json({ error: "Internal server error." });
    }
});


// Send specific stocks data
router.post("/", authenticateToken, async (req, res) => {
    const { stockId } = req.body;
    const accountId = req.user.id;
  
    if (!stockId) {
    	return res.status(400).json({ error: "Stock id is required." });
    }
  
    try {
		const result = await pool.query(
			`SELECT * FROM stock WHERE id = $1 and account_id = $2;`,
			[stockId, accountId],
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


// upload new stocks
router.post('/upload', authenticateToken, async (req, res) => {
    const { name, amount, expiration } = req.body;

    if (!name) {
    	return res.status(400).json({ error: "Stock title is required." });
    }

    const accountId = req.user.id;

    try {
        const result = await pool.query(
            `INSERT INTO 
                stock (account_id, name, quantity, expiration_date) 
            VALUES 
                ($1, $2, $3, $4) 
            RETURNING
                *`,
            [accountId, name, amount, expiration]
        );

        return res.status(201).json({ message: "Stock uploaded successfully.", data: result.rows});
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error." });
    }
});


// Update stocks
router.post('/update', authenticateToken, async (req, res) => {
    const { stockId, name, quantity, expiration } = req.body;
  
    if (!stockId || !name) {
    	return res.status(400).json({ error: "Stock id and name are required." });
    }

    try {
        const result = await pool.query(
            `UPDATE 
                stock 
            SET 
                name = $1, 
                quantity = $2, 
                expiration_date = $3 
            WHERE 
                id = $4 
            `,
            [name, quantity, expiration, stockId], 
        );

        return res.status(200).json({ message: "Stock updated successfully.", data: result.rows });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error." });
    }
});


// Delete stocks
router.delete('/', authenticateToken, async (req, res) => {
    const { stockId } = req.body;
    const accountId = req.user.id;
  
    if (!stockId) {
    	return res.status(400).json({ error: "Stock id is required." });
    }

    try {
        const result = await pool.query(
            `DELETE FROM 
                stock 
            WHERE 
                id = $1 and account_id = $2 
            `,
            [stockId, accountId]
        );

        return res.status(200).json({ message: "Stock deleted successfully.", data: result.rows });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error." });
    }
});


export default router;