import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import { 
  initializeUserXpData, 
  getCurrentLevel, 
  getCurrentTier, 
  getLevelProgress, 
  getXpForNextLevel,
  recordDailyLogin,
  getUserXpRanking
} from '../firebase/xpSystem';

// Create the XP context
const XpContext = createContext();

// Custom hook to use the XP context
export const useXp = () => {
  return useContext(XpContext);
};

// Provider component that makes XP data available to any child component that calls useXp()
export function XpProvider({ children }) {
  const { currentUser } = useAuth();
  const [xpData, setXpData] = useState({
    xpTotal: 0,
    currentLevel: 1,
    currentTier: 'Bronze',
    tierColor: '#cd7f32',
    progress: 0,
    nextLevelXp: 100,
    loginStreak: 0,
    ranking: { rank: 'Unranked', total: 0 }
  });
  const [loading, setLoading] = useState(true);

  // Initialize user XP data and listen for changes
  useEffect(() => {

    
    if (!currentUser) {

      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Initialize XP data if needed
    const initXp = async () => {

      try {
        // Make sure user has XP fields
        await initializeUserXpData(currentUser.uid);

        
        // Record daily login (will only increment streak if appropriate)
        const loginResult = await recordDailyLogin(currentUser.uid);

        
        // Get user ranking
        const rankingData = await getUserXpRanking(currentUser.uid);
        console.log('XP CONTEXT: User ranking retrieved:', rankingData);
        
        // Set initial ranking data
        setXpData(prev => {
          console.log('XP CONTEXT: Setting initial ranking data. Previous:', prev, 'New ranking:', rankingData);
          return {
            ...prev,
            ranking: rankingData
          };
        });
      } catch (error) {
        console.error('XP CONTEXT: Error initializing XP data:', error);
      } finally {
        setLoading(false);
      }
    };

    // Set up real-time listener for user document changes
    console.log('XP CONTEXT: Setting up real-time listener for user:', currentUser.uid);
    const userRef = doc(db, 'users', currentUser.uid);
    
    const unsubscribe = onSnapshot(userRef, (docSnapshot) => {
      console.log('XP CONTEXT: Got real-time update for user document:', currentUser.uid);
      
      if (docSnapshot.exists()) {
        const userData = docSnapshot.data();
        const prevXpData = {...xpData}; // Capture previous state
        
        console.log('XP CONTEXT: User data received:', {
          uid: currentUser.uid,
          xpTotal: userData.xpTotal,
          currentLevel: userData.currentLevel,
          currentTier: userData.currentTier,
          lastXpUpdate: userData.lastXpUpdate ? userData.lastXpUpdate.toDate?.() : null
        });
        
        const xpAmount = userData.xpTotal || 0;
        const level = getCurrentLevel(xpAmount);
        const tier = getCurrentTier(level);
        const progress = getLevelProgress(xpAmount, level);
        
        console.log('XP CONTEXT: Calculated XP data:', { 
          xpAmount, 
          level, 
          tierName: tier.name, 
          progress,
          nextLevelXp: getXpForNextLevel(level),
          prevXpTotal: prevXpData.xpTotal,
          change: xpAmount - prevXpData.xpTotal
        });
        
        setXpData(prev => {
          const newData = {
            ...prev,
            xpTotal: xpAmount,
            currentLevel: level,
            currentTier: tier.name,
            tierColor: tier.color,
            progress: progress,
            nextLevelXp: getXpForNextLevel(level),
            loginStreak: userData.loginStreak || 0
          };
          
          console.log('XP CONTEXT: Updating XP data from:', prev, 'to:', newData);
          return newData;
        });
        
        setLoading(false);
      } else {
        console.warn('XP CONTEXT: User document does not exist in Firestore:', currentUser.uid);
      }
    }, (error) => {
      console.error('XP CONTEXT: Error listening to user XP updates:', error);
      setLoading(false);
    });
    
    console.log('XP CONTEXT: Real-time listener established for user:', currentUser.uid);
    
    // Initialize XP data
    initXp();
    
    // Clean up listener on unmount
    return () => unsubscribe();
  }, [currentUser]);

  // Force a refresh of the XP data from Firestore
  const refreshXpData = async () => {
    if (!currentUser) return;
    
    console.log('XP CONTEXT: Manual refresh of XP data requested');
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const xpAmount = userData.xpTotal || 0;
        const level = getCurrentLevel(xpAmount);
        const tier = getCurrentTier(level);
        
        console.log('XP CONTEXT: Manual refresh got data:', JSON.stringify({
          xpTotal: xpAmount,
          level,
          tier: tier.name,
        }));
        
        setXpData(prev => {
          const newData = {
            ...prev,
            xpTotal: xpAmount,
            currentLevel: level,
            currentTier: tier.name,
            tierColor: tier.color,
            progress: getLevelProgress(xpAmount, level),
            nextLevelXp: getXpForNextLevel(level),
            loginStreak: userData.loginStreak || 0
          };
          
          console.log('XP CONTEXT: Manual refresh updated XP data from:', 
            JSON.stringify(prev), 'to:', JSON.stringify(newData));
          
          return newData;
        });
      }
    } catch (error) {
      console.error('XP CONTEXT: Error during manual refresh:', error);
    }
  };
  
  // Update XP data when user data changes
  useEffect(() => {
    if (!currentUser) return;
    
    console.log('XP CONTEXT: Detected currentUser change, checking for XP updates');
    
    // When current user updates (e.g. after a wager), update XP data
    if (currentUser.xpTotal !== undefined) {
      console.log('XP CONTEXT: currentUser has XP data:', currentUser.xpTotal);
      const level = getCurrentLevel(currentUser.xpTotal);
      const tier = getCurrentTier(level);
      
      setXpData(prev => {
        const newData = {
          ...prev,
          xpTotal: currentUser.xpTotal || 0,
          currentLevel: level,
          currentTier: tier.name,
          tierColor: tier.color,
          progress: getLevelProgress(currentUser.xpTotal, level),
          nextLevelXp: getXpForNextLevel(level),
          loginStreak: currentUser.loginStreak || 0
        };
        
        console.log('XP CONTEXT: Updated XP data from currentUser:', 
          JSON.stringify(prev), 'to:', JSON.stringify(newData));
        
        return newData;
      });
    }
  }, [currentUser]);

  // Value to be provided to consuming components
  const value = {
    ...xpData,
    loading,
    refreshXpData // Export the refresh function for components to use
  };

  return (
    <XpContext.Provider value={value}>
      {children}
    </XpContext.Provider>
  );
}
