import express from "express";
import {rateMeal,getTodayAverageRatings,getMyTodayRatings} from "../controllers/mealRating.controller.js";
// import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/meal",rateMeal);
router.get("/my-today/:user_id", getMyTodayRatings);
router.get("/today", getTodayAverageRatings);


export default router;