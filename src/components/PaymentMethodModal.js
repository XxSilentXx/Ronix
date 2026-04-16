import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import SquarePayment from './SquarePayment';
import { useTokens } from '../contexts/TokenContext';
import { getDeviceId, getUserIp } from '../utils/device';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '../contexts/AuthContext';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  padding: 2rem;
  color: #fff;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
`;

const ModalCloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: #fff;
  font-size: 1.5rem;
  cursor: pointer;
`;

const Button = styled.button`
  width: 100%;
  border: none;
  border-radius: 10px;
  padding: 1rem;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 1rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const PayPalButton = styled(Button)`
  background: #ffc439;
  color: #003087;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
`;

const CloseButton = styled(Button)`
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
  margin-top: 1rem;
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: 2rem;
  color: #fff;
  font-size: 1.5rem;
`;

const PackageInfo = styled.div`
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  text-align: center;
`;

const PaymentMethodModal = ({ isOpen, onClose, selectedPackage, onPayWithPaypal }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activePaymentMethod, setActivePaymentMethod] = useState('paypal'); // 'paypal', 'card', or 'crypto'
  const [referralCode, setReferralCode] = useState('');
  const [referralStatus, setReferralStatus] = useState('');
  const [referralValid, setReferralValid] = useState(false);
  const { refreshBalance } = useTokens();
  const { currentUser } = useAuth();
  
  // Reset state when modal is opened
  useEffect(() => {
    if (isOpen) {
      // Reset all state when modal is opened
      setLoading(false);
      setError('');
      setSuccess('');
      setActivePaymentMethod('paypal');
      setReferralCode('');
      setReferralStatus('');
      setReferralValid(false);
    }
  }, [isOpen]);

  // Real-time referral code validation
  useEffect(() => {
    let cancelled = false;
    async function validate() {
      if (!referralCode) {
        setReferralStatus('');
        setReferralValid(false);
        return;
      }
      setReferralStatus('Checking...');
      const deviceId = getDeviceId();
      const userIp = await getUserIp();
      const userId = currentUser?.uid;
      try {
        const validateReferralCode = httpsCallable(getFunctions(), 'validateReferralCode');
        const res = await validateReferralCode({
          referralCode,
          userId,
          deviceId,
          userIp
        });
        if (!cancelled) {
          setReferralStatus(res.data.valid ? `Valid!${res.data.creatorDisplayName ? ' By ' + res.data.creatorDisplayName : ''}` : res.data.reason);
          setReferralValid(res.data.valid);
        }
      } catch (err) {
        setReferralStatus('Error validating code');
        setReferralValid(false);
      }
    }
    validate();
    return () => { cancelled = true; };
  }, [referralCode, currentUser]);
  
  if (!isOpen) return null;
  
  const handlePayPalClick = async () => {
    setLoading(true);
    setError('');
    try {
      // Pass referral code to PayPal payment
      await onPayWithPaypal(referralCode);
    } catch (err) {
      setError(err.message || 'PayPal payment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCryptoClick = async () => {
    setLoading(true);
    setError('');
    try {
      const functions = getFunctions();
      const createCryptoCharge = httpsCallable(functions, 'createCryptoCharge');
      const redirectUrl = window.location.origin + '/wallet?crypto=success';
      const cancelUrl = window.location.origin + '/wallet?crypto=cancel';
      
      // Get device ID and user IP for anti-abuse and referral tracking
      const deviceId = getDeviceId();
      const userIp = await getUserIp();
      
      const result = await createCryptoCharge({
        amount: selectedPackage.price,
        packageId: `${selectedPackage.coins}_coins`,
        redirectUrl,
        cancelUrl,
        referralCode: referralCode || null,
        deviceId,
        userIp
      });
      if (result.data && result.data.success && result.data.hostedUrl) {
        window.location.href = result.data.hostedUrl;
      } else {
        setError('Failed to create crypto payment. Please try again.');
      }
    } catch (err) {
      setError('Failed to start crypto payment: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalCloseButton onClick={onClose}>&times;</ModalCloseButton>
        <Title>Payment Methods</Title>
        
        {selectedPackage && (
          <PackageInfo>
            <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
              {selectedPackage.coins + selectedPackage.bonus} Coins
            </div>
            <div style={{ fontSize: '1.5rem', color: '#4facfe', fontWeight: 'bold' }}>
              ${selectedPackage.price.toFixed(2)}
            </div>
          </PackageInfo>
        )}

        {/* Referral Code Input */}
        <div style={{ marginBottom: 16, border: '2px solid #4facfe', padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(79, 172, 254, 0.1)' }}>
          <div style={{ color: '#4facfe', marginBottom: '8px', fontWeight: 'bold' }}>
             Enter Creator Code (Optional)
          </div>
          <input
            value={referralCode}
            onChange={e => setReferralCode(e.target.value.toUpperCase())}
            placeholder="Enter Creator Code"
            style={{ 
              width: '100%', 
              padding: '8px 12px', 
              borderRadius: 6, 
              border: '1px solid #4facfe', 
              fontSize: 16,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              color: '#000'
            }}
            maxLength={16}
          />
          <div style={{ 
            color: referralValid ? '#51cf66' : '#ff6b6b', 
            minHeight: 20, 
            fontSize: 14, 
            marginTop: '4px',
            fontWeight: '500'
          }}>
            {referralStatus}
          </div>
        </div>
        
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', marginBottom: '1rem' }}>
            <Button 
              style={{
                background: activePaymentMethod === 'paypal' ? '#ffc439' : 'rgba(255,255,255,0.1)',
                color: activePaymentMethod === 'paypal' ? '#003087' : '#fff',
                borderRadius: '10px 0 0 10px',
                margin: 0
              }}
              onClick={() => setActivePaymentMethod('paypal')}
              disabled={loading || !selectedPackage}
            >
              PayPal
            </Button>
            <Button 
              style={{
                background: activePaymentMethod === 'card' ? '#006aff' : 'rgba(255,255,255,0.1)',
                color: '#fff',
                borderRadius: '0',
                margin: 0
              }}
              onClick={() => setActivePaymentMethod('card')}
              disabled={loading || !selectedPackage}
            >
              Credit Card
            </Button>
            <Button
              style={{
                background: activePaymentMethod === 'crypto' ? 'linear-gradient(90deg, #A259F7 0%, #00FFD0 100%)' : 'rgba(255,255,255,0.1)',
                color: activePaymentMethod === 'crypto' ? '#18122B' : '#fff',
                borderRadius: '0 10px 10px 0',
                margin: 0,
                fontWeight: 800
              }}
              onClick={() => setActivePaymentMethod('crypto')}
              disabled={loading || !selectedPackage}
            >
              Crypto
            </Button>
          </div>
          
          {activePaymentMethod === 'paypal' ? (
            <PayPalButton 
              onClick={handlePayPalClick} 
              disabled={loading || !selectedPackage}
            >
              {loading ? 'Processing...' : 'Pay with PayPal'}
            </PayPalButton>
          ) : activePaymentMethod === 'card' ? (
            <SquarePayment 
              onPaymentSuccess={(response) => {
                if (response.success) {
                  // Handle successful payment
                  console.log('Square payment successful:', response);
                  setSuccess(`Payment successful! Added ${response.coinsAdded} coins to your balance.`);
                  refreshBalance(); // Refresh the user's balance
                  
                  // After 3 seconds, close the modal
                  setTimeout(() => {
                    onClose();
                  }, 3000);
                }
              }}
              amount={selectedPackage ? selectedPackage.price : 0}
              packageId={selectedPackage ? `${selectedPackage.coins}_coins` : ''}
              isDisabled={loading || !selectedPackage || !!success}
              referralCode={referralCode}
            />
          ) : (
            <Button
              style={{
                background: 'linear-gradient(90deg, #A259F7 0%, #00FFD0 100%)',
                color: '#18122B',
                fontWeight: 800
              }}
              onClick={handleCryptoClick}
              disabled={loading || !selectedPackage}
            >
              {loading ? 'Processing...' : 'Pay with Crypto'}
            </Button>
          )}
        </div>
        
        {error && (
          <div style={{ color: '#ff6b6b', marginTop: '0.5rem', marginBottom: '1rem', textAlign: 'center' }}>
            {error}
          </div>
        )}
        
        {success && (
          <div style={{ color: '#51cf66', marginTop: '0.5rem', marginBottom: '1rem', textAlign: 'center' }}>
            {success}
          </div>
        )}
        
        
        <CloseButton onClick={onClose}>
          Close
        </CloseButton>
      </ModalContent>
    </ModalOverlay>
  );
};

export default PaymentMethodModal;