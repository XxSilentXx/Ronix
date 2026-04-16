const admin = require('firebase-admin');
const functions = require('firebase-functions');

// Get Firestore instance
const getDb = () => admin.firestore();

// Referral system configuration
const REFERRAL_CONFIG = {
  FIRST_ACTION_BONUS: 1.0,              // $1 bonus for first purchase
  COMMISSION_RATE: 0.10,                // 10% commission rate
  COMMISSION_WINDOW_DAYS: 30,           // 30-day commission window
  MIN_REFERRAL_CODE_LENGTH: 4,          // Minimum custom code length
  MAX_REFERRAL_CODE_LENGTH: 12          // Maximum custom code length
};

// Database collections
const COLLECTIONS = {
  USERS: 'users',
  REFERRAL_CODES: 'referralCodes',
  REFERRAL_USAGE: 'referralUsage',
  REFERRAL_REWARDS: 'referralRewards'
};

/**
 * Generate a unique referral code
 * @param {string} uid - User ID
 * @returns {Promise<string>} - Unique referral code
 */
async function generateUniqueReferralCode(uid) {
  const db = getDb();
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  
  for (let attempt = 0; attempt < 10; attempt++) {
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    const codeDoc = await db.collection(COLLECTIONS.REFERRAL_CODES).doc(code).get();
    if (!codeDoc.exists) {
      return code;
    }
  }
  
  throw new Error('Unable to generate unique referral code after 10 attempts');
}

/**
 * Initialize user in referral system
 * @param {string} uid - User ID
 * @returns {Promise<string>} - Generated referral code
 */
async function initializeUserReferralCode(uid) {
  const db = getDb();
  const code = await generateUniqueReferralCode(uid);
  
  await db.collection(COLLECTIONS.USERS).doc(uid).set({
    referralCode: code,
    referralCodeCustomizable: true,
    referralEarnings: 0,
    referralCommission: 0,
    referralCount: 0
  }, { merge: true });
  
  await db.collection(COLLECTIONS.REFERRAL_CODES).doc(code).set({
    uid: uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    isActive: true
  });
  
  console.log(`Initialized referral code ${code} for user ${uid}`);
  return code;
}

/**
 * Handle referral code usage
 * @param {string} referredUid - UID of user who used the code
 * @param {string} referralCode - Referral code that was used
 * @returns {Promise<Object>} - Result object
 */
