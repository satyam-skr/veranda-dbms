import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { createRequest } from '../../lib/api.polls.js';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { toast } from '../ui/use-toast';

const PollRequestForm = () => {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({ title: 'Error', description: 'Title is required', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      await createRequest(currentUser.id, { title: title.trim(), description: description.trim() });
      toast({ title: 'Success', description: 'Your poll request has been submitted for approval' });
      setTitle('');
      setDescription('');
    } catch (err) {
      if (err.status === 409 || err.message?.includes('pending')) {
        toast({ 
          title: 'Pending Request', 
          description: 'You already have a pending poll request', 
          variant: 'destructive' 
        });
      } else {
        toast({ 
          title: 'Error', 
          description: err.message || 'Failed to submit request', 
          variant: 'destructive' 
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request a Poll</CardTitle>
        <CardDescription>Submit your poll idea for admin approval</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="What should we poll about?"
              disabled={submitting}
            />
            <p className="text-xs text-muted-foreground mt-1">{title.length}/120</p>
          </div>
          
          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              placeholder="Add more details about your poll idea..."
              rows={4}
              disabled={submitting}
            />
            <p className="text-xs text-muted-foreground mt-1">{description.length}/500</p>
          </div>

          <Button type="submit" disabled={submitting || !title.trim()}>
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PollRequestForm;