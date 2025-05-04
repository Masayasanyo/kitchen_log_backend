import express from "express";
import dotenv from "dotenv";
import authenticateToken from "../middlewares/authMiddleware.js";
import { pool } from "../index.js";
import express from 'express';
import { decode } from "base64-arraybuffer";
import multer from 'multer';

dotenv.config();

const router = express.Router();


// Send user's recipes
router.get("/", authenticateToken, async (req, res) => {
	const accountId = req.user.id;

	try {
		const result = await pool.query(
			"SELECT * FROM recipes WHERE account_id = $1;",
			[accountId],
		);
		return res.status(200).json({ message: "Recipes retrieved successfully.", data: result.rows });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: "Internal server error." });
	}
});


// Send all public recipes
router.get("/public", authenticateToken, async (req, res) => {
	try {
		const result = await pool.query(
			"SELECT * FROM recipes ORDER BY created_at DESC;",
		);
		return res.status(200).json({ message: "Recipes retrieved successfully.", data: result.rows });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: "Internal server error." });
	}
});


// Send latest recipes
router.get("/latest", authenticateToken, async (req, res) => {
	const accountId = req.user.id;

	try {
		const result = await pool.query(
			"SELECT * FROM recipes WHERE account_id = $1 ORDER BY created_at DESC LIMIT 6;",
			[accountId],
		);
		return res.status(200).json({ message: "Latest recipes retrieved successfully.", data: result.rows });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: "Internal server error." });
	}
});


// send a specific recipe data
router.post("/recipe", authenticateToken, async (req, res) => {
	const { recipeId } = req.body;

	if (!recipeId) {
		return res.status(400).json({ error: "Recipe id is required." });
	}

	let recipeData = [];
	let tagData = [];
	let ingData = [];
	let stepData = [];

	try {
		const result = await pool.query(
			`SELECT * FROM recipes WHERE id = $1;`,
			[recipeId],
		);

		if (result.rows.length < 1) {
			return res.status(200).json({ message: "Recipe not found." });
		}
		recipeData = result.rows;
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: "Internal server error." });
	}

	try {
		const result = await pool.query(
			`SELECT * FROM tags WHERE recipe_id = $1;`,
			[recipeId],
		);
		tagData = result.rows;
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: "Internal server error." });
	}

	try {
		const result = await pool.query(
			`SELECT * FROM ings WHERE recipe_id = $1;`,
			[recipeId],
		);
		ingData = result.rows;
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: "Internal server error." });
	}

	try {
		const result = await pool.query(
			`SELECT * FROM steps WHERE recipe_id = $1;`,
			[recipeId],
		);
		stepData = result.rows;
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: "Internal server error." });
	}

	return res.status(200).json({
		message: "Recipe data retrieved successfully.",
		recipeData: recipeData,
		tagData: tagData,
		ingData: ingData,
		stepData: stepData,
	});
});


// send a specific recipe for edit
router.post("/admin", authenticateToken, async (req, res) => {
	const accountId = req.user.id;
	const { recipeId } = req.body;

	if (!recipeId) {
		return res.status(400).json({ error: "Recipe id is required." });
	}

	let recipeData = [];
	let tagData = [];
	let ingData = [];
	let stepData = [];

	try {
		const result = await pool.query(
			`SELECT * FROM recipes WHERE id = $1 and account_id = $2;`,
			[recipeId, accountId],
		);

		if (result.rows.length < 1) {
			return res.status(200).json({ message: "Recipe not found." });
		}
		recipeData = result.rows;
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: "Internal server error." });
	}

	try {
		const result = await pool.query(
			`SELECT * FROM tags WHERE recipe_id = $1;`,
			[recipeId],
		);
		tagData = result.rows;
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: "Internal server error." });
	}

	try {
		const result = await pool.query(
			`SELECT * FROM ings WHERE recipe_id = $1;`,
			[recipeId],
		);
		ingData = result.rows;
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: "Internal server error." });
	}

	try {
		const result = await pool.query(
			`SELECT * FROM steps WHERE recipe_id = $1;`,
			[recipeId],
		);
		stepData = result.rows;
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: "Internal server error." });
	}

	return res.status(200).json({
		message: "Recipe data retrieved successfully.",
		recipeData: recipeData,
		tagData: tagData,
		ingData: ingData,
		stepData: stepData,
	});
});


