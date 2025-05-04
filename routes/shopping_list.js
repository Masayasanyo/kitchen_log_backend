import express from "express";
import dotenv from "dotenv";
import authenticateToken from "../middlewares/authMiddleware.js";
import { pool } from "../index.js";

dotenv.config();

const router = express.Router();

// Send all tasks undone
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
			AND 
				progress = false 
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
router.get("/latest", authenticateToken, async (req, res) => {
	const accountId = req.user.id;

	try {
		const result = await pool.query(
			`SELECT 
				* 
			FROM 
				shopping_list 
			WHERE 
				account_id = $1 
			AND 
				progress = false 
			ORDER BY 
				created_at ASC 
			LIMIT 
				10;
			`,
			[accountId],
		);
		return res.status(200).json({ message: "Shopping list retrieved successfully.", data: result.rows });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: "Internal server error." });
	}
});


// make tasks done
router.post("/done", authenticateToken, async (req, res) => {
	const { taskId } = req.body;

	try {
		await pool.query(
			`UPDATE 
				shopping_list 
			SET 
				progress = true 
			WHERE 
				id = $1;
			`,
			[taskId],
		);
		return res.status(200).json({ message: "Shopping list updated successfully." });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: "Internal server error." });
	}
});


// Upload new tasks
router.post('/task', authenticateToken, async (req, res) => {
    const { task } = req.body;

    if (!task) {
    	return res.status(400).json({ error: "Task name is required." });
    }

    const accountId = req.user.id;

    try {
        const result = await pool.query(
            `INSERT INTO 
                shopping_list (account_id, name) 
            VALUES 
                ($1, $2) 
            RETURNING
                *`,
            [accountId, task]
        );

        return res.status(201).json({ message: "Task uploaded successfully.", data: result.rows});
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error." });
    }
});


export default router;