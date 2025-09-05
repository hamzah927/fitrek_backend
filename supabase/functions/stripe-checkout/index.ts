import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import { MILESTONE_REWARDS } from './rewards_config.ts'; // Import rewards config

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0',
  },
});

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  try {
    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // get the signature from the header
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new Response('No signature found', { status: 400 });
    }

    // get the raw body
    const body = await req.text();

    // verify the webhook signature
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
    } catch (error: any) {
      console.error(`Webhook signature verification failed: ${error.message}`);
      return new Response(`Webhook signature verification failed: ${error.message}`, { status: 400 });
    }

    EdgeRuntime.waitUntil(handleEvent(event));

    return Response.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function handleEvent(event: Stripe.Event) {
  const stripeData = event?.data?.object ?? {};

  if (!stripeData) {
    return;
  }

  if (!('customer' in stripeData)) {
    return;
  }

  // for one time payments, we only listen for the checkout.session.completed event
  if (event.type === 'payment_intent.succeeded' && event.data.object.invoice === null) {
    return;
  }

  const { customer: customerId } = stripeData;

  if (!customerId || typeof customerId !== 'string') {
    console.error(`No customer received on event: ${JSON.stringify(event)}`);
  } else {
    let isSubscription = true;

    if (event.type === 'checkout.session.completed') {
      const { mode } = stripeData as Stripe.Checkout.Session;

      isSubscription = mode === 'subscription';

      console.info(`Processing ${isSubscription ? 'subscription' : 'one-time payment'} checkout session`);
    }

    const { mode, payment_status } = stripeData as Stripe.Checkout.Session;

    if (isSubscription) {
      console.info(`Starting subscription sync for customer: ${customerId}`);
      await syncCustomerFromStripe(customerId);
      await handleReferralCompletionAndRewards(stripeData as Stripe.Checkout.Session, customerId); // Handle referral rewards
    } else if (mode === 'payment' && payment_status === 'paid') {
      try {
        // Extract the necessary information from the session
        const {
          id: checkout_session_id,
          payment_intent,
          amount_subtotal,
          amount_total,
          currency,
        } = stripeData as Stripe.Checkout.Session;

        // Insert the order into the stripe_orders table
        const { error: orderError } = await supabase.from('stripe_orders').insert({
          checkout_session_id,
          payment_intent_id: payment_intent,
          customer_id: customerId,
          amount_subtotal,
          amount_total,
          currency,
          payment_status,
          status: 'completed', // assuming we want to mark it as completed since payment is successful
        });

        if (orderError) {
          console.error('Error inserting order:', orderError);
          return;
        }
        console.info(`Successfully processed one-time payment for session: ${checkout_session_id}`);
      } catch (error) {
        console.error('Error processing one-time payment:', error);
      }
    }
  }
}

// based on the excellent https://github.com/t3dotgg/stripe-recommendations
async function syncCustomerFromStripe(customerId: string) {
  try {
    // fetch latest subscription data from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'all',
      expand: ['data.default_payment_method'],
    });

    // TODO verify if needed
    if (subscriptions.data.length === 0) {
      console.info(`No active subscriptions found for customer: ${customerId}`);
      const { error: noSubError } = await supabase.from('stripe_subscriptions').upsert(
        {
          customer_id: customerId,
          subscription_status: 'not_started',
        },
        {
          onConflict: 'customer_id',
        },
      );

      if (noSubError) {
        console.error('Error updating subscription status:', noSubError);
        throw new Error('Failed to update subscription status in database');
      }
    }

    // assumes that a customer can only have a single subscription
    const subscription = subscriptions.data[0];

    // store subscription state
    const { error: subError } = await supabase.from('stripe_subscriptions').upsert(
      {
        customer_id: customerId,
        subscription_id: subscription.id,
        price_id: subscription.items.data[0].price.id,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        ...(subscription.default_payment_method && typeof subscription.default_payment_method !== 'string'
          ? {
              payment_method_brand: subscription.default_payment_method.card?.brand ?? null,
              payment_method_last4: subscription.default_payment_method.card?.last4 ?? null,
            }
          : {}),
        status: subscription.status,
      },
      {
        onConflict: 'customer_id',
      },
    );

    if (subError) {
      console.error('Error syncing subscription:', subError);
      throw new Error('Failed to sync subscription in database');
    }
    console.info(`Successfully synced subscription for customer: ${customerId}`);
  } catch (error) {
    console.error(`Failed to sync subscription for customer ${customerId}:`, error);
    throw error;
  }
}

