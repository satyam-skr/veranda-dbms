import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getMyComplaints,
  getAllComplaints,
  createComplaint,
  deleteMyOpenComplaint,
  updateComplaintStatus
} from '../../api/mockApi';
import Card from '../../components/Card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const ComplaintTab = () => {
  const { currentUser, isDomainAdmin } = useAuth();
  const isAdmin = isDomainAdmin('mess');
  
  const [complaints, setComplaints] = useState([]);
  const [formData, setFormData] = useState({ subject: '', detail: '' });

  const loadComplaints = () => {
    if (isAdmin) {
      setComplaints(getAllComplaints());
    } else {
      setComplaints(getMyComplaints(currentUser.id));
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [currentUser, isAdmin]);

  const handleSubmit = (e) => {
    e.preventDefault();
    createComplaint({
      studentId: currentUser.id,
      subject: formData.subject,
      detail: formData.detail
    });
    setFormData({ subject: '', detail: '' });
    loadComplaints();
    toast.success('Complaint submitted successfully');
  };

  const handleDelete = (id) => {
    if (deleteMyOpenComplaint(id, currentUser.id)) {
      loadComplaints();
      toast.success('Complaint deleted');
    } else {
      toast.error('Cannot delete this complaint');
    }
  };

  const handleStatusChange = (id, status) => {
    updateComplaintStatus(id, status);
    loadComplaints();
    toast.success('Status updated');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-destructive text-destructive-foreground';
      case 'in_progress': return 'bg-warning text-warning-foreground';
      case 'resolved': return 'bg-success text-success-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {!isAdmin && (
        <Card>
          <h2 className="text-xl font-semibold text-foreground mb-4">Submit New Complaint</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Brief description of the issue"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="detail">Details</Label>
              <Textarea
                id="detail"
                placeholder="Provide more details about your complaint"
                value={formData.detail}
                onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
                rows={4}
                required
              />
            </div>

            <Button type="submit" className="w-full">Submit Complaint</Button>
          </form>
        </Card>
      )}

      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">
          {isAdmin ? 'All Complaints' : 'My Complaints'}
        </h2>
        
        <div className="space-y-4">
          {complaints.map((complaint) => (
            <Card key={complaint.id}>
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{complaint.subject}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{complaint.detail}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(complaint.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(complaint.status)}>
                      {complaint.status.replace('_', ' ')}
                    </Badge>
                    
                    {!isAdmin && complaint.status === 'open' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(complaint.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {isAdmin && (
                  <div className="pt-3 border-t border-border">
                    <Label htmlFor={`status-${complaint.id}`} className="text-sm">Update Status</Label>
                    <Select
                      value={complaint.status}
                      onValueChange={(value) => handleStatusChange(complaint.id, value)}
                    >
                      <SelectTrigger id={`status-${complaint.id}`} className="w-full mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </Card>
          ))}

          {complaints.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No complaints found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComplaintTab;
