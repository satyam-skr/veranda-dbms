import { useState, useEffect } from "react";
import Card from "../../components/Card";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import {
  submitRatingAPI,
  getMyTodayRatingsAPI,
} from "../../lib/api.mealRating.js";

const meals = ["breakfast", "lunch", "snacks", "dinner"];

const StudentRatingTab = () => {
  const { currentUser } = useAuth();
  const [myRatings, setMyRatings] = useState({
    breakfast: null,
    lunch: null,
    snacks: null,
    dinner: null,
  });

  // load user's today ratings
  const loadMyRatings = async () => {
    try {
      const data = await getMyTodayRatingsAPI(currentUser.user_id);
      setMyRatings(data);
    } catch (err) {
      console.log(err);
      toast.error("Error loading your ratings");
    }
  };

  useEffect(() => {
    loadMyRatings();
  }, [currentUser]);

  // student rates a meal
  const handleRating = async (meal_type, rating) => {
    try {
      await submitRatingAPI({
        user_id: currentUser.user_id,
        meal_type,
        rating,
      });

      toast.success(`Rated ${meal_type}: ${rating}⭐`);

      loadMyRatings(); // refresh UI
    } catch (err) {
      console.log(err);
      toast.error("Failed to rate");
    }
  };

  const renderStars = (meal) => {
    const current = myRatings[meal];

    return (
      <div className="flex gap-2 mt-2">
        {[1, 2, 3, 4, 5].map((num) => (
          <Star
            key={num}
            className={`h-7 w-7 cursor-pointer ${
              num <= current
                ? "text-yellow-400 fill-yellow-400"
                : "text-muted-foreground"
            }`}
            onClick={() => handleRating(meal, num)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground mb-4">
        Rate Your Meals (Today)
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Once you rate a meal today, it will appear here.  
        Tomorrow you can rate again.
      </p>

      {meals.map((meal) => (
        <Card key={meal} className="p-4">
          <h3 className="capitalize text-lg font-semibold">{meal}</h3>

          <p className="text-sm text-muted-foreground">
            {myRatings[meal]
              ? `Your rating today: ${myRatings[meal]}⭐`
              : "Tap below to rate for today"}
          </p>

          {renderStars(meal)}
        </Card>
      ))}
    </div>
  );
};

export default StudentRatingTab;
