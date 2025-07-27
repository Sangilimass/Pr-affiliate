import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Sparkles, Zap, Target } from 'lucide-react';
import { Button } from './ui/button';

const Hero = ({ onGetStarted, onSeeDemo }) => {
  const floatingShapes = [
    { id: 1, size: 'w-20 h-20', position: 'top-20 left-10', delay: 0 },
    { id: 2, size: 'w-16 h-16', position: 'top-40 right-20', delay: 0.5 },
    { id: 3, size: 'w-24 h-24', position: 'bottom-32 left-20', delay: 1 },
    { id: 4, size: 'w-12 h-12', position: 'bottom-20 right-10', delay: 1.5 },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      {/* Animated Background Shapes */}
      {floatingShapes.map((shape) => (
        <motion.div
          key={shape.id}
          className={`absolute ${shape.size} ${shape.position} glassmorphism rounded-full opacity-20`}
          initial={{ scale: 0, rotate: 0 }}
          animate={{ 
            scale: [1, 1.2, 1], 
            rotate: [0, 180, 360],
            y: [0, -20, 0]
          }}
          transition={{
            duration: 8,
            delay: shape.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}

      {/* Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-5xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-8"
          >
            <Sparkles className="w-4 h-4" />
            <span>New: Real-time price tracking now available!</span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight mb-6"
          >
            <span className="block">Discover & Track the</span>
            <span className="block gradient-text">Hottest Amazon Deals</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg sm:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed"
          >
            Never miss a great deal again. Track prices, get alerts, and save money 
            on millions of products from Amazon.in with our intelligent deal finder.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-16"
          >
            <Button
              size="lg"
              onClick={onGetStarted}
              className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={onSeeDemo}
              className="px-8 py-4 text-lg font-semibold rounded-xl border-2 hover:bg-muted/50 transition-all duration-300 group"
            >
              <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              <span>See Demo</span>
            </Button>
          </motion.div>

          {/* Feature Highlights */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto"
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Real-time Tracking</h3>
              <p className="text-muted-foreground text-sm">
                Get instant notifications when prices drop on your favorite products
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Target className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Smart Alerts</h3>
              <p className="text-muted-foreground text-sm">
                Set target prices and get alerted when deals match your budget
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Best Deals</h3>
              <p className="text-muted-foreground text-sm">
                Discover handpicked deals with the highest discounts and savings
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1 h-3 bg-muted-foreground/50 rounded-full mt-2"
          />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;

