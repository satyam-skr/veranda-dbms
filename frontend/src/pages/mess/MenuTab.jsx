import { useState, useEffect } from 'react';
import { getMenuSchedule, updateMenuSchedule, getFoodItems } from '../../api/mockApi';
import Card from '../../components/Card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';

const MenuTab = () => {
  const [schedule, setSchedule] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [editingDay, setEditingDay] = useState(null);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const slots = ['breakfast', 'lunch', 'snacks', 'dinner'];

  useEffect(() => {
    loadSchedule();
    setFoodItems(getFoodItems());
  }, []);

  const loadSchedule = () => {
    const data = getMenuSchedule();
    // Ensure all days are present
    const completeSchedule = daysOfWeek.map((day) => {
      const existing = data.find((d) => d.day === day);
      if (existing) return existing;
      return {
        day,
        date: new Date().toISOString().split('T')[0],
        slots: {
          breakfast: { time: '08:00 - 09:30', items: [] },
          lunch: { time: '12:30 - 14:00', items: [] },
          snacks: { time: '16:00 - 17:00', items: [] },
          dinner: { time: '19:30 - 21:00', items: [] }
        }
      };
    });
    setSchedule(completeSchedule);
  };

  const handleTimeChange = (day, slot, time) => {
    const updated = schedule.map((s) => {
      if (s.day === day) {
        return {
          ...s,
          slots: {
            ...s.slots,
            [slot]: { ...s.slots[slot], time }
          }
        };
      }
      return s;
    });
    setSchedule(updated);
  };

  const handleItemsChange = (day, slot, items) => {
    const updated = schedule.map((s) => {
      if (s.day === day) {
        return {
          ...s,
          slots: {
            ...s.slots,
            [slot]: { ...s.slots[slot], items: items.split(',').map(i => i.trim()).filter(i => i) }
          }
        };
      }
      return s;
    });
    setSchedule(updated);
  };

  const handleSave = () => {
    updateMenuSchedule(schedule);
    setEditingDay(null);
    toast.success('Menu schedule updated');
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">
            Today is {today} - {new Date().toLocaleDateString()}
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Click on any day to edit the menu and timings
        </p>
      </Card>

      <div className="space-y-4">
        {schedule.map((daySchedule) => {
          const isToday = daySchedule.day === today;
          const isEditing = editingDay === daySchedule.day;

          return (
            <Card key={daySchedule.day} className={isToday ? 'border-primary border-2' : ''}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-foreground">{daySchedule.day}</h3>
                  {isToday && <Badge variant="default">Today</Badge>}
                </div>
                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingDay(daySchedule.day)}
                  >
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSave}>
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingDay(null);
                        loadSchedule();
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {slots.map((slot) => (
                  <div key={slot} className="space-y-2 p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-foreground capitalize">{slot}</h4>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {isEditing ? (
                          <Input
                            type="text"
                            value={daySchedule.slots[slot].time}
                            onChange={(e) => handleTimeChange(daySchedule.day, slot, e.target.value)}
                            className="h-7 w-32 text-xs"
                            placeholder="HH:MM - HH:MM"
                          />
                        ) : (
                          <span>{daySchedule.slots[slot].time}</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {isEditing ? (
                        <div className="space-y-1">
                          <Label className="text-xs">Items (comma separated)</Label>
                          <Input
                            type="text"
                            value={daySchedule.slots[slot].items.join(', ')}
                            onChange={(e) => handleItemsChange(daySchedule.day, slot, e.target.value)}
                            placeholder="e.g., Poha, Tea"
                            className="h-8"
                          />
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {daySchedule.slots[slot].items.length > 0 ? (
                            daySchedule.slots[slot].items.map((item, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {item}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">No items scheduled</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MenuTab;
