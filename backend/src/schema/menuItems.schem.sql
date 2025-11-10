CREATE TABLE menu_items (
    menu_item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    food_item_id UUID NOT NULL,
    menu_day_id UUID NOT NULL,
    menu_date DATE NOT NULL,  

    meal_type VARCHAR(50) NOT NULL,  -- breakfast/lunch/snacks/dinner
    
    FOREIGN KEY (food_item_id) REFERENCES food_items(food_item_id),
    FOREIGN KEY (menu_day_id) REFERENCES menu_days(menu_day_id)
);
