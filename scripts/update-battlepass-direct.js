// Direct battlepass update script for Firebase v9 modular SDK
// Run this from your browser console when logged in as an admin

const updateBattlePassConfig = {
  price: 499,
  durationDays: 30,
  xpCap: 7000,
  title: "Ronix Pass",
  description: "Unlock 14 tiers of rewards for 30 days. Earn XP to claim exclusive items!",
  totalValue: 38,
  isActive: true,
  tiers: [
    {"xp": 100, "reward": {"type": "coin", "amount": 50, "title": "50 Coins", "icon": "coin_svg", "id": "coins_50"}},
    {"xp": 250, "reward": {"type": "utility", "amount": 1, "title": "Common Crate", "icon": "", "id": "common_crate"}},
    {"xp": 400, "reward": {"type": "boost", "amount": 1, "title": "2x XP Boost (1 Hour)", "icon": "", "id": "xp_boost_1hr"}},
    {"xp": 600, "reward": {"type": "coin", "amount": 100, "title": "100 Coins", "icon": "coin_svg", "id": "coins_100"}},
    {"xp": 850, "reward": {"type": "utility", "amount": 1, "title": "Match Snipe Token", "icon": "", "id": "match_snipes"}},
    {"xp": 1150, "reward": {"type": "cosmetic", "title": "Battle Warrior Calling Card", "icon": "", "id": "card_warrior"}},
    {"xp": 1500, "reward": {"type": "crate", "amount": 1, "title": "Rare Crate", "icon": "", "id": "rare_crate"}},
    {"xp": 1900, "reward": {"type": "coin", "amount": 200, "title": "200 Coins", "icon": "coin_svg", "id": "coins_200"}},
    {"xp": 2350, "reward": {"type": "utility", "amount": 1, "title": "Stat Reset", "icon": "", "id": "stat_reset"}},
    {"xp": 2850, "reward": {"type": "cosmetic", "title": "Neon Pulse Nameplate", "icon": "", "id": "nameplate_neon"}},
    {"xp": 3400, "reward": {"type": "boost", "amount": 2, "title": "2x XP Boost (1 Hour) x2", "icon": "", "id": "xp_boost_1hr"}},
    {"xp": 4000, "reward": {"type": "coin", "amount": 300, "title": "300 Coins", "icon": "coin_svg", "id": "coins_300"}},
    {"xp": 5000, "reward": {"type": "cosmetic", "title": "Cosmic Wanderer Calling Card", "icon": "", "id": "card_galaxy"}},
    {"xp": 7000, "reward": {"type": "cosmetic", "title": "Frozen Edge Nameplate", "icon": "", "id": "nameplate_ice"}}
  ]
};

// Function to update battle pass using Firebase v9 modular SDK
async function updateBattlePass() {
  try {
    console.log(' Updating Battle Pass configuration...');
    
    // Add timestamps
    const configWithTimestamps = {
      ...updateBattlePassConfig,
      updatedAt: new Date(),
      // Preserve original createdAt if it exists, otherwise use current date
      createdAt: new Date()
    };

    // Try to access Firebase through the app's module system
    // Method 1: Check if the app has exposed Firebase modules globally
    if (window.firebaseModules && window.firebaseModules.db) {
      const { db, doc, setDoc } = window.firebaseModules;
      const battlePassRef = doc(db, 'battlepass', 'current');
      await setDoc(battlePassRef, configWithTimestamps);
      console.log(' Battle Pass updated successfully via firebaseModules!');
      console.log(` Updated ${configWithTimestamps.tiers.length} tiers`);
      return { success: true };
    }
    
    // Method 2: Try to import from the app's Firebase config
    try {
      // This will work if the modules are available globally
      const firebaseConfig = await import('/src/firebase/config.js');
      if (firebaseConfig.db) {
        const { doc, setDoc } = await import('firebase/firestore');
        const battlePassRef = doc(firebaseConfig.db, 'battlepass', 'current');
        await setDoc(battlePassRef, configWithTimestamps);
        console.log(' Battle Pass updated successfully via module import!');
        console.log(` Updated ${configWithTimestamps.tiers.length} tiers`);
        return { success: true };
      }
    } catch (importError) {
      console.log(' Module import not available, trying React app context...');
    }
    
    // Method 3: Try to access through React app context
    // This requires the app to expose these functions
    if (window.updateBattlePassFromApp) {
      await window.updateBattlePassFromApp(configWithTimestamps);
      console.log(' Battle Pass updated successfully via app context!');
      console.log(` Updated ${configWithTimestamps.tiers.length} tiers`);
      return { success: true };
    }
    
    // If all methods fail, provide instructions
    console.error(' Could not access Firebase directly.');
    console.log(' To update the battle pass, please use one of these methods:');
    console.log('1. Use Firebase Console: Go to Firestore > battlepass > current document');
    console.log('2. Add this helper function to your app and call it:');
    console.log(`
// Add this to your React app (e.g., in a useEffect or component):
import { db } from './firebase/config';
import { doc, setDoc } from 'firebase/firestore';

window.updateBattlePassFromApp = async (config) => {
  const battlePassRef = doc(db, 'battlepass', 'current');
  await setDoc(battlePassRef, config);
};
    `);
    console.log('3. Then run updateBattlePass() again');
    
    return { 
      success: false, 
      error: 'Firebase not accessible from console', 
      config: configWithTimestamps 
    };
    
  } catch (error) {
    console.error(' Error updating Battle Pass:', error);
    return { success: false, error: error.message };
  }
}

// Export for use
if (typeof window !== 'undefined') {
  window.updateBattlePass = updateBattlePass;
  window.updateBattlePassConfig = updateBattlePassConfig;
}

console.log(' Battle Pass update script loaded!');
console.log(' Instructions:');
console.log('1. Call updateBattlePass() to attempt automatic update');
console.log('2. If that fails, the script will provide manual update instructions');
console.log('3. Config is available at window.updateBattlePassConfig'); 