import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, X, Globe, ChevronDown, ChevronUp, Minimize2, Maximize2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { isValidConversationUrl } from '../../utils/videoUtils';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
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
  const [isOpen, setIsOpen] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [showVideo, setShowVideo] = useState(true);
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const { user } = useAuth();
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowLanguageDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleAssistant = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setShowLanguageDropdown(false);
      setVideoError(null);
      setSelectedLanguage(null);
      setConversationUrl(null);
    }
  };

  const toggleLanguageDropdown = () => {
    setShowLanguageDropdown(!showLanguageDropdown);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleLanguageSelected = (language: Language) => {
    setSelectedLanguage(language);
    i18n.changeLanguage(language.code);
    setShowLanguageDropdown(false);
    
    // Generate welcome video based on language
    generateWelcomeVideo(language.code);
  };
  
  const generateWelcomeVideo = async (languageCode: string) => {
    try {
      setIsVideoLoading(true);

      const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'valued customer';
      
      const response = await fetch('/api/video', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_name: userName,
          product_name: "luxury jewelry",
          language: languageCode
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate video');
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
        aria-label="Open AI Assistant"
      >
        <Video className="h-6 w-6" />
      </button>
      
      {/* Assistant Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-20 right-6 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-2xl overflow-hidden"
              style={{ 
                width: '300px', 
                height: isMinimized ? '50px' : '300px'
              }}
            >
              {/* Header */}
              <div className="bg-gold-400 text-white p-2 flex items-center justify-between">
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
                <div className="relative h-[calc(300px-32px)]">
                  {/* Language selector */}
                  {!selectedLanguage && (
                    <div className="w-full h-full bg-cream-50 p-4">
                      <div className="text-center mb-4">
                        <Globe className="h-8 w-8 text-gold-500 mx-auto mb-2" />
                        <h3 className="text-sm font-medium text-charcoal-800">
                          {t('assistant.languageSelector')}
                        </h3>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-[200px]">
                        {languages.map((language) => (
                          <button
                            key={language.code}
                            onClick={() => handleLanguageSelected(language)}
                            className="flex items-center p-2 border border-cream-200 rounded hover:bg-gold-50 hover:border-gold-300 transition-colors"
                          >
                            <span className="text-xl mr-2">{language.flag}</span>
                            <div className="text-left">
                              <div className="text-xs font-medium">{language.name}</div>
                              <div className="text-xs text-charcoal-500">{language.nativeName}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Video display */}
                  {selectedLanguage && (
                    <div className="w-full h-full bg-black">
                      {showVideo ? (
                        videoError ? (
                          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                            <Video className="h-10 w-10 text-red-500 opacity-50 mb-2" />
                            <p className="text-white text-xs mb-2">{t('assistant.errors.videoFailed')}</p>
                            <button 
                              onClick={() => {
                                setVideoError(null);
                                generateWelcomeVideo(selectedLanguage.code);
                              }}
                              className="mt-2 px-3 py-1 bg-gold-400 hover:bg-gold-500 text-white rounded-md text-xs"
                            >
                              {t('common.retry')}
                            </button>
                          </div>
                        ) : isVideoLoading ? (
                          <div className="w-full h-full flex flex-col items-center justify-center">
                            <div className="w-10 h-10 border-4 border-gold-200 border-t-gold-500 rounded-full animate-spin mb-2"></div>
                            <p className="text-white text-xs">{t('common.loading')}</p>
                          </div>
                        ) : conversationUrl && isValidConversationUrl(conversationUrl) ? (
                          <iframe
                            src={conversationUrl}
                            className="w-full h-full border-0"
                            allow="camera; microphone; accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            onError={() => {
                              console.error("iframe error event");
                              setVideoError(t('assistant.errors.videoFailed'));
                              setShowVideo(false);
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center">
                              <Video className="h-10 w-10 text-gray-700 opacity-30 mx-auto mb-2" />
                              <p className="text-gray-500 text-xs">{t('assistant.errors.connectionError')}</p>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center">
                            <Video className="h-10 w-10 text-gray-700 opacity-30 mx-auto mb-2" />
                            <p className="text-gray-500 text-xs">{t('assistant.errors.videoFailed')}</p>
                            <button 
                              onClick={() => {
                                setShowVideo(true);
                                generateWelcomeVideo(selectedLanguage.code);
                              }}
                              className="mt-2 px-3 py-1 bg-gold-400 hover:bg-gold-500 text-white rounded-md text-xs"
                            >
                              {t('assistant.actions.startChat')}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MultilingualAssistant;