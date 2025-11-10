// src/services/api/polls.js

// --- Base URL for your Neon backend ---
const BASE_URL = import.meta.env.VITE_API_BASE || "http://localhost:3000";

// --- Common headers helper ---
const headers = (userId) => ({
  "x-user-id": userId,
  "Content-Type": "application/json",
});

// --- Generic response handler ---
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw {
      status: response.status,
      message: error.message || "Request failed",
      data: error,
    };
  }
  return response.json();
};

// 🟢 Create poll request (STUDENT)
export const createRequest = async (userId, body) => {
  const response = await fetch(`${BASE_URL}/api/polls/requests`, {
    method: "POST",
    mode: "cors",
    headers: headers(userId),
    body: JSON.stringify(body),
  });
  return handleResponse(response);
};

// 🟢 Get pending poll requests (SHOP ADMIN / SUPERADMIN)
export const getPendingRequests = async (userId) => {
  const response = await fetch(`${BASE_URL}/api/polls/requests/pending`, {
    method: "GET",
    mode: "cors",
    headers: headers(userId),
  });
  return handleResponse(response);
};

// 🟢 Approve or Reject poll request (SHOP ADMIN / SUPERADMIN)
export const reviewRequest = async (userId, id, decision) => {
  console.log("PATCH =>", `${BASE_URL}/api/polls/requests/${id}/status`);
  const response = await fetch(`${BASE_URL}/api/polls/requests/${id}/status`, {
    method: "PATCH",
    mode: "cors",
    headers: headers(userId),
    body: JSON.stringify({ decision }),
  });
  return handleResponse(response);
};

// 🟢 Get list of active polls (ANY USER)
export const getPolls = async (userId) => {
  const response = await fetch(`${BASE_URL}/api/polls`, {
    method: "GET",
    mode: "cors",
    headers: headers(userId),
  });
  return handleResponse(response);
};

// 🟢 Vote for a poll (STUDENT)
export const vote = async (userId, pollId) => {
  const response = await fetch(`${BASE_URL}/api/polls/votes`, {
    method: "POST",
    mode: "cors",
    headers: headers(userId),
    body: JSON.stringify({ poll_id: pollId }),
  });
  return handleResponse(response);
};

// 🟢 Get poll details by ID (ANY USER)
export const getPollById = async (userId, id) => {
  const response = await fetch(`${BASE_URL}/api/polls/${id}`, {
    method: "GET",
    mode: "cors",
    headers: headers(userId),
  });
  return handleResponse(response);
};
