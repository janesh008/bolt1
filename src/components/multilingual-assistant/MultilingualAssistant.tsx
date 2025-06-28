import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, X, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import LanguageSelector from './LanguageSelector';
import { isValidConversationUrl } from '../../utils/videoUtils';

const MultilingualAssistant: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [showVideo, setShowVideo] = useState(true);
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'language' | 'video'>('language');
  const { user } = useAuth();
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const toggleAssistant = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setCurrentStep('language');
      setVideoError(null);
    }
  };

  const handleLanguageSelected = (language: string) => {
    i18n.changeLanguage(language);
    setCurrentStep('video');
    
    // Generate welcome video based on language
    generateWelcomeVideo(language);
  };
  
  const generateWelcomeVideo = async (language: string) => {
    try {
      setIsVideoLoading(true);

      const tavusApiKey = '8be099453eaf4049a4790eaf26fef074'; //import.meta.env.TAVUS_API_KEY;
      const replicaId = import.meta.env.TAVUS_REPLICA_ID || 'r6ae5b6efc9d';
      const personaId = import.meta.env.TAVUS_PERSONA_ID;

      const userName =
        user?.user_metadata?.full_name ||
        user?.email?.split('@')[0] ||
        'valued customer';

      const requestBody: Record<string, any> = {
        replica_id: replicaId,
        conversation_name: `Jewelry consultation with ${userName}`,
        conversational_context: `User interested in jewelry. Language: ${language}`,
        custom_greeting: `Hi ${userName}, welcome to our jewelry store.`,
      };

      if (personaId) {
        requestBody.persona_id = personaId;
      }

      const response = await fetch('https://tavusapi.com/v2/conversations', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "8be099453eaf4049a4790eaf26fef074"
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Tavus API returned an error');
      }

      if (data.conversation_url) {
        setConversationUrl(data.conversation_url);
        setConversationId(data.conversation_id);
        setShowVideo(true);
      } else {
        throw new Error('No conversation URL returned from Tavus');
      }
    } catch (err: any) {
      console.error('[TAVUS] Error generating video:', err);
      setVideoError(err?.message || 'Failed to generate Tavus video');
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
                <h2 className="text-xl font-serif">{t('assistant.title')}</h2>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleClose}
                    className="p-1 hover:bg-gold-500 rounded-full transition-colors"
                    aria-label="Close assistant"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              {/* Main content area */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Language selector */}
                {currentStep === 'language' && (
                  <div className="w-full flex items-center justify-center bg-cream-50 p-6">
                    <LanguageSelector onLanguageSelected={handleLanguageSelected} />
                  </div>
                )}
                
                {/* Video display */}
                {currentStep === 'video' && (
                  <div 
                    ref={videoContainerRef}
                    className="w-full h-full bg-black flex items-center justify-center"
                  >
                    {showVideo ? (
                      videoError ? (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                          <Video className="h-16 w-16 text-red-500 opacity-50 mb-4" />
                          <p className="text-white text-sm mb-2">{t('assistant.errors.videoFailed')}</p>
                          <button 
                            onClick={() => setCurrentStep('language')}
                            className="mt-4 px-3 py-1 bg-gold-400 hover:bg-gold-500 text-white rounded-md text-sm"
                          >
                            {t('common.retry')}
                          </button>
                        </div>
                      ) : isVideoLoading ? (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                          <div className="w-12 h-12 border-4 border-gold-200 border-t-gold-500 rounded-full animate-spin mb-4"></div>
                          <p className="text-white text-sm">{t('common.loading')}</p>
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
                            <Video className="h-16 w-16 text-gray-700 opacity-30 mx-auto mb-4" />
                            <p className="text-gray-500">{t('assistant.errors.connectionError')}</p>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <Video className="h-16 w-16 text-gray-700 opacity-30 mx-auto mb-4" />
                          <p className="text-gray-500 text-sm">{t('assistant.errors.videoFailed')}</p>
                          <button 
                            onClick={() => setShowVideo(true)}
                            className="mt-4 px-3 py-1 bg-gold-400 hover:bg-gold-500 text-white rounded-md text-sm"
                          >
                            {t('assistant.actions.startChat')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MultilingualAssistant;