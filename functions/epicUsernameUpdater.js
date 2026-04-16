const admin = require('firebase-admin');
const functions = require('firebase-functions');
const axios = require('axios');

// Yunite API credentials (same as in main index.js)
const YUNITE_API_URL = 'https://yunite.xyz/api/v3';
const YUNITE_API_KEY = process.env.YUNITE_API_KEY || functions.config().yunite?.api_key;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID || functions.config().discord?.guild_id;

// Only using Yunite API - FortniteAPI.io removed

/**
 * Scheduled function to verify and sync Epic usernames from Yunite
 * Runs every 24 hours to ensure our database matches Yunite's auto-updated usernames
 * Note: Yunite automatically updates usernames daily, so this mostly verifies sync
 */
exports.scheduleEpicUsernameUpdates = functions.pubsub
  .schedule('every 24 hours')
  .timeZone('America/New_York')
  .onRun(async (context) => {
    console.log('Starting scheduled Epic username update check...');
    
    try {
      const result = await updateAllEpicUsernames();
      console.log('Scheduled Epic username update completed:', result);
      return result;
    } catch (error) {
      console.error('Error in scheduled Epic username update:', error);
      return { error: error.message };
    }
  });

/**
 * HTTP function to manually trigger Epic username updates (admin only)
 */
