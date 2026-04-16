const admin = require('firebase-admin');

// Sponsorship configuration - Updated for full flexibility
const SPONSORSHIP_RULES = {
  // Full flexibility: sponsor can choose 0-100%
  MIN_SPONSOR_SHARE: 0,
  MAX_SPONSOR_SHARE: 100,
  
  // Minimum and maximum for sponsored player (inverse of sponsor)
  MIN_SPONSORED_SHARE: 0,
  MAX_SPONSORED_SHARE: 100,
  
  // Default split (sponsor gets 70%, sponsored gets 30%)
  DEFAULT_SPONSOR_SHARE: 70,
  DEFAULT_SPONSORED_SHARE: 30,
  
  // Maximum number of players one person can sponsor
  MAX_SPONSORSHIPS_PER_USER: 3
};

/**
 * Process sponsorship payments when a wager is created/joined
 */
async function processSponsorshipPayments(wagerData, sponsorships) {
  const db = admin.firestore();
  const batch = db.batch();
  
  let totalSponsorshipCost = 0;
  const processedSponsorships = [];
  
  for (const sponsorship of sponsorships) {
    const { sponsorId, sponsoredUserId, amount, sponsorShare, sponsoredShare } = sponsorship;
    
    // Validate sponsorship
    if (sponsorShare < SPONSORSHIP_RULES.MIN_SPONSORED_SHARE || 
        sponsorShare > SPONSORSHIP_RULES.MAX_SPONSOR_SHARE) {
      throw new Error(`Invalid sponsor share: ${sponsorShare}%`);
    }
    
    // Get sponsor's balance
    const sponsorRef = db.collection('users').doc(sponsorId);
    const sponsorDoc = await sponsorRef.get();
    
    if (!sponsorDoc.exists) {
      throw new Error(`Sponsor ${sponsorId} not found`);
    }
    
    const sponsorBalance = sponsorDoc.data().tokenBalance || 0;
    if (sponsorBalance < amount) {
      throw new Error(`Sponsor ${sponsorId} has insufficient balance`);
    }
    
    // Deduct from sponsor's balance
    batch.update(sponsorRef, {
      tokenBalance: admin.firestore.FieldValue.increment(-amount)
    });
    
    // Create sponsorship transaction
    const sponsorTransactionRef = db.collection('transactions').doc();
    batch.set(sponsorTransactionRef, {
      userId: sponsorId,
      type: 'sponsorship_payment',
      amount: -amount,
      reason: `Sponsored ${sponsoredUserId} for wager ${wagerData.id}`,
      wagerId: wagerData.id,
      sponsoredUserId: sponsoredUserId,
      timestamp: admin.firestore.Timestamp.now()
    });
    
    // Create sponsored transaction (showing they participated without paying)
    const sponsoredTransactionRef = db.collection('transactions').doc();
    batch.set(sponsoredTransactionRef, {
      userId: sponsoredUserId,
      type: 'sponsored_entry',
      amount: 0, // They didn't pay
      reason: `Entry sponsored by ${sponsorId} for wager ${wagerData.id}`,
      wagerId: wagerData.id,
      sponsorId: sponsorId,
      timestamp: admin.firestore.Timestamp.now()
    });
    
    totalSponsorshipCost += amount;
    processedSponsorships.push({
      sponsorId,
      sponsoredUserId,
      amount,
      sponsorShare,
      sponsoredShare
    });
  }
  
  await batch.commit();
  
  return {
    totalCost: totalSponsorshipCost,
    sponsorships: processedSponsorships
  };
}

/**
 * Distribute winnings with sponsorship considerations
 */
