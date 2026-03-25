import axios from "axios";
import { use } from "react";

// Base URL for rating module
const API = "http://localhost:3000/api/rate";

// ------------------------------------------------------------
// 1. Student submits a rating (POST /api/rate/meal)
// ------------------------------------------------------------
export const submitRatingAPI = async ({ user_id, meal_type, rating }) => {
  const { data } = await axios.post(`${API}/meal`, {
    user_id,
    meal_type,
    rating
  });
  return data;
};

// ------------------------------------------------------------
// 2. Student fetches TODAY'S ratings (GET /api/rate/my-today/:user_id)
// ------------------------------------------------------------
export const getMyTodayRatingsAPI = async (user_id) => {
  const { data } = await axios.get(`${API}//my-today/${user_id}`);
  return data;
};

// ------------------------------------------------------------
// 3. Admin fetches TODAY'S average ratings (GET /api/rate/today)
// ------------------------------------------------------------
export const getTodayRatingsAPI = async () => {
  const { data } = await axios.get(`${API}/today`);
  return data;
};
