import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Video, AlertCircle, Check } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { uploadProductVideo, deleteProductVideo } from '../../../lib/supabase-storage';
import { Badge } from '../../ui/badge';
import Button from '../../ui/Button';
import toast from 'react-hot-toast';

export interface ProductVideo {
  id?: string;
  url: string;
  path: string;
  file?: File;
  isUploading?: boolean;
  uploadProgress?: number;
  isNew?: boolean;
  markedForDeletion?: boolean;
}

interface VideoUploadZoneProps {
  videos: ProductVideo[];
  onVideosChange: (videos: ProductVideo[]) => void;
  productId?: string;
  maxVideos?: number;
  disabled?: boolean;
}

const VideoUploadZone: React.FC<VideoUploadZoneProps> = ({
  videos,
  onVideosChange,
  productId,
  maxVideos = 3,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (disabled) return;
    
    if (!productId) {
      toast.error('Please save the product first before uploading videos');
      return;
    }
    
    const remainingSlots = maxVideos - videos.filter(vid => !vid.markedForDeletion).length;
    const filesToProcess = acceptedFiles.slice(0, remainingSlots);

    if (filesToProcess.length < acceptedFiles.length) {
      toast.error(`Only ${remainingSlots} more videos can be added`);
    }

    // Create temporary video objects with unique IDs
    const newVideos: ProductVideo[] = filesToProcess.map((file, index) => ({
      id: `temp-${Date.now()}-${index}`,
      url: URL.createObjectURL(file),
      path: '',
      file,
      isUploading: true,
      uploadProgress: 0,
      isNew: true,
    }));

    // Add to videos array immediately for UI feedback
    const updatedVideos = [...videos, ...newVideos];
    onVideosChange(updatedVideos);

    // Upload files if productId is available
    for (let i = 0; i < newVideos.length; i++) {
      const tempVideo = newVideos[i];
      const file = filesToProcess[i];
      
      try {
        // Update progress to show upload starting
        const currentVideos = [...updatedVideos];
        const videoIndex = currentVideos.findIndex(vid => vid.id === tempVideo.id);
        
        if (videoIndex !== -1) {
          currentVideos[videoIndex] = {
            ...currentVideos[videoIndex],
            uploadProgress: 10,
          };
          onVideosChange(currentVideos);
        }

        const result = await uploadProductVideo(file, productId, (progress) => {
          // Update progress during upload
          const progressVideos = [...currentVideos];
          const progressIndex = progressVideos.findIndex(vid => vid.id === tempVideo.id);
          if (progressIndex !== -1) {
            progressVideos[progressIndex] = {
              ...progressVideos[progressIndex],
              uploadProgress: Math.min(progress, 95), // Cap at 95% until completion
            };
            onVideosChange(progressVideos);
          }
        });

        if (result) {
          // Upload successful - update with final data
          const finalVideos = [...currentVideos];
          const finalIndex = finalVideos.findIndex(vid => vid.id === tempVideo.id);
          
          if (finalIndex !== -1) {
            finalVideos[finalIndex] = {
              ...finalVideos[finalIndex],
              url: result.url,
              path: result.path,
              isUploading: false,
              uploadProgress: 100,
              file: undefined, // Clear file reference
            };
            onVideosChange(finalVideos);
            
            // Clear progress after a short delay for visual feedback
            setTimeout(() => {
              const clearedVideos = [...finalVideos];
              if (clearedVideos[finalIndex]) {
                clearedVideos[finalIndex] = {
                  ...clearedVideos[finalIndex],
                  uploadProgress: undefined,
                };
                onVideosChange(clearedVideos);
              }
            }, 1000);
          }
          
          toast.success('Video uploaded successfully');
        } else {
          // Upload failed - remove the failed video
          const failedVideos = currentVideos.filter(vid => vid.id !== tempVideo.id);
          onVideosChange(failedVideos);
          toast.error('Failed to upload video');
        }
      } catch (error) {
        console.error('Upload error:', error);
        // Remove failed upload from array
        const errorVideos = updatedVideos.filter(vid => vid.id !== tempVideo.id);
        onVideosChange(errorVideos);
        toast.error('Failed to upload video');
      }
    }
  }, [videos, onVideosChange, productId, maxVideos, disabled]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.webm', '.mov']
    },
    maxSize: 104857600, // 100MB
    disabled,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
  });

  const handleRemoveVideo = async (index: number) => {
    const video = videos[index];
    
    if (video.isUploading) {
      toast.error('Cannot remove video while uploading');
      return;
    }

    if (video.isNew || !video.id || video.id.startsWith('temp-')) {
      // For new videos or temp videos, just remove from array
      const updatedVideos = videos.filter((_, i) => i !== index);
      onVideosChange(updatedVideos);
      
      // Revoke object URL to prevent memory leaks
      if (video.url.startsWith('blob:')) {
        URL.revokeObjectURL(video.url);
      }
    } else {
      // For existing videos, mark for deletion
      const updatedVideos = [...videos];
      updatedVideos[index] = {
        ...updatedVideos[index],
        markedForDeletion: !updatedVideos[index].markedForDeletion,
      };
      onVideosChange(updatedVideos);
    }
  };

  const activeVideos = videos.filter(vid => !vid.markedForDeletion);
  const canAddMore = activeVideos.length < maxVideos;

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      {canAddMore && (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer",
            isDragActive || isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <input {...getInputProps()} />
          <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-700">
              {isDragActive ? 'Drop videos here' : 'Upload Product Videos'}
            </p>
            <p className="text-sm text-gray-500">
              Drag & drop videos here, or click to select files
            </p>
            <p className="text-xs text-gray-400">
              MP4, WebM, MOV up to 100MB • {activeVideos.length}/{maxVideos} videos
            </p>
          </div>
        </div>
      )}

      {/* Video Grid */}
      {videos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video, index) => (
            <div
              key={video.id || index}
              className={cn(
                "relative group aspect-video bg-gray-100 rounded-lg overflow-hidden border-2",
                video.markedForDeletion
                  ? "border-red-300 opacity-50"
                  : "border-gray-200"
              )}
            >
              {/* Video */}
              {!video.isUploading && (
                <video
                  src={video.url}
                  className="w-full h-full object-cover"
                  controls
                  muted
                  playsInline
                />
              )}

              {/* Video Placeholder for Uploading */}
              {video.isUploading && (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <Video className="h-12 w-12 text-gray-400" />
                </div>
              )}

              {/* Upload Progress Overlay */}
              {video.isUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                    <p className="text-sm font-medium">
                      {video.uploadProgress && video.uploadProgress > 0 
                        ? `${Math.round(video.uploadProgress)}%` 
                        : 'Uploading...'}
                    </p>
                    {video.uploadProgress && video.uploadProgress > 0 && (
                      <div className="w-16 bg-gray-600 rounded-full h-1 mt-2 mx-auto">
                        <div 
                          className="bg-white h-1 rounded-full transition-all duration-300" 
                          style={{ width: `${video.uploadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Success Overlay */}
              {!video.isUploading && video.uploadProgress === 100 && (
                <div className="absolute inset-0 bg-green-500 bg-opacity-75 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Check className="h-8 w-8 mx-auto mb-1" />
                    <p className="text-sm font-medium">Uploaded!</p>
                  </div>
                </div>
              )}

              {/* Status Badges */}
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                {video.isNew && !video.isUploading && (
                  <Badge className="bg-green-500 text-white text-xs">New</Badge>
                )}
                {video.markedForDeletion && (
                  <Badge className="bg-red-500 text-white text-xs">Delete</Badge>
                )}
              </div>

              {/* Action Buttons */}
              {!video.isUploading && (
                <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleRemoveVideo(index)}
                    className={cn(
                      "p-1 rounded-full text-white transition-colors",
                      video.markedForDeletion
                        ? "bg-green-500 hover:bg-green-600"
                        : "bg-red-500 hover:bg-red-600"
                    )}
                    title={video.markedForDeletion ? "Restore video" : "Remove video"}
                  >
                    {video.markedForDeletion ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                  </button>
                </div>
              )}

              {/* Video Number */}
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {videos.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No videos uploaded</p>
          <p className="text-sm">Add some product videos to get started</p>
        </div>
      )}

      {/* Instructions */}
      {videos.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Video Management Tips:</p>
              <ul className="space-y-1 text-xs">
                <li>• Click the X to mark videos for deletion (they won't be deleted until you save)</li>
                <li>• Videos will be displayed on the product detail page</li>
                <li>• Maximum {maxVideos} videos per product</li>
                <li>• Supported formats: MP4, WebM, MOV</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoUploadZone;