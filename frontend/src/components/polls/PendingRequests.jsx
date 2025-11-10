import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { reviewRequest } from '../../services/api/polls';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { toast } from '../ui/use-toast';
import AdminApproveModal from './AdminApproveModal';

const PendingRequests = ({ requests, onReviewComplete }) => {
  const { currentUser } = useAuth();
  const [reviewing, setReviewing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);

  const openModal = (request, decision) => {
    setModalData({ request, decision });
    setModalOpen(true);
  };

  const handleReview = async (decision) => {
    if (!modalData) return;

    const { request } = modalData;
    setReviewing(request.id);
    setModalOpen(false);

    try {
      await reviewRequest(currentUser.id, request.id, decision);
      toast({ 
        title: 'Success', 
        description: `Poll request ${decision === 'approved' ? 'approved' : 'rejected'}` 
      });
      onReviewComplete?.();
    } catch (err) {
      toast({ 
        title: 'Error', 
        description: err.message || 'Failed to review request', 
        variant: 'destructive' 
      });
    } finally {
      setReviewing(null);
      setModalData(null);
    }
  };

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">No pending requests</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {requests.map(request => (
          <Card key={request.id}>
            <CardHeader>
              <CardTitle className="text-lg">{request.title}</CardTitle>
              <CardDescription>
                Requested by {request.student_name} on {new Date(request.created_at).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            {request.description && (
              <CardContent>
                <p className="text-sm text-muted-foreground">{request.description}</p>
              </CardContent>
            )}
            <CardContent className="flex gap-2">
              <Button
                onClick={() => openModal(request, 'approved')}
                disabled={reviewing === request.id}
                variant="default"
              >
                {reviewing === request.id ? 'Processing...' : 'Approve'}
              </Button>
              <Button
                onClick={() => openModal(request, 'rejected')}
                disabled={reviewing === request.id}
                variant="destructive"
              >
                Reject
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <AdminApproveModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onConfirm={handleReview}
        data={modalData}
      />
    </>
  );
};

export default PendingRequests;
