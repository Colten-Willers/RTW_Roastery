import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AuthContext } from '@/App';
import { toast } from 'sonner';
import { Trash2, ShoppingBag } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Cart = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [customBlends, setCustomBlends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const [cartRes, productsRes, blendsRes] = await Promise.all([
        axios.get(`${API}/cart`),
        axios.get(`${API}/products`).catch(() => ({ data: [] })),
        axios.get(`${API}/custom-blends`).catch(() => ({ data: [] })),
      ]);

      setCartItems(cartRes.data);
      setProducts(productsRes.data);
      setCustomBlends(blendsRes.data);
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId) => {
    try {
      await axios.delete(`${API}/cart/${itemId}`);
      setCartItems(cartItems.filter((item) => item.id !== itemId));
      toast.success('Item removed from cart');
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Failed to remove item');
    }
  };

  const getItemDetails = (item) => {
    if (item.product_id) {
      const product = products.find((p) => p.id === item.product_id);
      return product
        ? { name: product.name, price: product.price, type: 'Product' }
        : { name: 'Unknown Product', price: 0, type: 'Product' };
    } else if (item.custom_blend_id) {
      const blend = customBlends.find((b) => b.id === item.custom_blend_id);
      return blend
        ? { name: blend.name, price: blend.price, type: 'Custom Blend' }
        : { name: 'Unknown Blend', price: 0, type: 'Custom Blend' };
    }
    return { name: 'Unknown Item', price: 0, type: 'Unknown' };
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const details = getItemDetails(item);
      return total + details.price * item.quantity;
    }, 0);
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-polo-green text-xl font-display">Loading cart...</div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div data-testid="cart-page-empty" className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <ShoppingBag className="w-24 h-24 text-aged-brass/50 mx-auto mb-6" />
          <h1 className="text-3xl font-display font-bold text-polo-green mb-4">Your Cart is Empty</h1>
          <p className="text-[var(--text-secondary)] mb-8">Start building your perfect blend!</p>
          <Button
            data-testid="empty-cart-cta"
            onClick={() => navigate('/custom-builder')}
            className="bg-polo-green text-bg-light hover:bg-polo-green/90"
          >
            Create Custom Blend
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="cart-page" className="min-h-screen py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-display font-bold text-polo-green mb-8">Your Cart</h1>

          <div className="space-y-4 mb-8">
            {cartItems.map((item) => {
              const details = getItemDetails(item);
              return (
                <Card key={item.id} data-testid={`cart-item-${item.id}`} className="p-6 border-polo-green/20">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-display font-semibold text-polo-green mb-1">
                        {details.name}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)] mb-2">{details.type}</p>
                      <p className="text-lg font-medium text-aged-brass">
                        ${details.price.toFixed(2)} × {item.quantity}
                      </p>
                    </div>
                    <Button
                      data-testid={`remove-item-${item.id}`}
                      onClick={() => removeItem(item.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          <Card className="p-6 bg-bg-paper border-aged-brass/30">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xl font-display font-semibold text-polo-green">Total</span>
              <span data-testid="cart-total" className="text-3xl font-display font-bold text-aged-brass">
                ${calculateTotal().toFixed(2)}
              </span>
            </div>
            <Button
              data-testid="checkout-button"
              onClick={handleCheckout}
              className="w-full bg-polo-green text-bg-light hover:bg-polo-green/90 text-lg py-6"
            >
              Proceed to Checkout
            </Button>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Cart;