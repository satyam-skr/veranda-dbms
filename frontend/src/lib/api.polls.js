// src/services/api/polls.js

import axios from "axios";

// --- Base URL for your Neon backend ---
const BASE_URL = "http://localhost:3000";

// --- Create axios instance ---
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// --- Attach userId to headers for each request ---
const authHeaders = (userId) => ({
  headers: { "x-user-id": userId },
});

// --- Generic response handler ---
const handleError = (error) => {
  if (error.response) {
    throw {
      status: error.response.status,
      message: error.response.data?.message || "Request failed",
      data: error.response.data,
    };
  }
  throw { status: 500, message: "Network error", data: null };
};

// 🟢 Create poll request (STUDENT)
export const createRequest = async (userId, body) => {
  try {
    const response = await api.post("/api/polls/requests", body, authHeaders(userId));
    return response.data;
  } catch (err) {
    handleError(err);
  }
};

// 🟢 Get pending poll requests (SHOP ADMIN / SUPERADMIN)
export const getPendingRequests = async (userId) => {
  try {
    const response = await api.get("/api/polls/requests/pending", authHeaders(userId));
    return response.data;
  } catch (err) {
    handleError(err);
  }
};

// 🟢 Approve or Reject poll request (SHOP ADMIN / SUPERADMIN)
export const reviewRequest = async (userId, id, decision) => {
  try {
    const response = await api.patch(
      `/api/polls/requests/${id}/status`,
      { decision },
      authHeaders(userId)
    );
    return response.data;
  } catch (err) {
    handleError(err);
  }
};

// 🟢 Get list of active polls (ANY USER)
export const getPolls = async (userId) => {
  try {
    const response = await api.get("/api/polls", authHeaders(userId));
    return response.data;
  } catch (err) {
    handleError(err);
  }
};

// 🟢 Vote for a poll (STUDENT)
export const vote = async (userId, pollId) => {
  try {
    const response = await api.post(
      "/api/polls/votes",
      { poll_id: pollId },
      authHeaders(userId)
    );
    return response.data;
  } catch (err) {
    handleError(err);
  }
};

// 🟢 Get poll details by ID (ANY USER)
export const getPollById = async (userId, id) => {
  try {
    const response = await api.get(`/api/polls/${id}`, authHeaders(userId));
    return response.data;
  } catch (err) {
    handleError(err);
  }
};