async function distributeSponsoredWinnings(wagerData, winnerId) {
  const db = admin.firestore();
  const batch = db.batch();
  
  const { amount, sponsorships = [] } = wagerData;
  const totalPrize = amount * 2; // Assuming 1v1 for simplicity, adjust for team sizes
  
  // Find if the winner was sponsored
  const winnerSponsorship = sponsorships.find(s => s.sponsoredUserId === winnerId);
  
  if (winnerSponsorship) {
    // Winner was sponsored - split winnings between sponsor and sponsored player
    const { sponsorId, sponsorShare, sponsoredShare } = winnerSponsorship;
    
    const sponsorWinnings = Math.floor(totalPrize * (sponsorShare / 100));
    const sponsoredWinnings = totalPrize - sponsorWinnings;
    
    // Give winnings to sponsor
    const sponsorRef = db.collection('users').doc(sponsorId);
    batch.update(sponsorRef, {
      tokenBalance: admin.firestore.FieldValue.increment(sponsorWinnings),
      wagerEarnings: admin.firestore.FieldValue.increment(sponsorWinnings)
    });
    
    // Give winnings to sponsored player
    const sponsoredRef = db.collection('users').doc(winnerId);
    batch.update(sponsoredRef, {
      tokenBalance: admin.firestore.FieldValue.increment(sponsoredWinnings),
      wagerEarnings: admin.firestore.FieldValue.increment(sponsoredWinnings)
    });
    
    // Create transactions
    batch.set(db.collection('transactions').doc(), {
      userId: sponsorId,
      type: 'sponsorship_winnings',
      amount: sponsorWinnings,
      reason: `Sponsorship winnings from ${winnerId} winning wager ${wagerData.id}`,
      wagerId: wagerData.id,
      sponsoredUserId: winnerId,
      timestamp: admin.firestore.Timestamp.now()
    });
    
    batch.set(db.collection('transactions').doc(), {
      userId: winnerId,
      type: 'sponsored_winnings',
      amount: sponsoredWinnings,
      reason: `Sponsored winnings from wager ${wagerData.id}`,
      wagerId: wagerData.id,
      sponsorId: sponsorId,
      timestamp: admin.firestore.Timestamp.now()
    });
    
  } else {
    // Winner was not sponsored - they get full winnings (existing logic)
    const winnerRef = db.collection('users').doc(winnerId);
    batch.update(winnerRef, {
      tokenBalance: admin.firestore.FieldValue.increment(totalPrize),
      wagerEarnings: admin.firestore.FieldValue.increment(totalPrize)
    });
    
    batch.set(db.collection('transactions').doc(), {
      userId: winnerId,
      type: 'reward',
      amount: totalPrize,
      reason: `Won wager match ${wagerData.id}`,
      wagerId: wagerData.id,
      timestamp: admin.firestore.Timestamp.now()
    });
  }
  
  await batch.commit();
  
  return {
    winnerId,
    totalPrize,
    wasSponsored: !!winnerSponsorship,
    sponsorship: winnerSponsorship
  };
}

/**
 * Handle comprehensive refunds for party wagers when cancelled
 * This handles both sponsored and non-sponsored party members correctly
 */
