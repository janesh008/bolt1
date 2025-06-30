import { useState, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

export interface SupportAgentCallbacks {
  addMessage: (message: Message) => void;
  setIsLoadingState: (isLoading: boolean) => void;
  setErrorState: (error: string | null) => void;
  setListeningState: (isListening: boolean) => void;
}

export class SupportAgentController {
  private recognition: SpeechRecognition | null = null;
  private audioContext: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private userId: string | null = null;

  constructor(private callbacks: SupportAgentCallbacks) {
    // Initialize Web Speech API if available
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      
      this.recognition.onresult = this.handleSpeechResult.bind(this);
      this.recognition.onerror = this.handleSpeechError.bind(this);
      this.recognition.onend = () => {
        this.callbacks.setListeningState(false);
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
      this.callbacks.setErrorState('Speech recognition not supported in this browser');
      return;
    }
    
    this.recognition.lang = language;
    this.recognition.start();
    this.callbacks.setListeningState(true);
    this.callbacks.setErrorState(null);
  }

  public stopRecording(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
    this.callbacks.setListeningState(false);
  }

  private handleSpeechResult(event: SpeechRecognitionEvent): void {
    const transcript = event.results[0][0].transcript;
    this.sendMessage(transcript);
  }

  private handleSpeechError(event: SpeechRecognitionErrorEvent): void {
    console.error('Speech recognition error:', event.error);
    this.callbacks.setErrorState(`Speech recognition error: ${event.error}`);
    this.callbacks.setListeningState(false);
  }

  public async sendMessage(message: string): Promise<void> {
    if (!message.trim() || !this.userId) return;
    
    // Add user message
    this.callbacks.addMessage({ 
      role: 'user', 
      content: message, 
      timestamp: new Date() 
    });
    
    this.callbacks.setIsLoadingState(true);
    this.callbacks.setErrorState(null);

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
      
      // Add assistant message
      this.callbacks.addMessage({ 
        role: 'assistant', 
        content: data.text, 
        timestamp: new Date(),
        audioUrl: data.audioUrl
      });

      this.callbacks.setIsLoadingState(false);

      // Play audio response if available
      if (data.audioUrl) {
        this.playAudio(data.audioUrl);
      }
    } catch (error) {
      console.error('Error sending message to support agent:', error);
      this.callbacks.setErrorState(error instanceof Error ? error.message : 'An unknown error occurred');
      this.callbacks.setIsLoadingState(false);
    }
  }

  public playAudio(audioUrl: string): void {
    if (this.audioElement) {
      this.audioElement.src = audioUrl;
      this.audioElement.play().catch(error => {
        console.error('Error playing audio:', error);
        this.callbacks.setErrorState('Failed to play audio response');
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