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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLIFrameElement>(null);
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
      if (data.generateVideo && user) {
        try {
          setIsVideoLoading(true);
          const videoResponse = await fetch('/api/video', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              user_name: user.user_metadata?.full_name || 'valued customer',
              product_name: products[0]?.name || 'jewelry piece'
            }),
          });
          
          if (videoResponse.ok) {
            const videoData = await videoResponse.json();
            assistantMessage.videoUrl = videoData.conversationUrl;
            setConversationUrl(videoData.conversationUrl);
            setShowVideo(true);
          }
        } catch (error) {
          console.error('Error generating video:', error);
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
                  {showVideo ? (
                    isVideoLoading ? (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        <div className="w-12 h-12 border-4 border-gold-200 border-t-gold-500 rounded-full animate-spin mb-4"></div>
                        <p className="text-white text-sm">Connecting to video chat...</p>
                      </div>
                    ) : conversationUrl ? (
                      <iframe
                        ref={videoRef}
                        src={conversationUrl}
                        className="w-full aspect-video md:h-full"
                        allow="camera; microphone; accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    ) 
                  : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="h-16 w-16 text-gray-700 opacity-30" />
                    </div>
                  )}
                </div>
                
                {/* Chat area */}
                <div className="w-full md:w-1/2 flex flex-col">
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message, index) => (
                      <div 
                        key={index} 
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[90%] rounded-lg p-4 ${
                            message.role === 'user' 
                              ? 'bg-gold-100 text-charcoal-800' 
                              : 'bg-white shadow-soft border border-cream-200'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          
                          {message.audioUrl && message.role === 'assistant' && (
                            <button
                              onClick={() => playAudio(message.audioUrl!)}
                              className="mt-2 text-gold-500 hover:text-gold-600 transition-colors flex items-center text-sm"
                            >
                              <Volume2 className="h-4 w-4 mr-1" />
                              {isPlaying && audioRef.current?.src === message.audioUrl 
                                ? 'Playing...' 
                                : 'Play audio response'}
                            </button>
                          )}
                          
                          {message.products && message.products.length > 0 && (
                            <div className="mt-4">
                              <h4 className="font-medium text-charcoal-700 mb-2">Recommended for you:</h4>
                              <ProductCarousel products={message.products} />
                            </div>
                          )}
                          
                          <div className="text-xs text-right mt-2 text-charcoal-400">
                            {new Date(message.timestamp).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-white shadow-soft border border-cream-200 rounded-lg p-4 max-w-[80%]">
                          <div className="flex space-x-2">
                            <div className="w-2 h-2 bg-gold-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-gold-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-gold-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                  
                  {/* Input area */}
                  <div className="border-t border-cream-200 p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleMic}
                        className={`p-2 rounded-full ${
                          listening 
                            ? 'bg-red-100 text-red-600' 
                            : 'bg-cream-100 text-charcoal-600 hover:bg-cream-200'
                        } transition-colors`}
                        disabled={!browserSupportsSpeechRecognition}
                        title={browserSupportsSpeechRecognition ? 'Toggle microphone' : 'Browser does not support speech recognition'}
                      >
                        {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                      </button>
                      
                      <div className="relative flex-1">
                        <textarea
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={handleKeyPress}
                          placeholder="Ask about jewelry, styles, or recommendations..."
                          className="w-full px-4 py-3 pr-12 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400 resize-none"
                          rows={1}
                          disabled={isLoading}
                        />
                        {listening && (
                          <div className="absolute right-3 top-3 flex items-center">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          </div>
                        )}
                      </div>
                      
                      <Button
                        onClick={handleSendMessage}
                        disabled={!input.trim() || isLoading}
                        className="bg-gold-400 hover:bg-gold-500 text-white"
                      >
                        <Send className="h-5 w-5" />
                      </Button>
                    </div>
                    
                    {listening && (
                      <div className="mt-2 text-xs text-charcoal-500">
                        Listening... {transcript ? `"${transcript}"` : ''}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Minimized Video Chat */}
      <AnimatePresence>
        {isOpen && isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-20 right-6 z-50 w-72 rounded-lg shadow-lg overflow-hidden"
          >
            <div className="bg-gold-400 text-white p-2 flex items-center justify-between">
              <h3 className="text-sm font-medium">AXELS AI Assistant</h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={toggleMinimize}
                  className="p-1 hover:bg-gold-500 rounded-full transition-colors"
                  aria-label="Maximize assistant"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
                <button
                  onClick={toggleAssistant}
                  className="p-1 hover:bg-gold-500 rounded-full transition-colors"
                  aria-label="Close assistant"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="bg-black aspect-video">
              <iframe
                src={conversationUrl}
                className="w-full h-full"
                allow="camera; microphone; accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            
            <div className="bg-white p-2 flex items-center gap-2">
              <button
                onClick={toggleMic}
                className={`p-2 rounded-full ${
                  listening 
                    ? 'bg-red-100 text-red-600' 
                    : 'bg-cream-100 text-charcoal-600 hover:bg-cream-200'
                } transition-colors`}
                disabled={!browserSupportsSpeechRecognition}
              >
                {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
              
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask something..."
                className="flex-1 text-sm px-2 py-1 border border-cream-200 rounded focus:outline-none focus:ring-1 focus:ring-gold-400"
                disabled={isLoading}
              />
              
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                className="bg-gold-400 hover:bg-gold-500 text-white p-1"
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAssistant;