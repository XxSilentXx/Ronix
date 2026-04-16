import React, { createContext, useContext, useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';
import { useAuth } from './AuthContext';

const ReferralContext = createContext();

export const useReferral = () => {
  const context = useContext(ReferralContext);
  if (!context) {
    throw new Error('useReferral must be used within a ReferralProvider');
  }
  return context;
};

export const ReferralProvider = ({ children }) => {
  const { currentUser, loading: authLoading } = useAuth();
  const [detectedReferralCode, setDetectedReferralCode] = useState(null);
  const [referralStats, setReferralStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processingReferral, setProcessingReferral] = useState(false);

  // Auto-detect referral codes from URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      const cleanCode = refCode.toUpperCase().trim();
      setDetectedReferralCode(cleanCode);
      console.log('Detected referral code from URL:', cleanCode);
      
      // Store in sessionStorage to persist across navigation
      sessionStorage.setItem('detectedReferralCode', cleanCode);
    } else {
      // Check if we have a stored referral code
      const storedCode = sessionStorage.getItem('detectedReferralCode');
      if (storedCode) {
        setDetectedReferralCode(storedCode);
        console.log('Retrieved stored referral code:', storedCode);
      }
    }
  }, []);

  // Process referral code when user logs in and we have a detected code
  useEffect(() => {
    if (currentUser && detectedReferralCode && !processingReferral) {
      processReferralOnSignup();
    }
  }, [currentUser, detectedReferralCode, processingReferral]);

  // Fetch referral stats when user is available
  useEffect(() => {
    if (currentUser && !authLoading) {
      fetchReferralStats();
    }
  }, [currentUser, authLoading]);

  /**
   * Process referral code on user signup/login
   */
  const processReferralOnSignup = async () => {
    if (!detectedReferralCode || !currentUser || processingReferral) {
      return;
    }

    setProcessingReferral(true);
    setError(null);

    try {
      console.log('Processing referral code on signup:', detectedReferralCode);
      
      const handleReferralFunction = httpsCallable(functions, 'handleReferralCodeUsage');
      const result = await handleReferralFunction({ 
        referralCode: detectedReferralCode 
      });

      console.log('Referral code processed successfully:', result.data);
      
      // Clear the detected code since it's been processed
      setDetectedReferralCode(null);
      sessionStorage.removeItem('detectedReferralCode');
      
      // Refresh referral stats
      await fetchReferralStats();
      
      return result.data;
    } catch (error) {
      console.error('Error processing referral code:', error);
      
      // Don't show error for common cases like "already referred"
      if (!error.message.includes('already been referred') && 
          !error.message.includes('own referral code')) {
        setError(error.message || 'Failed to process referral code');
      }
      
      // Clear the detected code even on error to prevent retries
      setDetectedReferralCode(null);
      sessionStorage.removeItem('detectedReferralCode');
    } finally {
      setProcessingReferral(false);
    }
  };

  /**
   * Fetch user's referral statistics
   */
  const fetchReferralStats = async () => {
    if (!currentUser) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const getReferralStatsFunction = httpsCallable(functions, 'getReferralStats');
      const result = await getReferralStatsFunction();
      
      setReferralStats(result.data);
      console.log('Fetched referral stats:', result.data);
    } catch (error) {
      console.error('Error fetching referral stats:', error);
      setError(error.message || 'Failed to fetch referral statistics');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Set custom referral code (one-time only)
   */
  const setCustomReferralCode = async (newCode) => {
    if (!currentUser) {
      throw new Error('User must be authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const setCustomCodeFunction = httpsCallable(functions, 'setCustomReferralCode');
      const result = await setCustomCodeFunction({ code: newCode });
      
      console.log('Custom referral code set successfully:', result.data);
      
      // Refresh stats to get updated code
      await fetchReferralStats();
      
      return result.data;
    } catch (error) {
      console.error('Error setting custom referral code:', error);
      const errorMessage = error.message || 'Failed to set custom referral code';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate referral link
   */
  const generateReferralLink = async () => {
    if (!currentUser) {
      throw new Error('User must be authenticated');
    }

    try {
      const generateLinkFunction = httpsCallable(functions, 'generateReferralLink');
      const result = await generateLinkFunction();
      
      return result.data.referralLink;
    } catch (error) {
      console.error('Error generating referral link:', error);
      throw new Error(error.message || 'Failed to generate referral link');
    }
  };

  /**
   * Validate a referral code
   */
  const validateReferralCode = async (code) => {
    try {
      const validateCodeFunction = httpsCallable(functions, 'validateNewReferralCode');
      const result = await validateCodeFunction({ code });
      
      return result.data;
    } catch (error) {
      console.error('Error validating referral code:', error);
      throw new Error(error.message || 'Failed to validate referral code');
    }
  };

  /**
   * Initialize referral system (for troubleshooting)
   */
  const initializeReferralSystem = async () => {
    if (!currentUser) {
      throw new Error('User must be authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const initializeFunction = httpsCallable(functions, 'initializeReferralSystem');
      const result = await initializeFunction();
      
      console.log('Referral system initialized:', result.data);
      
      // Refresh stats
      await fetchReferralStats();
      
      return result.data;
    } catch (error) {
      console.error('Error initializing referral system:', error);
      const errorMessage = error.message || 'Failed to initialize referral system';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fix referral code customization flag (for legacy users)
   */
  const fixReferralCodeCustomization = async () => {
    if (!currentUser) {
      throw new Error('User must be authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const fixFunction = httpsCallable(functions, 'fixReferralCodeCustomization');
      const result = await fixFunction();
      
      console.log('Referral code customization fixed:', result.data);
      
      // Refresh stats after fixing
      await fetchReferralStats();
      
      return result.data;
    } catch (error) {
      console.error('Error fixing referral code customization:', error);
      const errorMessage = error.message || 'Failed to fix referral code customization';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Share referral link via different methods
   */
  const shareReferralLink = async (method = 'copy') => {
    try {
      const referralLink = await generateReferralLink();
      
      switch (method) {
        case 'copy':
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(referralLink);
            return { success: true, message: 'Referral link copied to clipboard!' };
          } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = referralLink;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return { success: true, message: 'Referral link copied to clipboard!' };
          }
          
        case 'twitter':
          const twitterText = encodeURIComponent(`Join me on this awesome gaming platform and earn tokens! Use my referral link: ${referralLink}`);
          window.open(`https://twitter.com/intent/tweet?text=${twitterText}`, '_blank');
          return { success: true, message: 'Opening Twitter...' };
          
        case 'facebook':
          const facebookUrl = encodeURIComponent(referralLink);
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${facebookUrl}`, '_blank');
          return { success: true, message: 'Opening Facebook...' };
          
        case 'discord':
          // For Discord, we'll just copy the link with a formatted message
          const discordMessage = `Hey! Join me on this awesome gaming platform and earn tokens! Use my referral link: ${referralLink}`;
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(discordMessage);
            return { success: true, message: 'Discord message copied to clipboard!' };
          }
          break;
          
        case 'email':
          const subject = encodeURIComponent('Join me on this gaming platform!');
          const body = encodeURIComponent(`Hey!\n\nI wanted to invite you to join this awesome gaming platform where you can earn tokens and compete with other players.\n\nUse my referral link to get started: ${referralLink}\n\nSee you there!`);
          window.open(`mailto:?subject=${subject}&body=${body}`);
          return { success: true, message: 'Opening email client...' };
          
        default:
          return { success: false, message: 'Unknown sharing method' };
      }
    } catch (error) {
      console.error('Error sharing referral link:', error);
      return { success: false, message: error.message || 'Failed to share referral link' };
    }
  };

  /**
   * Clear any detected referral code (useful for testing)
   */
  const clearDetectedReferralCode = () => {
    setDetectedReferralCode(null);
    sessionStorage.removeItem('detectedReferralCode');
  };

  /**
   * Refresh referral statistics
   */
  const refreshReferralStats = async () => {
    await fetchReferralStats();
  };

  const value = {
    // State
    detectedReferralCode,
    referralStats,
    loading,
    error,
    processingReferral,
    
    // Actions
    processReferralOnSignup,
    fetchReferralStats,
    setCustomReferralCode,
    generateReferralLink,
    validateReferralCode,
    initializeReferralSystem,
    fixReferralCodeCustomization,
    shareReferralLink,
    clearDetectedReferralCode,
    refreshReferralStats,
    
    // Setters
    setError,
    setDetectedReferralCode
  };

  return (
    <ReferralContext.Provider value={value}>
      {children}
    </ReferralContext.Provider>
  );
}; 