import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import { useNotification } from '../contexts/NotificationContext';

// Create context
const InsuranceContext = createContext();

// Custom hook to use the insurance context
export const useInsurance = () => {
  return useContext(InsuranceContext);
};

// Provider component
export const InsuranceProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const notification = useNotification();
  
  const [insuranceState, setInsuranceState] = useState({
    isActive: false,
    activatedAt: null,
    expiresAt: null,
    maxRefund: 50,
    loading: true,
    isOnCooldown: false,
    cooldownRemaining: 0,
    lastUsed: null
  });

  // Listen for insurance state changes
  useEffect(() => {
    if (!currentUser) {
      setInsuranceState({
        isActive: false,
        activatedAt: null,
        expiresAt: null,
        maxRefund: 50,
        loading: false,
        isOnCooldown: false,
        cooldownRemaining: 0,
        lastUsed: null
      });
      return;
    }

    const userRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        const activeInsurance = userData.activeInsurance;
        const lastInsuranceUsed = userData.lastInsuranceUsed;
        
        // Calculate cooldown status
        let isOnCooldown = false;
        let cooldownRemaining = 0;
        
        if (lastInsuranceUsed) {
          const lastUsed = new Date(lastInsuranceUsed.toDate ? lastInsuranceUsed.toDate() : lastInsuranceUsed);
          const now = new Date();
          const hoursSinceLastUse = (now - lastUsed) / (1000 * 60 * 60);
          
          if (hoursSinceLastUse < 24) {
            isOnCooldown = true;
            cooldownRemaining = 24 - hoursSinceLastUse;
          }
        }
        
        if (activeInsurance?.isActive) {
          // Check if insurance has expired
          const now = new Date();
          const expiresAt = new Date(activeInsurance.expiresAt);
          
          if (now > expiresAt) {
            // Insurance has expired, deactivate it
            deactivateInsurance();
          } else {
            setInsuranceState({
              isActive: true,
              activatedAt: activeInsurance.activatedAt,
              expiresAt: activeInsurance.expiresAt,
              maxRefund: activeInsurance.maxRefund || 50,
              loading: false,
              isOnCooldown,
              cooldownRemaining,
              lastUsed: lastInsuranceUsed
            });
          }
        } else {
          setInsuranceState({
            isActive: false,
            activatedAt: null,
            expiresAt: null,
            maxRefund: 50,
            loading: false,
            isOnCooldown,
            cooldownRemaining,
            lastUsed: lastInsuranceUsed
          });
        }
      } else {
        setInsuranceState(prev => ({ 
          ...prev, 
          loading: false,
          isOnCooldown: false,
          cooldownRemaining: 0,
          lastUsed: null
        }));
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Update cooldown every minute
  useEffect(() => {
    if (!insuranceState.isOnCooldown) return;
    
    const interval = setInterval(() => {
      if (insuranceState.lastUsed) {
        const lastUsed = new Date(insuranceState.lastUsed.toDate ? insuranceState.lastUsed.toDate() : insuranceState.lastUsed);
        const now = new Date();
        const hoursSinceLastUse = (now - lastUsed) / (1000 * 60 * 60);
        
        if (hoursSinceLastUse >= 24) {
          setInsuranceState(prev => ({
            ...prev,
            isOnCooldown: false,
            cooldownRemaining: 0
          }));
        } else {
          setInsuranceState(prev => ({
            ...prev,
            cooldownRemaining: 24 - hoursSinceLastUse
          }));
        }
      }
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [insuranceState.isOnCooldown, insuranceState.lastUsed]);

  // Deactivate insurance
  const deactivateInsurance = async () => {
    if (!currentUser) return;

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        activeInsurance: {
          isActive: false,
          activatedAt: null,
          expiresAt: null,
          maxRefund: 50
        }
      });
    } catch (error) {
      console.error('Error deactivating insurance:', error);
    }
  };

  // Check if insurance can be used (not on cooldown)
  const canUseInsurance = async () => {
    if (!currentUser) return false;

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();

      if (userData.lastInsuranceUsed) {
        const lastUsed = new Date(userData.lastInsuranceUsed.toDate());
        const now = new Date();
        const hoursSinceLastUse = (now - lastUsed) / (1000 * 60 * 60);
        
        return hoursSinceLastUse >= 24;
      }

      return true;
    } catch (error) {
      console.error('Error checking insurance cooldown:', error);
      return false;
    }
  };

  // Get remaining cooldown time
  const getCooldownRemaining = async () => {
    if (!currentUser) return 0;

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();

      if (userData.lastInsuranceUsed) {
        const lastUsed = new Date(userData.lastInsuranceUsed.toDate());
        const now = new Date();
        const hoursSinceLastUse = (now - lastUsed) / (1000 * 60 * 60);
        
        return Math.max(0, 24 - hoursSinceLastUse);
      }

      return 0;
    } catch (error) {
      console.error('Error getting cooldown remaining:', error);
      return 0;
    }
  };

  // Format cooldown time for display
  const formatCooldownTime = (hours) => {
    if (hours <= 0) return '';
    
    const wholeHours = Math.floor(hours);
    const minutes = Math.floor((hours - wholeHours) * 60);
    
    if (wholeHours > 0) {
      return `${wholeHours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  // Apply insurance to a wager (called when joining a wager)
  const applyInsuranceToWager = async (wagerId, entryFee) => {
    if (!currentUser || !insuranceState.isActive) {
      return { applied: false };
    }

    try {
      // Calculate actual refund amount (min of entry fee and max refund)
      const refundAmount = Math.min(entryFee, insuranceState.maxRefund);
      
      notification.addNotification(
        `Wager Insurance applied! Protected up to ${refundAmount} coins.`, 
        "success"
      );

      return {
        applied: true,
        maxRefund: refundAmount,
        activatedAt: insuranceState.activatedAt
      };
    } catch (error) {
      console.error('Error applying insurance to wager:', error);
      return { applied: false };
    }
  };

  const value = {
    ...insuranceState,
    deactivateInsurance,
    canUseInsurance,
    getCooldownRemaining,
    formatCooldownTime,
    applyInsuranceToWager
  };

  return (
    <InsuranceContext.Provider value={value}>
      {children}
    </InsuranceContext.Provider>
  );
};

export default InsuranceContext; 