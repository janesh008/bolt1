import { useState, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

export interface SupportAgentState {
  isListening: boolean;
  messages: Message[];
  language: string;
  isLoading: boolean;
  error: string | null;
}

export class SupportAgentController {
  private recognition: SpeechRecognition | null = null;
  private audioContext: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private userId: string | null = null;

  constructor(private setState: (state: Partial<SupportAgentState>) => void) {
    // Initialize Web Speech API if available
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      
      this.recognition.onresult = this.handleSpeechResult.bind(this);
      this.recognition.onerror = this.handleSpeechError.bind(this);
      this.recognition.onend = () => {
        this.setState({ isListening: false });
      };
    }
    
    // Initialize Audio Context for playback
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      this.audioContext = new AudioContext();
    }
    
    // Create audio element for playing responses
    this.audioElement = new Audio();
  }

  public async init(userId: string): Promise<void> {
    this.userId = userId;
  }

  public startRecording(language: string): void {
    if (!this.recognition) {
      this.setState({ error: 'Speech recognition not supported in this browser' });
      return;
    }
    
    this.recognition.lang = language;
    this.recognition.start();
    this.setState({ isListening: true, error: null });
  }

  public stopRecording(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
    this.setState({ isListening: false });
  }

  private handleSpeechResult(event: SpeechRecognitionEvent): void {
    const transcript = event.results[0][0].transcript;
    this.sendMessage(transcript);
  }

  private handleSpeechError(event: SpeechRecognitionErrorEvent): void {
    console.error('Speech recognition error:', event.error);
    this.setState({ 
      error: `Speech recognition error: ${event.error}`, 
      isListening: false 
    });
  }

  public async sendMessage(message: string): Promise<void> {
    if (!message.trim() || !this.userId) return;
    
    // Add user message to state
    this.setState({ 
      messages: prev => [...(prev || []), { 
        role: 'user', 
        content: message, 
        timestamp: new Date() 
      }],
      isLoading: true,
      error: null
    });

    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User not authenticated');
      }

      // Call support agent API
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/support_agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          message,
          language: 'en' // Default to English for now
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response from support agent');
      }

      const data = await response.json();
      
      // Add assistant message to state
      this.setState({ 
        messages: prev => [...(prev || []), { 
          role: 'assistant', 
          content: data.text, 
          timestamp: new Date(),
          audioUrl: data.audioUrl
        }],
        isLoading: false
      });

      // Play audio response if available
      if (data.audioUrl) {
        this.playAudio(data.audioUrl);
      }
    } catch (error) {
      console.error('Error sending message to support agent:', error);
      this.setState({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        isLoading: false
      });
    }
  }

  public playAudio(audioUrl: string): void {
    if (this.audioElement) {
      this.audioElement.src = audioUrl;
      this.audioElement.play().catch(error => {
        console.error('Error playing audio:', error);
        this.setState({ error: 'Failed to play audio response' });
      });
    }
  }

  public dispose(): void {
    if (this.recognition) {
      this.recognition.onresult = null;
      this.recognition.onerror = null;
      this.recognition.onend = null;
      this.stopRecording();
    }
    
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
    }
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(console.error);
    }
  }
}

// Add missing types for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}