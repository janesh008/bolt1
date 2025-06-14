import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

export const STORAGE_BUCKET = 'images';
export const VIDEO_STORAGE_BUCKET = 'videos';

// Upload image to Supabase Storage
export const uploadProductImage = async (
  file: File,
  productId: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string; path: string } | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${productId}/${fileName}`;

    // Create a FormData object to track upload progress
    const formData = new FormData();
    formData.append('file', file);

    // Use XMLHttpRequest for progress tracking
    if (onProgress) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            onProgress(percentComplete);
          }
        });
        
        xhr.addEventListener('load', async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            // Get public URL after successful upload
            const { data: { publicUrl } } = supabase.storage
              .from(STORAGE_BUCKET)
              .getPublicUrl(filePath);
            
            resolve({
              url: publicUrl,
              path: filePath,
            });
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });
        
        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });
        
        xhr.addEventListener('abort', () => {
          reject(new Error('Upload aborted'));
        });
        
        // Start the upload using Supabase's signed URL approach
        supabase.storage.from(STORAGE_BUCKET).createSignedUploadUrl(filePath)
          .then(({ data, error }) => {
            if (error) {
              reject(error);
              return;
            }
            
            xhr.open('PUT', data.signedUrl);
            xhr.setRequestHeader('Content-Type', file.type);
            xhr.send(file);
          })
          .catch(reject);
      });
    } else {
      // Standard upload without progress tracking
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        return null;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      return {
        url: publicUrl,
        path: filePath,
      };
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
};

// Upload video to Supabase Storage
export const uploadProductVideo = async (
  file: File,
  productId: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string; path: string } | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${productId}/${fileName}`;

    // Create a FormData object to track upload progress
    const formData = new FormData();
    formData.append('file', file);

    // Use XMLHttpRequest for progress tracking
    if (onProgress) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            onProgress(percentComplete);
          }
        });
        
        xhr.addEventListener('load', async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            // Get public URL after successful upload
            const { data: { publicUrl } } = supabase.storage
              .from(VIDEO_STORAGE_BUCKET)
              .getPublicUrl(filePath);
            
            resolve({
              url: publicUrl,
              path: filePath,
            });
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });
        
        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });
        
        xhr.addEventListener('abort', () => {
          reject(new Error('Upload aborted'));
        });
        
        // Start the upload using Supabase's signed URL approach
        supabase.storage.from(VIDEO_STORAGE_BUCKET).createSignedUploadUrl(filePath)
          .then(({ data, error }) => {
            if (error) {
              reject(error);
              return;
            }
            
            xhr.open('PUT', data.signedUrl);
            xhr.setRequestHeader('Content-Type', file.type);
            xhr.send(file);
          })
          .catch(reject);
      });
    } else {
      // Standard upload without progress tracking
      const { data, error } = await supabase.storage
        .from(VIDEO_STORAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Video upload error:', error);
        return null;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(VIDEO_STORAGE_BUCKET)
        .getPublicUrl(filePath);

      return {
        url: publicUrl,
        path: filePath,
      };
    }
  } catch (error) {
    console.error('Error uploading video:', error);
    return null;
  }
};

// Delete image from Supabase Storage
export const deleteProductImage = async (path: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};

// Delete video from Supabase Storage
export const deleteProductVideo = async (path: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from(VIDEO_STORAGE_BUCKET)
      .remove([path]);

    if (error) {
      console.error('Delete video error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting video:', error);
    return false;
  }
};

// Get public URL for image
export const getImageUrl = (path: string): string => {
  const { data: { publicUrl } } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path);
  
  return publicUrl;
};

// Get public URL for video
export const getVideoUrl = (path: string): string => {
  const { data: { publicUrl } } = supabase.storage
    .from(VIDEO_STORAGE_BUCKET)
    .getPublicUrl(path);
  
  return publicUrl;
};