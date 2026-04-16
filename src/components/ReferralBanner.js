import React, { useState, useEffect } from 'react';
import { useReferral } from '../contexts/ReferralContext';
import { useAuth } from '../contexts/AuthContext';
import { FaGift, FaTimes, FaUserFriends, FaDollarSign } from 'react-icons/fa';
import './ReferralBanner.css';

const ReferralBanner = ({ sidebarCollapsed = false }) => {
  const { currentUser } = useAuth();
  const { 
    detectedReferralCode, 
    validateReferralCode, 
    clearDetectedReferralCode,
    processingReferral 
  } = useReferral();
  
  const [referrerInfo, setReferrerInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState(null);

  // Check if banner should be shown
  const shouldShow = detectedReferralCode && !dismissed && !currentUser;

  // Validate and get referrer info when code is detected
  useEffect(() => {
    if (detectedReferralCode && !referrerInfo && shouldShow) {
      validateAndGetReferrerInfo();
    }
  }, [detectedReferralCode, shouldShow]);

  // Auto-dismiss after user logs in and referral is processed
  useEffect(() => {
    if (currentUser && !processingReferral && detectedReferralCode) {
      // Give a small delay to allow processing, then dismiss
      const timer = setTimeout(() => {
        setDismissed(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentUser, processingReferral, detectedReferralCode]);

  const validateAndGetReferrerInfo = async () => {
    setLoading(true);
    setError(null);

    try {
      const validation = await validateReferralCode(detectedReferralCode);
      if (validation.valid) {
        setReferrerInfo({
          displayName: validation.referrerDisplayName,
          uid: validation.referrerUid
        });
      } else {
        setError('Invalid referral code');
        // Auto-dismiss if code is invalid
        setTimeout(() => {
          handleDismiss();
        }, 3000);
      }
    } catch (error) {
      console.error('Error validating referral code:', error);
      setError('Unable to validate referral code');
      // Don't auto-dismiss on error, user might want to try again
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    clearDetectedReferralCode();
  };

  // Don't render if conditions aren't met
  if (!shouldShow) {
    return null;
  }

  return (
    <div className={`referral-banner ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="banner-content">
        <div className="banner-icon">
          <FaGift />
        </div>
        
        <div className="banner-info">
          {loading ? (
            <div className="banner-loading">
              <h3>Validating referral code...</h3>
              <p>Please wait while we verify your referral.</p>
            </div>
          ) : error ? (
            <div className="banner-error">
              <h3>Referral Code Issue</h3>
              <p>{error}</p>
            </div>
          ) : referrerInfo ? (
            <div className="banner-success">
              <h3>
                <FaUserFriends className="inline-icon" />
                You've been invited by {referrerInfo.displayName}!
              </h3>
              <p className="referral-benefits">
                <FaDollarSign className="inline-icon" />
                Sign up now and both of you will earn rewards when you make your first purchase!
              </p>
              <div className="referral-details">
                <span className="referral-code-display">Code: {detectedReferralCode}</span>
              </div>
            </div>
          ) : (
            <div className="banner-default">
              <h3>Welcome! You're using a referral code</h3>
              <p>Sign up to earn rewards with code: <strong>{detectedReferralCode}</strong></p>
            </div>
          )}
        </div>

        <button 
          className="dismiss-btn" 
          onClick={handleDismiss}
          title="Dismiss"
        >
          <FaTimes />
        </button>
      </div>

      {!error && !loading && (
        <div className="banner-features">
          <div className="feature">
            <FaGift className="feature-icon" />
            <span>Earn bonus tokens on your first purchase</span>
          </div>
          <div className="feature">
            <FaDollarSign className="feature-icon" />
            <span>Your referrer earns rewards too</span>
          </div>
          <div className="feature">
            <FaUserFriends className="feature-icon" />
            <span>Join a growing gaming community</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralBanner; 