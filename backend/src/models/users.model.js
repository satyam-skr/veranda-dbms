import pool from '../db/db.js';

const registerUser = async(email,password,full_name,phone,verification_status,role)=>{
    const query = 
    `INSERT INTO users(email,password,full_name,phone,verification_status,role)
    VALUES($1,$2,$3,$4,$5,$6)
    RETRUNING user_id,password,full_name,phone,verification_status,role,created_at
    `;
    const values = [email,password,full_name,phone,verification_status,role];
    const { rows } = await pool.query(query,values);
    return rows[0]; 
} 

const findUserByEmail = async(email) =>{
    const query = `SELECT * FROM users WHERE email = $1`;
    const {rows} = await pool.query(query,[rows]);
    return rows[0];
}

export {registerUser,findUserByEmail};