async function refundPartyWager(wagerData) {
  const db = admin.firestore();
  const batch = db.batch();
  
  console.log(`[refundPartyWager] ===== STARTING PARTY WAGER REFUND =====`);
  console.log(`[refundPartyWager] Processing refunds for wager ${wagerData.id || 'unknown'}`);
  console.log(`[refundPartyWager] Complete wager data received:`, JSON.stringify(wagerData, null, 2));
  console.log(`[refundPartyWager] Wager data summary:`, {
    isPartyWager: wagerData.isPartyWager,
    amount: wagerData.amount,
    hostId: wagerData.hostId,
    guestId: wagerData.guestId,
    participants: wagerData.participants,
    partyMembers: wagerData.partyMembers,
    guestPartyMembers: wagerData.guestPartyMembers,
    sponsorships: wagerData.sponsorships?.length || 0,
    guestSponsorships: wagerData.guestSponsorships?.length || 0,
    partySize: wagerData.partySize
  });
  
  const { sponsorships = [], guestSponsorships = [], amount } = wagerData;
  const allSponsorships = [...sponsorships, ...guestSponsorships];
  const wagerId = wagerData.id || 'unknown';
  
  // Build a robust participants list
  let allParticipantIds = [];
  if (Array.isArray(wagerData.participants) && wagerData.participants.length > 0) {
    allParticipantIds = wagerData.participants;
  } else {
    const hostParty = Array.isArray(wagerData.partyMembers) ? wagerData.partyMembers.map(m => m.id || m) : [];
    const guestParty = Array.isArray(wagerData.guestPartyMembers) ? wagerData.guestPartyMembers.map(m => m.id || m) : [];
    allParticipantIds = [...new Set([...hostParty, ...guestParty])];
  }
  console.log(`[refundPartyWager] Using robust participant list:`, allParticipantIds);
  if (!allParticipantIds || allParticipantIds.length === 0) {
    console.error(`[refundPartyWager] ERROR: No participants found for refund!`);
  }
  
  // Check if we have a valid wager ID
  if (wagerId === 'unknown') {
    console.error(`[refundPartyWager]  No valid wager ID found in wager data!`);
    console.error(`[refundPartyWager] Available keys in wagerData:`, Object.keys(wagerData));
    throw new Error('No valid wager ID found for refund processing');
  }
  
  // Get all transactions for this wager to understand who paid what
  console.log(`[refundPartyWager] Querying transactions for wagerId: ${wagerId}`);
  const transactionsQuery = await db.collection('transactions')
    .where('wagerId', '==', wagerId)
    .get();
  
  console.log(`[refundPartyWager] Transaction query completed. Found ${transactionsQuery.docs.length} transactions`);
  
  const wagerTransactions = {};
  const allTransactions = [];
  
  transactionsQuery.docs.forEach(doc => {
    const transaction = doc.data();
    const userId = transaction.userId;
    
    // Log each transaction for debugging
    console.log(`[refundPartyWager] Transaction found:`, {
      id: doc.id,
      userId: userId,
      type: transaction.type,
      amount: transaction.amount,
      reason: transaction.reason,
      timestamp: transaction.timestamp,
      sponsoredUserId: transaction.sponsoredUserId,
      sponsorId: transaction.sponsorId
    });
    
    if (!wagerTransactions[userId]) {
      wagerTransactions[userId] = [];
    }
    wagerTransactions[userId].push({
      id: doc.id,
      ...transaction
    });
    
    allTransactions.push({
      id: doc.id,
      ...transaction
    });
  });
  
  console.log(`[refundPartyWager] Found ${transactionsQuery.docs.length} transactions for wager ${wagerId}`);
  console.log(`[refundPartyWager] Transactions grouped by user:`, Object.keys(wagerTransactions).map(userId => ({
    userId,
    transactionCount: wagerTransactions[userId].length,
    transactionTypes: wagerTransactions[userId].map(t => t.type)
  })));
  console.log(`[refundPartyWager] All transactions:`, allTransactions);
  
  // Process refunds based on who actually paid
  const refundedUsers = new Set();
  const refundLog = [];
  
  console.log(`[refundPartyWager] ===== PROCESSING REFUNDS =====`);
  console.log(`[refundPartyWager] All sponsorships to process:`, allSponsorships);
  console.log(`[refundPartyWager] Participants to check:`, allParticipantIds);
  
  // 1. Handle sponsorship refunds - sponsors get their sponsorship money back
  console.log(`[refundPartyWager] Processing sponsorships:`, JSON.stringify(allSponsorships, null, 2));
  
  // Track sponsorship amounts by sponsor to handle combined transactions
  const sponsorshipAmountsBySponsor = {};
  for (const sponsorship of allSponsorships) {
    const { sponsorId, amount: sponsorshipAmount } = sponsorship;
    if (!sponsorshipAmountsBySponsor[sponsorId]) {
      sponsorshipAmountsBySponsor[sponsorId] = 0;
    }
    sponsorshipAmountsBySponsor[sponsorId] += sponsorshipAmount;
  }
  
  console.log(`[refundPartyWager] Sponsorship amounts by sponsor:`, sponsorshipAmountsBySponsor);
  
  for (const sponsorship of allSponsorships) {
    const { sponsorId, sponsoredUserId, amount: sponsorshipAmount } = sponsorship;
    
    console.log(`[refundPartyWager] Processing sponsorship refund: ${sponsorId} sponsored ${sponsoredUserId} for ${sponsorshipAmount}`);
    
    // Find the sponsorship payment transaction (separate transaction)
    const sponsorTransactions = wagerTransactions[sponsorId] || [];
    const sponsorshipPayment = sponsorTransactions.find(t => 
      t.type === 'sponsorship_payment' && t.sponsoredUserId === sponsoredUserId
    );
    
    if (sponsorshipPayment) {
      // Refund the sponsor (separate sponsorship transaction exists)
      const sponsorRef = db.collection('users').doc(sponsorId);
      batch.update(sponsorRef, {
        tokenBalance: admin.firestore.FieldValue.increment(sponsorshipAmount)
      });
      
      // Remove the original sponsorship payment transaction
      batch.delete(db.collection('transactions').doc(sponsorshipPayment.id));
      
      refundedUsers.add(sponsorId);
      refundLog.push(`Refunded sponsor ${sponsorId}: ${sponsorshipAmount} tokens for sponsoring ${sponsoredUserId} (separate transaction)`);
      
      console.log(`[refundPartyWager] Refunded sponsor ${sponsorId}: ${sponsorshipAmount} tokens (separate transaction)`);
    } else {
      console.log(`[refundPartyWager] No separate sponsorship payment transaction found for sponsor ${sponsorId}, will handle with combined wager_entry transaction`);
    }
    
    // Sponsored users don't get refunded because they didn't pay
    refundLog.push(`Sponsored user ${sponsoredUserId}: No refund (was sponsored by ${sponsorId})`);
  }
  
  // 2. Handle regular entry fee refunds for non-sponsored participants
  const sponsoredUserIds = new Set(allSponsorships.map(s => s.sponsoredUserId));
  
  console.log(`[refundPartyWager] ===== PROCESSING REGULAR ENTRY FEES =====`);
  console.log(`[refundPartyWager] Sponsored user IDs:`, Array.from(sponsoredUserIds));
  console.log(`[refundPartyWager] Processing ${allParticipantIds.length} participants for entry fee refunds...`);
  
  for (const userId of allParticipantIds) {
    if (sponsoredUserIds.has(userId)) {
      console.log(`[refundPartyWager] Skipping refund for sponsored user: ${userId}`);
      continue;
    }
    if (refundedUsers.has(userId)) {
      console.log(`[refundPartyWager] Skipping already refunded user: ${userId}`);
      continue;
    }
    
    // Find their wager entry transaction
    const userTransactions = wagerTransactions[userId] || [];
    const entryTransaction = userTransactions.find(t => t.type === 'wager_entry');
    
    if (entryTransaction) {
      console.log(`[refundPartyWager] Refunding user: ${userId} with transaction:`, entryTransaction);
      // Check if this user is a sponsor with combined transaction (entry fee + sponsorship)
      const sponsorshipAmount = sponsorshipAmountsBySponsor[userId] || 0;
      const totalRefundAmount = Math.abs(entryTransaction.amount); // Use actual transaction amount
      
      console.log(`[refundPartyWager] User ${userId} transaction analysis:`, {
        transactionAmount: entryTransaction.amount,
        sponsorshipAmount: sponsorshipAmount,
        totalRefundAmount: totalRefundAmount,
        isSponsor: sponsorshipAmount > 0
      });
      
      // Refund the full amount they paid (entry fee + any sponsorships)
      const userRef = db.collection('users').doc(userId);
      batch.update(userRef, {
        tokenBalance: admin.firestore.FieldValue.increment(totalRefundAmount)
      });
      
      // Remove the original entry transaction
      batch.delete(db.collection('transactions').doc(entryTransaction.id));
      
      refundedUsers.add(userId);
      
      if (sponsorshipAmount > 0) {
        refundLog.push(`Refunded sponsor ${userId}: ${totalRefundAmount} tokens (${amount} entry fee + ${sponsorshipAmount} sponsorship)`);
        console.log(`[refundPartyWager] Refunded sponsor ${userId}: ${totalRefundAmount} tokens (${amount} entry + ${sponsorshipAmount} sponsorship)`);
      } else {
        refundLog.push(`Refunded participant ${userId}: ${totalRefundAmount} tokens (entry fee)`);
        console.log(`[refundPartyWager] Refunded participant ${userId}: ${totalRefundAmount} tokens (entry fee)`);
      }
    } else {
      console.warn(`[refundPartyWager] No entry transaction found for participant ${userId}`);
      refundLog.push(`Warning: No entry transaction found for participant ${userId}`);
    }
  }
  
  // 3. Handle any remaining transactions that might have been missed
  for (const [userId, transactions] of Object.entries(wagerTransactions)) {
    if (refundedUsers.has(userId)) continue;
    
    for (const transaction of transactions) {
      if (transaction.type === 'wager_entry' && transaction.amount < 0) {
        // This user paid an entry fee but wasn't in our participants list
        const userRef = db.collection('users').doc(userId);
        batch.update(userRef, {
          tokenBalance: admin.firestore.FieldValue.increment(-transaction.amount) // Negate because transaction.amount is negative
        });
        
        // Remove the transaction
        batch.delete(db.collection('transactions').doc(transaction.id));
        
        refundedUsers.add(userId);
        refundLog.push(`Refunded missed participant ${userId}: ${-transaction.amount} tokens`);
        
        console.log(`[refundPartyWager] Refunded missed participant ${userId}: ${-transaction.amount} tokens`);
      }
    }
  }
  
  console.log(`[refundPartyWager] ===== COMMITTING REFUNDS =====`);
  console.log(`[refundPartyWager] About to commit batch with refunds for users:`, Array.from(refundedUsers));
  console.log(`[refundPartyWager] Refund log:`, refundLog);
  
  try {
    await batch.commit();
    console.log(`[refundPartyWager]  Batch commit successful!`);
  } catch (commitError) {
    console.error(`[refundPartyWager]  Batch commit failed:`, commitError);
    throw commitError;
  }
  
  console.log(`[refundPartyWager] Refund completed for wager ${wagerId}. Refunded ${refundedUsers.size} users.`);
  console.log(`[refundPartyWager] ===== PARTY WAGER REFUND COMPLETE =====`);
  
  return {
    refundedUsers: Array.from(refundedUsers),
    refundLog,
    totalRefunded: refundedUsers.size
  };
}

