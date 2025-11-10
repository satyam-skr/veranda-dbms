import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePolls } from '../../hooks/usePolls';
import PollRequestForm from '../../components/polls/PollRequestForm';
import PollList from '../../components/polls/PollList';
import PendingRequests from '../../components/polls/PendingRequests';
import Header from '../../components/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

const PollsPage = () => {
  const { currentUser, hasRole, isDomainAdmin } = useAuth();
  const isAdmin = hasRole('super_admin') || isDomainAdmin('shop');
  const { polls, pendingRequests, loading, error, refresh } = usePolls(currentUser?.id, isAdmin);
  const [activeTab, setActiveTab] = useState(isAdmin ? 'pending' : 'request');

  const handleRefresh = () => {
    refresh();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Shop Polls</h1>
          <p className="text-muted-foreground">
            {isAdmin 
              ? 'Review poll requests and manage active polls' 
              : 'Request new polls and vote on active ones'}
          </p>
        </div>

        {error && (
          <Card className="mb-4 border-destructive">
            <CardContent className="py-4">
              <p className="text-destructive">{error}</p>
              <Button onClick={handleRefresh} variant="outline" className="mt-2">
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {loading && !polls.length && !pendingRequests.length ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Loading...</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full max-w-md" style={{ gridTemplateColumns: isAdmin ? '1fr 1fr 1fr' : '1fr 1fr' }}>
              {isAdmin && <TabsTrigger value="pending">Pending Requests</TabsTrigger>}
              <TabsTrigger value="request">Request a Poll</TabsTrigger>
              <TabsTrigger value="vote">Vote</TabsTrigger>
            </TabsList>

            {isAdmin && (
              <TabsContent value="pending" className="mt-6">
                <PendingRequests requests={pendingRequests} onReviewComplete={handleRefresh} />
              </TabsContent>
            )}

            <TabsContent value="request" className="mt-6">
              <PollRequestForm />
            </TabsContent>

            <TabsContent value="vote" className="mt-6">
              <PollList polls={polls} onVoteSuccess={handleRefresh} />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default PollsPage;
