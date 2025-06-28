import { toast } from 'react-hot-toast';

/**
 * Handles fetching a conversation URL with retry logic
 * @param userName - The user's name for the conversation
 * @param productName - The product name for the conversation
 * @param language - The language code for the conversation
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param delayMs - Delay between retries in milliseconds (default: 2000)
 * @returns The conversation URL or null if unavailable after retries
 */
export const getConversationUrl = async (
  userName: string,
  productName: string,
  language: string = 'en',
  maxRetries = 3,
  delayMs = 2000
): Promise<{ conversationUrl: string | null; conversationId: string | null }> => {
  let attempts = 0;
  let lastError: Error | null = null;

  console.log(`Attempting to get conversation URL for ${userName} about ${productName} in ${language}`);

  while (attempts < maxRetries) {
    try {
      attempts++;
      console.log(`Attempt ${attempts}/${maxRetries} to get conversation URL`);

      const response = await fetch('/api/video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          user_name: userName,
          product_name: productName,
          language: language
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create video conversation');
      }

      const data = await response.json();
      console.log(`Attempt ${attempts} response:`, data);

      if (data.conversationUrl) {
        console.log(`Successfully got conversation URL on attempt ${attempts}:`, data.conversationUrl);
        return {
          conversationUrl: data.conversationUrl,
          conversationId: data.conversationId
        };
      } else {
        throw new Error('No conversation URL returned from video service');
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error occurred');
      console.error(`Attempt ${attempts} failed:`, lastError.message);
      
      if (attempts < maxRetries) {
        console.log(`Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  // All attempts failed
  console.error(`Failed to get conversation URL after ${maxRetries} attempts`);
  if (lastError) {
    console.error('Last error:', lastError);
  }
  
  return { conversationUrl: null, conversationId: null };
};

/**
 * Validates if a conversation URL is valid
 * @param url - The URL to validate
 * @returns True if the URL is valid, false otherwise
 */
export const isValidConversationUrl = (url: string | null): boolean => {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    // Check if it's a valid Tavus URL
    return urlObj.hostname.includes('tavus.daily.co') || urlObj.hostname.includes('daily.co');
  } catch (error) {
    return false;
  }
};

/**
 * Handles hiding user video while keeping AI video visible
 * @param iframeElement - The iframe element containing the Tavus video
 */
export const hideUserVideo = (iframeElement: HTMLIFrameElement | null): void => {
  if (!iframeElement) return;
  
  try {
    // Try to access the iframe content and apply CSS to hide user video
    const iframeWindow = iframeElement.contentWindow;
    if (!iframeWindow) return;
    
    // Create a style element to inject into the iframe
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .user-video-container { 
        display: none !important; 
      }
      .self-view-container { 
        display: none !important; 
      }
      .local-participant { 
        display: none !important; 
      }
      .camera-toggle-button {
        display: none !important;
      }
      .microphone-toggle-button {
        display: none !important;
      }
      /* Hide any user controls */
      .user-controls {
        display: none !important;
      }
      /* Make AI video full screen */
      .remote-participant {
        width: 100% !important;
        height: 100% !important;
      }
    `;
    
    // Inject the style into the iframe
    setTimeout(() => {
      try {
        if (iframeWindow.document && iframeWindow.document.head) {
          iframeWindow.document.head.appendChild(styleElement);
          console.log('User video hidden successfully');
        }
      } catch (err) {
        console.error('Error injecting styles:', err);
      }
    }, 1000);
    
    // Also try to disable camera via iframe API if available
    try {
      iframeWindow.postMessage({ type: 'DISABLE_CAMERA' }, '*');
    } catch (err) {
      console.error('Error disabling camera:', err);
    }
  } catch (error) {
    console.error('Error hiding user video:', error);
  }
};

/**
 * Applies language settings to the Tavus conversation
 * @param iframeElement - The iframe element containing the Tavus video
 * @param language - The language code to apply
 */
export const applyLanguageSettings = (iframeElement: HTMLIFrameElement | null, language: string): void => {
  if (!iframeElement) return;
  
  try {
    // Try to access the iframe content and apply language settings
    const iframeWindow = iframeElement.contentWindow;
    if (!iframeWindow) return;
    
    // Post a message to the iframe to set the language
    setTimeout(() => {
      try {
        iframeWindow.postMessage({
          type: 'SET_LANGUAGE',
          language: language
        }, '*');
        console.log(`Language set to ${language}`);
      } catch (err) {
        console.error('Error setting language:', err);
      }
    }, 1500);
  } catch (error) {
    console.error('Error setting language:', error);
  }
};