import { useState, useEffect } from 'react';
import { getUsers, setDomainAdmin } from '../../api/mockApi';
import Header from '../../components/Header';
import Card from '../../components/Card';
import { Checkbox } from '../../components/ui/checkbox';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';

const SuperAdmin = () => {
  const [users, setUsers] = useState([]);

  const loadUsers = () => {
    setUsers(getUsers());
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleDomainToggle = (userId, domain, checked) => {
    setDomainAdmin(userId, domain, checked);
    loadUsers();
    toast.success(`Domain admin permissions updated`);
  };

  const domains = ['olx', 'mess', 'transport', 'shop', 'issues'];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Admin Center</h1>
            <p className="text-muted-foreground">Manage user roles and domain permissions</p>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Role</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground" colSpan={domains.length}>
                      Domain Admin Permissions
                    </th>
                  </tr>
                  <tr className="border-b border-border bg-muted/50">
                    <th colSpan={3}></th>
                    {domains.map(domain => (
                      <th key={domain} className="text-center py-2 px-2 text-xs font-medium text-muted-foreground uppercase">
                        {domain}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4 text-foreground">{user.fullName}</td>
                      <td className="py-3 px-4 text-muted-foreground text-sm">{user.email}</td>
                      <td className="py-3 px-4">
                        {user.roles.includes('super_admin') ? (
                          <Badge className="bg-accent text-accent-foreground">Super Admin</Badge>
                        ) : user.roles.includes('domain_admin') ? (
                          <Badge className="bg-primary text-primary-foreground">Domain Admin</Badge>
                        ) : (
                          <Badge variant="secondary">Student</Badge>
                        )}
                      </td>
                      {domains.map(domain => (
                        <td key={domain} className="py-3 px-2 text-center">
                          {user.roles.includes('super_admin') ? (
                            <span className="text-xs text-muted-foreground">All access</span>
                          ) : (
                            <Checkbox
                              checked={user.domainAdminOf?.includes(domain) || false}
                              onCheckedChange={(checked) => handleDomainToggle(user.id, domain, checked)}
                            />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {users.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No users found</p>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SuperAdmin;
