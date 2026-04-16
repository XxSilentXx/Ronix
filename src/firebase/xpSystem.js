import { 
  getFirestore, 
  doc, 
  getDoc, 
  updateDoc, 
  increment, 
  arrayUnion, 
  serverTimestamp, 
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  runTransaction
} from 'firebase/firestore';

// XP requirements for each level
export const XP_LEVELS = {
  1: 0,
  2: 80,
  3: 180,
  4: 320,
  5: 500,
  6: 720,
  7: 980,
  8: 1280,
  9: 1620,
  10: 2000,     // End of Bronze
  11: 2400,
  12: 2820,
  13: 3260,
  14: 3720,
  15: 4200,     // Mid Silver
  16: 4700,
  17: 5220,
  18: 5760,
  19: 6320,
  20: 6900,     // End Silver
  21: 7500,
  22: 8120,
  23: 8760,
  24: 9420,
  25: 10100,    // End Gold
  26: 10800,
  27: 11520,
  28: 12260,
  29: 13020,
  30: 13800,    // End Plat
  31: 14600,
  32: 15420,
  33: 16260,
  34: 17120,
  35: 18000,
  36: 18900,
  37: 19820,
  38: 20760,
  39: 21720,
  40: 22700,    // End Diamond
  41: 23700,
  42: 24720,
  43: 25760,
  44: 26820,
  45: 27900,
  46: 29000,
  47: 30120,
  48: 31260,
  49: 32420,
  50: 33600,
  51: 35000     // Master threshold (no need to hit 100K!)
}


// Define tiers based on level ranges
export const TIERS = {
  'Bronze': { minLevel: 1, maxLevel: 10, color: '#cd7f32' },
  'Silver': { minLevel: 11, maxLevel: 20, color: '#c0c0c0' },
  'Gold': { minLevel: 21, maxLevel: 30, color: '#ffd700' },
  'Platinum': { minLevel: 31, maxLevel: 40, color: '#e5e4e2' },
  'Diamond': { minLevel: 41, maxLevel: 50, color: '#b9f2ff' },
  'Master': { minLevel: 51, maxLevel: 999, color: '#ff4500' }
};

// Get the current level based on XP amount
export const getCurrentLevel = (xp) => {
  // Start from highest level and work down
  const levels = Object.keys(XP_LEVELS).map(Number).sort((a, b) => b - a);
  
  for (const level of levels) {
    if (xp >= XP_LEVELS[level]) {
      return level;
    }
  }
  
  return 1; // Default to level 1
};

// Get the current tier based on level
export const getCurrentTier = (level) => {
  for (const [tier, range] of Object.entries(TIERS)) {
    if (level >= range.minLevel && level <= range.maxLevel) {
      return {
        name: tier,
        ...range
      };
    }
  }
  
  return { name: 'Bronze', ...TIERS['Bronze'] }; // Default to Bronze
};

// Get XP required for next level
export const getXpForNextLevel = (currentLevel) => {
  const nextLevel = currentLevel + 1;
  
  if (XP_LEVELS[nextLevel]) {
    return XP_LEVELS[nextLevel];
  }
  
  // If we're at max defined level, return a very large number
  return Number.MAX_SAFE_INTEGER;
};

// Calculate progress percentage to next level
export const getLevelProgress = (currentXp, currentLevel) => {
  const currentLevelXp = XP_LEVELS[currentLevel] || 0;
  const nextLevelXp = getXpForNextLevel(currentLevel);
  
  if (nextLevelXp === Number.MAX_SAFE_INTEGER) {
    return 100; // Max level reached
  }
  
  const xpForCurrentLevel = currentXp - currentLevelXp;
  const xpRequiredForNextLevel = nextLevelXp - currentLevelXp;
  
  return Math.min(100, Math.floor((xpForCurrentLevel / xpRequiredForNextLevel) * 100));
};

// Initialize user XP data
export const initializeUserXpData = async (userId) => {
  const db = getFirestore();
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    const userData = userSnap.data();
    
    // Check if XP fields are missing
    if (userData.xpTotal === undefined) {
      await updateDoc(userRef, {
        xpTotal: 0,
        currentLevel: 1,
        currentTier: 'Bronze',
        seasonHighestTier: 'Bronze',
        xpHistory: [],
        achievements: [],
        lastLoginDate: serverTimestamp(),
        loginStreak: 0
      });
    }
  }
};

/**
 * Check if user has active XP boosts and apply the multiplier
 * @param {string} userId - User ID
 * @param {number} xpAmount - Base XP amount
 * @returns {Object} XP details with boost applied
 */
export const applyXpBoosts = async (userId, xpAmount) => {
  try {
    const db = getFirestore();
    const inventoryRef = doc(db, 'userInventory', userId);
    const inventoryDoc = await getDoc(inventoryRef);
    
    if (!inventoryDoc.exists()) {
      return { xpAmount, boosted: false, multiplier: 1 };
    }
    
    const inventoryData = inventoryDoc.data();
    const items = inventoryData.items || [];
    const now = new Date();
    
    // Find active XP boosts
    let bestMultiplier = 1;
    let activeBoosts = [];
    
    items.forEach(item => {
      // Check for time-based XP boosts
      if (item.id === 'xp_boost_1hr' && item.activatedAt && item.expiresAt) {
        const expiryTime = new Date(item.expiresAt);
        if (now < expiryTime) {
          activeBoosts.push(item);
          bestMultiplier = Math.max(bestMultiplier, 2); // 2x multiplier
        }
      }
      
      // Check for match-based XP boosts
      if (item.id === 'xp_boost_3matches' && item.usesRemaining > 0) {
        activeBoosts.push(item);
        bestMultiplier = Math.max(bestMultiplier, 2); // 2x multiplier
      }
    });
    
    const boostedXp = Math.floor(xpAmount * bestMultiplier);
    
    console.log(`XP BOOST: User ${userId} XP calculation:`, {
      baseXp: xpAmount,
      multiplier: bestMultiplier,
      boostedXp,
      activeBoosts: activeBoosts.length
    });
    
    return {
      xpAmount: boostedXp,
      boosted: bestMultiplier > 1,
      multiplier: bestMultiplier,
      activeBoosts
    };
    
  } catch (error) {
    console.error('Error applying XP boosts:', error);
    return { xpAmount, boosted: false, multiplier: 1 };
  }
};

/**
 * Award XP to a user, update their level/tier if necessary
 * @param {string} userId - User ID
 * @param {number} xpAmount - Amount of XP to award
 * @param {string} reason - Reason for awarding XP
 * @returns {Object} XP award details
 */
export const awardXp = async (userId, xpAmount, reason) => {
  console.log(`XP SYSTEM: awardXp called with params:`, { userId, xpAmount, reason });
  
  if (!userId || !xpAmount) {
    console.warn('XP SYSTEM: Invalid parameters for awardXp, returning null');
    return null;
  }
  
  // Apply XP boosts before awarding
  const boostResult = await applyXpBoosts(userId, xpAmount);
  const finalXpAmount = boostResult.xpAmount;
  
  console.log(`XP SYSTEM: Awarding ${finalXpAmount} XP to user ${userId} for: ${reason} (base: ${xpAmount}, boosted: ${boostResult.boosted})`);
  
  try {
    // Get user reference
    const db = getFirestore();
    const userRef = doc(db, 'users', userId);
    console.log(`XP SYSTEM: Getting user document for ID: ${userId}`);
    
    // Get the current user data
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error(`XP SYSTEM: User ${userId} not found`);
      return null;
    }
    
    // Extract user data
    const userData = userDoc.data();
    const currentXp = userData.xpTotal || 0;
    const newXpTotal = currentXp + finalXpAmount;
    
    console.log(`XP SYSTEM: Current user XP data:`, {
      userId,
      currentXp,
      newXpTotal,
      increase: finalXpAmount,
      boosted: boostResult.boosted,
      multiplier: boostResult.multiplier
    });
    
    // Calculate level and tier
    const oldLevel = getCurrentLevel(currentXp);
    const newLevel = getCurrentLevel(newXpTotal);
    const newTier = getCurrentTier(newLevel);
    const leveledUp = newLevel > oldLevel;
    
    console.log(`XP SYSTEM: XP award calculations:`, {
      oldLevel,
      newLevel,
      leveledUp,
      newTier: newTier.name,
      oldTier: getCurrentTier(oldLevel).name
    });
    
    // Create XP history entry
    const xpEntry = {
      amount: finalXpAmount,
      baseAmount: xpAmount,
      boosted: boostResult.boosted,
      multiplier: boostResult.multiplier,
      newTotal: newXpTotal,
      reason,
      timestamp: new Date(), // Use a JavaScript Date object instead of serverTimestamp()
      levelUp: leveledUp
    };
    
    console.log(`XP SYSTEM: Created XP history entry:`, xpEntry);
    
    // Update user document directly (no transaction)
    console.log(`XP SYSTEM: Updating user document with new XP data`);
    await updateDoc(userRef, {
      xpTotal: newXpTotal,
      currentLevel: newLevel,
      currentTier: newTier.name,
      lastXpUpdate: serverTimestamp(),
      xpHistory: arrayUnion(xpEntry)
    });
    
    // If XP was boosted and we have match-based boosts, update their usage
    if (boostResult.boosted && boostResult.activeBoosts.length > 0) {
      await updateXpBoostUsage(userId, boostResult.activeBoosts);
    }
    
    // Debug: Fetch and log the user doc after update
    const updatedUserDoc = await getDoc(userRef);
    if (updatedUserDoc.exists()) {
      console.log(`XP SYSTEM: User doc after XP update:`, updatedUserDoc.data());
    } else {
      console.warn(`XP SYSTEM: User doc not found after XP update for ${userId}`);
    }
    
    console.log(`XP SYSTEM: User ${userId} XP updated: ${currentXp} → ${newXpTotal} (Level ${oldLevel} → ${newLevel})`);
    
    // Create result object to return
    const result = {
      userId,
      xpAmount: finalXpAmount,
      baseXpAmount: xpAmount,
      boosted: boostResult.boosted,
      multiplier: boostResult.multiplier,
      reason,
      newTotal: newXpTotal,
      newLevel,
      newTier: newTier.name,
      leveledUp,
      timestamp: new Date()
    };
    
    console.log(`XP SYSTEM: Returning XP award result:`, result);
    return result;
  } catch (error) {
    console.error(`XP SYSTEM: Error awarding XP to user ${userId}:`, error);
    return null;
  }
};

/**
 * Update usage for match-based XP boosts
 * @param {string} userId - User ID
 * @param {Array} activeBoosts - Active boost items
 */
const updateXpBoostUsage = async (userId, activeBoosts) => {
  try {
    const db = getFirestore();
    const inventoryRef = doc(db, 'userInventory', userId);
    const inventoryDoc = await getDoc(inventoryRef);
    
    if (!inventoryDoc.exists()) return;
    
    const inventoryData = inventoryDoc.data();
    const items = inventoryData.items || [];
    
    // Update match-based boosts
    const updatedItems = items.map(item => {
      const matchingBoost = activeBoosts.find(boost => 
        boost.id === item.id && 
        boost.purchasedAt === item.purchasedAt && 
        item.id === 'xp_boost_3matches'
      );
      
      if (matchingBoost && item.usesRemaining > 0) {
        return {
          ...item,
          usesRemaining: item.usesRemaining - 1,
          lastUsed: new Date().toISOString()
        };
      }
      
      return item;
    });
    
    await updateDoc(inventoryRef, {
      items: updatedItems,
      updatedAt: serverTimestamp()
    });
    
    console.log(`XP BOOST: Updated match-based boost usage for user ${userId}`);
    
  } catch (error) {
    console.error('Error updating XP boost usage:', error);
  }
};

// Record daily login and update streak
export const recordDailyLogin = async (userId) => {
  if (!userId) return false;
  
  try {
    const db = getFirestore();
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) return false;
    
    const userData = userSnap.data();
    const lastLogin = userData.lastLoginDate ? userData.lastLoginDate.toDate() : null;
    const now = new Date();
    let streak = userData.loginStreak || 0;
    let streakMaintained = false;
    let streakIncreased = false;
    
    // Check if this is a new day since last login
    if (lastLogin) {
      const lastLoginDay = new Date(lastLogin).setHours(0, 0, 0, 0);
      const today = new Date(now).setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      // If last login was yesterday, increase streak
      if (lastLoginDay.valueOf() === yesterday.valueOf()) {
        streak++;
        streakIncreased = true;
        streakMaintained = true;
      } 
      // If last login was today, maintain streak
      else if (lastLoginDay.valueOf() === today.valueOf()) {
        streakMaintained = true;
      }
      // If more than a day has passed, reset streak
      else {
        streak = 1; // Reset to 1 for today's login
      }
    } else {
      // First login ever
      streak = 1;
    }
    
    // Update user document
    await updateDoc(userRef, {
      lastLoginDate: serverTimestamp(),
      loginStreak: streak
    });
    
    // Award XP based on login streak
    let xpAward = 0;
    
    if (streakIncreased) {
      // Award increasing XP for login streaks
      if (streak <= 5) {
        xpAward = 10 * streak; // 10, 20, 30, 40, 50 XP for streaks 1-5
      } else if (streak <= 10) {
        xpAward = 75; // 75 XP for streaks 6-10
      } else if (streak <= 20) {
        xpAward = 100; // 100 XP for streaks 11-20
      } else {
        xpAward = 150; // 150 XP for streaks 21+
      }
      
      if (xpAward > 0) {
        await awardXp(userId, xpAward, `Day ${streak} login streak bonus`);
      }
    }
    
    return {
      success: true,
      streak,
      streakMaintained,
      streakIncreased,
      xpAwarded: xpAward
    };
  } catch (error) {
    console.error('Error recording daily login:', error);
    return { success: false, error: error.message };
  }
};

