import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Crown, ArrowRight, Sparkles } from 'lucide-react';
import { useStripe } from '../hooks/useStripe';

export function SubscriptionSuccessPage() {
  const navigate = useNavigate();
  const { refetch, getCurrentPlan } = useStripe();

  useEffect(() => {
    // Refetch subscription data to get the latest status
    refetch();
  }, [refetch]);

  const currentPlan = getCurrentPlan();

  return (
    <div className="min-h-screen bg-gradient-soft dark:bg-gradient-soft-dark flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-elevation-3 dark:shadow-elevation-3-dark p-6 sm:p-8 text-center animate-scale-in">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-elevation-2 dark:shadow-elevation-2-dark animate-bounce-gentle">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-primary to-blue-600 rounded-full flex items-center justify-center shadow-elevation-2 dark:shadow-elevation-2-dark">
                <Crown className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          {/* Success Message */}
          <div className="space-y-4 mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold font-poppins bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Welcome to {currentPlan.name}!
            </h1>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Your subscription has been activated successfully. You now have access to all premium features!
            </p>
          </div>

          {/* Premium Features Highlight */}
          <div className="bg-gradient-to-br from-primary/5 to-blue-50/50 dark:from-primary/10 dark:to-blue-900/20 rounded-xl p-4 sm:p-6 mb-8 border border-primary/10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Now Available:</h3>
            </div>
            <div className="grid grid-cols-1 gap-3 text-left">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Unlimited workout programs</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Advanced progress analytics</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">AI Coach premium features</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Priority support</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => navigate('/')}
              className="button-primary w-full flex items-center justify-center gap-2 py-4"
            >
              Start Using Premium Features
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/ai-assistant')}
              className="button-secondary w-full flex items-center justify-center gap-2"
            >
              <Bot className="w-4 h-4" />
              Chat with AI Coach
            </button>
          </div>

          {/* Subscription Details */}
          {currentPlan.currentPeriodEnd && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Your subscription {currentPlan.cancelAtPeriodEnd ? 'expires' : 'renews'} on{' '}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {currentPlan.currentPeriodEnd.toLocaleDateString()}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}