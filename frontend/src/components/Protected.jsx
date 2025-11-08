import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Protected = ({ children, requireRole, domainKey }) => {
  const { currentUser, hasRole, isDomainAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (requireRole) {
    if (requireRole === 'super_admin' && !hasRole('super_admin')) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
            <p className="text-muted-foreground">You don't have permission to access this page.</p>
          </div>
        </div>
      );
    }

    if (requireRole === 'domain_admin' && domainKey) {
      if (!isDomainAdmin(domainKey)) {
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
              <p className="text-muted-foreground">You don't have admin access to this domain.</p>
            </div>
          </div>
        );
      }
    }
  }

  return children;
};

export default Protected;
