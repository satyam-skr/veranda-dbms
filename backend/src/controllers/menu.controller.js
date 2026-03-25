import {
  addMenuItem,
  getTodayMenu,
  getMenuByDate,
  deleteMenuItemById,
  getMergedWeeklySchedule,
  replaceDayMenuByNames,
} from "../models/menu.model.js";
import { upsertMenuDay } from "../models/menuDays.model.js";

export const addMenu = async (req, res) => {
  try {
    const { food_item_id, menu_day_id, menu_date, meal_type } = req.body;
    const item = await addMenuItem(food_item_id, menu_day_id, menu_date, meal_type);
    res.status(201).json(item);
  } catch (e) {
    res.status(500).json({ error: "Error adding menu item" });
  }
};

export const getTodayMenuController = async (_req, res) => {
  try {
    const rows = await getTodayMenu();
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Error fetching today's menu" });
  }
};

export const getMenuByDateController = async (req, res) => {
  try {
    const { date } = req.params;
    const rows = await getMenuByDate(date);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Error fetching menu by date" });
  }
};

export const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteMenuItemById(id);
    if (!deleted) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted", deleted });
  } catch (e) {
    res.status(500).json({ error: "Error deleting menu item" });
  }
};

/* “Schedule” view (for your MenuTab) */

export const getFullSchedule = async (_req, res) => {
  try {
    const schedule = await getMergedWeeklySchedule();
    res.json(schedule);
  } catch (e) {
    res.status(500).json({ error: "Error fetching schedule" });
  }
};

export const updateDaySchedule = async (req, res) => {
  try {
    const { day } = req.params;
    const { timings, items } = req.body;

    // 1) update timings for the day
    const [startB, endB] = (timings.breakfast || "").split("-").map(s => s?.trim());
    const [startL, endL] = (timings.lunch || "").split("-").map(s => s?.trim());
    const [startS, endS] = (timings.snacks || "").split("-").map(s => s?.trim());
    const [startD, endD] = (timings.dinner || "").split("-").map(s => s?.trim());

    await upsertMenuDay(day, {
      breakfast_start: startB || null,
      breakfast_end:   endB   || null,
      lunch_start:     startL || null,
      lunch_end:       endL   || null,
      snacks_start:    startS || null,
      snacks_end:      endS   || null,
      dinner_start:    startD || null,
      dinner_end:      endD   || null,
    });

    // 2) replace today’s items for this day
    await replaceDayMenuByNames(day, items);

    res.json({ message: "Day schedule updated" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error updating day schedule" });
  }
};
