import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDropzone } from 'react-dropzone';
import { 
  Diamond, 
  Gem, 
  Sparkles, 
  Upload, 
  X, 
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { designFormSchema, DesignFormValues } from '../../types/ai-designer';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent } from '../ui/card';
import Button from '../ui/Button';
import { cn } from '../../lib/utils';

interface DesignFormProps {
  onSubmit: (data: DesignFormValues, imageFile?: File) => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const DesignForm: React.FC<DesignFormProps> = ({ onSubmit, isLoading, isAuthenticated }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const { 
    register, 
    handleSubmit, 
    control,
    watch,
    formState: { errors } 
  } = useForm<DesignFormValues>({
    resolver: zodResolver(designFormSchema),
    defaultValues: {
      category: undefined,
      metal_type: undefined,
      style: undefined,
      diamond_type: undefined,
      description: '',
    }
  });
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize: 5242880, // 5MB
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
      }
    }
  });
  
  const handleFormSubmit = async (data: DesignFormValues) => {
    if (!isAuthenticated) {
      return;
    }
    await onSubmit(data, imageFile || undefined);
  };
  
  const removeImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
  };
  
  return (
    <Card className="bg-white shadow-soft">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-serif text-charcoal-800">Design Your Dream Jewelry</h2>
            <p className="text-charcoal-500">
              Describe your perfect piece and our AI will bring it to life
            </p>
            {!isAuthenticated && (
              <p className="text-red-500 text-sm">
                Please log in to create a design session
              </p>
            )}
          </div>
          
          {/* Jewelry Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-charcoal-700">
              <Gem className="w-4 h-4 inline mr-2" />
              Jewelry Category
            </Label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={!isAuthenticated}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select jewelry type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ring">Ring</SelectItem>
                    <SelectItem value="necklace">Necklace</SelectItem>
                    <SelectItem value="earrings">Earrings</SelectItem>
                    <SelectItem value="bracelet">Bracelet</SelectItem>
                    <SelectItem value="pendant">Pendant</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.category && (
              <p className="text-red-500 text-sm">{errors.category.message}</p>
            )}
          </div>
          
          {/* Metal Type */}
          <div className="space-y-2">
            <Label htmlFor="metal_type" className="text-charcoal-700">
              <Sparkles className="w-4 h-4 inline mr-2" />
              Metal Type
            </Label>
            <Controller
              name="metal_type"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={!isAuthenticated}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select metal type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gold">Gold</SelectItem>
                    <SelectItem value="silver">Silver</SelectItem>
                    <SelectItem value="platinum">Platinum</SelectItem>
                    <SelectItem value="rose-gold">Rose Gold</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.metal_type && (
              <p className="text-red-500 text-sm">{errors.metal_type.message}</p>
            )}
          </div>
          
          {/* Style */}
          <div className="space-y-2">
            <Label htmlFor="style" className="text-charcoal-700">
              <Sparkles className="w-4 h-4 inline mr-2" />
              Style
            </Label>
            <Controller
              name="style"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={!isAuthenticated}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="classic">Classic</SelectItem>
                    <SelectItem value="vintage">Vintage</SelectItem>
                    <SelectItem value="minimalist">Minimalist</SelectItem>
                    <SelectItem value="statement">Statement</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.style && (
              <p className="text-red-500 text-sm">{errors.style.message}</p>
            )}
          </div>
          
          {/* Diamond Type */}
          <div className="space-y-2">
            <Label htmlFor="diamond_type" className="text-charcoal-700">
              <Diamond className="w-4 h-4 inline mr-2" />
              Diamond Option
            </Label>
            <Controller
              name="diamond_type"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={!isAuthenticated}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select diamond option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Diamonds</SelectItem>
                    <SelectItem value="small">Small Diamonds</SelectItem>
                    <SelectItem value="medium">Medium Diamonds</SelectItem>
                    <SelectItem value="large">Large Diamond</SelectItem>
                    <SelectItem value="multiple">Multiple Diamonds</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.diamond_type && (
              <p className="text-red-500 text-sm">{errors.diamond_type.message}</p>
            )}
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-charcoal-700">
              Detailed Description
            </Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Describe your dream jewelry in detail..."
              className="min-h-[120px]"
              disabled={!isAuthenticated}
            />
            {errors.description && (
              <p className="text-red-500 text-sm">{errors.description.message}</p>
            )}
            <p className="text-xs text-charcoal-500">
              {watch('description')?.length || 0}/500 characters
            </p>
          </div>
          
          {/* Reference Image Upload */}
          <div className="space-y-2">
            <Label className="text-charcoal-700">
              <ImageIcon className="w-4 h-4 inline mr-2" />
              Reference Image (Optional)
            </Label>
            
            {!imagePreview ? (
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer",
                  isDragActive
                    ? "border-gold-400 bg-gold-50"
                    : "border-cream-200 hover:border-gold-300",
                  !isAuthenticated && "opacity-50 cursor-not-allowed"
                )}
              >
                <input {...getInputProps()} disabled={!isAuthenticated} />
                <Upload className="h-10 w-10 text-charcoal-400 mx-auto mb-4" />
                <p className="text-charcoal-600">
                  {isDragActive
                    ? "Drop the image here"
                    : "Drag & drop an image here, or click to select"}
                </p>
                <p className="text-xs text-charcoal-500 mt-2">
                  JPG, PNG or WebP, up to 5MB
                </p>
              </div>
            ) : (
              <div className="relative rounded-lg overflow-hidden border border-cream-200">
                <img
                  src={imagePreview}
                  alt="Reference"
                  className="w-full h-64 object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1 bg-charcoal-800 rounded-full text-white"
                  disabled={!isAuthenticated}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
          
          {/* Submit Button */}
          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full py-3"
            size="lg"
            disabled={!isAuthenticated || isLoading}
          >
            <Sparkles className="h-5 w-5 mr-2" />
            {!isAuthenticated ? 'Please Log In to Continue' : 'Start Designing with AI'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default DesignForm;