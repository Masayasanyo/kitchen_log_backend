import express from "express";
import dotenv from "dotenv";
import authenticateToken from "../middlewares/authMiddleware.js";
import { pool } from "../index.js";

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

// Send all user's recipes
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

// Send all users recipes
router.get("/latest", authenticateToken, async (req, res) => {
  const accountId = req.user.id;

  try {
    const result = await pool.query(
      "SELECT * FROM recipes WHERE account_id = $1 ORDER BY created_at DESC LIMIT 6;",
      [accountId],
    );
    return res.status(200).json({ message: "Recipes retrieved successfully.", data: result.rows });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// send a specific recipe
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
router.post("/recipe/admin", authenticateToken, async (req, res) => {
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
      return res.status(200).json({ message: "Recipe not found.", data: [] });
    }
    return res.status(200).json({ message: "Recipes retrieved successfully.", data: result.rows });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error.", data: [] });
  }
});

export default router;
