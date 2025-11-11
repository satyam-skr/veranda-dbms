// lib/api.issues.js
const BASE_URL = "http://localhost:3000/api/issues";

// POST → Submit an issue
export const submitIssueAPI = async (payload) => {
  const response = await fetch(`${BASE_URL}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || "Failed to submit issue");
  }

  return data;
};

// GET → Issues by Email
export const getIssuesByEmailAPI = async (email) => {
  const res = await fetch(`${BASE_URL}/user/${email}`);
  const data = await res.json();

  if (!res.ok) throw new Error(data.error || "Unable to fetch issues");
  return data;
};

// GET → All Issues (Admin)
export const getAllIssuesAPI = async () => {
  const res = await fetch(`${BASE_URL}/all`);
  const data = await res.json();

  if (!res.ok) throw new Error(data.error || "Unable to fetch all issues");
  return data;
};

// PATCH → Update Issue Status
export const updateIssueStatusAPI = async (id, status) => {
  const res = await fetch(`${BASE_URL}/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to update issue");
  return data;
};
