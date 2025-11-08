// src/models/pollModel.js
import pool from "../db/db.js";

export async function createPoll(request) {
  const query = `
    INSERT INTO polls (request_id, title, description, created_at)
    VALUES ($1, $2, $3, NOW()) RETURNING *;
  `;
  return (await pool.query(query, [request.id, request.title, request.description])).rows[0];
}

export async function getActivePolls() {
  const query = `
    SELECT p.id, p.title, p.description, p.created_at,
           COALESCE(COUNT(v.id), 0)::int AS total_votes
    FROM polls p
    LEFT JOIN votes v ON v.poll_id = p.id
    GROUP BY p.id
    ORDER BY total_votes DESC, p.created_at DESC;
  `;
  return (await pool.query(query)).rows;
}

export async function getPollResults(pollId) {
  const query = `
    SELECT p.id, p.title, p.description, p.created_at,
           COALESCE(COUNT(v.id), 0)::int AS total_votes
    FROM polls p
    LEFT JOIN votes v ON v.poll_id = p.id
    WHERE p.id = $1
    GROUP BY p.id;
  `;
  const { rows } = await pool.query(query, [pollId]);
  return rows[0] || null;
}
