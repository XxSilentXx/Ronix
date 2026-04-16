import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useTokens } from '../contexts/TokenContext';
import { useAuth } from '../contexts/AuthContext';
import PaymentMethodModal from './PaymentMethodModal';
import { getDeviceId, getUserIp } from '../utils/device';
import CoinSVG from '../assets/icons/gold-dollar-coin-18550.svg';

const Container = styled.div`
  background: rgba(0, 0, 0, 0.2);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
`;

const Title = styled.h2`
  color: #fff;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Subtitle = styled.h3`
  color: #4facfe;
  margin-bottom: 1rem;
  font-size: 1.2rem;
`;

const PackagesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const Package = styled.div`
  background: ${props => props.selected ? 'rgba(32,34,54,0.98)' : 'rgba(32,34,54,0.85)'};
  border: 2.5px solid ${props => props.selected ? '#A259F7' : props.best ? '#00FFD0' : 'rgba(255,255,255,0.13)'};
  box-shadow: ${props => props.selected ? '0 0 24px #A259F7, 0 0 8px #00FFD0' : props.best ? '0 0 16px #00FFD0' : 'none'};
  border-radius: 14px;
  padding: 2.3rem 1.2rem 1.3rem 1.2rem;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  &:hover {
    transform: translateY(-4px) scale(1.03);
    border-color: #A259F7;
    box-shadow: 0 0 32px #A259F7, 0 0 16px #00FFD0;
  }
`;

const CoinAmount = styled.div`
  font-size: 1.6rem;
  font-weight: 900;
  margin-bottom: 0.5rem;
  color: #fff;
  text-shadow: 0 2px 8px #A259F7;
`;

const Price = styled.div`
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
  color: #00FFD0;
  font-weight: 800;
  text-shadow: 0 2px 8px #00FFD044;
`;

const TotalLine = styled.div`
  color: #ff61e6;
  font-weight: 800;
  font-size: 1.1rem;
  margin-bottom: 0.2rem;
`;

const BonusTag = styled.div`
  background: #ff6b6b;
  color: white;
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 5px;
  font-size: 0.8rem;
  margin-top: 0.5rem;
  font-weight: bold;
`;

const EffectivePrice = styled.div`
  color: #aaa;
  font-size: 0.9rem;
  margin-top: 0.5rem;
