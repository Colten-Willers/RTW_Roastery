import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Home = () => {
  return (
    <div data-testid="home-page" className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1735910626330-25ce60e05e84?crop=entropy&cs=srgb&fm=jpg&q=85)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-polo-green/90 via-polo-green/50 to-transparent"></div>
        </div>

        <div className="relative z-10 text-center px-6 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 data-testid="hero-title" className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold text-bg-light mb-6">
              Craft Your Legacy,
              <br />
              <span className="text-aged-brass">One Roast at a Time</span>
            </h1>
            <p data-testid="hero-subtitle" className="text-lg sm:text-xl text-bg-light/90 mb-12 max-w-2xl mx-auto leading-relaxed">
              Discover the art of personalized coffee. Choose your origin, roast level, grind size, and create a blend that's distinctly yours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/custom-builder">
                <Button data-testid="hero-cta-builder" size="lg" className="bg-aged-brass text-polo-green hover:bg-aged-brass/90 px-8 py-6 text-base tracking-wider font-medium">
                  BUILD YOUR BLEND
                  <Sparkles className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/products">
                <Button data-testid="hero-cta-explore" size="lg" variant="outline" className="border-2 border-bg-light text-bg-light hover:bg-bg-light hover:text-polo-green px-8 py-6 text-base tracking-wider font-medium">
                  EXPLORE COLLECTION
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-bg-paper">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl lg:text-5xl font-display font-bold text-polo-green text-center mb-16"
          >
            The Art of Customization
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                title: 'Select Your Origin',
                description: 'Choose from premium beans sourced from the finest coffee regions worldwide.',
                image: 'https://images.unsplash.com/photo-1573898086906-1f9232b65467?crop=entropy&cs=srgb&fm=jpg&q=85',
              },
              {
                title: 'Perfect Your Roast',
                description: 'Light, medium, or dark - customize the roast level to match your taste preferences.',
                image: 'https://images.unsplash.com/photo-1769437082791-8c9af44d7c28?crop=entropy&cs=srgb&fm=jpg&q=85',
              },
              {
                title: 'Craft Your Blend',
                description: 'Mix different beans to create a unique flavor profile that\'s entirely your own.',
                image: 'https://images.unsplash.com/photo-1670899603742-726393a354fc?crop=entropy&cs=srgb&fm=jpg&q=85',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="group"
              >
                <div className="relative overflow-hidden rounded-sm mb-6 h-64">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-polo-green/60 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                </div>
                <h3 className="text-2xl font-display font-semibold text-polo-green mb-4">{feature.title}</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="relative py-32 px-6 bg-polo-green text-center"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1687825807239-f880c177aea4?crop=entropy&cs=srgb&fm=jpg&q=85)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'overlay',
        }}
      >
        <div className="absolute inset-0 bg-polo-green/85"></div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-4xl lg:text-5xl font-display font-bold text-bg-light mb-6">
            Ready to Create Your Perfect Cup?
          </h2>
          <p className="text-lg text-bg-light/90 mb-8">
            Join thousands of coffee enthusiasts crafting their signature blends.
          </p>
          <Link to="/register">
            <Button data-testid="cta-get-started" size="lg" className="bg-aged-brass text-polo-green hover:bg-aged-brass/90 px-10 py-6 text-base tracking-wider font-medium">
              GET STARTED TODAY
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;