import axios from "axios";
const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

/* For your MenuTab schedule UX */
export const getFullMenuSchedule = async () => {
  const { data } = await axios.get(`${API}/menu/schedule`);
  return data;
};

export const updateDaySchedule = async (day, payload) => {
  const { data } = await axios.put(`${API}/menu/schedule/${day}`, payload);
  return data;
};

/* Optional basic endpoints (if needed elsewhere) */
export const getTodayMenu = async () => {
  const { data } = await axios.get(`${API}/menu/today`);
  return data;
};

export const getMenuByDate = async (date) => {
  const { data } = await axios.get(`${API}/menu/date/${date}`);
  return data;
};

export const deleteMenuItemAPI = async (id) => {
  const { data } = await axios.delete(`${API}/menu/${id}`);
  return data;
};
