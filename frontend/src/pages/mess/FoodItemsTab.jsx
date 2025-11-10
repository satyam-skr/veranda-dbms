import { useState, useEffect } from 'react';
import { getFoodItems, createFoodItem, updateFoodItem, deleteFoodItem } from '../../api/mockApi';
import Card from '../../components/Card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Trash2, Edit2, Plus } from 'lucide-react';
import { toast } from 'sonner';

const FoodItemsTab = () => {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({ name: '', category: 'breakfast' });
  const [editingId, setEditingId] = useState(null);

  const loadItems = () => {
    setItems(getFoodItems());
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      updateFoodItem(editingId, formData);
      toast.success('Food item updated');
      setEditingId(null);
    } else {
      createFoodItem(formData);
      toast.success('Food item added');
    }
    setFormData({ name: '', category: 'breakfast' });
    loadItems();
  };

  const handleEdit = (item) => {
    setFormData({ name: item.name, category: item.category });
    setEditingId(item.id);
  };

  const handleDelete = (id) => {
    deleteFoodItem(id);
    loadItems();
    toast.success('Food item deleted');
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'breakfast': return 'bg-primary/10 text-primary';
      case 'lunch': return 'bg-accent/10 text-accent';
      case 'snacks': return 'bg-secondary/10 text-secondary-foreground';
      case 'dinner': return 'bg-muted text-muted-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-xl font-semibold text-foreground mb-4">
          {editingId ? 'Edit Food Item' : 'Add New Food Item'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Food Name</Label>
              <Input
                id="name"
                placeholder="e.g., Poha, Dal Rice"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="snacks">Snacks</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              {editingId ? 'Update Item' : 'Add Item'}
            </Button>
            {editingId && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingId(null);
                  setFormData({ name: '', category: 'breakfast' });
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>

      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Food Items Library</h2>
        
        {Object.keys(groupedItems).length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No food items added yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedItems).map(([category, categoryItems]) => (
              <Card key={category}>
                <h3 className="text-lg font-semibold text-foreground capitalize mb-4">
                  {category}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categoryItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                    >
                      <span className="text-foreground font-medium">{item.name}</span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodItemsTab;
