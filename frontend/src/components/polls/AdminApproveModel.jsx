import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

const AdminApproveModel = ({ open, onOpenChange, onConfirm, data }) => {
  if (!data) return null;

  const { request, decision } = data;
  const isApprove = decision === 'approved';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isApprove ? 'Approve Poll Request' : 'Reject Poll Request'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isApprove 
              ? `Are you sure you want to approve "${request.title}"? This will create an active poll that students can vote on.`
              : `Are you sure you want to reject "${request.title}"? The student will need to submit a new request.`
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => onConfirm(decision)}>
            {isApprove ? 'Approve' : 'Reject'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AdminApproveModel;