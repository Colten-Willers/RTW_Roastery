import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const CheckoutCancel = () => {
  const navigate = useNavigate();

  return (
    <div data-testid="checkout-cancel-page" className="min-h-screen flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="p-12 text-center max-w-md">
          <XCircle className="w-20 h-20 text-red-600 mx-auto mb-6" />
          <h1 className="text-3xl font-display font-bold text-polo-green mb-4">
            Payment Cancelled
          </h1>
          <p className="text-[var(--text-secondary)] mb-8">
            Your payment was cancelled. Your cart items are still saved.
          </p>
          <div className="space-y-3">
            <Button
              data-testid="retry-checkout-button"
              onClick={() => navigate('/checkout')}
              className="w-full bg-polo-green text-bg-light hover:bg-polo-green/90"
            >
              Try Again
            </Button>
            <Button
              data-testid="back-to-cart-button"
              onClick={() => navigate('/cart')}
              variant="outline"
              className="w-full border-polo-green text-polo-green hover:bg-polo-green hover:text-bg-light"
            >
              Back to Cart
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default CheckoutCancel;