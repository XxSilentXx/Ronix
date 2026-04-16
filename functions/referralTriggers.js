const admin = require('firebase-admin');
const functions = require('firebase-functions');
const {
  REFERRAL_CONFIG,
  COLLECTIONS,
  initializeUserReferralCode,
  processFirstActionReward,
  processCommissionReward,
  getDb
} = require('./referralService');

/**
 * Trigger when a purchase transaction is created
 * Automatically processes referral rewards
 */
exports.onReferralPurchaseCreate = functions.firestore
  .document('transactions/{transactionId}')
  .onCreate(async (snap, context) => {
    try {
      const transaction = snap.data();
      const transactionId = context.params.transactionId;
      
      console.log(`[Referral Trigger] Transaction created: ${transactionId}`, {
        type: transaction.type,
        userId: transaction.userId,
        amount: transaction.amount,
        paymentAmount: transaction.paymentAmount,
        cost: transaction.cost
      });
      
      // Only process purchase transactions
      if (transaction.type !== 'purchase') {
        console.log(`[Referral Trigger] Skipping non-purchase transaction: ${transaction.type}`);
        return;
      }
      
      const userUid = transaction.userId;
      // Handle different payment method field names:
      // PayPal: paymentAmount (dollar amount), amount (coin amount)
      // Square: cost (dollar amount), totalAmount (coin amount)
      const dollarAmount = transaction.paymentAmount || transaction.cost;
      
      if (!dollarAmount) {
        console.log(`[Referral Trigger] No dollar amount found in transaction ${transactionId}`);
        return;
      }
      
      console.log(`[Referral Trigger] Processing referral rewards for purchase ${transactionId} by user ${userUid}, amount: $${dollarAmount}`, {
        paymentMethod: transaction.paymentMethod,
        paymentAmount: transaction.paymentAmount,
        cost: transaction.cost,
        amount: transaction.amount,
        totalAmount: transaction.totalAmount
      });
      
      // Process first action reward (if applicable)
      console.log(`[Referral Trigger] Attempting to process first action reward for user ${userUid}`);
      const firstActionResult = await processFirstActionReward(userUid, 'purchase');
      if (firstActionResult) {
        console.log(`[Referral Trigger] First purchase bonus awarded:`, firstActionResult);
      } else {
        console.log(`[Referral Trigger] No first purchase bonus awarded`);
      }
      
      // Process commission reward (if applicable)
      console.log(`[Referral Trigger] Attempting to process commission reward for user ${userUid}, amount: $${dollarAmount}`);
      const commissionResult = await processCommissionReward(userUid, dollarAmount);
      if (commissionResult) {
        console.log(`[Referral Trigger] Commission reward awarded:`, commissionResult);
      } else {
        console.log(`[Referral Trigger] No commission reward awarded`);
      }
      
      // Log the processing attempt
      const db = getDb();
      await db.collection('referralProcessingLogs').add({
        type: 'purchase',
        transactionId: transactionId,
        userUid: userUid,
        amount: dollarAmount,
        firstActionResult: firstActionResult,
        commissionResult: commissionResult,
        processedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`[Referral Trigger] Completed processing for transaction ${transactionId}`);
      
    } catch (error) {
      console.error(`Error processing referral rewards for purchase ${context.params.transactionId}:`, error);
      
      // Log the error for debugging
      const db = getDb();
      await db.collection('referralProcessingErrors').add({
        type: 'purchase',
        transactionId: context.params.transactionId,
        error: error.message,
        stack: error.stack,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });

/**
 * Trigger when user document is created (auto-initialize)
 * Automatically sets up referral system for new users
 */
exports.onReferralUserCreate = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap, context) => {
    try {
      const userId = context.params.userId;
      const userData = snap.data();
      
      console.log(`[Referral Trigger] New user created: ${userId}`);
      
      // Initialize referral system for new user if they don't have a referral code
      if (!userData.referralCode) {
        console.log(`[Referral Trigger] Initializing referral system for user ${userId}`);
        const referralCode = await initializeUserReferralCode(userId);
        console.log(`[Referral Trigger] Initialized referral code ${referralCode} for user ${userId}`);
      } else {
        console.log(`[Referral Trigger] User ${userId} already has referral code: ${userData.referralCode}`);
      }
      
    } catch (error) {
      console.error(`Error initializing referral system for user ${context.params.userId}:`, error);
      
      // Log the error for debugging
      const db = getDb();
      await db.collection('referralProcessingErrors').add({
        type: 'user_creation',
        userId: context.params.userId,
        error: error.message,
        stack: error.stack,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });

/**
 * Trigger when user document is updated (handle referral code usage)
 * Logs when referral relationships are established
 */
exports.onReferralUserUpdate = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    try {
      const before = change.before.data();
      const after = change.after.data();
      const userId = context.params.userId;
      
      // Check if referral relationship was just established
      if (!before.referredBy && after.referredBy) {
        console.log(`[Referral Trigger] User ${userId} was referred by ${after.referredBy} (${after.referredByUid})`);
        
        // Log the referral relationship establishment
        const db = getDb();
        await db.collection('referralProcessingLogs').add({
          type: 'referral_established',
          userId: userId,
          referralCode: after.referredBy,
          referrerUid: after.referredByUid,
          processedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`[Referral Trigger] Referral relationship logged for user ${userId}`);
      }
      
      // Check if referral code was customized
      if (before.referralCode !== after.referralCode && before.referralCode) {
        console.log(`[Referral Trigger] User ${userId} changed referral code from ${before.referralCode} to ${after.referralCode}`);
        
        // Log the code change
        const db = getDb();
        await db.collection('referralProcessingLogs').add({
          type: 'code_customized',
          userId: userId,
          oldCode: before.referralCode,
          newCode: after.referralCode,
          processedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      
    } catch (error) {
      console.error(`Error handling user update for referral system ${context.params.userId}:`, error);
      
      // Log the error for debugging
      const db = getDb();
      await db.collection('referralProcessingErrors').add({
        type: 'user_update',
        userId: context.params.userId,
        error: error.message,
        stack: error.stack,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });

/**
 * Scheduled function to clean up expired referral rewards
 * Runs every 24 hours to mark expired rewards as inactive
 */
exports.cleanupExpiredReferralRewards = functions.pubsub
  .schedule('every 24 hours')
  .timeZone('America/New_York')
  .onRun(async (context) => {
    try {
      console.log('[Referral Cleanup] Starting expired referral rewards cleanup');
      
      const db = getDb();
      const now = new Date();
      
      // Find expired referral rewards
      const expiredQuery = await db.collection(COLLECTIONS.REFERRAL_REWARDS)
        .where('expiresAt', '<', now)
        .where('status', '==', 'active')
        .get();
      
      if (expiredQuery.empty) {
        console.log('[Referral Cleanup] No expired referral rewards found');
        return;
      }
      
      const batch = db.batch();
      let count = 0;
      
      expiredQuery.forEach(doc => {
        batch.update(doc.ref, { 
          status: 'expired',
          expiredAt: admin.firestore.FieldValue.serverTimestamp()
        });
        count++;
      });
      
      if (count > 0) {
        await batch.commit();
        console.log(`[Referral Cleanup] Marked ${count} referral rewards as expired`);
        
        // Log the cleanup operation
        await db.collection('referralProcessingLogs').add({
          type: 'cleanup',
          expiredCount: count,
          processedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      
    } catch (error) {
      console.error('Error cleaning up expired referral rewards:', error);
      
      // Log the error for debugging
      const db = getDb();
      await db.collection('referralProcessingErrors').add({
        type: 'cleanup',
        error: error.message,
        stack: error.stack,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });

/**
 * Scheduled function to generate referral system statistics
 * Runs daily to update system-wide referral stats
 */
exports.generateReferralStats = functions.pubsub
  .schedule('0 2 * * *') // Run at 2 AM every day
  .timeZone('America/New_York')
  .onRun(async (context) => {
    try {
      console.log('[Referral Stats] Starting referral statistics generation');
      
      const db = getDb();
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      // Get daily stats
      const dailyUsageQuery = await db.collection(COLLECTIONS.REFERRAL_USAGE)
        .where('usedAt', '>=', startOfDay)
        .get();
      
      const dailyReferrals = dailyUsageQuery.size;
      
      // Get total active referral rewards
      const activeRewardsQuery = await db.collection(COLLECTIONS.REFERRAL_REWARDS)
        .where('status', '==', 'active')
        .get();
      
      const activeRewards = activeRewardsQuery.size;
      
      // Get total users with referral codes
      const usersWithCodesQuery = await db.collection(COLLECTIONS.USERS)
        .where('referralCode', '!=', null)
        .get();
      
      const totalUsers = usersWithCodesQuery.size;
      
      // Calculate total earnings and commissions
      let totalEarnings = 0;
      let totalCommissions = 0;
      
      usersWithCodesQuery.forEach(doc => {
        const userData = doc.data();
        totalEarnings += userData.referralEarnings || 0;
        totalCommissions += userData.referralCommission || 0;
      });
      
      // Save daily stats
      await db.collection('referralDailyStats').add({
        date: startOfDay,
        dailyReferrals,
        activeRewards,
        totalUsers,
        totalEarnings,
        totalCommissions,
        generatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`[Referral Stats] Generated daily stats: ${dailyReferrals} referrals, ${activeRewards} active rewards, ${totalUsers} total users`);
      
    } catch (error) {
      console.error('Error generating referral statistics:', error);
      
      // Log the error for debugging
      const db = getDb();
      await db.collection('referralProcessingErrors').add({
        type: 'stats_generation',
        error: error.message,
        stack: error.stack,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });

/**
 * Trigger to send notifications when referral rewards are earned
 * This can be extended to send emails, push notifications, etc.
 */
exports.onReferralRewardEarned = functions.firestore
  .document('tokenTransactions/{transactionId}')
  .onCreate(async (snap, context) => {
    try {
      const transaction = snap.data();
      const transactionId = context.params.transactionId;
      
      // Only process referral-related transactions
      if (!transaction.source || 
          (transaction.source !== 'first_purchase_bonus' && transaction.source !== 'commission')) {
        return;
      }
      
      console.log(`[Referral Notification] Referral reward earned: ${transactionId}`, {
        uid: transaction.uid,
        type: transaction.type,
        amount: transaction.amount,
        source: transaction.source
      });
      
      // Here you can add notification logic:
      // - Send email notifications
      // - Create in-app notifications
      // - Send push notifications
      // - Update user notification preferences
      
      // For now, just log the notification
      const db = getDb();
      await db.collection('referralProcessingLogs').add({
        type: 'reward_notification',
        transactionId: transactionId,
        userUid: transaction.uid,
        rewardType: transaction.source,
        amount: transaction.amount,
        processedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`[Referral Notification] Notification logged for reward ${transactionId}`);
      
    } catch (error) {
      console.error(`Error processing referral reward notification ${context.params.transactionId}:`, error);
      
      // Log the error for debugging
      const db = getDb();
      await db.collection('referralProcessingErrors').add({
        type: 'reward_notification',
        transactionId: context.params.transactionId,
        error: error.message,
        stack: error.stack,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  }); 