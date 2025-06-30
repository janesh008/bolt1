import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Stage } from '@react-three/drei';
import { Gem } from 'lucide-react';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const DiamondRing = () => {
  return (
    <Stage environment="city" intensity={0.9} shadows>
      <mesh rotation={[0.5, 0.5, 0]}>
        <torusGeometry args={[1, 0.4, 16, 100]} />
        <meshStandardMaterial color="#C0C0C0" metalness={1} roughness={0.2} />
      </mesh>
      <mesh position={[0, 1, 0]}>
        <octahedronGeometry args={[0.5, 2]} />
        <meshStandardMaterial color="#b9f2ff" roughness={0.05} metalness={0.7} />
      </mesh>
    </Stage>
  );
};

const AIDesignerPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[100vh] pt-24 bg-gradient-to-b from-gray-100 to-white px-4 text-center">
      <div className="mb-6 flex items-center gap-3 animate-fade-in">
        <Gem className="h-8 w-8 text-yellow-500 drop-shadow-lg" />
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
          AI Jewelry Designer
        </h1>
      </div>
      <p className="max-w-2xl text-lg text-gray-600 mb-10 animate-fade-in delay-100">
        Craft your dream jewelry with AI. Design unique pieces in diamond & gold using cutting-edge 3D tech and language models.
      </p>

      <div className="w-full max-w-2xl h-[400px] md:h-[500px] mb-10 rounded-xl overflow-hidden bg-white shadow-xl">
        <Canvas camera={{ position: [3, 3, 5], fov: 50 }}>
          <ambientLight intensity={0.6} />
          <DiamondRing />
          <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={1.5} />
          <Environment preset="city" />
        </Canvas>
      </div>

      <p className="text-xl font-medium text-gray-700 mb-2 animate-fade-in delay-200">
        🚀 Coming Very Soon
      </p>
      <p className="text-md text-gray-500 max-w-xl animate-fade-in delay-300">
        We’re putting the final touches on something magical. Stay tuned and be the first to design with AI!
      </p>
    </div>
  );
};

export default AIDesignerPage;
