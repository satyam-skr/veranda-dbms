import { addMealRating, getMyRatingsForToday,getTodayRatings } from "../models/mealRating.model.js";

export const rateMeal = async (req, res) => {
  try {
    const { user_id, meal_type, rating } = req.body;
    const saved = await addMealRating(user_id, meal_type, rating);
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: "Rating failed" });
  }
};

export const getMyTodayRatings = async (req, res) => {
  try {
    const data = await getMyRatingsForToday(req.params.user_id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Error loading your ratings" });
  }
};

export const getTodayAverageRatings = async (req, res) => {
  try {
    const data = await getTodayRatings();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Error loading today's ratings" });
  }
};
