import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Globe, 
  Minimize2, 
  Maximize2, 
  ChevronDown,
  MessageSquare,
  Mic,
  MicOff,
  Send,
  Loader2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import Button from '../ui/Button';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

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

const MultilingualAssistant: React.FC = () => {
  const { t, i18n } = useTranslation();
  // UI state
  const [isOpen, setIsOpen] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Speech recognition state
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognition = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement>(new Audio());
  
  // UI refs
  const dropdownRef = useRef<HTMLDivElement>(null);
  const assistantRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Check if browser supports speech recognition
  const browserSupportsSpeechRecognition = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          assistantRef.current && assistantRef.current.contains(event.target as Node)) {
        setShowLanguageSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (!browserSupportsSpeechRecognition) return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition.current = new SpeechRecognition();
    recognition.current.continuous = false;
    recognition.current.interimResults = false;
    
    recognition.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setTranscript(transcript);
      setInput(transcript);
    };
    
    recognition.current.onend = () => {
      setListening(false);
    };
    
    recognition.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setListening(false);
      setError(`Speech recognition error: ${event.error}`);
    };
    
    return () => {
      if (recognition.current) {
        recognition.current.onresult = null;
        recognition.current.onend = null;
        recognition.current.onerror = null;
        if (listening) {
          recognition.current.abort();
        }
      }
    };
  }, [browserSupportsSpeechRecognition]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const toggleAssistant = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setShowLanguageSelector(false);
      setSelectedLanguage(null);
      setIsMinimized(false);
      setMessages([]);
      setInput('');
      setError(null);
    }
  };

  const toggleLanguageSelector = () => {
    setShowLanguageSelector(!showLanguageSelector);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleLanguageSelected = (language: string) => {
    const selectedLang = languages.find(lang => lang.code === language);
    if (selectedLang) {
      setSelectedLanguage(selectedLang);
      i18n.changeLanguage(language);
      setMessages([]);
      setInput('');
      setError(null);
      setShowLanguageSelector(false);
      
      // Add welcome message
      const welcomeMessage = t('assistant.greeting', 'Hello! I\'m your personal jewelry assistant. How can I help you today?');
      setMessages([{
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date()
      }]);
    }
  };
  
  const toggleMic = () => {
    if (!browserSupportsSpeechRecognition) {
      setError(t('assistant.errors.micNotSupported', 'Speech recognition is not supported in this browser'));
      return;
    }
    
    if (listening) {
      if (recognition.current) {
        recognition.current.abort();
      }
      setListening(false);
    } else {
      setTranscript('');
      if (recognition.current) {
        recognition.current.lang = selectedLanguage?.code || 'en';
        recognition.current.start();
      }
      setListening(true);
    }
  };
  
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Add user message to chat
    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setTranscript('');
    setIsLoading(true);
    setError(null);
    
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      // Call the assistant API
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken || ''}`,
        },
        body: JSON.stringify({
          message: input,
          history: messages,
          language: selectedLanguage?.code || 'en'
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response from assistant');
      }
      
      const data = await response.json();
      
      // Add assistant message to chat
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
        audioUrl: data.audioBase64 ? `data:audio/mpeg;base64,${data.audioBase64}` : undefined
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Play audio if available
      if (data.audioBase64) {
        playAudio(`data:audio/mpeg;base64,${data.audioBase64}`);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      setError(error.message || 'Failed to get response');
    } finally {
      setIsLoading(false);
    }
  };
  
  const playAudio = (url: string) => {
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.play().catch(error => {
        console.error('Error playing audio:', error);
        setError(t('assistant.errors.audioFailed', 'Audio couldn\'t be played. Please check your sound settings.'));
      });
    }
  };

  // Function to handle closing the assistant
  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={toggleAssistant}
        className="fixed bottom-6 right-6 z-50 p-4 bg-gold-400 hover:bg-gold-500 text-white rounded-full shadow-lg transition-all duration-300 flex items-center justify-center"
        aria-label="Open Support Agent"
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
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col"
              style={{ width: '350px', height: isMinimized ? '50px' : '450px' }}
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
                    onClick={toggleLanguageSelector}
                    className="p-1 hover:bg-gold-500 rounded-full transition-colors"
                    aria-label="Change language"
                  >
                    <Globe className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={toggleMinimize}
                    className="p-1 hover:bg-gold-500 rounded-full transition-colors"
                    aria-label={isMinimized ? "Maximize" : "Minimize"}
                  >
                    {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
                  </button>
                  <button 
                    onClick={handleClose}
                    className="p-1 hover:bg-gold-500 rounded-full transition-colors"
                    aria-label="Close assistant"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
              
              {/* Content area - only show if not minimized */}
              {!isMinimized && (
                <div className="flex-1 flex flex-col">
                  {/* Language selector */}
                  {!selectedLanguage && (
                    <div className="w-full h-full bg-cream-50 p-4">
                      <div className="text-center mb-4">
                        <Globe className="h-8 w-8 text-gold-500 mx-auto mb-2" />
                        <h3 className="text-sm font-medium text-charcoal-800">
                          {t('assistant.languageSelector')}
                        </h3>
                        <p className="text-xs text-charcoal-500 mt-1">
                          Select your preferred language to continue
                        </p>
                      </div>
                      
                      {/* Language Dropdown */}
                      <div className="relative mt-4" ref={dropdownRef}>
                        <button
                          onClick={toggleLanguageSelector}
                          className="w-full flex items-center justify-between p-3 border border-cream-200 rounded-md bg-white hover:border-gold-300 transition-colors"
                        >
                          <span className="text-charcoal-700">
                            {selectedLanguage ? (
                              <span className="flex items-center">
                                <span className="mr-2 text-xl">{selectedLanguage.flag}</span>
                                {selectedLanguage.name}
                              </span>
                            ) : (
                              'Choose your language'
                            )}
                          </span>
                          <ChevronDown className={`h-4 w-4 text-charcoal-500 transition-transform ${showLanguageSelector ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {showLanguageSelector && (
                          <div className="absolute z-10 mt-1 w-full bg-white border border-cream-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                            {languages.map((language) => (
                              <button
                                key={language.code}
                                onClick={() => handleLanguageSelected(language.code)}
                                className="w-full flex items-center p-2 hover:bg-cream-50 transition-colors text-left"
                              >
                                <span className="text-xl mr-2">{language.flag}</span>
                                <div>
                                  <div className="font-medium text-charcoal-800">{language.name}</div>
                                  <div className="text-xs text-charcoal-500">{language.nativeName}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Chat interface */}
                  {selectedLanguage && messages.length > 0 && (
                    <div className="flex-1 flex flex-col">
                      {/* Messages area */}
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
                                  🔊 {t('Play audio')}
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
                            <div className="bg-white shadow-sm border border-cream-200 rounded-lg p-3">
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
                            title={browserSupportsSpeechRecognition ? t('assistant.actions.toggleMic', 'Toggle microphone') : t('assistant.errors.micNotSupported', 'Browser does not support speech recognition')}
                          >
                            {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                          </button>
                          
                          <div className="relative flex-1">
                            <textarea
                              value={input}
                              onChange={(e) => setInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSendMessage();
                                }
                              }}
                              placeholder={t('Type your message...', 'Type your message...')}
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
                            isLoading={isLoading}
                            className="bg-gold-400 hover:bg-gold-500 text-white"
                          >
                            <Send className="h-5 w-5" />
                          </Button>
                        </div>
                        
                        {listening && (
                          <div className="mt-2 text-xs text-charcoal-500">
                            {t('assistant.listening', 'Listening...')} {transcript ? `"${transcript}"` : ''}
                          </div>
                        )}
                        
                        {error && (
                          <div className="mt-2 text-xs text-red-500">
                            {error}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Initial welcome screen when language is selected but no messages yet */}
                  {selectedLanguage && messages.length === 0 && (
                    <div className="flex-1 flex items-center justify-center p-6 bg-cream-50">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <MessageSquare className="h-8 w-8 text-gold-400" />
                        </div>
                        <h3 className="text-lg font-medium text-charcoal-800 mb-2">
                          {t('assistant.greeting', 'Hello! I\'m your personal jewelry assistant. How can I help you today?')}
                        </h3>
                        <p className="text-sm text-charcoal-500">
                          {t('Ask me about jewelry, styles, or recommendations.')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Hidden audio element for playing responses */}
      <audio ref={audioRef} style={{ display: 'none' }} />
    </>
  );
};

export default MultilingualAssistant;