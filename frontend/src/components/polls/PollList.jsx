import { useState, useMemo } from 'react';
import PollCard from './PollCard';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const PollList = ({ polls, onVoteSuccess }) => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('votes-desc');

  const filteredAndSorted = useMemo(() => {
    let result = polls.filter(poll => 
      poll.title.toLowerCase().includes(search.toLowerCase()) ||
      (poll.description || '').toLowerCase().includes(search.toLowerCase())
    );

    if (sortBy === 'votes-desc') {
      result.sort((a, b) => (b.total_votes || 0) - (a.total_votes || 0));
    } else if (sortBy === 'votes-asc') {
      result.sort((a, b) => (a.total_votes || 0) - (b.total_votes || 0));
    } else if (sortBy === 'date-desc') {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return result;
  }, [polls, search, sortBy]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="search">Search Polls</Label>
          <Input
            id="search"
            placeholder="Search by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Label htmlFor="sort">Sort By</Label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger id="sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="votes-desc">Most Votes</SelectItem>
              <SelectItem value="votes-asc">Least Votes</SelectItem>
              <SelectItem value="date-desc">Newest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredAndSorted.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          {search ? 'No polls match your search' : 'No active polls yet'}
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredAndSorted.map(poll => (
            <PollCard key={poll.id} poll={poll} onVoteSuccess={onVoteSuccess} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PollList;