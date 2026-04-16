import React, { useState, useEffect } from 'react';
import { useReferral } from '../contexts/ReferralContext';
import { useAuth } from '../contexts/AuthContext';
import ReferralCodeCustomizer from './ReferralCodeCustomizer';
import ReferralWithdrawalModal from './ReferralWithdrawalModal';
import LoadingIndicator from './LoadingIndicator';
import './ReferralDashboard.css';

// Import icons (you may need to install react-icons if not already installed)
import { 
  FaGift, 
  FaCopy, 
  FaTwitter, 
  FaFacebook, 
  FaDiscord, 
  FaEnvelope,
  FaUsers,
  FaDollarSign,
  FaChartLine,
  FaExclamationTriangle,
  FaSync,
  FaCog,
  FaInfoCircle,
  FaCheck
} from 'react-icons/fa';

const ReferralDashboard = () => {
  const { currentUser } = useAuth();
  const {
    referralStats,
    loading,
    error,
    shareReferralLink,
    initializeReferralSystem,
    fixReferralCodeCustomization,
    refreshReferralStats,
    setError
  } = useReferral();

  const [showCustomizer, setShowCustomizer] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [sharingMethod, setSharingMethod] = useState('');
  const [initializing, setInitializing] = useState(false);

  // Clear messages after 3 seconds
  useEffect(() => {
    if (shareMessage) {
      const timer = setTimeout(() => {
        setShareMessage('');
        setSharingMethod('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [shareMessage]);

  const handleShare = async (method) => {
    setSharingMethod(method);
    try {
      const result = await shareReferralLink(method);
      setShareMessage(result.message);
    } catch (error) {
      console.error('Error sharing:', error);
      setShareMessage('Failed to share referral link');
    }
  };

  const handleInitializeSystem = async () => {
    setInitializing(true);
    try {
      await initializeReferralSystem();
      setShareMessage('Referral system initialized successfully!');
    } catch (error) {
      console.error('Error initializing:', error);
      setShareMessage('Failed to initialize referral system');
    } finally {
      setInitializing(false);
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshReferralStats();
      setShareMessage('Stats refreshed successfully!');
    } catch (error) {
      console.error('Error refreshing:', error);
      setShareMessage('Failed to refresh stats');
    }
  };

  const handleFixCustomization = async () => {
    try {
      const result = await fixReferralCodeCustomization();
      setShareMessage(result.message || 'Referral code customization fixed!');
    } catch (error) {
      console.error('Error fixing customization:', error);
      setShareMessage('Failed to fix customization');
    }
  };

  const clearError = () => {
    setError(null);
  };

  if (!currentUser) {
    return (
      <div className="referral-dashboard">
        <div className="referral-card">
          <h2>Please log in to view your referral dashboard</h2>
        </div>
      </div>
    );
  }

  if (loading && !referralStats) {
    return (
      <div className="referral-dashboard">
        <LoadingIndicator message="Loading referral dashboard..." />
      </div>
    );
  }

  return (
    <div className="referral-dashboard">
      {/* Referral System Header */}
      <div className="referral-system-header">
        <div className="header-content">
          <h1>Referral System</h1>
          <p>Earn money by inviting friends to join Ronix.gg!</p>
        </div>
        {referralStats?.referralCodeCustomizable && (
          <button 
            className="customize-code-btn"
            onClick={() => setShowCustomizer(true)}
          >
             Customize Code
          </button>
        )}
      </div>

      {/* Main Dashboard Header */}
      <div className="referral-header">
        <div className="header-content">
          <h1>Referral Dashboard</h1>
          <p>Earn money by inviting friends to join Ronix.gg!</p>
        </div>
        <div className="header-buttons">
          {referralStats && (referralStats.totalEarnings + referralStats.totalCommission) >= 5 && (
            <button 
              className="withdraw-btn"
              onClick={() => setShowWithdrawalModal(true)}
              title="Withdraw Referral Earnings"
            >
               Withdraw
            </button>
          )}
          <button 
            className="refresh-btn"
            onClick={handleRefresh}
            disabled={loading}
            title="Refresh Stats"
          >
             Refresh
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-banner">
          <FaExclamationTriangle />
          <span>{error}</span>
          {error.includes('can only be changed once') && (
            <button 
              className="fix-btn"
              onClick={handleFixCustomization}
              title="Try to fix this issue"
            >
               Fix
            </button>
          )}
          <button onClick={clearError} className="error-close">×</button>
        </div>
      )}

      {/* Share Message */}
      {shareMessage && (
        <div className={`share-message ${shareMessage.includes('Failed') ? 'error' : 'success'}`}>
          {shareMessage}
        </div>
      )}

      {/* No Stats Available */}
      {!loading && !referralStats && (
        <div className="referral-card error-card">
          <FaExclamationTriangle className="warning-icon" />
          <h3>Welcome to the Referral System!</h3>
          <p>As an existing user, you need to get your referral code. Click below to receive a random pre-made code that you can customize once to something memorable.</p>
          <button 
            className="initialize-btn"
            onClick={handleInitializeSystem}
            disabled={initializing}
          >
            {initializing ? 'Creating Your Code...' : 'Get My Referral Code'}
          </button>
        </div>
      )}

      {/* Main Dashboard Content */}
      {referralStats && (
        <>
          {/* Stats Overview */}
          <div className="stats-grid">
            <div className="stat-card earnings">
              <div className="stat-header">
                <FaDollarSign className="stat-icon" />
                <h3>TOTAL EARNINGS</h3>
              </div>
              <div className="stat-value">
                ${(referralStats.totalEarnings + referralStats.totalCommission).toFixed(2)}
              </div>
              <div className="stat-breakdown">
                Bonuses: ${referralStats.totalEarnings.toFixed(2)}<br/>
                Commission: ${referralStats.totalCommission.toFixed(2)}
              </div>
            </div>

            <div className="stat-card referrals">
              <div className="stat-header">
                <FaUsers className="stat-icon" />
                <h3>TOTAL REFERRALS</h3>
              </div>
              <div className="stat-value">{referralStats.referralCount}</div>
              <div className="stat-subtitle">People you've referred</div>
            </div>

            <div className="stat-card active-rewards">
              <div className="stat-header">
                <FaGift className="stat-icon" />
                <h3>ACTIVE REWARDS</h3>
              </div>
              <div className="stat-value">{referralStats.activeRewards || 0}</div>
              <div className="stat-subtitle">Pending commission tracking</div>
            </div>

            <div className="stat-card completed">
              <div className="stat-header">
                <FaCheck className="stat-icon" />
                <h3>COMPLETED</h3>
              </div>
              <div className="stat-value">{referralStats.completedCycles || 0}</div>
              <div className="stat-subtitle">Finished reward cycles</div>
            </div>
          </div>

          {/* Referral Code Section */}
          <div className="referral-card">
            <div className="section-header">
              <h3>Your Referral Code</h3>
              {referralStats.referralCodeCustomizable && (
                <span className="customizable-badge">Customizable</span>
              )}
            </div>
            
            <div className="referral-code-section">
              <div className="code-row">
                <div className="code-display">{referralStats.referralCode}</div>
                <button 
                  className="copy-btn"
                  onClick={() => handleShare('copy')}
                  disabled={sharingMethod === 'copy'}
                >
                   {sharingMethod === 'copy' ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
              
              <div className="link-row">
                <div className="link-display">
                  https://ronix.gg/?ref={referralStats.referralCode}
                </div>
                <button 
                  className="copy-btn"
                  onClick={() => handleShare('copy')}
                  disabled={sharingMethod === 'copy'}
                >
                   Copy Link
                </button>
              </div>
            </div>

            {!referralStats.referralCodeCustomizable && (
              <div className="customization-notice">
                <FaInfoCircle />
                <small>You have already customized your referral code once.</small>
              </div>
            )}
          </div>

          {/* Sharing Section */}
          <div className="referral-card">
            <h3>Share Your Referral Link</h3>
            
            <div className="share-buttons">
              <button 
                className={`share-btn copy-link ${sharingMethod === 'copy' ? 'sharing' : ''}`}
                onClick={() => handleShare('copy')}
                disabled={sharingMethod === 'copy'}
              >
                 Copy Link
              </button>
              
              <button 
                className={`share-btn twitter ${sharingMethod === 'twitter' ? 'sharing' : ''}`}
                onClick={() => handleShare('twitter')}
                disabled={sharingMethod === 'twitter'}
              >
                 Twitter
              </button>
              
              <button 
                className={`share-btn facebook ${sharingMethod === 'facebook' ? 'sharing' : ''}`}
                onClick={() => handleShare('facebook')}
                disabled={sharingMethod === 'facebook'}
              >
                 Facebook
              </button>
              
              <button 
                className={`share-btn discord ${sharingMethod === 'discord' ? 'sharing' : ''}`}
                onClick={() => handleShare('discord')}
                disabled={sharingMethod === 'discord'}
              >
                 Discord
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          {referralStats.recentReferrals && referralStats.recentReferrals.length > 0 && (
            <div className="referral-card">
              <h3>Recent Referrals</h3>
              <div className="recent-referrals">
                {referralStats.recentReferrals.map((referral, index) => (
                  <div key={index} className="referral-item">
                    <div className="referral-info">
                      <span className="referral-user">User {referral.referredUid.slice(-6)}</span>
                      <span className="referral-code">{referral.referralCode}</span>
                    </div>
                    <div className="referral-date">
                      {referral.usedAt?.toDate ? 
                        referral.usedAt.toDate().toLocaleDateString() : 
                        new Date(referral.usedAt).toLocaleDateString()
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* How It Works */}
          <div className="referral-card info-card">
            <h3>How Referrals Work</h3>
            <div className="info-steps">
              <div className="step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>Share Your Link</h4>
                  <p>Send your referral link to friends and on social media</p>
                </div>
              </div>
              
              <div className="step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>Friend Signs Up</h4>
                  <p>When someone uses your link to join, you both get $1 bonus</p>
                </div>
              </div>
              
              <div className="step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>Earn Commission</h4>
                  <p>Get 10% commission on their purchases for 30 days</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Referral Code Customizer Modal */}
      {showCustomizer && (
        <ReferralCodeCustomizer 
          onClose={() => setShowCustomizer(false)}
          currentCode={referralStats?.referralCode}
        />
      )}

      {/* Referral Withdrawal Modal */}
      {showWithdrawalModal && (
        <ReferralWithdrawalModal
          isOpen={showWithdrawalModal}
          onClose={() => setShowWithdrawalModal(false)}
          referralStats={referralStats}
        />
      )}
    </div>
  );
};

export default ReferralDashboard; 