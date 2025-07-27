import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Filter, 
  SortAsc, 
  RefreshCw, 
  Grid3X3, 
  List,
  Search,
  X,
  ChevronDown
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import DealCard from './DealCard';

const DealsGrid = ({ 
  deals = [], 
  loading = false, 
  onLoadMore, 
  onRefresh, 
  onFilterChange,
  hasMore = true 
}) => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('fetched_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [filters, setFilters] = useState({
    category: '',
    minDiscount: '',
    maxPrice: '',
    primeOnly: false
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (loading || !hasMore) return;
    
    const scrollTop = document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;
    
    if (scrollTop + clientHeight >= scrollHeight - 1000) {
      onLoadMore?.();
    }
  }, [loading, hasMore, onLoadMore]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Filter and sort handlers
  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    onFilterChange?.({ sortBy: newSortBy, sortOrder });
  };

  const handleSortOrderChange = () => {
    const newOrder = sortOrder === 'DESC' ? 'ASC' : 'DESC';
    setSortOrder(newOrder);
    onFilterChange?.({ sortBy, sortOrder: newOrder });
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.({ ...newFilters, sortBy, sortOrder });
  };

  const clearFilters = () => {
    const clearedFilters = {
      category: '',
      minDiscount: '',
      maxPrice: '',
      primeOnly: false
    };
    setFilters(clearedFilters);
    setSearchQuery('');
    onFilterChange?.({ ...clearedFilters, sortBy, sortOrder });
  };

  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== '' && value !== false
  ).length + (searchQuery ? 1 : 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <section id="deals" className="py-16 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl lg:text-4xl font-bold mb-4"
          >
            Latest <span className="gradient-text">Amazon Deals</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Discover the best deals and discounts from Amazon.in, updated in real-time
          </motion.p>
        </div>

        {/* Controls Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-muted/30 rounded-2xl p-4 mb-8 space-y-4"
        >
          {/* Top Row - Search and View Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search deals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 w-6 h-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>

            {/* View and Action Controls */}
            <div className="flex items-center space-x-3">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-background rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="w-8 h-8 p-0"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="w-8 h-8 p-0"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>

              {/* Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={loading}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>

              {/* Filter Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2"
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
                <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="pt-4 border-t border-border/50 space-y-4">
                  {/* Sort Controls */}
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Sort by:</span>
                      <Select value={sortBy} onValueChange={handleSortChange}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fetched_at">Latest</SelectItem>
                          <SelectItem value="discount_percentage">Discount</SelectItem>
                          <SelectItem value="price">Price</SelectItem>
                          <SelectItem value="rating">Rating</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSortOrderChange}
                        className="w-8 h-8 p-0"
                      >
                        <SortAsc className={`w-4 h-4 transition-transform ${sortOrder === 'ASC' ? '' : 'rotate-180'}`} />
                      </Button>
                    </div>
                  </div>

                  {/* Filter Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Category</label>
                      <Input
                        type="text"
                        placeholder="e.g. Electronics"
                        value={filters.category}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Min Discount (%)</label>
                      <Input
                        type="number"
                        placeholder="e.g. 20"
                        value={filters.minDiscount}
                        onChange={(e) => handleFilterChange('minDiscount', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Max Price (₹)</label>
                      <Input
                        type="number"
                        placeholder="e.g. 5000"
                        value={filters.maxPrice}
                        onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      />
                    </div>

                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        onClick={clearFilters}
                        className="w-full"
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Deals Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}
        >
          <AnimatePresence>
            {deals.map((deal, index) => (
              <motion.div
                key={deal.id || index}
                variants={itemVariants}
                layout
                className={viewMode === 'list' ? 'max-w-4xl mx-auto' : ''}
              >
                <DealCard
                  deal={deal}
                  onCopyLink={(deal) => console.log('Copy link:', deal)}
                  onBuyNow={(deal) => window.open(deal.affiliateUrl || deal.productUrl, '_blank')}
                  onAddToWishlist={(deal) => console.log('Add to wishlist:', deal)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="flex items-center space-x-3">
              <RefreshCw className="w-5 h-5 animate-spin text-primary" />
              <span className="text-muted-foreground">Loading more deals...</span>
            </div>
          </div>
        )}

        {/* No More Deals */}
        {!loading && !hasMore && deals.length > 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">You've seen all the latest deals!</p>
            <Button
              variant="outline"
              onClick={onRefresh}
              className="mt-4"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh for new deals
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!loading && deals.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No deals found</h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your filters or search terms
            </p>
            <Button onClick={clearFilters}>
              Clear all filters
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default DealsGrid;

