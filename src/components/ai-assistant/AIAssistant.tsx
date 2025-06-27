import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Mic, MicOff, X, Volume2, ShoppingBag, Send, Video, Minimize2, Maximize2 } from 'lucide-react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import ProductCarousel from './ProductCarousel';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import 'regenerator-runtime/runtime';
import VideoChat from './VideoChat';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import MinimizedChat from './MinimizedChat';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  audioUrl?: string;
  videoUrl?: string;
  products?: Product[];
  timestamp: Date;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description?: string;
}

const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVideo, setShowVideo] = useState(true); // Default to showing video
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { user } = useAuth();

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add initial greeting
      setMessages([
        {
          role: 'assistant',
          content: 'Hello! I\'m your jewelry assistant. How can I help you find the perfect piece today?',
          timestamp: new Date()
        }
      ]);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleAssistant = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
    if (!isOpen) {
      loadChatHistory();
    }
  };
  
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const loadChatHistory = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('ai_chat_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        const formattedMessages = data.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          audioUrl: msg.audio_url,
          videoUrl: msg.video_url,
          products: msg.products,
          timestamp: new Date(msg.created_at)
        }));
        
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const saveChatMessage = async (message: Message) => {
    if (!user) return;
    
    try {
      await supabase
        .from('ai_chat_history')
        .insert({
          user_id: user.id,
          role: message.role,
          content: message.content,
          audio_url: message.audioUrl,
          video_url: message.videoUrl,
          products: message.products,
          created_at: message.timestamp.toISOString()
        });
    } catch (error) {
      console.error('Error saving chat message:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    saveChatMessage(userMessage);
    setInput('');
    resetTranscript();
    setIsLoading(true);
    
    try {
      // Call the assistant API
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: input,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response from assistant');
      }
      
      const data = await response.json();
      
      // Get product recommendations if applicable
      let products: Product[] = [];
      if (data.category || data.budget) {
        const recommendResponse = await fetch('/api/recommend', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            category: data.category,
            budget: data.budget,
            style: data.style,
            material: data.material
          }),
        });
        
        if (recommendResponse.ok) {
          products = await recommendResponse.json();
        }
      }
      
      // Create assistant message
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.reply,
        audioUrl: data.audioBase64 ? `data:audio/mp3;base64,${data.audioBase64}` : undefined,
        products: products.length > 0 ? products : undefined,
        timestamp: new Date()
      };
      
      // Check if we should generate a video
      if (user) {
        try {
          // Reset any previous video errors
          setVideoError(null);
          setIsVideoLoading(true);
          
          // Get user's name from metadata or use a default
          const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'valued customer';
          
          // Get product name if available
          const productName = products.length > 0 
            ? products[0].name 
            : data.category 
              ? `${data.category} jewelry` 
              : 'jewelry piece';
          
          console.log("Calling video API with:", { userName, productName });
          
          const videoResponse = await fetch('/api/video', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              user_name: userName,
              product_name: productName
            }),
          });
          
          console.log("Video API response status:", videoResponse.status);
          
          if (!videoResponse.ok) {
            const errorData = await videoResponse.json();
            throw new Error(errorData.error || 'Failed to create video conversation');
          } else {
            const videoData = await videoResponse.json();
            
            console.log("🎥 Tavus response", videoData);
            console.log("Conversation URL:", videoData.conversationUrl);
            
            if (true) {
              assistantMessage.videoUrl = "https://tavus.daily.co/c92d67ed8c787437"; //videoData.conversationUrl;
              setConversationUrl("https://tavus.daily.co/c92d67ed8c787437"); //(videoData.conversationUrl);
              setConversationId(videoData.conversationId);
              setShowVideo(true);
              
              // Log the URL right after setting it
              console.log("Set conversation URL to:", videoData.conversationUrl);
              
              toast.success('Video chat is ready!');
            } else {
              throw new Error('No conversation URL returned from video service');
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create video chat';
          console.error('Error generating video:', errorMessage);
          setVideoError(errorMessage);
          toast.error('Could not start video chat. Using text chat instead.');
          setShowVideo(false);
        } finally {
          setIsVideoLoading(false);
        }
      }
      
      setMessages(prev => [...prev, assistantMessage]);
      saveChatMessage(assistantMessage);
      
      // Play audio response
      if (assistantMessage.audioUrl && audioRef.current) {
        audioRef.current.src = assistantMessage.audioUrl;
        audioRef.current.play();
        setIsPlaying(true);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to get a response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMic = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true });
    }
  };

  const playAudio = (audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={toggleAssistant}
        className="fixed bottom-6 right-6 z-50 p-4 bg-gold-400 hover:bg-gold-500 text-white rounded-full shadow-lg transition-all duration-300 flex items-center justify-center"
        aria-label="Open AI Assistant"
      >
        <Video className="h-6 w-6" />
      </button>
      
      {/* Audio element for speech */}
      <audio 
        ref={audioRef} 
        onEnded={() => setIsPlaying(false)}
        onError={() => setIsPlaying(false)}
      />
      
      {/* Assistant Modal */}
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gold-400 text-white p-4 flex items-center justify-between">
                <h2 className="text-xl font-serif">AXELS Jewelry Assistant</h2>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={toggleMinimize}
                    className="p-1 hover:bg-gold-500 rounded-full transition-colors"
                    aria-label="Minimize assistant"
                  >
                    <Minimize2 className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={toggleAssistant}
                    className="p-1 hover:bg-gold-500 rounded-full transition-colors"
                    aria-label="Close assistant"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              {/* Main content area with video and chat */}
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Video area */}
                <div className="w-full md:w-1/2 bg-black flex items-center justify-center">
                  <VideoChat 
                    showVideo={showVideo}
                    videoError={videoError}
                    isVideoLoading={isVideoLoading}
                    conversationUrl={conversationUrl}
                    setVideoError={setVideoError}
                    setShowVideo={setShowVideo}
                  />
                </div>
                
                {/* Chat area */}
                <div className="w-full md:w-1/2 flex flex-col">
                  <MessageList 
                    messages={messages}
                    isLoading={isLoading}
                    playAudio={playAudio}
                    isPlaying={isPlaying}
                    audioRef={audioRef}
                    messagesEndRef={messagesEndRef}
                  />
                  
                  {/* Input area */}
                  <MessageInput 
                    input={input}
                    setInput={setInput}
                    handleSendMessage={handleSendMessage}
                    isLoading={isLoading}
                    listening={listening}
                    toggleMic={toggleMic}
                    transcript={transcript}
                    browserSupportsSpeechRecognition={browserSupportsSpeechRecognition}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Minimized Video Chat */}
      <AnimatePresence>
        {isOpen && isMinimized && (
          <MinimizedChat 
            conversationUrl={conversationUrl}
            toggleMinimize={toggleMinimize}
            toggleAssistant={toggleAssistant}
            input={input}
            setInput={setInput}
            handleSendMessage={handleSendMessage}
            isLoading={isLoading}
            listening={listening}
            toggleMic={toggleMic}
            browserSupportsSpeechRecognition={browserSupportsSpeechRecognition}
            setVideoError={setVideoError}
            setShowVideo={setShowVideo}
            setIsMinimized={setIsMinimized}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAssistant;