import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getPollById } from '../../lib/api.polls.js';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

const PollDetails = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        setLoading(true);
        const data = await getPollById(currentUser.id, id);
        setPoll(data);
      } catch (err) {
        setError(err.message || 'Failed to load poll details');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.id && id) {
      fetchPoll();
    }
  }, [currentUser?.id, id]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button asChild>
              <Link to="/shop/polls">Back to Polls</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">Poll not found</p>
            <Button asChild>
              <Link to="/shop/polls">Back to Polls</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Button variant="ghost" asChild className="mb-4">
        <Link to="/shop/polls">← Back to Polls</Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{poll.title}</CardTitle>
          <CardDescription>
            Created on {new Date(poll.created_at).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {poll.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{poll.description}</p>
            </div>
          )}
          
          <div>
            <h3 className="font-semibold mb-2">Voting Statistics</h3>
            <p className="text-2xl font-bold text-primary">{poll.total_votes || 0}</p>
            <p className="text-sm text-muted-foreground">Total votes received</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PollDetails;