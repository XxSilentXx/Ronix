const admin = require('firebase-admin');

// Initialize Firebase Admin SDK with minimal config for CLI usage
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'tokensite-6eef3'
  });
}

const db = admin.firestore();

async function fixUserStats() {
  try {
    console.log('Starting user stats fix...');
    
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    
    console.log(`Found ${usersSnapshot.size} users to process`);
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      console.log(`Processing user: ${userId}`);
      
      // Get all transactions for this user
      const transactionsQuery = db.collection('transactions')
        .where('userId', '==', userId)
        .where('type', 'in', ['wager_entry', 'reward']);
      
      const transactionsSnapshot = await transactionsQuery.get();
      
      // Calculate stats from transactions
      let matchesPlayed = 0;
      let matchesWon = 0;
      let totalEarnings = 0;
      
      transactionsSnapshot.forEach(doc => {
        const transaction = doc.data();
        
        // Count wager entries as matches played
        if (transaction.type === 'wager_entry' && transaction.reason?.includes('Wager entry fee')) {
          matchesPlayed++;
        }
        
        // Count rewards as wins and add to earnings
        if (transaction.type === 'reward' && transaction.reason?.includes('won')) {
          matchesWon++;
          totalEarnings += transaction.amount || 0;
        }
      });
      
      // Calculate derived stats
      const matchesLost = matchesPlayed - matchesWon;
      const winRate = matchesPlayed > 0 ? matchesWon / matchesPlayed : 0;
      
      // Get user display name
      const userData = userDoc.data();
      const displayName = userData.displayName || 'Unknown Player';
      
      // Update or create user stats
      const userStatsRef = db.collection('userStats').doc(userId);
      
      await userStatsRef.set({
        userId,
        displayName,
        matchesPlayed,
        matchesWon,
        matchesLost,
        winRate,
        totalEarnings,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp() // Will only set if document doesn't exist
      }, { merge: true });
      
      console.log(`Updated stats for ${displayName}: ${matchesPlayed} played, ${matchesWon} won, ${matchesLost} lost, ${winRate.toFixed(3)} win rate, ${totalEarnings} earnings`);
    }
    
    console.log('User stats fix completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('Error fixing user stats:', error);
    process.exit(1);
  }
}

// Run the fix
fixUserStats(); 