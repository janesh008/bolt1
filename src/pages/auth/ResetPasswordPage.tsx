import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Lock, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Button from '../../components/ui/Button';
import Logo from '../../components/ui/Logo';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import toast from 'react-hot-toast';

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError
  } = useForm<ResetPasswordFormData>();

  const watchedPassword = watch('password');
  const watchedConfirmPassword = watch('confirmPassword');

  // Calculate password strength
  const calculatePasswordStrength = (password: string) => {
    if (!password) return 0;
    
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 12.5;
    if (/[^A-Za-z0-9]/.test(password)) strength += 12.5;
    
    setPasswordStrength(Math.min(100, strength));
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return 'bg-red-500';
    if (passwordStrength < 50) return 'bg-yellow-500';
    if (passwordStrength < 75) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return 'Weak';
    if (passwordStrength < 50) return 'Fair';
    if (passwordStrength < 75) return 'Good';
    return 'Strong';
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    calculatePasswordStrength(e.target.value);
  };

  const handleResetPassword = async (data: ResetPasswordFormData) => {
    if (data.password !== data.confirmPassword) {
      setError('confirmPassword', { type: 'manual', message: 'Passwords do not match' });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password
      });

      if (error) {
        toast.error(error.message || 'Failed to reset password');
        return;
      }

      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast.error(error.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-charcoal-900 via-charcoal-800 to-charcoal-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Logo className="text-white justify-center mb-4" />
          <h2 className="text-3xl font-serif font-bold text-white mb-2">
            Reset Your Password
          </h2>
          <p className="text-cream-100">
            Enter your new password below
          </p>
        </div>

        <Card className="bg-charcoal-800 border-charcoal-700">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit(handleResetPassword)} className="space-y-6">
              {/* New Password */}
              <div>
                <Label htmlFor="password" className="text-cream-100">
                  <Lock className="inline w-4 h-4 mr-2" />
                  New Password *
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password', { 
                      required: 'Password is required',
                      minLength: {
                        value: 8,
                        message: 'Password must be at least 8 characters'
                      }
                    })}
                    onChange={handlePasswordChange}
                    className="bg-charcoal-700 border-charcoal-600 text-white placeholder-charcoal-400 pr-12"
                    placeholder="Enter your new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-charcoal-400 hover:text-charcoal-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {watchedPassword && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-cream-200 mb-1">
                      <span>Password Strength</span>
                      <span>{getPasswordStrengthText()}</span>
                    </div>
                    <div className="w-full bg-charcoal-600 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                        style={{ width: `${passwordStrength}%` }}
                      />
                    </div>
                  </div>
                )}
                {errors.password && (
                  <p className="text-red-400 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <Label htmlFor="confirmPassword" className="text-cream-100">
                  <Lock className="inline w-4 h-4 mr-2" />
                  Confirm New Password *
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('confirmPassword', { 
                      required: 'Please confirm your password',
                      validate: (value) => value === watchedPassword || 'Passwords do not match'
                    })}
                    className={`bg-charcoal-700 border-charcoal-600 text-white placeholder-charcoal-400 pr-12 ${
                      watchedConfirmPassword && watchedConfirmPassword === watchedPassword 
                        ? 'border-green-500' 
                        : ''
                    }`}
                    placeholder="Confirm your new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-charcoal-400 hover:text-charcoal-200 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  {watchedConfirmPassword && watchedConfirmPassword === watchedPassword && (
                    <Check className="absolute right-10 top-3 w-5 h-5 text-green-400" />
                  )}
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-400 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-500 hover:to-gold-600 text-charcoal-900 font-semibold py-3 rounded-lg transition-all duration-200"
              >
                Reset Password
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-cream-200 text-sm">
            Remember your password?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-gold-400 hover:text-gold-300 transition-colors"
            >
              Back to Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;