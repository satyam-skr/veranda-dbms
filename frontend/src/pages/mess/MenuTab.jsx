import { useState, useEffect } from "react";
import {
  getFullMenuSchedule,
  updateDaySchedule,
} from "../../lib/api.menu.js";
import { getAllFoodItems } from "../../lib/api.foodItems.js";

import Card from "../../components/Card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Calendar, Clock, X } from "lucide-react";
import { toast } from "sonner";

const slots = ["breakfast", "lunch", "snacks", "dinner"];

const MenuTab = ({ isAdmin = false }) => {
  const [schedule, setSchedule] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [editingDay, setEditingDay] = useState(null);

  // Fetch data
  const load = async () => {
    try {
      const [sched, foods] = await Promise.all([
        getFullMenuSchedule(),
        getAllFoodItems(),
      ]);
      setSchedule(sched);
      setFoodItems(foods);
    } catch (err) {
      toast.error("Failed to load menu or items");
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Update time
  const handleTimeChange = (day, slot, val) => {
    setSchedule((prev) =>
      prev.map((d) =>
        d.day === day
          ? { ...d, timings: { ...d.timings, [slot]: val } }
          : d
      )
    );
  };

  // Add food item
  const addItemToSlot = (day, slot, food_name) => {
    if (!food_name) return;
    setSchedule((prev) =>
      prev.map((d) =>
        d.day === day
          ? {
              ...d,
              items: {
                ...d.items,
                [slot]: [...new Set([...d.items[slot], food_name])],
              },
            }
          : d
      )
    );
  };

  // Remove food item
  const removeItemFromSlot = (day, slot, food_name) => {
    setSchedule((prev) =>
      prev.map((d) =>
        d.day === day
          ? {
              ...d,
              items: {
                ...d.items,
                [slot]: d.items[slot].filter((n) => n !== food_name),
              },
            }
          : d
      )
    );
  };

  // Save updates
  const handleSave = async (day) => {
    try {
      const entry = schedule.find((d) => d.day === day);
      await updateDaySchedule(day, {
        timings: entry.timings,
        items: entry.items,
      });
      toast.success("Menu updated successfully");
      setEditingDay(null);
      load();
    } catch {
      toast.error("Failed to save changes");
    }
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">
            Today is {today} — {new Date().toLocaleDateString()}
          </h2>
        </div>
        {isAdmin ? (
          <p className="text-sm text-muted-foreground">
            Click on any day to edit the timings and menu items.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            View daily menu and meal timings.
          </p>
        )}
      </Card>

      {/* Schedule List */}
      <div className="space-y-4">
        {schedule.map((day) => {
          const isToday = day.day === today;
          const isEditing = editingDay === day.day;

          return (
            <Card
              key={day.day}
              className={isToday ? "border-primary border-2" : ""}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    {day.day}
                  </h3>
                  {isToday && <Badge variant="default">Today</Badge>}
                </div>

                {isAdmin && (
                  <>
                    {!isEditing ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingDay(day.day)}
                      >
                        Edit
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSave(day.day)}
                        >
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingDay(null);
                            load();
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Day Slots */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {slots.map((slot) => (
                  <div
                    key={slot}
                    className="space-y-2 p-4 rounded-lg bg-muted/50"
                  >
                    {/* Slot Header */}
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-foreground capitalize">
                        {slot}
                      </h4>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {isEditing ? (
                          <Input
                            className="h-7 w-36 text-xs"
                            value={day.timings[slot] || ""}
                            onChange={(e) =>
                              handleTimeChange(
                                day.day,
                                slot,
                                e.target.value
                              )
                            }
                            placeholder="08:00 - 09:30"
                          />
                        ) : (
                          <span>{day.timings[slot] || "—"}</span>
                        )}
                      </div>
                    </div>

                    {/* Slot Items */}
                    {isEditing && isAdmin ? (
                      <div className="space-y-2">
                        <Label className="text-xs">Add item</Label>
                        <select
                          className="h-8 border rounded px-2 text-sm w-full"
                          onChange={(e) =>
                            addItemToSlot(day.day, slot, e.target.value)
                          }
                          value=""
                        >
                          <option value="">Select {slot} item</option>
                          {foodItems
                            .filter((fi) => fi.category === slot)
                            .map((fi) => (
                              <option
                                key={fi.food_item_id}
                                value={fi.food_name}
                              >
                                {fi.food_name}
                              </option>
                            ))}
                        </select>

                        <div className="flex flex-wrap gap-2">
                          {day.items[slot]?.length > 0 ? (
                            day.items[slot].map((name) => (
                              <Badge
                                key={name}
                                className="text-xs flex items-center gap-1"
                              >
                                {name}
                                <X
                                  className="h-3 w-3 cursor-pointer"
                                  onClick={() =>
                                    removeItemFromSlot(day.day, slot, name)
                                  }
                                />
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              No items
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {day.items[slot]?.length > 0 ? (
                          day.items[slot].map((name) => (
                            <Badge
                              key={name}
                              variant="secondary"
                              className="text-xs"
                            >
                              {name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            No items scheduled
                          </span>
                        )}
                      </div>
                    )}
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