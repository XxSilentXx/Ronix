const admin = require('firebase-admin');
const functions = require('firebase-functions');
const {
  REFERRAL_CONFIG,
  COLLECTIONS,
  generateUniqueReferralCode,
  initializeUserReferralCode,
  handleReferralCodeUsage,
  getUserData,
  getDb
} = require('./referralService');

/**
 * Get user's referral statistics
 */
exports.getReferralStats = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const userUid = context.auth.uid;
  let userData = await getUserData(userUid);
  
  if (!userData) {
    // Initialize user if they don't exist
    await initializeUserReferralCode(userUid);
    userData = await getUserData(userUid);
  } else if (!userData.referralCode) {
    // Handle existing users who don't have a referral code
    console.log(`Existing user ${userUid} missing referral code - initializing`);
    await initializeUserReferralCode(userUid);
    userData = await getUserData(userUid);
  }
  
  // Handle legacy users who might not have referralCodeCustomizable set
  if (userData.referralCodeCustomizable === undefined || userData.referralCodeCustomizable === null) {
    console.log(`Fixing referralCodeCustomizable for legacy user ${userUid}`);
    const db = getDb();
    await db.collection(COLLECTIONS.USERS).doc(userUid).update({
      referralCodeCustomizable: true
    });
    userData.referralCodeCustomizable = true;
  }
  
  // Get recent referrals
  let recentReferrals = [];
  try {
    const db = getDb();
    const recentReferralsQuery = await db.collection(COLLECTIONS.REFERRAL_USAGE)
      .where('referrerUid', '==', userUid)
      .orderBy('usedAt', 'desc')
      .limit(10)
      .get();
    
    recentReferrals = recentReferralsQuery.docs.map(doc => {
      const data = doc.data();
      return {
        referredUid: data.referredUid,
        usedAt: data.usedAt,
        referralCode: data.referralCode
      };
    });
  } catch (error) {
    console.error('Error fetching recent referrals:', error);
  }
  
  return {
    referralCode: userData.referralCode,
    referralCodeCustomizable: userData.referralCodeCustomizable,
    totalEarnings: userData.referralEarnings || 0,
    totalCommission: userData.referralCommission || 0,
    referralCount: userData.referralCount || 0,
    recentReferrals: recentReferrals
  };
});

/**
 * Set custom referral code (one-time only)
 */
exports.setCustomReferralCode = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const userUid = context.auth.uid;
  const newCode = data.code.toUpperCase().trim();
  
  // Validate code format
  if (!/^[A-Z0-9]+$/.test(newCode)) {
    throw new functions.https.HttpsError('invalid-argument', 'Code must contain only letters and numbers');
  }
  
  if (newCode.length < REFERRAL_CONFIG.MIN_REFERRAL_CODE_LENGTH || 
      newCode.length > REFERRAL_CONFIG.MAX_REFERRAL_CODE_LENGTH) {
    throw new functions.https.HttpsError('invalid-argument', 
      `Code must be ${REFERRAL_CONFIG.MIN_REFERRAL_CODE_LENGTH}-${REFERRAL_CONFIG.MAX_REFERRAL_CODE_LENGTH} characters long`);
  }
  
  // Check if user can still customize
  const userData = await getUserData(userUid);
  const db = getDb();
  
  // Handle case where referralCodeCustomizable might not be set (legacy users)
  if (userData.referralCodeCustomizable === false) {
    throw new functions.https.HttpsError('permission-denied', 'Referral code can only be changed once');
  }
  
  // If referralCodeCustomizable is undefined/null, assume it's customizable for legacy users
  if (userData.referralCodeCustomizable === undefined || userData.referralCodeCustomizable === null) {
    console.log(`Setting referralCodeCustomizable to true for legacy user ${userUid}`);
    await db.collection(COLLECTIONS.USERS).doc(userUid).update({
      referralCodeCustomizable: true
    });
  }
  
  // Check if code is already taken
  const codeDoc = await db.collection(COLLECTIONS.REFERRAL_CODES).doc(newCode).get();
  if (codeDoc.exists && codeDoc.data().uid !== userUid) {
    throw new functions.https.HttpsError('already-exists', 'This referral code is already taken');
  }
  
  const oldCode = userData.referralCode;
  
  // Update user's code
  await db.collection(COLLECTIONS.USERS).doc(userUid).update({
    referralCode: newCode,
    referralCodeCustomizable: false
  });
  
  // Update referral codes collection
  if (oldCode) {
    await db.collection(COLLECTIONS.REFERRAL_CODES).doc(oldCode).delete();
  }
  
  await db.collection(COLLECTIONS.REFERRAL_CODES).doc(newCode).set({
    uid: userUid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    isActive: true
  });
  
  console.log(`User ${userUid} changed referral code from ${oldCode} to ${newCode}`);
  return { success: true, newCode: newCode };
});

