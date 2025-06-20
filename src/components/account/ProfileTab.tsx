import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabase';
import Button from '../ui/Button';
import toast from 'react-hot-toast';

interface ProfileForm {
  name: string;
  email: string;
  phone: string;
}

interface ProfileTabProps {
  userId: string;
  initialData?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

const ProfileTab: React.FC<ProfileTabProps> = ({ userId, initialData }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<ProfileForm>({
    defaultValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
    }
  });
  
  const onSubmit = async (data: ProfileForm) => {
    if (!userId) {
      toast.error('User not authenticated');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Try to update user_profiles first
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          full_name: data.name,
          phone: data.phone,
          email: data.email
        })
        .eq('user_id', userId);
      
      if (profileError) {
        console.error('Error updating user_profiles:', profileError);
        
        // Fallback to users table
        const { error: userError } = await supabase
          .from('users')
          .update({
            full_name: data.name,
            phone: data.phone
          })
          .eq('id', userId);
          
        if (userError) {
          throw userError;
        }
      }
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-soft p-6">
      <h2 className="text-xl font-medium text-charcoal-800 mb-6">Profile Information</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-charcoal-600 mb-1">
            Full Name
          </label>
          <input
            type="text"
            {...register('name')}
            className="w-full px-4 py-2 rounded-md border border-cream-200 focus:outline-none focus:ring-2 focus:ring-gold-400"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-charcoal-600 mb-1">
            Email
          </label>
          <input
            type="email"
            {...register('email')}
            disabled
            className="w-full px-4 py-2 rounded-md border border-cream-200 bg-cream-50 cursor-not-allowed"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-charcoal-600 mb-1">
            Phone
          </label>
          <input
            type="tel"
            {...register('phone')}
            className="w-full px-4 py-2 rounded-md border border-cream-200 focus:outline-none focus:ring-2 focus:ring-gold-400"
          />
        </div>
        
        <Button type="submit" className="mt-4" isLoading={isSubmitting}>
          Save Changes
        </Button>
      </form>
    </div>
  );
};

export default ProfileTab;