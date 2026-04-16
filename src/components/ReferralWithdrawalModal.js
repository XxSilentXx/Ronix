import React, { useState, useEffect } from 'react';
import { FaTimes, FaDollarSign, FaGift, FaPercentage, FaExclamationTriangle } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { functions } from '../firebase/config';
import { httpsCallable } from 'firebase/functions';
import { FEE_CONFIG, getWithdrawalFee, canWithdraw } from '../utils/feeUtils';
import './ReferralWithdrawalModal.css';

const ReferralWithdrawalModal = ({ isOpen, onClose, referralStats }) => {
  const { currentUser } = useAuth();
  const [withdrawalMethod, setWithdrawalMethod] = useState('paypal');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [cashappTag, setCashappTag] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Calculate total withdrawable amount from referrals
  const totalEarnings = referralStats?.totalEarnings || 0;
  const totalCommission = referralStats?.totalCommission || 0;
  const totalWithdrawable = totalEarnings + totalCommission;

  // Set default withdrawal amount when modal opens
  useEffect(() => {
    if (isOpen && totalWithdrawable > 0) {
      setWithdrawalAmount(totalWithdrawable.toFixed(2));
    }
  }, [isOpen, totalWithdrawable]);

  if (!isOpen) return null;

  const withdrawalAmountNumber = Number(withdrawalAmount) || 0;
  const isValidWithdrawalAmount = withdrawalAmountNumber > 0 && 
                                withdrawalAmountNumber <= totalWithdrawable && 
                                withdrawalAmountNumber >= FEE_CONFIG.minWithdrawalTokens;
  const userCanWithdraw = canWithdraw(totalWithdrawable) && isValidWithdrawalAmount;

  // Calculate USD amount (1 token = $1)
  const usdAmount = withdrawalAmountNumber.toFixed(2);

  // Calculate fee and amount after fee
  const { fee, amountAfterFee, feePercent } = getWithdrawalFee(withdrawalAmountNumber);
  const feeInUsd = fee.toFixed(2);
  const amountAfterFeeInUsd = amountAfterFee.toFixed(2);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

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
      setError(`You need at least ${FEE_CONFIG.minWithdrawalTokens} coins from referral earnings to withdraw.`);
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
        fromReferrals: true,
        earnedFromWagers: false
      });

      if (result.data && result.data.success) {
        setSuccess('Referral withdrawal request submitted! Admins will review and process your payout.');
      } else {
        setError('Failed to submit withdrawal request.');
      }
    } catch (err) {
      setError(err.message || 'Error submitting withdrawal request.');
    }
    setIsLoading(false);
  };

  const handleClose = () => {
    setError('');
    setSuccess('');
    setWithdrawalAmount('');
    setPaypalEmail('');
    setCashappTag('');
    onClose();
  };

  return (
    <div className="referral-withdrawal-modal-overlay" onClick={handleClose}>
      <div className="referral-withdrawal-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <FaDollarSign className="header-icon" />
            Withdraw Referral Earnings
          </h2>
          <button className="close-btn" onClick={handleClose}>
            <FaTimes />
          </button>
        </div>

        <div className="earnings-breakdown">
          <h3>Your Referral Earnings</h3>
          <div className="breakdown-grid">
            <div className="breakdown-item">
              <FaGift className="breakdown-icon" />
              <div className="breakdown-content">
                <span className="breakdown-label">Referral Bonuses</span>
                <span className="breakdown-amount">${totalEarnings.toFixed(2)}</span>
                <span className="breakdown-description">$1 bonus per referred user</span>
              </div>
            </div>
            <div className="breakdown-item">
              <FaPercentage className="breakdown-icon" />
              <div className="breakdown-content">
                <span className="breakdown-label">Commission Earnings</span>
                <span className="breakdown-amount">${totalCommission.toFixed(2)}</span>
                <span className="breakdown-description">10% commission for 30 days</span>
              </div>
            </div>
            <div className="breakdown-total">
              <span className="total-label">Total Withdrawable</span>
              <span className="total-amount">${totalWithdrawable.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {!userCanWithdraw && (
          <div className="warning-message">
            <FaExclamationTriangle />
            <span>
              {totalWithdrawable < FEE_CONFIG.minWithdrawalTokens
                ? `You need at least $${FEE_CONFIG.minWithdrawalTokens} in referral earnings to withdraw.`
                : 'Insufficient referral earnings for withdrawal.'
              }
            </span>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {userCanWithdraw && !success && (
          <form onSubmit={handleSubmit} className="withdrawal-form">
            <div className="form-group">
              <label>Withdrawal Amount</label>
              <input
                type="number"
                min={FEE_CONFIG.minWithdrawalTokens}
                max={totalWithdrawable}
                step="0.01"
                value={withdrawalAmount}
                onChange={e => {
                  const value = e.target.value;
                  if (Number(value) > totalWithdrawable) {
                    setWithdrawalAmount(totalWithdrawable.toFixed(2));
                  } else {
                    setWithdrawalAmount(value);
                  }
                }}
                placeholder={`Enter amount (min: $${FEE_CONFIG.minWithdrawalTokens}, max: $${totalWithdrawable.toFixed(2)})`}
                required
                disabled={isLoading}
              />
            </div>

            {withdrawalAmountNumber > 0 && (
              <div className="fee-breakdown">
                <div className="fee-row">
                  <span>Withdrawal Amount:</span>
                  <span>${usdAmount}</span>
                </div>
                <div className="fee-row">
                  <span>Service Fee ({(feePercent * 100).toFixed(0)}%):</span>
                  <span>-${feeInUsd}</span>
                </div>
                <div className="fee-row total">
                  <span>You'll Receive:</span>
                  <span>${amountAfterFeeInUsd}</span>
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Withdrawal Method</label>
              <div className="method-options">
                <label className="method-option">
                  <input
                    type="radio"
                    name="withdrawalMethod"
                    value="paypal"
                    checked={withdrawalMethod === 'paypal'}
                    onChange={() => setWithdrawalMethod('paypal')}
                    disabled={isLoading}
                  />
                  <span>PayPal</span>
                </label>
                <label className="method-option">
                  <input
                    type="radio"
                    name="withdrawalMethod"
                    value="cashapp"
                    checked={withdrawalMethod === 'cashapp'}
                    onChange={() => setWithdrawalMethod('cashapp')}
                    disabled={isLoading}
                  />
                  <span>CashApp</span>
                </label>
              </div>
            </div>

            {withdrawalMethod === 'paypal' && (
              <div className="form-group">
                <label>PayPal Email</label>
                <input
                  type="email"
                  value={paypalEmail}
                  onChange={e => setPaypalEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  disabled={isLoading}
                />
              </div>
            )}

            {withdrawalMethod === 'cashapp' && (
              <div className="form-group">
                <label>CashApp $Cashtag</label>
                <input
                  type="text"
                  value={cashappTag}
                  onChange={e => setCashappTag(e.target.value)}
                  placeholder="$yourcashtag"
                  required
                  disabled={isLoading}
                />
              </div>
            )}

            <button
              type="submit"
              className="submit-btn"
              disabled={!isValidWithdrawalAmount || isLoading}
            >
              {isLoading ? 'Submitting...' : 'Request Withdrawal'}
            </button>
          </form>
        )}

        <div className="withdrawal-info">
          <h4>Important Information</h4>
          <ul>
            <li>Minimum withdrawal amount is ${FEE_CONFIG.minWithdrawalTokens}</li>
            <li>A {(FEE_CONFIG.withdrawal * 100).toFixed(0)}% service fee applies to all withdrawals</li>
            <li>Withdrawals are processed manually by our team within 24-48 hours</li>
            <li>Only earnings from referrals can be withdrawn</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReferralWithdrawalModal; 