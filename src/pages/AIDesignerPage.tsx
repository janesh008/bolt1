import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF, PresentationControls, Float, ContactShadows, Stars } from '@react-three/drei';
import { motion } from 'framer-motion';
import { Gem, Sparkles, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Diamond Ring Model
const DiamondRing = () => {
  const ringRef = useRef();
  
  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.y = state.clock.getElapsedTime() * 0.2;
    }
  });

  return (
    <group ref={ringRef}>
      {/* Diamond */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <octahedronGeometry args={[0.7, 2]} />
        <meshPhysicalMaterial 
          color="#ffffff" 
          roughness={0.1} 
          metalness={0.2}
          clearcoat={1}
          clearcoatRoughness={0.1}
          transmission={0.9}
          ior={2.5}
          thickness={0.5}
        />
      </mesh>
      
      {/* Ring Band */}
      <mesh position={[0, 0, 0]} castShadow>
        <torusGeometry args={[1, 0.2, 16, 100]} />
        <meshStandardMaterial 
          color="#d4af37" 
          metalness={1} 
          roughness={0.2}
        />
      </mesh>
    </group>
  );
};

// Floating Particle
const FloatingParticle = ({ position, size, delay }) => {
  return (
    <motion.div
      className="absolute rounded-full bg-white opacity-70"
      style={{
        width: size,
        height: size,
        left: `${position[0]}%`,
        top: `${position[1]}%`,
      }}
      animate={{
        y: [-20, 20],
        opacity: [0.2, 0.8, 0.2],
        scale: [1, 1.2, 1],
      }}
      transition={{
        duration: 3 + Math.random() * 2,
        repeat: Infinity,
        delay: delay,
        ease: "easeInOut",
      }}
    />
  );
};

// Email Notification Modal
const NotificationModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      
      // Reset form after showing success message
      setTimeout(() => {
        setEmail('');
        setIsSubmitted(false);
        onClose();
      }, 3000);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <motion.div 
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 max-w-md w-full border border-gold-300/30"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {isSubmitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-green-400" />
            </div>
            <h3 className="text-xl font-serif text-white mb-2">Thank You!</h3>
            <p className="text-gray-300">
              We'll notify you when our AI Jewelry Designer launches.
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="h-8 w-8 text-gold-400" />
              </div>
              <h3 className="text-xl font-serif text-white mb-2">Get Notified</h3>
              <p className="text-gray-300">
                Be the first to know when our AI Jewelry Designer launches.
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  required
                  className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-400"
                />
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-500 hover:to-gold-600 text-white rounded-lg font-medium transition-all duration-300 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  "Notify Me"
                )}
              </button>
              
              <p className="text-xs text-gray-400 text-center mt-4">
                We respect your privacy and will never share your email.
              </p>
            </form>
            
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
};

const AIDesignerPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    document.title = 'AI Jewelry Designer | AXELS';
  }, []);

  // Generate random positions for particles
  const particles = Array.from({ length: 20 }, (_, i) => ({
    position: [Math.random() * 100, Math.random() * 100],
    size: 2 + Math.random() * 6,
    delay: Math.random() * 2,
  }));

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-black via-purple-900/20 to-black">
      {/* Background Particles */}
      {particles.map((particle, i) => (
        <FloatingParticle key={i} {...particle} />
      ))}
      
      {/* Content */}
      <div className="container mx-auto px-4 pt-24 pb-16 relative z-10">
        <motion.div 
          className="flex flex-col items-center justify-center text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Header */}
          <div className="mb-8 flex items-center gap-3">
            <Gem className="h-10 w-10 text-gold-400 drop-shadow-lg" />
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white tracking-tight">
              AI Jewelry Designer
            </h1>
          </div>
          
          <motion.p 
            className="max-w-2xl text-lg text-gray-300 mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            Design your dream diamond & gold jewelry with AI. Experience the magic soon!
          </motion.p>
          
          {/* 3D Model Container */}
          <div className="w-full max-w-2xl h-[400px] md:h-[500px] mb-12 relative">
            <motion.div
              className="w-full h-full rounded-2xl overflow-hidden bg-gradient-to-b from-purple-900/30 to-black/50 backdrop-blur-sm border border-purple-500/20"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
                <pointLight position={[-10, -10, -10]} intensity={0.5} />
                
                <PresentationControls
                  global
                  rotation={[0, 0, 0]}
                  polar={[-Math.PI / 4, Math.PI / 4]}
                  azimuth={[-Math.PI / 4, Math.PI / 4]}
                  config={{ mass: 2, tension: 400 }}
                  snap={{ mass: 4, tension: 400 }}
                >
                  <Float rotationIntensity={0.4} floatIntensity={0.4}>
                    <DiamondRing />
                  </Float>
                </PresentationControls>
                
                <ContactShadows 
                  position={[0, -1.5, 0]} 
                  opacity={0.4} 
                  scale={5} 
                  blur={2.4} 
                />
                
                <Environment preset="city" />
                <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />
              </Canvas>
            </motion.div>
          </div>
          
          {/* Coming Soon Text */}
          <motion.div
            className="mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-serif text-white mb-4 relative inline-block">
              <span className="relative z-10">Coming Soon</span>
              <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-gold-300 to-gold-500 z-0"></span>
            </h2>
            <p className="text-gray-300 max-w-xl mx-auto">
              We're putting the final touches on something magical. Stay tuned and be the first to design with AI!
            </p>
          </motion.div>
          
          {/* Notification Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <button
              onClick={() => setShowModal(true)}
              className="px-8 py-4 bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-500 hover:to-gold-600 text-white rounded-lg font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg shadow-gold-500/20 flex items-center"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Get Notified
            </button>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Notification Modal */}
      <NotificationModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
};

export default AIDesignerPage;