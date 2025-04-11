import express from 'express';
import dotenv from 'dotenv';
import { supabase } from "../index.js";
import authenticateToken from '../middlewares/authMiddleware.js';
import { pool } from "../index.js";

dotenv.config();

const router = express.Router();

// delete a recipe 
router.post('/recipe', authenticateToken, async (req, res) => {
    const { recipeId } = req.body;
    const accountId = req.user.id;

    if (!recipeId) {
      return res.status(400).json({ error: "Recipe id is required." });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        await client.query(
            `DELETE FROM 
                recipes 
            WHERE 
                id = $1 and account_id = $2 
            `,
            [recipeId, accountId]
        );

        await client.query(
            `DELETE FROM 
                tags 
            WHERE 
                recipe_id = $1 
            `,
            [recipeId]
        );

        await client.query(
            `DELETE FROM 
                ings 
            WHERE 
                recipe_id = $1 
            `,
            [recipeId]
        );

        await client.query(
            `DELETE FROM 
                steps 
            WHERE 
                recipe_id = $1 
            `,
            [recipeId]
        );

        await client.query('COMMIT');

        return res.status(200).json({ message: "Recipe delete successful."});
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        return res.status(500).json({ error: "Internal server error." });
    } finally {
        client.release();
    }
});

// delete a set meal 
router.post('/set_meal', authenticateToken, async (req, res) => {
    const { setMealId } = req.body;
    const accountId = req.user.id;
  
    if (!setMealId) {
      return res.status(400).json({ error: "Set meal id is required." });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        await client.query(
            `DELETE FROM 
                set_meals 
            WHERE 
                id = $1 and account_id = $2 
            `,
            [setMealId, accountId]
        );

        await client.query(
            `DELETE FROM 
                set_meal_tags 
            WHERE 
                set_meal_id = $1 
            `,
            [setMealId]
        );

        await client.query(
            `DELETE FROM 
                set_recipe 
            WHERE 
                set_meal_id = $1 
            `,
            [setMealId]
        );

        await client.query('COMMIT');

        return res.status(200).json({ message: "Set meal delete successful."});
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        return res.status(500).json({ error: "Internal server error." });
    } finally {
        client.release();
    }
});

// delete a stock 
router.post('/stock', authenticateToken, async (req, res) => {
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

        return res.status(200).json({ message: "Stock delete successful.", data: result.rows });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

router.delete('/file', authenticateToken, async (req, res) => {
    const { previousUrl } = req.body;
  
    if (!previousUrl) {
      return res.status(400).json({ error: "Url is required." });
    }

    let splittedUrl = recipeUrl.split('/');
    let previousFileName = splittedUrl[splittedUrl.length - 1];

    const { data, error } = await supabase
        .storage
        .from('recipes')
        .remove([previousFileName]);

    if (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error." });
    }

    return res.status(200).json({ message: "File delete successful."});
});


export default router;