import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, X, Globe, ChevronDown, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { isValidConversationUrl, hideUserVideo, applyLanguageSettings } from '../../utils/videoUtils';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇦🇪' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' }
];

const MultilingualAssistant: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [showVideo, setShowVideo] = useState(true);
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const { user } = useAuth();
  const videoRef = useRef<HTMLIFrameElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load saved language preference
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred_language');
    if (savedLanguage) {
      i18n.changeLanguage(savedLanguage);
    }
  }, [i18n]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLanguageDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Hide user video when iframe loads
  useEffect(() => {
    if (videoRef.current && conversationUrl) {
      const iframe = videoRef.current;
      
      // Wait for iframe to load
      iframe.onload = () => {
        // Hide user video
        hideUserVideo(iframe);
        
        // Apply language settings
        applyLanguageSettings(iframe, i18n.language);
      };
    }
  }, [conversationUrl, i18n.language]);

  const toggleAssistant = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // If we have a saved language, generate video right away
      const savedLanguage = localStorage.getItem('preferred_language');
      if (savedLanguage) {
        generateWelcomeVideo(savedLanguage);
      }
    }
  };

  const handleLanguageSelect = (language: string) => {
    i18n.changeLanguage(language);
    localStorage.setItem('preferred_language', language);
    setIsLanguageDropdownOpen(false);
    generateWelcomeVideo(language);
  };
  
  const generateWelcomeVideo = async (language: string) => {
    try {
      setIsVideoLoading(true);
      setVideoError(null);
      
      // Get user's name from metadata or use a default
      const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'valued customer';
      
      // Call API to generate video
      const response = await fetch('/api/video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          user_name: userName,
          product_name: 'jewelry',
          language: language
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate welcome video');
      }
      
      const data = await response.json();
      
      if (data.conversationUrl) {
        setConversationUrl(data.conversationUrl);
        setConversationId(data.conversationId);
        setShowVideo(true);
      } else {
        throw new Error('No conversation URL returned');
      }
    } catch (error) {
      console.error('Error generating welcome video:', error);
      setVideoError(error instanceof Error ? error.message : 'Failed to generate video');
      setShowVideo(false);
    } finally {
      setIsVideoLoading(false);
    }
  };

  const getCurrentLanguage = () => {
    return languages.find(lang => lang.code === i18n.language) || languages[0];
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
      
      {/* Video Assistant */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-20 right-6 z-50 shadow-xl rounded-lg overflow-hidden"
          >
            <div className="relative w-80 h-60 bg-black">
              {/* Video Container */}
              {isVideoLoading ? (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <div className="w-12 h-12 border-4 border-gold-200 border-t-gold-500 rounded-full animate-spin mb-4"></div>
                  <p className="text-white text-sm">{t('common.loading')}</p>
                </div>
              ) : videoError ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                  <Video className="h-12 w-12 text-red-500 opacity-50 mb-4" />
                  <p className="text-white text-sm mb-2">{t('assistant.errors.videoFailed')}</p>
                  <button 
                    onClick={() => generateWelcomeVideo(i18n.language)}
                    className="mt-2 px-3 py-1 bg-gold-400 hover:bg-gold-500 text-white rounded-md text-sm"
                  >
                    {t('common.retry')}
                  </button>
                </div>
              ) : conversationUrl && isValidConversationUrl(conversationUrl) ? (
                <iframe
                  ref={videoRef}
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
                  <div className="text-center p-4">
                    <Globe className="h-12 w-12 text-gold-400 mx-auto mb-4" />
                    <p className="text-white text-sm mb-4">{t('assistant.languageSelector')}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {languages.slice(0, 4).map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => handleLanguageSelect(lang.code)}
                          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white p-2 rounded-md text-sm transition-colors"
                        >
                          <span>{lang.flag}</span>
                          <span>{lang.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Language Selector */}
              {conversationUrl && (
                <div ref={dropdownRef} className="absolute bottom-2 left-2">
                  <button
                    onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                    className="flex items-center gap-1 bg-black/50 hover:bg-black/70 text-white px-2 py-1 rounded-md text-xs transition-colors"
                  >
                    <span>{getCurrentLanguage().flag}</span>
                    <span>{getCurrentLanguage().name}</span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  
                  {isLanguageDropdownOpen && (
                    <div className="absolute bottom-full left-0 mb-1 bg-white rounded-md shadow-lg overflow-hidden w-40">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => handleLanguageSelect(lang.code)}
                          className="flex items-center justify-between w-full px-3 py-2 text-sm text-left hover:bg-cream-100 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span>{lang.flag}</span>
                            <span>{lang.name}</span>
                          </div>
                          {lang.code === i18n.language && (
                            <Check className="h-3 w-3 text-gold-500" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MultilingualAssistant;