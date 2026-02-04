import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AuthContext } from '@/App';
import { toast } from 'sonner';
import { Package, RefreshCw, User as UserIcon } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [customBlends, setCustomBlends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, subsRes, blendsRes] = await Promise.all([
        axios.get(`${API}/orders`),
        axios.get(`${API}/subscriptions`),
        axios.get(`${API}/custom-blends`),
      ]);

      setOrders(ordersRes.data);
      setSubscriptions(subsRes.data);
      setCustomBlends(blendsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const updateSubscriptionStatus = async (subId, status) => {
    try {
      await axios.patch(`${API}/subscriptions/${subId}?status=${status}`);
      toast.success('Subscription updated');
      fetchData();
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast.error('Failed to update subscription');
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
    <div data-testid="dashboard-page" className="min-h-screen py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center mb-8">
            <UserIcon className="w-10 h-10 text-aged-brass mr-4" />
            <div>
              <h1 className="text-4xl font-display font-bold text-polo-green">Welcome, {user?.name}</h1>
              <p className="text-[var(--text-secondary)]">{user?.email}</p>
            </div>
          </div>

          <Tabs defaultValue="orders" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="orders" data-testid="tab-orders">Orders</TabsTrigger>
              <TabsTrigger value="subscriptions" data-testid="tab-subscriptions">Subscriptions</TabsTrigger>
              <TabsTrigger value="blends" data-testid="tab-blends">My Blends</TabsTrigger>
            </TabsList>

            <TabsContent value="orders" data-testid="orders-tab-content">
              <div className="space-y-4">
                {orders.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Package className="w-16 h-16 text-aged-brass/50 mx-auto mb-4" />
                    <p className="text-[var(--text-secondary)]">No orders yet</p>
                  </Card>
                ) : (
                  orders.map((order) => (
                    <Card key={order.id} data-testid={`order-${order.id}`} className="p-6 border-polo-green/20">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-sm text-[var(--text-secondary)] mb-1">
                            Order #{order.id.slice(0, 8)}
                          </p>
                          <p className="text-lg font-display font-semibold text-polo-green">
                            ${order.total_amount.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`px-3 py-1 rounded-sm text-sm font-medium ${
                              order.status === 'delivered'
                                ? 'bg-green-100 text-green-800'
                                : order.status === 'processing'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {order.status.toUpperCase()}
                          </span>
                          <p className="text-sm text-[var(--text-secondary)] mt-2">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-[var(--text-secondary)]">
                        {order.items.length} item(s)
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="subscriptions" data-testid="subscriptions-tab-content">
              <div className="space-y-4">
                {subscriptions.length === 0 ? (
                  <Card className="p-12 text-center">
                    <RefreshCw className="w-16 h-16 text-aged-brass/50 mx-auto mb-4" />
                    <p className="text-[var(--text-secondary)]">No active subscriptions</p>
                  </Card>
                ) : (
                  subscriptions.map((sub) => {
                    const blend = customBlends.find((b) => b.id === sub.custom_blend_id);
                    return (
                      <Card key={sub.id} data-testid={`subscription-${sub.id}`} className="p-6 border-polo-green/20">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-display font-semibold text-polo-green mb-2">
                              {blend?.name || 'Custom Blend'}
                            </h3>
                            <p className="text-[var(--text-secondary)] mb-2">
                              Frequency: {sub.frequency}
                            </p>
                            <p className="text-sm text-[var(--text-secondary)]">
                              Next delivery: {new Date(sub.next_delivery).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            {sub.status === 'active' ? (
                              <Button
                                data-testid={`pause-subscription-${sub.id}`}
                                onClick={() => updateSubscriptionStatus(sub.id, 'paused')}
                                variant="outline"
                                size="sm"
                                className="border-polo-green text-polo-green"
                              >
                                Pause
                              </Button>
                            ) : (
                              <Button
                                data-testid={`resume-subscription-${sub.id}`}
                                onClick={() => updateSubscriptionStatus(sub.id, 'active')}
                                size="sm"
                                className="bg-polo-green text-bg-light"
                              >
                                Resume
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </TabsContent>

            <TabsContent value="blends" data-testid="blends-tab-content">
              <div className="grid md:grid-cols-2 gap-4">
                {customBlends.length === 0 ? (
                  <Card className="p-12 text-center col-span-2">
                    <p className="text-[var(--text-secondary)]">No custom blends created yet</p>
                  </Card>
                ) : (
                  customBlends.map((blend) => (
                    <Card key={blend.id} data-testid={`blend-${blend.id}`} className="p-6 border-polo-green/20">
                      <h3 className="text-xl font-display font-semibold text-polo-green mb-2">
                        {blend.name}
                      </h3>
                      <div className="space-y-1 text-sm text-[var(--text-secondary)]">
                        <p>Origin: {blend.origin}</p>
                        <p>Roast: {blend.roast_level}</p>
                        <p>Grind: {blend.grind_size}</p>
                        <p>Quantity: {blend.quantity}g</p>
                      </div>
                      <p className="text-lg font-display font-bold text-aged-brass mt-4">
                        ${blend.price.toFixed(2)}
                      </p>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;