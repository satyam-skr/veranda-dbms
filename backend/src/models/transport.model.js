import pool from "../db/db.js";

export const createBus = async ({ bus_number, route_name, start_point, end_point, stops }) => {
  const query = `
    INSERT INTO transport_buses (bus_number, route_name, start_point, end_point, stops)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const values = [bus_number, route_name, start_point, end_point, stops];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

export const getAllBuses = async () => {
  const { rows } = await pool.query("SELECT * FROM transport_buses ORDER BY created_at DESC;");
  return rows;
};


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
           b.bus_id, b.bus_number, b.route_name, b.has_arrived
    FROM transport_timetables t
    JOIN transport_buses b ON t.bus_id = b.bus_id
    ORDER BY t.upload_date DESC;
  `;
  const { rows } = await pool.query(query);
  return rows;
};


export const markBusArrived = async (bus_id) => {
  const { rows } = await pool.query(
    "UPDATE transport_buses SET has_arrived = true WHERE bus_id = $1 RETURNING *;",
    [bus_id]
  );
  return rows[0];
};

export const resetBusArrival = async (bus_id) => {
  const { rows } = await pool.query(
    "UPDATE transport_buses SET has_arrived = false WHERE bus_id = $1 RETURNING *;",
    [bus_id]
  );
  return rows[0];
};

// ✅ Fetch a specific timetable by ID
export const getTimetableById = async (id) => {
  const result = await pool.query(
    "SELECT * FROM transport_timetables WHERE timetable_id = $1",
    [id]
  );
  return result.rows[0];
};

// ✅ Delete a timetable by ID
export const deleteTimetable = async (id) => {
  await pool.query(
    "DELETE FROM transport_timetables WHERE timetable_id = $1",
    [id]
  );
};

// ✅ Add new bus


// ✅ Update an existing bus
export const updateBus = async (id, { bus_number, route_name, start_point, end_point, stops }) => {
  try {
    const query = `
      UPDATE transport_buses
      SET bus_number = $1,
          route_name = $2,
          start_point = $3,
          end_point = $4,
          stops = $5
      WHERE bus_id = $6
      RETURNING *;
    `;
    const values = [bus_number, route_name, start_point, end_point, stops, id];
    const result = await pool.query(query, values);

    return result.rows[0];
  } catch (err) {
    console.error("❌ Error updating bus in model:", err);
    throw err;
  }
};

/* ---------------- AUTO MODELS ---------------- */



export const updateBusStatus = async (bus_id, status) => {
  const query = `
    UPDATE transport_buses
    SET status = $2, updated_at = NOW()
    WHERE bus_id = $1
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [bus_id, status]);
  return rows[0];
};




