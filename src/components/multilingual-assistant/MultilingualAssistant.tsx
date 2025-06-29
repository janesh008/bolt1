import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, X, Globe, Minimize2, Maximize2, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { isValidConversationUrl } from '../../utils/videoUtils';
import LanguageSelector from './LanguageSelector';
import PreferencesForm from './PreferencesForm';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import VideoChat from './VideoChat';
import MinimizedChat from './MinimizedChat';
import 'regenerator-runtime/runtime';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

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

const MultilingualAssistant: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [showVideo, setShowVideo] = useState(true);
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const { user } = useAuth();
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const assistantRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          assistantRef.current && assistantRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Set language based on user selection
  useEffect(() => {
    if (selectedLanguage) {
      i18n.changeLanguage(selectedLanguage.code);
    }
  }, [selectedLanguage, i18n]);

  // Listen for transcript changes
  useEffect(() => {
    if (transcript && !isLoading) {
      setInput(transcript);
    }
  }, [transcript, isLoading]);

  const toggleAssistant = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsDropdownOpen(false);
      setVideoError(null);
      setSelectedLanguage(null);
      setConversationUrl(null);
      setIsMinimized(false);
      setMessages([]);
      resetTranscript();
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const toggleMic = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true, language: selectedLanguage?.code || 'en-US' });
    }
  };

  const handleLanguageSelected = (language: string) => {
    const lang = languages.find(l => l.code === language) || null;
    setSelectedLanguage(lang);
    i18n.changeLanguage(language);
    setShowPreferences(true);
  };
  
  const handlePreferencesSubmit = async (preferences: any) => {
    setShowPreferences(false);
    
    // Add initial greeting message
    const initialMessage: Message = {
      role: 'assistant',
      content: t('assistant.greeting'),
      timestamp: new Date()
    };
    
    setMessages([initialMessage]);
    
    // Generate welcome video based on language
    generateWelcomeVideo(selectedLanguage?.code || 'en');
  };
  
  const generateWelcomeVideo = async (language: string) => {
    try {
      setIsVideoLoading(true);

      const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'valued customer';
      
      const response = await fetch('/api/video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_name: userName,
          product_name: 'jewelry',
          language: language
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate video');
      }

      const data = await response.json();

      if (data.conversationUrl) {
        setConversationUrl(data.conversationUrl);
        setConversationId(data.conversationId);
        setShowVideo(true);
      } else {
        throw new Error('No conversation URL returned');
      }
    } catch (err: any) {
      console.error('Error generating video:', err);
      setVideoError(err?.message || 'Failed to generate video');
      setShowVideo(false);
    } finally {
      setIsVideoLoading(false);
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
    setInput('');
    resetTranscript();
    setIsLoading(true);
    
    try {
      // Call the assistant API
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: input,
          history: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          language: selectedLanguage?.code || 'en'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response from assistant');
      }
      
      const data = await response.json();
      
      // Create products array if recommendations are available
      let products: Product[] | undefined;
      if (data.products && data.products.length > 0) {
        products = data.products;
      }
      
      // Create assistant message
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.reply,
        audioUrl: data.audioBase64 ? `data:audio/mp3;base64,${data.audioBase64}` : undefined,
        products,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Play audio if available
      if (data.audioBase64) {
        playAudio(`data:audio/mp3;base64,${data.audioBase64}`);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage: Message = {
        role: 'assistant',
        content: t('assistant.errors.connectionError'),
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = (audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.onplay = () => setIsPlaying(true);
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.onerror = () => {
        setIsPlaying(false);
        console.error('Error playing audio');
      };
      audioRef.current.play().catch(err => {
        console.error('Error playing audio:', err);
        setIsPlaying(false);
      });
    }
  };

  // Languages array
  const languages: Language[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
    { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇦🇪' }
  ];

  return (
    <>
      {/* Audio element for playing responses */}
      <audio ref={audioRef} className="hidden" />
      
      {/* Floating button */}
      <button
        onClick={toggleAssistant}
        className="fixed bottom-6 right-6 z-50 p-4 bg-gold-400 hover:bg-gold-500 text-white rounded-full shadow-lg transition-all duration-300 flex items-center justify-center"
        aria-label="Open AI Assistant"
      >
        <MessageSquare className="h-6 w-6" />
      </button>
      
      {/* Assistant Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-20 right-6 z-50"
            ref={assistantRef}
          >
            {isMinimized ? (
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
            ) : (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg shadow-2xl overflow-hidden"
                style={{ width: '350px', height: '500px' }}
              >
                {/* Header */}
                <div className="bg-gold-400 text-white p-3 flex items-center justify-between">
                  <h2 className="text-sm font-medium flex items-center">
                    {selectedLanguage ? (
                      <>
                        <span className="mr-2">{selectedLanguage.flag}</span>
                        {selectedLanguage.name}
                      </>
                    ) : (
                      <>
                        <Globe className="h-4 w-4 mr-1" />
                        {t('assistant.title')}
                      </>
                    )}
                  </h2>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={toggleMinimize}
                      className="p-1 hover:bg-gold-500 rounded-full transition-colors"
                      aria-label="Minimize"
                    >
                      <Minimize2 className="h-3 w-3" />
                    </button>
                    <button 
                      onClick={toggleAssistant}
                      className="p-1 hover:bg-gold-500 rounded-full transition-colors"
                      aria-label="Close assistant"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                
                {/* Content area */}
                <div className="flex flex-col h-[calc(500px-48px)]">
                  {/* Language selector */}
                  {!selectedLanguage && !showPreferences && (
                    <div className="flex-1 overflow-y-auto p-4 bg-cream-50">
                      <LanguageSelector onLanguageSelected={handleLanguageSelected} />
                    </div>
                  )}
                  
                  {/* Preferences form */}
                  {selectedLanguage && showPreferences && (
                    <div className="flex-1 overflow-y-auto p-4 bg-cream-50">
                      <PreferencesForm onSubmit={handlePreferencesSubmit} />
                    </div>
                  )}
                  
                  {/* Chat interface */}
                  {selectedLanguage && !showPreferences && (
                    <>
                      {/* Video chat or message list */}
                      {showVideo ? (
                        <div className="h-1/2 bg-black">
                          <VideoChat
                            showVideo={showVideo}
                            videoError={videoError}
                            isVideoLoading={isVideoLoading}
                            conversationUrl={conversationUrl}
                            setVideoError={setVideoError}
                            setShowVideo={setShowVideo}
                          />
                        </div>
                      ) : null}
                      
                      {/* Message list */}
                      <div className={`flex-1 ${showVideo ? 'h-1/2' : 'h-full'}`}>
                        <MessageList
                          messages={messages}
                          isLoading={isLoading}
                          playAudio={playAudio}
                          isPlaying={isPlaying}
                          audioRef={audioRef}
                          messagesEndRef={messagesEndRef}
                        />
                      </div>
                      
                      {/* Message input */}
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
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MultilingualAssistant;