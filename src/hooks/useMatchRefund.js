import { useEffect, useState, useCallback } from 'react';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Hook to handle token refunds when a match is cancelled
 * @param {object} match - The match object
 * @param {string} matchId - The match ID
 * @param {boolean} isCancelled - Whether the match is cancelled
 * @returns {object} - Status of the refund process
 */
export function useMatchRefund(match, matchId, isCancelled) {
  const [refundStatus, setRefundStatus] = useState({
    isRefundProcessed: false,
    isRefundRequested: false,
    isRefundInProgress: false,
    refundError: null,
    lastChecked: null,
    checkCount: 0
  });

  // Function to check refund status
  const checkRefundStatus = useCallback(async () => {
    if (!match || !matchId) {
      console.error('Cannot check refund status: missing match data');
      return { success: false, error: 'Missing match data' };
    }
    
    try {
      // Use the real-time match data instead of making a separate database call
      // since the WagerMatch component already has real-time updates via onSnapshot
      
      // Update local state based on current match data
      setRefundStatus(prev => ({
        isRefundProcessed: match.refundsProcessed || false,
        isRefundRequested: false,
        isRefundInProgress: match.refundInProgress || false,
        refundError: match.refundError || null,
        lastChecked: new Date(),
        checkCount: prev.checkCount + 1
      }));
      
      return { 
        success: true, 
        isProcessed: match.refundsProcessed || false,
        isInProgress: match.refundInProgress || false,
        refundError: match.refundError || null
      };
    } catch (error) {
      console.error('Error checking refund status:', error);
      setRefundStatus(prev => ({
        ...prev,
        refundError: error.message,
        lastChecked: new Date()
      }));
      return { success: false, error: error.message };
    }
  }, [match, matchId]);

  // Function to manually request a refund
  const requestRefund = useCallback(async () => {
    if (!match || !matchId) {
      console.error('Cannot request refund: missing match data');
      return { success: false, error: 'Missing match data' };
    }

    try {
      // Create a refund request document
      const refundRequestData = {
        matchId: matchId,
        hostId: match.hostId,
        guestId: match.guestId,
        amount: match.amount,
        status: 'pending',
        source: 'manual_request',
        createdAt: new Date(),
        requestedBy: 'user'
      };


      
      await addDoc(collection(db, 'refund_requests'), refundRequestData);
      
      // Update local state to show refund was requested
      setRefundStatus(prev => ({
        ...prev,
        isRefundRequested: true,
        refundError: null
      }));

      return { success: true, message: 'Refund request submitted successfully' };
    } catch (error) {
      console.error('Error requesting refund:', error);
      setRefundStatus(prev => ({
        ...prev,
        refundError: error.message
      }));
      return { success: false, error: error.message };
    }
  }, [match, matchId]);
  
  // Reset refund status when match changes
  useEffect(() => {
    if (!match) return;
    
    // Update local state based on match data
    setRefundStatus({
      isRefundProcessed: match.refundsProcessed || false,
      isRefundRequested: false,
      isRefundInProgress: match.refundInProgress || false,
      refundError: match.refundError || null,
      lastChecked: null,
      checkCount: 0
    });
  }, [match?.id]); // Only reset when match ID changes

  // Update refund status when match refund-related fields change
  useEffect(() => {
    if (!match) return;
    
    // Update local state based on current match refund data
    setRefundStatus(prev => ({
      ...prev,
      isRefundProcessed: match.refundsProcessed || false,
      isRefundInProgress: match.refundInProgress || false,
      refundError: match.refundError || null
    }));
  }, [match?.refundsProcessed, match?.refundInProgress, match?.refundError]);

  useEffect(() => {
    // Only process refunds if the match is cancelled and has an amount
    if (!isCancelled || !match || !match.amount || !matchId) return;

    // Update local state based on match data
    setRefundStatus(prev => ({
      ...prev,
      isRefundProcessed: match.refundsProcessed || false,
      isRefundRequested: false,
      isRefundInProgress: match.refundInProgress || false,
      refundError: match.refundError || null
    }));

    // Check if refunds have already been processed or are in progress
    if (match.refundsProcessed) {

      return;
    }

    // Wait a short time to give the cloud function time to start processing
    const initiateRefundCheck = async () => {
      try {
        // Wait 3 seconds to give the cloud function time to start processing
        await new Promise(resolve => setTimeout(resolve, 3000));
        // Check if the refund has started processing
        await checkRefundStatus();
      } catch (error) {
        console.error('Error during refund check:', error);
      }
    };
    initiateRefundCheck();
    // eslint-disable-next-line
  }, [isCancelled, match, matchId]);

  return {
    isRefundProcessed: refundStatus.isRefundProcessed,
    isRefundRequested: refundStatus.isRefundRequested,
    isRefundInProgress: refundStatus.isRefundInProgress,
    refundError: refundStatus.refundError,
    lastChecked: refundStatus.lastChecked,
    checkCount: refundStatus.checkCount,
    checkRefundStatus,
    requestRefund
  };
}

export default useMatchRefund; 