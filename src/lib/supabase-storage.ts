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

    // Create the bucket if it doesn't exist
    const { data: bucketData, error: bucketError } = await supabase.storage
      .getBucket(STORAGE_BUCKET);
    
    if (bucketError && bucketError.message.includes('not found')) {
      // Bucket doesn't exist, create it
      await supabase.storage.createBucket(STORAGE_BUCKET, {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      });
    }

    // Upload the file
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

    // Create the bucket if it doesn't exist
    const { data: bucketData, error: bucketError } = await supabase.storage
      .getBucket(VIDEO_STORAGE_BUCKET);
    
    if (bucketError && bucketError.message.includes('not found')) {
      // Bucket doesn't exist, create it
      await supabase.storage.createBucket(VIDEO_STORAGE_BUCKET, {
        public: true,
        fileSizeLimit: 104857600, // 100MB
        allowedMimeTypes: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
      });
    }

    // Upload the file
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