import React from 'react';
import { Gem, Sparkles, Diamond, FileText, Image as ImageIcon } from 'lucide-react';
import { AIDesignSession } from '../../types/ai-designer';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

interface SessionSidebarProps {
  session: AIDesignSession;
}

const SessionSidebar: React.FC<SessionSidebarProps> = ({ session }) => {
  return (
    <div className="bg-white p-4 border-l border-cream-200 space-y-6">
      <div>
        <h3 className="font-medium text-charcoal-800 mb-2">Design Details</h3>
        <Separator className="mb-4" />
        
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-cream-100 rounded-full">
              <Gem className="h-4 w-4 text-gold-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-charcoal-700">Category</p>
              <p className="text-sm text-charcoal-600 capitalize">{session.category}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="p-2 bg-cream-100 rounded-full">
              <Sparkles className="h-4 w-4 text-gold-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-charcoal-700">Metal Type</p>
              <p className="text-sm text-charcoal-600 capitalize">{session.metal_type}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="p-2 bg-cream-100 rounded-full">
              <Sparkles className="h-4 w-4 text-gold-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-charcoal-700">Style</p>
              <p className="text-sm text-charcoal-600 capitalize">{session.style}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="p-2 bg-cream-100 rounded-full">
              <Diamond className="h-4 w-4 text-gold-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-charcoal-700">Diamond Option</p>
              <p className="text-sm text-charcoal-600 capitalize">{session.diamond_type}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="font-medium text-charcoal-800 mb-2">Description</h3>
        <Separator className="mb-4" />
        <p className="text-sm text-charcoal-600 whitespace-pre-line">
          {session.description}
        </p>
      </div>
      
      {session.reference_image_url && (
        <div>
          <h3 className="font-medium text-charcoal-800 mb-2">Reference Image</h3>
          <Separator className="mb-4" />
          <div className="rounded-lg overflow-hidden border border-cream-200">
            <img 
              src={session.reference_image_url} 
              alt="Reference" 
              className="w-full h-auto"
            />
          </div>
        </div>
      )}
      
      <div>
        <h3 className="font-medium text-charcoal-800 mb-2">Session Info</h3>
        <Separator className="mb-4" />
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-charcoal-500">Created:</span>
            <span className="text-charcoal-700">
              {new Date(session.created_at).toLocaleDateString()}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-charcoal-500">Status:</span>
            <Badge variant={session.status === 'active' ? 'success' : 'secondary'}>
              {session.status}
            </Badge>
          </div>
          
          <div className="flex justify-between">
            <span className="text-charcoal-500">Favorite:</span>
            <span className="text-charcoal-700">
              {session.is_favorite ? 'Yes' : 'No'}
            </span>
          </div>
          
          {session.expires_at && !session.is_favorite && (
            <div className="flex justify-between">
              <span className="text-charcoal-500">Expires:</span>
              <span className="text-charcoal-700">
                {new Date(session.expires_at).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionSidebar;