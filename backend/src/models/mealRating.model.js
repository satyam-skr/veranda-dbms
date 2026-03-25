import pool from "../db/db.js";

export const addMealRating = async (user_id, meal_type, rating) => {
  const q = `
    INSERT INTO meal_ratings (user_id, meal_type, rating)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id, meal_type, rating_date)
    DO UPDATE SET rating = EXCLUDED.rating
    RETURNING *;
  `;
  const { rows } = await pool.query(q, [user_id, meal_type, rating]);
  return rows[0];
};

export const getMyRatingsForToday = async (user_id) => {
  const q = `
    SELECT meal_type, rating
    FROM meal_ratings
    WHERE user_id = $1 AND rating_date = CURRENT_DATE;
  `;
  const { rows } = await pool.query(q, [user_id]);
  
  const result = {
    breakfast: null,
    lunch: null,
    snacks: null,
    dinner: null
  };

  rows.forEach(r => {
    result[r.meal_type] = r.rating;
  });

  return result;
};

export const getTodayRatings = async () => {
  const q = `
    SELECT meal_type, ROUND(AVG(rating), 1) as avg_rating
    FROM meal_ratings
    WHERE rating_date = CURRENT_DATE
    GROUP BY meal_type
    ORDER BY meal_type;
  `;

  const { rows } = await pool.query(q);

  return rows.map(r => ({
    meal: r.meal_type,
    avgStars: Number(r.avg_rating)
  }));
};
