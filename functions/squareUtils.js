const axios = require('axios');
const admin = require('firebase-admin');
const crypto = require('crypto');
const functions = require('firebase-functions');

// Square API configuration
const SQUARE_ACCESS_TOKEN = functions.config().square.access_token;
const SQUARE_ENVIRONMENT = functions.config().square.environment || 'production';
const SQUARE_API_URL = SQUARE_ENVIRONMENT === 'production' 
  ? 'https://connect.squareup.com/v2' 
  : 'https://connect.squareupsandbox.com/v2';
const SQUARE_LOCATION_ID = functions.config().square.location_id;

console.log(`Square API initialized in ${SQUARE_ENVIRONMENT} mode`);
console.log(`Square API URL: ${SQUARE_API_URL}`);

// Create a payment with Square using axios
const createSquarePayment = async (sourceId, amount, packageId, userId) => {
  try {
    // Amount must be in cents/smallest currency unit
    const amountInCents = Math.round(amount * 100);
    
    // Create unique idempotency key (must be ≤45 chars for Square API)
    // Use shorter user ID hash + timestamp + random to stay under limit
    const userHash = crypto.createHash('md5').update(userId).digest('hex').substring(0, 8);
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
    const random = Math.random().toString(36).substring(2, 8); // 6 chars random
    const idempotencyKey = `${userHash}-${timestamp}-${random}`; // 8+8+6+2 = 24 chars
    
    // Create the payment request
    const payload = {
      source_id: sourceId,
      idempotency_key: idempotencyKey,
      amount_money: {
        amount: amountInCents,
        currency: 'USD'
      },
      autocomplete: true, // Process the payment immediately
      location_id: SQUARE_LOCATION_ID,
      note: `Token purchase: ${packageId}`
    };

    console.log(`Creating Square payment for ${amountInCents} cents`);
    console.log('Square API payload:', JSON.stringify(payload, null, 2));
    console.log('Square API URL:', SQUARE_API_URL);
    console.log('Square Location ID:', SQUARE_LOCATION_ID);
    console.log('Idempotency key length:', idempotencyKey.length);
    
    // Make the API call using axios
    const response = await axios.post(
      `${SQUARE_API_URL}/payments`, 
      payload,
      {
        headers: {
          'Square-Version': '2023-09-25',
          'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Square payment successful:', response.data);
    
    // Extract payment data from response
    const payment = response.data.payment;
    
    return {
      success: true,
      paymentId: payment.id,
      orderId: payment.order_id || null,
      receiptUrl: payment.receipt_url || null,
      status: payment.status,
      amount: amount,
      packageId
    };
  } catch (error) {
    console.error('Error creating Square payment:', error);
    
    // Log detailed error information
    if (error.response) {
      console.error('Square API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
      
      // Try to extract meaningful error message from Square API response
      if (error.response.data && error.response.data.errors) {
        const squareErrors = error.response.data.errors.map(err => 
          `${err.category}: ${err.code} - ${err.detail}`
        ).join('; ');
        throw new Error(`Square API Error: ${squareErrors}`);
      }
    } else if (error.request) {
      console.error('Square API Request Error - No response received:', error.request);
      throw new Error('No response received from Square API');
    } else {
      console.error('Square API Setup Error:', error.message);
    }
    
    throw new Error(error.message || 'Failed to process payment with Square');
  }
};

// Handle a successful Square payment
const handleSuccessfulSquarePayment = async (paymentResult, userId, orderData = {}) => {
  try {
    // Parse packageId to get the number of coins
    const packageId = paymentResult.packageId;
    const coinMatch = packageId.match(/(\d+)_coins/);
    
    if (!coinMatch) {
      throw new Error(`Invalid package ID format: ${packageId}`);
    }
    
    const baseCoins = parseInt(coinMatch[1], 10);
    if (isNaN(baseCoins)) {
      throw new Error(`Could not parse coin amount from package ID: ${packageId}`);
    }
    
    // Determine bonus coins based on the package
    let bonusCoins = 0;
    if (baseCoins === 10) bonusCoins = 1;
    else if (baseCoins === 25) bonusCoins = 3;
    else if (baseCoins === 50) bonusCoins = 7;
    else if (baseCoins === 100) bonusCoins = 15;
    
    const totalCoins = baseCoins + bonusCoins;
    const db = admin.firestore();
    
    // Start a batch operation
    const batch = db.batch();
    
    // Update user's token balance
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      throw new Error(`User ${userId} not found`);
    }
    
    const userData = userDoc.data();
    const currentBalance = userData.tokenBalance || 0;
    const purchasedTokens = userData.purchasedTokens || 0;
    
    batch.update(userRef, {
      tokenBalance: admin.firestore.FieldValue.increment(totalCoins),
      purchasedTokens: admin.firestore.FieldValue.increment(totalCoins)
    });
    
    // Record the transaction
    const transactionRef = db.collection('transactions').doc();
    batch.set(transactionRef, {
      userId,
      type: 'purchase',
      paymentMethod: 'square',
      paymentId: paymentResult.paymentId,
      packageId,
      amount: totalCoins, // Total coins awarded (for consistency with PayPal)
      baseAmount: baseCoins,
      bonusAmount: bonusCoins,
      totalAmount: totalCoins, // Keep for backward compatibility
      paymentAmount: paymentResult.amount, // Dollar amount paid (for referral commission)
      cost: paymentResult.amount, // Keep for backward compatibility
      previousBalance: currentBalance,
      newBalance: currentBalance + totalCoins,
      status: 'completed',
      receiptUrl: paymentResult.receiptUrl,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Commit the batch
    await batch.commit();
    
    console.log(`Added ${totalCoins} coins to user ${userId}`);
    
    // === Referral Logic (same as PayPal) ===
    if (orderData.referralCode) {
      try {
        const referralService = require('./referralService');
        const referralCode = orderData.referralCode.toUpperCase();
        const deviceId = orderData.deviceId || '';
        const userIp = orderData.userIp || '';
        const amount = paymentResult.amount; // Purchase amount in dollars
        
        // 1. Validate referral code
        const codeObj = await referralService.getReferralCode(referralCode);
        if (!codeObj || !codeObj.isActive) {
          console.log(`[Referral] Code ${referralCode} is invalid or inactive.`);
          return {
            success: true,
            userId,
            coinsAdded: totalCoins,
            newBalance: currentBalance + totalCoins
          };
        }
        
        // 2. Prevent self-referral
        if (codeObj.creatorUserId === userId) {
          console.log(`[Referral] User ${userId} attempted self-referral with code ${referralCode}.`);
          return {
            success: true,
            userId,
            coinsAdded: totalCoins,
            newBalance: currentBalance + totalCoins
          };
        }
        
        // 3. Prevent multiple uses by same user/device/IP
        const [priorByUser, priorByDevice, priorByIp] = await Promise.all([
          referralService.getReferralUsagesByUser(userId),
          deviceId ? referralService.getReferralUsagesByCode(referralCode) : Promise.resolve([]),
          userIp ? referralService.getReferralUsagesByCode(referralCode) : Promise.resolve([])
        ]);
        
        if (priorByUser.some(u => u.referralCode === referralCode)) {
          console.log(`[Referral] User ${userId} already used code ${referralCode}.`);
          return {
            success: true,
            userId,
            coinsAdded: totalCoins,
            newBalance: currentBalance + totalCoins
          };
        }
        
        if (deviceId && priorByDevice.some(u => u.deviceId === deviceId)) {
          console.log(`[Referral] Device ${deviceId} already used code ${referralCode}.`);
          return {
            success: true,
            userId,
            coinsAdded: totalCoins,
            newBalance: currentBalance + totalCoins
          };
        }
        
        if (userIp && priorByIp.some(u => u.userIp === userIp)) {
          console.log(`[Referral] IP ${userIp} already used code ${referralCode}.`);
          return {
            success: true,
            userId,
            coinsAdded: totalCoins,
            newBalance: currentBalance + totalCoins
          };
        }
        
        // 4. Calculate payout
        const payout = amount * codeObj.payoutRate;
        
        // 5. Log referral usage
        await referralService.logReferralUsage({
          userId,
          referralCode,
          coinPackage: packageId,
          amountSpent: amount,
          payoutGenerated: payout,
          timestamp: new Date().toISOString(),
          userIp,
          deviceId
        });
        
        // 6. Update referral code stats
        await referralService.updateReferralCode(referralCode, {
          uses: (codeObj.uses || 0) + 1,
          totalReferredAmount: (codeObj.totalReferredAmount || 0) + amount,
          totalEarned: (codeObj.totalEarned || 0) + payout
        });
        
        // 7. Update creator payout status
        let creatorPayout = await referralService.getCreatorPayoutStatus(codeObj.creatorUserId);
        if (!creatorPayout) {
          await referralService.setCreatorPayoutStatus({
            creatorUserId: codeObj.creatorUserId,
            payoutRequested: false,
            lastPaidOut: '',
            pendingAmount: payout,
            threshold: 20.00
          });
        } else {
          await referralService.updateCreatorPayoutStatus(codeObj.creatorUserId, {
            pendingAmount: (creatorPayout.pendingAmount || 0) + payout
          });
        }
        
        console.log(`[Referral] Processed referral for code ${referralCode}, user ${userId}, payout $${payout.toFixed(2)}`);
      } catch (err) {
        console.error('[Referral] Error processing referral:', err);
      }
    }
    // === End Referral Logic ===
    
    return {
      success: true,
      userId,
      coinsAdded: totalCoins,
      newBalance: currentBalance + totalCoins
    };
  } catch (error) {
    console.error('Error handling successful Square payment:', error);
    throw new Error(`Failed to credit coins: ${error.message}`);
  }
};

module.exports = {
  createSquarePayment,
  handleSuccessfulSquarePayment
};
