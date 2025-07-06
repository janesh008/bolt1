/**
 * Audio utility functions for the multilingual assistant
 */

/**
 * Plays an audio file from a URL or base64 string
 * @param audioSrc - The audio source (URL or base64 string)
 * @param onEnded - Optional callback for when audio playback ends
 * @returns The audio element
 */
export const playAudio = (audioSrc: string, onEnded?: () => void): HTMLAudioElement => {
  const audio = new Audio(audioSrc);
  
  if (onEnded) {
    audio.onended = onEnded;
  }
  
  audio.play().catch(error => {
    console.error('Error playing audio:', error);
  });
  
  return audio;
};

/**
 * Converts a blob to a base64 string
 * @param blob - The blob to convert
 * @returns A promise that resolves to the base64 string
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};