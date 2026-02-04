import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AuthContext } from '@/App';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CheckoutSuccess = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('checking');
  const [attempts, setAttempts] = useState(0);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId && user) {
      pollPaymentStatus();
    } else if (!sessionId) {
      setStatus('error');
    }
  }, [sessionId, user]);

  const pollPaymentStatus = async () => {
    const maxAttempts = 5;

    if (attempts >= maxAttempts) {
      setStatus('timeout');
      return;
    }

    try {
      const response = await axios.get(`${API}/checkout/status/${sessionId}`);

      if (response.data.payment_status === 'paid') {
        // Clear cart
        await axios.delete(`${API}/cart`);
        setStatus('success');
      } else if (response.data.status === 'expired') {
        setStatus('error');
      } else {
        // Continue polling
        setAttempts(attempts + 1);
        setTimeout(() => pollPaymentStatus(), 2000);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      setStatus('error');
    }
  };

  if (status === 'checking') {
    return (
      <div data-testid="checkout-success-checking" className="min-h-screen flex items-center justify-center px-6">
        <Card className="p-12 text-center max-w-md">
          <Loader2 className="w-16 h-16 text-aged-brass mx-auto mb-6 animate-spin" />
          <h1 className="text-2xl font-display font-bold text-polo-green mb-4">
            Verifying Payment
          </h1>
          <p className="text-[var(--text-secondary)]">
            Please wait while we confirm your payment...
          </p>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div data-testid="checkout-success-page" className="min-h-screen flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="p-12 text-center max-w-md">
            <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-6" />
            <h1 className="text-3xl font-display font-bold text-polo-green mb-4">
              Order Confirmed!
            </h1>
            <p className="text-[var(--text-secondary)] mb-8">
              Thank you for your purchase. Your order has been received and will be processed shortly.
            </p>
            <div className="space-y-3">
              <Button
                data-testid="view-orders-button"
                onClick={() => navigate('/dashboard')}
                className="w-full bg-polo-green text-bg-light hover:bg-polo-green/90"
              >
                View My Orders
              </Button>
              <Button
                data-testid="continue-shopping-button"
                onClick={() => navigate('/products')}
                variant="outline"
                className="w-full border-polo-green text-polo-green hover:bg-polo-green hover:text-bg-light"
              >
                Continue Shopping
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div data-testid="checkout-success-error" className="min-h-screen flex items-center justify-center px-6">
      <Card className="p-12 text-center max-w-md">
        <h1 className="text-2xl font-display font-bold text-red-600 mb-4">
          Payment Verification Failed
        </h1>
        <p className="text-[var(--text-secondary)] mb-8">
          {status === 'timeout'
            ? 'Payment verification timed out. Please check your email for confirmation.'
            : 'Unable to verify payment status. Please contact support if you were charged.'}
        </p>
        <Button
          onClick={() => navigate('/dashboard')}
          className="w-full bg-polo-green text-bg-light hover:bg-polo-green/90"
        >
          Go to Dashboard
        </Button>
      </Card>
    </div>
  );
};

export default CheckoutSuccess;