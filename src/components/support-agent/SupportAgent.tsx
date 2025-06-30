import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Globe, MessageSquare, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSupportSession } from './useSupportSession';
import { cn } from '../../lib/utils';

interface SupportAgentProps {
  className?: string;
}

const SupportAgent: React.FC<SupportAgentProps> = ({ className }) => {
  const { t } = useTranslation();
  const { 
    state, 
    toggleOpen, 
    startListening, 
    stopListening, 
    sendMessage,
    setLanguage
  } = useSupportSession();
  
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);
  
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    
    sendMessage(input);
    setInput('');
  };
  
  const toggleMic = () => {
    if (state.isListening) {
      stopListening();
    } else {
      startListening();
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  ];
  
  const handleLanguageSelect = (code: string) => {
    setLanguage(code);
    setShowLanguageSelector(false);
  };
  
  return (
    <div className={cn("relative", className)}>
      {/* Floating button */}
      <motion.button
        onClick={toggleOpen}
        className="fixed bottom-6 right-6 z-40 p-4 bg-gold-400 hover:bg-gold-500 text-white rounded-full shadow-lg transition-all duration-300 flex items-center justify-center"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open Support Agent"
      >
        <MessageSquare className="h-6 w-6" />
      </motion.button>
      
      {/* Support Agent Dialog */}
      <AnimatePresence>
        {state.isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-20 right-6 z-40 w-80 md:w-96 bg-white rounded-lg shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gold-400 text-white p-4 flex items-center justify-between">
              <h3 className="font-medium flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                {t('Support Agent')}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowLanguageSelector(!showLanguageSelector)}
                  className="p-1 hover:bg-gold-500 rounded-full transition-colors"
                  aria-label="Change language"
                >
                  <Globe className="h-5 w-5" />
                </button>
                <button
                  onClick={toggleOpen}
                  className="p-1 hover:bg-gold-500 rounded-full transition-colors"
                  aria-label="Close support agent"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Language Selector */}
            <AnimatePresence>
              {showLanguageSelector && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-cream-50 border-b border-cream-200 overflow-hidden"
                >
                  <div className="p-4">
                    <h4 className="text-sm font-medium text-charcoal-800 mb-2">
                      {t('Select your language')}
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => handleLanguageSelect(lang.code)}
                          className={cn(
                            "flex items-center p-2 rounded-md text-left text-sm",
                            state.language === lang.code
                              ? "bg-gold-100 text-gold-600 border border-gold-200"
                              : "hover:bg-cream-100 border border-transparent"
                          )}
                        >
                          <span className="text-xl mr-2">{lang.flag}</span>
                          <span>{lang.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Messages Area */}
            <div className="h-80 overflow-y-auto p-4 bg-cream-50">
              {state.messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <div className="w-16 h-16 bg-gold-100 rounded-full flex items-center justify-center mb-4">
                    <MessageSquare className="h-8 w-8 text-gold-400" />
                  </div>
                  <h4 className="text-charcoal-800 font-medium mb-2">
                    {t('How can I help you today?')}
                  </h4>
                  <p className="text-charcoal-500 text-sm">
                    {t('Ask me about your orders, returns, or any other support questions.')}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {state.messages.map((msg, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex",
                        msg.role === 'user' ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg p-3",
                          msg.role === 'user'
                            ? "bg-gold-100 text-charcoal-800"
                            : "bg-white shadow-sm border border-cream-200"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        {msg.audioUrl && (
                          <button
                            onClick={() => {
                              const audio = new Audio(msg.audioUrl);
                              audio.play().catch(console.error);
                            }}
                            className="mt-2 text-xs flex items-center text-gold-500 hover:text-gold-600"
                          >
                            <span className="mr-1">🔊</span>
                            {t('Play audio')}
                          </button>
                        )}
                        <div className="text-xs mt-1 text-right text-charcoal-400">
                          {new Date(msg.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                  {state.isLoading && (
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
              )}
            </div>
            
            {/* Input Area */}
            <div className="border-t border-cream-200 p-4">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleMic}
                  className={cn(
                    "p-2 rounded-full transition-colors",
                    state.isListening
                      ? "bg-red-100 text-red-600"
                      : "bg-cream-100 text-charcoal-600 hover:bg-cream-200"
                  )}
                  disabled={state.isLoading}
                >
                  {state.isListening ? (
                    <MicOff className="h-5 w-5" />
                  ) : (
                    <Mic className="h-5 w-5" />
                  )}
                </button>
                
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={t('Type your question...')}
                  className="flex-1 px-4 py-2 border border-cream-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-400"
                  disabled={state.isLoading}
                />
                
                <button
                  type="submit"
                  disabled={!input.trim() || state.isLoading}
                  className={cn(
                    "p-2 rounded-md bg-gold-400 text-white",
                    (!input.trim() || state.isLoading) 
                      ? "opacity-50 cursor-not-allowed" 
                      : "hover:bg-gold-500"
                  )}
                >
                  {state.isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <span className="font-medium">Send</span>
                  )}
                </button>
              </form>
              
              {state.isListening && (
                <div className="mt-2 flex justify-center">
                  <div className="flex items-center gap-1">
                    <span className="w-1 h-3 bg-red-500 rounded-full animate-pulse"></span>
                    <span className="w-1 h-5 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></span>
                    <span className="w-1 h-7 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-1 h-4 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></span>
                    <span className="w-1 h-6 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                </div>
              )}
              
              {state.error && (
                <div className="mt-2 text-xs text-red-500">
                  {state.error}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SupportAgent;