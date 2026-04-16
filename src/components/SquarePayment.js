import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { getFirestore, doc, updateDoc, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getDeviceId, getUserIp } from '../utils/device';
import { getAuth } from 'firebase/auth';

// Square configuration - easier to update in one place
const SQUARE_CONFIG = {
  // Production credentials
  applicationId: 'sq0idp-cpb0uUHPWK4F1bs7r0uqQQ',
  scriptUrl: 'https://web.squarecdn.com/v1/square.js',
  // Uncomment these and comment out the above to switch back to sandbox
  // applicationId: 'sandbox-sq0idb-HKj3hizwUKVAdZtFUP8FBA',
  // scriptUrl: 'https://sandbox.web.squarecdn.com/v1/square.js',
};

// Styled components
const PaymentContainer = styled.div`
  width: 100%;
  margin-bottom: 1rem;
`;

const CardFormContainer = styled.div`
  width: 100%;
  min-height: 100px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  padding: 1rem;
  margin-bottom: 1rem;
`;

const LoadingIndicator = styled.div`
  text-align: center;
  padding: 1rem 0;
  color: #c0c0c0;
`;

const ErrorMessage = styled.div`
  color: #ff6b6b;
  margin-top: 0.5rem;
  font-size: 0.9rem;
`;

const PayButton = styled.button`
  width: 100%;
  background: #006aff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px;
  font-size: 16px;
  cursor: ${props => (props.disabled ? 'not-allowed' : 'pointer')};
  opacity: ${props => (props.disabled ? 0.7 : 1)};
`;

/**
 * Square Payment Component for handling credit card payments through Square
 */
