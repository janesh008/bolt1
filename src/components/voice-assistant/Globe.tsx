import React, { useRef, useEffect } from 'react';
import { useFrame } from 'react-three-fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';

interface GlobeProps {
  isProcessing: boolean;
  isListening?: boolean;
}

const Globe: React.FC<GlobeProps> = ({ isProcessing, isListening = false }) => {
  const globeRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  
  // Create texture for the globe
  const texture = new THREE.TextureLoader().load('/earth-texture.jpg');
  
  // Determine color based on state
  const getColor = () => {
    if (isProcessing) return "#C6A050"; // Gold when processing
    if (isListening) return "#EF4444";  // Red when listening
    return "#3B82F6";                   // Blue when idle
  };
  
  // Animate the globe
  useFrame(() => {
    if (globeRef.current) {
      // Rotate the globe
      globeRef.current.rotation.y += 0.001;
      
      // If processing, rotate faster
      if (isProcessing) {
        globeRef.current.rotation.y += 0.002;
      }
      
      // If listening, pulse the globe
      if (isListening && glowRef.current) {
        const scale = 1.0 + Math.sin(Date.now() * 0.005) * 0.05;
        glowRef.current.scale.set(scale, scale, scale);
      }
    }
  });
  
  return (
    <group>
      {/* Main globe */}
      <mesh ref={globeRef} rotation={[0, 0, 0]}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial 
          map={texture}
          metalness={0.2}
          roughness={0.8}
          emissive={getColor()}
          emissiveIntensity={0.2}
        />
      </mesh>
      
      {/* Glow effect */}
      <mesh ref={glowRef} scale={[1.05, 1.05, 1.05]}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial 
          color={getColor()}
          transparent={true}
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
};

export default Globe;