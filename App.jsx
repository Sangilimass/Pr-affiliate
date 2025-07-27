import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './App.css';

// Contexts
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Services
import apiService from './services/api';

// Components
import Header from './components/Header';
import Hero from './components/Hero';
import MetricsBar from './components/MetricsBar';
import DealsGrid from './components/DealsGrid';
import PriceTracker from './components/PriceTracker';
import Footer from './components/Footer';
import LoginModal from './components/auth/LoginModal';
import RegisterModal from './components/auth/RegisterModal';

// Main App Content Component
const AppContent = () => {
  const [deals, setDeals] = useState([]);
  const [trackedProducts, setTrackedProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const { user, isAuthenticated, logout } = useAuth();

  // Load initial data
  useEffect(() => {
    loadDeals();
    if (isAuthenticated) {
      loadTrackedProducts();
    }
  }, [isAuthenticated]);

  // Load deals from API
  const loadDeals = async (params = {}) => {
    setLoading(true);
    try {
      const response = await apiService.getDeals(params);
      if (params.page && params.page > 1) {
        setDeals(prev => [...prev, ...response.deals]);
      } else {
        setDeals(response.deals || []);
      }
      setHasMore(response.hasMore || false);
    } catch (error) {
      console.error('Failed to load deals:', error);
      // Use mock data as fallback
      setDeals(mockDeals);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  // Load tracked products
  const loadTrackedProducts = async () => {
    try {
      const products = await apiService.getTrackedProducts();
      setTrackedProducts(products || []);
    } catch (error) {
      console.error('Failed to load tracked products:', error);
      setTrackedProducts([]);
    }
  };

  // Handle loading more deals
  const handleLoadMore = async () => {
    if (loading || !hasMore) return;
    
    const currentPage = Math.floor(deals.length / 20) + 1;
    await loadDeals({ page: currentPage + 1, limit: 20 });
  };

  // Handle refreshing deals
  const handleRefreshDeals = async () => {
    await loadDeals({ page: 1, limit: 20 });
  };

  // Handle deal filtering
  const handleFilterChange = async (filters) => {
    await loadDeals({ ...filters, page: 1, limit: 20 });
  };

  // Handle search
  const handleSearch = async (query) => {
    if (!query.trim()) {
      await loadDeals();
      return;
    }
    
    try {
      setLoading(true);
      const response = await apiService.searchDeals(query);
      setDeals(response.deals || []);
      setHasMore(false);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Authentication handlers
  const handleLogin = () => {
    setShowLoginModal(true);
  };

  const handleLogout = async () => {
    await logout();
    setTrackedProducts([]);
  };

  // Price tracking handlers
  const handleTrackProduct = async (product) => {
    try {
      const newProduct = await apiService.addProductToTrack(product);
      setTrackedProducts(prev => [...prev, newProduct]);
    } catch (error) {
      console.error('Failed to track product:', error);
    }
  };

  const handleRemoveProduct = async (productId) => {
    try {
      await apiService.removeTrackedProduct(productId);
      setTrackedProducts(prev => prev.filter(p => p.id !== productId));
    } catch (error) {
      console.error('Failed to remove product:', error);
    }
  };

  const handleRefreshPrices = async () => {
    try {
      setLoading(true);
      await apiService.refreshProductPrices();
      await loadTrackedProducts();
    } catch (error) {
      console.error('Failed to refresh prices:', error);
    } finally {
      setLoading(false);
    }
  };

  // Hero action handlers
  const handleGetStarted = () => {
    if (!isAuthenticated) {
      handleLogin();
    }
    // Scroll to deals section
    document.getElementById('deals')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSeeDemo = () => {
    // Scroll to price tracker section
    document.getElementById('tracker')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Modal handlers
  const handleSwitchToRegister = () => {
    setShowLoginModal(false);
    setShowRegisterModal(true);
  };

  const handleSwitchToLogin = () => {
    setShowRegisterModal(false);
    setShowLoginModal(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header
        onSearch={handleSearch}
        isAuthenticated={isAuthenticated}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <Hero
          onGetStarted={handleGetStarted}
          onSeeDemo={handleSeeDemo}
        />

        {/* Metrics Bar */}
        <MetricsBar />

        {/* Deals Grid */}
        <DealsGrid
          deals={deals}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          onRefresh={handleRefreshDeals}
          onFilterChange={handleFilterChange}
        />

        {/* Price Tracker */}
        <PriceTracker
          isAuthenticated={isAuthenticated}
          onLogin={handleLogin}
          trackedProducts={trackedProducts}
          onTrackProduct={handleTrackProduct}
          onRemoveProduct={handleRemoveProduct}
          onRefreshPrices={handleRefreshPrices}
          loading={loading}
        />
      </main>

      {/* Footer */}
      <Footer />

      {/* Authentication Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToRegister={handleSwitchToRegister}
      />

      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSwitchToLogin={handleSwitchToLogin}
      />

      {/* Loading Overlay */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 flex items-center justify-center"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-lg font-medium">Loading...</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Mock data for fallback
const mockDeals = [
  {
    id: 1,
    asin: 'B08N5WRWNW',
    title: 'Echo Dot (4th Gen) | Smart speaker with Alexa | Charcoal',
    price: 2999,
    originalPrice: 4499,
    discountPercentage: 33,
    imageUrl: '/placeholder-product.jpg',
    productUrl: 'https://amazon.in/echo-dot-4th-gen',
    affiliateUrl: 'https://amazon.in/echo-dot-4th-gen?tag=sangili428203-21',
    category: 'Electronics',
    rating: 4.3,
    reviewCount: 15420,
    availability: 'In Stock',
    primeEligible: true,
    dealType: 'deal_of_day',
    fetchedAt: new Date().toISOString()
  },
  {
    id: 2,
    asin: 'B08CFSZLQ4',
    title: 'Fire TV Stick 4K Max streaming device, Wi-Fi 6, Alexa Voice Remote',
    price: 4999,
    originalPrice: 6999,
    discountPercentage: 29,
    imageUrl: '/placeholder-product.jpg',
    productUrl: 'https://amazon.in/fire-tv-stick-4k-max',
    affiliateUrl: 'https://amazon.in/fire-tv-stick-4k-max?tag=sangili428203-21',
    category: 'Electronics',
    rating: 4.5,
    reviewCount: 8930,
    availability: 'In Stock',
    primeEligible: true,
    dealType: 'lightning',
    fetchedAt: new Date().toISOString()
  },
  {
    id: 3,
    asin: 'B07HGJKJL2',
    title: 'Instant Pot Duo 7-in-1 Electric Pressure Cooker, 6 Quart',
    price: 8999,
    originalPrice: 12999,
    discountPercentage: 31,
    imageUrl: '/placeholder-product.jpg',
    productUrl: 'https://amazon.in/instant-pot-duo-pressure-cooker',
    affiliateUrl: 'https://amazon.in/instant-pot-duo-pressure-cooker?tag=sangili428203-21',
    category: 'Home & Kitchen',
    rating: 4.6,
    reviewCount: 5670,
    availability: 'In Stock',
    primeEligible: true,
    dealType: 'coupon',
    fetchedAt: new Date().toISOString()
  },
  {
    id: 4,
    asin: 'B08GYKNCCP',
    title: 'Apple AirPods Pro (2nd Generation) with MagSafe Case',
    price: 21999,
    originalPrice: 24900,
    discountPercentage: 12,
    imageUrl: '/placeholder-product.jpg',
    productUrl: 'https://amazon.in/apple-airpods-pro-2nd-gen',
    affiliateUrl: 'https://amazon.in/apple-airpods-pro-2nd-gen?tag=sangili428203-21',
    category: 'Electronics',
    rating: 4.7,
    reviewCount: 12340,
    availability: 'In Stock',
    primeEligible: true,
    dealType: 'deal',
    fetchedAt: new Date().toISOString()
  }
];

// Main App Component with Provider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

