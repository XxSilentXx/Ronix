import React from 'react';
import { useStripe, useElements, CardElement, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Use env var so no live publishable key is hardcoded in source.
const STRIPE_PUBLISHABLE_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '';

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

function StripeDebugInner() {
  const stripe = useStripe();
  const elements = useElements();

  React.useEffect(() => {

    if (stripe) {


    }
  }, [stripe]);

  return (
    <div>
      <h2>Stripe Debug</h2>
      <CardElement />
      <button disabled={!stripe}>Test Button</button>
    </div>);

}

export default function StripeDebug() {
  return (
    <Elements stripe={stripePromise}>
      <StripeDebugInner />
    </Elements>);

}