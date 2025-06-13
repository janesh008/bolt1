import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { signInWithEmail, signInWithGoogle, resetPassword } from '../lib/supabase';
import Button from '../components/ui/Button';
import Logo from '../components/ui/Logo';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  
  const from = location.state?.from?.pathname || '/';

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { data, error } = await signInWithEmail(email, password);
      
      if (error) {
        if (error.message?.includes('Email not confirmed')) {
          toast.error('Please verify your email address before signing in');
        } else {
          toast.error('Invalid email or password');
        }
        return;
      }

      if (data.user) {
        toast.success('Welcome back!');
        navigate(from, { replace: true });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error('Sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      const { error } = await signInWithGoogle();
      
      if (error) {
        toast.error(error.message || 'Google sign-in failed');
        return;
      }

      // The redirect will be handled by Supabase
      toast.success('Redirecting to Google...');
    } catch (error: any) {
      toast.error(error.message || 'Google sign-in failed');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetting(true);

    try {
      const { error } = await resetPassword(resetEmail);
      
      if (error) {
        toast.error(error.message || 'Failed to send reset email');
        return;
      }

      toast.success('Password reset email sent! Check your inbox.');
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setIsResetting(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-charcoal-900 via-charcoal-800 to-charcoal-900 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Logo className="text-white justify-center mb-4" />
            <h2 className="text-3xl font-serif font-bold text-white mb-2">
              Reset Password
            </h2>
            <p className="text-cream-100">
              Enter your email to receive a reset link
            </p>
          </div>

          <Card className="bg-charcoal-800 border-charcoal-700">
            <CardContent className="p-8">
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div>
                  <Label htmlFor="resetEmail" className="text-cream-100">
                    <Mail className="inline w-4 h-4 mr-2" />
                    Email Address
                  </Label>
                  <Input
                    id="resetEmail"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    className="bg-charcoal-700 border-charcoal-600 text-white placeholder-charcoal-400"
                    placeholder="Enter your email address"
                  />
                </div>

                <Button
                  type="submit"
                  isLoading={isResetting}
                  className="w-full bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-500 hover:to-gold-600 text-charcoal-900 font-semibold py-3 rounded-lg"
                >
                  Send Reset Link
                </Button>

                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="w-full text-gold-400 hover:text-gold-300 text-sm transition-colors"
                >
                  Back to Sign In
                </button>
              </form>
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
            Welcome Back
          </h2>
          <p className="text-cream-100">
            Sign in to your account
          </p>
          <p className="text-cream-200 text-sm mt-2">
            Don't have an account?{' '}
            <Link to="/signup" className="text-gold-400 hover:text-gold-300 font-medium transition-colors">
              Create one
            </Link>
          </p>
        </div>

        <Card className="bg-charcoal-800 border-charcoal-700">
          <CardContent className="p-8">
            {/* Google Sign In */}
            <Button
              onClick={handleGoogleSignIn}
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

            {/* Email Sign In Form */}
            <form onSubmit={handleEmailSignIn} className="space-y-6">
              {/* Email */}
              <div>
                <Label htmlFor="email" className="text-cream-100">
                  <Mail className="inline w-4 h-4 mr-2" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-charcoal-700 border-charcoal-600 text-white placeholder-charcoal-400"
                  placeholder="Enter your email address"
                />
              </div>

              {/* Password */}
              <div>
                <Label htmlFor="password" className="text-cream-100">
                  <Lock className="inline w-4 h-4 mr-2" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-charcoal-700 border-charcoal-600 text-white placeholder-charcoal-400 pr-12"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-charcoal-400 hover:text-charcoal-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-gold-400 hover:text-gold-300 transition-colors"
                >
                  Forgot your password?
                </button>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-500 hover:to-gold-600 text-charcoal-900 font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
              >
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-cream-200 text-sm">
            Secure login protected by industry-standard encryption
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;