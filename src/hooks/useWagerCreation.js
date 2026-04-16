import { useState, useCallback } from 'react';
import { collection, addDoc, doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useTokens } from '../contexts/TokenContext';

/**
 * Hook for handling wager creation with proper entry fee deduction
 */
export function useWagerCreation() {
  const { balance, deductTokens, refreshBalance } = useTokens();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  /**
   * Create a new wager and deduct tokens from the host
   * @param {Object} wagerData - The wager data
   * @param {string} userId - The user ID of the host
   * @param {string} userName - The display name of the host
   * @param {string} userPhotoURL - The photo URL of the host
   * @param {string} epicName - The Epic Games username of the host
   * @returns {Promise<Object>} - The created wager document reference and ID
   */
  const createWager = useCallback(async (wagerData, userId, userName, userPhotoURL, epicName) => {
    setLoading(true);
    setError(null);
    
    try {
  
      
      // Validate wager amount
      const amount = Number(wagerData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid wager amount');
      }
      
      // Check if user has enough tokens
      if (balance < amount) {
        throw new Error('Insufficient tokens');
      }
      
      // Create wager document
      const wagerRef = await addDoc(collection(db, 'wagers'), {
        ...wagerData,
        hostId: userId,
        hostName: userName,
        hostPhoto: userPhotoURL || null,
        hostEpicName: epicName || null,
        status: 'open',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        entryFeesDeducted: false, // Start with false until we confirm deduction
      });
      

      
      // Deduct tokens from user
      const deductionResult = await deductTokens(amount, `Wager entry fee: ${wagerRef.id}`, wagerRef.id);
      
      if (!deductionResult.success) {
        // If deduction failed, mark the wager as failed
        console.error('Token deduction failed:', deductionResult.error);
        await updateDoc(wagerRef, {
          status: 'failed',
          failureReason: 'Token deduction failed',
          updatedAt: serverTimestamp()
        });
        throw new Error(`Token deduction failed: ${deductionResult.error}`);
      }
      
      // Mark entry fees as deducted
      await updateDoc(wagerRef, {
        entryFeesDeducted: true,
        updatedAt: serverTimestamp()
      });
      

      
      // Refresh balance
      refreshBalance();
      
      return {
        wagerRef,
        wagerId: wagerRef.id
      };
    } catch (err) {
      console.error('Error creating wager:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [balance, deductTokens, refreshBalance]);
  
  /**
   * Join an existing wager and deduct tokens from the guest
   * @param {string} wagerId - The wager ID to join
   * @param {string} userId - The user ID of the guest
   * @param {string} userName - The display name of the guest
   * @param {string} userPhotoURL - The photo URL of the guest
   * @param {string} epicName - The Epic Games username of the guest
   * @returns {Promise<Object>} - The updated wager data
   */
  const joinWager = useCallback(async (wagerId, userId, userName, userPhotoURL, epicName) => {
    setLoading(true);
    setError(null);
    
    try {

      
      // Get wager data
      const wagerRef = doc(db, 'wagers', wagerId);
      const wagerDoc = await getDoc(wagerRef);
      
      if (!wagerDoc.exists()) {
        throw new Error('Wager not found');
      }
      
      const wagerData = wagerDoc.data();
      
      // Check if wager is available to join
      if (wagerData.status !== 'open') {
        throw new Error('This wager is no longer available');
      }
      
      // Check if user is not the host
      if (wagerData.hostId === userId) {
        throw new Error('You cannot join your own wager');
      }
      
      // Validate wager amount
      const amount = Number(wagerData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid wager amount');
      }
      
      // Check if user has enough tokens
      if (balance < amount) {
        throw new Error('Insufficient tokens');
      }
      
      // Deduct tokens from user
      const deductionResult = await deductTokens(amount, `Wager entry fee: ${wagerId}`, wagerId);
      
      if (!deductionResult.success) {
        console.error('Token deduction failed:', deductionResult.error);
        throw new Error(`Token deduction failed: ${deductionResult.error}`);
      }
      
      // Update wager with guest info and change status
      await updateDoc(wagerRef, {
        guestId: userId,
        guestName: userName,
        guestPhoto: userPhotoURL || null,
        guestEpicName: epicName || null,
        status: 'ready',
        guestEntryFeesDeducted: true,
        updatedAt: serverTimestamp()
      });
      

      
      // Refresh balance
      refreshBalance();
      
      // Get updated wager data
      const updatedWagerDoc = await getDoc(wagerRef);
      
      return {
        success: true,
        wagerData: {
          id: updatedWagerDoc.id,
          ...updatedWagerDoc.data()
        }
      };
    } catch (err) {
      console.error('Error joining wager:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [balance, deductTokens, refreshBalance]);
  
  return {
    createWager,
    joinWager,
    loading,
    error
  };
}

export default useWagerCreation; 