import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getProductByPriceId } from '../stripe-config';

interface SubscriptionData {
  subscription_status: string;
  price_id: string | null;
  current_period_start: number | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean;
  payment_method_brand: string | null;
  payment_method_last4: string | null;
}

export function useStripe() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSubscription = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching subscription:', fetchError);
        setError('Failed to load subscription data');
        return;
      }

      setSubscription(data);
    } catch (err) {
      console.error('Error in loadSubscription:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const createCheckoutSession = async (priceId: string, mode: 'payment' | 'subscription' = 'subscription', referralCode?: string) => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          price_id: priceId,
          mode,
          success_url: `${window.location.origin}/subscription-success`,
          cancel_url: `${window.location.origin}/subscriptions`,
          referral_code: referralCode, // Pass referral code to the edge function
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      console.error('Error creating checkout session:', err);
      throw err;
    }
  };

  const getCurrentPlan = () => {
    if (!subscription || !subscription.price_id) {
      return { name: 'Free', isActive: true };
    }

    const product = getProductByPriceId(subscription.price_id);
    const isActive = subscription.subscription_status === 'active' || subscription.subscription_status === 'trialing';

    return {
      name: product?.name || 'Unknown Plan',
      isActive,
      status: subscription.subscription_status,
      currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    };
  };

  useEffect(() => {
    loadSubscription();
  }, []);

  return {
    subscription,
    isLoading,
    error,
    createCheckoutSession,
    getCurrentPlan,
    refetch: loadSubscription,
  };
}