import { upsertMenuDay, getTodayTimings, getWeekTimings } from "../models/menuDays.model.js";

export const setDayTimings = async (req, res) => {
  try {
    const { day_of_week, timings } = req.body;
    const saved = await upsertMenuDay(day_of_week, timings);
    res.json(saved);
  } catch (e) {
    res.status(500).json({ error: "Error saving timings" });
  }
};

export const getTodayTimingsController = async (_req, res) => {
  try {
    const t = await getTodayTimings();
    res.json(t || {});
  } catch (e) {
    res.status(500).json({ error: "Error fetching today's timings" });
  }
};

export const getWeekTimingsController = async (_req, res) => {
  try {
    const rows = await getWeekTimings();
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Error fetching week timings" });
  }
};
