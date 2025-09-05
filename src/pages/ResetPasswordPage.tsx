import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);

  useEffect(() => {
    // Check if we have valid session from the reset link
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session) {
        setIsValidSession(true);
      } else {
        // If no session, redirect to login with error
        navigate('/', { 
          state: { 
            error: 'Invalid or expired reset link. Please request a new password reset.' 
          } 
        });
      }
    };

    checkSession();
  }, [navigate]);

  const validatePasswords = () => {
    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords don't match.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validatePasswords()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess('Password updated! You can now log in.');
        
        // Redirect to login page after 2 seconds
        setTimeout(() => {
          navigate('/', { 
            state: { 
              success: 'Password updated! You can now log in.' 
            } 
          });
        }, 2000);
      }
    } catch (err) {
      setError('Failed to update password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4 sm:p-6">
        {/* Blue Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 dark:from-blue-800 dark:via-blue-900 dark:to-slate-900">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-300/20 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
        </div>
        
        <div className="relative bg-white/95 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 p-6 sm:p-8">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700 dark:text-gray-300">Validating reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
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
        {/* Glassmorphism Reset Password Card */}
        <div className="relative bg-white/95 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 p-6 sm:p-8 transition-all duration-300 hover:shadow-3xl">
          {/* Subtle inner glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-poppins mb-2 bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">
                Reset Your Password
              </h1>
              <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                Enter your new password below
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

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-5 sm:space-y-6">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500/70 dark:text-blue-400/70" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    className="w-full pl-12 pr-12 py-3.5 sm:py-4 rounded-xl border-2 border-gray-200/80 dark:border-gray-600/80 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 text-gray-900 dark:text-white font-medium placeholder-gray-500 dark:placeholder-gray-400 shadow-sm hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md focus:shadow-lg focus:shadow-blue-500/20"
                    placeholder="New Password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500/70 dark:text-blue-400/70" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    className="w-full pl-12 pr-12 py-3.5 sm:py-4 rounded-xl border-2 border-gray-200/80 dark:border-gray-600/80 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 text-gray-900 dark:text-white font-medium placeholder-gray-500 dark:placeholder-gray-400 shadow-sm hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md focus:shadow-lg focus:shadow-blue-500/20"
                    placeholder="Confirm New Password"
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
              </div>

              {/* Password Requirements */}
              <div className="bg-blue-50/90 dark:bg-blue-900/30 backdrop-blur-sm border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-2">Password Requirements:</p>
                <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                  <li className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${formData.newPassword.length >= 6 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    At least 6 characters
                  </li>
                  <li className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${formData.newPassword === formData.confirmPassword && formData.confirmPassword ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    Passwords match
                  </li>
                </ul>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl hover:shadow-blue-500/25 focus:ring-4 focus:ring-blue-500/30 focus:outline-none group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="text-lg">Updating Password...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-lg">Update Password</span>
                    <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1 group-active:translate-x-2" />
                  </div>
                )}
                {/* Button glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-blue-600/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>

              {/* Back to Login Link */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95 py-3 px-4 rounded-lg hover:bg-blue-50/80 dark:hover:bg-blue-900/30 backdrop-blur-sm"
                >
                  Back to Login
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Subtle bottom text */}
        <div className="text-center mt-6">
          <p className="text-sm text-white/80 dark:text-gray-300/80 font-medium">
            Secure password reset
          </p>
        </div>
      </div>
    </div>
  );
}