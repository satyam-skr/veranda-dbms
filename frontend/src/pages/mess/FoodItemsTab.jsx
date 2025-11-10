import { useState, useEffect } from 'react';
import {
  getAllFoodItems,
  createFoodItemAPI,
  updateFoodItemAPI,
  deleteFoodItemAPI,
} from '../../lib/api.foodItems.js';

import Card from '../../components/Card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Trash2, Edit2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

const FoodItemsTab = () => {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({ food_name: "", category: "breakfast" });

  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({ food_name: "", category: "" });

  const loadItems = async () => {
    try {
      const data = await getAllFoodItems();
      setItems(data);
    } catch (err) {
      toast.error("Failed to load food items");
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createFoodItemAPI(formData);
      toast.success("Food item added");
      setFormData({ food_name: "", category: "breakfast" });
      loadItems();
    } catch (err) {
      toast.error("Error adding food");
    }
  };

  const startInlineEdit = (item) => {
    setEditingId(item.food_item_id);
    setEditValues({
      food_name: item.food_name,
      category: item.category,
    });
  };

  const saveInlineEdit = async (id) => {
    try {
      await updateFoodItemAPI(id, editValues);
      toast.success("Food item updated");
      setEditingId(null);
      loadItems();
    } catch (err) {
      toast.error("Error updating");
    }
  };

  const cancelInlineEdit = () => {
    setEditingId(null);
    setEditValues({ food_name: "", category: "" });
  };

  const handleDelete = async (id) => {
    try {
      await deleteFoodItemAPI(id);
      toast.success("Deleted");
      loadItems();
    } catch (err) {
      toast.error("Error deleting");
    }
  };

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Add Form */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">Add New Food Item</h2>
        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Food Name</Label>
              <Input
                value={formData.food_name}
                onChange={(e) => setFormData({ ...formData, food_name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="snacks">Snacks</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full">Add Item</Button>
        </form>
      </Card>

      {/* Food List */}
      <h2 className="text-xl font-semibold mb-4">Food Items Library</h2>

      {Object.keys(groupedItems).length === 0 ? (
        <div className="text-center py-12">No items yet</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([category, categoryItems]) => (
            <Card key={category}>
              <h3 className="text-lg font-semibold capitalize mb-4">{category}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {categoryItems.map((item) => (
                  <div key={item.food_item_id} className="p-3 rounded-lg border bg-card">

                    {editingId === item.food_item_id ? (
                      <>
                        <Input
                          className="mb-2"
                          value={editValues.food_name}
                          onChange={(e) => setEditValues({ ...editValues, food_name: e.target.value })}
                        />

                        <Select
                          value={editValues.category}
                          onValueChange={(value) => setEditValues({ ...editValues, category: value })}
                        >
                          <SelectTrigger className="mb-2"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="breakfast">Breakfast</SelectItem>
                            <SelectItem value="lunch">Lunch</SelectItem>
                            <SelectItem value="snacks">Snacks</SelectItem>
                            <SelectItem value="dinner">Dinner</SelectItem>
                          </SelectContent>
                        </Select>

                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => saveInlineEdit(item.food_item_id)}>
                            <Save className="h-4 w-4" />
                          </Button>

                          <Button size="sm" variant="outline" onClick={cancelInlineEdit}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{item.food_name}</span>

                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => startInlineEdit(item)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(item.food_item_id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FoodItemsTab;
