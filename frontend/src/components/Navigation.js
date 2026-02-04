import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '@/App';
import { ShoppingCart, User, LogOut, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Navigation = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav data-testid="main-navigation" className="sticky top-0 z-50 backdrop-blur-md bg-polo-green/90 text-bg-light border-b border-aged-brass/20">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link data-testid="nav-logo-link" to="/" className="flex items-center space-x-2 group">
            <Coffee className="w-8 h-8 text-aged-brass" />
            <span className="text-2xl font-display font-semibold text-bg-light group-hover:text-aged-brass transition-all duration-300">
              RTW's Roastery
            </span>
          </Link>

          <div className="flex items-center space-x-8">
            <Link
              data-testid="nav-products-link"
              to="/products"
              className={`text-sm tracking-wide hover:text-aged-brass transition-all duration-300 ${
                isActive('/products') ? 'text-aged-brass border-b-2 border-aged-brass' : ''
              }`}
            >
              PRODUCTS
            </Link>
            <Link
              data-testid="nav-custom-builder-link"
              to="/custom-builder"
              className={`text-sm tracking-wide hover:text-aged-brass transition-all duration-300 ${
                isActive('/custom-builder') ? 'text-aged-brass border-b-2 border-aged-brass' : ''
              }`}
            >
              CUSTOM BUILDER
            </Link>

            {user ? (
              <>
                <Link data-testid="nav-cart-link" to="/cart" className="hover:text-aged-brass transition-all duration-300">
                  <ShoppingCart className="w-5 h-5" />
                </Link>
                <Link data-testid="nav-dashboard-link" to="/dashboard" className="hover:text-aged-brass transition-all duration-300">
                  <User className="w-5 h-5" />
                </Link>
                <Button
                  data-testid="nav-logout-button"
                  onClick={logout}
                  variant="ghost"
                  size="sm"
                  className="text-bg-light hover:text-aged-brass hover:bg-transparent"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </>
            ) : (
              <Link data-testid="nav-login-link" to="/login">
                <Button data-testid="nav-login-button" variant="outline" size="sm" className="border-aged-brass text-aged-brass hover:bg-aged-brass hover:text-polo-green">
                  LOGIN
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;