CREATE TABLE food_items (
    food_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    food_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,       
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
