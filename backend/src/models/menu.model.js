import pool from "../db/db.js";

// Add a single menu item for a date+slot
export const addMenuItem = async (food_item_id, menu_day_id, menu_date, meal_type) => {
  const q = `
    INSERT INTO menu_items (food_item_id, menu_day_id, menu_date, meal_type)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const { rows } = await pool.query(q, [food_item_id, menu_day_id, menu_date, meal_type]);
  return rows[0];
};

// Today's menu (by meal_type)
export const getTodayMenu = async () => {
  const q = `
    SELECT mi.menu_item_id, mi.meal_type, mi.menu_date,
           fi.food_item_id, fi.food_name, fi.category,
           md.day_of_week
    FROM menu_items mi
    JOIN food_items fi ON fi.food_item_id = mi.food_item_id
    JOIN menu_days md ON md.menu_day_id = mi.menu_day_id
    WHERE mi.menu_date = CURRENT_DATE
    ORDER BY mi.meal_type, fi.food_name;
  `;
  const { rows } = await pool.query(q);
  return rows;
};

// Menu by date
export const getMenuByDate = async (date) => {
  const q = `
    SELECT mi.menu_item_id, mi.meal_type, mi.menu_date,
           fi.food_item_id, fi.food_name, fi.category,
           md.day_of_week
    FROM menu_items mi
    JOIN food_items fi ON fi.food_item_id = mi.food_item_id
    JOIN menu_days md ON md.menu_day_id = mi.menu_day_id
    WHERE mi.menu_date = $1
    ORDER BY mi.meal_type, fi.food_name;
  `;
  const { rows } = await pool.query(q, [date]);
  return rows;
};

export const deleteMenuItemById = async (id) => {
  const q = `
    DELETE FROM menu_items WHERE menu_item_id = $1 RETURNING *;
  `;
  const { rows } = await pool.query(q, [id]);
  return rows[0];
};

/* Helpers for the “schedule” UX */

// Get a merged weekly schedule: timings + items (names) for each day
export const getMergedWeeklySchedule = async () => {
  const timings = await (async () => {
    const { rows } = await pool.query(`SELECT * FROM menu_days;`);
    // Map day -> timings object
    const map = {};
    rows.forEach(d => {
      map[d.day_of_week] = {
        breakfast: `${d.breakfast_start || ""}${d.breakfast_end ? " - " + d.breakfast_end : ""}`,
        lunch:     `${d.lunch_start || ""}${d.lunch_end ? " - " + d.lunch_end : ""}`,
        snacks:    `${d.snacks_start || ""}${d.snacks_end ? " - " + d.snacks_end : ""}`,
        dinner:    `${d.dinner_start || ""}${d.dinner_end ? " - " + d.dinner_end : ""}`,
        menu_day_id: d.menu_day_id,
      };
    });
    return map;
  })();

  const { rows } = await pool.query(`
    SELECT md.day_of_week, mi.meal_type, fi.food_name
    FROM menu_items mi
    JOIN menu_days md ON md.menu_day_id = mi.menu_day_id
    JOIN food_items fi ON fi.food_item_id = mi.food_item_id
    WHERE mi.menu_date = CURRENT_DATE
  `);

  // Build items map
  const items = {};
  Object.keys(timings).forEach(day => {
    items[day] = { breakfast: [], lunch: [], snacks: [], dinner: [] };
  });
  rows.forEach(r => {
    if (!items[r.day_of_week]) {
      items[r.day_of_week] = { breakfast: [], lunch: [], snacks: [], dinner: [] };
    }
    items[r.day_of_week][r.meal_type].push(r.food_name);
  });

  // Merge into array the frontend expects
  return Object.keys(timings).map(day => ({
    day,
    timings: {
      breakfast: timings[day].breakfast,
      lunch: timings[day].lunch,
      snacks: timings[day].snacks,
      dinner: timings[day].dinner,
    },
    items: items[day] || { breakfast: [], lunch: [], snacks: [], dinner: [] },
    menu_day_id: timings[day].menu_day_id,
  }));
};

// Replace all CURRENT_DATE items for a given day with provided names
export const replaceDayMenuByNames = async (day_of_week, itemsBySlot) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Find the day row
    const dayRes = await client.query(
      `SELECT menu_day_id FROM menu_days WHERE day_of_week = $1`,
      [day_of_week]
    );
    if (dayRes.rows.length === 0) {
      throw new Error(`menu_days not found for day: ${day_of_week}`);
    }
    const menu_day_id = dayRes.rows[0].menu_day_id;

    // Delete existing items for CURRENT_DATE on that day
    await client.query(
      `DELETE FROM menu_items WHERE menu_day_id = $1 AND menu_date = CURRENT_DATE`,
      [menu_day_id]
    );

    // Insert new ones (lookup by food_name)
    const slots = ["breakfast", "lunch", "snacks", "dinner"];
    for (const meal_type of slots) {
      const names = itemsBySlot[meal_type] || [];
      for (const name of names) {
        const f = await client.query(
          `SELECT food_item_id, category FROM food_items WHERE food_name = $1`,
          [name]
        );
        if (f.rows.length === 0) continue; // skip unknown names
        // Optional: enforce category-slot match
        // if (f.rows[0].category !== meal_type) continue;

        await client.query(
          `INSERT INTO menu_items (food_item_id, menu_day_id, menu_date, meal_type)
           VALUES ($1, $2, CURRENT_DATE, $3)`,
          [f.rows[0].food_item_id, menu_day_id, meal_type]
        );
      }
    }

    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
};
