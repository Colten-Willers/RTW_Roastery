import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthContext } from '@/App';
import { toast } from 'sonner';
import { Settings } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [shippingRates, setShippingRates] = useState([]);
  const [newRate, setNewRate] = useState({ region: '', rate: '', description: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, ratesRes] = await Promise.all([
        axios.get(`${API}/admin/orders`),
        axios.get(`${API}/shipping/rates`),
      ]);

      setOrders(ordersRes.data);
      setShippingRates(ratesRes.data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.patch(`${API}/admin/orders/${orderId}?status=${status}`);
      toast.success('Order status updated');
      fetchData();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    }
  };

  const addShippingRate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/shipping/rates`, {
        region: newRate.region,
        rate: parseFloat(newRate.rate),
        description: newRate.description,
      });
      toast.success('Shipping rate added');
      setNewRate({ region: '', rate: '', description: '' });
      fetchData();
    } catch (error) {
      console.error('Error adding shipping rate:', error);
      toast.error('Failed to add shipping rate');
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
    <div data-testid="admin-dashboard-page" className="min-h-screen py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center mb-8">
            <Settings className="w-10 h-10 text-aged-brass mr-4" />
            <h1 className="text-4xl font-display font-bold text-polo-green">Admin Dashboard</h1>
          </div>

          <Tabs defaultValue="orders" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="orders" data-testid="admin-tab-orders">Manage Orders</TabsTrigger>
              <TabsTrigger value="shipping" data-testid="admin-tab-shipping">Shipping Rates</TabsTrigger>
            </TabsList>

            <TabsContent value="orders" data-testid="admin-orders-content">
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id} data-testid={`admin-order-${order.id}`} className="p-6 border-polo-green/20">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-sm text-[var(--text-secondary)] mb-1">
                          Order #{order.id.slice(0, 8)}
                        </p>
                        <p className="text-lg font-display font-semibold text-polo-green">
                          ${order.total_amount.toFixed(2)}
                        </p>
                        <p className="text-sm text-[var(--text-secondary)] mt-2">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="space-x-2">
                        {['pending', 'processing', 'shipped', 'delivered'].map((status) => (
                          <Button
                            key={status}
                            data-testid={`update-order-${order.id}-${status}`}
                            onClick={() => updateOrderStatus(order.id, status)}
                            size="sm"
                            variant={order.status === status ? 'default' : 'outline'}
                            className={order.status === status ? 'bg-polo-green' : ''}
                          >
                            {status}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="text-sm text-[var(--text-secondary)]">
                      User: {order.user_id} | Items: {order.items.length}
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="shipping" data-testid="admin-shipping-content">
              <Card className="p-6 mb-6 border-polo-green/20">
                <h2 className="text-2xl font-display font-semibold text-polo-green mb-4">Add Shipping Rate</h2>
                <form onSubmit={addShippingRate} className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="region">Region</Label>
                      <Input
                        id="region"
                        data-testid="shipping-region-input"
                        value={newRate.region}
                        onChange={(e) => setNewRate({ ...newRate, region: e.target.value })}
                        required
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="rate">Rate ($)</Label>
                      <Input
                        id="rate"
                        data-testid="shipping-rate-input"
                        type="number"
                        step="0.01"
                        value={newRate.rate}
                        onChange={(e) => setNewRate({ ...newRate, rate: e.target.value })}
                        required
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        data-testid="shipping-description-input"
                        value={newRate.description}
                        onChange={(e) => setNewRate({ ...newRate, description: e.target.value })}
                        required
                        className="mt-2"
                      />
                    </div>
                  </div>
                  <Button
                    data-testid="add-shipping-rate-button"
                    type="submit"
                    className="bg-polo-green text-bg-light hover:bg-polo-green/90"
                  >
                    Add Rate
                  </Button>
                </form>
              </Card>

              <div className="space-y-4">
                <h2 className="text-2xl font-display font-semibold text-polo-green mb-4">Current Rates</h2>
                {shippingRates.map((rate) => (
                  <Card key={rate.id} data-testid={`shipping-rate-${rate.id}`} className="p-6 border-polo-green/20">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-display font-semibold text-polo-green">{rate.region}</h3>
                        <p className="text-[var(--text-secondary)]">{rate.description}</p>
                      </div>
                      <span className="text-2xl font-display font-bold text-aged-brass">
                        ${rate.rate.toFixed(2)}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;