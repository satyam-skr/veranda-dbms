import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RoleBadge from './RoleBadge';
import { Button } from './ui/button';
import { LogOut } from 'lucide-react';

const Header = () => {
  const { currentUser, logout, hasRole } = useAuth();

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-primary">
            Veranda
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link to="/olx" className="text-foreground hover:text-primary transition-colors">
              OLX
            </Link>
            <Link to="/mess" className="text-foreground hover:text-primary transition-colors">
              Mess
            </Link>
            <span className="text-muted-foreground cursor-not-allowed">Transport</span>
            <span className="text-muted-foreground cursor-not-allowed">Shop (Poll)</span>
            <Link to="/mess" className="text-foreground hover:text-primary transition-colors">
              General Complaint
            </Link>
            {hasRole('super_admin') && (
              <Link to="/admin" className="text-accent hover:text-accent/80 transition-colors font-medium">
                Admin Center
              </Link>
            )}
          </nav>

          {currentUser && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-foreground hidden sm:inline">{currentUser.fullName}</span>
              <RoleBadge roles={currentUser.roles} domainAdminOf={currentUser.domainAdminOf} />
              <Button variant="ghost" size="sm" onClick={logout} className="gap-2">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
