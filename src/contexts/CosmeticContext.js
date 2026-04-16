import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp, onSnapshot, getFirestore, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import cosmeticData, { findCosmeticById } from '../data/cosmeticData';

// Create context
const CosmeticContext = createContext();

// Custom hook to use the cosmetic context
export const useCosmetics = () => {
  const context = useContext(CosmeticContext);
  if (!context) {
    throw new Error('useCosmetics must be used within a CosmeticProvider');
  }
  return context;
};

// Provider component
export const CosmeticProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const notification = useNotification();
  
  const [userCosmetics, setUserCosmetics] = useState({
    owned: [],
    equipped: {
      nameplate: null,
      profile: null,
      callingCard: null,
      flair: null
    }
  });
  const [loading, setLoading] = useState(true);

  // Add cosmetic display settings
  const [cosmeticSettings, setCosmeticSettings] = useState({
    showNameplates: true,
    showProfiles: true,
    showCallingCards: true,
    showFlair: true,
    showAnimations: true,
    globalDisable: false,
    brightness: 100 // Add brightness control (0-100%)
  });

  // Load cosmetic settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('cosmeticSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setCosmeticSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Error loading cosmetic settings:', error);
      }
    }
  }, []);

  // Save cosmetic settings to localStorage
  const updateCosmeticSettings = (newSettings) => {
    const updatedSettings = { ...cosmeticSettings, ...newSettings };
    setCosmeticSettings(updatedSettings);
    localStorage.setItem('cosmeticSettings', JSON.stringify(updatedSettings));
  };

  // Initialize user cosmetics when user changes
  useEffect(() => {
      if (!currentUser) {
        setUserCosmetics({
          owned: [],
          equipped: {
            nameplate: null,
            profile: null,
            callingCard: null,
            flair: null
          }
        });
        setLoading(false);
        return;
      }

    console.log('[COSMETICS] Setting up real-time listener for user:', currentUser.uid);
        setLoading(true);
        
    // Set up real-time listener for user cosmetics
        const cosmeticsRef = doc(db, 'userCosmetics', currentUser.uid);
    const unsubscribe = onSnapshot(cosmeticsRef, async (cosmeticsDoc) => {
      try {
        if (cosmeticsDoc.exists()) {
          const cosmeticsData = cosmeticsDoc.data();
          console.log('[COSMETICS] Real-time update received:', cosmeticsData);
          setUserCosmetics({
            owned: cosmeticsData.owned || [],
            equipped: {
              nameplate: cosmeticsData.equipped?.nameplate || null,
              profile: cosmeticsData.equipped?.profile || null,
              callingCard: cosmeticsData.equipped?.callingCard || null,
              flair: cosmeticsData.equipped?.flair || null
            }
          });
        } else {
          console.log('[COSMETICS] No cosmetics document found, creating default');
          // Create an empty cosmetics record for new users
          const defaultCosmetics = {
            owned: [],
            equipped: {
              nameplate: null,
              profile: null,
              callingCard: null,
              flair: null
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          
          await setDoc(cosmeticsRef, defaultCosmetics);
          setUserCosmetics({
            owned: [],
            equipped: {
              nameplate: null,
              profile: null,
              callingCard: null,
              flair: null
            }
          });
        }
      } catch (error) {
        console.error("[COSMETICS] Error in real-time update:", error);
        notification.addNotification("Failed to load cosmetics", "error");
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error("[COSMETICS] Error setting up real-time listener:", error);
      notification.addNotification("Failed to connect to cosmetics service", "error");
      setLoading(false);
    });

    // Cleanup function
    return () => {
      console.log('[COSMETICS] Cleaning up real-time listener');
      unsubscribe();
    };
  }, [currentUser, notification]);

  // Check if user owns a specific cosmetic
  const ownsCosmetic = (cosmeticId) => {
    const owns = userCosmetics.owned.includes(cosmeticId);
    console.log(`Checking ownership of ${cosmeticId}:`, owns, 'Owned cosmetics:', userCosmetics.owned);
    return owns;
  };

  // Enhanced ownership check that includes real-time leaderboard validation for special cosmetics
  const ownsOrQualifiesForCosmetic = async (cosmeticId) => {
    // First check if user already owns it normally
    if (ownsCosmetic(cosmeticId)) {
      return { owns: true, source: 'owned' };
    }

    // Get the cosmetic data to check unlock method
    const cosmetic = findCosmeticById(cosmeticId);
    if (!cosmetic || !currentUser) {
      return { owns: false, source: 'not_found' };
    }

    // Handle special leaderboard-based cosmetics
    if (cosmetic.unlockMethod === 'leaderboard_top10' && cosmeticId === 'nameplate_gold') {
      try {
        // Check if user is currently in top 10 by earnings
        const db = getFirestore();
        const leaderboardQuery = query(
          collection(db, 'userStats'),
          orderBy('totalEarnings', 'desc'),
          limit(10)
        );
        const snapshot = await getDocs(leaderboardQuery);
        const top10PlayerIds = snapshot.docs.map(doc => doc.id);
        
        if (top10PlayerIds.includes(currentUser.uid)) {
          console.log(`[COSMETICS] User qualifies for Golden Crown nameplate (top 10 position: ${top10PlayerIds.indexOf(currentUser.uid) + 1})`);
          return { owns: true, source: 'leaderboard_qualified', position: top10PlayerIds.indexOf(currentUser.uid) + 1 };
        } else {
          console.log(`[COSMETICS] User does not qualify for Golden Crown nameplate (not in top 10)`);
          return { owns: false, source: 'leaderboard_not_qualified' };
        }
      } catch (error) {
        console.error(`[COSMETICS] Error checking leaderboard qualification:`, error);
        return { owns: false, source: 'leaderboard_error' };
      }
    }

    // For other leaderboard cosmetics, add similar checks here in the future
    // if (cosmetic.unlockMethod === 'leaderboard_top3') { ... }
    // if (cosmetic.unlockMethod === 'leaderboard_top1') { ... }

    return { owns: false, source: 'not_qualified' };
  };

  // Get equipped cosmetic for a specific type
  const getEquippedCosmetic = (type) => {
    const cosmeticId = userCosmetics.equipped[type];
    return cosmeticId ? findCosmeticById(cosmeticId) : null;
  };

  // Equip a cosmetic
  const equipCosmetic = async (cosmeticId, type) => {
    if (!currentUser) {
      notification.addNotification("You must be logged in to equip cosmetics", "error");
      return { success: false, error: "Not logged in" };
    }

    // Check if user owns the cosmetic
    if (!ownsCosmetic(cosmeticId)) {
      notification.addNotification("You don't own this cosmetic", "error");
      return { success: false, error: "Cosmetic not owned" };
    }

    // Validate cosmetic exists and type matches
    const cosmetic = findCosmeticById(cosmeticId);
    if (!cosmetic) {
      notification.addNotification("Cosmetic not found", "error");
      return { success: false, error: "Cosmetic not found" };
    }

    if (cosmetic.type !== type) {
      notification.addNotification("Invalid cosmetic type", "error");
      return { success: false, error: "Invalid type" };
    }

    try {
      // Update equipped cosmetics
      const newEquipped = {
        ...userCosmetics.equipped,
        [type]: cosmeticId
      };

      // Update Firestore
      const cosmeticsRef = doc(db, 'userCosmetics', currentUser.uid);
      await updateDoc(cosmeticsRef, {
        equipped: newEquipped,
        updatedAt: serverTimestamp()
      });

      // Update local state
      setUserCosmetics(prev => ({
        ...prev,
        equipped: newEquipped
      }));

      notification.addNotification(`Equipped ${cosmetic.name}!`, "success");
      return { success: true };
    } catch (error) {
      console.error("Error equipping cosmetic:", error);
      notification.addNotification("Failed to equip cosmetic", "error");
      return { success: false, error: error.message };
    }
  };

  // Unequip a cosmetic
  const unequipCosmetic = async (type) => {
    if (!currentUser) {
      notification.addNotification("You must be logged in to unequip cosmetics", "error");
      return { success: false, error: "Not logged in" };
    }

    try {
      // Update equipped cosmetics
      const newEquipped = {
        ...userCosmetics.equipped,
        [type]: null
      };

      // Update Firestore
      const cosmeticsRef = doc(db, 'userCosmetics', currentUser.uid);
      await updateDoc(cosmeticsRef, {
        equipped: newEquipped,
        updatedAt: serverTimestamp()
      });

      // Update local state
      setUserCosmetics(prev => ({
        ...prev,
        equipped: newEquipped
      }));

      notification.addNotification(`Unequipped ${type} cosmetic`, "success");
      return { success: true };
    } catch (error) {
      console.error("Error unequipping cosmetic:", error);
      notification.addNotification("Failed to unequip cosmetic", "error");
      return { success: false, error: error.message };
    }
  };

  // Award a cosmetic to the user (for achievements, crates, etc.)
  const awardCosmetic = async (cosmeticId, source = "unknown") => {
    if (!currentUser) {
      return { success: false, error: "Not logged in" };
    }

    // Check if cosmetic exists
    const cosmetic = findCosmeticById(cosmeticId);
    if (!cosmetic) {
      return { success: false, error: "Cosmetic not found" };
    }

    // Check if user already owns it
    if (ownsCosmetic(cosmeticId)) {
      return { success: false, error: "Already owned" };
    }

    try {
      // Add to owned cosmetics
      const newOwned = [...userCosmetics.owned, cosmeticId];

      // Update Firestore
      const cosmeticsRef = doc(db, 'userCosmetics', currentUser.uid);
      await updateDoc(cosmeticsRef, {
        owned: newOwned,
        updatedAt: serverTimestamp()
      });

      // Update local state
      setUserCosmetics(prev => ({
        ...prev,
        owned: newOwned
      }));

      notification.addNotification(`Unlocked ${cosmetic.name}!`, "success");
      return { success: true };
    } catch (error) {
      console.error("Error awarding cosmetic:", error);
      return { success: false, error: error.message };
    }
  };

  // Get cosmetics by type that the user owns
  const getOwnedCosmeticsByType = (type) => {
    return userCosmetics.owned
      .map(cosmeticId => findCosmeticById(cosmeticId))
      .filter(cosmetic => cosmetic && cosmetic.type === type);
  };

  // Get all available cosmetics by type (for shop/preview)
  const getAvailableCosmeticsByType = (type) => {
    return cosmeticData.cosmetics[type] || [];
  };

  // Check if a cosmetic is currently equipped
  const isCosmeticEquipped = (cosmeticId) => {
    return Object.values(userCosmetics.equipped).includes(cosmeticId);
  };

  // Get cosmetic effects for rendering
  const getCosmeticEffects = (cosmeticId) => {
    const cosmetic = findCosmeticById(cosmeticId);
    return cosmetic ? cosmetic.effects : null;
  };

  // Refresh user cosmetics data (useful for admin operations)
  const refreshUserCosmetics = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      
      // Get user cosmetics from Firestore
      const cosmeticsRef = doc(db, 'userCosmetics', currentUser.uid);
      const cosmeticsDoc = await getDoc(cosmeticsRef);
      
      if (cosmeticsDoc.exists()) {
        const cosmeticsData = cosmeticsDoc.data();
        setUserCosmetics({
          owned: cosmeticsData.owned || [],
          equipped: {
            nameplate: cosmeticsData.equipped?.nameplate || null,
            profile: cosmeticsData.equipped?.profile || null,
            callingCard: cosmeticsData.equipped?.callingCard || null,
            flair: cosmeticsData.equipped?.flair || null
          }
        });
      }
    } catch (error) {
      console.error("Error refreshing user cosmetics:", error);
      notification.addNotification("Failed to refresh cosmetics", "error");
    } finally {
      setLoading(false);
    }
  };

  // Value object to provide through context
  const value = {
    loading,
    userCosmetics,
    cosmeticSettings,
    updateCosmeticSettings,
    ownsCosmetic,
    ownsOrQualifiesForCosmetic,
    getEquippedCosmetic,
    equipCosmetic,
    unequipCosmetic,
    awardCosmetic,
    getOwnedCosmeticsByType,
    getAvailableCosmeticsByType,
    isCosmeticEquipped,
    getCosmeticEffects,
    refreshUserCosmetics,
    cosmeticData
  };

  return (
    <CosmeticContext.Provider value={value}>
      {children}
    </CosmeticContext.Provider>
  );
};

export default CosmeticContext; 