/**
 * Handle sponsorship refunds when wagers are cancelled (legacy function for backward compatibility)
 */
async function refundSponsorships(wagerData) {
  console.log(`[refundSponsorships] ===== REFUND SPONSORSHIPS CALLED =====`);
  console.log(`[refundSponsorships] Wager data received:`, {
    id: wagerData.id,
    isPartyWager: wagerData.isPartyWager,
    sponsorships: wagerData.sponsorships?.length || 0,
    guestSponsorships: wagerData.guestSponsorships?.length || 0,
    participants: wagerData.participants?.length || 0
  });
  
  // For party wagers, use the comprehensive refund function
  if (wagerData.isPartyWager) {
    console.log(`[refundSponsorships]  Detected party wager, calling refundPartyWager`);
    return await refundPartyWager(wagerData);
  }
  
  console.log(`[refundSponsorships]  Not a party wager, using original logic`);
  // For regular wagers, use the original logic
  const db = admin.firestore();
  const batch = db.batch();
  
  const { sponsorships = [] } = wagerData;
  
  for (const sponsorship of sponsorships) {
    const { sponsorId, amount } = sponsorship;
    
    // Refund sponsor
    const sponsorRef = db.collection('users').doc(sponsorId);
    batch.update(sponsorRef, {
      tokenBalance: admin.firestore.FieldValue.increment(amount)
    });
    
    // Create refund transaction
    batch.set(db.collection('transactions').doc(), {
      userId: sponsorId,
      type: 'sponsorship_refund',
      amount: amount,
      reason: `Sponsorship refund for cancelled wager ${wagerData.id}`,
      wagerId: wagerData.id,
      timestamp: admin.firestore.Timestamp.now()
    });
    
    // Remove the original sponsorship payment transaction
    const sponsorshipTransactionQuery = await db.collection('transactions')
      .where('userId', '==', sponsorId)
      .where('wagerId', '==', wagerData.id)
      .where('type', '==', 'sponsorship_payment')
      .get();
    
    sponsorshipTransactionQuery.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
  }
  
  await batch.commit();
}

module.exports = {
  SPONSORSHIP_RULES,
  processSponsorshipPayments,
  distributeSponsoredWinnings,
  refundSponsorships,
  refundPartyWager
}; 