// Upload new recipes 
router.post('/upload', authenticateToken, async (req, res) => {
    const { imgUrl, title, memo, tag, ing, step } = req.body;
  
    if (!title) {
    	return res.status(400).json({ error: "Recipe title is required." });
    }

    const accountId = req.user.id;

    try {
        const result = await pool.query(
            `INSERT INTO 
                recipes (account_id, image_url, title, memo) 
            VALUES 
                ($1, $2, $3, $4) 
            RETURNING
                *`,
            [accountId, imgUrl, title, memo]
        );

        const recipeId = result.rows[0].id;

        if (tag.length > 0) {
            await Promise.all(tag.map(async (t) => {
                await pool.query(
                    `INSERT INTO 
                        tags (recipe_id, name) 
                    VALUES 
                        ($1, $2)`,
                    [recipeId, t.name]
                );
            }));
        }
        if (ing.length > 0) {
            await Promise.all(ing.map(async (i) => {
                await pool.query(
                    `INSERT INTO 
                        ings (recipe_id, name, amount) 
                    VALUES 
                        ($1, $2, $3)`,
                    [recipeId, i.name, i.amount]
                );
            }));
        }
        if (step.length > 0) {
            await Promise.all(step.map(async (s) => {
                await pool.query(
                    `INSERT INTO 
                        steps (recipe_id, name) 
                    VALUES 
                        ($1, $2)`,
                    [recipeId, s.name]
                );
            }));
         }

        return res.status(201).json({ message: "Recipe uploaded successfully."});
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error." });
    }
});


// Upload recipe images
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/upload/images', authenticateToken, upload.single('file'), async function (req, res) {
    // try {
    //     const file = req.file;

    //     if (!file) {
    //         return res.status(400).json({ message: "No file uploaded." });
    //     }

    //     const fileBase64 = decode(file.buffer.toString("base64"));
    //     const uniqueSuffix = Math.random().toString(26).substring(4, 10);
    //     const fileName = `${Date.now()}-${uniqueSuffix}-${file.originalname}`;

    //     const { data, error } = await supabase.storage
    //         .from("recipes")
    //         .upload(fileName, fileBase64);

    //     if (error) {
    //         console.error(error);
    //         return res.status(500).json({ error: "Internal server error." });
    //     }

    //     const { data: image } = supabase.storage
    //         .from("recipes")
    //         .getPublicUrl(data.path);

    //     return res.status(200).json({ message: "Recipe image uploaded successfully.", url: image.publicUrl });
    // } catch (error) {
    //     console.error(error);
    //     return res.status(500).json({ error: "Internal server error." });
    // }
});


// Update a recipe 
router.post('/update', authenticateToken, async (req, res) => {
    const { recipeId, imgUrl, title, memo } = req.body;
    const tag = req.body.tag || [];
    const ing = req.body.ing || [];
    const step = req.body.step || [];

  
    if (!title) {
    	return res.status(400).json({ error: "Recipt title is required." });
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

        return res.status(201).json({ message: "Recipe editted successfully."});
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        return res.status(500).json({ error: "Internal server error." });
    } finally {
        client.release();
    }
});


// Search recipes
router.post("/search", authenticateToken, async (req, res) => {
	const { keyword } = req.body;

	if (!keyword) {
		return res.status(400).json({ error: "Keyword is required." });
	}

	try {
		const result = await pool.query(
			`SELECT * FROM recipes WHERE title ILIKE $1;`,
			[`%${keyword}%`],
		);

		if (result.rows.length < 1) {
			return res.status(200).json({ message: "Recipes not found.", data: [] });
		}
		return res.status(200).json({ message: "Recipes retrieved successfully.", data: result.rows });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: "Internal server error.", data: [] });
	}
});


// delete recipes
router.delete('/', authenticateToken, async (req, res) => {
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

        return res.status(200).json({ message: "Recipe deleted successfully."});
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        return res.status(500).json({ error: "Internal server error." });
    } finally {
        client.release();
    }
});


// delete recipe images
router.delete('/image', authenticateToken, async (req, res) => {
    // const { previousUrl } = req.body;
  
    // if (!previousUrl) {
    // 	return res.status(400).json({ error: "Url is required." });
    // }

    // let splittedUrl = recipeUrl.split('/');
    // let previousFileName = splittedUrl[splittedUrl.length - 1];

    // const { data, error } = await supabase
    //     .storage
    //     .from('recipes')
    //     .remove([previousFileName]);

    // if (error) {
    //     console.error(error);
    //     return res.status(500).json({ error: "Internal server error." });
    // }

    // return res.status(200).json({ message: "File delete successful."});
});

export default router;
