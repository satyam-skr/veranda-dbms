import pool from "../db/db.js";

// Create poll request
export async function createPollRequest(studentId, title, description) {
  const query = `
    INSERT INTO poll_requests (student_id, title, description)
    VALUES ($1, $2, $3) RETURNING *;
  `;
  return (await pool.query(query, [studentId, title, description])).rows[0];
}

// Get own requests
export async function getUserPollRequests(studentId) {
  const query = `SELECT * FROM poll_requests WHERE student_id = $1 ORDER BY created_at DESC;`;
  return (await pool.query(query, [studentId])).rows;
}

// Admin – Get pending requests
export async function getPendingRequests() {
  const query = `SELECT pr.*, u.full_name AS student_name FROM poll_requests pr
    JOIN users u ON pr.student_id = u.user_id WHERE status = 'pending';`;
  return (await pool.query(query)).rows;
}

// Admin – Approve/Reject request
export async function updatePollRequestStatus(id, decision) {
  const query = `
    UPDATE poll_requests SET status = $2 WHERE id = $1 AND status = 'pending'
    RETURNING *;
  `;
  return (await pool.query(query, [id, decision])).rows[0];
}