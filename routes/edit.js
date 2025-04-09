import express from 'express';
import dotenv from 'dotenv';
import path from "path";
import multer from 'multer';
import fs from 'fs';
import authenticateToken from '../middlewares/authMiddleware.js';
import { pool } from "../index.js";

dotenv.config();

const router = express.Router();

// Edit a recipe 
router.post('/recipe', authenticateToken, async (req, res) => {
    const { recipeId, imgUrl, title, memo } = req.body;
    const tag = req.body.tag || [];
    const ing = req.body.ing || [];
    const step = req.body.step || [];

  
    if (!title) {
      return res.status(400).json({ error: "Title is required." });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        await client.query(
            `UPDATE 
                recipes 
            SET 
                image_url = $1, 
                title = $2,
                memo = $3  
            WHERE 
                id = $4 
            `,
            [imgUrl, title, memo, recipeId]
        );

        await client.query(
            `DELETE FROM 
                tags 
            WHERE 
                recipe_id = $1 
            `,
            [recipeId]
        );
        for (const t of tag) {
            await client.query(
                `INSERT INTO 
                    tags (recipe_id, name) 
                VALUES 
                    ($1, $2)`,
                [recipeId, t.name]
            );
        }


        await client.query(
            `DELETE FROM 
                ings 
            WHERE 
                recipe_id = $1 
            `,
            [recipeId]
        );
        for (const i of ing) {
            await client.query(
                `INSERT INTO 
                    ings (recipe_id, name, amount) 
                VALUES 
                    ($1, $2, $3)`,
                [recipeId, i.name, i.amount]
            );
        }

        await client.query(
            `DELETE FROM 
                steps 
            WHERE 
                recipe_id = $1 
            `,
            [recipeId]
        );
        for (const s of step) {
            await client.query(
               `INSERT INTO 
                    steps (recipe_id, name) 
                VALUES 
                    ($1, $2)`,
                [recipeId, s.name]
            );
        }

        await client.query('COMMIT');

        return res.status(201).json({ message: "Recipe edit successful."});
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        return res.status(500).json({ error: "Internal server error." });
    } finally {
        client.release();
    }
});

// Edit a set meal 
router.post('/set_meal', authenticateToken, async (req, res) => {
    const { setMealId, title } = req.body;
    const tag = req.body.tag || [];
    const recipeId = req.body.recipeId || [];
    const accountId = req.user.id;
  
    if (!title) {
      return res.status(400).json({ error: "Set meal id and title are required." });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        await client.query(
            `UPDATE 
                set_meals 
            SET 
                title = $1 
            WHERE 
                id = $2 
            `,
            [title, setMealId]
        );

        await client.query(
            `DELETE FROM 
                set_meal_tags 
            WHERE 
                set_meal_id = $1 
            `,
            [setMealId]
        );
        for (const t of tag) {
            await client.query(
                `INSERT INTO 
                    set_meal_tags (set_meal_id, name) 
                VALUES 
                    ($1, $2)`,
                [setMealId, t.name]
            );
        }


        await client.query(
            `DELETE FROM 
                set_recipe 
            WHERE 
                set_meal_id = $1 
            `,
            [setMealId]
        );
        for (const r of recipeId) {
            await client.query(
                `INSERT INTO 
                    set_recipe (account_id, recipe_id, set_meal_id) 
                VALUES 
                    ($1, $2, $3)`,
                [accountId, r.id, setMealId]
            );
        }

        await client.query('COMMIT');

        return res.status(201).json({ message: "Set meal edit successful."});
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        return res.status(500).json({ error: "Internal server error." });
    } finally {
        client.release();
    }
});

// Edit a stock 
router.post('/stock', authenticateToken, async (req, res) => {
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

        return res.status(201).json({ message: "Stock edit successful.", data: result.rows });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error." });
    }
});


// edit a recipe image data
const recipeImgStorage = multer.diskStorage({
    destination: "./storage/recipe_images",
    filename: (req, file, cb) => {
        const newFileName = Date.now() + path.extname(file.originalname);
        cb(null, newFileName);    },
});

const recipeImageUpload = multer({ storage: recipeImgStorage });

router.post("/file", authenticateToken, recipeImageUpload.single("file"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "File not found" });
    }
    else {
        try {
            return res.status(201).json({ message: 'Edit a file successful', url: `/storage/recipe_images/${req.file.filename}` }); 
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal server error." });
        }   
    }
});

router.delete('/file', authenticateToken, async (req, res) => {
    const { previousUrl } = req.body;
  
    if (!previousUrl) {
      return res.status(400).json({ error: "Url is required." });
    }

    try {
        const filePath = path.join(process.env.BACKEND_PATH, previousUrl);
        fs.unlinkSync(filePath); 

        return res.status(200).json({ message: "File delete successful."});
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error." });
    }
});


export default router;