// Award XP for wager participation
export const awardWagerParticipationXp = async (userId, wagerAmount) => {
  // Base XP for participating
  const baseXP = 25;
  
  // Bonus XP based on wager amount (scale as needed)
  const wagerBonus = Math.min(75, Math.floor(wagerAmount / 10));
  
  const totalXP = baseXP + wagerBonus;
  
  return await awardXp(userId, totalXP, `Wager participation (${wagerAmount} tokens)`);
};

// Award XP for winning a wager
export const awardWagerWinXp = async (userId, wagerAmount) => {
  // Base XP for winning
  const baseXP = 50;
  
  // Bonus XP based on wager amount (scale as needed)
  const wagerBonus = Math.min(150, Math.floor(wagerAmount / 5));
  
  const totalXP = baseXP + wagerBonus;
  
  return await awardXp(userId, totalXP, `Wager victory (${wagerAmount} tokens)`);
};

// Get XP leaderboard
export const getXpLeaderboard = async (maxResults = 10) => {
  console.log('XP SYSTEM: Fetching XP leaderboard, maxResults:', maxResults);
  try {
    const db = getFirestore();
    const usersRef = collection(db, 'users');
    
    // Try the ordered query first
    try {
      console.log('XP SYSTEM: Attempting to query with orderBy xpTotal');
      const q = query(usersRef, orderBy('xpTotal', 'desc'), limit(maxResults));
      const querySnapshot = await getDocs(q);
      
      console.log(`XP SYSTEM: Query succeeded, got ${querySnapshot.size} results`);
      
      const leaderboard = [];
      querySnapshot.forEach(doc => {
        const userData = doc.data();
        console.log(`XP SYSTEM: Processing user: ${doc.id}, XP: ${userData.xpTotal || 0}`);
        leaderboard.push({
          id: doc.id,
          displayName: userData.displayName || 'Unknown Player',
          photoURL: userData.photoURL || '',
          xpTotal: userData.xpTotal || 0,
          currentLevel: userData.currentLevel || 1,
          currentTier: userData.currentTier || 'Bronze'
        });
      });
      
      return leaderboard;
    } catch (orderByError) {
      // If orderBy fails (likely due to missing index), fall back to getting all users and sorting manually
      console.error('XP SYSTEM: Error with ordered query (possibly missing index):', orderByError);
      console.log('XP SYSTEM: Falling back to manual sorting...');
      
      if (orderByError.code === 'failed-precondition' || orderByError.message.includes('index')) {
        console.warn('XP SYSTEM: This error is likely due to a missing Firestore index. Create an index on xpTotal field.');
      }
      
      // Fallback implementation - get all users and sort manually
      const fallbackQuery = query(usersRef);
      const fallbackSnapshot = await getDocs(fallbackQuery);
      
      console.log(`XP SYSTEM: Fallback query got ${fallbackSnapshot.size} results`);
      
      let allUsers = [];
      fallbackSnapshot.forEach(doc => {
        const userData = doc.data();
        allUsers.push({
          id: doc.id,
          displayName: userData.displayName || 'Unknown Player',
          photoURL: userData.photoURL || '',
          xpTotal: userData.xpTotal || 0,
          currentLevel: userData.currentLevel || 1,
          currentTier: userData.currentTier || 'Bronze'
        });
      });
      
      // Sort manually and limit results
      allUsers.sort((a, b) => b.xpTotal - a.xpTotal);
      return allUsers.slice(0, maxResults);
    }
  } catch (error) {
    console.error('XP SYSTEM: Fatal error getting XP leaderboard:', error);
    return [];
  }
};

// Get user ranking in XP leaderboard
export const getUserXpRanking = async (userId) => {
  if (!userId) return { rank: 'Unknown', total: 0 };
  
  try {
    const db = getFirestore();
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('xpTotal', 'desc'));
    const querySnapshot = await getDocs(q);
    
    let rank = 0;
    let found = false;
    let total = 0;
    
    querySnapshot.forEach(doc => {
      total++;
      
      if (!found) {
        rank++;
        if (doc.id === userId) {
          found = true;
        }
      }
    });
    
    return {
      rank: found ? rank : 'Unranked',
      total
    };
  } catch (error) {
    console.error('Error getting user XP ranking:', error);
    return { rank: 'Error', total: 0 };
  }
};