/**
 * Generate referral link
 */
exports.generateReferralLink = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const userUid = context.auth.uid;
  const userData = await getUserData(userUid);
  
  if (!userData || !userData.referralCode) {
    throw new functions.https.HttpsError('not-found', 'User does not have a referral code');
  }
  
  // Get the domain from functions config or use default
  const config = functions.config();
  const baseUrl = config.app?.domain || 'http://ronix.gg';
  const referralLink = `${baseUrl}?ref=${userData.referralCode}`;
  
  return { referralLink: referralLink };
});

/**
 * Validate referral code
 */
exports.validateReferralCode = functions.https.onCall(async (data, context) => {
  const code = data.code.toUpperCase().trim();
  
  const db = getDb();
  const codeDoc = await db.collection(COLLECTIONS.REFERRAL_CODES).doc(code).get();
  if (!codeDoc.exists) {
    return { valid: false, message: 'Referral code not found' };
  }
  
  const codeData = codeDoc.data();
  if (!codeData.isActive) {
    return { valid: false, message: 'Referral code is inactive' };
  }
  
  // Get referrer info
  const referrerData = await getUserData(codeData.uid);
  
  return {
    valid: true,
    referrerUid: codeData.uid,
    referrerDisplayName: referrerData?.displayName || 'Unknown User'
  };
});

/**
 * Handle referral code usage - called when user signs up with a referral code
 */
