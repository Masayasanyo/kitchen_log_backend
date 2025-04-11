import express from 'express';
import dotenv from 'dotenv';
import { supabase } from "../index.js";
import { decode } from "base64-arraybuffer";
import multer from 'multer';
import authenticateToken from '../middlewares/authMiddleware.js';
import { pool } from "../index.js";

dotenv.config();

const router = express.Router();

// Add a new recipe 
router.post('/recipe', authenticateToken, async (req, res) => {
    const { imgUrl, title, memo, tag, ing, step } = req.body;
  
    if (!title) {
      return res.status(400).json({ error: "Title is required." });
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

        return res.status(201).json({ message: "Recipe upload successful."});
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

// Add a new set meal 
router.post('/set_meal', authenticateToken, async (req, res) => {
    const { title, tag, recipeId } = req.body;
  
    if (!title) {
      return res.status(400).json({ error: "Title is required." });
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

        console.log(recipeId);

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

        return res.status(201).json({ message: "Set meal upload successful."});
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

// upload a new stock
router.post('/stock', authenticateToken, async (req, res) => {
    const { name, amount, expiration } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required." });
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

        return res.status(201).json({ message: "Stock upload successful.", data: result.rows});
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

// upload a new task
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

        return res.status(201).json({ message: "Task upload successful.", data: result.rows});
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/file', authenticateToken, upload.single('file'), async function (req, res) {
    try {
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: "No file uploaded." });
        }

        const fileBase64 = decode(file.buffer.toString("base64"));
        const uniqueSuffix = Math.random().toString(26).substring(4, 10);
        const fileName = `${Date.now()}-${uniqueSuffix}-${file.originalname}`;

        const { data, error } = await supabase.storage
            .from("recipes")
            .upload(fileName, fileBase64);

        if (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal server error." });
        }

        const { data: image } = supabase.storage
            .from("recipes")
            .getPublicUrl(data.path);

        return res.status(200).json({ message: "Upload a recipe image successful.", url: image.publicUrl });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

export default router;



// import express from 'express';
// import dotenv from 'dotenv';
// import path from "path";
// import multer from 'multer';
// import authenticateToken from '../middlewares/authMiddleware.js';
// import { pool } from "../index.js";

// dotenv.config();

// const router = express.Router();

// // Add a new recipe 
// router.post('/recipe', authenticateToken, async (req, res) => {
//     const { imgUrl, title, memo, tag, ing, step } = req.body;
  
//     if (!title) {
//       return res.status(400).json({ error: "Title is required." });
//     }

//     const accountId = req.user.id;

//     try {
//         const result = await pool.query(
//             `INSERT INTO 
//                 recipes (account_id, image_url, title, memo) 
//             VALUES 
//                 ($1, $2, $3, $4) 
//             RETURNING
//                 *`,
//             [accountId, imgUrl, title, memo]
//         );

//         const recipeId = result.rows[0].id;

//         if (tag.length > 0) {
//             await Promise.all(tag.map(async (t) => {
//                 await pool.query(
//                     `INSERT INTO 
//                         tags (recipe_id, name) 
//                     VALUES 
//                         ($1, $2)`,
//                     [recipeId, t.name]
//                 );
//             }));
//         }
//         if (ing.length > 0) {
//             await Promise.all(ing.map(async (i) => {
//                 await pool.query(
//                     `INSERT INTO 
//                         ings (recipe_id, name, amount) 
//                     VALUES 
//                         ($1, $2, $3)`,
//                     [recipeId, i.name, i.amount]
//                 );
//             }));
//         }
//         if (step.length > 0) {
//             await Promise.all(step.map(async (s) => {
//                 await pool.query(
//                     `INSERT INTO 
//                         steps (recipe_id, name) 
//                     VALUES 
//                         ($1, $2)`,
//                     [recipeId, s.name]
//                 );
//             }));
//          }

//         return res.status(201).json({ message: "Recipe upload successful."});
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ error: "Internal server error." });
//     }
// });

// // Add a new set meal 
// router.post('/set_meal', authenticateToken, async (req, res) => {
//     const { title, tag, recipeId } = req.body;
  
//     if (!title) {
//       return res.status(400).json({ error: "Title is required." });
//     }

//     const accountId = req.user.id;

//     try {
//         const result = await pool.query(
//             `INSERT INTO 
//                 set_meals (account_id, title) 
//             VALUES 
//                 ($1, $2) 
//             RETURNING
//                 *`,
//             [accountId, title]
//         );

//         const setMealId = result.rows[0].id;

//         if (tag.length > 0) {
//             await Promise.all(tag.map(async (t) => {
//                 await pool.query(
//                     `INSERT INTO 
//                         set_meal_tags (set_meal_id, name) 
//                     VALUES 
//                         ($1, $2)`,
//                     [setMealId, t.name]
//                 );
//             }));
//         }

//         console.log(recipeId);

//         if (recipeId.length > 0) {
//             await Promise.all(recipeId.map(async (r) => {
//                 await pool.query(
//                     `INSERT INTO 
//                         set_recipe (account_id, set_meal_id, recipe_id) 
//                     VALUES 
//                         ($1, $2, $3)
//                     ON CONFLICT (set_meal_id, recipe_id) DO NOTHING;
//                     `,
//                     [accountId, setMealId, r.id]
//                 );
//             }));
//         }

//         return res.status(201).json({ message: "Set meal upload successful."});
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ error: "Internal server error." });
//     }
// });

// // upload a new stock
// router.post('/stock', authenticateToken, async (req, res) => {
//     const { name, amount, expiration } = req.body;

//     if (!name) {
//       return res.status(400).json({ error: "Name is required." });
//     }

//     const accountId = req.user.id;

//     try {
//         const result = await pool.query(
//             `INSERT INTO 
//                 stock (account_id, name, quantity, expiration_date) 
//             VALUES 
//                 ($1, $2, $3, $4) 
//             RETURNING
//                 *`,
//             [accountId, name, amount, expiration]
//         );

//         return res.status(201).json({ message: "Stock upload successful.", data: result.rows});
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ error: "Internal server error." });
//     }
// });

// // upload a new task
// router.post('/task', authenticateToken, async (req, res) => {
//     const { task } = req.body;

//     if (!task) {
//       return res.status(400).json({ error: "Task name is required." });
//     }

//     const accountId = req.user.id;

//     try {
//         const result = await pool.query(
//             `INSERT INTO 
//                 shopping_list (account_id, name) 
//             VALUES 
//                 ($1, $2) 
//             RETURNING
//                 *`,
//             [accountId, task]
//         );

//         return res.status(201).json({ message: "Task upload successful.", data: result.rows});
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ error: "Internal server error." });
//     }
// });

// // Upload a recipe image data
// const recipeImgStorage = multer.diskStorage({
//     destination: "./storage/recipe_images",
//     filename: (req, file, cb) => {
//         const newFileName = Date.now() + path.extname(file.originalname);
//         cb(null, newFileName);    },
// });

// const recipeImageUpload = multer({ storage: recipeImgStorage });

// router.post("/file", authenticateToken, recipeImageUpload.single("file"), (req, res) => {
//     if (!req.file) {
//         return res.status(400).json({ error: "File not found" });
//     }
//     else {
//         return res.status(201).json({ message: 'Upload a file successful', url: `/storage/recipe_images/${req.file.filename}` }); 
//     }
// });

// export default router;
