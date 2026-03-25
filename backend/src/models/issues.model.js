import pool from '../db/db.js';

const createIssue = async (user_email, category, non_technical_type, issue_description) => {
  const query = `
    INSERT INTO issues(user_email, category, non_technical_type, issue_description, status)
    VALUES($1, $2, $3, $4, $5)
    RETURNING issue_id, user_email, category, non_technical_type, issue_description, status, created_at
  `;
  const values = [user_email, category, non_technical_type, issue_description, 'pending'];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

const getAllIssues = async () => {
  const query = `SELECT * FROM issues ORDER BY created_at DESC`;
  const { rows } = await pool.query(query);
  return rows;
};

const getIssueById = async (issue_id) => {
  const query = `SELECT * FROM issues WHERE issue_id = $1`;
  const { rows } = await pool.query(query, [issue_id]);
  return rows[0];
};

const getIssuesByEmail = async (user_email) => {
  const query = `SELECT * FROM issues WHERE user_email = $1 ORDER BY created_at DESC`;
  const { rows } = await pool.query(query, [user_email]);
  return rows;
};

const updateIssueStatus = async (issue_id, status) => {
  const query = `
    UPDATE issues 
    SET status = $1, updated_at = CURRENT_TIMESTAMP 
    WHERE issue_id = $2 
    RETURNING *
  `;
  const { rows } = await pool.query(query, [status, issue_id]);
  return rows[0];
};

export { 
  createIssue, 
  getAllIssues, 
  getIssueById, 
  getIssuesByEmail, 
  updateIssueStatus 
};
