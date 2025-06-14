import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Gem, ArrowLeft } from 'lucide-react';
import { DesignFormValues } from '../types/ai-designer';
import DesignForm from '../components/ai-designer/DesignForm';
import SessionList from '../components/ai-designer/SessionList';
import ChatInterface from '../components/ai-designer/ChatInterface';
import SessionSidebar from '../components/ai-designer/SessionSidebar';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import useAIDesignerStore from '../store/useAIDesignerStore';
import { useAuth } from '../context/AuthContext';

const AIDesignerPage = () => {
  const { sessionId } = useParams<{ sessionId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [view, setView] = useState<'list' | 'form' | 'chat'>('list');
  
  const { 
    sessions,
    currentSession,
    messages,
    isLoading,
    fetchSessions,
    fetchSession,
    createSession,
    setCurrentSession
  } = useAIDesignerStore();
  
  // Load sessions on mount
  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user, fetchSessions]);
  
  // Load specific session if ID is provided
  useEffect(() => {
    if (sessionId) {
      fetchSession(sessionId);
      setView('chat');
    }
  }, [sessionId, fetchSession]);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user && !isLoading) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);
  
  const handleNewSession = () => {
    setView('form');
  };
  
  const handleSelectSession = (session: AIDesignSession) => {
    setCurrentSession(session);
    navigate(`/ai-designer/${session.id}`);
    setView('chat');
  };
  
  const handleFormSubmit = async (data: DesignFormValues, imageFile?: File) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    const sessionId = await createSession(data, imageFile);
    if (sessionId) {
      navigate(`/ai-designer/${sessionId}`);
      setView('chat');
    }
  };
  
  const handleBackToList = () => {
    setCurrentSession(null);
    navigate('/ai-designer');
    setView('list');
  };
  
  if (!user) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <Gem className="h-6 w-6 text-gold-500" />
          <h1 className="font-serif text-3xl md:text-4xl text-charcoal-800">
            AI Jewelry Designer
          </h1>
        </div>
        <p className="mt-2 text-charcoal-500 max-w-2xl">
          Describe your dream jewelry and our AI will bring it to life. Your designs are saved for 15 days, or mark them as favorites to keep them permanently.
        </p>
      </div>
      
      {view === 'list' && (
        <SessionList 
          sessions={sessions}
          onSelectSession={handleSelectSession}
          onNewSession={handleNewSession}
        />
      )}
      
      {view === 'form' && (
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Button variant="outline" onClick={handleBackToList}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sessions
            </Button>
          </div>
          <DesignForm 
            onSubmit={handleFormSubmit} 
            isLoading={isLoading} 
            isAuthenticated={!!user}
          />
        </div>
      )}
      
      {view === 'chat' && currentSession && (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-250px)] bg-white rounded-lg shadow-soft overflow-hidden">
          <div className="flex-1 flex flex-col">
            <ChatInterface 
              session={currentSession}
              messages={messages}
              onBack={handleBackToList}
            />
          </div>
          <div className="w-full lg:w-80 overflow-y-auto">
            <SessionSidebar session={currentSession} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AIDesignerPage;