import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';
import path from "path";
import { fileURLToPath } from 'url';
import accountsRoutes from "./routes/accounts.js";
import uploadRoutes from "./routes/upload.js";
import recipesRoutes from "./routes/recipes.js";
import setMealsRoutes from "./routes/set_meals.js";
import editRoutes from "./routes/edit.js";
import stockRoutes from "./routes/stock.js";
import shoppingListRoutes from "./routes/shopping_list.js";

dotenv.config();

const app = express();
app.use(express.json()); 
app.use(cors());
app.use("/accounts", accountsRoutes);
app.use("/upload", uploadRoutes);
app.use("/recipes", recipesRoutes);
app.use("/set_meals", setMealsRoutes);
app.use("/edit", editRoutes);
app.use("/stock", stockRoutes);
app.use("/shopping_list", shoppingListRoutes);

const { Pool } = pkg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, 
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RECIPE_IMAGE_DIR = path.join(__dirname, '/storage/recipe_images');
app.use('/storage/recipe_images', express.static(RECIPE_IMAGE_DIR));

export { pool };

const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`)
})
