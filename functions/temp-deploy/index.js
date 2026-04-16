const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

// Initialize Firebase Admin SDK if not already initialized
try {
  admin.initializeApp();
} catch (e) {
  console.log('Firebase admin already initialized');
}

// Create a withdrawal request
exports.createWithdrawalRequest = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  const { amountTokens, amountUSD, paypalEmail } = data;
  const userId = context.auth.uid;
  
  // Enforce minimum withdrawal
  if (!amountTokens || amountTokens < 1000) {
    throw new functions.https.HttpsError('failed-precondition', 'You need at least 1,000 tokens ($10) to withdraw.');
  }
  
  // Calculate withdrawal fee (5%)
  const feePercent = 0.05;
  const feeUSD = Number((amountUSD * feePercent).toFixed(2));
  const netUSD = Number((amountUSD - feeUSD).toFixed(2));
  
  try {
    // Save withdrawal request with fee and net amount
    const requestRef = await admin.firestore().collection('withdrawalRequests').add({
      userId,
      amountTokens,
      amountUSD,
      paypalEmail,
      feeUSD,
      netUSD,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // Save fee to siteEarnings
    await admin.firestore().collection('siteEarnings').add({
      type: 'withdrawal_fee',
      userId,
      amount: feeUSD,
      originalAmount: amountUSD,
      withdrawalRequestId: requestRef.id,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    return { success: true, requestId: requestRef.id };
  } catch (error) {
    console.error('Error creating withdrawal request:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Admin function to process withdrawal (approve and pay)
exports.processWithdrawalRequest = functions.https.onCall(async (data, context) => {
  try {
    console.log('[processWithdrawalRequest] Called with data:', data, 'Context:', context.auth ? context.auth.uid : null);

    if (!context.auth) {
      console.error('[processWithdrawalRequest] No auth');
      throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }
    
    // Verify admin status
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!userDoc.exists || !userDoc.data().isAdmin) {
      console.error('[processWithdrawalRequest] User is not admin:', context.auth.uid);
      throw new functions.https.HttpsError('permission-denied', 'Only admins can process withdrawals.');
    }
    
    const { requestId, adminNote } = data;
    console.log('[processWithdrawalRequest] requestId:', requestId);

    if (!requestId) {
      console.error('[processWithdrawalRequest] No requestId provided');
      throw new functions.https.HttpsError('invalid-argument', 'Request ID is required.');
    }

    const requestDoc = await admin.firestore().collection('withdrawalRequests').doc(requestId).get();
    if (!requestDoc.exists) {
      console.error('[processWithdrawalRequest] Withdrawal request not found:', requestId);
      throw new functions.https.HttpsError('not-found', 'Request not found.');
    }
    const req = requestDoc.data();
    console.log('[processWithdrawalRequest] requestData:', req);
    
    // Validate required fields
    if (!req.userId) {
      console.error('[processWithdrawalRequest] Missing userId in request data');
      throw new functions.https.HttpsError('invalid-argument', 'Invalid withdrawal request: missing userId');
    }
    if (!req.amountTokens || isNaN(req.amountTokens)) {
      console.error('[processWithdrawalRequest] Missing or invalid amountTokens:', req.amountTokens);
      throw new functions.https.HttpsError('invalid-argument', 'Invalid withdrawal request: missing or invalid amountTokens');
    }
    
    if (req.status !== 'pending') {
      console.error('[processWithdrawalRequest] Request already processed. Status:', req.status);
      throw new functions.https.HttpsError('failed-precondition', 'Request already processed.');
    }

  try {
    // Simulate payout (add logs for each step)
    console.log('[processWithdrawalRequest] Simulating payout for', req.paypalEmail, 'Amount:', req.netUSD);
    // ... (simulate payout logic here) ...

    // Update Firestore
    await admin.firestore().collection('withdrawalRequests').doc(requestId).update({
      status: 'paid',
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      adminNote: adminNote || '',
      payoutBatchId: 'SIMULATED_BATCH_ID'
    });
    console.log('[processWithdrawalRequest] Withdrawal request marked as paid');

    // Deduct tokens from user balance
    const userRef = db.collection('users').doc(req.userId);
    const userSnapshot = await userRef.get();
    if (userSnapshot.exists) {
      const userData = userSnapshot.data();
      const currentBalance = userData.tokenBalance || 0;
      const newBalance = Math.max(0, currentBalance - req.amountTokens);
      await userRef.update({
        tokenBalance: newBalance
      });
      console.log('[processWithdrawalRequest] User balance updated:', newBalance);
      // Record transaction
      await db.collection('transactions').add({
        userId: req.userId,
        type: 'withdrawal',
        amount: -req.amountTokens, // Negative amount for withdrawal
        paypalEmail: req.paypalEmail,
        amountUSD: req.amountUSD,
        feeUSD: req.feeUSD,
        netUSD: req.netUSD,
        withdrawalRequestId: requestId,
        adminId: context.auth.uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('[processWithdrawalRequest] Transaction recorded');
    } else {
      console.error('[processWithdrawalRequest] User not found for balance update:', req.userId);
    }

    return { 
      success: true, 
      payout: { batchId: 'SIMULATED_BATCH_ID' }
    };
  } catch (error) {
    console.error('PayPal payout error:', error.response ? error.response.data : error);
    // Update request status to failed with error message
    await admin.firestore().collection('withdrawalRequests').doc(requestId).update({
      status: 'failed',
      error: error.message,
      errorDetails: error.response ? JSON.stringify(error.response.data) : null,
      errorAt: admin.firestore.FieldValue.serverTimestamp()
    });
    throw new functions.https.HttpsError('internal', `PayPal payout failed: ${error.message}`);
  }
  } catch (error) {
    console.error('[processWithdrawalRequest] Unexpected error:', error);
    if (error.code) {
      // Re-throw Firebase errors
      throw error;
    } else {
      // Wrap other errors
      throw new functions.https.HttpsError('internal', `Internal error: ${error.message}`);
    }
  }
}); 