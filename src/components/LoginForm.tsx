import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle2, MailCheck, Gift, Eye, EyeOff } from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { supabase } from '../lib/supabase';

interface LoginFormProps {
  onComplete: () => void;
}

export function LoginForm({ onComplete }: LoginFormProps) {
  const location = useLocation();
  const [isNewUser, setIsNewUser] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(location.state?.success || null);
  const [showSignupSuccess, setShowSignupSuccess] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordError, setForgotPasswordError] = useState<string | null>(null);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState<string | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    confirmPassword: '',
  });
  const { login, signup } = useUserStore();

  // Set initial error from navigation state
  React.useEffect(() => {
    if (location.state?.error) {
      setError(location.state.error);
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setShowSignupSuccess(false);
    
    if (isNewUser && formData.password !== formData.confirmPassword) {
      setError("Passwords don't match!");
      return;
    }

    try {
      if (isNewUser) {
        // Check if email already exists before attempting signup
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('email', formData.email)
          .maybeSingle();

        if (checkError) {
          console.error('Error checking existing email:', checkError);
          setError('Failed to verify email. Please try again.');
          return;
        }

        if (existingUser) {
          setError('This email is already registered. Please sign in instead or use a different email address.');
          return;
        }

        const result = await signup(formData.email, formData.password, formData.username);

        console.log('📝 Signup result:', result);
        if (result.userAlreadyExists) {
          setError('This email is already registered. Please sign in instead or use a different email address.');
          return;
        }

        // Always show signup success and redirect to login
        setPendingEmail(formData.email);
        setShowSignupSuccess(true);
        setIsNewUser(false); // Switch to login mode
        setFormData({ ...formData, password: '', confirmPassword: '', username: '' });
        setSuccess('Account created successfully! Please check your email to verify your account.');
        
        return;
      } else {
        const result = await login(formData.email, formData.password);
        console.log('🔑 Login result:', result);
        if (result.needsEmailConfirmation) {
          setError('Please verify your email before logging in.');
          return;
        }
        console.log('🎯 Login successful, calling onComplete');
        onComplete();
      }
    } catch (err) {
      console.error('Auth error:', err);
      
      let errorMessage = 'An error occurred';
      if (err instanceof Error) {
        if (err.message.includes('fetch')) {
          errorMessage = 'Connection failed. Please check your internet connection and Supabase configuration.';
        } else if (err.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please try again.';
        } else if (err.message.includes('Email not confirmed')) {
          errorMessage = 'Please verify your email before logging in.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    }
  };

  const handleResendVerification = async () => {
    try {
      const { error } = await useUserStore.getState().resendVerification(pendingEmail);
      if (error) {
        setError(`Failed to resend verification email: ${error.message}`);
      } else {
        setSuccess(`Verification email resent to ${pendingEmail}. Please check your inbox.`);
      }
    } catch (err) {
      setError('Failed to resend verification email. Please try again.');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordError(null);
    setForgotPasswordSuccess(null);
    setIsResettingPassword(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        setForgotPasswordError(error.message);
      } else {
        setForgotPasswordSuccess('Check your email for a password reset link.');
        setForgotPasswordEmail('');
        // Close modal after 2 seconds to let user see the success message
        setTimeout(() => {
          closeForgotPasswordModal();
        }, 2000);
      }
    } catch (err) {
      setForgotPasswordError('Failed to send reset email. Please try again.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const closeForgotPasswordModal = () => {
    setShowForgotPasswordModal(false);
    setForgotPasswordEmail('');
    setForgotPasswordError(null);
    setForgotPasswordSuccess(null);
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4 sm:p-6">
      {/* Blue Gradient Background with Abstract Shapes */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 dark:from-blue-800 dark:via-blue-900 dark:to-slate-900">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl transform translate-x-1/3"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-400/15 rounded-full blur-3xl transform translate-y-1/2"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cyan-300/10 rounded-full blur-2xl"></div>
      </div>
      
      <div className="w-full max-w-md">
        {/* Glassmorphism Login Card */}
        <div className="relative bg-white/95 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 p-6 sm:p-8 transition-all duration-300 hover:shadow-3xl">
          {/* Subtle inner glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white font-poppins mb-2 bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">
                FiTrek
              </h1>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 font-medium">
                {isNewUser ? 'Create your account' : 'Welcome back'}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 sm:p-4 bg-red-50/90 dark:bg-red-900/30 backdrop-blur-sm border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 flex items-start gap-2 shadow-sm">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm sm:text-base">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-3 sm:p-4 bg-green-50/90 dark:bg-green-900/30 backdrop-blur-sm border border-green-200 dark:border-green-800 rounded-xl text-green-600 dark:text-green-400 flex items-start gap-2 shadow-sm">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm sm:text-base">{success}</p>
              </div>
            )}

            {showSignupSuccess && (
              <div className="mb-6 p-4 bg-blue-50/90 dark:bg-blue-900/30 backdrop-blur-sm border border-blue-200 dark:border-blue-800 rounded-xl shadow-sm">
                <div className="flex items-start gap-3">
                  <MailCheck className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                      Account Created Successfully!
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                      Please check your email to verify your account before signing in.
                    </p>
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-100/80 dark:bg-blue-900/40 backdrop-blur-sm rounded-lg hover:bg-blue-200/80 dark:hover:bg-blue-900/60 transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                      Resend Verification Email
                    </button>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-5 sm:space-y-6">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500/70 dark:text-blue-400/70" />
                  <input
                    type="email"
                    required
                    className="w-full pl-12 pr-4 py-3.5 sm:py-4 rounded-xl border-2 border-gray-200/80 dark:border-gray-600/80 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 text-gray-900 dark:text-white font-medium placeholder-gray-500 dark:placeholder-gray-400 shadow-sm hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md focus:shadow-lg focus:shadow-blue-500/20"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                {isNewUser && (
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500/70 dark:text-blue-400/70" />
                    <input
                      type="text"
                      required
                      className="w-full pl-12 pr-4 py-3.5 sm:py-4 rounded-xl border-2 border-gray-200/80 dark:border-gray-600/80 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 text-gray-900 dark:text-white font-medium placeholder-gray-500 dark:placeholder-gray-400 shadow-sm hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md focus:shadow-lg focus:shadow-blue-500/20"
                      placeholder="Username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />
                  </div>
                )}

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500/70 dark:text-blue-400/70" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full pl-12 pr-12 py-3.5 sm:py-4 rounded-xl border-2 border-gray-200/80 dark:border-gray-600/80 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 text-gray-900 dark:text-white font-medium placeholder-gray-500 dark:placeholder-gray-400 shadow-sm hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md focus:shadow-lg focus:shadow-blue-500/20"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {/* Forgot Password Link */}
                {!isNewUser && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setShowForgotPasswordModal(true)}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors duration-300 hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                {isNewUser && (
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500/70 dark:text-blue-400/70" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      className="w-full pl-12 pr-12 py-3.5 sm:py-4 rounded-xl border-2 border-gray-200/80 dark:border-gray-600/80 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 text-gray-900 dark:text-white font-medium placeholder-gray-500 dark:placeholder-gray-400 shadow-sm hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md focus:shadow-lg focus:shadow-blue-500/20"
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                )}
              </div>

              {/* Enhanced Sign In Button */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl hover:shadow-blue-500/25 focus:ring-4 focus:ring-blue-500/30 focus:outline-none group relative overflow-hidden"
              >
                <div className="flex items-center justify-center gap-3">
                  <span className="text-lg">{isNewUser ? 'Create Account' : 'Sign In'}</span>
                  <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1 group-active:translate-x-2" />
                </div>
                {/* Button glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-blue-600/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
              
              {/* Switch Account Type Link */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewUser(!isNewUser);
                    setError(null);
                    setSuccess(null);
                    setShowSignupSuccess(false);
                    setPendingEmail('');
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95 py-3 px-4 rounded-lg hover:bg-blue-50/80 dark:hover:bg-blue-900/30 backdrop-blur-sm"
                >
                  {isNewUser ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Subtle bottom text */}
        <div className="text-center mt-6">
          <p className="text-sm text-white/80 dark:text-gray-300/80 font-medium">
            Your fitness journey starts here
          </p>
        </div>
      </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative bg-white/95 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 w-full max-w-md p-6 sm:p-8 transition-all duration-300 animate-scale-in">
            {/* Subtle inner glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl pointer-events-none"></div>
            
            <div className="relative z-10">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-poppins mb-2">
                  Reset Password
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Enter your email to receive a password reset link
                </p>
              </div>

              {forgotPasswordError && (
                <div className="mb-4 p-3 bg-red-50/90 dark:bg-red-900/30 backdrop-blur-sm border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 flex items-start gap-2 shadow-sm">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">{forgotPasswordError}</p>
                </div>
              )}

              {forgotPasswordSuccess && (
                <div className="mb-4 p-3 bg-green-50/90 dark:bg-green-900/30 backdrop-blur-sm border border-green-200 dark:border-green-800 rounded-xl text-green-600 dark:text-green-400 flex items-start gap-2 shadow-sm">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">{forgotPasswordSuccess}</p>
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500/70 dark:text-blue-400/70" />
                  <input
                    type="email"
                    required
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-200/80 dark:border-gray-600/80 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 text-gray-900 dark:text-white font-medium placeholder-gray-500 dark:placeholder-gray-400 shadow-sm hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md focus:shadow-lg focus:shadow-blue-500/20"
                    placeholder="Enter your email address"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeForgotPasswordModal}
                    className="flex-1 bg-gray-100/80 dark:bg-gray-700/80 text-gray-700 dark:text-gray-300 font-semibold py-3 px-4 rounded-xl hover:bg-gray-200/80 dark:hover:bg-gray-600/80 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md backdrop-blur-sm"
                    disabled={isResettingPassword}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl hover:shadow-blue-500/25 focus:ring-4 focus:ring-blue-500/30 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isResettingPassword}
                  >
                    {isResettingPassword ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </div>
                    ) : (
                      'Reset Password'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}