import axios from "axios";

const API_URL = "http://localhost:3000/api/foodItems"; // change if needed

// GET /all
export const getAllFoodItems = async () => {
  const res = await axios.get(`${API_URL}/all`);
  return res.data;
};

// POST /submit
export const createFoodItemAPI = async (data) => {
  const res = await axios.post(`${API_URL}/add`, data);
  return res.data;
};

// PUT /:id
export const updateFoodItemAPI = async (id, data) => {
  const res = await axios.put(`${API_URL}/${id}`, data);
  return res.data;
};

// DELETE /:id
export const deleteFoodItemAPI = async (id) => {
  const res = await axios.delete(`${API_URL}/${id}`);
  return res.data;
};
