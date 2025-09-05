import React, { useState } from 'react';
import { Crown, Check, Star, Zap, TrendingUp, Bot, Calendar, Dumbbell, Loader2, AlertCircle, Gift, User } from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { useStripe } from '../hooks/useStripe';
import { stripeProducts } from '../stripe-config';
import { supabase } from '../lib/supabase';

export function SubscriptionsPage() {
  const { userData } = useUserStore();
  const { subscription, isLoading, createCheckoutSession, getCurrentPlan } = useStripe();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const [referralCode, setReferralCode] = useState(userData?.referralCode || ''); // Initialize with user's own code
  const [referralApplied, setReferralApplied] = useState(false);
  const [isValidatingReferral, setIsValidatingReferral] = useState(false);
  const [referralError, setReferralError] = useState<string | null>(null);
  const currentPlan = getCurrentPlan();
  const monthlyProduct = stripeProducts.find(p => p.name === 'FiTrek Pro' && p.interval === 'month');
  const yearlyProduct = stripeProducts.find(p => p.name === 'FiTrek Pro' && p.interval === 'year');

  const validateReferralCode = async () => {
    if (!referralCode.trim()) {
      setReferralError('Please enter a referral code');
      return;
    }

    setIsValidatingReferral(true);
    setReferralError(null);

    try {
      // Check if the referral code exists in the database
      const { data: referrerUser, error } = await supabase
        .from('users')
        .select('id, name')
        .eq('referral_code', referralCode.trim().toUpperCase()) // Ensure code is uppercase for lookup
        .maybeSingle();

      if (error) {
        console.error('Error validating referral code:', error);
        setReferralError('Failed to validate referral code. Please try again.');
        return;
      }

      if (!referrerUser) {
        setReferralError('Invalid referral code. Please check and try again.');
        return;
      }

      // Check if user is trying to use their own referral code
      const { data: { user } } = await supabase.auth.getUser();
      if (user && referrerUser.id === user.id && referralCode.trim().toUpperCase() === userData?.referralCode?.toUpperCase()) {
        setReferralError('You cannot use your own referral code.');
        return;
      }

      // Success - code is valid
      setReferralApplied(true);
      setReferralError(null);
    } catch (error) {
      console.error('Error validating referral code:', error);
      setReferralError('Failed to validate referral code. Please try again.');
    } finally {
      setIsValidatingReferral(false);
    }
  };

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: { monthly: 0, yearly: 0 },
      description: 'Perfect for getting started with your fitness journey',
      features: [
        'Basic workout logging',
        'Exercise database access',
        'Progress tracking',
        'Community support'
      ],
      limitations: [
        'Limited to 3 workout programs',
        'Basic progress charts',
        'Standard support'
      ],
      popular: false,
      current: currentPlan.name === 'Free'
    },
    {
      id: 'pro',
      name: 'FiTrek Pro',
      price: { monthly: monthlyProduct?.price || 9.99, yearly: yearlyProduct?.price || 99.99 },
      description: 'Unlock advanced features and AI-powered coaching',
      features: [
        'Unlimited workout programs',
        'Advanced progress analytics',
        'AI Coach premium features',
        'Custom exercise creation',
        'Nutrition tracking',
        'Priority support',
        'Export workout data',
        'Advanced charts & insights'
      ],
      limitations: [],
      popular: true,
      current: currentPlan.name === 'FiTrek Pro' && currentPlan.isActive
    },
  ];

  const handleSelectPlan = async (planId: string) => {
    if (planId === 'free') return;

    const selectedProduct = selectedPlan === 'monthly' ? monthlyProduct : yearlyProduct;
    if (!selectedProduct) return;

    setIsProcessing(true);
    setCheckoutError(null);

    try {
      await createCheckoutSession(selectedProduct.priceId, selectedProduct.mode, referralCode.trim() || undefined);
    } catch (err) {
      console.error('Checkout error:', err);
      setCheckoutError(err instanceof Error ? err.message : 'Failed to start checkout');
    } finally {
      setIsProcessing(false);
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free':
        return Dumbbell;
      case 'pro':
        return Star;
      default:
        return Dumbbell;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'free':
        return 'from-gray-500 to-gray-600';
      case 'pro':
        return 'from-primary to-blue-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="space-y-8">
      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading subscription data...</p>
        </div>
      )}

      {/* Error State */}
      {checkoutError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-red-700 dark:text-red-300">{checkoutError}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center shadow-elevation-2 dark:shadow-elevation-2-dark">
            <Crown className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-poppins bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Choose Your Plan
        </h1>
        {currentPlan.name !== 'Free' && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-green-700 dark:text-green-300 font-medium">
              Current Plan: {currentPlan.name}
              {currentPlan.status && ` (${currentPlan.status})`}
            </p>
            {currentPlan.currentPeriodEnd && (
              <p className="text-green-600 dark:text-green-400 text-sm mt-1">
                {currentPlan.cancelAtPeriodEnd ? 'Expires' : 'Renews'} on {currentPlan.currentPeriodEnd.toLocaleDateString()}
              </p>
            )}
          </div>
        )}
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Unlock the full potential of your fitness journey with FiTrek's premium features
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-2 shadow-elevation-1 dark:shadow-elevation-1-dark border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedPlan('monthly')}
              className={`px-6 py-2 rounded-xl font-semibold transition-all duration-300 ${
                selectedPlan === 'monthly'
                  ? 'bg-primary text-white shadow-elevation-2 dark:shadow-elevation-2-dark'
                  : 'text-gray-600 dark:text-gray-400 hover:text-primary'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setSelectedPlan('yearly')}
              className={`px-6 py-2 rounded-xl font-semibold transition-all duration-300 relative ${
                selectedPlan === 'yearly'
                  ? 'bg-primary text-white shadow-elevation-2 dark:shadow-elevation-2-dark'
                  : 'text-gray-600 dark:text-gray-400 hover:text-primary'
              }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Referral Code Input */}
      {currentPlan.name === 'Free' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-elevation-1 dark:shadow-elevation-1-dark p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Gift className="h-6 w-6 text-primary" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Have a Referral Code?</h3>
          </div>
          <div className="space-y-4">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Enter referral code"
                className="input-field flex-1"
                value={referralCode.toUpperCase()} // Display uppercase
                onChange={(e) => {
                  setReferralCode(e.target.value);
                  setReferralApplied(false);
                }}
              />
              {referralCode.trim() && (
                <button
                  onClick={validateReferralCode}
                  className="button-primary px-4 py-2 text-sm"
                  disabled={referralApplied || isValidatingReferral || !referralCode.trim()}
                >
                  {isValidatingReferral ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Checking...
                    </div>
                  ) : referralApplied ? (
                    'Applied!'
                  ) : (
                    'Apply'
                  )}
                </button>
              )}
            </div>
            
            {referralApplied && referralCode.trim() && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <p className="text-sm text-green-700 dark:text-green-300 font-medium flex items-center gap-2">
                  ✅ Referral code "{referralCode}" is valid! Your referrer will earn rewards when you subscribe.
                </p>
              </div>
            )}

            {referralError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-700 dark:text-red-300 font-medium flex items-center gap-2">
                  ❌ {referralError}
                </p>
              </div>
            )}
            
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your friend's code to help them earn rewards!
            </p>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        {plans.map((plan) => {
          const Icon = getPlanIcon(plan.id);
          const colorClass = getPlanColor(plan.id);
          const price = plan.price[selectedPlan];
          const yearlyDiscount = selectedPlan === 'yearly' && plan.id !== 'free';

          return (
            <div
              key={plan.id}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-elevation-2 dark:shadow-elevation-2-dark border-2 transition-all duration-300 hover:shadow-elevation-3 dark:hover:shadow-elevation-3-dark hover:scale-105 ${
                plan.popular
                  ? 'border-primary shadow-glow'
                  : plan.current
                  ? 'border-green-500'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-primary to-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-elevation-2 dark:shadow-elevation-2-dark">
                    Most Popular
                  </div>
                </div>
              )}

              {/* Current Plan Badge */}
              {plan.current && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-elevation-2 dark:shadow-elevation-2-dark">
                    Current Plan
                  </div>
                </div>
              )}

              <div className="p-6 sm:p-8">
                {/* Plan Header */}
                <div className="text-center mb-6">
                  <div className={`w-16 h-16 bg-gradient-to-r ${colorClass} rounded-full flex items-center justify-center mx-auto mb-4 shadow-elevation-2 dark:shadow-elevation-2-dark`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold font-poppins text-gray-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {plan.description}
                  </p>
                </div>

                {/* Pricing */}
                <div className="text-center mb-8">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-4xl font-bold font-poppins text-gray-900 dark:text-white">
                      ${price}
                    </span>
                    {plan.id !== 'free' && (
                      <span className="text-gray-500 dark:text-gray-400">
                        /{selectedPlan === 'monthly' ? 'month' : 'year'}
                      </span>
                    )}
                  </div>
                  {yearlyDiscount && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                      Save ${(plan.price.monthly * 12 - plan.price.yearly).toFixed(2)} per year
                    </p>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300 text-sm">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={plan.current || isProcessing}
                  className={`w-full py-3 px-6 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                    plan.current || isProcessing
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : plan.popular
                      ? 'bg-gradient-to-r from-primary to-blue-600 text-white shadow-elevation-3 dark:shadow-elevation-3-dark hover:shadow-elevation-4 dark:hover:shadow-elevation-4-dark'
                      : 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-200 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 shadow-elevation-2 dark:shadow-elevation-2-dark hover:shadow-elevation-3 dark:hover:shadow-elevation-3-dark'
                  }`}
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </div>
                  ) : plan.current ? (
                    'Current Plan'
                  ) : plan.id === 'free' ? (
                    'Continue Free'
                  ) : (
                    'Upgrade Now'
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Features Comparison */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-elevation-2 dark:shadow-elevation-2-dark p-6 sm:p-8">
        <h2 className="text-2xl font-bold font-poppins text-gray-900 dark:text-white mb-6 text-center">
          Why Upgrade to Pro?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-gradient-to-r from-primary to-blue-600 rounded-full flex items-center justify-center mx-auto">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">AI Coach Premium</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Get personalized workout recommendations and form corrections
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-gradient-to-r from-secondary to-violet-600 rounded-full flex items-center justify-center mx-auto">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Advanced Analytics</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Detailed progress tracking with comprehensive charts and insights
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Unlimited Programs</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Create as many workout programs as you need for your goals
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Priority Support</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Get faster responses and dedicated support for your fitness journey
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gradient-to-br from-primary/5 to-blue-50/50 dark:from-primary/10 dark:to-blue-900/20 rounded-2xl p-6 sm:p-8 border border-primary/10">
        <h2 className="text-2xl font-bold font-poppins text-gray-900 dark:text-white mb-6 text-center">
          Frequently Asked Questions
        </h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Can I cancel my subscription anytime?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Yes, you can cancel your subscription at any time. You'll continue to have access to premium features until the end of your billing period.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              What happens to my data if I downgrade?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Your workout data is always safe. If you downgrade, you'll keep all your logged workouts but may be limited to 3 active workout programs.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Is there a free trial for Pro?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              We offer a 7-day free trial for Pro. No credit card required to start your trial.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}