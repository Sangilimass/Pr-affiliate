import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ExternalLink, 
  Copy, 
  Star, 
  Clock, 
  Badge, 
  Zap,
  Check,
  Heart,
  Share2
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge as UIBadge } from './ui/badge';

const DealCard = ({ deal, onCopyLink, onBuyNow, onAddToWishlist }) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(deal.affiliateUrl || deal.productUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      onCopyLink?.(deal);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    onAddToWishlist?.(deal);
  };

  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const now = new Date();
    const fetchTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - fetchTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getDealTypeColor = (dealType) => {
    switch (dealType?.toLowerCase()) {
      case 'lightning': return 'bg-red-500';
      case 'deal_of_day': return 'bg-primary';
      case 'coupon': return 'bg-green-500';
      default: return 'bg-blue-500';
    }
  };

  const getDealTypeIcon = (dealType) => {
    switch (dealType?.toLowerCase()) {
      case 'lightning': return Zap;
      case 'deal_of_day': return Badge;
      default: return Badge;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
      className="group relative bg-background border border-border rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl card-hover shine-effect"
    >
      {/* Deal Type Badge */}
      {deal.dealType && (
        <div className="absolute top-3 left-3 z-10">
          <UIBadge className={`${getDealTypeColor(deal.dealType)} text-white border-0 text-xs font-semibold`}>
            {React.createElement(getDealTypeIcon(deal.dealType), { className: "w-3 h-3 mr-1" })}
            {deal.dealType.replace('_', ' ').toUpperCase()}
          </UIBadge>
        </div>
      )}

      {/* Wishlist Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleWishlist}
        className="absolute top-3 right-3 z-10 w-8 h-8 p-0 bg-background/80 backdrop-blur-sm hover:bg-background/90"
      >
        <Heart 
          className={`w-4 h-4 transition-colors ${
            isWishlisted ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
          }`} 
        />
      </Button>

      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-muted/30">
        {!isImageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-muted/30 animate-pulse" />
        )}
        <img
          src={deal.imageUrl || '/placeholder-product.jpg'}
          alt={deal.title}
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${
            isImageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setIsImageLoaded(true)}
          onError={(e) => {
            e.target.src = '/placeholder-product.jpg';
            setIsImageLoaded(true);
          }}
        />
        
        {/* Discount Badge */}
        {deal.discountPercentage > 0 && (
          <div className="absolute bottom-3 left-3">
            <div className="bg-red-500 text-white px-2 py-1 rounded-lg text-sm font-bold">
              -{deal.discountPercentage}%
            </div>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {deal.title}
        </h3>

        {/* Price Section */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-primary">
              {formatPrice(deal.price)}
            </span>
            {deal.originalPrice && deal.originalPrice > deal.price && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(deal.originalPrice)}
              </span>
            )}
          </div>
          
          {deal.originalPrice && deal.originalPrice > deal.price && (
            <div className="text-xs text-green-600 font-medium">
              You save {formatPrice(deal.originalPrice - deal.price)}
            </div>
          )}
        </div>

        {/* Rating and Reviews */}
        {deal.rating && (
          <div className="flex items-center space-x-2 text-xs">
            <div className="flex items-center space-x-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{deal.rating}</span>
            </div>
            {deal.reviewCount && (
              <span className="text-muted-foreground">
                ({deal.reviewCount.toLocaleString()} reviews)
              </span>
            )}
          </div>
        )}

        {/* Prime Badge */}
        {deal.primeEligible && (
          <div className="flex items-center space-x-1">
            <UIBadge variant="secondary" className="text-xs">
              <Zap className="w-3 h-3 mr-1" />
              Prime
            </UIBadge>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <Button
            size="sm"
            onClick={() => onBuyNow?.(deal)}
            className="flex-1 bg-primary hover:bg-primary/90 text-white font-medium"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Buy Now
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="px-3"
          >
            {isCopied ? (
              <Check className="w-3 h-3 text-green-500" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="px-3"
          >
            <Share2 className="w-3 h-3" />
          </Button>
        </div>

        {/* Last Fetched */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>Last fetched {formatTimeAgo(deal.fetchedAt)}</span>
          </div>
          
          {deal.availability && (
            <span className={`font-medium ${
              deal.availability.toLowerCase().includes('stock') ? 'text-green-600' : 'text-red-600'
            }`}>
              {deal.availability}
            </span>
          )}
        </div>
      </div>

      {/* Hover overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </motion.div>
  );
};

export default DealCard;

