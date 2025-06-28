import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Mic, MicOff, X, Volume2, ShoppingBag, Send, Minimize2, Maximize2, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import 'regenerator-runtime/runtime';
import LanguageSelector from './LanguageSelector';
import VideoChat from './VideoChat';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import MinimizedChat from './MinimizedChat';
import PreferencesForm from './PreferencesForm';
import { isValidConversationUrl } from '../../utils/videoUtils';

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVideo, setShowVideo] = useState(true);
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'language' | 'chat'>('language');
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
      // Add initial greeting based on selected language
      setMessages([
        {
          role: 'assistant',
          content: t('assistant.greeting'),
          timestamp: new Date()
        }
      ]);
    }
  }, [isOpen, messages.length, t]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleAssistant = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
    if (!isOpen) {
      setCurrentStep('language');
    }
  };
  
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleLanguageSelected = (language: string) => {
    i18n.changeLanguage(language);
    setCurrentStep('chat');
    
    // Add language-specific greeting
    setMessages([
      {
        role: 'assistant',
        content: t('assistant.greeting'),
        timestamp: new Date()
      }
    ]);
    
    // Generate welcome video based on language
    generateWelcomeVideo(language);
  };
  
  const generateWelcomeVideo = async (language: string) => {
    try {
    console.log("[🎬 TAVUS] Starting video generation...");

    const tavusApiKey = process.env.NEXT_PUBLIC_TAVUS_API_KEY;
    const replicaId = process.env.NEXT_PUBLIC_TAVUS_REPLICA_ID || 'r6ae5b6efc9d';
    const personaId = process.env.NEXT_PUBLIC_TAVUS_PERSONA_ID;

    if (!tavusApiKey) {
      console.error('[TAVUS] Missing API key');
      return;
    }

    const requestBody: Record<string, any> = {
      replica_id: replicaId,
      conversation_name: `Jewelry consultation with ${userName}`,
      conversational_context: `The user is interested in ${input}. Their name is ${userName}. Language: ${language}`,
      custom_greeting: `Hello ${userName}, I'm excited to help you find the perfect ${input} today!`,
    };

    if (personaId) {
      requestBody.persona_id = personaId;
    }

    console.log("[TAVUS] Sending request:", requestBody);

    const res = await fetch('https://tavusapi.com/v2/conversations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tavusApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await res.json();

    console.log("[TAVUS] Raw response:", data);

    if (!res.ok) {
      console.error('[TAVUS] API returned error:', data);
      return;
    }

    const { conversation_url, conversation_id, status } = data;

    if (!conversation_url) {
      console.error('[TAVUS] No conversation_url returned');
      return;
    }

    setConversationUrl(conversation_url);
    setConversationId(conversation_id);
    setShowVideo(true);

    console.log('[TAVUS] ✅ Conversation ready:', conversation_url);
    } catch (error) {
     console.error('[TAVUS] Exception:', error);
     console.error('Error generating welcome video:', error);
      setVideoError(error instanceof Error ? error.message : 'Failed to generate video');
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
    
    await generateAIResponse(input);
  };
  
  const generateAIResponse = async (userInput: string) => {
    setIsLoading(true);
    
    try {
      // Call the assistant API
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: userInput,
          language: i18n.language,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response from assistant');
      }
      
      const data = await response.json();
      
      // Create assistant message
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.reply,
        audioUrl: data.audioBase64 ? `data:audio/mp3;base64,${data.audioBase64}` : undefined,
        products: data.products,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Play audio response
      if (assistantMessage.audioUrl && audioRef.current) {
        audioRef.current.src = assistantMessage.audioUrl;
        audioRef.current.play();
        setIsPlaying(true);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: t('assistant.errors.connectionError'),
        timestamp: new Date()
      }]);
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
                <h2 className="text-xl font-serif">{t('assistant.title')}</h2>
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
              
              {/* Main content area */}
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Language selector */}
                {currentStep === 'language' && (
                  <div className="w-full flex items-center justify-center bg-cream-50 p-6">
                    <LanguageSelector onLanguageSelected={handleLanguageSelected} />
                  </div>
                )}
                
                {/* Chat interface */}
                {currentStep === 'chat' && (
                  <>
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
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Minimized Chat */}
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

export default MultilingualAssistant;