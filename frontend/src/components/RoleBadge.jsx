import { Badge } from './ui/badge';

const RoleBadge = ({ roles, domainAdminOf }) => {
  if (roles?.includes('super_admin')) {
    return <Badge className="bg-accent text-accent-foreground">Super Admin</Badge>;
  }
  
  if (roles?.includes('domain_admin') && domainAdminOf?.length > 0) {
    return (
      <Badge className="bg-primary text-primary-foreground">
        Admin: {domainAdminOf.join(', ')}
      </Badge>
    );
  }
  
  return <Badge variant="secondary">Student</Badge>;
};

export default RoleBadge;
