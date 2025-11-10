import express from "express";
import {
  setDayTimings,
  getTodayTimingsController,
  getWeekTimingsController
} from "../controllers/menuDays.controller.js";

const router = express.Router();

router.post("/set", setDayTimings);
router.get("/today-timings", getTodayTimingsController);
router.get("/week", getWeekTimingsController);

export default router;
