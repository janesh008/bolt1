import React from 'react';
import { Mic, MicOff, Send } from 'lucide-react';
import Button from '../ui/Button';
import { useTranslation } from 'react-i18next';

interface MessageInputProps {
  input: string;
  setInput: (input: string) => void;
  handleSendMessage: () => void;
  isLoading: boolean;
  listening: boolean;
  toggleMic: () => void;
  transcript: string;
  browserSupportsSpeechRecognition: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  input,
  setInput,
  handleSendMessage,
  isLoading,
  listening,
  toggleMic,
  transcript,
  browserSupportsSpeechRecognition
}) => {
  const { t } = useTranslation();

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
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
            onKeyDown={handleKeyPress}
            placeholder={t('assistant.placeholders.message', 'Ask about jewelry, styles, or recommendations...')}
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
    </div>
  );
};

export default MessageInput;