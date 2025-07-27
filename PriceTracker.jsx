import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Plus, 
  Target, 
  TrendingDown, 
  TrendingUp,
  Bell,
  X,
  ExternalLink,
  Trash2,
  RefreshCw,
  Filter,
  DollarSign
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const PriceTracker = ({ 
  isAuthenticated, 
  onLogin,
  trackedProducts = [],
  onTrackProduct,
  onRemoveProduct,
  onUpdateTargetPrice,
  onRefreshPrices,
  loading = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [targetPrice, setTargetPrice] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all', // all, target_reached, tracking
    sortBy: 'created_at'
  });

  // Mock search function - replace with actual API call
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock search results
      const mockResults = [
        {
          id: 1,
          title: `${query} - Sample Product 1`,
          price: 2999,
          originalPrice: 3999,
          imageUrl: '/placeholder-product.jpg',
          productUrl: 'https://amazon.in/sample-1',
          rating: 4.2,
          reviewCount: 1250
        },
        {
          id: 2,
          title: `${query} - Sample Product 2`,
          price: 1599,
          originalPrice: 2199,
          imageUrl: '/placeholder-product.jpg',
          productUrl: 'https://amazon.in/sample-2',
          rating: 4.5,
          reviewCount: 890
        }
      ];
      
      setSearchResults(mockResults);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleTrackProduct = (product) => {
    if (!isAuthenticated) {
      onLogin?.();
      return;
    }

    const trackingData = {
      ...product,
      targetPrice: targetPrice ? parseFloat(targetPrice) : null
    };

    onTrackProduct?.(trackingData);
    setTargetPrice('');
    setSearchQuery('');
    setSearchResults([]);
    setShowAddForm(false);
  };

  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const getStatusBadge = (product) => {
    if (product.targetPrice && product.currentPrice <= product.targetPrice) {
      return <Badge className="bg-green-500 text-white">Target Reached</Badge>;
    }
    return <Badge variant="secondary">Tracking</Badge>;
  };

  const getPriceChangeIcon = (product) => {
    // This would compare with previous price in real implementation
    const isDown = Math.random() > 0.5; // Mock price change
    return isDown ? (
      <TrendingDown className="w-4 h-4 text-green-500" />
    ) : (
      <TrendingUp className="w-4 h-4 text-red-500" />
    );
  };

  const filteredProducts = trackedProducts.filter(product => {
    if (filters.status === 'target_reached') {
      return product.targetPrice && product.currentPrice <= product.targetPrice;
    }
    if (filters.status === 'tracking') {
      return !product.targetPrice || product.currentPrice > product.targetPrice;
    }
    return true;
  });

  return (
    <section id="tracker" className="py-16 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl lg:text-4xl font-bold mb-4"
          >
            <span className="gradient-text">Price Tracker</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Track your favorite products and get notified when prices drop
          </motion.p>
        </div>

        {!isAuthenticated ? (
          /* Login Prompt */
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Target className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Start Tracking Prices</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Sign in to track your favorite products and get alerts when prices drop to your target
            </p>
            <Button onClick={onLogin} size="lg" className="bg-primary hover:bg-primary/90 text-white">
              Sign In to Track Prices
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {/* Add Product Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Plus className="w-5 h-5" />
                    <span>Track New Product</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search Bar */}
                  <div className="flex space-x-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search for products or paste Amazon URL..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          handleSearch(e.target.value);
                        }}
                        className="pl-10"
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowAddForm(!showAddForm)}
                    >
                      {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </Button>
                  </div>

                  {/* Target Price Input */}
                  <AnimatePresence>
                    {showAddForm && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex items-center space-x-3 pt-4 border-t">
                          <div className="relative flex-1">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              type="number"
                              placeholder="Target price (optional)"
                              value={targetPrice}
                              onChange={(e) => setTargetPrice(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            Get notified when price drops below this amount
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Search Results */}
                  <AnimatePresence>
                    {searchResults.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="space-y-3 pt-4 border-t"
                      >
                        <h4 className="font-medium">Search Results</h4>
                        {searchResults.map((product) => (
                          <div
                            key={product.id}
                            className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg"
                          >
                            <img
                              src={product.imageUrl}
                              alt={product.title}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                            <div className="flex-1">
                              <h5 className="font-medium line-clamp-2">{product.title}</h5>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="font-bold text-primary">
                                  {formatPrice(product.price)}
                                </span>
                                {product.originalPrice > product.price && (
                                  <span className="text-sm text-muted-foreground line-through">
                                    {formatPrice(product.originalPrice)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              onClick={() => handleTrackProduct(product)}
                              size="sm"
                              className="bg-primary hover:bg-primary/90 text-white"
                            >
                              <Target className="w-4 h-4 mr-1" />
                              Track
                            </Button>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {searchLoading && (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="w-5 h-5 animate-spin text-primary mr-2" />
                      <span>Searching products...</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Tracked Products */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <Bell className="w-5 h-5" />
                      <span>Tracked Products ({filteredProducts.length})</span>
                    </CardTitle>
                    <div className="flex items-center space-x-3">
                      <Select
                        value={filters.status}
                        onValueChange={(value) => setFilters({ ...filters, status: value })}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Products</SelectItem>
                          <SelectItem value="target_reached">Target Reached</SelectItem>
                          <SelectItem value="tracking">Tracking</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onRefreshPrices}
                        disabled={loading}
                      >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredProducts.length === 0 ? (
                    <div className="text-center py-12">
                      <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No products tracked yet</h3>
                      <p className="text-muted-foreground">
                        Start tracking products to monitor price changes
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredProducts.map((product) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center space-x-4 p-4 bg-background rounded-lg border"
                        >
                          <img
                            src={product.imageUrl}
                            alt={product.title}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium line-clamp-2 mb-2">{product.title}</h4>
                            <div className="flex items-center space-x-4 mb-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-muted-foreground">Current:</span>
                                <span className="font-bold text-lg">
                                  {formatPrice(product.currentPrice)}
                                </span>
                                {getPriceChangeIcon(product)}
                              </div>
                              {product.targetPrice && (
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-muted-foreground">Target:</span>
                                  <span className="font-medium">
                                    {formatPrice(product.targetPrice)}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-3">
                              {getStatusBadge(product)}
                              <span className="text-xs text-muted-foreground">
                                Last checked: {new Date(product.lastChecked).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(product.productUrl, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onRemoveProduct?.(product.id)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </div>
    </section>
  );
};

export default PriceTracker;

