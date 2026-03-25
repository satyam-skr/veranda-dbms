import pool from "../db/db.js";

// ✅ Create Auto
export const createAuto = async ({ auto_number, driver_name, phone_number, status }) => {
  const query = `
    INSERT INTO transport_autos (auto_number, driver_name, phone_number, status)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const values = [auto_number, driver_name, phone_number, status || 'Available'];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

// ✅ Get All Autos
export const getAllAutos = async () => {
  const { rows } = await pool.query("SELECT * FROM transport_autos ORDER BY created_at DESC;");
  return rows;
};

// ✅ Update Auto
export const updateAuto = async (id, { auto_number, driver_name, phone_number, status }) => {
  const query = `
    UPDATE transport_autos
    SET auto_number=$1, driver_name=$2, phone_number=$3, status=$4
    WHERE auto_id=$5
    RETURNING *;
  `;
  const values = [auto_number, driver_name, phone_number, status, id];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

// ✅ Delete Auto
export const deleteAuto = async (id) => {
  await pool.query("DELETE FROM transport_autos WHERE auto_id=$1", [id]);
};

// ✅ Get All Auto Timetables (optional for future)
export const getAllAutoTimetables = async () => {
  const { rows } = await pool.query("SELECT * FROM transport_auto_timetables ORDER BY upload_date DESC;");
  return rows;
};

// ✅ Update Auto Status (Arrived / Left Gate)
export const updateAutoStatus = async (auto_id, status) => {
  const query = `
    UPDATE transport_autos
    SET status=$1
    WHERE auto_id=$2
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [status, auto_id]);
  return rows[0];
};