import pool from "../db/db.js";

/* ---------------- BUS MODEL FUNCTIONS ---------------- */

// ✅ Create Bus
export const createBus = async ({ bus_number, route_name, start_point, end_point, stops, tracking_url }) => {
  const query = `
    INSERT INTO transport_buses (bus_number, route_name, start_point, end_point, stops, tracking_url, status_updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
    RETURNING *;
  `;
  const values = [bus_number, route_name, start_point, end_point, stops, tracking_url];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

// ✅ Get All Buses
export const getAllBuses = async () => {
  const query = `
    SELECT bus_id, bus_number, route_name, start_point, end_point, stops, tracking_url, has_arrived, status_updated_at
    FROM transport_buses
    ORDER BY created_at DESC;
  `;
  const { rows } = await pool.query(query);
  return rows;
};

// ✅ Update Bus Info
export const updateBus = async (bus_id, { bus_number, route_name, start_point, end_point, stops, tracking_url }) => {
  const query = `
    UPDATE transport_buses
    SET bus_number = $1,
        route_name = $2,
        start_point = $3,
        end_point = $4,
        stops = $5,
        tracking_url = $6,
        status_updated_at = CURRENT_TIMESTAMP
    WHERE bus_id = $7
    RETURNING *;
  `;
  const values = [bus_number, route_name, start_point, end_point, stops, tracking_url, bus_id];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

// ✅ Mark Bus Arrived
export const markBusArrived = async (bus_id) => {
  const query = `
    UPDATE transport_buses
    SET has_arrived = true,
        status_updated_at = CURRENT_TIMESTAMP
    WHERE bus_id = $1
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [bus_id]);
  return rows[0];
};

// ✅ Reset Bus Arrival
export const resetBusArrival = async (bus_id) => {
  const query = `
    UPDATE transport_buses
    SET has_arrived = false,
        status_updated_at = CURRENT_TIMESTAMP
    WHERE bus_id = $1
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [bus_id]);
  return rows[0];
};

/* ---------------- DRIVER MODEL FUNCTIONS ---------------- */
export const createDriver = async ({ driver_name, phone, bus_number }) => {
  const query = `
    INSERT INTO transport_drivers (driver_name, phone, bus_number)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const values = [driver_name, phone, bus_number];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

export const getAllDrivers = async () => {
  const { rows } = await pool.query("SELECT * FROM transport_drivers ORDER BY created_at DESC;");
  return rows;
};

/* ---------------- TIMETABLE MODEL FUNCTIONS ---------------- */
export const addTimetable = async ({ bus_id, image_path }) => {
  const query = `
    INSERT INTO transport_timetables (bus_id, image_path)
    VALUES ($1, $2)
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [bus_id, image_path]);
  return rows[0];
};

export const getAllTimetables = async () => {
  const query = `
    SELECT t.timetable_id, t.image_path, t.upload_date,
           b.bus_id, b.bus_number, b.route_name, b.has_arrived, b.status_updated_at
    FROM transport_timetables t
    JOIN transport_buses b ON t.bus_id = b.bus_id
    ORDER BY t.upload_date DESC;
  `;
  const { rows } = await pool.query(query);
  return rows;
};

export const getTimetableById = async (id) => {
  const result = await pool.query("SELECT * FROM transport_timetables WHERE timetable_id = $1", [id]);
  return result.rows[0];
};

export const deleteTimetable = async (id) => {
  await pool.query("DELETE FROM transport_timetables WHERE timetable_id = $1", [id]);
};

/* ---------------- LIST BUSES (Alternative) ---------------- */
export const listBuses = async () => {
  const query = `
    SELECT 
      bus_id, 
      bus_number, 
      route_name, 
      start_point, 
      end_point, 
      stops,
      tracking_url,
      has_arrived,
      status_updated_at
    FROM transport_buses
    ORDER BY bus_id ASC;
  `;
  const { rows } = await pool.query(query);
  return rows;
};
