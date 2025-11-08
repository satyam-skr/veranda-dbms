import { useState, useEffect } from 'react';
import { getWeeklyRatings } from '../../api/mockApi';
import Card from '../../components/Card';
import { Badge } from '../../components/ui/badge';
import { Star } from 'lucide-react';

const RatingTab = () => {
  const [ratings, setRatings] = useState([]);

  useEffect(() => {
    setRatings(getWeeklyRatings());
  }, []);

  const renderStars = (avgStars) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= avgStars
                ? 'fill-accent text-accent'
                : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
    );
  };

  const getMealColor = (meal) => {
    switch (meal) {
      case 'breakfast': return 'bg-primary text-primary-foreground';
      case 'lunch': return 'bg-accent text-accent-foreground';
      case 'dinner': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">Weekly Meal Ratings</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Sorted by rating (best to worst)
      </p>

      <div className="space-y-4">
        {ratings.map((rating, index) => (
          <Card key={index}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Badge className={getMealColor(rating.meal)}>
                    {rating.meal}
                  </Badge>
                  <h3 className="font-semibold text-foreground">{rating.item}</h3>
                </div>
                {renderStars(rating.avgStars)}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">{rating.avgStars.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">out of 5</p>
              </div>
            </div>
          </Card>
        ))}

        {ratings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No ratings available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RatingTab;