const SquarePayment = ({ onPaymentSuccess, amount, packageId, isDisabled, referralCode }) => {
  // Generate a key to force component re-mount when needed
  const [instanceKey, setInstanceKey] = useState(Date.now());
  // State management
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  
  // Create a reference to the container element and track component mounted state
  const cardContainerRef = useRef(null);
  const mounted = useRef(true);
  
  // On component mount/unmount
  useEffect(() => {
    mounted.current = true;
    
    // Clean up function for when component unmounts
    return () => {
      mounted.current = false;
      
      // Destroy card instance on unmount
      if (card) {
        try {
          card.destroy();
        } catch (e) {
          console.error('Error destroying Square card:', e);
        }
      }
    };
  }, []);
  
  // Initialize Square payment when component is ready
  useEffect(() => {
    // Skip initialization if disabled or already loading/loaded
    if (isDisabled || !cardContainerRef.current) return;
    
    // First, clear any existing content in the container
    while (cardContainerRef.current.firstChild) {
      cardContainerRef.current.removeChild(cardContainerRef.current.firstChild);
    }
    
    // Function to load Square script if needed
    const loadSquareScript = () => {
      return new Promise((resolve, reject) => {
        if (window.Square) {
          resolve();
          return;
        }
        
        const script = document.createElement('script');
        script.src = SQUARE_CONFIG.scriptUrl;
        script.crossOrigin = 'anonymous';
        script.onload = () => {
          console.log('Square script loaded successfully');
          resolve();
        };
        script.onerror = () => {
          console.error('Failed to load Square script');
          reject(new Error('Failed to load Square SDK'));
        };
        document.body.appendChild(script);
      });
    };
    
    // Function to initialize the Square card form
    const initializeCard = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load Square script if needed
        await loadSquareScript();
        
        if (!mounted.current) return;
        
        // Create payments instance
        console.log('Creating Square payments instance...');
        const payments = window.Square.payments(SQUARE_CONFIG.applicationId);
        
        // Create card instance
        console.log('Creating Square card instance...');
        const cardInstance = await payments.card();
        
        // Make sure component is still mounted
        if (!mounted.current) return;
        
        // Make sure container is empty before attaching
        while (cardContainerRef.current.firstChild) {
          cardContainerRef.current.removeChild(cardContainerRef.current.firstChild);
        }
        
        // Attach card to the container
        console.log('Attaching Square card to container...');
        await cardInstance.attach(cardContainerRef.current);
        console.log('Square card attached successfully');
        
        // Update state with the card instance
        setCard(cardInstance);
        setLoading(false);
      } catch (err) {
        console.error('Square initialization error:', err);
        if (mounted.current) {
          setError(`Could not initialize payment form: ${err.message}`);
          setLoading(false);
        }
      }
    };
    
    // Start initialization
    initializeCard();
    
    // Cleanup function
    return () => {
      if (card) {
        try {
          card.destroy();
        } catch (e) {
          console.error('Error destroying Square card:', e);
        }
      }
    };
  }, [isDisabled]);

  /**
   * Reset the component state
   */
  const resetComponent = () => {
    // Destroy the current card instance if it exists
    if (card) {
      try {
        card.destroy();
      } catch (e) {
        console.error('Error destroying card during reset:', e);
      }
    }
    
    // Reset all state
    setCard(null);
    setLoading(true);
    setError(null);
    setProcessing(false);
    
    // Create a new instance key to force a complete remount
    setInstanceKey(Date.now());
  };

  /**
   * Handle payment submission when user clicks the Pay button
   */
  const handlePayment = async () => {
    // Validate that card is initialized
    if (!card) {
      setError('Payment system not initialized');
      return;
    }
    
    // Set processing state
    setProcessing(true);
    setError(null);
    
    try {
      // Step 1: Tokenize the card payment
      const result = await card.tokenize();
      
      // Check tokenization result
      if (result.status === 'OK') {
        // Step 2: Process payment with the token
        const response = await processPayment(result.token, amount, packageId, referralCode);
        onPaymentSuccess(response);
      } else {
        // Handle tokenization errors
        console.error('Payment tokenization failed:', result.errors);
        setError(result.errors[0]?.message || 'Card validation failed');
      }
    } catch (err) {
      // Handle any other errors
      console.error('Payment processing error:', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      // Reset processing state
      setProcessing(false);
    }
  };

  const { currentUser } = useAuth();
  const db = getFirestore();

  const processPayment = async (token, amount, packageId, referralCode) => {
    try {
      // Validate authentication first
      if (!currentUser || !currentUser.uid) {
        throw new Error('User not authenticated. Please log in and try again.');
      }
      
      console.log(`Processing Square payment for user: ${currentUser.uid}`);
      console.log('Current user object:', currentUser);
      
      // Check Firebase Auth state directly
      const auth = getAuth();
      const firebaseUser = auth.currentUser;
      console.log('Firebase Auth currentUser:', firebaseUser);
      console.log('Firebase Auth currentUser UID:', firebaseUser?.uid);
      console.log('Firebase Auth currentUser token:', await firebaseUser?.getIdToken());
      
      // Get device ID and user IP for anti-abuse and referral tracking
      const deviceId = getDeviceId();
      const userIp = await getUserIp();
      
      console.log('Calling processSquarePayment with data:', {
        sourceId: token,
        amount: amount,
        packageId: packageId,
        referralCode: referralCode || null,
        deviceId: deviceId,
        userIp: userIp
      });
      
      // Call the Cloud Function to process the payment (auth handled by SDK)
      const functions = getFunctions();
      const processSquarePayment = httpsCallable(functions, 'processSquarePayment');
      
      const result = await processSquarePayment({
        sourceId: token,
        amount: amount,
        packageId: packageId,
        referralCode: referralCode || null,
        deviceId: deviceId,
        userIp: userIp
      });
      
      console.log(`Square payment processed successfully:`, result.data);
      
      return {
        success: true,
        coinsAdded: result.data.coinsAdded,
        newBalance: result.data.newBalance
      };
    } catch (error) {
      console.error('Error processing Square payment:', error);
      
      // Handle specific Firebase auth errors
      if (error.code === 'unauthenticated' || error.message.includes('401')) {
        throw new Error('Authentication failed. Please refresh the page and log in again.');
      }
      
      throw new Error(error.message || 'Payment failed. Please try again.');
    }
  };

  // Watch for changes in isDisabled which could indicate a modal reopen
  useEffect(() => {
    if (!isDisabled) {
      // Modal has been reopened for a new payment, reset everything
      resetComponent();
    }
  }, [isDisabled]);

  // Render component with key to force complete remount when needed
  return (
    <PaymentContainer key={instanceKey}>
      {/* Card form container with ref */}
      <CardFormContainer ref={cardContainerRef} />
      
      {/* Error message if any */}
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      {/* Loading indicator when initializing */}
      {loading && <LoadingIndicator>Initializing payment form...</LoadingIndicator>}
      
      {/* Pay button - only show if the card form is loaded */}
      {!loading && (
        <PayButton 
          onClick={handlePayment}
          disabled={loading || processing || isDisabled || error}
        >
          {processing ? 'Processing...' : 'Pay with Card'}
        </PayButton>
      )}
    </PaymentContainer>
  );
};

export default SquarePayment;
