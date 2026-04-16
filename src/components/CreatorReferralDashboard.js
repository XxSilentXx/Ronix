import React, { useState, useEffect } from 'react';
import { useReferral } from '../contexts/ReferralContext';
import { useAuth } from '../contexts/AuthContext';
import ReferralDashboard from './ReferralDashboard';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';
import { 
  FaCrown, 
  FaChartLine, 
  FaMoneyBillWave, 
  FaUsers, 
  FaCopy,
  FaDownload,
  FaExternalLinkAlt,
  FaCalendarAlt,
  FaSync,
  FaStar,
  FaTrophy
} from 'react-icons/fa';
import './CreatorReferralDashboard.css';

const CreatorReferralDashboard = () => {
  const { currentUser } = useAuth();
  const { referralStats, generateReferralLink, shareReferralLink } = useReferral();
  
  const [creatorStats, setCreatorStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shareMessage, setShareMessage] = useState('');
  const [customLinks, setCustomLinks] = useState([]);

  useEffect(() => {
    if (currentUser) {
      fetchCreatorStats();
    }
  }, [currentUser]);

  // Clear messages after 3 seconds
  useEffect(() => {
    if (shareMessage) {
      const timer = setTimeout(() => setShareMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [shareMessage]);

  const fetchCreatorStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const getCreatorStatsFunction = httpsCallable(functions, 'getCreatorReferralDashboard');
      const result = await getCreatorStatsFunction();
      
      setCreatorStats(result.data);
      console.log('Fetched creator stats:', result.data);
    } catch (error) {
      console.error('Error fetching creator stats:', error);
      setError(error.message || 'Failed to fetch creator statistics');
    } finally {
      setLoading(false);
    }
  };

  const generateCustomLink = async (platform, campaign = '') => {
    try {
      const baseLink = await generateReferralLink();
      const customLink = `${baseLink}&utm_source=${platform}&utm_campaign=${campaign || 'creator_share'}`;
      
      await navigator.clipboard.writeText(customLink);
      setShareMessage(`${platform} link copied to clipboard!`);
      
      // Add to custom links tracking
      const newLink = {
        platform,
        campaign,
        link: customLink,
        createdAt: new Date()
      };
      setCustomLinks(prev => [newLink, ...prev.slice(0, 9)]); // Keep last 10
      
      return customLink;
    } catch (error) {
      console.error('Error generating custom link:', error);
      setShareMessage('Failed to generate custom link');
    }
  };

  const downloadReferralKit = async () => {
    try {
      const referralLink = await generateReferralLink();
      const code = referralStats?.referralCode || 'YOUR_CODE';
      
      // Create downloadable content
      const content = `
# Referral Kit - ${currentUser.displayName || 'Creator'}

## Your Referral Information
- **Referral Code:** ${code}
- **Referral Link:** ${referralLink}

## Social Media Templates

### Twitter
 Join me on this awesome gaming platform and earn tokens! 
Use my referral code: ${code}
${referralLink}

### Discord
Hey gamers! 
I'm playing on this amazing platform where you can earn real tokens by competing!
Use my referral link to get started: ${referralLink}

### YouTube Description
Check out this gaming platform where I compete and earn tokens! 
Join using my referral link: ${referralLink}
Use code: ${code}

### Instagram/TikTok
Gaming + earning tokens = 
Join me: ${referralLink}
Code: ${code}

## Benefits for Your Audience
- Earn $1 bonus on first purchase
- 10% commission goes to you for 30 days
- Join a growing gaming community
- Compete in wagers and tournaments

## Analytics Links
- Platform Specific: ${referralLink}&utm_source=PLATFORM&utm_campaign=CAMPAIGN_NAME
- Replace PLATFORM and CAMPAIGN_NAME with your specific values

Generated on: ${new Date().toLocaleDateString()}
      `;
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `referral-kit-${code}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setShareMessage('Referral kit downloaded successfully!');
    } catch (error) {
      console.error('Error downloading referral kit:', error);
      setShareMessage('Failed to download referral kit');
    }
  };

  if (!currentUser) {
    return (
      <div className="creator-dashboard">
        <div className="creator-card">
          <h2>Please log in to view your creator dashboard</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="creator-dashboard">
      {/* Creator Header */}
      <div className="creator-header">
        <div className="creator-title">
          <FaCrown className="crown-icon" />
          <h1>Creator Referral Dashboard</h1>
          <div className="creator-badge">PRO</div>
        </div>
        <p>Advanced tools and analytics for content creators</p>
      </div>

      {/* Share Message */}
      {shareMessage && (
        <div className={`share-message ${shareMessage.includes('Failed') ? 'error' : 'success'}`}>
          {shareMessage}
        </div>
      )}

      {/* Creator-Specific Stats */}
      {creatorStats && (
        <div className="creator-stats-grid">
          <div className="creator-stat-card earnings">
            <div className="stat-header">
              <FaMoneyBillWave className="stat-icon" />
              <h3>Monthly Earnings</h3>
            </div>
            <div className="stat-value">${creatorStats.monthlyEarnings?.toFixed(2) || '0.00'}</div>
            <div className="stat-change positive">
              +{creatorStats.monthlyGrowth || 0}% from last month
            </div>
          </div>

          <div className="creator-stat-card conversions">
            <div className="stat-header">
              <FaChartLine className="stat-icon" />
              <h3>Conversion Rate</h3>
            </div>
            <div className="stat-value">{creatorStats.conversionRate?.toFixed(1) || '0.0'}%</div>
            <div className="stat-detail">
              {creatorStats.totalClicks || 0} clicks, {creatorStats.conversions || 0} conversions
            </div>
          </div>

          <div className="creator-stat-card performance">
            <div className="stat-header">
              <FaTrophy className="stat-icon" />
              <h3>Performance Rank</h3>
            </div>
            <div className="stat-value">#{creatorStats.rank || 'N/A'}</div>
            <div className="stat-detail">
              Top {creatorStats.percentile || 0}% of creators
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="creator-card">
        <h3>Quick Actions</h3>
        <div className="quick-actions">
          <button 
            className="action-btn primary"
            onClick={() => generateCustomLink('youtube', 'video_description')}
          >
            <FaCopy /> Copy YouTube Link
          </button>
          
          <button 
            className="action-btn secondary"
            onClick={() => generateCustomLink('twitch', 'stream_overlay')}
          >
            <FaCopy /> Copy Twitch Link
          </button>
          
          <button 
            className="action-btn secondary"
            onClick={() => generateCustomLink('discord', 'server_share')}
          >
            <FaCopy /> Copy Discord Link
          </button>
          
          <button 
            className="action-btn accent"
            onClick={downloadReferralKit}
          >
            <FaDownload /> Download Referral Kit
          </button>
        </div>
      </div>

      {/* Platform-Specific Links */}
      <div className="creator-card">
        <h3>Platform-Specific Links</h3>
        <div className="platform-links">
          <div className="platform-section">
            <h4>Social Media</h4>
            <div className="platform-buttons">
              <button onClick={() => generateCustomLink('twitter', 'post')}>
                Twitter Post
              </button>
              <button onClick={() => generateCustomLink('instagram', 'story')}>
                Instagram Story
              </button>
              <button onClick={() => generateCustomLink('tiktok', 'video')}>
                TikTok Bio
              </button>
            </div>
          </div>
          
          <div className="platform-section">
            <h4>Streaming</h4>
            <div className="platform-buttons">
              <button onClick={() => generateCustomLink('twitch', 'overlay')}>
                Twitch Overlay
              </button>
              <button onClick={() => generateCustomLink('youtube', 'live')}>
                YouTube Live
              </button>
              <button onClick={() => generateCustomLink('kick', 'stream')}>
                Kick Stream
              </button>
            </div>
          </div>
          
          <div className="platform-section">
            <h4>Community</h4>
            <div className="platform-buttons">
              <button onClick={() => generateCustomLink('discord', 'announcement')}>
                Discord Server
              </button>
              <button onClick={() => generateCustomLink('reddit', 'post')}>
                Reddit Post
              </button>
              <button onClick={() => generateCustomLink('website', 'blog')}>
                Website/Blog
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Custom Links */}
      {customLinks.length > 0 && (
        <div className="creator-card">
          <h3>Recent Custom Links</h3>
          <div className="recent-links">
            {customLinks.slice(0, 5).map((link, index) => (
              <div key={index} className="link-item">
                <div className="link-info">
                  <span className="platform-name">{link.platform}</span>
                  <span className="campaign-name">{link.campaign}</span>
                </div>
                <div className="link-actions">
                  <span className="link-date">
                    {link.createdAt.toLocaleDateString()}
                  </span>
                  <button 
                    className="copy-link-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(link.link);
                      setShareMessage('Link copied!');
                    }}
                  >
                    <FaCopy />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Overview */}
      {creatorStats && (
        <div className="creator-card">
          <div className="section-header">
            <h3>Analytics Overview</h3>
            <button 
              className="refresh-btn"
              onClick={fetchCreatorStats}
              disabled={loading}
            >
              <FaSync className={loading ? 'spinning' : ''} />
            </button>
          </div>
          
          <div className="analytics-grid">
            <div className="analytics-item">
              <FaUsers className="analytics-icon" />
              <div className="analytics-content">
                <span className="analytics-label">Total Referrals</span>
                <span className="analytics-value">{creatorStats.totalReferrals || 0}</span>
              </div>
            </div>
            
            <div className="analytics-item">
              <FaChartLine className="analytics-icon" />
              <div className="analytics-content">
                <span className="analytics-label">Click-through Rate</span>
                <span className="analytics-value">{creatorStats.ctr?.toFixed(1) || '0.0'}%</span>
              </div>
            </div>
            
            <div className="analytics-item">
              <FaMoneyBillWave className="analytics-icon" />
              <div className="analytics-content">
                <span className="analytics-label">Avg. Revenue per User</span>
                <span className="analytics-value">${creatorStats.arpu?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
            
            <div className="analytics-item">
              <FaCalendarAlt className="analytics-icon" />
              <div className="analytics-content">
                <span className="analytics-label">Days Active</span>
                <span className="analytics-value">{creatorStats.daysActive || 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Regular Referral Dashboard */}
      <div className="regular-dashboard-section">
        <ReferralDashboard />
      </div>
    </div>
  );
};

export default CreatorReferralDashboard; 