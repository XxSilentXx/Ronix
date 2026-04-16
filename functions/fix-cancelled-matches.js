const admin = require('firebase-admin');

// Initialize Firebase Admin
try {
  const serviceAccount = require('./service-account-key.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.log('Using default credentials (likely in cloud environment)');
  admin.initializeApp();
}

const db = admin.firestore();

async function fixCancelledMatches() {
  try {
    console.log('Finding cancelled matches that need refunds...\n');
    
    // Query for cancelled matches that have not been refunded
    const cancelledMatches = await db.collection('wagers')
      .where('status', '==', 'cancelled')
      .where('refundsProcessed', '==', false)
      .get();
    
    if (cancelledMatches.empty) {
      console.log('No cancelled matches found that need refunds.');
      return;
    }
    
    console.log(`Found ${cancelledMatches.size} cancelled matches that need refunds:`);
    
    for (const doc of cancelledMatches.docs) {
      const match = doc.data();
      const matchId = doc.id;
      
      console.log(`\n--- Match ${matchId} ---`);
      console.log('Host:', match.hostName || match.hostId);
      console.log('Guest:', match.guestName || match.guestId || 'None');
      console.log('Amount:', match.amount);
      console.log('Entry fees deducted (host):', match.entryFeesDeducted);
      console.log('Entry fees deducted (guest):', match.guestEntryFeesDeducted);
      console.log('Has guest joined:', !!(match.guestId && match.guestName));
      console.log('Previous status:', match.previousStatus);
      console.log('Refund in progress:', match.refundInProgress);
      console.log('Refund error:', match.refundError || 'None');
      
      // Check if this match should have refunds based on the automatic system logic
      const hasGuestJoined = match.guestId && match.guestName;
      const hostEntryFeesDeducted = match.entryFeesDeducted === true;
      const guestEntryFeesDeducted = match.guestEntryFeesDeducted === true;
      const hasHostPaid = hostEntryFeesDeducted || (match.hostPaid === true);
      const hasGuestPaid = guestEntryFeesDeducted || (match.guestPaid === true);
      const matchProgressed = match.previousStatus && ['ready', 'playing', 'submitting', 'dispute'].includes(match.previousStatus);
      
      const shouldRefundBasedOnFlags = hasHostPaid || hasGuestPaid;
      const shouldRefundBasedOnProgress = matchProgressed && hasGuestJoined;
      const shouldRefundBasedOnReadyStatus = match.previousStatus === 'ready' || match.status === 'ready';
      const shouldRefundBasedOnParticipants = match.participants && match.participants.length >= 2;
      
      const shouldRefund = shouldRefundBasedOnFlags || shouldRefundBasedOnProgress || shouldRefundBasedOnReadyStatus || shouldRefundBasedOnParticipants;
      
      if (shouldRefund) {
        console.log(' This match should be automatically refunded by the system');
        console.log('   Refund indicators:');
        console.log(`   - Based on flags: ${shouldRefundBasedOnFlags}`);
        console.log(`   - Based on progress: ${shouldRefundBasedOnProgress}`);
        console.log(`   - Based on ready status: ${shouldRefundBasedOnReadyStatus}`);
        console.log(`   - Based on participants: ${shouldRefundBasedOnParticipants}`);
        
        // Force trigger the automatic refund by updating the document
        // This will trigger the handleMatchCancellation cloud function
        console.log(' Triggering automatic refund by updating match document...');
        
        await doc.ref.update({
          forceTriggerRefund: admin.firestore.FieldValue.serverTimestamp(),
          refundLog: admin.firestore.FieldValue.arrayUnion({
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            message: 'Force triggered automatic refund via fix script'
          })
        });
        
        console.log(' Automatic refund triggered');
      } else {
        console.log('  No refund needed for this match - marking as processed');
        
        // Mark as processed since no refund is needed
        await doc.ref.update({
          refundsProcessed: true,
          refundedAt: admin.firestore.FieldValue.serverTimestamp(),
          refundLog: admin.firestore.FieldValue.arrayUnion({
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            message: 'Marked as processed by fix script - no refunds needed (no evidence of entry fees paid)'
          })
        });
      }
    }
    
    console.log(`\n Processing complete! Processed ${cancelledMatches.size} matches.`);
    console.log('\nNext steps:');
    console.log('1. The handleMatchCancellation cloud function will automatically process refunds');
    console.log('2. Check the cloud function logs to verify refunds are being processed');
    console.log('3. All refunds are now handled automatically - no manual intervention needed');
    
  } catch (error) {
    console.error('Error fixing cancelled matches:', error);
  }
}

// Run the fix
fixCancelledMatches().then(() => {
  console.log('\nDone.');
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
}); 