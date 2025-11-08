import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import Card from '../../components/Card';
import { toast } from 'sonner';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = login(email, password);
    if (result.success) {
      toast.success('Logged in successfully!');
      navigate('/');
    } else {
      toast.error(result.error || 'Login failed');
    }
  };

  const handleDemoLogin = (demoEmail) => {
    const result = login(demoEmail, 'demo123');
    if (result.success) {
      toast.success('Logged in as demo user!');
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary mb-2">Veranda</h1>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/signup" className="text-sm text-primary hover:underline">
              Don't have an account? Sign up
            </Link>
          </div>
        </Card>

        <Card className="space-y-3">
          <p className="text-sm font-medium text-foreground text-center mb-3">Quick Demo Login</p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleDemoLogin('student@demo.com')}
          >
            Login as Student
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleDemoLogin('messadmin@demo.com')}
          >
            Login as Mess Admin
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleDemoLogin('superadmin@demo.com')}
          >
            Login as Super Admin
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default Login;
