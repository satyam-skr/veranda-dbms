CREATE TYPE meal_type_enum AS ENUM ('breakfast', 'lunch', 'snacks', 'dinner');

CREATE TABLE meal_ratings (
    rating_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,
    meal_type meal_type_enum NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),

    rating_date DATE NOT NULL DEFAULT CURRENT_DATE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key referencing users table
    CONSTRAINT fk_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    -- Prevent duplicate rating: user can rate each slot only once per day
    CONSTRAINT unique_user_day_slot
        UNIQUE (user_id, rating_date, meal_type)
);