async function handleReferralCodeUsage(referredUid, referralCode) {
  const db = getDb();
  const codeDoc = await db.collection(COLLECTIONS.REFERRAL_CODES).doc(referralCode).get();
  
  if (!codeDoc.exists) {
    throw new Error('Invalid referral code');
  }
  
  const codeData = codeDoc.data();
  const referrerUid = codeData.uid;
  
  // Prevent self-referral
  if (referrerUid === referredUid) {
    throw new Error('Cannot use your own referral code');
  }
  
  // Check if user already has been referred
  const referredUserDoc = await db.collection(COLLECTIONS.USERS).doc(referredUid).get();
  const referredUserData = referredUserDoc.data();
  
  if (referredUserData && referredUserData.referredBy) {
    throw new Error('User has already been referred');
  }
  
  // Update referred user
  await db.collection(COLLECTIONS.USERS).doc(referredUid).update({
    referredBy: referralCode,
    referredByUid: referrerUid,
    referralUsedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  // Log referral usage
  await db.collection(COLLECTIONS.REFERRAL_USAGE).add({
    referralCode: referralCode,
    referrerUid: referrerUid,
    referredUid: referredUid,
    usedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  // Create referral rewards tracking
  await db.collection(COLLECTIONS.REFERRAL_REWARDS).doc(referredUid).set({
    referrerUid: referrerUid,
    referralCode: referralCode,
    status: 'active',
    firstPurchase: false,
    commissionTotal: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: new Date(Date.now() + REFERRAL_CONFIG.COMMISSION_WINDOW_DAYS * 24 * 60 * 60 * 1000)
  });
  
  // Update referrer stats
  await db.collection(COLLECTIONS.USERS).doc(referrerUid).update({
    referralCount: admin.firestore.FieldValue.increment(1)
  });
  
  console.log(`Referral code ${referralCode} used by ${referredUid}, referred by ${referrerUid}`);
  return { success: true, referrerUid: referrerUid };
}

/**
 * Get user data
 * @param {string} uid - User ID
 * @returns {Promise<Object|null>} - User data or null
 */
async function getUserData(uid) {
  const db = getDb();
  const userDoc = await db.collection(COLLECTIONS.USERS).doc(uid).get();
  return userDoc.exists ? userDoc.data() : null;
}

/**
 * Process first action reward (one-time $1 bonus)
 * @param {string} userUid - UID of user who made the purchase
 * @param {string} action - Action type (usually 'purchase')
 * @returns {Promise<Object|null>} - Result object or null
 */
async function processFirstActionReward(userUid, action) {
  const db = getDb();
  const rewardsDoc = await db.collection(COLLECTIONS.REFERRAL_REWARDS).doc(userUid).get();
  
  if (!rewardsDoc.exists) {
    return null; // User wasn't referred
  }
  
  const rewardsData = rewardsDoc.data();
  if (rewardsData.firstPurchase) {
    return null; // Already received first purchase bonus
  }
  
  const referrerUid = rewardsData.referrerUid;
  const bonusAmount = REFERRAL_CONFIG.FIRST_ACTION_BONUS;
  
  // Award bonus to referrer
  const success = await awardBonusTokens(referrerUid, bonusAmount, 'first_purchase_bonus');
  if (success) {
    // Mark first purchase as completed
    await db.collection(COLLECTIONS.REFERRAL_REWARDS).doc(userUid).update({
      firstPurchase: true,
      firstPurchaseAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Update referrer earnings
    await db.collection(COLLECTIONS.USERS).doc(referrerUid).update({
      referralEarnings: admin.firestore.FieldValue.increment(bonusAmount)
    });
    
    console.log(`First purchase bonus of $${bonusAmount} awarded to ${referrerUid} for ${userUid}`);
    return { referrerUid, bonusAmount, type: 'first_purchase_bonus' };
  }
  
  return null;
}

/**
 * Process commission reward (10% for 30 days)
 * @param {string} userUid - UID of user who made the purchase
 * @param {number} purchaseAmount - Dollar amount of the purchase
 * @returns {Promise<Object|null>} - Result object or null
 */
async function processCommissionReward(userUid, purchaseAmount) {
  const userData = await getUserData(userUid);
  if (!userData || !userData.referredBy) {
    return null; // User wasn't referred
  }
  
  const referrerUid = userData.referredByUid;
  const db = getDb();
  const rewardsDoc = await db.collection(COLLECTIONS.REFERRAL_REWARDS).doc(userUid).get();
  
  if (!rewardsDoc.exists) {
    return null; // No active referral rewards
  }
  
  const rewardsData = rewardsDoc.data();
  const now = new Date();
  const expiresAt = rewardsData.expiresAt.toDate();
  
  if (now > expiresAt) {
    return null; // Commission period expired
  }
  
  const commission = Math.round(purchaseAmount * REFERRAL_CONFIG.COMMISSION_RATE * 100) / 100;
  
  // Award commission to referrer
  const success = await awardCommissionTokens(referrerUid, commission, 'commission');
  if (success) {
    // Update commission tracking
    await db.collection(COLLECTIONS.REFERRAL_REWARDS).doc(userUid).update({
      commissionTotal: admin.firestore.FieldValue.increment(commission),
      lastCommissionAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Update referrer commission earnings
    await db.collection(COLLECTIONS.USERS).doc(referrerUid).update({
      referralCommission: admin.firestore.FieldValue.increment(commission)
    });
    
    console.log(`Commission of $${commission} awarded to ${referrerUid} for ${userUid}'s purchase of $${purchaseAmount}`);
    return { referrerUid, commission, type: 'commission' };
  }
  
  return null;
}

/**
 * Award bonus tokens (for first purchase bonus)
 * @param {string} uid - User ID
 * @param {number} amount - Amount to award
 * @param {string} source - Source of the bonus
 * @returns {Promise<boolean>} - Success status
 */
async function awardBonusTokens(uid, amount, source = 'referral') {
  const db = getDb();
  const userRef = db.collection(COLLECTIONS.USERS).doc(uid);
  
  await userRef.update({
    bonusTokens: admin.firestore.FieldValue.increment(amount),
    referralEarnings: admin.firestore.FieldValue.increment(amount),
    lastReferralReward: admin.firestore.FieldValue.serverTimestamp()
  });
  
  // Log the transaction
  await db.collection('tokenTransactions').add({
    uid: uid,
    type: 'bonus',
    amount: amount,
    source: source,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  console.log(`Awarded ${amount} bonus tokens to ${uid} from ${source}`);
  return true;
}

/**
 * Award commission tokens (real tokens)
 * @param {string} uid - User ID
 * @param {number} amount - Amount to award
 * @param {string} source - Source of the commission
 * @returns {Promise<boolean>} - Success status
 */
async function awardCommissionTokens(uid, amount, source = 'commission') {
  const db = getDb();
  const userRef = db.collection(COLLECTIONS.USERS).doc(uid);
  
  await userRef.update({
    tokenBalance: admin.firestore.FieldValue.increment(amount),
    referralCommission: admin.firestore.FieldValue.increment(amount),
    lastReferralReward: admin.firestore.FieldValue.serverTimestamp()
  });
  
  // Log the transaction
  await db.collection('tokenTransactions').add({
    uid: uid,
    type: 'commission',
    amount: amount,
    source: source,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  console.log(`Awarded ${amount} commission tokens to ${uid} from ${source}`);
  return true;
}

// Export all functions
module.exports = {
  REFERRAL_CONFIG,
  COLLECTIONS,
  generateUniqueReferralCode,
  initializeUserReferralCode,
  handleReferralCodeUsage,
  getUserData,
  processFirstActionReward,
  processCommissionReward,
  awardBonusTokens,
  awardCommissionTokens,
  getDb
}; 