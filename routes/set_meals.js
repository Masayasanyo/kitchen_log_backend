import express from "express";
import dotenv from "dotenv";
import authenticateToken from "../middlewares/authMiddleware.js";
import { pool } from "../index.js";

dotenv.config();

const router = express.Router();


// Send all set meals
router.get("/", authenticateToken, async (req, res) => {
	const accountId = req.user.id;
	let setMealList = [];
	let tagList = [];
	let recipeList = [];

	try {
		const result = await pool.query(
			"SELECT * FROM set_meals WHERE account_id = $1;",
			[accountId],
		);
		setMealList = result.rows;
		if (setMealList.length < 1) {
			return res.status(200).json({ message: "Set meals not found." });
		}

		for (let i = 0; i < setMealList.length; i++) {
			try {
				const result = await pool.query(
					`SELECT * FROM set_meal_tags WHERE set_meal_id = $1;`,
					[setMealList[i].id],
				);
				tagList = result.rows;
				setMealList[i].tag = tagList;
			} catch (error) {
				console.error(error);
				return res.status(500).json({ error: "Internal server error." });
			}
		}

		for (let i = 0; i < setMealList.length; i++) {
			try {
				const result = await pool.query(
					`
					SELECT
						r.id,
						r.title,
						r.image_url 
					FROM 
						set_recipe sr
					JOIN 
						recipes r ON sr.recipe_id = r.id
					WHERE 
						sr.set_meal_id = $1;
					`,
					[setMealList[i].id],
				);
				recipeList = result.rows;
				setMealList[i].recipe = recipeList;
			} catch (error) {
				console.error(error);
				return res.status(500).json({ error: "Internal server error." });
			}
		}
		return res.status(200).json({ message: "Set meals retrieved successfully.", data: setMealList });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: "Internal server error." });
	}
});


// send specific set meal 
router.post("/", authenticateToken, async (req, res) => {
	const { setMealId } = req.body;

	if (!setMealId) {
		return res.status(400).json({ error: "Set meal id is required." });
	}

	let setMealData = [];
	let tagList = [];
	let recipeList = [];

	try {
		const result = await pool.query(
			"SELECT * FROM set_meals WHERE id = $1;",
			[setMealId],
		);

		setMealData = result.rows[0];

		if (result.rows.length < 1) {
			return res.status(200).json({ message: "Set meal not found." });
		}

		try {
			const result = await pool.query(
				`SELECT * FROM set_meal_tags WHERE set_meal_id = $1;`,
				[setMealData.id],
			);
			tagList = result.rows;
		} catch (error) {
			console.error(error);
			return res.status(500).json({ error: "Internal server error." });
		}

		try {
			const result = await pool.query(
				`
				SELECT
					r.id,
					r.title,
					r.image_url 
				FROM 
					set_recipe sr
				JOIN 
					recipes r ON sr.recipe_id = r.id
				WHERE 
					sr.set_meal_id = $1;
				`,
				[setMealData.id],
			);
			recipeList = result.rows;
		} catch (error) {
			console.error(error);
			return res.status(500).json({ error: "Internal server error." });
		}

		return res.status(200).json({ 
			message: "Set meal retrieved successfully.", 
			setMealData: setMealData, 
			tag: tagList, 
			recipe: recipeList 
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: "Internal server error." });
	}
});


// send specific set meal for edit
router.post("/admin", authenticateToken, async (req, res) => {
	const accountId = req.user.id;
	const { setMealId } = req.body;

	if (!setMealId) {
		return res.status(400).json({ error: "Set meal id is required." });
	}

	let setMealData = [];
	let tagList = [];
	let recipeList = [];

	try {
		const result = await pool.query(
			"SELECT * FROM set_meals WHERE id = $1 and account_id = $2;",
			[setMealId, accountId],
		);

		setMealData = result.rows[0];

		if (result.rows.length < 1) {
			return res.status(200).json({ message: "Set meal not found." });
		}

		try {
			const result = await pool.query(
				`SELECT * FROM set_meal_tags WHERE set_meal_id = $1;`,
				[setMealData.id],
			);
			tagList = result.rows;
		} catch (error) {
			console.error(error);
			return res.status(500).json({ error: "Internal server error." });
		}

		try {
			const result = await pool.query(
				`
				SELECT
					r.id,
					r.title,
					r.image_url 
				FROM 
					set_recipe sr
				JOIN 
					recipes r ON sr.recipe_id = r.id
				WHERE 
					sr.set_meal_id = $1;
				`,
				[setMealData.id],
			);
			recipeList = result.rows;
		} catch (error) {
			console.error(error);
			return res.status(500).json({ error: "Internal server error." });
		}

		return res.status(200).json({ 
			message: "Set meal retrieved successfully.", 
			setMealData: setMealData, 
			tag: tagList, 
			recipe: recipeList 
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: "Internal server error." });
	}
});


// Upload new set meals 
router.post('/upload', authenticateToken, async (req, res) => {
    const { title, tag, recipeId } = req.body;
  
    if (!title) {
    	return res.status(400).json({ error: "Set meal title is required." });
    }

    const accountId = req.user.id;

    try {
        const result = await pool.query(
            `INSERT INTO 
                set_meals (account_id, title) 
            VALUES 
                ($1, $2) 
            RETURNING
                *`,
            [accountId, title]
        );

        const setMealId = result.rows[0].id;

        if (tag.length > 0) {
            await Promise.all(tag.map(async (t) => {
                await pool.query(
                    `INSERT INTO 
                        set_meal_tags (set_meal_id, name) 
                    VALUES 
                        ($1, $2)`,
                    [setMealId, t.name]
                );
            }));
        }

        if (recipeId.length > 0) {
            await Promise.all(recipeId.map(async (r) => {
                await pool.query(
                    `INSERT INTO 
                        set_recipe (account_id, set_meal_id, recipe_id) 
                    VALUES 
                        ($1, $2, $3)
                    ON CONFLICT (set_meal_id, recipe_id) DO NOTHING;
                    `,
                    [accountId, setMealId, r.id]
                );
            }));
        }

        return res.status(201).json({ message: "Set meal uploaded successfully."});
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error." });
    }
});



// Update set meals 
router.post('/update', authenticateToken, async (req, res) => {
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

        return res.status(201).json({ message: "Set meal updated successfully."});
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        return res.status(500).json({ error: "Internal server error." });
    } finally {
        client.release();
    }
});


// Delete set meals 
router.delete('/', authenticateToken, async (req, res) => {
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

        return res.status(200).json({ message: "Set meal deleted successfully."});
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
			`SELECT * FROM set_meals WHERE title ILIKE $1;`,
			[`%${keyword}%`],
		);

		if (result.rows.length < 1) {
			return res.status(200).json({ message: "Set meals not found.", data: [] });
		}
		return res.status(200).json({ message: "Set meals retrieved successfully.", data: result.rows });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: "Internal server error.", data: [] });
	}
});

export default router;
