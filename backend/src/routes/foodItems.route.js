import express from "express";
import {createFoodItem,updateFoodItem,deleteFoodItem,getFoodItem} from "../controllers/foodItems.controller.js";
// import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/add",createFoodItem);
router.put("/:id",updateFoodItem);
router.delete("/:id",deleteFoodItem);
router.get("/all",getFoodItem);

export default router;