const admin = require('firebase-admin');

// Initialize Firebase Admin with explicit project ID
// Make sure you're logged in with: firebase login
admin.initializeApp({
  projectId: 'tokensite-6eef3'
});

const db = admin.firestore();

const battlePassConfig = {
  price: 499,
  durationDays: 30,
  xpCap: 7000,
  title: "Ronix Pass",
  description: "Unlock 14 tiers of rewards for 30 days. Earn XP to claim exclusive items!",
  totalValue: 38,
  isActive: true,
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  tiers: [
    {"xp": 100, "reward": {"type": "coin", "amount": 0.5, "title": "0.50 Coins", "icon": "coin_svg", "id": "coins_50"}},
    {"xp": 250, "reward": {"type": "utility", "amount": 1, "title": "Common Crate", "icon": "", "id": "common_crate"}},
    {"xp": 400, "reward": {"type": "boost", "amount": 1, "title": "2x XP Boost (1 Hour)", "icon": "", "id": "xp_boost_1hr"}},
    {"xp": 600, "reward": {"type": "coin", "amount": 1.0, "title": "1.00 Coins", "icon": "coin_svg", "id": "coins_100"}},
    {"xp": 850, "reward": {"type": "utility", "amount": 1, "title": "Match Snipe Token", "icon": "", "id": "match_snipes"}},
    {"xp": 1150, "reward": {"type": "cosmetic", "title": "Battle Warrior Calling Card", "icon": "", "id": "card_warrior"}},
    {"xp": 1500, "reward": {"type": "crate", "amount": 1, "title": "Rare Crate", "icon": "", "id": "rare_crate"}},
    {"xp": 1900, "reward": {"type": "coin", "amount": 2.0, "title": "2.00 Coins", "icon": "coin_svg", "id": "coins_200"}},
    {"xp": 2350, "reward": {"type": "utility", "amount": 1, "title": "Stat Reset", "icon": "", "id": "stat_reset"}},
    {"xp": 2850, "reward": {"type": "cosmetic", "title": "Neon Pulse Nameplate", "icon": "", "id": "nameplate_neon"}},
    {"xp": 3400, "reward": {"type": "boost", "amount": 2, "title": "2x XP Boost (1 Hour) x2", "icon": "", "id": "xp_boost_1hr"}},
    {"xp": 4000, "reward": {"type": "coin", "amount": 3.0, "title": "3.00 Coins", "icon": "coin_svg", "id": "coins_300"}},
    {"xp": 5000, "reward": {"type": "cosmetic", "title": "Cosmic Wanderer Calling Card", "icon": "", "id": "card_galaxy"}},
    {"xp": 7000, "reward": {"type": "cosmetic", "title": "Frozen Edge Nameplate", "icon": "", "id": "nameplate_ice"}}
  ]
};

async function initializeBattlePass() {
  try {
    console.log('Initializing Battle Pass configuration...');
    
    const battlePassRef = db.collection('battlepass').doc('current');
    await battlePassRef.set(battlePassConfig);
    
    console.log(' Battle Pass configuration initialized successfully!');
    console.log(` Created ${battlePassConfig.tiers.length} tiers`);
    console.log(` Price: ${battlePassConfig.price} tokens (${battlePassConfig.price / 100} coins)`);
    console.log(`  Duration: ${battlePassConfig.durationDays} days`);
    console.log(` XP Cap: ${battlePassConfig.xpCap} XP`);
    
    process.exit(0);
  } catch (error) {
    console.error(' Error initializing Battle Pass:', error);
    process.exit(1);
  }
}

initializeBattlePass(); 