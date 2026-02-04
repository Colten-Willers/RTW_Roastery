import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { AuthContext } from '@/App';
import { toast } from 'sonner';
import { CreditCard } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Checkout = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [customBlends, setCustomBlends] = useState([]);
  const [shippingRates, setShippingRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isGuest, setIsGuest] = useState(!user);
  const [guestEmail, setGuestEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState({
    name: user?.name || '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: '',
  });
  const [selectedShipping, setSelectedShipping] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      let cartData = [];
      
      // Try to get cart from localStorage for guests
      if (!user) {
        const savedCart = localStorage.getItem('guestCart');
        if (savedCart) {
          cartData = JSON.parse(savedCart);
        }
      } else {
        const cartRes = await axios.get(`${API}/cart`);
        cartData = cartRes.data;
      }

      const [productsRes, blendsRes, shippingRes] = await Promise.all([
        axios.get(`${API}/products`).catch(() => ({ data: [] })),
        user ? axios.get(`${API}/custom-blends`).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        axios.get(`${API}/shipping/rates`).catch(() => ({ data: [{ id: '1', region: 'Standard', rate: 10.0, description: 'Personal Delivery' }] })),
      ]);

      setCartItems(cartData);
      setProducts(productsRes.data);
      setCustomBlends(blendsRes.data);
      setShippingRates(shippingRes.data);
      if (shippingRes.data.length > 0) {
        setSelectedShipping(shippingRes.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load checkout data');
    } finally {
      setLoading(false);
    }
  };

  const getItemDetails = (item) => {
    if (item.product_id) {
      const product = products.find((p) => p.id === item.product_id);
      return product ? { name: product.name, price: product.price } : { name: 'Unknown', price: 0 };
    } else if (item.custom_blend_id) {
      const blend = customBlends.find((b) => b.id === item.custom_blend_id);
      return blend ? { name: blend.name, price: blend.price } : { name: 'Unknown', price: 0 };
    }
    return { name: 'Unknown', price: 0 };
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const details = getItemDetails(item);
      return total + details.price * item.quantity;
    }, 0);
  };

  const getShippingCost = () => {
    const rate = shippingRates.find((r) => r.id === selectedShipping);
    return rate ? rate.rate : 0;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + getShippingCost();
  };

  const handleCheckout = async () => {
    if (!shippingAddress.address || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zip) {
      toast.error('Please fill in all shipping address fields');
      return;
    }

    setProcessing(true);

    try {
      // Create order
      const orderItems = cartItems.map((item) => ({
        ...item,
        details: getItemDetails(item),
      }));

      const orderResponse = await axios.post(`${API}/orders`, {
        items: orderItems,
        total_amount: calculateTotal(),
        shipping_address: shippingAddress,
      });

      // Create checkout session
      const originUrl = window.location.origin;
      const checkoutResponse = await axios.post(`${API}/checkout/session`, {
        order_id: orderResponse.data.id,
        origin_url: originUrl,
      });

      // Redirect to Stripe
      window.location.href = checkoutResponse.data.url;
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Checkout failed. Please try again.');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-polo-green text-xl font-display">Loading...</div>
      </div>
    );
  }

  return (
    <div data-testid="checkout-page" className="min-h-screen py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-display font-bold text-polo-green mb-8">Checkout</h1>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Shipping Information */}
            <div>
              <Card className="p-6 border-polo-green/20">
                <h2 className="text-2xl font-display font-semibold text-polo-green mb-6">Shipping Address</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      data-testid="shipping-name-input"
                      value={shippingAddress.name}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      data-testid="shipping-address-input"
                      value={shippingAddress.address}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        data-testid="shipping-city-input"
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        data-testid="shipping-state-input"
                        value={shippingAddress.state}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="zip">ZIP Code</Label>
                      <Input
                        id="zip"
                        data-testid="shipping-zip-input"
                        value={shippingAddress.zip}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, zip: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        data-testid="shipping-country-input"
                        value={shippingAddress.country}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Shipping Options */}
              <Card className="p-6 border-polo-green/20 mt-6">
                <h2 className="text-2xl font-display font-semibold text-polo-green mb-4">Shipping Method</h2>
                <div className="space-y-2">
                  {shippingRates.map((rate) => (
                    <label
                      key={rate.id}
                      className={`flex items-center justify-between p-4 border-2 rounded-sm cursor-pointer transition-all duration-300 ${
                        selectedShipping === rate.id ? 'border-aged-brass bg-aged-brass/10' : 'border-gray-200 hover:border-aged-brass/50'
                      }`}
                    >
                      <div>
                        <input
                          type="radio"
                          name="shipping"
                          value={rate.id}
                          checked={selectedShipping === rate.id}
                          onChange={() => setSelectedShipping(rate.id)}
                          className="sr-only"
                        />
                        <p className="font-medium text-polo-green">{rate.region}</p>
                        <p className="text-sm text-[var(--text-secondary)]">{rate.description}</p>
                      </div>
                      <span className="font-semibold text-aged-brass">${rate.rate.toFixed(2)}</span>
                    </label>
                  ))}
                </div>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="p-6 bg-bg-paper border-aged-brass/30 sticky top-24">
                <h2 className="text-2xl font-display font-semibold text-polo-green mb-6">Order Summary</h2>
                <div className="space-y-4 mb-6">
                  {cartItems.map((item) => {
                    const details = getItemDetails(item);
                    return (
                      <div key={item.id} className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">
                          {details.name} × {item.quantity}
                        </span>
                        <span className="font-medium text-polo-green">${(details.price * item.quantity).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t border-polo-green/20 pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Subtotal</span>
                    <span className="font-medium text-polo-green">${calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Shipping</span>
                    <span className="font-medium text-polo-green">${getShippingCost().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-display font-bold pt-2 border-t border-polo-green/20">
                    <span className="text-polo-green">Total</span>
                    <span data-testid="checkout-total" className="text-aged-brass">${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  data-testid="pay-now-button"
                  onClick={handleCheckout}
                  disabled={processing}
                  className="w-full mt-6 bg-aged-brass text-polo-green hover:bg-aged-brass/90 text-lg py-6"
                >
                  {processing ? (
                    'Processing...'
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mr-2" />
                      Pay with Stripe
                    </>
                  )}
                </Button>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Checkout;