`;

const MostPopularBadge = styled.div`
  position: absolute;
  top: 8px;
  right: 16px;
  background: linear-gradient(90deg, #A259F7 0%, #00FFD0 100%);
  color: #18122B;
  font-size: 0.85rem;
  font-weight: 800;
  padding: 0.3rem 1.1rem;
  border-radius: 1rem;
  box-shadow: 0 0 12px #A259F7, 0 0 8px #00FFD0;
  letter-spacing: 0.04em;
  z-index: 2;
`;

const DynamicSavingsPanel = styled.div`
  background: linear-gradient(90deg, #A259F7 0%, #00FFD0 100%);
  color: #18122B;
  font-weight: 700;
  font-size: 1.1rem;
  border-radius: 1.2rem;
  padding: 1.1rem 2rem;
  margin: 1.5rem 0 1rem 0;
  text-align: center;
  box-shadow: 0 0 24px #A259F7, 0 0 8px #00FFD0;
`;

const PurchaseButton = styled.button`
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  width: 100%;
  transition: all 0.2s ease;
  
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

// Payment steps
const PAYMENT_STEPS = {
  SELECT_PACKAGE: 'select_package',
};

// Coin packages
const COIN_PACKAGES = [
  { coins: 5, bonus: 0, price: 4.75, effectivePrice: 0.95 },
  { coins: 10, bonus: 1, price: 9.00, effectivePrice: 0.82 },
  { coins: 25, bonus: 3, price: 22.00, effectivePrice: 0.78 },
  { coins: 50, bonus: 7, price: 42.00, effectivePrice: 0.74 },
  { coins: 100, bonus: 15, price: 80.00, effectivePrice: 0.70 }
];

const CoinStore = () => {
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const { currentUser } = useAuth();
  const [paypalLoading, setPaypalLoading] = useState(false);
  const [paypalError, setPaypalError] = useState('');
  
  const handlePackageSelect = (pkg) => {
    setSelectedPackage(pkg);
    setError('');
  };
  
  const handlePurchaseClick = () => {
    if (!selectedPackage) {
      setError('Please select a coin package');
      return;
    }
    
    // Open payment method modal
    setIsPaymentModalOpen(true);
    setPaypalError('');
  };
  
  const handlePayWithPaypal = async (referralCode = '') => {
    setPaypalLoading(true);
    setPaypalError('');
    try {
      const returnUrl = `${window.location.origin}/coins?paypal=success`;
      const cancelUrl = `${window.location.origin}/coins?paypal=cancel`;
      
      // Get device and IP for anti-abuse
      const deviceId = getDeviceId();
      const userIp = await getUserIp();
      
      const body = {
        amount: selectedPackage.price,
        currency: 'USD',
        packageId: `${selectedPackage.coins}_coins`, // Always send correct packageId
        returnUrl,
        cancelUrl,
        referralCode: referralCode || undefined,
        deviceId,
        userIp
      };
      // Require authentication
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        setPaypalError('You must be logged in to pay with PayPal.');
        setPaypalLoading(false);
        return;
      }
      const idToken = await user.getIdToken();
      const response = await fetch('https://us-central1-tokensite-6eef3.cloudfunctions.net/createPaypalOrder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-requested-with': 'XMLHttpRequest',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(body)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create PayPal order');
      }
      const data = await response.json();
      window.location.href = data.approvalUrl;
    } catch (err) {
      setPaypalError(err.message || 'PayPal payment failed');
    } finally {
      setPaypalLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('paypal') === 'success' && params.get('token')) {
      setPaypalLoading(true);
      setPaypalError('');
      const orderID = params.get('token');

      const clearPaypalParams = () => {
        params.delete('paypal');
        params.delete('token');
        window.history.replaceState({}, document.title, window.location.pathname + (params.toString() ? '?' + params.toString() : ''));
      };

      const fetchCapture = async () => {
        try {
          const { getAuth } = await import('firebase/auth');
          const auth = getAuth();
          const user = auth.currentUser;
          if (!user) {
            setPaypalError('You must be logged in to complete PayPal payment.');
            setPaypalLoading(false);
            clearPaypalParams();
            return;
          }
          const idToken = await user.getIdToken();
          const response = await fetch('https://us-central1-tokensite-6eef3.cloudfunctions.net/capturePaypalPayment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({ orderID })
          });
          const data = await response.json();
          if (data.success) {
            setSuccess('PayPal payment successful! Coins will be credited soon.');
          } else {
            setPaypalError('PayPal payment capture failed.');
          }
        } catch (err) {
          setPaypalError('PayPal payment capture failed.');
        } finally {
          setPaypalLoading(false);
          clearPaypalParams();
        }
      };
      fetchCapture();
    }
  }, []);
  
  return (
    <Container>
      <Title>
        <img src="/assets/token-logo.png" alt="Token Logo" style={{ width: 24, height: 24, verticalAlign: 'middle' }} onError={e => { e.target.onerror = null; e.target.style.display = 'none'; e.target.parentNode.append(''); }} /> Coin Store
      </Title>
      
      <Subtitle>Select a Coin Package</Subtitle>
      
      <PackagesGrid>
        {COIN_PACKAGES.map((pkg, index) => {
          const isBest = pkg.coins === 100;
          return (
          <Package 
            key={index}
            selected={selectedPackage === pkg}
              best={isBest}
            onClick={() => handlePackageSelect(pkg)}
          >
              {isBest && <MostPopularBadge>Most popular</MostPopularBadge>}
            <CoinAmount>{pkg.coins} Coins</CoinAmount>
            {pkg.bonus > 0 && (
              <BonusTag>+{pkg.bonus} BONUS</BonusTag>
            )}
            <Price>${pkg.price.toFixed(2)}</Price>
            {pkg.bonus > 0 && (
                <TotalLine>Total: {pkg.coins + pkg.bonus} Coins</TotalLine>
            )}
            <EffectivePrice>${pkg.effectivePrice.toFixed(2)}/coin</EffectivePrice>
          </Package>
          );
        })}
      </PackagesGrid>
      
      {selectedPackage && (
        <DynamicSavingsPanel>
          {selectedPackage.bonus > 0
            ? `You're getting +${selectedPackage.bonus} bonus coins — that's ${Math.round((selectedPackage.bonus / selectedPackage.coins) * 100)}% extra!`
            : 'No bonus for this package.'}
        </DynamicSavingsPanel>
      )}
      
      {error && <div style={{ color: '#ff6b6b', marginBottom: '1rem' }}>{error}</div>}
      {success && <div style={{ color: '#51cf66', marginBottom: '1rem' }}>{success}</div>}
      
      <PurchaseButton 
        disabled={!selectedPackage || loading}
        onClick={handlePurchaseClick}
      >
        {loading ? 'Processing...' : selectedPackage 
          ? `Purchase ${selectedPackage.coins + selectedPackage.bonus} Coins for $${selectedPackage.price.toFixed(2)}`
          : 'Select a Package'
        }
      </PurchaseButton>
      
      {paypalError && <div style={{ color: '#ff6b6b', marginTop: 8 }}>{paypalError}</div>}
      
      <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#aaa', textAlign: 'center' }}>
        All purchases are final.
      </div>
      
      <PaymentMethodModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        selectedPackage={selectedPackage}
        onPayWithPaypal={handlePayWithPaypal}
      />
    </Container>
  );
};

export default CoinStore; 