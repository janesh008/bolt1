import React from 'react';
import { motion } from 'framer-motion';
import { Maximize2, X, Mic, MicOff, Send } from 'lucide-react';
import Button from '../ui/Button';

interface MinimizedChatProps {
  conversationUrl: string | null;
  toggleMinimize: () => void;
  toggleAssistant: () => void;
  input: string;
  setInput: (input: string) => void;
  handleSendMessage: () => void;
  isLoading: boolean;
  listening: boolean;
  toggleMic: () => void;
  browserSupportsSpeechRecognition: boolean;
  setVideoError: (error: string | null) => void;
  setShowVideo: (show: boolean) => void;
  setIsMinimized: (isMinimized: boolean) => void;
}

const MinimizedChat: React.FC<MinimizedChatProps> = ({
  conversationUrl,
  toggleMinimize,
  toggleAssistant,
  input,
  setInput,
  handleSendMessage,
  isLoading,
  listening,
  toggleMic,
  browserSupportsSpeechRecognition,
  setVideoError,
  setShowVideo,
  setIsMinimized
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
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
        {console.log("Minimized iframe with URL:", conversationUrl)}
        {conversationUrl && (
          <iframe
            src={conversationUrl}
            className="w-full h-full border-0"
            allow="camera; microphone; accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onError={() => {
              console.error("Minimized iframe error");
              setVideoError('Failed to load video chat');
              setShowVideo(false);
              setIsMinimized(false);
            }}
          />
        )}
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
  );
};

export default MinimizedChat;