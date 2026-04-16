import React, { useEffect } from 'react';
import { db } from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore';

// Temporary component to expose Firebase functions to browser console
// This allows the update script to work with Firebase v9 modular SDK
const BattlePassUpdater = () => {
  useEffect(() => {
    // Expose Firebase functions to window for console access
    window.updateBattlePassFromApp = async (config) => {
      try {
        const battlePassRef = doc(db, 'battlepass', 'current');
        await setDoc(battlePassRef, config);
        return { success: true };
      } catch (error) {
        console.error(' Error updating battle pass from app:', error);
        console.error(' Error details:', error.message, error.code);
        throw error;
      }
    };

    // Also expose the Firebase modules directly
    window.firebaseModules = {
      db,
      doc,
      setDoc
    };

    // Expose a direct update function
    window.directBattlePassUpdate = async () => {
      const config = {
        price: 499,
        durationDays: 30,
        xpCap: 7000,
        title: "Ronix Pass",
        description: "Unlock 14 tiers of rewards for 30 days. Earn XP to claim exclusive items!",
        totalValue: 38,
        isActive: true,
        updatedAt: new Date(),
        createdAt: new Date(),
        tiers: [
          {"xp": 100, "reward": {"type": "coin", "amount": 50, "title": "50 Coins", "icon": "", "id": "coins_50"}},
          {"xp": 250, "reward": {"type": "utility", "amount": 1, "title": "Common Crate", "icon": "", "id": "common_crate"}},
          {"xp": 400, "reward": {"type": "boost", "amount": 1, "title": "2x XP Boost (1 Hour)", "icon": "", "id": "xp_boost_1hr"}},
          {"xp": 600, "reward": {"type": "coin", "amount": 100, "title": "100 Coins", "icon": "", "id": "coins_100"}},
          {"xp": 850, "reward": {"type": "utility", "amount": 1, "title": "Match Snipe Token", "icon": "", "id": "match_snipes"}},
          {"xp": 1150, "reward": {"type": "cosmetic", "title": "Battle Warrior Calling Card", "icon": "", "id": "card_warrior"}},
          {"xp": 1500, "reward": {"type": "crate", "amount": 1, "title": "Rare Crate", "icon": "", "id": "rare_crate"}},
          {"xp": 1900, "reward": {"type": "coin", "amount": 200, "title": "200 Coins", "icon": "", "id": "coins_200"}},
          {"xp": 2350, "reward": {"type": "utility", "amount": 1, "title": "Stat Reset", "icon": "", "id": "stat_reset"}},
          {"xp": 2850, "reward": {"type": "cosmetic", "title": "Neon Pulse Nameplate", "icon": "", "id": "nameplate_neon"}},
          {"xp": 3400, "reward": {"type": "boost", "amount": 2, "title": "2x XP Boost (1 Hour) x2", "icon": "", "id": "xp_boost_1hr"}},
          {"xp": 4000, "reward": {"type": "coin", "amount": 300, "title": "300 Coins", "icon": "", "id": "coins_300"}},
          {"xp": 5000, "reward": {"type": "cosmetic", "title": "Cosmic Wanderer Calling Card", "icon": "", "id": "card_galaxy"}},
          {"xp": 7000, "reward": {"type": "cosmetic", "title": "Frozen Edge Nameplate", "icon": "", "id": "nameplate_ice"}}
        ]
      };
      
      return await window.updateBattlePassFromApp(config);
    };
    
    // Cleanup function
    return () => {
      delete window.updateBattlePassFromApp;
      delete window.firebaseModules;
      delete window.directBattlePassUpdate;
    };
  }, []);

  // This component doesn't render anything visible
  return null;
};

export default BattlePassUpdater; 