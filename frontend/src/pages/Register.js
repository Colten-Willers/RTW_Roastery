import React, { useState, useContext } from 'react';
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

const Register = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/register`, formData);
      login(response.data.token, response.data.user);
      toast.success('Account created successfully!');
      
      // Check if there's a pending blend
      const pendingBlend = localStorage.getItem('pendingBlend');
      const redirect = searchParams.get('redirect');
      
      if (pendingBlend && redirect === 'custom-builder') {
        navigate('/custom-builder');
        toast.info('Continue building your custom blend!');
      } else {
        navigate('/custom-builder');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="register-page" className="min-h-screen flex items-center justify-center px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Coffee className="w-16 h-16 text-aged-brass mx-auto mb-4" />
          <h1 className="text-4xl font-display font-bold text-polo-green mb-2">Join Us</h1>
          <p className="text-[var(--text-secondary)]">Create your account to start crafting</p>
        </div>

        <Card className="p-8 border-polo-green/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name" className="text-polo-green font-medium">
                Name
              </Label>
              <Input
                id="name"
                data-testid="register-name-input"
                type="text"
                placeholder="Your Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="mt-2 border-polo-green/30 focus:border-aged-brass"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-polo-green font-medium">
                Email
              </Label>
              <Input
                id="email"
                data-testid="register-email-input"
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
                data-testid="register-password-input"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="mt-2 border-polo-green/30 focus:border-aged-brass"
              />
            </div>

            <Button
              data-testid="register-submit-button"
              type="submit"
              className="w-full bg-polo-green text-bg-light hover:bg-polo-green/90"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[var(--text-secondary)]">
              Already have an account?{' '}
              <Link 
                to={searchParams.get('redirect') ? `/login?redirect=${searchParams.get('redirect')}` : '/login'} 
                className="text-aged-brass hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Register;