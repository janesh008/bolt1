import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gem, Sparkles, Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  onComplete: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [_isLoading, setIsLoading] = useState(true);
  const [loadingPhase, setLoadingPhase] = useState<'license' | '3d-models' | 'complete'>('license');
  const [progress, setProgress] = useState(0);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyLicense = async () => {
      try {
        // Phase 1: License Verification (0-40%)
        setLoadingPhase('license');
        
        // Simulate progressive loading
        const progressInterval = setInterval(() => {
          setProgress(prev => {
            if (prev < 40) return prev + 2;
            return prev;
          });
        }, 50);

        // Simulate license verification API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const simulatedResponse = {
          success: true,
          license: {
            valid: true,
            type: 'premium',
            expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          },
          message: 'License verified successfully'
        };

        setApiResponse(simulatedResponse);
        clearInterval(progressInterval);
        setProgress(40);

        // Phase 2: Loading 3D Models (40-90%)
        setLoadingPhase('3d-models');
        
        const modelsInterval = setInterval(() => {
          setProgress(prev => {
            if (prev < 90) return prev + 3;
            return prev;
          });
        }, 100);

        await new Promise(resolve => setTimeout(resolve, 1800));
        
        clearInterval(modelsInterval);
        setProgress(90);

        // Phase 3: Finalizing (90-100%)
        setLoadingPhase('complete');
        
        const finalInterval = setInterval(() => {
          setProgress(prev => {
            if (prev < 100) return prev + 2;
            return prev;
          });
        }, 50);

        await new Promise(resolve => setTimeout(resolve, 500));
        
        clearInterval(finalInterval);
        setProgress(100);
        
        // Complete loading
        setTimeout(() => {
          setIsLoading(false);
          setTimeout(onComplete, 800); // Longer delay for smooth transition
        }, 500);

      } catch (err) {
        console.error('License verification failed:', err);
        setError(err instanceof Error ? err.message : 'Verification failed');
        
        // Still proceed after error with delay
        setTimeout(() => {
          setIsLoading(false);
          setTimeout(onComplete, 500);
        }, 3000);
      }
    };

    verifyLicense();
  }, [onComplete]);

  const getLoadingText = () => {
    switch (loadingPhase) {
      case 'license':
        return 'Verifying license...';
      case '3d-models':
        return 'Loading 3D models...';
      case 'complete':
        return 'Finalizing experience...';
      default:
        return 'Loading...';
    }
  };

  const getSubText = () => {
    switch (loadingPhase) {
      case 'license':
        return 'Authenticating your premium access';
      case '3d-models':
        return 'Preparing interactive jewelry viewer';
      case 'complete':
        return 'Almost ready to explore';
      default:
        return '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 z-50 bg-gradient-to-br from-cream-50 via-white to-cream-100 flex items-center justify-center overflow-hidden"
    >
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <motion.div 
          animate={{ 
            backgroundPosition: ['0% 0%', '100% 100%'],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute inset-0" 
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #C6A050 0%, transparent 50%),
                             radial-gradient(circle at 75% 75%, #C6A050 0%, transparent 50%),
                             radial-gradient(circle at 50% 50%, #D9B978 0%, transparent 30%)`,
            backgroundSize: '200px 200px, 150px 150px, 300px 300px'
          }} 
        />
      </div>

      {/* Floating Particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-gold-400 rounded-full opacity-30"
          animate={{
            y: [0, -100, 0],
            x: [0, Math.sin(i) * 50, 0],
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.5, 1]
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.3,
            ease: "easeInOut"
          }}
          style={{
            left: `${10 + (i * 7)}%`,
            top: `${20 + Math.sin(i) * 30}%`
          }}
        />
      ))}

      <div className="relative z-10 text-center max-w-md mx-auto px-6">
        {/* Main Logo - PRESERVED DESIGN */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="mb-8"
        >
          <div className="relative">
            {/* Enhanced Pulsing Background Circle */}
            <motion.div
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.2, 0.05, 0.2]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-gradient-to-r from-gold-400 to-gold-500 rounded-full blur-2xl"
              style={{ width: '140px', height: '140px', margin: 'auto' }}
            />
            
            {/* Secondary Pulse Ring */}
            <motion.div
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.1, 0.3, 0.1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
              className="absolute inset-0 border-2 border-gold-400 rounded-full"
              style={{ width: '120px', height: '120px', margin: 'auto' }}
            />
            
            {/* Main Logo Container - PRESERVED */}
            <motion.div
              animate={{ 
                scale: [1, 1.08, 1],
                rotate: [0, 8, -8, 0]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="relative w-24 h-24 mx-auto bg-gradient-to-br from-gold-400 via-gold-500 to-gold-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white"
            >
              <Gem className="w-12 h-12 text-white drop-shadow-lg" />
              
              {/* Enhanced Sparkle Effects */}
              <motion.div
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.3, 1]
                }}
                transition={{ 
                  duration: 6,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute inset-0"
              >
                <Sparkles className="absolute -top-3 -right-3 w-5 h-5 text-gold-400 drop-shadow-sm" />
                <Sparkles className="absolute -bottom-3 -left-3 w-4 h-4 text-gold-300 drop-shadow-sm" />
                <Sparkles className="absolute top-1/2 -left-4 w-3 h-3 text-gold-500 drop-shadow-sm" />
                <Sparkles className="absolute top-1/4 -right-4 w-4 h-4 text-gold-400 drop-shadow-sm" />
              </motion.div>

              {/* New: Orbiting Elements */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0"
              >
                <div className="absolute top-0 left-1/2 w-2 h-2 bg-white rounded-full transform -translate-x-1/2 -translate-y-6 opacity-60" />
                <div className="absolute bottom-0 left-1/2 w-1.5 h-1.5 bg-cream-100 rounded-full transform -translate-x-1/2 translate-y-6 opacity-40" />
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Brand Name - PRESERVED */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="mb-8"
        >
          <h1 className="font-serif text-4xl md:text-5xl font-bold bg-gradient-to-r from-charcoal-800 to-charcoal-600 bg-clip-text text-transparent mb-3">
            AXELS
          </h1>
          <motion.p 
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-charcoal-500 text-lg tracking-[0.3em] font-light"
          >
            LUXURY JEWELRY
          </motion.p>
        </motion.div>

        {/* Enhanced Loading Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mb-8"
        >
          {/* Loading Spinner */}
          <div className="flex justify-center mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="relative"
            >
              <Loader2 className="w-8 h-8 text-gold-400" />
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 border-2 border-gold-300 rounded-full"
              />
            </motion.div>
          </div>
          
          {/* Status Text */}
          <motion.div
            key={loadingPhase}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <p className="text-charcoal-700 text-base font-medium mb-2">
              {error ? (
                <span className="text-amber-600">Verification failed, continuing...</span>
              ) : (
                getLoadingText()
              )}
            </p>
            <p className="text-charcoal-500 text-sm">
              {getSubText()}
            </p>
          </motion.div>
        </motion.div>

        {/* Enhanced Progress Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="w-64 mx-auto mb-8"
        >
          <div className="flex justify-between text-xs text-charcoal-400 mb-2">
            <span>0%</span>
            <span className="font-medium">{Math.round(progress)}%</span>
            <span>100%</span>
          </div>
          <div className="h-2 bg-cream-200 rounded-full overflow-hidden shadow-inner">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600 rounded-full relative overflow-hidden"
            >
              {/* Shimmer Effect */}
              <motion.div
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              />
            </motion.div>
          </div>
        </motion.div>

        {/* Tagline - PRESERVED */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="text-charcoal-400 text-sm italic font-light"
        >
          "Discover Sparkle with Style"
        </motion.p>

        {/* Phase Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="flex justify-center space-x-3 mt-6"
        >
          {['license', '3d-models', 'complete'].map((phase, index) => (
            <motion.div
              key={phase}
              animate={{
                scale: loadingPhase === phase ? [1, 1.2, 1] : 1,
                opacity: loadingPhase === phase ? 1 : 0.3
              }}
              transition={{ duration: 0.5 }}
              className={`w-2 h-2 rounded-full ${
                loadingPhase === phase ? 'bg-gold-500' : 'bg-charcoal-300'
              }`}
            />
          ))}
        </motion.div>
      </div>

      {/* Enhanced Corner Decorations */}
      <div className="absolute top-8 left-8 opacity-30">
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 15, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        >
          <Sparkles className="w-6 h-6 text-gold-400" />
        </motion.div>
      </div>
      
      <div className="absolute bottom-8 right-8 opacity-30">
        <motion.div
          animate={{ 
            rotate: -360,
            scale: [1, 1.3, 1]
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        >
          <Sparkles className="w-8 h-8 text-gold-400" />
        </motion.div>
      </div>

      {/* Additional Corner Elements */}
      <div className="absolute top-8 right-8 opacity-20">
        <motion.div
          animate={{ 
            y: [0, -10, 0],
            opacity: [0.2, 0.6, 0.2]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        >
          <Gem className="w-4 h-4 text-gold-500" />
        </motion.div>
      </div>

      <div className="absolute bottom-8 left-8 opacity-20">
        <motion.div
          animate={{ 
            y: [0, 10, 0],
            opacity: [0.2, 0.6, 0.2]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 1
          }}
        >
          <Gem className="w-5 h-5 text-gold-400" />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default LoadingScreen;