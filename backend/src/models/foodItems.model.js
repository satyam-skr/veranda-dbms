import pool from '../db/db.js';

const addFoodItem = async(food_name,food_description,category)=>{
    const query = `INSERT INTO food_items (food_name, food_description, category)
        VALUES ($1, $2, $3)
        RETURNING *;
        `;
    const food = [food_name,food_description,category];

    const result = await pool.query(query,food);
    return result.rows;

};

const updateFoodItemById = async(food_item_id,food_name,food_description,category)=>{
    const query = `UPDATE food_items
                    SET food_name = $2, food_description = $3, category = $4
                    WHERE food_item_id = $1
                    RETURNING *;
                    `;
    const food = [food_item_id,food_name,food_description,category];

    const result = await pool.query(query,food);
    return result.rows;

};

const deleteFoodItemById = async(food_item_id)=>{
    const query = `
        DELETE FROM food_items
        WHERE food_item_id = $1
        RETURNING *;
    `;

    const values = [food_item_id];

    const result = await pool.query(query, values);
    return result.rows[0];
};

const getAllFoodItems = async () => {
    const query = `
        SELECT *
        FROM food_items
        ORDER BY food_item_id ASC;
    `;
    const result = await pool.query(query);
    return result.rows;
};

export {addFoodItem,updateFoodItemById,deleteFoodItemById,getAllFoodItems};