import pool from '../db/db.js';

const registerUser = async(email,password_hash,full_name,gender,phone,verification_status,user_role)=>{
    user_role = JSON.stringify(user_role);
    const query = 
    `INSERT INTO users(email,password_hash,full_name,gender,phone,verification_status,user_role)
    VALUES($1,$2,$3,$4,$5,$6,$7)
    RETURNING user_id,email,full_name,gender,phone,verification_status,user_role,created_at;
    `;
    const values = [email,password_hash,full_name,gender,phone,verification_status,user_role];
    const result = await pool.query(query,values);
    return result.rows[0]; 
} 

const findUserByEmail = async(email) =>{
    const query = `SELECT * FROM users WHERE email = $1`;
    const result = await pool.query(query,[email]);
    return result.rows[0];
}

export {registerUser,findUserByEmail};