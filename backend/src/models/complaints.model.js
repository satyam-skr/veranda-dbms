import pool from '../db/db.js';

const createComplaint = async(student_id,category,issue_title,description,photo_url) => {
    const query = `INSERT INTO complaints(
        student_id,category,issue_title,description,photo_url
    )
    VALUES ($1,$2,$3,$4,$5)
    RETURNING complaint_id,student_id,category,issue_title,status,description,photo_url,created_at
    `;
    
    const values = [student_id,category,issue_title,description,photo_url];
    const { rows } = await pool.query(query,values);
    return rows[0];
};

const getAllComplaints = async() => {
    const query = `
        SELECT c.* 
        FROM complaints 
        JOIN users u ON c.student_id = u.user_id
        ORDER BY c.created_at DESC
        `;
    const {rows} = await pool.query(query);
    return rows[0];
}

const getComplaintsByStudent = async(student_id) => {
    const query = `
        SELECT * 
        FROM complanits
        WHERE student_id = $1
        ORDER BY created_at DESC`;
    const {rows} = await pool.query(query,[student_id]);
    return rows[0];
}

export {createComplaint,getComplaintsByStudent,getAllComplaints};