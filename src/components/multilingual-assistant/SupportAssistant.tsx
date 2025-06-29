import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  X, 
  Mic, 
  MicOff, 
  Send, 
  Volume2, 
  Globe, 
  Loader, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import LanguageSelector from './LanguageSelector';
import Button from '../ui/Button';
import { createRoot } from 'react-dom/client';

// Speech recognition setup with type safety
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  originalContent?: string;
  audioUrl?: string;
  timestamp: Date;
}

// Create a global event for opening the support assistant
export const openSupportAssistant = () => {
  const event = new CustomEvent('openSupportAssistant');
  document.dispatchEvent(event);
};

const SupportAssistant: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Listen for the custom event to open the assistant
  useEffect(() => {
    const handleOpenAssistant = () => {
      setIsOpen(true);
      setIsMinimized(false);
    };
    
    document.addEventListener('openSupportAssistant', handleOpenAssistant);
    
    return () => {
      document.removeEventListener('openSupportAssistant', handleOpenAssistant);
    };
  }, []);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const recognitionRef = useRef<any>(null);
  
  // Check if browser supports speech recognition
  const browserSupportsSpeechRecognition = 
    typeof window !== 'undefined' && 
    (window.SpeechRecognition || window.webkitSpeechRecognition);
  
  // Initialize speech recognition
  useEffect(() => {
    if (!browserSupportsSpeechRecognition) return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = i18n.language || 'en-US';
    
    recognitionRef.current.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join('');
      
      setTranscript(transcript);
      setInput(transcript);
    };
    
    recognitionRef.current.onend = () => {
      setListening(false);
    };
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [browserSupportsSpeechRecognition, i18n.language]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Add welcome message when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: t('assistant.greeting', 'Hello! I\'m your personal jewelry assistant. How can I help you today?'),
          timestamp: new Date()
        }
      ]);
    }
  }, [isOpen, messages.length, t]);
  
  // Update recognition language when i18n language changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = i18n.language || 'en-US';
    }
  }, [i18n.language]);
  
  const toggleMic = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      
      // If there's a transcript, send it as a message
      if (transcript) {
        handleSendMessage();
      }
    } else {
      try {
        recognitionRef.current?.start();
        setListening(true);
        setTranscript('');
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    }
  };
  
  const playAudio = (audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.src = `data:audio/mp3;base64,${audioUrl}`;
      audioRef.current.play().catch(error => {
        console.error('Error playing audio:', error);
      });
      setIsPlaying(true);
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
      };
    }
  };
  
  const handleSendMessage = async () => {
    if (!input.trim() && !transcript) return;
    
    const userMessage = input || transcript;
    
    // Add user message to chat
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);
    
    // Clear input and transcript
    setInput('');
    setTranscript('');
    setIsLoading(true);
    
    try {
      // Get current language
      const currentLanguage = i18n.language || 'en';
      
      // Call assistant API
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage,
          history: messages,
          language: currentLanguage
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response from assistant');
      }
      
      const data = await response.json();
      
      // Add assistant message to chat
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply,
        audioUrl: data.audioBase64,
        timestamp: new Date()
      }]);
      
      // Play audio if available
      if (data.audioBase64) {
        playAudio(data.audioBase64);
      }
      
      // Log chat to database if user is authenticated
      if (user) {
        await logChatToDatabase(userMessage, data.reply, currentLanguage, data.audioBase64);
        
        // Check if message needs escalation
        if (needsEscalation(data.reply)) {
          await createSupportAlert(userMessage, messages);
        }
      }
    } catch (error) {
      console.error('Error getting assistant response:', error);
      
      // Add error message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: t('assistant.errors.connectionError', 'Sorry, I encountered an error. Please try again.'),
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const logChatToDatabase = async (message: string, reply: string, language: string, audioUrl?: string) => {
    try {
      await supabase.from('support_chat_logs').insert({
        user_id: user?.id,
        email: user?.email,
        language,
        message,
        reply,
        audio_url: audioUrl ? 'audio_generated' : null
      });
    } catch (error) {
      console.error('Error logging chat to database:', error);
    }
  };
  
  const needsEscalation = (reply: string): boolean => {
    const escalationPhrases = [
      "I'm not sure",
      "I don't know",
      "I am unsure",
      "cannot help",
      "unable to assist",
      "cannot provide",
      "don't have enough information",
      "need more details",
      "beyond my capabilities",
      "I apologize"
    ];
    
    return escalationPhrases.some(phrase => reply.toLowerCase().includes(phrase.toLowerCase()));
  };
  
  const createSupportAlert = async (message: string, recentMessages: Message[]) => {
    try {
      // Get the last 3 messages for context
      const recentContext = recentMessages.slice(-3).map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      }));
      
      await supabase.from('support_alerts').insert({
        user_id: user?.id,
        email: user?.email,
        message,
        recent_context: recentContext,
        is_urgent: true,
        flagged: true
      });
    } catch (error) {
      console.error('Error creating support alert:', error);
    }
  };
  
  const handleLanguageSelected = (language: string) => {
    i18n.changeLanguage(language);
    setShowLanguageSelector(false);
  };
  
  const toggleAssistant = () => {
    setIsOpen(!isOpen);
    if (isMinimized) {
      setIsMinimized(false);
    }
  };
  
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };
  
  return (
    <>
      {/* Floating button */}
      <button
        onClick={toggleAssistant}
        className="fixed bottom-6 right-6 z-50 p-4 bg-gold-400 hover:bg-gold-500 text-white rounded-full shadow-lg transition-all duration-300 flex items-center justify-center"
        aria-label="Open Support Assistant"
      >
        <MessageSquare className="h-6 w-6" />
      </button>
      
      {/* Audio element for playing responses */}
      <audio ref={audioRef} className="hidden" />
      
      {/* Assistant Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className={`fixed ${isMinimized ? 'bottom-20 right-6 w-72 h-16' : 'bottom-20 right-6 w-80 md:w-96 h-[500px]'} bg-white rounded-lg shadow-2xl overflow-hidden z-50`}
          >
            {/* Header */}
            <div className="bg-gold-400 text-white p-3 flex items-center justify-between">
              <h2 className="text-sm font-medium flex items-center">
                <MessageSquare className="h-4 w-4 mr-2" />
                {t('assistant.title', 'AXELS Jewelry Assistant')}
              </h2>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setShowLanguageSelector(true)}
                  className="p-1 hover:bg-gold-500 rounded-full transition-colors"
                  aria-label="Change language"
                >
                  <Globe className="h-4 w-4" />
                </button>
                <button 
                  onClick={toggleMinimize}
                  className="p-1 hover:bg-gold-500 rounded-full transition-colors"
                  aria-label={isMinimized ? "Maximize" : "Minimize"}
                >
                  {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
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
            
            {/* Content */}
            {!isMinimized && (
              <>
                {showLanguageSelector ? (
                  <div className="flex-1 overflow-y-auto p-4">
                    <LanguageSelector onLanguageSelected={handleLanguageSelected} />
                  </div>
                ) : (
                  <>
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[calc(500px-120px)]">
                      {messages.map((message, index) => (
                        <div 
                          key={index} 
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div 
                            className={`max-w-[80%] rounded-lg p-4 ${
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
                                {isPlaying && audioRef.current?.src.includes(message.audioUrl) 
                                  ? t('common.loading')
                                  : t('assistant.actions.playAudio', 'Play audio response')}
                              </button>
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
                    
                    {/* Input */}
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
                          title={browserSupportsSpeechRecognition ? t('assistant.actions.toggleMic', 'Toggle microphone') : t('assistant.errors.micNotSupported', 'Browser does not support speech recognition')}
                        >
                          {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                        </button>
                        
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder={t('assistant.placeholders.typeMessage', 'Type your message...')}
                            className="w-full px-4 py-2 pr-12 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
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
                          disabled={(!input.trim() && !transcript) || isLoading}
                          className="bg-gold-400 hover:bg-gold-500 text-white"
                        >
                          {isLoading ? <Loader className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                        </Button>
                      </div>
                      
                      {listening && (
                        <div className="mt-2 text-xs text-charcoal-500">
                          {t('assistant.listening', 'Listening...')} {transcript ? `"${transcript}"` : ''}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
            
            {/* Minimized View */}
            {isMinimized && (
              <div className="flex items-center justify-between px-4 h-full">
                <span className="text-sm text-charcoal-600 truncate">
                  {t('assistant.minimizedTitle', 'Jewelry Assistant')}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={toggleMic}
                    className={`p-1 rounded-full ${
                      listening 
                        ? 'bg-red-100 text-red-600' 
                        : 'bg-cream-100 text-charcoal-600'
                    } transition-colors`}
                    disabled={!browserSupportsSpeechRecognition}
                  >
                    {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SupportAssistant;