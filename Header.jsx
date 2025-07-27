import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Menu, X, User, ShoppingBag, TrendingUp, BookOpen } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

const Header = ({ onSearch, isAuthenticated, user, onLogin, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const navItems = [
    { name: 'Deals', href: '#deals', icon: ShoppingBag },
    { name: 'Price Tracker', href: '#tracker', icon: TrendingUp },
    { name: 'Blog', href: '#blog', icon: BookOpen },
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-2"
          >
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">Deal Galaxy</span>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <motion.a
                key={item.name}
                href={item.href}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-1 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </motion.a>
            ))}
          </nav>

          {/* Search Bar - Desktop */}
          <div className="hidden lg:flex items-center space-x-4 flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for deals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 w-full"
              />
            </form>
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium">
                    {user?.firstName || 'User'}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onLogout}
                  className="text-sm"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLogin}
                  className="text-sm"
                >
                  Login
                </Button>
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Search Bar */}
        <div className="lg:hidden pb-4">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for deals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 w-full"
            />
          </form>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden border-t bg-background"
        >
          <div className="container mx-auto px-4 py-4 space-y-4">
            {/* Mobile Navigation */}
            <nav className="space-y-3">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-3 text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </a>
              ))}
            </nav>

            {/* Mobile Auth */}
            <div className="pt-4 border-t space-y-3">
              {isAuthenticated ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium">
                      {user?.firstName || 'User'}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onLogout}
                    className="w-full"
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onLogin}
                    className="w-full"
                  >
                    Login
                  </Button>
                  <Button
                    size="sm"
                    className="w-full bg-primary hover:bg-primary/90 text-white"
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
};

export default Header;

