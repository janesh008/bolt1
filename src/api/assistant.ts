import { supabase } from '../lib/supabase';

interface AssistantResponse {
  reply: string;
  audioBase64?: string;
  error?: string;
}

export async function getAssistantResponse(
  message: string, 
  history: Array<{role: string, content: string}> = [],
  language: string = 'en'
): Promise<AssistantResponse> {
  try {
    // Call OpenAI API
    const response = await fetch('/api/assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        history,
        language
      })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Log to database if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await supabase.from('support_chat_logs').insert({
        user_id: session.user.id,
        email: session.user.email,
        language,
        message,
        reply: data.reply
      });
      
      // Check if message needs escalation
      if (needsEscalation(data.reply)) {
        await supabase.from('support_alerts').insert({
          user_id: session.user.id,
          email: session.user.email,
          message,
          flagged: true
        });
      }
    }
    
    return {
      reply: data.reply,
      audioBase64: data.audioBase64
    };
  } catch (error) {
    console.error('Error getting assistant response:', error);
    return {
      reply: 'Sorry, I encountered an error. Please try again.',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Helper function to check if a message needs escalation
function needsEscalation(message: string): boolean {
  const escalationPhrases = [
    "I'm not sure",
    "I don't know",
    "I am unsure",
    "cannot help",
    "unable to assist",
    "cannot provide",
    "don't have enough information",
    "need more details",
    "beyond my capabilities",
    "I apologize"
  ];
  
  return escalationPhrases.some(phrase => 
    message.toLowerCase().includes(phrase.toLowerCase())
  );
}