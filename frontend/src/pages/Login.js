import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { AuthContext } from '@/App';
import { toast } from 'sonner';
import { Coffee } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, formData);
      login(response.data.token, response.data.user);
      toast.success('Welcome back!');
      
      // Check if there's a pending blend
      const pendingBlend = localStorage.getItem('pendingBlend');
      const redirect = searchParams.get('redirect');
      
      if (pendingBlend && redirect === 'custom-builder') {
        navigate('/custom-builder');
        toast.info('Continue building your custom blend!');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="login-page" className="min-h-screen flex items-center justify-center px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Coffee className="w-16 h-16 text-aged-brass mx-auto mb-4" />
          <h1 className="text-4xl font-display font-bold text-polo-green mb-2">Welcome Back</h1>
          <p className="text-[var(--text-secondary)]">Sign in to your account</p>
        </div>

        <Card className="p-8 border-polo-green/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-polo-green font-medium">
                Email
              </Label>
              <Input
                id="email"
                data-testid="login-email-input"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="mt-2 border-polo-green/30 focus:border-aged-brass"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-polo-green font-medium">
                Password
              </Label>
              <Input
                id="password"
                data-testid="login-password-input"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="mt-2 border-polo-green/30 focus:border-aged-brass"
              />
            </div>

            <Button
              data-testid="login-submit-button"
              type="submit"
              className="w-full bg-polo-green text-bg-light hover:bg-polo-green/90"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[var(--text-secondary)]">
              Don't have an account?{' '}
              <Link 
                to={searchParams.get('redirect') ? `/register?redirect=${searchParams.get('redirect')}` : '/register'} 
                className="text-aged-brass hover:underline font-medium"
              >
                Create one
              </Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;