import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon, AlertCircle, Check } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { uploadProductImage, deleteProductImage } from '../../../lib/supabase-storage';
import { Badge } from '../../ui/badge';
import Button from '../../ui/Button';
import toast from 'react-hot-toast';

export interface ProductImage {
  id?: string;
  url: string;
  path: string;
  file?: File;
  isUploading?: boolean;
  uploadProgress?: number;
  isNew?: boolean;
  markedForDeletion?: boolean;
}

interface ImageUploadZoneProps {
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  productId?: string;
  maxImages?: number;
  disabled?: boolean;
}

const ImageUploadZone: React.FC<ImageUploadZoneProps> = ({
  images,
  onImagesChange,
  productId,
  maxImages = 10,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (disabled) return;
    
    if (!productId) {
      toast.error('Please save the product first before uploading images');
      return;
    }
    
    const remainingSlots = maxImages - images.filter(img => !img.markedForDeletion).length;
    const filesToProcess = acceptedFiles.slice(0, remainingSlots);

    if (filesToProcess.length < acceptedFiles.length) {
      toast.error(`Only ${remainingSlots} more images can be added`);
    }

    // Create temporary image objects with unique IDs
    const newImages: ProductImage[] = filesToProcess.map((file, index) => ({
      id: `temp-${Date.now()}-${index}`,
      url: URL.createObjectURL(file),
      path: '',
      file,
      isUploading: true,
      uploadProgress: 0,
      isNew: true,
    }));

    // Add to images array immediately for UI feedback
    const updatedImages = [...images, ...newImages];
    onImagesChange(updatedImages);

    // Upload files if productId is available
    for (let i = 0; i < newImages.length; i++) {
      const tempImage = newImages[i];
      const file = filesToProcess[i];
      
      try {
        // Update progress to show upload starting
        const currentImages = [...updatedImages];
        const imageIndex = currentImages.findIndex(img => img.id === tempImage.id);
        
        if (imageIndex !== -1) {
          currentImages[imageIndex] = {
            ...currentImages[imageIndex],
            uploadProgress: 10,
          };
          onImagesChange(currentImages);
        }

        const result = await uploadProductImage(file, productId, (progress) => {
          // Update progress during upload
          const progressImages = [...currentImages];
          const progressIndex = progressImages.findIndex(img => img.id === tempImage.id);
          if (progressIndex !== -1) {
            progressImages[progressIndex] = {
              ...progressImages[progressIndex],
              uploadProgress: Math.min(progress, 95), // Cap at 95% until completion
            };
            onImagesChange(progressImages);
          }
        });

        if (result) {
          // Upload successful - update with final data
          const finalImages = [...currentImages];
          const finalIndex = finalImages.findIndex(img => img.id === tempImage.id);
          
          if (finalIndex !== -1) {
            finalImages[finalIndex] = {
              ...finalImages[finalIndex],
              url: result.url,
              path: result.path,
              isUploading: false,
              uploadProgress: 100,
              file: undefined, // Clear file reference
            };
            onImagesChange(finalImages);
            
            // Clear progress after a short delay for visual feedback
            setTimeout(() => {
              const clearedImages = [...finalImages];
              if (clearedImages[finalIndex]) {
                clearedImages[finalIndex] = {
                  ...clearedImages[finalIndex],
                  uploadProgress: undefined,
                };
                onImagesChange(clearedImages);
              }
            }, 1000);
          }
          
          toast.success('Image uploaded successfully');
        } else {
          // Upload failed - remove the failed image
          const failedImages = currentImages.filter(img => img.id !== tempImage.id);
          onImagesChange(failedImages);
          toast.error('Failed to upload image');
        }
      } catch (error) {
        console.error('Upload error:', error);
        // Remove failed upload from array
        const errorImages = updatedImages.filter(img => img.id !== tempImage.id);
        onImagesChange(errorImages);
        toast.error('Failed to upload image');
      }
    }
  }, [images, onImagesChange, productId, maxImages, disabled]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif']
    },
    maxSize: 10485760, // 10MB
    disabled,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
  });

  const handleRemoveImage = async (index: number) => {
    const image = images[index];
    
    if (image.isUploading) {
      toast.error('Cannot remove image while uploading');
      return;
    }

    if (image.isNew || !image.id || image.id.startsWith('temp-')) {
      // For new images or temp images, just remove from array
      const updatedImages = images.filter((_, i) => i !== index);
      onImagesChange(updatedImages);
      
      // Revoke object URL to prevent memory leaks
      if (image.url.startsWith('blob:')) {
        URL.revokeObjectURL(image.url);
      }
    } else {
      // For existing images, mark for deletion
      const updatedImages = [...images];
      updatedImages[index] = {
        ...updatedImages[index],
        markedForDeletion: !updatedImages[index].markedForDeletion,
      };
      onImagesChange(updatedImages);
    }
  };

  const handleReorderImages = (fromIndex: number, toIndex: number) => {
    if (disabled) return;
    
    const updatedImages = [...images];
    const [movedImage] = updatedImages.splice(fromIndex, 1);
    updatedImages.splice(toIndex, 0, movedImage);
    onImagesChange(updatedImages);
  };

  const activeImages = images.filter(img => !img.markedForDeletion);
  const canAddMore = activeImages.length < maxImages;

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
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-700">
              {isDragActive ? 'Drop images here' : 'Upload Product Images'}
            </p>
            <p className="text-sm text-gray-500">
              Drag & drop images here, or click to select files
            </p>
            <p className="text-xs text-gray-400">
              PNG, JPG, WebP up to 10MB • {activeImages.length}/{maxImages} images
            </p>
          </div>
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={image.id || index}
              className={cn(
                "relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border-2",
                image.markedForDeletion
                  ? "border-red-300 opacity-50"
                  : index === 0
                  ? "border-blue-500"
                  : "border-gray-200"
              )}
            >
              {/* Image */}
              <img
                src={image.url}
                alt={`Product image ${index + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Upload Progress Overlay */}
              {image.isUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                    <p className="text-sm font-medium">
                      {image.uploadProgress && image.uploadProgress > 0 
                        ? `${Math.round(image.uploadProgress)}%` 
                        : 'Uploading...'}
                    </p>
                    {image.uploadProgress && image.uploadProgress > 0 && (
                      <div className="w-16 bg-gray-600 rounded-full h-1 mt-2 mx-auto">
                        <div 
                          className="bg-white h-1 rounded-full transition-all duration-300" 
                          style={{ width: `${image.uploadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Success Overlay */}
              {!image.isUploading && image.uploadProgress === 100 && (
                <div className="absolute inset-0 bg-green-500 bg-opacity-75 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Check className="h-8 w-8 mx-auto mb-1" />
                    <p className="text-sm font-medium">Uploaded!</p>
                  </div>
                </div>
              )}

              {/* Status Badges */}
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                {index === 0 && !image.markedForDeletion && (
                  <Badge className="bg-blue-500 text-white text-xs">Primary</Badge>
                )}
                {image.isNew && !image.isUploading && (
                  <Badge className="bg-green-500 text-white text-xs">New</Badge>
                )}
                {image.markedForDeletion && (
                  <Badge className="bg-red-500 text-white text-xs">Delete</Badge>
                )}
              </div>

              {/* Action Buttons */}
              {!image.isUploading && (
                <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleRemoveImage(index)}
                    className={cn(
                      "p-1 rounded-full text-white transition-colors",
                      image.markedForDeletion
                        ? "bg-green-500 hover:bg-green-600"
                        : "bg-red-500 hover:bg-red-600"
                    )}
                    title={image.markedForDeletion ? "Restore image" : "Remove image"}
                  >
                    {image.markedForDeletion ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                  </button>
                </div>
              )}

              {/* Image Number */}
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No images uploaded</p>
          <p className="text-sm">Add some product images to get started</p>
        </div>
      )}

      {/* Instructions */}
      {images.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Image Management Tips:</p>
              <ul className="space-y-1 text-xs">
                <li>• The first image will be used as the primary product image</li>
                <li>• Click the X to mark images for deletion (they won't be deleted until you save)</li>
                <li>• Drag and drop to reorder images</li>
                <li>• Maximum {maxImages} images per product</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploadZone;