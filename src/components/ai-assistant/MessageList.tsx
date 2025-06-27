import React from 'react';
import { Volume2 } from 'lucide-react';
import ProductCarousel from './ProductCarousel';

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

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  playAudio: (audioUrl: string) => void;
  isPlaying: boolean;
  audioRef: React.RefObject<HTMLAudioElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading,
  playAudio,
  isPlaying,
  audioRef,
  messagesEndRef
}) => {
  return (
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
                <Volume2 className="h-4 w-4 mr-1" />
                {isPlaying && audioRef.current?.src === message.audioUrl 
                  ? 'Playing...' 
                  : 'Play audio response'}
              </button>
            )}
            
            {message.products && message.products.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-charcoal-700 mb-2">Recommended for you:</h4>
                <ProductCarousel products={message.products} />
              </div>
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
          <div className="bg-white shadow-soft border border-cream-200 rounded-lg p-4 max-w-[80%]">
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
  );
};

export default MessageList;