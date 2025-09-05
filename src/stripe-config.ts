export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
  price: number;
  currency: string;
  interval?: 'month' | 'year';
}

export const stripeProducts: StripeProduct[] = [
  {
    id: 'prod_Sr3xaW0bNtfOae_monthly',
    priceId: 'price_1RvLq32L3BgwFrbVxvLqZO4X', // Replace with your actual monthly price ID
    name: 'FiTrek Pro',
    description: 'Unlock advanced features and AI-powered coaching',
    mode: 'subscription',
    price: 9.99,
    currency: 'usd',
    interval: 'month',
  },
  {
    id: 'prod_Sr3xaW0bNtfOae_yearly',
    priceId: 'price_1RvLqe2L3BgwFrbVtNcW4ZwZ', // Replace with your actual yearly price ID
    name: 'FiTrek Pro',
    description: 'Unlock advanced features and AI-powered coaching',
    mode: 'subscription',
    price: 99.99, // Yearly price (10 months worth)
    currency: 'usd',
    interval: 'year',
  },
];

export const getProductById = (id: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.id === id);
};

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.priceId === priceId);
}