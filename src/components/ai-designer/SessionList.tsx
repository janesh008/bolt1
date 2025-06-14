import React, { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { Star, Clock, Search, Plus, Gem, Filter } from 'lucide-react';
import { AIDesignSession } from '../../types/ai-designer';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import Button from '../ui/Button';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';

interface SessionListProps {
  sessions: AIDesignSession[];
  onSelectSession: (session: AIDesignSession) => void;
  onNewSession: () => void;
}

type SortOption = 'recent' | 'favorited' | 'expiring';

const SessionList: React.FC<SessionListProps> = ({ 
  sessions, 
  onSelectSession,
  onNewSession
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [filterFavorites, setFilterFavorites] = useState(false);
  
  // Filter and sort sessions
  const filteredSessions = sessions
    .filter(session => {
      // Filter by search term
      const matchesSearch = !searchTerm || 
        session.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter by favorites
      const matchesFavorite = !filterFavorites || session.is_favorite;
      
      return matchesSearch && matchesFavorite;
    })
    .sort((a, b) => {
      // Sort by selected option
      switch (sortBy) {
        case 'recent':
          return new Date(b.last_message_at || b.created_at).getTime() - 
                 new Date(a.last_message_at || a.created_at).getTime();
        
        case 'favorited':
          // Sort by favorite status first, then by recency
          if (a.is_favorite && !b.is_favorite) return -1;
          if (!a.is_favorite && b.is_favorite) return 1;
          return new Date(b.last_message_at || b.created_at).getTime() - 
                 new Date(a.last_message_at || a.created_at).getTime();
        
        case 'expiring':
          // Sort by expiration date (non-expiring/favorited items at the end)
          if (!a.expires_at && !b.expires_at) return 0;
          if (!a.expires_at) return 1;
          if (!b.expires_at) return -1;
          return new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime();
        
        default:
          return 0;
      }
    });
  
  const getExpirationBadge = (session: AIDesignSession) => {
    if (session.is_favorite) {
      return (
        <Badge variant="success" className="flex items-center gap-1">
          <Star className="h-3 w-3" />
          <span>Favorited</span>
        </Badge>
      );
    }
    
    if (!session.expires_at) {
      return null;
    }
    
    const expiresAt = new Date(session.expires_at);
    const now = new Date();
    const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 0) {
      return (
        <Badge variant="error" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>Expired</span>
        </Badge>
      );
    }
    
    if (daysLeft <= 3) {
      return (
        <Badge variant="warning" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>Expires in {daysLeft} days</span>
        </Badge>
      );
    }
    
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        <span>Expires in {daysLeft} days</span>
      </Badge>
    );
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif text-charcoal-800">Your Design Sessions</h2>
        <Button onClick={onNewSession}>
          <Plus className="h-4 w-4 mr-2" />
          New Design
        </Button>
      </div>
      
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />
          <Input
            placeholder="Search designs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="favorited">Favorites First</SelectItem>
              <SelectItem value="expiring">Expiring Soon</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant={filterFavorites ? "default" : "outline"}
            onClick={() => setFilterFavorites(!filterFavorites)}
            className={cn(
              "flex items-center gap-1",
              filterFavorites && "bg-gold-400 hover:bg-gold-500"
            )}
          >
            <Star className={cn(
              "h-4 w-4",
              filterFavorites && "fill-white"
            )} />
            <span>Favorites</span>
          </Button>
        </div>
      </div>
      
      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-soft">
          <Gem className="w-16 h-16 text-charcoal-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-charcoal-800 mb-2">No design sessions found</h3>
          <p className="text-charcoal-500 mb-6">
            {searchTerm || filterFavorites
              ? "Try adjusting your search or filters"
              : "Start your first jewelry design session"}
          </p>
          <Button onClick={onNewSession}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Design
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSessions.map((session) => (
            <Card 
              key={session.id}
              className={cn(
                "cursor-pointer hover:shadow-md transition-shadow",
                session.is_favorite && "border-gold-300"
              )}
              onClick={() => onSelectSession(session)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-charcoal-800">
                    {session.title || `${session.category} Design`}
                  </h3>
                  {session.is_favorite && (
                    <Star className="h-4 w-4 text-gold-400 fill-gold-400" />
                  )}
                </div>
                
                <p className="text-sm text-charcoal-600 line-clamp-2 mb-3">
                  {session.description}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="outline" className="capitalize">
                    {session.category}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {session.metal_type}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {session.style}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center text-xs text-charcoal-500">
                  <span>
                    {format(new Date(session.created_at), 'MMM d, yyyy')}
                  </span>
                  {getExpirationBadge(session)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SessionList;