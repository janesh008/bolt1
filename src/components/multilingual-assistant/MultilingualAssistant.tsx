import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video,
  X,
  Globe,
  Minimize2,
  Maximize2,
  ChevronDown
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { isValidConversationUrl } from '../../utils/videoUtils';
import DailyIframe, { DailyCall } from '@daily-co/daily-js'; // NEW

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi',   nativeName: 'हिन्दी',  flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati',nativeName: 'ગુજરાતી',flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil',   nativeName: 'தமிழ்',   flag: '🇮🇳' },
  { code: 'te', name: 'Telugu',  nativeName: 'తెలుగు',  flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी',   flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা',    flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French',  nativeName: 'Français',flag: '🇫🇷' },
  { code: 'ar', name: 'Arabic',  nativeName: 'العربية', flag: '🇦🇪' }
];

const MultilingualAssistant: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const [isOpen, setIsOpen]             = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [showVideo, setShowVideo]       = useState(true);
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [_conversationId, setConversationId] = useState<string | null>(null);
  const [videoError, setVideoError]     = useState<string | null>(null);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [isMinimized, setIsMinimized]   = useState(false);

  const videoContainerRef  = useRef<HTMLDivElement>(null);
  const dropdownRef        = useRef<HTMLDivElement>(null);
  const assistantRef       = useRef<HTMLDivElement>(null);
  const dailyCallRef       = useRef<DailyCall | null>(null);        // NEW

  /* ───────────────────────────────
     CLEAN UP PREBUILT WHEN NEEDED
     ─────────────────────────────── */
  const destroyDailyCall = () => {                                   // NEW
    if (dailyCallRef.current) {
      dailyCallRef.current.leave();
      dailyCallRef.current.destroy();
      dailyCallRef.current = null;
    }
  };

  /* ──────────────────────
     CLICK‑OUTSIDE HANDLER
     ────────────────────── */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        assistantRef.current &&
        assistantRef.current.contains(event.target as Node)
      ) {
        setShowLanguageSelector(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* ────────────────────────────────
     EMBED DAILY PREBUILT WITH FLAGS
     ──────────────────────────────── */
  useEffect(() => {                                                  // NEW
    if (
      conversationUrl &&
      showVideo &&
      isValidConversationUrl(conversationUrl) &&
      videoContainerRef.current
    ) {
      // Show loader until the 'joined-meeting' event fires
      setIsVideoLoading(true);

      // Build the iframe with only mic‑mute visible
      const call = DailyIframe.createFrame(videoContainerRef.current, {
        iframeStyle: {
          width: '100%',
          height: '100%',
          border: '0',
        },
        // Prebuilt UI flags — all extras off
        showLeaveButton: false,
        showFullscreenButton: false,
        showLocalVideo: false,
        showParticipantsBar: false,
      });

      dailyCallRef.current = call;

      // Join the Tavus conversation room
      call
        .join({
          url: conversationUrl,
          startVideoOff: true,
          startAudioOff: false,
        })
        .catch((err) => {
          console.error('[TAVUS] Daily join error:', err);
          setVideoError(t('assistant.errors.connectionError'));
          setShowVideo(false);
        });

      // Stop loader once connected
      call.on('joined-meeting', () => setIsVideoLoading(false));

      // Handle any runtime errors from Daily
      call.on('error', (e) => {
        console.error('[TAVUS] Daily runtime error:', e);
        setVideoError(t('assistant.errors.videoFailed'));
        setShowVideo(false);
      });

      // Clean up when conversationUrl changes or component unmounts
      return () => destroyDailyCall();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationUrl, showVideo]);

  /* ─────────────────────
     TOGGLE ASSISTANT OPEN
     ───────────────────── */
  const toggleAssistant = () => {
    if (isOpen) {
      destroyDailyCall(); // NEW — kills existing call when closing
    } else {
      setShowLanguageSelector(false);
      setVideoError(null);
      setSelectedLanguage(null);
      setConversationUrl(null);
      setIsMinimized(false);
    }
    setIsOpen(!isOpen);
  };

  const toggleLanguageSelector = () => setShowLanguageSelector(!showLanguageSelector);
  const toggleMinimize         = () => setIsMinimized(!isMinimized);
  const handleClose            = () => { setIsOpen(false); destroyDailyCall(); }; // NEW

  /* ────────────────────────────────
     LANGUAGE SELECTION / WELCOME VID
     ──────────────────────────────── */
  const handleLanguageSelected = (language: string) => {
    const selectedLang = languages.find((lang) => lang.code === language);
    if (!selectedLang) return;

    setSelectedLanguage(selectedLang);
    i18n.changeLanguage(language);
    setShowLanguageSelector(false);
    generateWelcomeVideo(language);
  };

  const generateWelcomeVideo = async (language: string) => {
    try {
      setIsVideoLoading(true);

      const tavusApiKey = import.meta.env.TAVUS_API_KEY;
      const replicaId   = import.meta.env.TAVUS_REPLICA_ID || 'r6ae5b6efc9d';
      const personaId   = import.meta.env.TAVUS_PERSONA_ID;
      const userName    =
        user?.full_name || user?.email?.split('@')[0] || 'valued customer';

      const requestBody: Record<string, any> = {
        replica_id: replicaId,
        conversation_name: `Jewelry consultation with ${userName}`,
        conversational_context: `User interested in jewelry. Language: ${language}`,
        custom_greeting: `Hi ${userName}, welcome to our jewelry store. I'm here to help you find the perfect piece.`
      };
      if (personaId) requestBody.persona_id = personaId;

      const response = await fetch('https://tavusapi.com/v2/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': tavusApiKey
        },
        body: JSON.stringify(requestBody)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Tavus API returned an error');
      if (!data.conversation_url) throw new Error('No conversation URL returned');

      setConversationUrl(data.conversation_url);
      setConversationId(data.conversation_id);
      setShowVideo(true);
    } catch (err: any) {
      console.error('[TAVUS] Error generating video:', err);
      setVideoError(err?.message || 'Failed to generate Tavus video');
      setShowVideo(false);
    } finally {
      setIsVideoLoading(false);
    }
  };

  /* ───────────────────
     RENDER COMPONENT UI
     ─────────────────── */
  return (
    <>
      {/* Floating launcher button */}
      <button
        onClick={toggleAssistant}
        className="fixed bottom-6 right-6 z-50 p-4 bg-gold-400 hover:bg-gold-500 text-white rounded-full shadow-lg transition-all duration-300 flex items-center justify-center"
        aria-label="Open AI Assistant"
      >
        <Video className="h-6 w-6" />
      </button>

      {/* Assistant modal */}
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
              className="bg-white rounded-lg shadow-2xl overflow-hidden"
              style={{ width: '300px', height: isMinimized ? '50px' : '300px' }}
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
                    aria-label={isMinimized ? 'Maximize' : 'Minimize'}
                  >
                    {isMinimized ? (
                      <Maximize2 className="h-3 w-3" />
                    ) : (
                      <Minimize2 className="h-3 w-3" />
                    )}
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

              {/* Body */}
              {!isMinimized && (
                <div className="relative h-[calc(300px-50px)]">
                  {/* Language selector view */}
                  {!selectedLanguage && (
                    <div className="w-full h-full bg-cream-50 p-4">
                      {/* … unchanged selector UI … */}
                    </div>
                  )}

                  {/* Video container */}
                  {selectedLanguage && (
                    <div ref={videoContainerRef} className="w-full h-full bg-black">
                      {videoError ? (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                          <Video className="h-10 w-10 text-red-500 opacity-50 mb-2" />
                          <p className="text-white text-xs">{t('assistant.errors.videoFailed')}</p>
                          <button
                            onClick={() => {
                              setVideoError(null);
                              setShowVideo(true);
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
                      ) : null /* Daily’s iframe is injected directly; no placeholder needed */ }
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
