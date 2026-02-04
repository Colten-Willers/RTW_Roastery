import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthContext } from '@/App';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Products = () => {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      // Add sample products for demo
      setProducts([
        {
          id: '1',
          name: 'Ethiopian Yirgacheffe',
          description: 'Bright, floral notes with hints of citrus and tea-like quality',
          origin: 'Ethiopia',
          price: 24.99,
          image_url: 'https://images.unsplash.com/photo-1769437082791-8c9af44d7c28?crop=entropy&cs=srgb&fm=jpg&q=85',
          available: true,
        },
        {
          id: '2',
          name: 'Colombian Supremo',
          description: 'Rich, well-balanced with caramel sweetness and nutty undertones',
          origin: 'Colombia',
          price: 22.99,
          image_url: 'https://images.unsplash.com/photo-1573898086906-1f9232b65467?crop=entropy&cs=srgb&fm=jpg&q=85',
          available: true,
        },
        {
          id: '3',
          name: 'Costa Rican Tarrazu',
          description: 'Clean, crisp acidity with chocolate and honey notes',
          origin: 'Costa Rica',
          price: 26.99,
          image_url: 'https://images.unsplash.com/photo-1670899603742-726393a354fc?crop=entropy&cs=srgb&fm=jpg&q=85',
          available: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (product) => {
    if (!user) {
      toast.error('Please login to add items to cart');
      return;
    }

    try {
      await axios.post(`${API}/cart`, {
        product_id: product.id,
        quantity: 1,
      });
      toast.success(`${product.name} added to cart`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-polo-green text-xl font-display">Loading products...</div>
      </div>
    );
  }

  return (
    <div data-testid="products-page" className="min-h-screen py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl lg:text-5xl font-display font-bold text-polo-green mb-4">
            Our Collection
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            Explore our carefully curated selection of premium coffee beans from around the world.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              data-testid={`product-card-${product.id}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group bg-white border border-gray-200 rounded-sm overflow-hidden hover:border-aged-brass transition-all duration-300"
            >
              <div className="relative h-64 overflow-hidden">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500"
                />
                <div className="absolute top-4 right-4 bg-aged-brass text-polo-green px-3 py-1 rounded-sm text-sm font-medium">
                  {product.origin}
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-2xl font-display font-semibold text-polo-green mb-2">
                  {product.name}
                </h3>
                <p className="text-[var(--text-secondary)] mb-4 leading-relaxed">
                  {product.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-display font-bold text-aged-brass">
                    ${product.price.toFixed(2)}
                  </span>
                  <Button
                    data-testid={`add-to-cart-${product.id}`}
                    onClick={() => addToCart(product)}
                    className="bg-polo-green text-bg-light hover:bg-polo-green/90"
                    disabled={!product.available}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Products;