exports.updateEpicUsernames = functions.https.onCall(async (data, context) => {
  try {
    // Check if user is authenticated and is an admin
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in to update Epic usernames'
      );
    }

    // Get the user's admin status
    const db = admin.firestore();
    const userRef = db.collection('users').doc(context.auth.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists() || !userDoc.data().isAdmin) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'You must be an admin to update Epic usernames'
      );
    }

    console.log(`Admin ${context.auth.uid} initiated Epic username update`);
    
    const result = await updateAllEpicUsernames();
    return result;
  } catch (error) {
    console.error('Error in manual Epic username update:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Core function to sync Epic usernames from Yunite's auto-updated data
 * Since Yunite auto-updates usernames daily, this function primarily verifies
 * that our database is in sync with Yunite's current data
 */
async function updateAllEpicUsernames() {
  const db = admin.firestore();
  
  try {
    // Get all users who have Epic accounts linked
    const usersQuery = db.collection('users').where('epicLinked', '==', true);
    const usersSnapshot = await usersQuery.get();
    
    if (usersSnapshot.empty) {
      console.log('No users with linked Epic accounts found');
      return { 
        success: true, 
        totalUsers: 0, 
        updated: 0, 
        errors: 0 
      };
    }

    console.log(`Found ${usersSnapshot.size} users with linked Epic accounts`);

    let totalProcessed = 0;
    let totalUpdated = 0;
    let totalErrors = 0;
    const updateResults = [];

    // Process users in batches to avoid overwhelming APIs
    const batchSize = 10;
    const userDocs = usersSnapshot.docs;
    
    for (let i = 0; i < userDocs.length; i += batchSize) {
      const batch = userDocs.slice(i, i + batchSize);
      
      // Process batch concurrently
      const batchPromises = batch.map(userDoc => updateUserEpicUsername(userDoc));
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Process results
      batchResults.forEach((result, index) => {
        totalProcessed++;
        
        if (result.status === 'fulfilled') {
          const updateResult = result.value;
          updateResults.push(updateResult);
          
          if (updateResult.updated) {
            totalUpdated++;
            console.log(`Updated ${updateResult.userId}: ${updateResult.oldUsername} -> ${updateResult.newUsername}`);
          }
        } else {
          totalErrors++;
          console.error(`Error updating user ${batch[index].id}:`, result.reason);
          updateResults.push({
            userId: batch[index].id,
            error: result.reason.message || 'Unknown error',
            updated: false
          });
        }
      });

      // Rate limiting: wait between batches
      if (i + batchSize < userDocs.length) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      }
    }

    const summary = {
      success: true,
      totalUsers: usersSnapshot.size,
      processed: totalProcessed,
      updated: totalUpdated,
      errors: totalErrors,
      timestamp: new Date().toISOString(),
      results: updateResults
    };

    console.log('Epic username update completed:', summary);
    return summary;

  } catch (error) {
    console.error('Error in updateAllEpicUsernames:', error);
    throw error;
  }
}

/**
 * Update Epic username for a single user
 */
async function updateUserEpicUsername(userDoc) {
  const userData = userDoc.data();
  const userId = userDoc.id;
  
  try {
    const currentEpicUsername = userData.epicUsername;
    const epicId = userData.epicId;
    const discordId = userData.discordId;

    if (!currentEpicUsername) {
      return {
        userId,
        updated: false,
        reason: 'No current Epic username found'
      };
    }

    console.log(`Syncing Epic username for user ${userId} from Yunite (current: ${currentEpicUsername})`);

    // Only use Yunite API - requires Discord to be linked
    if (!discordId) {
      return {
        userId,
        updated: false,
        reason: 'Discord not linked - Yunite lookup not possible',
        currentUsername: currentEpicUsername
      };
    }

    let newEpicUsername = null;
    
    try {
      newEpicUsername = await getEpicUsernameFromYunite(discordId);
    } catch (yuniteError) {
      console.log(`Yunite lookup failed for user ${userId}:`, yuniteError.message);
      return {
        userId,
        updated: false,
        reason: `Yunite API error: ${yuniteError.message}`,
        error: yuniteError.message,
        currentUsername: currentEpicUsername
      };
    }

    // If Yunite didn't return a username, the user might not be linked in Discord
    if (!newEpicUsername) {
      return {
        userId,
        updated: false,
        reason: 'No Epic username found via Yunite - user may not be verified in Discord',
        needsAttention: true,
        currentUsername: currentEpicUsername
      };
    }

    // Check if username actually changed (most cases should be unchanged due to Yunite's auto-updates)
    if (newEpicUsername === currentEpicUsername) {
      return {
        userId,
        updated: false,
        reason: 'Username unchanged - already current via Yunite auto-update',
        currentUsername: currentEpicUsername,
        isCurrentlyValid: true
      };
    }

    // Update the username in Firestore
    const db = admin.firestore();
    await userDoc.ref.update({
      epicUsername: newEpicUsername,
      epicUsernameUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      epicUsernameHistory: admin.firestore.FieldValue.arrayUnion({
        oldUsername: currentEpicUsername,
        newUsername: newEpicUsername,
        updatedAt: new Date().toISOString(),
        updateMethod: 'yunite'
      }),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Also update in epicAccountLinks collection if it exists
    if (epicId) {
      try {
        const epicLinkRef = db.collection('epicAccountLinks').doc(epicId);
        const epicLinkDoc = await epicLinkRef.get();
        
        if (epicLinkDoc.exists) {
          await epicLinkRef.update({
            epicUsername: newEpicUsername,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      } catch (linkUpdateError) {
        console.error(`Error updating epicAccountLinks for ${userId}:`, linkUpdateError);
      }
    }

    return {
      userId,
      updated: true,
      oldUsername: currentEpicUsername,
      newUsername: newEpicUsername,
      updateMethod: 'yunite'
    };

  } catch (error) {
    console.error(`Error updating Epic username for user ${userId}:`, error);
    return {
      userId,
      updated: false,
      error: error.message
    };
  }
}

/**
 * Get Epic username from Yunite API using Discord ID
 * This is the only method used - requires users to have Discord linked
 */
async function getEpicUsernameFromYunite(discordId) {
  try {
    const apiUrl = `${YUNITE_API_URL}/guild/${DISCORD_GUILD_ID}/registration/links`;
    
    const response = await axios({
      method: 'POST',
      url: apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'Y-Api-Token': YUNITE_API_KEY,
        'User-Agent': 'TokenSite/1.0'
      },
      data: {
        type: 'discord',
        user_ids: [discordId]
      },
      timeout: 10000
    });

    if (response.data && response.data.users && response.data.users.length > 0) {
      const user = response.data.users[0];
      if (user.epic && user.epic.epicName) {
        return user.epic.epicName;
      }
    }

    throw new Error('No Epic username found in Yunite response');
  } catch (error) {
    throw new Error(`Yunite API error: ${error.message}`);
  }
}

// FortniteAPI functions removed - only using Yunite API

/**
 * HTTP function to check a specific user's Epic username (admin only)
 */
exports.checkUserEpicUsername = functions.https.onCall(async (data, context) => {
  try {
    // Check if user is authenticated and is an admin
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in to check Epic usernames'
      );
    }

    const db = admin.firestore();
    const userRef = db.collection('users').doc(context.auth.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists || !userDoc.data().isAdmin) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'You must be an admin to check Epic usernames'
      );
    }

    const { userId } = data;
    if (!userId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'User ID is required'
      );
    }

    // Get the target user
    const targetUserRef = db.collection('users').doc(userId);
    const targetUserDoc = await targetUserRef.get();

    if (!targetUserDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'User not found'
      );
    }

    const result = await updateUserEpicUsername(targetUserDoc);
    return result;

  } catch (error) {
    console.error('Error in checkUserEpicUsername:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
}); 