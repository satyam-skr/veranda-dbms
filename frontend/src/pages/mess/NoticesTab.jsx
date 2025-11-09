import { useState, useEffect } from 'react';
import { getNotices, createNotice, updateNotice, deleteNotice } from '../../api/mockApi';
import Card from '../../components/Card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Trash2, Edit2, Calendar, Bell } from 'lucide-react';
import { toast } from 'sonner';

const NoticesTab = () => {
  const [notices, setNotices] = useState([]);
  const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], text: '' });
  const [editingId, setEditingId] = useState(null);

  const loadNotices = () => {
    setNotices(getNotices().sort((a, b) => new Date(b.date) - new Date(a.date)));
  };

  useEffect(() => {
    loadNotices();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      updateNotice(editingId, formData);
      toast.success('Notice updated');
      setEditingId(null);
    } else {
      createNotice(formData);
      toast.success('Notice created');
    }
    setFormData({ date: new Date().toISOString().split('T')[0], text: '' });
    loadNotices();
  };

  const handleEdit = (notice) => {
    setFormData({ date: notice.date, text: notice.text });
    setEditingId(notice.id);
  };

  const handleDelete = (id) => {
    deleteNotice(id);
    loadNotices();
    toast.success('Notice deleted');
  };

  const isUpcoming = (date) => {
    return new Date(date) >= new Date(new Date().toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">
            {editingId ? 'Edit Notice' : 'Create New Notice'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Notice Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="text">Notice Message</Label>
            <Textarea
              id="text"
              placeholder="Enter important notice for students..."
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              rows={4}
              required
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              {editingId ? 'Update Notice' : 'Create Notice'}
            </Button>
            {editingId && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingId(null);
                  setFormData({ date: new Date().toISOString().split('T')[0], text: '' });
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>

      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">All Notices</h2>
        
        <div className="space-y-4">
          {notices.map((notice) => (
            <Card key={notice.id} className={isUpcoming(notice.date) ? 'border-primary' : ''}>
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">
                        {new Date(notice.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                      {isUpcoming(notice.date) && (
                        <Badge variant="default" className="text-xs">Upcoming</Badge>
                      )}
                    </div>
                    <p className="text-foreground">{notice.text}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Posted: {new Date(notice.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(notice)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(notice.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {notices.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No notices posted yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoticesTab;