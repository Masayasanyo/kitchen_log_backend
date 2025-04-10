import express from "express";
import dotenv from "dotenv";
import authenticateToken from "../middlewares/authMiddleware.js";
import { pool } from "../index.js";

dotenv.config();

const router = express.Router();

// Send all users set meals
router.get("/", authenticateToken, async (req, res) => {
  const accountId = req.user.id;

  try {
    const result = await pool.query(
      "SELECT * FROM set_meals WHERE account_id = $1;",
      [accountId],
    );

    let setMealList = [];
    setMealList = result.rows;

    if (setMealList.length < 1) {
      return res.status(200).json({ message: "Set meals not found." });
    }

    for (let i = 0; i < setMealList.length; i++) {
      let tagList = [];
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
      let recipeList = [];
      try {
        const result = await pool.query(
          `
            SELECT
              r.id,
              r.title,
              r.image_url 
            FROM set_recipe sr
            JOIN recipes r ON sr.recipe_id = r.id
            WHERE sr.set_meal_id = $1;
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
          FROM set_recipe sr
          JOIN recipes r ON sr.recipe_id = r.id
          WHERE sr.set_meal_id = $1;
        `,
        [setMealData.id],
      );
      recipeList = result.rows;
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error." });
    }

    return res.status(200).json({ message: "Set meal retrieved successfully.", setMealData: setMealData, tag: tagList, recipe: recipeList });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// send specific set meal for edit
router.post("/", authenticateToken, async (req, res) => {
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
          FROM set_recipe sr
          JOIN recipes r ON sr.recipe_id = r.id
          WHERE sr.set_meal_id = $1;
        `,
        [setMealData.id],
      );
      recipeList = result.rows;
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error." });
    }

    return res.status(200).json({ message: "Set meal retrieved successfully.", setMealData: setMealData, tag: tagList, recipe: recipeList });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

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
      return res.status(200).json({ message: "Set meal not found.", data: [] });
    }
    return res.status(200).json({ message: "Set meals retrieved successfully.", data: result.rows });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error.", data: [] });
  }
});

export default router;
