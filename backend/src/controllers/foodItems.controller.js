import {addFoodItem,updateFoodItemById,deleteFoodItemById,getAllFoodItems} from '../models/foodItems.model.js';

const createFoodItem = async(req,res) => {
    try{
        const {food_name,food_description,category} = req.body;
        const newFood = await addFoodItem(
            food_name,
            food_description,
            category
        );

        res.status(200).json({
            message:"Food Add scuccessfully",
            food:newFood
        });
    }catch(err){
        res.status(500).json({error:err.message});
    }
}

const updateFoodItem = async(req,res) => {
    try{
        const {id} = req.params;
        const {food_name,food_description,category} = req.body;
        const updated = await updateFoodItemById(
            id,
            food_name,
            food_description,
            category
        );
        if (!updated) {
            return res.status(404).json({ message: "Food item not found" });
        }

        res.status(200).json({
            message: "Food updated successfully",
            food: updated,
        });
    }
    catch(err){
        console.error(err);
        res.status(500).json({ error: "Error updating food item" });
    }
};

const deleteFoodItem = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await deleteFoodItemById(id);

    if (!deleted) {
      return res.status(404).json({ message: "Food item not found" });
    }

    res.status(200).json({
      message: "Food deleted successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error deleting food item" });
  }
};


const getFoodItem = async (req, res) => {
  try {
    const items = await getAllFoodItems();
    res.status(200).json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unable to fetch food items" });
  }
};


export {createFoodItem,updateFoodItem,deleteFoodItem,getFoodItem};