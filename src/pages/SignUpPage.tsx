import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, User, Phone, Lock, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import Logo from '../components/ui/Logo';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import toast from 'react-hot-toast';

interface SignUpFormData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

const SignUpPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showEmailVerification, setShowEmailVerification] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    setError,
    clearErrors
  } = useForm<SignUpFormData>();

  const watchedEmail = watch('email');
  const watchedPassword = watch('password');
  const watchedConfirmPassword = watch('confirmPassword');

  // Redirect if already authenticated
  if (user) {
    navigate('/profile');
    return null;
  }

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

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = value.replace(/[^0-9]/g, '');
    setValue('phone', numericValue);
  };

  const handleGoogleSignUp = async () => {
    try {
      setIsGoogleLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        toast.error(error.message || 'Google sign-up failed');
        return;
      }

      // The redirect will be handled by Supabase
      toast.success('Redirecting to Google...');
    } catch (error: any) {
      toast.error(error.message || 'Google sign-up failed');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleEmailSignUp = async (data: SignUpFormData) => {
    if (data.password !== data.confirmPassword) {
      setError('confirmPassword', { type: 'manual', message: 'Passwords do not match' });
      return;
    }

    setIsLoading(true);

    try {
      const { data: signUpData, error } = await supabase.auth.signUp({
        email: data.email.toLowerCase(),
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone: data.phone,
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          setError('email', { type: 'manual', message: 'Email already exists' });
          toast.error('Email already exists');
        } else {
          toast.error(error.message || 'Sign-up failed');
        }
        return;
      }

      if (signUpData.user && !signUpData.user.email_confirmed_at) {
        setShowEmailVerification(true);
        toast.success('Please check your email to verify your account');
      } else {
        toast.success('Account created successfully!');
        navigate('/profile');
      }
    } catch (error: any) {
      console.error('Sign-up error:', error);
      toast.error(error.message || 'Sign-up failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (showEmailVerification) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-charcoal-900 via-charcoal-800 to-charcoal-900 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <Card className="bg-charcoal-800 border-charcoal-700">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-gold-400 rounded-full flex items-center justify-center mb-6">
                  <Mail className="w-8 h-8 text-charcoal-900" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-white mb-4">
                  Verify Your Email
                </h2>
                <p className="text-charcoal-300 mb-6">
                  We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.
                </p>
                <div className="space-y-4">
                  <Button 
                    onClick={() => navigate('/login')}
                    className="w-full bg-gold-400 hover:bg-gold-500 text-charcoal-900"
                  >
                    Go to Sign In
                  </Button>
                  <button
                    onClick={() => setShowEmailVerification(false)}
                    className="w-full text-gold-400 hover:text-gold-300 text-sm transition-colors"
                  >
                    Back to Sign Up
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-charcoal-900 via-charcoal-800 to-charcoal-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Logo className="text-white justify-center mb-4" />
          <h2 className="text-3xl font-serif font-bold text-white mb-2">
            Create Your Account
          </h2>
          <p className="text-cream-100">
            Join our exclusive jewelry collection
          </p>
          <p className="text-cream-200 text-sm mt-2">
            Already have an account?{' '}
            <Link to="/login" className="text-gold-400 hover:text-gold-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        <Card className="bg-charcoal-800 border-charcoal-700">
          <CardContent className="p-8">
            {/* Google Sign Up */}
            <Button
              onClick={handleGoogleSignUp}
              isLoading={isGoogleLoading}
              variant="outline"
              className="w-full mb-6 bg-white hover:bg-gray-50 text-charcoal-900 border-gray-300"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>

            <div className="relative mb-6">
              <Separator className="bg-charcoal-600" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-charcoal-800 px-2 text-sm text-charcoal-400">or</span>
              </div>
            </div>

            {/* Email Sign Up Form */}
            <form onSubmit={handleSubmit(handleEmailSignUp)} className="space-y-4">
              {/* Full Name */}
              <div>
                <Label htmlFor="fullName" className="text-cream-100">
                  <User className="inline w-4 h-4 mr-2" />
                  Full Name *
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  {...register('fullName', { required: 'Full name is required' })}
                  className="bg-charcoal-700 border-charcoal-600 text-white placeholder-charcoal-400"
                  placeholder="Enter your full name"
                />
                {errors.fullName && (
                  <p className="text-red-400 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email" className="text-cream-100">
                  <Mail className="inline w-4 h-4 mr-2" />
                  Email Address *
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Please enter a valid email address'
                      }
                    })}
                    className={`bg-charcoal-700 border-charcoal-600 text-white placeholder-charcoal-400 ${
                      emailExists ? 'border-red-500' : ''
                    }`}
                    placeholder="Enter your email address"
                  />
                  {watchedEmail && !emailExists && !errors.email && (
                    <Check className="absolute right-3 top-3 w-5 h-5 text-green-400" />
                  )}
                </div>
                {errors.email && (
                  <p className="text-red-400 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor="phone" className="text-cream-100">
                  <Phone className="inline w-4 h-4 mr-2" />
                  Mobile Number *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  {...register('phone', { 
                    required: 'Phone number is required',
                    pattern: {
                      value: /^[0-9]{10,15}$/,
                      message: 'Please enter a valid phone number (10-15 digits)'
                    }
                  })}
                  onChange={handlePhoneChange}
                  className="bg-charcoal-700 border-charcoal-600 text-white placeholder-charcoal-400"
                  placeholder="Enter your mobile number"
                  inputMode="numeric"
                />
                {errors.phone && (
                  <p className="text-red-400 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.phone.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <Label htmlFor="password" className="text-cream-100">
                  <Lock className="inline w-4 h-4 mr-2" />
                  Password *
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
                    placeholder="Create a strong password"
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
                  Confirm Password *
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
                    placeholder="Confirm your password"
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

              {/* Terms and Conditions */}
              <div>
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('acceptTerms', { required: 'You must accept the terms and conditions' })}
                    className="mt-1 w-4 h-4 text-gold-400 bg-charcoal-700 border-charcoal-600 rounded focus:ring-gold-400 focus:ring-2"
                  />
                  <span className="text-sm text-cream-200">
                    I agree to the{' '}
                    <Link to="/terms" className="text-gold-400 hover:text-gold-300 transition-colors">
                      Terms & Conditions
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" className="text-gold-400 hover:text-gold-300 transition-colors">
                      Privacy Policy
                    </Link>
                  </span>
                </label>
                {errors.acceptTerms && (
                  <p className="text-red-400 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.acceptTerms.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-500 hover:to-gold-600 text-charcoal-900 font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
              >
                Create Account
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-cream-200 text-sm">
            By creating an account, you're joining our exclusive community of jewelry enthusiasts.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;