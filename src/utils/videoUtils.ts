import { toast } from 'react-hot-toast';

/**
 * Handles fetching a conversation URL with retry logic
 * @param userName - The user's name for the conversation
 * @param productName - The product name for the conversation
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param delayMs - Delay between retries in milliseconds (default: 2000)
 * @returns The conversation URL or null if unavailable after retries
 */
export const getConversationUrl = async (
  userName: string,
  productName: string,
  maxRetries = 3,
  delayMs = 2000
): Promise<{ conversationUrl: string | null; conversationId: string | null }> => {
  let attempts = 0;
  let lastError: Error | null = null;

  console.log(`Attempting to get conversation URL for ${userName} about ${productName}`);

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
          product_name: productName
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