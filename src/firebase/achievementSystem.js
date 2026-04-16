import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';

const db = getFirestore();

// Achievement definitions with their unlock conditions
export const ACHIEVEMENTS = {
  // Rank-based achievements
  achievement_rank_1: {
    id: 'achievement_rank_1',
    name: 'Rank #1 Player',
    description: 'Reach #1 on the leaderboard',
    cosmeticReward: 'card_royal_decree',
    checkCondition: async (userId, userStats) => {
      // Check if user is #1 on the leaderboard
      const leaderboardQuery = query(
        collection(db, 'userStats'),
        orderBy('totalEarnings', 'desc'),
        limit(1)
      );
      const snapshot = await getDocs(leaderboardQuery);
      if (!snapshot.empty) {
        const topPlayer = snapshot.docs[0];
        return topPlayer.id === userId;
      }
      return false;
    }
  },

  achievement_top_10: {
    id: 'achievement_top_10',
    name: 'Top 10 Player',
    description: 'Reach top 10 on the leaderboard',
    cosmeticReward: 'card_champions_honor',
    checkCondition: async (userId, userStats) => {
      // Check if user is in top 10
      const leaderboardQuery = query(
        collection(db, 'userStats'),
        orderBy('totalEarnings', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(leaderboardQuery);
      const topPlayerIds = snapshot.docs.map(doc => doc.id);
      return topPlayerIds.includes(userId);
    }
  },

  achievement_top_1_percent: {
    id: 'achievement_top_1_percent',
    name: 'Top 1% Player',
    description: 'Be in the top 1% of earners',
    cosmeticReward: 'card_one_percent',
    checkCondition: async (userId, userStats) => {
      // Get total number of players with earnings
      const allPlayersQuery = query(
        collection(db, 'userStats'),
        where('totalEarnings', '>', 0)
      );
      const allPlayersSnapshot = await getDocs(allPlayersQuery);
      const totalPlayers = allPlayersSnapshot.size;
      
      if (totalPlayers < 100) return false; // Need at least 100 players
      
      // Get top 1% threshold
      const top1PercentCount = Math.max(1, Math.floor(totalPlayers * 0.01));
      
      const topPlayersQuery = query(
        collection(db, 'userStats'),
        orderBy('totalEarnings', 'desc'),
        limit(top1PercentCount)
      );
      const topPlayersSnapshot = await getDocs(topPlayersQuery);
      const topPlayerIds = topPlayersSnapshot.docs.map(doc => doc.id);
      
      return topPlayerIds.includes(userId);
    }
  },

  // Win-based achievements
  achievement_10_wins: {
    id: 'achievement_10_wins',
    name: '10 Total Wins',
    description: 'Win 10 total token matches',
    cosmeticReward: 'flair_fire',
    checkCondition: async (userId, userStats) => {
      return (userStats.matchesWon || 0) >= 10;
    }
  },

  achievement_phoenix_rising: {
    id: 'achievement_phoenix_rising',
    name: 'Phoenix Rising',
    description: 'Win 25 total wager matches',
    cosmeticReward: 'card_phoenix_rising',
    checkCondition: async (userId, userStats) => {
      return (userStats.matchesWon || 0) >= 25;
    }
  },

  // Coin-based achievements
  achievement_50_coins: {
    id: 'achievement_50_coins',
    name: '50 Coins Earned',
    description: 'Earn 50 total coins from wagers',
    cosmeticReward: 'card_coin_collector',
    checkCondition: async (userId, userStats) => {
      return (userStats.totalEarnings || 0) >= 50;
    }
  },

  achievement_200_coins: {
    id: 'achievement_200_coins',
    name: '200 Coins Earned',
    description: 'Earn 200+ total coins from wagers',
    cosmeticReward: 'card_tycoon',
    checkCondition: async (userId, userStats) => {
      return (userStats.totalEarnings || 0) >= 200;
    }
  },

  // High-value wager achievements
  achievement_high_roller: {
    id: 'achievement_high_roller',
    name: 'High Roller',
    description: 'Win 10 wagers of 5+ coins',
    cosmeticReward: 'card_high_roller',
    checkCondition: async (userId, userStats) => {
      // Check user's achievement progress for high roller wins
      const userAchievementsRef = doc(db, 'userAchievements', userId);
      const userAchievementsDoc = await getDoc(userAchievementsRef);
      
      if (userAchievementsDoc.exists()) {
        const data = userAchievementsDoc.data();
        return (data.highRollerWins || 0) >= 10;
      }
      return false;
    }
  },

  // Experience-based achievements
  achievement_100_wagers: {
    id: 'achievement_100_wagers',
    name: '100 Wagers Played',
    description: 'Play at least 100 total wagers',
    cosmeticReward: 'card_veterans_edge',
    checkCondition: async (userId, userStats) => {
      return (userStats.matchesPlayed || 0) >= 100;
    }
  },

  // Special achievements requiring custom tracking
  achievement_25_snipes: {
    id: 'achievement_25_snipes',
    name: '25 Snipes Hit',
    description: 'Successfully hit 25 snipes',
    cosmeticReward: 'card_snipers_mark',
    checkCondition: async (userId, userStats) => {
      // Check user's achievement progress for snipes
      const userAchievementsRef = doc(db, 'userAchievements', userId);
      const userAchievementsDoc = await getDoc(userAchievementsRef);
      
      if (userAchievementsDoc.exists()) {
        const data = userAchievementsDoc.data();
        return (data.snipesHit || 0) >= 25;
      }
      return false;
    }
  },

  achievement_unbreakable: {
    id: 'achievement_unbreakable',
    name: 'Unbreakable',
    description: 'Go 5-0 in 1v1 wagers without Wager Insurance',
    cosmeticReward: 'card_unbreakable',
    checkCondition: async (userId, userStats) => {
      // Check user's achievement progress for unbreakable streak
      const userAchievementsRef = doc(db, 'userAchievements', userId);
      const userAchievementsDoc = await getDoc(userAchievementsRef);
      
      if (userAchievementsDoc.exists()) {
        const data = userAchievementsDoc.data();
        return data.unbreakableAchieved || false;
      }
      return false;
    }
  }
};

// Check all achievements for a user and unlock any that are newly earned
export const checkAndUnlockAchievements = async (userId) => {
  if (!userId) return { unlocked: [], errors: [] };

  console.log(`[ACHIEVEMENT] Checking achievements for user: ${userId}`);
  
  try {
    // Get user stats
    const userStatsRef = doc(db, 'userStats', userId);
    const userStatsDoc = await getDoc(userStatsRef);
    
    if (!userStatsDoc.exists()) {
      console.log(`[ACHIEVEMENT] No stats found for user: ${userId}`);
      return { unlocked: [], errors: [] };
    }
    
    const userStats = userStatsDoc.data();
    console.log(`[ACHIEVEMENT] User stats:`, userStats);
    
    // Get user's current achievements
    const userAchievementsRef = doc(db, 'userAchievements', userId);
    const userAchievementsDoc = await getDoc(userAchievementsRef);
    
    let currentAchievements = [];
    if (userAchievementsDoc.exists()) {
      currentAchievements = userAchievementsDoc.data().unlockedAchievements || [];
    }
    
    console.log(`[ACHIEVEMENT] Current achievements:`, currentAchievements);
    
    // Get user's cosmetics
    const userCosmeticsRef = doc(db, 'userCosmetics', userId);
    const userCosmeticsDoc = await getDoc(userCosmeticsRef);
    
    let ownedCosmetics = [];
    if (userCosmeticsDoc.exists()) {
      ownedCosmetics = userCosmeticsDoc.data().owned || [];
    }
    
    const newlyUnlocked = [];
    const errors = [];
    
    // Check each achievement
    for (const [achievementId, achievement] of Object.entries(ACHIEVEMENTS)) {
      try {
        // Skip if already unlocked
        if (currentAchievements.includes(achievementId)) {
          continue;
        }
        
        console.log(`[ACHIEVEMENT] Checking: ${achievementId}`);
        
        // Check if condition is met
        const conditionMet = await achievement.checkCondition(userId, userStats);
        
        if (conditionMet) {
          console.log(`[ACHIEVEMENT] Unlocked: ${achievementId}`);
          
          // Add to unlocked achievements
          const updatedAchievements = [...currentAchievements, achievementId];
          
          // Award cosmetic if not already owned
          let updatedCosmetics = [...ownedCosmetics];
          if (achievement.cosmeticReward && !ownedCosmetics.includes(achievement.cosmeticReward)) {
            updatedCosmetics.push(achievement.cosmeticReward);
          }
          
          // Update user achievements
          await setDoc(userAchievementsRef, {
            userId,
            unlockedAchievements: updatedAchievements,
            updatedAt: serverTimestamp()
          }, { merge: true });
          
          // Update user cosmetics
          await setDoc(userCosmeticsRef, {
            owned: updatedCosmetics,
            updatedAt: serverTimestamp()
          }, { merge: true });
          
          newlyUnlocked.push({
            achievementId,
            achievementName: achievement.name,
            cosmeticReward: achievement.cosmeticReward
          });
        }
      } catch (error) {
        console.error(`[ACHIEVEMENT] Error checking ${achievementId}:`, error);
        errors.push({ achievementId, error: error.message });
      }
    }
    
    console.log(`[ACHIEVEMENT] Check complete. Newly unlocked: ${newlyUnlocked.length}`);
    return { unlocked: newlyUnlocked, errors };
    
  } catch (error) {
    console.error(`[ACHIEVEMENT] Error checking achievements for ${userId}:`, error);
    return { unlocked: [], errors: [{ general: error.message }] };
  }
};

// Track specific achievement progress (for complex achievements)
export const trackAchievementProgress = async (userId, progressType, data = {}) => {
  if (!userId) return;
  
  console.log(`[ACHIEVEMENT] Tracking progress: ${progressType} for user: ${userId}`, data);
  
  try {
    const userAchievementsRef = doc(db, 'userAchievements', userId);
    const userAchievementsDoc = await getDoc(userAchievementsRef);
    
    let currentData = { userId };
    if (userAchievementsDoc.exists()) {
      currentData = userAchievementsDoc.data();
    }
    
    switch (progressType) {
      case 'high_roller_win':
        // Track wins in wagers of 5+ coins
        if (data.wagerAmount >= 5) {
          currentData.highRollerWins = (currentData.highRollerWins || 0) + 1;
          console.log(`[ACHIEVEMENT] High roller wins: ${currentData.highRollerWins}`);
        }
        break;
        
      case 'snipe_hit':
        // Track successful snipes
        currentData.snipesHit = (currentData.snipesHit || 0) + 1;
        console.log(`[ACHIEVEMENT] Snipes hit: ${currentData.snipesHit}`);
        break;
        
      case 'unbreakable_streak':
        // Track consecutive wins without insurance
        if (data.wonWithoutInsurance) {
          currentData.currentUnbreakableStreak = (currentData.currentUnbreakableStreak || 0) + 1;
          if (currentData.currentUnbreakableStreak >= 5) {
            currentData.unbreakableAchieved = true;
          }
        } else {
          currentData.currentUnbreakableStreak = 0;
        }
        console.log(`[ACHIEVEMENT] Unbreakable streak: ${currentData.currentUnbreakableStreak}`);
        break;
        
      default:
        console.log(`[ACHIEVEMENT] Unknown progress type: ${progressType}`);
        return;
    }
    
    // Update the document
    await setDoc(userAchievementsRef, {
      ...currentData,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    // Check if any achievements were unlocked
    await checkAndUnlockAchievements(userId);
    
  } catch (error) {
    console.error(`[ACHIEVEMENT] Error tracking progress for ${userId}:`, error);
  }
};

// Get user's achievement progress
export const getUserAchievementProgress = async (userId) => {
  if (!userId) return null;
  
  try {
    const userAchievementsRef = doc(db, 'userAchievements', userId);
    const userAchievementsDoc = await getDoc(userAchievementsRef);
    
    if (userAchievementsDoc.exists()) {
      return userAchievementsDoc.data();
    }
    
    return {
      userId,
      unlockedAchievements: [],
      highRollerWins: 0,
      snipesHit: 0,
      currentUnbreakableStreak: 0,
      unbreakableAchieved: false
    };
  } catch (error) {
    console.error(`[ACHIEVEMENT] Error getting achievement progress for ${userId}:`, error);
    return null;
  }
};

// Get all available achievements with their status for a user
export const getUserAchievementStatus = async (userId) => {
  if (!userId) return [];
  
  try {
    const userStats = await getDoc(doc(db, 'userStats', userId));
    const userAchievements = await getUserAchievementProgress(userId);
    
    const achievementStatus = [];
    
    for (const [achievementId, achievement] of Object.entries(ACHIEVEMENTS)) {
      const isUnlocked = userAchievements?.unlockedAchievements?.includes(achievementId) || false;
      let progress = 0;
      let maxProgress = 1;
      
      // Calculate progress for specific achievements
      if (!isUnlocked && userStats.exists()) {
        const stats = userStats.data();
        
        switch (achievementId) {
          case 'achievement_10_wins':
            progress = Math.min(stats.matchesWon || 0, 10);
            maxProgress = 10;
            break;
          case 'achievement_50_coins':
            progress = Math.min(stats.totalEarnings || 0, 50);
            maxProgress = 50;
            break;
          case 'achievement_200_coins':
            progress = Math.min(stats.totalEarnings || 0, 200);
            maxProgress = 200;
            break;
          case 'achievement_100_wagers':
            progress = Math.min(stats.matchesPlayed || 0, 100);
            maxProgress = 100;
            break;
          case 'achievement_high_roller':
            progress = Math.min(userAchievements?.highRollerWins || 0, 10);
            maxProgress = 10;
            break;
          case 'achievement_25_snipes':
            progress = Math.min(userAchievements?.snipesHit || 0, 25);
            maxProgress = 25;
            break;
          case 'achievement_unbreakable':
            progress = Math.min(userAchievements?.currentUnbreakableStreak || 0, 5);
            maxProgress = 5;
            break;
        }
      }
      
      achievementStatus.push({
        ...achievement,
        isUnlocked,
        progress,
        maxProgress,
        progressPercentage: maxProgress > 0 ? Math.round((progress / maxProgress) * 100) : 0
      });
    }
    
    return achievementStatus;
  } catch (error) {
    console.error(`[ACHIEVEMENT] Error getting achievement status for ${userId}:`, error);
    return [];
  }
}; 