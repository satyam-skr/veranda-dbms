import express from "express";
import userRoute from './routes/users.route.js'
import userComplaintsRoute from './routes/complaints.route.js';
import foodItemsRoute from './routes/foodItems.route.js';
import menuRoute from './routes/menu.route.js';
import menuDaysRoute from './routes/menuDays.route.js';
import mealRatingRoute from './routes/mealRating.route.js';
import cors from 'cors';
import pool from "./db/db.js";
const app = express();

app.use(cors({
  origin:"*",
  methods:["GET,POST,PUT,DELETE"],
  allowedHeaders:["Content-Type,Authorization"]
}));

app.use(express.json("limit:16kb"));
app.use(express.urlencoded({extended:true}));

app.get("/", async (req, res) => {
  res.send('Working');
});

app.use('/api/users',userRoute);
app.use('/api/complaints',userComplaintsRoute);
app.use('/api/foodItems',foodItemsRoute);
app.use('/api/menu',menuRoute);
app.use('/api/menudays',menuDaysRoute);
app.use('/api/rate',mealRatingRoute);

export default app;