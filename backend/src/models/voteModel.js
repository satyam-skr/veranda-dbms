import pool from "../db/db.js";


export async function castVote(voterId, pollId) {
  const query = `
    INSERT INTO votes (voter_id, poll_id)
    VALUES ($1, $2) ON CONFLICT (poll_id, voter_id)
    DO NOTHING RETURNING *;
  `;
  return (await pool.query(query, [voterId, pollId])).rows[0];
}

export async function getPollResults(pollId) {
  const query = `
    SELECT p.*, COUNT(v.id) AS total_votes
    FROM polls p LEFT JOIN votes v ON v.poll_id = p.id
    WHERE p.id = $1 GROUP BY p.id;
  `;
  return (await pool.query(query, [pollId])).rows[0];
}
