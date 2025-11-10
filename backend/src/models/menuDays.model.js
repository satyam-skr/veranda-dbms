import pool from "../db/db.js";

export const upsertMenuDay = async (day_of_week, t) => {
  const q = `
    INSERT INTO menu_days (
      day_of_week,
      breakfast_start, breakfast_end,
      lunch_start, lunch_end,
      snacks_start, snacks_end,
      dinner_start, dinner_end
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    ON CONFLICT (day_of_week) DO UPDATE SET
      breakfast_start = EXCLUDED.breakfast_start,
      breakfast_end   = EXCLUDED.breakfast_end,
      lunch_start     = EXCLUDED.lunch_start,
      lunch_end       = EXCLUDED.lunch_end,
      snacks_start    = EXCLUDED.snacks_start,
      snacks_end      = EXCLUDED.snacks_end,
      dinner_start    = EXCLUDED.dinner_start,
      dinner_end      = EXCLUDED.dinner_end,
      updated_at      = CURRENT_TIMESTAMP
    RETURNING *;
  `;
  const vals = [
    day_of_week,
    t.breakfast_start || null,
    t.breakfast_end || null,
    t.lunch_start || null,
    t.lunch_end || null,
    t.snacks_start || null,
    t.snacks_end || null,
    t.dinner_start || null,
    t.dinner_end || null,
  ];
  const { rows } = await pool.query(q, vals);
  return rows[0];
};

export const getTodayTimings = async () => {
  const q = `
    SELECT * FROM menu_days
    WHERE day_of_week = TO_CHAR(CURRENT_DATE, 'FMDay'); -- FM removes padding spaces
  `;
  const { rows } = await pool.query(q);
  return rows[0];
};

export const getWeekTimings = async () => {
  const q = `SELECT * FROM menu_days ORDER BY 
    CASE day_of_week
      WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
      WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6
      WHEN 'Sunday' THEN 7 ELSE 8 END;`;
  const { rows } = await pool.query(q);
  return rows;
};
