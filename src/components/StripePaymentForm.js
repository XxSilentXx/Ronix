import React, { useState } from 'react';
import styled from 'styled-components';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getFunctions, httpsCallable } from 'firebase/functions';

const FormContainer = styled.div`
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
`;

const Form = styled.form`
  width: 100%;
`;

const CardContainer = styled.div`
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1rem;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.2);
  margin-bottom: 1.5rem;
`;

const SubmitButton = styled.button`
  width: 100%;
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 1rem;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 1rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(79, 172, 254, 0.4);
  }
  
  &:disabled {
    background: #555;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const ErrorMessage = styled.div`
  color: #ff6b6b;
  margin-top: 0.5rem;
  margin-bottom: 1rem;
`;

const cardElementOptions = {
  style: {
    base: {
      color: '#fff',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#ff6b6b',
      iconColor: '#ff6b6b',
    },
  },
};

const StripePaymentForm = ({ selectedPackage, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const functions = getFunctions();
  const [stripeLoadError, setStripeLoadError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Only show error if user is trying to pay and Stripe is not loaded
      setStripeLoadError('Payment system is not available. Please try again later.');
      return;
    }

    setLoading(true);
    setError('');
    setStripeLoadError('');

    try {
      // 1. Create a payment intent on your server
      const createPaymentIntent = httpsCallable(functions, 'createPaymentIntent');
      const response = await createPaymentIntent({
        amount: selectedPackage.price * 100, // Convert to cents
        currency: 'usd',
        packageId: `${selectedPackage.coins}_coins`
      });

      const clientSecret = response.data.clientSecret;

      // 2. Confirm the payment with Stripe.js
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (result.error) {
        setError(result.error.message);
      } else if (result.paymentIntent.status === 'succeeded') {
        // 3. Payment successful - notify the parent component
        onSuccess(result.paymentIntent.id, selectedPackage);
      }
    } catch (err) {
      // Ignore port errors unless payment is broken
      if (err && err.message && (err.message.includes('Failed to fetch') || err.message.includes('net::ERR_CONNECTION_REFUSED') || err.message.includes('Stripe') || err.message.includes('localhost'))) {
        // Only show if payment actually fails
        setStripeLoadError('Unable to connect to payment system. If you are not trying to pay, you can ignore this.');
      } else {
      setError(err.message || 'An error occurred during payment processing');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormContainer>
      <Form onSubmit={handleSubmit}>
        <CardContainer>
          <CardElement options={cardElementOptions} />
        </CardContainer>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {stripeLoadError && <ErrorMessage>{stripeLoadError}</ErrorMessage>}
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <SubmitButton type="button" onClick={onCancel} style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
            Cancel
          </SubmitButton>
          <SubmitButton type="submit" disabled={!stripe || loading}>
            {loading ? 'Processing...' : `Pay $${selectedPackage.price.toFixed(2)}`}
          </SubmitButton>
        </div>
      </Form>
    </FormContainer>
  );
};

export default StripePaymentForm;