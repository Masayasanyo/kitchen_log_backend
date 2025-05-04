import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';
import path from "path";
import { fileURLToPath } from 'url';
import accountsRoutes from "./routes/accounts.js";
import recipesRoutes from "./routes/recipes.js";
import setMealsRoutes from "./routes/set_meals.js";
import stocksRoutes from "./routes/stocks.js";
import shoppingListRoutes from "./routes/shopping_list.js";
import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';

// (async function() {

//     // Configuration
//     cloudinary.config({ 
//         cloud_name: 'dwnlgvahj', 
//         api_key: '832823938726753', 
//         api_secret: '<your_api_secret>' // Click 'View API Keys' above to copy your API secret
//     });
    
//     // Upload an image
//      const uploadResult = await cloudinary.uploader
//        .upload(
//            'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg', {
//                public_id: 'shoes',
//            }
//        )
//        .catch((error) => {
//            console.log(error);
//        });
    
//     console.log(uploadResult);
    
//     // Optimize delivery by resizing and applying auto-format and auto-quality
//     const optimizeUrl = cloudinary.url('shoes', {
//         fetch_format: 'auto',
//         quality: 'auto'
//     });
    
//     console.log(optimizeUrl);
    
//     // Transform the image: auto-crop to square aspect_ratio
//     const autoCropUrl = cloudinary.url('shoes', {
//         crop: 'auto',
//         gravity: 'auto',
//         width: 500,
//         height: 500,
//     });
    
//     console.log(autoCropUrl);    
// })();

dotenv.config();

const app = express();
app.use(express.json()); 
app.use(cors());
app.use("/accounts", accountsRoutes);
app.use("/recipes", recipesRoutes);
app.use("/set_meals", setMealsRoutes);
app.use("/stocks", stocksRoutes);
app.use("/shopping_list", shoppingListRoutes);

const { Pool } = pkg;
const pool = new Pool({
	connectionString: process.env.DATABASE_URL, 
});

cloudinary.config({ 
	cloud_name: process.env.CLOUDINARY_API_NAME, 
	api_key: process.env.CLOUDINARY_API_KEY, 
	api_secret: process.env.CLOUDINARY_API_SECRET
});

// const supabaseUrl = process.env.SUPABASE_URL;
// const supabaseKey = process.env.SUPABASE_API_KEY;
// const supabase = createClient(supabaseUrl, supabaseKey);

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const RECIPE_IMAGE_DIR = path.join(__dirname, '/storage/recipe_images');
// app.use('/storage/recipe_images', express.static(RECIPE_IMAGE_DIR));

export { pool };
export { cloudinary };

const port = process.env.PORT;
app.listen(port, () => {
	console.log(`Server is listening on port ${port}`);
})