exports.handleReferralCodeUsage = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const userUid = context.auth.uid;
  const referralCode = data.referralCode.toUpperCase().trim();
  
  try {
    const result = await handleReferralCodeUsage(userUid, referralCode);
    console.log(`Referral code usage processed for ${userUid} with code ${referralCode}`);
    return result;
  } catch (error) {
    console.error('Error processing referral code usage:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Fix referral code customization flag for legacy users
 */
exports.fixReferralCodeCustomization = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const userUid = context.auth.uid;
  const db = getDb();
  
  try {
    let userData = await getUserData(userUid);
    
    // If user doesn't exist or doesn't have a referral code, initialize them first
    if (!userData || !userData.referralCode) {
      console.log(`User ${userUid} missing referral code - initializing with random code`);
      await initializeUserReferralCode(userUid);
      userData = await getUserData(userUid);
      return { success: true, message: 'Referral system initialized with random code - you can now customize it!' };
    }
    
    // Force set referralCodeCustomizable to true if it's not explicitly false
    if (userData.referralCodeCustomizable !== false) {
      await db.collection(COLLECTIONS.USERS).doc(userUid).update({
        referralCodeCustomizable: true
      });
      console.log(`Fixed referralCodeCustomizable for user ${userUid}`);
      return { success: true, message: 'Referral code customization flag fixed' };
    } else {
      return { success: false, message: 'Referral code has already been customized' };
    }
  } catch (error) {
    console.error('Error fixing referral code customization:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Manual initialization for troubleshooting
 */
exports.initializeReferralSystem = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const userUid = context.auth.uid;
  
  try {
    const userData = await getUserData(userUid);
    if (userData && userData.referralCode) {
      return {
        success: true,
        referralCode: userData.referralCode,
        message: `You already have referral code: ${userData.referralCode}`
      };
    }
    
    console.log(`Initializing referral system for existing user ${userUid}`);
    const code = await initializeUserReferralCode(userUid);
    return {
      success: true,
      referralCode: code,
      message: `Random referral code ${code} created! You can customize it once.`
    };
  } catch (error) {
    console.error('Error initializing referral system:', error);
    throw new functions.https.HttpsError('internal', 'Failed to initialize referral system');
  }
});

/**
 * Get admin referral data (for admin dashboard)
 */
exports.getAdminReferralData = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  // Check if user is admin (you may want to implement proper admin check)
  const userData = await getUserData(context.auth.uid);
  if (!userData || !userData.isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
  
  const db = getDb();
  const limit = data.limit || 50;
  const offset = data.offset || 0;
  
  try {
    // Get top referrers
    const topReferrersQuery = await db.collection(COLLECTIONS.USERS)
      .where('referralCount', '>', 0)
      .orderBy('referralCount', 'desc')
      .limit(limit)
      .get();
    
    const topReferrers = topReferrersQuery.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        displayName: data.displayName || 'Unknown User',
        referralCode: data.referralCode,
        referralCount: data.referralCount || 0,
        referralEarnings: data.referralEarnings || 0,
        referralCommission: data.referralCommission || 0
      };
    });
    
    // Get recent referral usage
    const recentUsageQuery = await db.collection(COLLECTIONS.REFERRAL_USAGE)
      .orderBy('usedAt', 'desc')
      .limit(limit)
      .get();
    
    const recentUsage = recentUsageQuery.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        referralCode: data.referralCode,
        referrerUid: data.referrerUid,
        referredUid: data.referredUid,
        usedAt: data.usedAt
      };
    });
    
    // Get total stats
    const totalStats = {
      totalReferrals: recentUsage.length,
      totalEarnings: topReferrers.reduce((sum, user) => sum + (user.referralEarnings || 0), 0),
      totalCommissions: topReferrers.reduce((sum, user) => sum + (user.referralCommission || 0), 0),
      activeReferrers: topReferrers.length
    };
    
    return {
      topReferrers,
      recentUsage,
      totalStats
    };
  } catch (error) {
    console.error('Error fetching admin referral data:', error);
    throw new functions.https.HttpsError('internal', 'Failed to fetch admin referral data');
  }
});

/**
 * Test referral commission processing (for testing purposes)
 */
exports.testReferralCommission = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  // Only allow in development or for admin users
  const userData = await getUserData(context.auth.uid);
  if (!userData || (!userData.isAdmin && process.env.NODE_ENV === 'production')) {
    throw new functions.https.HttpsError('permission-denied', 'Test function not available');
  }
  
  const { userId, amount } = data;
  const testUserId = userId || context.auth.uid;
  const testAmount = amount || 25.00;
  
  try {
    const { processFirstActionReward, processCommissionReward } = require('./referralService');
    
    console.log(`Testing referral commission for user ${testUserId} with amount $${testAmount}`);
    
    // Test first action reward
    const firstActionResult = await processFirstActionReward(testUserId, 'purchase');
    console.log('First action result:', firstActionResult);
    
    // Test commission reward
    const commissionResult = await processCommissionReward(testUserId, testAmount);
    console.log('Commission result:', commissionResult);
    
    return {
      success: true,
      firstActionResult,
      commissionResult,
      message: `Test completed for user ${testUserId} with amount $${testAmount}`
    };
  } catch (error) {
    console.error('Error testing referral commission:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Create test referral relationship (for testing purposes)
 */
exports.testCreateReferralRelationship = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  // Only allow in development or for admin users
  const userData = await getUserData(context.auth.uid);
  if (!userData || (!userData.isAdmin && process.env.NODE_ENV === 'production')) {
    throw new functions.https.HttpsError('permission-denied', 'Test function not available');
  }
  
  const { referrerUid, referralCode } = data;
  const referredUid = context.auth.uid;
  
  try {
    const result = await handleReferralCodeUsage(referredUid, referralCode);
    console.log(`Test referral relationship created: ${referredUid} referred by ${referrerUid}`);
    return {
      success: true,
      result,
      message: 'Test referral relationship created successfully'
    };
  } catch (error) {
    console.error('Error creating test referral relationship:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
}); 