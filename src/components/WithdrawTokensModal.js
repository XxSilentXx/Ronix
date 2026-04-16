import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { FEE_CONFIG, getWithdrawalFee, canWithdraw } from '../utils/feeUtils';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex; justify-content: center; align-items: center;
  z-index: 1000;
`;
const ModalContent = styled.div`
  background: #1a1a2e;
  border-radius: 15px;
  width: 90%; max-width: 400px;
  padding: 2rem;
  color: #fff;
  position: relative;
`;
const CloseButton = styled.button`
  position: absolute; top: 1rem; right: 1rem;
  background: none; border: none; color: #fff; font-size: 1.5rem; cursor: pointer;
`;
const Title = styled.h2`
  text-align: center; margin-bottom: 1.5rem;
`;
const Label = styled.label`
  display: block; margin-bottom: 0.5rem; color: #4facfe;
`;
const Input = styled.input`
  width: 100%; padding: 0.75rem; border-radius: 8px; border: none; margin-bottom: 1rem;
`;
const SubmitButton = styled.button`
  width: 100%; background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  color: #fff; border: none; border-radius: 10px; padding: 1rem; font-size: 1rem; font-weight: bold; cursor: pointer;
  margin-top: 1rem;
  &:disabled { background: #888; cursor: not-allowed; }
`;
const ErrorMessage = styled.div`
  color: #ff6b6b; margin-bottom: 1rem; text-align: center;
`;
const SuccessMessage = styled.div`
  color: #51cf66; margin-bottom: 1rem; text-align: center;
`;
const FeeDetails = styled.div`
  margin: 1rem 0;
  background: rgba(0,0,0,0.2);
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.9rem;
`;
const FeeRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;
const Divider = styled.hr`
  border: 0;
  border-top: 1px solid rgba(255,255,255,0.2);
  margin: 0.5rem 0;
`;

const TOKEN_TO_USD = 1.0; // 1 coin = $1.00

const WithdrawTokensModal = ({ isOpen, onClose, balance }) => {
  const [withdrawalMethod, setWithdrawalMethod] = useState('paypal');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [cashappTag, setCashappTag] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [wagerEarnings, setWagerEarnings] = useState(0);
  const [purchasedCoins, setPurchasedCoins] = useState(0);
  const [withdrawableAmount, setWithdrawableAmount] = useState(0);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [userDataLoading, setUserDataLoading] = useState(true);
  const { currentUser } = useAuth();
  const functions = getFunctions();
  const db = getFirestore();

  // Fetch user's wagering earnings and purchased coins
  useEffect(() => {
    if (!isOpen || !currentUser) return;

    const fetchUserData = async () => {
      setUserDataLoading(true);
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          // Get wager earnings - if not available, default to 0
          const earnings = userData.wagerEarnings || 0;
          // Get purchased coins - if not available, default to 0
          const purchased = userData.purchasedTokens || 0;
          
          setWagerEarnings(earnings);
          setPurchasedCoins(purchased);
          
          // Withdrawable amount is the minimum of total balance and wager earnings
          const withdrawable = Math.min(balance, earnings);
          setWithdrawableAmount(withdrawable);
          // Set default withdrawal amount to the max withdrawable
          setWithdrawalAmount(withdrawable.toString());
        } else {
          setWagerEarnings(0);
          setPurchasedCoins(0);
          setWithdrawableAmount(0);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Could not retrieve your withdrawable balance');
      } finally {
        setUserDataLoading(false);
      }
    };

    fetchUserData();
  }, [isOpen, currentUser, balance, db]);

  if (!isOpen) return null;

  // Parse the withdrawal amount input to a number
  const withdrawalAmountNumber = Number(withdrawalAmount) || 0;
  
  // User can withdraw if they have enough wager earnings that meet the minimum threshold 
  // and the withdrawal amount is valid
  const isValidWithdrawalAmount = withdrawalAmountNumber > 0 && 
                                withdrawalAmountNumber <= withdrawableAmount && 
                                withdrawalAmountNumber >= FEE_CONFIG.minWithdrawalTokens;
  const userCanWithdraw = !userDataLoading && canWithdraw(withdrawableAmount) && isValidWithdrawalAmount;
  
  // Calculate USD amount based on user's input or max withdrawable amount
  const usdAmount = (withdrawalAmountNumber * TOKEN_TO_USD).toFixed(2);
  
  // Calculate fee and amount after fee based on the withdrawal amount
  const { fee, amountAfterFee, feePercent } = getWithdrawalFee(withdrawalAmountNumber);
  const feeInUsd = (fee * TOKEN_TO_USD).toFixed(2);
  const amountAfterFeeInUsd = (amountAfterFee * TOKEN_TO_USD).toFixed(2);
  
  // Calculate minimum fee in USD
  const minFeeUsd = FEE_CONFIG.minWithdrawalFee.toFixed(2);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    let identifier = '';
    if (withdrawalMethod === 'paypal') {
      if (!paypalEmail || !paypalEmail.includes('@')) {
        setError('Please enter a valid PayPal email.');
        return;
      }
      identifier = paypalEmail;
    } else if (withdrawalMethod === 'cashapp') {
      if (!cashappTag || !cashappTag.startsWith('$') || cashappTag.length < 3) {
        setError('Please enter a valid CashApp $cashtag (e.g. $yourtag).');
        return;
      }
      identifier = cashappTag;
    }
    if (!userCanWithdraw) {
      setError(`You need at least ${FEE_CONFIG.minWithdrawalTokens} coins earned from wagers to withdraw.`);
      return;
    }
    setIsLoading(true);
    try {
      const createWithdrawal = httpsCallable(functions, 'createWithdrawalRequest');
      const result = await createWithdrawal({
        amountTokens: withdrawalAmountNumber,
        amountUSD: Number(usdAmount),
        amountAfterFee: amountAfterFee,
        fee: fee,
        withdrawalMethod,
        identifier,
        earnedFromWagers: true
      });
      if (result.data && result.data.success) {
        setSuccess('Withdrawal request submitted! Admins will review and process your payout.');
      } else {
        setError('Failed to submit withdrawal request.');
      }
    } catch (err) {
      setError(err.message || 'Error submitting withdrawal request.');
    }
    setIsLoading(false);
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        <Title>Withdraw Tokens</Title>
        <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
          <div>Your Balance: <b>{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</b> coins (${(balance * TOKEN_TO_USD).toFixed(2)})</div>
          <div>Wager Earnings: <b>{wagerEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</b> coins (${(wagerEarnings * TOKEN_TO_USD).toFixed(2)})</div>
          <div>Purchased Coins: <b>{purchasedCoins.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</b> coins (${(purchasedCoins * TOKEN_TO_USD).toFixed(2)})</div>
          <div style={{ fontWeight: 'bold', marginTop: 8 }}>Withdrawable Balance: <b>{withdrawableAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</b> coins (${usdAmount})</div>
          <div style={{ color: userCanWithdraw ? '#51cf66' : '#ff6b6b', marginTop: 4 }}>
            {userCanWithdraw 
              ? 'Eligible to withdraw' 
              : userDataLoading
                ? 'Loading your withdrawable balance...'
                : withdrawableAmount > 0 && withdrawableAmount < FEE_CONFIG.minWithdrawalTokens
                  ? `You need at least ${FEE_CONFIG.minWithdrawalTokens} coins from wager earnings to withdraw.`
                  : withdrawableAmount === 0
                    ? 'Only coins earned from wagers can be withdrawn. Play some wagers to earn withdrawable coins!'
                    : `You need at least ${FEE_CONFIG.minWithdrawalTokens} coins from wager earnings to withdraw.`
            }
          </div>
        </div>
        
        {userCanWithdraw && (
          <FeeDetails>
            <FeeRow>
              <span>Withdrawal Amount:</span>
              <span>{withdrawalAmountNumber} coins (${usdAmount})</span>
            </FeeRow>
            <FeeRow>
              <span>Service Fee ({(feePercent * 100).toFixed(0)}%):</span>
              <span>-{fee} coins (-${feeInUsd})</span>
            </FeeRow>
            <div style={{ fontSize: '0.8rem', color: '#aaa', margin: '0.25rem 0' }}>
              Minimum fee: ${minFeeUsd}
            </div>
            <Divider />
            <FeeRow style={{ fontWeight: 'bold' }}>
              <span>You'll Receive:</span>
              <span>{amountAfterFee} coins (${amountAfterFeeInUsd})</span>
            </FeeRow>
          </FeeDetails>
        )}
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}
        <form onSubmit={handleSubmit}>
          <Label htmlFor="withdrawalAmount">Withdrawal Amount (in coins)</Label>
          <Input
            id="withdrawalAmount"
            type="number"
            min={FEE_CONFIG.minWithdrawalTokens}
            max={withdrawableAmount}
            value={withdrawalAmount}
            onChange={e => {
              const value = e.target.value;
              if (Number(value) > withdrawableAmount) {
                setWithdrawalAmount(withdrawableAmount.toString());
              } else {
                setWithdrawalAmount(value);
              }
            }}
            placeholder={`Enter amount (min: ${FEE_CONFIG.minWithdrawalTokens}, max: ${withdrawableAmount})`}
            required
            disabled={isLoading || !!success || withdrawableAmount < FEE_CONFIG.minWithdrawalTokens}
          />

          <Label>Withdrawal Method</Label>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <label>
              <input
                type="radio"
                name="withdrawalMethod"
                value="paypal"
                checked={withdrawalMethod === 'paypal'}
                onChange={() => setWithdrawalMethod('paypal')}
                disabled={isLoading || !!success}
              />
              PayPal
            </label>
            <label>
              <input
                type="radio"
                name="withdrawalMethod"
                value="cashapp"
                checked={withdrawalMethod === 'cashapp'}
                onChange={() => setWithdrawalMethod('cashapp')}
                disabled={isLoading || !!success}
              />
              CashApp
            </label>
          </div>

          {withdrawalMethod === 'paypal' && (
            <>
              <Label htmlFor="paypalEmail">PayPal Email</Label>
              <Input
                id="paypalEmail"
                type="email"
                value={paypalEmail}
                onChange={e => setPaypalEmail(e.target.value)}
                placeholder="your@email.com"
                required={withdrawalMethod === 'paypal'}
                disabled={isLoading || !!success}
              />
            </>
          )}
          {withdrawalMethod === 'cashapp' && (
            <>
              <Label htmlFor="cashappTag">CashApp $Cashtag</Label>
              <Input
                id="cashappTag"
                type="text"
                value={cashappTag}
                onChange={e => setCashappTag(e.target.value)}
                placeholder="$yourcashtag"
                required={withdrawalMethod === 'cashapp'}
                disabled={isLoading || !!success}
              />
            </>
          )}

          <SubmitButton
            type="submit"
            disabled={!userCanWithdraw || isLoading || !!success || !isValidWithdrawalAmount}
          >
            {isLoading ? 'Submitting...' : 'Request Withdrawal'}
          </SubmitButton>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default WithdrawTokensModal; 