import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from 'react-three-fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { Mic, MicOff, Send, Volume2, Loader } from 'lucide-react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { supabase } from '../../lib/supabase';

// Globe component using Three.js
const Globe = ({ isProcessing }: { isProcessing: boolean }) => {
  const globeRef = useRef<THREE.Mesh>(null);
  
  useEffect(() => {
    if (!globeRef.current) return;
    
    // Subtle animation while processing
    const interval = setInterval(() => {
      if (globeRef.current && isProcessing) {
        globeRef.current.rotation.y += 0.005;
      }
    }, 16);
    
    return () => clearInterval(interval);
  }, [isProcessing]);
  
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <mesh ref={globeRef} rotation={[0, 0, 0]}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial 
          color={isProcessing ? "#C6A050" : "#3B82F6"} 
          metalness={0.5}
          roughness={0.7}
          emissive={isProcessing ? "#C6A050" : "#3B82F6"}
          emissiveIntensity={0.2}
        />
      </mesh>
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <OrbitControls 
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </>
  );
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const VoiceAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [textInput, setTextInput] = useState('');
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();
  
  useEffect(() => {
    if (transcript) {
      setTextInput(transcript);
    }
  }, [transcript]);
  
  const toggleListening = () => {
    if (listening) {
      SpeechRecognition.stopListening();
      setIsListening(false);
      
      // If there's a transcript, process it
      if (transcript) {
        handleSendMessage(transcript);
        resetTranscript();
      }
    } else {
      SpeechRecognition.startListening({ continuous: true });
      setIsListening(true);
      resetTranscript();
    }
  };
  
  const handleSendMessage = async (text: string = textInput) => {
    if (!text.trim()) return;
    
    // Add user message
    const userMessage = {
      role: 'user' as const,
      content: text,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);
    setTextInput('');
    resetTranscript();
    
    try {
      // Call OpenAI API
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-5) // Send last 5 messages for context
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response');
      }
      
      const data = await response.json();
      
      // Add assistant message
      const assistantMessage = {
        role: 'assistant' as const,
        content: data.reply,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Play audio response
      if (data.audioBase64 && audioRef.current) {
        audioRef.current.src = `data:audio/mp3;base64,${data.audioBase64}`;
        audioRef.current.play();
        setIsPlaying(true);
        
        audioRef.current.onended = () => {
          setIsPlaying(false);
        };
      }
      
      // Log to database if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from('support_chat_logs').insert({
          user_id: session.user.id,
          email: session.user.email,
          language: 'en', // Default to English
          message: text,
          reply: data.reply
        });
      }
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Add error message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
        {/* Globe Visualization */}
        <div className="w-full h-[400px] relative mb-8">
          <Canvas>
            <Globe isProcessing={isProcessing} />
          </Canvas>
          
          {/* Status Indicator */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center">
            {isProcessing ? (
              <div className="flex items-center justify-center space-x-2 bg-black/30 px-4 py-2 rounded-full">
                <Loader className="h-4 w-4 animate-spin text-gold-400" />
                <span className="text-sm">Processing...</span>
              </div>
            ) : isListening ? (
              <div className="flex items-center justify-center space-x-2 bg-red-500/30 px-4 py-2 rounded-full">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm">Listening...</span>
              </div>
            ) : (
              <div className="text-sm text-gray-300">Ready to assist</div>
            )}
          </div>
        </div>
        
        {/* Message Display */}
        <div className="w-full bg-gray-800 rounded-lg p-4 mb-4 h-32 overflow-y-auto">
          {messages.length > 0 ? (
            messages.map((message, index) => (
              <div 
                key={index} 
                className={`mb-2 ${message.role === 'user' ? 'text-blue-300' : 'text-gold-300'}`}
              >
                <span className="font-bold">{message.role === 'user' ? 'You: ' : 'Assistant: '}</span>
                <span>{message.content}</span>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400 py-8">
              Ask me anything about jewelry or your orders
            </div>
          )}
        </div>
        
        {/* Input Controls */}
        <div className="w-full flex items-center space-x-2">
          <button
            onClick={toggleListening}
            className={`p-3 rounded-full ${
              isListening 
                ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-300' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            } transition-all`}
            disabled={!browserSupportsSpeechRecognition}
          >
            {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </button>
          
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
            className="flex-1 bg-gray-700 text-white rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-gold-400"
          />
          
          <button
            onClick={() => handleSendMessage()}
            disabled={isProcessing || (!textInput.trim() && !transcript)}
            className="p-3 bg-gold-400 text-white rounded-full hover:bg-gold-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-6 w-6" />
          </button>
        </div>
        
        {/* Transcript Display */}
        {transcript && (
          <div className="mt-2 text-sm text-gray-300">
            <span className="font-medium">Transcript:</span> {transcript}
          </div>
        )}
      </div>
      
      {/* Hidden audio element for playing responses */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
};

export default VoiceAssistant;