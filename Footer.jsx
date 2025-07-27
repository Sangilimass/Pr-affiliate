import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, 
  Mail, 
  Phone, 
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Heart,
  ExternalLink
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { name: 'About Us', href: '#about' },
      { name: 'How It Works', href: '#how-it-works' },
      { name: 'Careers', href: '#careers' },
      { name: 'Press', href: '#press' }
    ],
    support: [
      { name: 'Help Center', href: '#help' },
      { name: 'Contact Us', href: '#contact' },
      { name: 'FAQ', href: '#faq' },
      { name: 'Live Chat', href: '#chat' }
    ],
    legal: [
      { name: 'Privacy Policy', href: '#privacy' },
      { name: 'Terms of Service', href: '#terms' },
      { name: 'Affiliate Disclosure', href: '#affiliate' },
      { name: 'Cookie Policy', href: '#cookies' }
    ],
    features: [
      { name: 'Price Tracking', href: '#tracker' },
      { name: 'Deal Alerts', href: '#alerts' },
      { name: 'Wishlist', href: '#wishlist' },
      { name: 'Mobile App', href: '#app' }
    ]
  };

  const socialLinks = [
    { name: 'Facebook', icon: Facebook, href: '#facebook', color: 'hover:text-blue-600' },
    { name: 'Twitter', icon: Twitter, href: '#twitter', color: 'hover:text-blue-400' },
    { name: 'Instagram', icon: Instagram, href: '#instagram', color: 'hover:text-pink-600' },
    { name: 'YouTube', icon: Youtube, href: '#youtube', color: 'hover:text-red-600' }
  ];

  return (
    <footer className="bg-background border-t border-border">
      {/* Newsletter Section */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h3 className="text-2xl font-bold mb-4">
              Never Miss a <span className="gradient-text">Great Deal</span>
            </h3>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Subscribe to our newsletter and get the best deals delivered straight to your inbox. 
              Plus, get exclusive access to flash sales and early bird offers.
            </p>
            
            <div className="flex flex-col sm:flex-row max-w-md mx-auto space-y-3 sm:space-y-0 sm:space-x-3">
              <Input
                type="email"
                placeholder="Enter your email address"
                className="flex-1"
              />
              <Button className="bg-primary hover:bg-primary/90 text-white px-8">
                Subscribe
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground mt-4">
              By subscribing, you agree to our Privacy Policy and consent to receive updates from our company.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2"
          >
            <div className="flex items-center space-x-2 mb-6">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">Deal Galaxy</span>
            </div>
            
            <p className="text-muted-foreground mb-6 max-w-sm">
              Your ultimate destination for discovering and tracking the best Amazon deals. 
              Save money, time, and never miss a great offer again.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <Mail className="w-4 h-4 text-primary" />
                <span>support@dealgalaxy.com</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Phone className="w-4 h-4 text-primary" />
                <span>+91 (800) 123-4567</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Mumbai, Maharashtra, India</span>
              </div>
            </div>
          </motion.div>

          {/* Links Sections */}
          {Object.entries(footerLinks).map(([category, links], index) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <h4 className="font-semibold text-foreground mb-4 capitalize">
                {category === 'company' ? 'Company' : 
                 category === 'support' ? 'Support' :
                 category === 'legal' ? 'Legal' : 'Features'}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center group"
                    >
                      <span>{link.name}</span>
                      <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Social Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 pt-8 border-t border-border"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
            {/* Social Icons */}
            <div className="flex items-center space-x-6">
              <span className="text-sm font-medium text-muted-foreground">Follow us:</span>
              <div className="flex items-center space-x-4">
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.name}
                    href={social.href}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-10 h-10 bg-muted/50 rounded-full flex items-center justify-center text-muted-foreground transition-colors ${social.color}`}
                  >
                    <social.icon className="w-5 h-5" />
                  </motion.a>
                ))}
              </div>
            </div>

            {/* App Download Badges */}
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-muted-foreground">Get the app:</span>
              <div className="flex space-x-3">
                <Button variant="outline" size="sm" className="h-10">
                  <img src="/app-store-badge.png" alt="Download on App Store" className="h-6" />
                </Button>
                <Button variant="outline" size="sm" className="h-10">
                  <img src="/google-play-badge.png" alt="Get it on Google Play" className="h-6" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0"
          >
            {/* Copyright */}
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>© {currentYear} Deal Galaxy. All rights reserved.</span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <span>Made with</span>
                <Heart className="w-4 h-4 text-red-500 fill-current" />
                <span>in India</span>
              </span>
            </div>

            {/* Affiliate Disclosure */}
            <div className="text-xs text-muted-foreground max-w-md lg:text-right">
              <strong>Affiliate Disclosure:</strong> Deal Galaxy is a participant in the Amazon Associates Program. 
              We may earn a commission from qualifying purchases made through our affiliate links.
            </div>
          </motion.div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

