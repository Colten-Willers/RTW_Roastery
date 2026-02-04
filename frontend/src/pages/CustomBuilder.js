import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';
import { AuthContext } from '@/App';
import { toast } from 'sonner';
import { Coffee, Sparkles, ShoppingCart } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CustomBuilder = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [blend, setBlend] = useState(() => {
    // Load from localStorage if exists
    const saved = localStorage.getItem('pendingBlend');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return {
          name: '',
          brewing_method: 'espresso',
          origin: 'ethiopian',
          roast_level: 'medium',
          grind_size: 'fine',
          blend_components: { ethiopian: 100 },
          quantity: 500,
        };
      }
    }
    return {
      name: '',
      brewing_method: 'espresso',
      origin: 'ethiopian',
      roast_level: 'medium',
      grind_size: 'fine',
      blend_components: { ethiopian: 100 },
      quantity: 500,
    };
  });

  // Save blend to localStorage whenever it changes
  useEffect(() => {
    if (blend.name || step > 1) {
      localStorage.setItem('pendingBlend', JSON.stringify(blend));
    }
  }, [blend, step]);

  // Update grind size based on brewing method
  useEffect(() => {
    const grindRecommendations = {
      espresso: 'fine',
      aeropress: 'fine',
      pour_over: 'medium',
      drip: 'medium',
      french_press: 'coarse',
      cold_brew: 'coarse',
    };
    
    if (blend.brewing_method && step === 1) {
      setBlend(prev => ({
        ...prev,
        grind_size: grindRecommendations[prev.brewing_method] || 'medium'
      }));
    }
  }, [blend.brewing_method]);

  const brewingMethods = [
    { 
      value: 'espresso', 
      label: 'Espresso', 
      icon: '☕', 
      description: 'Rich, concentrated shot',
      grind: 'Fine',
      roast: 'Medium to Dark'
    },
    { 
      value: 'pour_over', 
      label: 'Pour Over', 
      icon: '🫗', 
      description: 'Clean, nuanced flavors',
      grind: 'Medium',
      roast: 'Light to Medium'
    },
    { 
      value: 'french_press', 
      label: 'French Press', 
      icon: '🫖', 
      description: 'Full-bodied, bold',
      grind: 'Coarse',
      roast: 'Medium to Dark'
    },
    { 
      value: 'aeropress', 
      label: 'AeroPress', 
      icon: '💨', 
      description: 'Smooth, versatile',
      grind: 'Fine to Medium',
      roast: 'Any'
    },
    { 
      value: 'drip', 
      label: 'Drip Coffee', 
      icon: '☕', 
      description: 'Classic, consistent',
      grind: 'Medium',
      roast: 'Medium'
    },
    { 
      value: 'cold_brew', 
      label: 'Cold Brew', 
      icon: '🧊', 
      description: 'Smooth, sweet',
      grind: 'Coarse',
      roast: 'Medium to Dark'
    },
  ];

  const origins = [
    { value: 'ethiopian', label: 'Ethiopian', description: 'Floral & Citrus' },
    { value: 'colombian', label: 'Colombian', description: 'Balanced & Sweet' },
    { value: 'costa_rican', label: 'Costa Rican', description: 'Crisp & Honey' },
    { value: 'brazilian', label: 'Brazilian', description: 'Nutty & Chocolate' },
  ];

  const roastLevels = [
    { value: 'light', label: 'Light Roast', description: 'Bright & Acidic' },
    { value: 'medium', label: 'Medium Roast', description: 'Balanced & Smooth' },
    { value: 'dark', label: 'Dark Roast', description: 'Bold & Rich' },
  ];

  const grindSizes = [
    { value: 'whole_bean', label: 'Whole Bean', icon: '○' },
    { value: 'coarse', label: 'Coarse', icon: '●●●' },
    { value: 'medium', label: 'Medium', icon: '●●' },
    { value: 'fine', label: 'Fine', icon: '●' },
  ];

  const handleSaveBlend = async () => {
    if (!blend.name) {
      toast.error('Please enter a name for your blend');
      return;
    }

    if (!user) {
      // Save blend and redirect to login
      localStorage.setItem('pendingBlend', JSON.stringify(blend));
      toast.info('Please sign in to save your blend');
      navigate('/login?redirect=custom-builder');
      return;
    }

    try {
      const response = await axios.post(`${API}/custom-blends`, blend);
      toast.success('Blend saved successfully!');
      
      // Add to cart
      await axios.post(`${API}/cart`, {
        custom_blend_id: response.data.id,
        quantity: 1,
      });
      
      // Clear pending blend
      localStorage.removeItem('pendingBlend');
      
      toast.success('Added to cart!');
      navigate('/cart');
    } catch (error) {
      console.error('Error saving blend:', error);
      toast.error('Failed to save blend');
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-display font-bold text-polo-green mb-8">How Will You Brew?</h2>
            <p className="text-[var(--text-secondary)] mb-6">
              Choose your brewing method and we'll recommend the perfect grind size and roast level.
            </p>
            <RadioGroup
              value={blend.brewing_method}
              onValueChange={(value) => setBlend({ ...blend, brewing_method: value })}
              className="grid md:grid-cols-2 gap-4"
            >
              {brewingMethods.map((method) => (
                <Label
                  key={method.value}
                  htmlFor={method.value}
                  className={`cursor-pointer border-2 rounded-sm p-6 transition-all duration-300 ${
                    blend.brewing_method === method.value
                      ? 'border-aged-brass bg-aged-brass/10'
                      : 'border-gray-200 hover:border-aged-brass/50'
                  }`}
                >
                  <RadioGroupItem value={method.value} id={method.value} className="sr-only" />
                  <div className="flex items-start">
                    <span className="text-4xl mr-4">{method.icon}</span>
                    <div className="flex-1">
                      <h3 className="text-xl font-display font-semibold text-polo-green mb-1">{method.label}</h3>
                      <p className="text-sm text-[var(--text-secondary)] mb-2">{method.description}</p>
                      <div className="text-xs text-aged-brass font-medium">
                        Grind: {method.grind} • Roast: {method.roast}
                      </div>
                    </div>
                  </div>
                </Label>
              ))}
            </RadioGroup>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-display font-bold text-polo-green mb-8">Choose Your Origin</h2>
            <RadioGroup
              value={blend.origin}
              onValueChange={(value) => setBlend({ ...blend, origin: value })}
              className="grid md:grid-cols-2 gap-4"
            >
              {origins.map((origin) => (
                <Label
                  key={origin.value}
                  htmlFor={origin.value}
                  className={`cursor-pointer border-2 rounded-sm p-6 transition-all duration-300 ${
                    blend.origin === origin.value
                      ? 'border-aged-brass bg-aged-brass/10'
                      : 'border-gray-200 hover:border-aged-brass/50'
                  }`}
                >
                  <RadioGroupItem value={origin.value} id={origin.value} className="sr-only" />
                  <div>
                    <h3 className="text-xl font-display font-semibold text-polo-green mb-1">{origin.label}</h3>
                    <p className="text-[var(--text-secondary)]">{origin.description}</p>
                  </div>
                </Label>
              ))}
            </RadioGroup>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-display font-bold text-polo-green mb-8">Select Roast Level</h2>
            <RadioGroup
              value={blend.roast_level}
              onValueChange={(value) => setBlend({ ...blend, roast_level: value })}
              className="space-y-4"
            >
              {roastLevels.map((roast) => (
                <Label
                  key={roast.value}
                  htmlFor={roast.value}
                  className={`cursor-pointer border-2 rounded-sm p-6 transition-all duration-300 flex items-center ${
                    blend.roast_level === roast.value
                      ? 'border-aged-brass bg-aged-brass/10'
                      : 'border-gray-200 hover:border-aged-brass/50'
                  }`}
                >
                  <RadioGroupItem value={roast.value} id={roast.value} className="sr-only" />
                  <div className="flex-1">
                    <h3 className="text-xl font-display font-semibold text-polo-green mb-1">{roast.label}</h3>
                    <p className="text-[var(--text-secondary)]">{roast.description}</p>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-full ${
                      roast.value === 'light'
                        ? 'bg-amber-300'
                        : roast.value === 'medium'
                        ? 'bg-amber-700'
                        : 'bg-amber-950'
                    }`}
                  ></div>
                </Label>
              ))}
            </RadioGroup>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-display font-bold text-polo-green mb-8">Choose Grind Size</h2>
            <RadioGroup
              value={blend.grind_size}
              onValueChange={(value) => setBlend({ ...blend, grind_size: value })}
              className="grid md:grid-cols-2 gap-4"
            >
              {grindSizes.map((grind) => (
                <Label
                  key={grind.value}
                  htmlFor={grind.value}
                  className={`cursor-pointer border-2 rounded-sm p-6 transition-all duration-300 ${
                    blend.grind_size === grind.value
                      ? 'border-aged-brass bg-aged-brass/10'
                      : 'border-gray-200 hover:border-aged-brass/50'
                  }`}
                >
                  <RadioGroupItem value={grind.value} id={grind.value} className="sr-only" />
                  <div className="text-center">
                    <div className="text-3xl mb-2">{grind.icon}</div>
                    <h3 className="text-xl font-display font-semibold text-polo-green">{grind.label}</h3>
                  </div>
                </Label>
              ))}
            </RadioGroup>
          </motion.div>
        );

      case 5:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-display font-bold text-polo-green mb-8">Quantity & Name</h2>
            <div className="space-y-6">
              <div>
                <Label className="text-lg font-medium text-polo-green mb-3 block">
                  Quantity: {blend.quantity}g
                </Label>
                <Slider
                  value={[blend.quantity]}
                  onValueChange={(value) => setBlend({ ...blend, quantity: value[0] })}
                  min={250}
                  max={1000}
                  step={250}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-[var(--text-secondary)] mt-2">
                  <span>250g</span>
                  <span>500g</span>
                  <span>750g</span>
                  <span>1000g</span>
                </div>
              </div>

              <div>
                <Label htmlFor="blend-name" className="text-lg font-medium text-polo-green mb-3 block">
                  Name Your Blend
                </Label>
                <Input
                  id="blend-name"
                  data-testid="blend-name-input"
                  placeholder="e.g., Morning Ritual"
                  value={blend.name}
                  onChange={(e) => setBlend({ ...blend, name: e.target.value })}
                  className="border-polo-green/30 focus:border-aged-brass"
                />
              </div>

              <Card className="p-6 bg-bg-paper border-aged-brass/30">
                <h3 className="text-xl font-display font-semibold text-polo-green mb-4">Your Blend Summary</h3>
                <div className="space-y-2 text-[var(--text-secondary)]">
                  <p><span className="font-medium text-polo-green">Origin:</span> {origins.find(o => o.value === blend.origin)?.label}</p>
                  <p><span className="font-medium text-polo-green">Roast:</span> {roastLevels.find(r => r.value === blend.roast_level)?.label}</p>
                  <p><span className="font-medium text-polo-green">Grind:</span> {grindSizes.find(g => g.value === blend.grind_size)?.label}</p>
                  <p><span className="font-medium text-polo-green">Quantity:</span> {blend.quantity}g</p>
                  <p className="text-2xl font-display font-bold text-aged-brass pt-4">
                    ${(blend.quantity * 0.05).toFixed(2)}
                  </p>
                </div>
              </Card>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div data-testid="custom-builder-page" className="min-h-screen py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Coffee className="w-16 h-16 text-aged-brass mx-auto mb-4" />
          <h1 className="text-4xl lg:text-5xl font-display font-bold text-polo-green mb-4">
            Craft Your Perfect Blend
          </h1>
          <p className="text-lg text-[var(--text-secondary)]">
            Step {step} of 5
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-aged-brass h-full transition-all duration-500"
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {renderStep()}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-12">
          <Button
            data-testid="builder-back-button"
            onClick={() => setStep(Math.max(1, step - 1))}
            variant="outline"
            disabled={step === 1}
            className="border-polo-green text-polo-green hover:bg-polo-green hover:text-bg-light"
          >
            Back
          </Button>

          {step < 4 ? (
            <Button
              data-testid="builder-next-button"
              onClick={() => setStep(Math.min(4, step + 1))}
              className="bg-polo-green text-bg-light hover:bg-polo-green/90"
            >
              Next Step
            </Button>
          ) : (
            <Button
              data-testid="builder-save-button"
              onClick={handleSaveBlend}
              className="bg-aged-brass text-polo-green hover:bg-aged-brass/90"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Save & Add to Cart
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomBuilder;