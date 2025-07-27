import React from 'react';
import { motion } from 'framer-motion';
import { Building2, Users, DollarSign, TrendingUp } from 'lucide-react';

const MetricsBar = () => {
  const metrics = [
    {
      icon: Building2,
      value: '200+',
      label: 'Brands',
      description: 'Top brands tracked',
      color: 'text-blue-500'
    },
    {
      icon: Users,
      value: '97%',
      label: 'Happy Users',
      description: 'Customer satisfaction',
      color: 'text-green-500'
    },
    {
      icon: DollarSign,
      value: '₹3M+',
      label: 'Savings',
      description: 'Total user savings',
      color: 'text-primary'
    },
    {
      icon: TrendingUp,
      value: '50K+',
      label: 'Deals Tracked',
      description: 'Active price tracking',
      color: 'text-purple-500'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {metrics.map((metric, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ 
                scale: 1.05,
                transition: { duration: 0.2 }
              }}
              className="text-center group"
            >
              <div className="relative">
                {/* Background glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Card content */}
                <div className="relative bg-background/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-lg group-hover:shadow-xl transition-all duration-300">
                  {/* Icon */}
                  <div className="flex justify-center mb-4">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-background to-muted flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
                      <metric.icon className={`w-8 h-8 ${metric.color} group-hover:scale-110 transition-transform duration-300`} />
                    </div>
                  </div>

                  {/* Value */}
                  <motion.div
                    initial={{ scale: 1 }}
                    whileInView={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="mb-2"
                  >
                    <span className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                      {metric.value}
                    </span>
                  </motion.div>

                  {/* Label */}
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {metric.label}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground">
                    {metric.description}
                  </p>

                  {/* Animated underline */}
                  <div className="mt-4 h-1 bg-gradient-to-r from-primary to-accent rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Additional stats row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center space-x-8 bg-background/60 backdrop-blur-sm border border-border/50 rounded-full px-8 py-4 shadow-lg">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-muted-foreground">
                Live tracking active
              </span>
            </div>
            <div className="w-px h-6 bg-border" />
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-muted-foreground">
                Updated every 5 minutes
              </span>
            </div>
            <div className="w-px h-6 bg-border" />
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-muted-foreground">
                99.9% uptime
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MetricsBar;

