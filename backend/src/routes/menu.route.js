import express from "express";
import {
  addMenu,
  getTodayMenuController,
  getMenuByDateController,
  deleteMenuItem,
  getFullSchedule,
  updateDaySchedule
} from "../controllers/menu.controller.js";

const router = express.Router();

router.post("/add", addMenu);
router.get("/today", getTodayMenuController);
router.get("/date/:date", getMenuByDateController);
router.delete("/:id", deleteMenuItem);

/* schedule endpoints for MenuTab */
router.get("/schedule", getFullSchedule);
router.put("/schedule/:day", updateDaySchedule);

export default router;
