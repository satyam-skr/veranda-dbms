CREATE TABLE menu_days (
    menu_day_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_of_week VARCHAR(15) NOT NULL,  -- Monday, Tuesday, etc.
    
    breakfast_start TIME,
    breakfast_end TIME,
    lunch_start TIME,
    lunch_end TIME,
    snacks_start TIME,
    snacks_end TIME,
    dinner_start TIME,
    dinner_end TIME,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
