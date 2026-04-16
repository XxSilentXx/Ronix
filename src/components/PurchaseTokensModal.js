import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { useTokens } from '../contexts/TokenContext';
import StripePaymentForm from './StripePaymentForm';
import { useStripe, useElements } from '@stripe/react-stripe-js';
import Confetti from 'react-confetti';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { getDeviceId, getUserIp } from '../utils/device';
import { getFunctions, httpsCallable } from 'firebase/functions';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.7s cubic-bezier(.25,1.7,.45,.87);
`;

const ModalContent = styled.div`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 15px;
  width: 90%;
  max-width: 500px;
  padding: 2rem;
  color: #fff;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  position: relative;
  overflow: hidden;
  background-image: url('https://fortnite-api.com/images/cosmetics/br/character_default.png');
  background-repeat: no-repeat;
  background-position: right bottom;
  background-size: 120px auto;
  animation: bounce 0.8s cubic-bezier(.25,1.7,.45,.87);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 5px;
    background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: #fff;
  font-size: 1.5rem;
  cursor: pointer;
  
  &:hover {
    color: #4facfe;
  }
`;

const Title = styled.h2`
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  color: #fff;
  text-align: center;
`;

const TokenPackagesContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const TokenPackage = styled.div`
  background: ${props => props.selected ? 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 10px;
  padding: 1rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid ${props => props.selected ? '#fff' : 'transparent'};
  box-shadow: ${props => props.selected ? '0 0 15px rgba(79, 172, 254, 0.7)' : 'none'};
  transform: ${props => props.selected ? 'translateY(-3px)' : 'none'};
  
  &:hover {
    transform: translateY(-5px);
    background: ${props => props.selected ? 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)' : 'rgba(255, 255, 255, 0.15)'};
    border-color: ${props => props.selected ? '#fff' : '#4facfe'};
  }
`;

const TokenAmount = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
`;

const TokenPrice = styled.div`
  font-size: 1rem;
  color: #ccc;
`;

const PaymentMethodsContainer = styled.div`
  margin-bottom: 2rem;
`;

const PaymentMethodTitle = styled.h3`
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: #fff;
`;

const PaymentMethods = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
`;

const PaymentMethod = styled.div`
  background: ${props => props.selected ? 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 10px;
  padding: 0.8rem 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid ${props => props.selected ? '#fff' : 'transparent'};
  box-shadow: ${props => props.selected ? '0 0 15px rgba(79, 172, 254, 0.7)' : 'none'};
  transform: ${props => props.selected ? 'scale(1.05)' : 'none'};
  
  img {
    width: 24px;
    height: 24px;
  }
  
  &:hover {
    background: ${props => props.selected ? 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)' : 'rgba(255, 255, 255, 0.15)'};
    border-color: ${props => props.selected ? '#fff' : '#4facfe'};
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 1rem;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(.25,1.7,.45,.87), box-shadow 0.2s cubic-bezier(.25,1.7,.45,.87);
  box-shadow: 0 0 12px #4facfe55;
  border: 2px solid transparent;
  &:hover {
    transform: translateY(-2px) scale(1.04);
    box-shadow: 0 0 32px #ff61e6cc, 0 0 64px #00f2fe99;
    border: 2px solid #ff61e6;
    background: linear-gradient(90deg, #ff61e6 0%, #4facfe 100%);
  }
  &:active {
    transform: scale(0.97);
    box-shadow: 0 0 8px #4facfe99;
  }
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const ErrorMessage = styled.div`
  color: #ff6b6b;
  margin-bottom: 1rem;
  text-align: center;
`;

const SuccessMessage = styled.div`
  color: #51cf66;
  margin-bottom: 1rem;
  text-align: center;
`;

const CurrentBalance = styled.div`
  text-align: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  
  span {
    color: #4facfe;
    font-weight: bold;
  }
`;

const PAYPAL_CLIENT_ID = "Adl4Va-3mS227GWzkMiqqJKYjos2yqJOcIg48opW-qSmqgdZ92aNl406kGh3zSuKVNeDsFWtYqig3Rp4";
// Set to true if using sandbox credentials, false for production
const PAYPAL_SANDBOX_MODE = false;

const PurchaseTokensModal = ({ isOpen, onClose }) => {
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [currentPackageDetails, setCurrentPackageDetails] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [referralStatus, setReferralStatus] = useState('');
  const [referralValid, setReferralValid] = useState(false);
  
  const { currentUser, isAuthenticated } = useAuth();
  const { balance, addTokens } = useTokens();

  
  const tokenPackages = [
    { id: 1, amount: 100, price: 1.00 },
    { id: 2, amount: 500, price: 4.50 },
    { id: 3, amount: 1000, price: 8 },
    { id: 4, amount: 2500, price: 18 },
    { id: 5, amount: 5000, price: 35 },
    { id: 6, amount: 10000, price: 65 }
  ];
  
  const paymentMethods = [
    { id: 'card', name: 'Credit Card', icon: 'https://cdn-icons-png.flaticon.com/512/196/196578.png' },
    { id: 'paypal', name: 'PayPal', icon: 'https://cdn-icons-png.flaticon.com/512/174/174861.png' },
    { id: 'crypto', name: 'Crypto', icon: 'https://cdn-icons-png.flaticon.com/512/5968/5968260.png' }
  ];
  
  const handlePackageSelect = (packageId) => {
    console.log('Package selected:', packageId);
    setSelectedPackage(packageId);
    setError('');
  };
  
  const handlePaymentMethodSelect = (methodId) => {
    console.log('Payment method selected:', methodId);
    setSelectedPaymentMethod(methodId);
    setError('');
  };
  
  const handleTokenPurchase = (packageSelected) => {
    // Instead of immediately going to payment form, just select the package
    console.log('Token package clicked:', packageSelected);
    handlePackageSelect(packageSelected.id);
  };
  
  const handlePurchase = async () => {
    if (!selectedPackage) {
      setError('Please select a token package');
      return;
    }
    
    if (!selectedPaymentMethod) {
      setError('Please select a payment method');
      return;
    }
    
    if (referralCode && !referralValid) {
      setError('Please enter a valid referral code or leave blank.');
      return;
    }
    
    setError('');
    console.log('Starting purchase with package:', selectedPackage, 'and method:', selectedPaymentMethod);
    
    // Get the selected package
    const purchasedPackage = tokenPackages.find(pkg => pkg.id === selectedPackage);
    
    if (!purchasedPackage) {
      console.error('Package not found:', selectedPackage);
      setError('Selected package not found. Please try again.');
      return;
    }
    
    console.log('Found package:', purchasedPackage);
    
    // Process based on payment method
    if (selectedPaymentMethod === 'card') {
      // For credit card payments, show the Stripe payment form
      setCurrentPackageDetails({
        tokenAmount: purchasedPackage.amount,
        price: purchasedPackage.price,
        id: purchasedPackage.id
      });
      setShowPaymentForm(true);
    } else if (selectedPaymentMethod === 'paypal') {
      setIsLoading(true);
      try {
        const deviceId = getDeviceId();
        const userIp = await getUserIp();
        await fetch('/createPaypalOrder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${currentUser?.accessToken || ''}` },
          body: JSON.stringify({
            packageId: purchasedPackage.id,
            referralCode: referralCode || undefined,
            deviceId,
            userIp
          })
        });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Add tokens to user's balance
        const success = await addTokens(
          purchasedPackage.amount, 
          'paypal', 
          purchasedPackage.price
        );
        
        if (success) {
          setSuccess(`Successfully purchased ${purchasedPackage.amount} tokens with PayPal!`);
          
          // Reset selections after successful purchase
          setTimeout(() => {
            setSelectedPackage(null);
            setSelectedPaymentMethod(null);
            setSuccess('');
            onClose();
          }, 2000);
        } else {
          setError('PayPal transaction failed. Please try again.');
        }
      } catch (error) {
        console.error('PayPal error:', error);
        setError('Failed to process PayPal payment. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else if (selectedPaymentMethod === 'crypto') {
      setIsLoading(true);
      try {
        const functions = getFunctions();
        const createCryptoCharge = httpsCallable(functions, 'createCryptoCharge');
        // Set redirect and cancel URLs (adjust as needed for your deployment)
        const redirectUrl = window.location.origin + '/wallet?crypto=success';
        const cancelUrl = window.location.origin + '/wallet?crypto=cancel';
        
        // Get device ID and user IP for anti-abuse and referral tracking
        const deviceId = getDeviceId();
        const userIp = await getUserIp();
        
        const result = await createCryptoCharge({
          amount: purchasedPackage.price,
          packageId: purchasedPackage.id,
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
      } catch (error) {
        setError('Failed to start crypto payment: ' + (error.message || 'Unknown error'));
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handlePaymentSuccess = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2500);
    setSuccess('Payment successful! Tokens added to your account.');
    setTimeout(() => {
      setSuccess('');
      onClose();
    }, 2500);
  };
  
  const handlePaymentCancel = () => {
    // Return to package selection
    setShowPaymentForm(false);
    setCurrentPackageDetails(null);
  };
  
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
  
  // Moved to the beginning of the return statement
  
  if (!isOpen) return null;
  
  return (
    <ModalOverlay onClick={showPaymentForm ? null : onClose}>
      <ModalContent onClick={e => e.stopPropagation()} className="fade-in bounce">
        {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} numberOfPieces={120} recycle={false} />}
        {!showPaymentForm ? (
          <>
            <CloseButton onClick={onClose}>&times;</CloseButton>
            <Title>Purchase Tokens</Title>
            
            <CurrentBalance>
              Current Balance: <span>{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })} Tokens</span>
            </CurrentBalance>
            
            {/* Referral Code Input */}
            <div style={{ marginBottom: 16 }}>
              <input
                value={referralCode}
                onChange={e => setReferralCode(e.target.value.toUpperCase())}
                placeholder="Enter Creator Code (optional)"
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #4facfe', fontSize: 16 }}
                maxLength={16}
              />
              <div style={{ color: referralValid ? '#51cf66' : '#ff6b6b', minHeight: 24, fontSize: 14 }}>{referralStatus}</div>
            </div>
            
            {error && <ErrorMessage>{error}</ErrorMessage>}
            {success && <SuccessMessage>{success}</SuccessMessage>}
            
            <TokenPackagesContainer>
              {tokenPackages.map(pkg => (
                <TokenPackage 
                  key={pkg.id}
                  selected={selectedPackage === pkg.id}
                  onClick={() => handleTokenPurchase(pkg)}
                >
                  <TokenAmount>{pkg.amount}</TokenAmount>
                  <TokenPrice>${pkg.price.toFixed(2)}</TokenPrice>
                </TokenPackage>
              ))}
            </TokenPackagesContainer>
            
            <PaymentMethodsContainer>
              <PaymentMethodTitle>Payment Method</PaymentMethodTitle>
              <PaymentMethods>
                {paymentMethods.map(method => (
                  <PaymentMethod
                    key={method.id}
                    selected={selectedPaymentMethod === method.id}
                    onClick={() => handlePaymentMethodSelect(method.id)}
                  >
                    <img src={method.icon} alt={method.name} />
                    {method.name}
                  </PaymentMethod>
                ))}
              </PaymentMethods>
            </PaymentMethodsContainer>
            {/* PayPal Button Integration */}
            {selectedPaymentMethod === 'paypal' && selectedPackage && (
              <PayPalScriptProvider options={{ 
                "client-id": PAYPAL_CLIENT_ID, 
                currency: "USD",
                intent: "capture",
                // Add sandbox mode if using test credentials
                ...(PAYPAL_SANDBOX_MODE && { "enable-funding": "paylater", "disable-funding": "card", environment: "sandbox" })
              }}>
                <div style={{ marginBottom: '1rem' }}>
                  <PayPalButtons
                    style={{ layout: 'vertical', color: 'blue', shape: 'pill', label: 'paypal' }}
                    forceReRender={[selectedPackage]}
                    createOrder={(data, actions) => {
                      const purchasedPackage = tokenPackages.find(pkg => pkg.id === selectedPackage);
                      console.log("Creating PayPal order for package:", purchasedPackage);
                      return actions.order.create({
                        intent: "CAPTURE",
                        purchase_units: [
                          {
                            amount: {
                              value: purchasedPackage ? purchasedPackage.price.toFixed(2) : '0.00',
                            },
                            description: `${purchasedPackage ? purchasedPackage.amount : ''} Fortnite Tokens`,
                          },
                        ],
                      });
                    }}
                    onApprove={async (data, actions) => {
                      setIsLoading(true);
                      try {
                        console.log("Payment approved, attempting to capture...");
                        console.log("Order ID:", data.orderID);
                        
                        let orderData;
                        try {
                          // In sandbox mode, the capture might fail but we can still proceed with verification
                          orderData = await actions.order.capture();
                          console.log("Capture successful:", orderData);
                        } catch (captureError) {
                          console.error("Capture failed:", captureError);
                          if (captureError && captureError.response) {
                            console.error("Capture error response:", captureError.response);
                          }
                          // For sandbox testing or if capture fails but we have the orderID, proceed to verification
                        }
                        
                        // Skip verification in sandbox mode during development - tokens will be added regardless
                        let verificationSuccess = PAYPAL_SANDBOX_MODE;
                        
                        // Only attempt verification if not overridden by sandbox mode
                        if (!PAYPAL_SANDBOX_MODE) {
                          try {
                            // Direct call to the cloud function
                            console.log("Verifying payment with order ID:", data.orderID);
                            const response = await fetch('https://verifypaypalpaymentv2-whf4c4y7pa-uc.a.run.app', {
                              method: 'POST',
                              mode: 'cors',
                              credentials: 'omit',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ orderID: data.orderID }),
                            });
                            
                            if (!response.ok) {
                              const errorText = await response.text();
                              console.error("Verification response not ok:", response.status, errorText);
                              // If we're in testing/development, proceed anyway
                              if (PAYPAL_SANDBOX_MODE) {
                                console.log("Bypassing verification failure in sandbox mode");
                                verificationSuccess = true;
                              } else {
                                throw new Error(`Verification failed with status ${response.status}`);
                              }
                            } else {
                              const result = await response.json();
                              console.log("Verification result:", result);
                              verificationSuccess = result.success;
                            }
                          } catch (verifyError) {
                            console.error('PayPal verification error (direct):', verifyError);
                            if (verifyError && verifyError.response) {
                              console.error('Verification error response:', verifyError.response);
                            }
                            // If direct verification fails and we're in sandbox, proceed anyway
                            if (PAYPAL_SANDBOX_MODE) {
                              console.log('Using sandbox override for verification');
                              verificationSuccess = true;
                            }
                            // If we have orderData with approved status and not in sandbox, use it for verification
                            else if (orderData && (orderData.status === 'COMPLETED' || orderData.status === 'APPROVED')) {
                              console.log('Using PayPal capture response as verification');
                              verificationSuccess = true;
                            }
                          }
                        } else {
                          console.log('Skipping verification in sandbox mode');
                        }
                        
                        if (verificationSuccess) {
                          const purchasedPackage = tokenPackages.find(pkg => pkg.id === selectedPackage);
                          const success = await addTokens(
                            purchasedPackage.amount,
                            'paypal',
                            purchasedPackage.price
                          );
                          if (success) {
                            setSuccess(`Successfully purchased ${purchasedPackage.amount} tokens with PayPal!`);
                            setShowConfetti(true);
                            setTimeout(() => {
                              setSelectedPackage(null);
                              setSelectedPaymentMethod(null);
                              setSuccess('');
                              setShowConfetti(false);
                              onClose();
                            }, 2000);
                          } else {
                            setError('Could not add tokens to your account. Please contact support.');
                          }
                        } else {
                          setError('PayPal payment not completed or could not be verified. Please contact support if you were charged.');
                        }
                      } catch (error) {
                        console.error('Complete PayPal error:', error);
                        if (error && error.response) {
                          console.error('PayPal error response:', error.response);
                        }
                        setError('Failed to process PayPal payment. Please try again.');
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    onError={(err) => {
                      setError('PayPal payment error. Please try again.');
                    }}
                    onCancel={() => {
                      setError('PayPal payment cancelled.');
                    }}
                  />
                </div>
              </PayPalScriptProvider>
            )}
            {/* Only show the submit button if not PayPal or if PayPal is not selected */}
            {(!selectedPaymentMethod || selectedPaymentMethod !== 'paypal') && (
              <SubmitButton 
                onClick={handlePurchase}
                disabled={isLoading || !selectedPackage || !selectedPaymentMethod}
              >
                {isLoading ? 'Processing...' : 'Purchase Tokens'}
              </SubmitButton>
            )}
          </>
        ) : (
          <>
            <CloseButton onClick={handlePaymentCancel}>&times;</CloseButton>
            <Title>Complete Your Purchase</Title>
            
            <CurrentBalance>
              Purchasing: <span>{currentPackageDetails?.tokenAmount} Tokens</span>
            </CurrentBalance>
            
            <StripePaymentForm 
              amount={currentPackageDetails?.price * 100} // Stripe uses cents
              packageDetails={currentPackageDetails}
              onSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
            />
          </>
        )}
      </ModalContent>
    </ModalOverlay>
  );
};

export default PurchaseTokensModal;
