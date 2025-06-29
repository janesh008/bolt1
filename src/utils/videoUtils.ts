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
    `;
    
    // Inject the style into the iframe
    iframeWindow.document.head.appendChild(styleElement);
    
    console.log('User video hidden successfully');
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
    iframeWindow.postMessage({
      type: 'SET_LANGUAGE',
      language: language
    }, '*');
    
    console.log(`Language set to ${language}`);
  } catch (error) {
    console.error('Error setting language:', error);
  }
};