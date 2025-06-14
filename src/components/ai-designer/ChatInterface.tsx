import React, { useState, useRef, useEffect } from 'react';
import { Heart, Send, RefreshCw, Download, ShoppingBag, Clock, Star, Sparkles, X, Image as ImageIcon } from 'lucide-react';
import { AIDesignSession, AIMessage } from '../../types/ai-designer';
import { Input } from '../ui/input';
import Button from '../ui/Button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { formatDistanceToNow } from 'date-fns';
import useAIDesignerStore from '../../store/useAIDesignerStore';
import toast from 'react-hot-toast';

interface ChatInterfaceProps {
  session: AIDesignSession;
  messages: AIMessage[];
  onBack: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ session, messages, onBack }) => {
  const [newMessage, setNewMessage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { sendMessage, toggleFavorite, deleteSession, isLoading } = useAIDesignerStore();
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() && !imageFile) return;
    
    await sendMessage(session.id, newMessage, imageFile || undefined);
    
    // Clear form
    setNewMessage('');
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image must be less than 5MB');
        return;
      }
      
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };
  
  const removeImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
  };
  
  const handleFavoriteToggle = async () => {
    await toggleFavorite(session.id);
  };
  
  const handleDeleteSession = async () => {
    if (confirm('Are you sure you want to delete this design session? This action cannot be undone.')) {
      const success = await deleteSession(session.id);
      if (success) {
        onBack();
      }
    }
  };
  
  const getExpirationText = () => {
    if (session.is_favorite) {
      return 'Favorited – will be retained permanently';
    }
    
    if (!session.expires_at) {
      return 'No expiration date';
    }
    
    const expiresAt = new Date(session.expires_at);
    const now = new Date();
    
    if (expiresAt < now) {
      return 'Expired';
    }
    
    return `Expires in ${formatDistanceToNow(expiresAt)}`;
  };
  
  const downloadImage = (imageUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `axels-design-${session.id}-${index}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Image downloaded');
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white p-4 border-b border-cream-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onBack}>
            <X className="h-4 w-4 mr-1" />
            Close
          </Button>
          <h2 className="font-medium text-charcoal-800 ml-2">
            {session.title || `${session.category} Design`}
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge 
            variant={session.is_favorite ? "success" : "secondary"}
            className="flex items-center gap-1"
          >
            {session.is_favorite ? (
              <>
                <Star className="h-3 w-3" />
                <span>Favorited</span>
              </>
            ) : (
              <>
                <Clock className="h-3 w-3" />
                <span>{getExpirationText()}</span>
              </>
            )}
          </Badge>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleFavoriteToggle}
            className={session.is_favorite ? "text-yellow-600" : ""}
          >
            {session.is_favorite ? (
              <>
                <Star className="h-4 w-4 mr-1 fill-yellow-500" />
                Unfavorite
              </>
            ) : (
              <>
                <Star className="h-4 w-4 mr-1" />
                Favorite
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteSession}
            className="text-red-600"
          >
            <X className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>
      
      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-cream-50">
        <div className="space-y-6 max-w-3xl mx-auto">
          {messages.map((message, index) => (
            <div 
              key={message.id} 
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.sender === 'user' 
                    ? 'bg-gold-100 text-charcoal-800' 
                    : 'bg-white shadow-soft'
                }`}
              >
                {/* Message text */}
                <div className="prose prose-sm max-w-none">
                  {message.message.split('\n').map((line, i) => (
                    <p key={i} className="mb-2">{line}</p>
                  ))}
                </div>
                
                {/* Message image */}
                {message.image_url && (
                  <div className="mt-3">
                    <img 
                      src={message.image_url} 
                      alt="Design" 
                      className="rounded-md max-h-80 w-auto"
                    />
                    
                    {/* Image actions (only for AI-generated images) */}
                    {message.sender === 'assistant' && message.image_url && (
                      <div className="flex mt-2 gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => downloadImage(message.image_url!, index)}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                        
                        <Button variant="outline" size="sm">
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Regenerate
                        </Button>
                        
                        <Button variant="outline" size="sm">
                          <Heart className="h-3 w-3 mr-1" />
                          Like
                        </Button>
                        
                        <Button variant="outline" size="sm">
                          <ShoppingBag className="h-3 w-3 mr-1" />
                          Order
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Timestamp */}
                <div className={`text-xs mt-2 ${
                  message.sender === 'user' ? 'text-charcoal-500' : 'text-charcoal-400'
                }`}>
                  {new Date(message.created_at).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Message Input */}
      <div className="bg-white border-t border-cream-200 p-4">
        {imagePreview && (
          <div className="mb-3 relative inline-block">
            <img 
              src={imagePreview} 
              alt="Upload preview" 
              className="h-16 rounded-md border border-cream-200"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute -top-2 -right-2 p-1 bg-charcoal-800 rounded-full text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-charcoal-500 hover:text-charcoal-700 transition-colors"
          >
            <ImageIcon className="h-5 w-5" />
          </button>
          
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
            disabled={isLoading}
          />
          
          <Button type="submit" disabled={isLoading} isLoading={isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;