async function handleReferralCompletionAndRewards(session: Stripe.Checkout.Session, referredStripeCustomerId: string) {
  try {
    // Check if this is a subscription checkout (referrals only apply to subscriptions)
    if (session.mode === 'subscription') {
      // Fetch the user associated with this Stripe customer
      const { data: customerData, error: customerError } = await supabase
        .from('stripe_customers')
        .select('user_id')
        .eq('customer_id', session.customer)
        .maybeSingle();

      if (customerError || !customerData || !customerData.user_id) {
        console.error('Could not find user for Stripe customer:', session.customer, customerError);
        return;
      }

      const referredUserId = customerData.user_id;

      // Find any pending referral for this referred user (regardless of promotion code usage)
      const { data: referral, error: referralError } = await supabase
        .from('referrals')
        .select('id, referrer_id, status')
        .eq('referred_id', referredUserId)
        .eq('status', 'pending')
        .maybeSingle();

      if (referralError || !referral) {
        console.log(`No pending referral found for referred user ${referredUserId} or error:`, referralError?.message);
        return;
      }

      // Mark the referral as completed in Supabase (this will increment the referrer's count)
      const { error: completeError } = await supabase.rpc('complete_referral', {
        p_referred_user_id: referredUserId,
      });

      if (completeError) {
        console.error('Error completing referral in Supabase:', completeError);
        return;
      }

      console.log(`Referral ${referral.id} completed for referred user ${referredUserId}. Referrer ${referral.referrer_id} gets +1 referral count.`);

      // Now, award the referrer their free months
      const referrerId = referral.referrer_id;

      // Fetch the referrer's updated completed_referrals_count
      const { data: referrerUser, error: referrerUserError } = await supabase
        .from('users')
        .select('completed_referrals_count')
        .eq('id', referrerId)
        .single();

      if (referrerUserError || !referrerUser) {
        console.error('Could not find referrer user:', referrerId, referrerUserError);
        return;
      }

      const completedReferralsCount = referrerUser.completed_referrals_count;

      // Determine the total months to award based on milestones
      let monthsToAwardForThisReferral = 0;
      let previousMilestoneMonths = 0;

      // Find the months awarded for the current milestone and the previous one
      for (const milestone of MILESTONE_REWARDS) {
        if (completedReferralsCount === milestone.count) {
          monthsToAwardForThisReferral = milestone.months;
        } else if (completedReferralsCount > milestone.count) {
          previousMilestoneMonths = Math.max(previousMilestoneMonths, milestone.months);
        }
      }
      
      // Calculate the actual months to add to the subscription
      // This ensures we only add the difference if the referrer has already received benefits from previous referrals
      const actualMonthsToAdd = monthsToAwardForThisReferral - previousMilestoneMonths;

      if (actualMonthsToAdd <= 0) {
        console.log(`Referrer ${referrerId} already received rewards for ${completedReferralsCount} referrals or no new milestone reached.`);
        return;
      }

      // Fetch the referrer's Stripe customer ID and current subscription
      const { data: referrerCustomerData, error: referrerCustomerError } = await supabase
        .from('stripe_customers')
        .select('customer_id')
        .eq('user_id', referrerId)
        .single(); // Use single as a user should have only one stripe_customer entry

      if (referrerCustomerError || !referrerCustomerData) {
        console.error('Could not find Stripe customer for referrer:', referrerId, referrerCustomerError);
        return;
      }

      const referrerStripeCustomerId = referrerCustomerData.customer_id;

      const referrerSubscriptions = await stripe.subscriptions.list({
        customer: referrerStripeCustomerId,
        status: 'active',
        limit: 1,
      });

      if (referrerSubscriptions.data.length > 0) {
        const referrerSubscription = referrerSubscriptions.data[0];
        const currentPeriodEnd = referrerSubscription.current_period_end;
        const newTrialEnd = Math.floor(currentPeriodEnd + (actualMonthsToAdd * 30 * 24 * 60 * 60)); // Add months in seconds

        await stripe.subscriptions.update(referrerSubscription.id, {
          trial_end: newTrialEnd,
          proration_behavior: 'none', // Do not prorate
        });
        console.log(`Referrer ${referrerId}'s subscription extended by ${actualMonthsToAdd} months. New trial_end: ${new Date(newTrialEnd * 1000)}`);
      } else {
        console.log(`Referrer ${referrerId} has no active subscription to extend.`);
      }

      // Logic to extend referrer's subscription will go here.
      // This is complex and requires fetching the active subscription and updating its trial_end.
      // For now, the `complete_referral` RPC handles the database side of awarding.
      // The actual Stripe subscription extension would involve:
      // 1. Fetching the referrer's active subscription from Stripe using referrerCustomerData.customer_id
      // 2. Calculating the new trial_end timestamp (current_period_end + totalMonthsToAward)
      // 3. Calling stripe.subscriptions.update(subscriptionId, { trial_end: newTimestamp, proration_behavior: 'none' })
      console.log(`Referrer ${referrerId} has ${completedReferralsCount} completed referrals. Should have ${totalMonthsToAward} months free.`);
      // The actual subscription extension logic is omitted here for brevity and complexity,
      // but the database records are updated.
    }
  } catch (error) {
    console.error('Error in handleReferralCompletionAndRewards:', error);
  }
}