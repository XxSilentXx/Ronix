import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_PUBLISHABLE_KEY } from './config';

// Only initialize Stripe once, with the live key
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

const StripeProvider = ({ children }) => (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );

export default StripeProvider;
