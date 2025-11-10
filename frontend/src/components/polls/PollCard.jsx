import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { vote } from '../../services/api/polls';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { toast } from '../ui/use-toast';
import { Link } from 'react-router-dom';

const PollCard = ({ poll, onVoteSuccess }) => {
  const { currentUser } = useAuth();
  const [voting, setVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [localVoteCount, setLocalVoteCount] = useState(poll.total_votes || 0);

  const handleVote = async () => {
    if (!confirm('Cast your vote for this poll?')) return;

    setVoting(true);
    try {
      await vote(currentUser.id, poll.id);
      setLocalVoteCount(prev => prev + 1);
      setHasVoted(true);
      toast({ title: 'Success', description: 'Your vote has been recorded' });
      onVoteSuccess?.();
    } catch (err) {
      if (err.status === 409) {
        setHasVoted(true);
        toast({ 
          title: 'Already Voted', 
          description: 'You have already voted on this poll', 
          variant: 'destructive' 
        });
      } else {
        toast({ 
          title: 'Error', 
          description: err.message || 'Failed to record vote', 
          variant: 'destructive' 
        });
      }
    } finally {
      setVoting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{poll.title}</CardTitle>
        {poll.description && (
          <CardDescription className="line-clamp-2">{poll.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Total votes: <span className="font-semibold text-foreground">{localVoteCount}</span>
        </p>
      </CardContent>
      <CardFooter className="gap-2">
        <Button
          onClick={handleVote}
          disabled={voting || hasVoted}
          variant={hasVoted ? 'secondary' : 'default'}
        >
          {voting ? 'Voting...' : hasVoted ? 'Voted' : 'Vote'}
        </Button>
        <Button variant="outline" asChild>
          <Link to={`/shop/polls/${poll.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PollCard;
