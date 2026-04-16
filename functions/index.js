const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const { createSquarePayment, handleSuccessfulSquarePayment } = require('./squareUtils');
const {
  scheduleEpicUsernameUpdates,
  updateEpicUsernames,
  checkUserEpicUsername
} = require('./epicUsernameUpdater');
const cors = require('cors')({
  origin: [
  'https://www.ronix.gg', // Added production domain
  'https://tokensite-6eef3.web.app',
  'https://tokensite-6eef3.firebaseapp.com',
  'http://localhost:3000'],

  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});

// Remove the v2+ import since we're using v3.x
//const { onDocumentUpdated, onDocumentCreated } = require('firebase-functions/firestore');
//const STRIPE_MODE = process.env.STRIPE_MODE || 'test';

// const cors = require('cors')({
//   origin: [
//     'https://tokensite-6eef3.web.app',
//     'https://tokensite-6eef3.firebaseapp.com',
//     'http://localhost:3000'
//   ],
//   methods: ['GET', 'POST', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   credentials: true
// });

const { query, collection, getDocs, where } = require('firebase-admin/firestore');

// Yunite API credentials
const YUNITE_API_URL = 'https://yunite.xyz/api/v3';
const YUNITE_API_KEY = process.env.YUNITE_API_KEY || functions.config().yunite?.api_key;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID || functions.config().discord?.guild_id;

// spin upFirebase Admin SDK
try {
  admin.initializeApp();

} catch (error) {

}

// Import notification utilities
const { addAdminNotification } = require('./adminNotificationService');
const { sendDiscordAdminAlert } = require('./discordNotifier');

// --- Email Alert Functions ---
const nodemailer = require('nodemailer');

const ALERT_EMAIL_FROM = process.env.ALERT_EMAIL_FROM || 'support@ronix.gg';
const ALERT_EMAIL_TO = process.env.ALERT_EMAIL_TO || 'business.silent175@gmail.com';
const SMTP_USER = process.env.EMAIL_SMTP_USER || 'support@ronix.gg';
const SMTP_PASS = process.env.EMAIL_SMTP_PASS || '';

const transporter = nodemailer.createTransport({
  host: 'mail.privateemail.com',
  port: 465,
  secure: true, // true for port 465 (SSL/TLS)
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  }
});

function sendAlertEmail(mailOptions) {
  if (!SMTP_PASS) {
    return null;
  }
  return transporter.sendMail(mailOptions);
}

/**
 * Cloud Function to trigger on new user signup (Firebase Auth).
 * Sends an email alert to the specified address.
 */
exports.sendNewUserAlert = functions.auth.user().onCreate((user) => {
  const mailOptions = {
    from: ALERT_EMAIL_FROM,
    to: ALERT_EMAIL_TO,
    subject: 'New User Signup',
    text: `A new user has signed up!\n\nEmail: ${user.email || 'No email provided'}\nUID: ${user.uid}`
  };

  return sendAlertEmail(mailOptions);
});

/**
 * Firestore trigger for new user documents.
 * Sends an email alert when a new document is created in the 'users' collection.
 */
exports.notifyOnNewUserDocument = functions.firestore.
document('users/{userId}').
onCreate((snap, context) => {
  const userData = snap.data();
  const mailOptions = {
    from: ALERT_EMAIL_FROM,
    to: ALERT_EMAIL_TO,
    subject: 'New User Document Created',
    text: `A new user document was created in Firestore!\n\nUser ID: ${context.params.userId}\nData: ${JSON.stringify(userData, null, 2)}`
  };

  return sendAlertEmail(mailOptions);
});

/**
 * Firestore trigger for new admin requests.
 * Sends admin notifications and Discord alerts when a user requests admin help.
 */
exports.notifyOnAdminRequest = functions.firestore.
document('adminRequests/{requestId}').
onCreate(async (snap, context) => {
  try {
    const data = snap.data();
    const requestId = context.params.requestId;

    // Use userDisplayName (from frontend) or displayName as fallback, then userId as last resort
    const displayName = data.userDisplayName || data.displayName || data.userId;

    const notifMsg = `ADMIN HELP REQUESTED: User ${displayName} requested admin assistance for wager ${data.wagerId || 'N/A'}.\nReason: ${data.reason || 'No reason provided.'}`;

    await addAdminNotification({
      type: 'admin_help_request',
      message: notifMsg,
      data: {
        requestId,
        userId: data.userId,
        displayName: displayName,
        wagerId: data.wagerId || null,
        reason: data.reason || null,
        createdAt: data.createdAt || new Date().toISOString()
      }
    });

    await sendDiscordAdminAlert(notifMsg);


  } catch (error) {

  }
});

// Helper function to check if a refund request already exists for a match
async function checkExistingRefundRequest(db, matchId) {
  const existingRefundRequest = await db.collection('refund_requests').
  where('matchId', '==', matchId).
  where('status', 'in', ['pending', 'processing']).
  limit(1).
  get();

  return !existingRefundRequest.empty;
}

// Helper function to create a refund request if one doesn't already exist
async function createFallbackRefundRequest(db, matchId, hostId, guestId, amount, source, error) {
  const exists = await checkExistingRefundRequest(db, matchId);

  if (!exists) {
    await db.collection('refund_requests').add({
      matchId: matchId,
      hostId: hostId,
      guestId: guestId || null, // Convert undefined to null for Firestore
      amount: amount,
      status: 'pending',
      source: source,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      error: error
    });

  } else {

  }
}

// Create a payment intent for purchasing coins
exports.createPaymentIntent = functions.https.onCall(async (data, context) => {
  // guard:the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to create a payment intent.'
    );
  }

  try {
    const { amount, currency, packageId } = data;


    if (!amount || amount <= 0) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'A valid amount is required.'
      );
    }

    if (!currency) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Currency is required.'
      );
    }

    if (!packageId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Package ID is required.'
      );
    }

    // Create a payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Ensure amount is an integer
      currency: currency.toLowerCase(),
      metadata: {
        userId: context.auth.uid,
        packageId: packageId
      }
    });

    // Return the client secret to the client
    return {
      clientSecret: paymentIntent.client_secret
    };
  } catch (error) {

    throw new functions.https.HttpsError(
      'internal',
      'An error occurred while creating the payment intent.'
    );
  }
});

// Function to add a user to Discord server
exports.addUserToDiscordServer = functions.https.onCall(async (data, context) => {
  // Remove the authentication check to allow unauthenticated users
  // This is safe because we're only using the Discord access token which was already validated

  try {
    // coverpotential undefined data
    if (!data) {

      throw new functions.https.HttpsError(
        'invalid-argument',
        'The function must be called with data containing accessToken and userId.'
      );
    }

    // Log the data types to help debug






    // Extract data safely with fallbacks
    let accessToken = data.accessToken;
    let userId = data.userId;


    if (accessToken !== undefined && typeof accessToken !== 'string') {

      accessToken = String(accessToken);
    }

    if (userId !== undefined && typeof userId !== 'string') {

      userId = String(userId);
    }






    if (!accessToken || !userId) {

      throw new functions.https.HttpsError(
        'invalid-argument',
        'The function must be called with accessToken and userId arguments.'
      );
    }

    // Get Discord configuration from Firebase Config or use fallbacks
    const guildId = process.env.DISCORD_GUILD_ID || functions.config().discord?.guild_id;
    const botToken = process.env.DISCORD_BOT_TOKEN || functions.config().discord?.bot_token;
    const clientId = process.env.DISCORD_CLIENT_ID || functions.config().discord?.client_id;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET || functions.config().discord?.client_secret;



    if (!guildId || !botToken || !clientId || !clientSecret) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Server configuration is missing. Please contact the administrator.'
      );
    }



    // Simplified approach - direct API call
    try {
      // Make a direct API call to Discord
      const response = await axios({
        method: 'put',
        url: `https://discord.com/api/guilds/${guildId}/members/${userId}`,
        headers: {
          'Authorization': `Bot ${botToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          access_token: accessToken
        }
      });



      return {
        success: true,
        status: response.status,
        message: 'User successfully added to the Discord server!'
      };
    } catch (apiError) {


      // Extract error details safely
      let errorDetails = 'Unknown error';
      if (apiError.response) {
        errorDetails = `Status: ${apiError.response.status}`;

        if (apiError.response.data) {
          if (typeof apiError.response.data === 'string') {
            errorDetails += `, ${apiError.response.data}`;
          } else if (apiError.response.data.message) {
            errorDetails += `, ${apiError.response.data.message}`;
          }
        }
      }

      throw new functions.https.HttpsError(
        'internal',
        `Discord API error: ${errorDetails}`
      );
    }
  } catch (error) {


    throw new functions.https.HttpsError(
      'internal',
      `Failed to add user to Discord server: ${error.message}`
    );
  }
});

// Function to exchange Discord OAuth code for token and user info
exports.exchangeDiscordCode = functions.https.onCall(async (data, context) => {
  try {
    // coverpotential undefined data
    if (!data) {

      throw new functions.https.HttpsError(
        'invalid-argument',
        'The function must be called with data containing code and redirectUri.'
      );
    }

    // Safely log data without circular references












    // Extract data safely with fallbacks
    let code = data.code;
    let redirectUri = data.redirectUri;


    if (code !== undefined && typeof code !== 'string') {

      code = String(code);
    }

    if (redirectUri !== undefined && typeof redirectUri !== 'string') {

      redirectUri = String(redirectUri);
    }




    if (!code || !redirectUri) {




      throw new functions.https.HttpsError(
        'invalid-argument',
        'The function must be called with code and redirectUri arguments.'
      );
    }

    // Get Discord client credentials from Firebase Config
    const clientId = process.env.DISCORD_CLIENT_ID || functions.config().discord?.client_id;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET || functions.config().discord?.client_secret;




    if (!clientSecret) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Discord client secret is not configured. Please contact the administrator.'
      );
    }










    // Exchange the authorization code for an access token
    const tokenResponse = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );


    const { access_token, token_type } = tokenResponse.data;

    // Get user information using the token

    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `${token_type} ${access_token}`
      }
    });



    // Return the user data and access token
    return {
      userData: userResponse.data,
      accessToken: access_token
    };

  } catch (error) {


    // Safely extract and log response data if it exists
    let errorDetails = { message: error.message };

    if (error.response) {
      errorDetails.status = error.response.status;
      errorDetails.statusText = error.response.statusText;

      // Safely extract data
      if (error.response.data) {
        if (typeof error.response.data === 'string') {
          errorDetails.data = error.response.data;
        } else if (typeof error.response.data === 'object') {
          // Extract only necessary fields to avoid circular references
          errorDetails.data = error.response.data.message || 'Unknown error';
          errorDetails.code = error.response.data.code;
        }
      }


    }

    // Return a more specific error message
    let errorMessage = error.message;

    if (errorDetails.data) {
      errorMessage = errorDetails.data;
    }

    throw new functions.https.HttpsError(
      'internal',
      `Failed to exchange Discord code: ${errorMessage}`
    );
  }
});

// Function to link a Discord account to a Firebase user
exports.linkDiscordAccount = functions.https.onCall(async (data, context) => {
  try {
    // make sure the user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'The function must be called while authenticated.'
      );
    }

    // Log the data types to help debug







    // Extract data safely
    const { accessToken, userId, username, discriminator, email } = data;

    if (!accessToken || !userId || !username) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'The function must be called with accessToken, userId, and username.'
      );
    }

    // Fetch Discord user profile to get avatar
    let discordAvatar = null;
    try {
      const axios = require('axios');
      const userResponse = await axios.get('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const discordUser = userResponse.data;
      if (discordUser.avatar) {
        discordAvatar = `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`;
      }
    } catch (avatarErr) {

    }

    // Get the Firebase user
    const firebaseUser = context.auth.uid;

    // Update the user's profile in Firestore
    const db = admin.firestore();
    const userRef = db.collection('users').doc(firebaseUser);

    // Update or create the user document
    await userRef.set({
      discordId: userId,
      discordUsername: username,
      discordDiscriminator: discriminator || '0000',
      discordEmail: email || null,
      discordLinked: true,
      discordAvatar: discordAvatar || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });



    return {
      success: true,
      message: 'Discord account linked successfully'
    };
  } catch (error) {

    throw new functions.https.HttpsError(
      'internal',
      `Error linking Discord account: ${error.message}`
    );
  }
});

// Yunite API proxy endpoint
exports.yuniteApiProxy = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {


      // check:request method is POST
      if (req.method !== 'POST') {

        return res.status(405).json({ error: 'Method Not Allowed' });
      }

      // Get request data
      const { type, userIds } = req.body;

      // quick validation:request data
      if (!type || !userIds || !Array.isArray(userIds) || userIds.length === 0) {

        return res.status(400).json({ error: 'Invalid request data. Required: type (DISCORD or EPIC) and userIds array.' });
      }

      // Only allow DISCORD or EPIC as type
      if (type !== 'DISCORD' && type !== 'EPIC') {

        return res.status(400).json({ error: 'Invalid type. Must be DISCORD or EPIC.' });
      }



      // start with check if the Yunite API is reachable
      try {
        // Try a simple HEAD request to check if the domain is reachable
        await axios.head('https://yunite.xyz');

      } catch (pingError) {


      }

      // Call Yunite API
      try {
        // Construct the full API URL with the correct structure
        const apiUrl = `${YUNITE_API_URL}/guild/${DISCORD_GUILD_ID}/registration/links`;


        const yuniteResponse = await axios({
          method: 'POST',
          url: apiUrl,
          headers: {
            'Y-Api-Token': YUNITE_API_KEY,
            'Content-Type': 'application/json'
          },
          data: {
            type: type,
            userIds: userIds
          },
          // Add timeout option
          timeout: 10000 // 10 seconds timeout
        });


        return res.status(200).json(yuniteResponse.data);
      } catch (apiError) {


        // Log more detailed error information
        if (apiError.code === 'ENOTFOUND') {

        } else if (apiError.code === 'ECONNREFUSED') {

        } else if (apiError.code === 'ETIMEDOUT') {

        }

        if (apiError.response) {


        }

        // Check for premium plan requirement error
        if (apiError.response?.status === 402 ||
        apiError.response?.data?.message && apiError.response.data.message.includes('premium plan')) {

          return res.status(200).json({
            users: [
            {
              discord: {
                id: userIds[0],
                name: "SimulatedUser#1234",
                avatar: "https://cdn.discordapp.com/avatars/123456789/abcdef.png"
              },
              epic: {
                epicID: "simulated-epic-id-" + Math.random().toString(36).substring(2, 10),
                epicName: "Fortnite_Player_" + Math.floor(Math.random() * 1000)
              },
              dateVerified: new Date().toISOString(),
              chosenPlatform: "PC",
              chosenPeripheral: "KEYBOARD_MOUSE"
            }],

            notLinked: [],
            notFound: [],
            simulated: true,
            note: "This is simulated data. The actual Yunite API requires a premium plan."
          });
        }

        // Return detailed error information
        return res.status(apiError.response?.status || 500).json({
          error: 'Error calling Yunite API',
          details: apiError.response?.data || apiError.message,
          code: apiError.code
        });
      }
    } catch (error) {

      return res.status(500).json({ error: error.message });
    }
  });
});

// backend fn: to handle match cancellations and refund tokens
exports.handleMatchCancellation = functions.firestore.
document('wagers/{wagerId}').
onUpdate(async (change, context) => {
  try {
    const before = change.before.data();
    const after = change.after.data();
    const wagerId = context.params.wagerId;
    // EARLY RETURN: Prevent infinite loop and log spam
    if (after.status === 'cancelled' && after.refundsProcessed) {

      return null;
    }
    // Only proceed if the match status changed to 'cancelled'
    if (before.status !== 'cancelled' && after.status === 'cancelled') {

      // PARTY WAGER REFUND LOGIC FIRST
      if (after.isPartyWager) {

        try {
          await sponsorship.refundPartyWager({
            ...after,
            id: wagerId
          });
          await change.after.ref.update({
            refundsProcessed: true,
            refundedAt: admin.firestore.FieldValue.serverTimestamp(),
            refundLog: admin.firestore.FieldValue.arrayUnion({
              timestamp: Date.now(),
              message: '[handleMatchCancellation] Party wager refund processed via refundPartyWager.'
            })
          });
          return { success: true, status: 'party_wager_refunded' };
        } catch (partyRefundError) {

          await change.after.ref.update({
            refundInProgress: false,
            refundError: partyRefundError.message,
            refundErrorAt: admin.firestore.FieldValue.serverTimestamp(),
            refundLog: admin.firestore.FieldValue.arrayUnion({
              timestamp: Date.now(),
              message: `[handleMatchCancellation] Error in refundPartyWager: ${partyRefundError.message}`
            })
          });
          throw partyRefundError;
        }
      }
      // kick offFirestore database reference
      const db = admin.firestore();

      // start with check if refunds have already been processed or are in progress
      if (after.refundsProcessed) {

        return { success: true, status: 'already_processed' };
      }

      // check:refund has been in progress for too long (more than 5 minutes)
      if (after.refundInProgress && after.refundStartedAt) {
        const refundStartTime = after.refundStartedAt.toDate();
        const currentTime = new Date();
        const timeDiffMinutes = (currentTime - refundStartTime) / (1000 * 60);

        if (timeDiffMinutes > 5) {

          await change.after.ref.update({
            refundInProgress: false,
            refundError: 'Previous refund attempt timed out',
            refundErrorAt: admin.firestore.FieldValue.serverTimestamp(),
            refundAttempts: admin.firestore.FieldValue.increment(1)
          });
        } else {

          return { success: true, status: 'in_progress' };
        }
      }

      await change.after.ref.update({
        refundInProgress: true,
        refundStartedAt: admin.firestore.FieldValue.serverTimestamp(),
        refundAttempts: admin.firestore.FieldValue.increment(1) || 1,
        refundLog: admin.firestore.FieldValue.arrayUnion({
          timestamp: Date.now(),
          message: '[handleMatchCancellation] Starting refund process'
        })
      });

      const hostRef = db.collection('users').doc(after.hostId);
      const guestRef = after.guestId ? db.collection('users').doc(after.guestId) : null;
      const wagerAmount = after.amount;

      if (!wagerAmount) {

        await change.after.ref.update({
          refundInProgress: false,
          refundError: 'No wager amount defined',
          refundErrorAt: admin.firestore.FieldValue.serverTimestamp(),
          refundLog: admin.firestore.FieldValue.arrayUnion({
            timestamp: Date.now(),
            message: '[handleMatchCancellation] No wager amount defined'
          })
        });
        return { error: 'No wager amount defined' };
      }

      const amount = Number(wagerAmount);
      if (isNaN(amount) || amount <= 0) {

        await change.after.ref.update({
          refundInProgress: false,
          refundError: 'Invalid wager amount',
          refundErrorAt: admin.firestore.FieldValue.serverTimestamp(),
          refundLog: admin.firestore.FieldValue.arrayUnion({
            timestamp: Date.now(),
            message: `[handleMatchCancellation] Invalid wager amount: ${wagerAmount}`
          })
        });
        return { error: 'Invalid wager amount' };
      }

      const hostEntryFeesDeducted = after.entryFeesDeducted === true;
      const guestEntryFeesDeducted = after.guestEntryFeesDeducted === true;
      const hasHostPaid = hostEntryFeesDeducted || after.hostPaid === true;
      const hasGuestPaid = guestEntryFeesDeducted || after.guestPaid === true;
      const matchProgressed = after.previousStatus && ['ready', 'playing', 'submitting', 'dispute'].includes(after.previousStatus);
      const hasGuestJoined = after.guestId && after.guestName;
      const shouldRefundBasedOnFlags = hasHostPaid || hasGuestPaid;
      const shouldRefundBasedOnProgress = matchProgressed && hasGuestJoined;
      const shouldRefundBasedOnReadyStatus = after.previousStatus === 'ready' || after.status === 'ready';
      const shouldRefundBasedOnParticipants = after.participants && after.participants.length >= 2;
      let shouldRefundHost = false;
      let shouldRefundGuest = false;

      // LOG ALL DECISION VARIABLES





      if (shouldRefundBasedOnFlags || shouldRefundBasedOnProgress || shouldRefundBasedOnReadyStatus || shouldRefundBasedOnParticipants) {

        shouldRefundHost = hasHostPaid || shouldRefundBasedOnProgress || shouldRefundBasedOnReadyStatus || shouldRefundBasedOnParticipants;
        shouldRefundGuest = hasGuestPaid || hasGuestJoined && (shouldRefundBasedOnProgress || shouldRefundBasedOnReadyStatus || shouldRefundBasedOnParticipants);
      }
      if (!shouldRefundHost && !shouldRefundGuest && hasGuestJoined) {

        shouldRefundHost = true;
        shouldRefundGuest = true;
      }
      if (!hostEntryFeesDeducted || !guestEntryFeesDeducted) {
        const hostEntryTx = await db.collection('transactions').
        where('userId', '==', after.hostId).
        where('wagerId', '==', wagerId).
        where('type', '==', 'wager_entry').
        get();
        const guestEntryTx = after.guestId ? await db.collection('transactions').
        where('userId', '==', after.guestId).
        where('wagerId', '==', wagerId).
        where('type', '==', 'wager_entry').
        get() : { empty: true };
        let updateFlags = {};
        let updated = false;
        if (!hostEntryFeesDeducted && !hostEntryTx.empty) {
          updateFlags.entryFeesDeducted = true;
          updated = true;

        }
        if (!guestEntryFeesDeducted && !guestEntryTx.empty) {
          updateFlags.guestEntryFeesDeducted = true;
          updated = true;

        }
        if (updated) {
          await change.after.ref.update(updateFlags);
        }
      }
      if (!shouldRefundHost && !shouldRefundGuest && !hasGuestJoined) {

        await change.after.ref.update({
          refundInProgress: false,
          refundsProcessed: true,
          refundedAt: admin.firestore.FieldValue.serverTimestamp(),
          refundLog: admin.firestore.FieldValue.arrayUnion({
            timestamp: Date.now(),
            message: '[handleMatchCancellation] No evidence of entry fees deducted and no guest joined, no refunds needed'
          })
        });
        return { success: true, status: 'no_fees_deducted' };
      }

      // Log the refund process with detailed information





      // Get current user data for both users
      const [hostDoc, guestDoc] = await Promise.all([
      hostRef.get(),
      guestRef ? guestRef.get() : Promise.resolve({ exists: false })]
      );

      // Log user existence

      if (hostDoc.exists) {

      }
      if (guestDoc && guestDoc.exists) {

      }

      if (!hostDoc.exists && (!guestDoc || !guestDoc.exists)) {

        await change.after.ref.update({
          refundInProgress: false,
          refundError: 'Neither host nor guest user found',
          refundErrorAt: admin.firestore.FieldValue.serverTimestamp(),
          refundLog: admin.firestore.FieldValue.arrayUnion({
            timestamp: Date.now(),
            message: '[handleMatchCancellation] Error: Neither host nor guest user found'
          })
        });
        // Only create fallback refund request if both host and guest should be refunded
        if (shouldRefundHost || shouldRefundGuest) {
          await createFallbackRefundRequest(db, wagerId, after.hostId, after.guestId, amount, 'auto_fallback_users_not_found', 'Neither host nor guest user found');
        }
        return { error: 'Neither host nor guest user found' };
      }

      const batch = db.batch();
      let refundedHost = false;
      let refundedGuest = false;
      if (hostDoc.exists && shouldRefundHost) {
        const hostBalance = hostDoc.data().tokenBalance || 0;
        batch.update(hostRef, {
          tokenBalance: hostBalance + amount
        });
        const hostTransactionRef = db.collection('transactions').doc();
        batch.set(hostTransactionRef, {
          userId: after.hostId,
          type: 'refund',
          amount: amount,
          reason: `Match ${wagerId} cancelled by mutual agreement`,
          wagerId: wagerId,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        refundedHost = true;
      } else if (shouldRefundHost) {

        await change.after.ref.update({
          refundLog: admin.firestore.FieldValue.arrayUnion({
            timestamp: Date.now(),
            message: `[handleMatchCancellation] Warning: Host ${after.hostId} not found but should be refunded`
          })
        });
      } else {

        await change.after.ref.update({
          refundLog: admin.firestore.FieldValue.arrayUnion({
            timestamp: Date.now(),
            message: `[handleMatchCancellation] No refund needed for host ${after.hostId}`
          })
        });
      }
      if (after.guestId && guestDoc && guestDoc.exists && shouldRefundGuest) {
        const guestBalance = guestDoc.data().tokenBalance || 0;
        batch.update(guestRef, {
          tokenBalance: guestBalance + amount
        });
        const guestTransactionRef = db.collection('transactions').doc();
        batch.set(guestTransactionRef, {
          userId: after.guestId,
          type: 'refund',
          amount: amount,
          reason: `Match ${wagerId} cancelled by mutual agreement`,
          wagerId: wagerId,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        refundedGuest = true;
      } else if (shouldRefundGuest && after.guestId) {

        await change.after.ref.update({
          refundLog: admin.firestore.FieldValue.arrayUnion({
            timestamp: Date.now(),
            message: `[handleMatchCancellation] Warning: Guest ${after.guestId} not found but should be refunded`
          })
        });
      } else if (after.guestId) {

        await change.after.ref.update({
          refundLog: admin.firestore.FieldValue.arrayUnion({
            timestamp: Date.now(),
            message: `[handleMatchCancellation] No refund needed for guest ${after.guestId}`
          })
        });
      }
      batch.update(change.after.ref, {
        refundsProcessed: true,
        refundedAt: admin.firestore.FieldValue.serverTimestamp(),
        refundedHost: refundedHost,
        refundedGuest: refundedGuest,
        refundAmount: amount,
        refundLog: admin.firestore.FieldValue.arrayUnion({
          timestamp: Date.now(),
          message: `[handleMatchCancellation] Processed refunds: Host (${refundedHost}), Guest (${refundedGuest})`
        })
      });
      try {
        await Promise.race([
        batch.commit(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Batch commit timeout')), 10000))]
        );

        try {
          await db.collection('wager_chats').add({
            wagerId: wagerId,
            senderId: 'system',
            senderName: 'System',
            content: `Refund processed: ${amount} tokens have been returned to both players.`,
            isSystem: true,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });
        } catch (chatError) {

        }
        // Log final balances
        const [hostDocAfter, guestDocAfter] = await Promise.all([
        hostRef.get(),
        guestRef ? guestRef.get() : Promise.resolve({ exists: false })]
        );


        return {
          success: true,
          refundedHost: refundedHost,
          refundedGuest: refundedGuest,
          amount: amount
        };
      } catch (commitError) {

        await change.after.ref.update({
          refundInProgress: false,
          refundError: `Batch commit error: ${commitError.message}`,
          refundErrorAt: admin.firestore.FieldValue.serverTimestamp(),
          refundLog: admin.firestore.FieldValue.arrayUnion({
            timestamp: Date.now(),
            message: `[handleMatchCancellation] Error: ${commitError.message}`,
            stack: commitError.stack
          })
        });
        await createFallbackRefundRequest(db, wagerId, after.hostId, after.guestId, amount, 'auto_fallback', commitError.message);
        throw commitError;
      }
    }
    // Otherwise, do nothing
    return null;
  } catch (error) {

    try {
      await change.after.ref.update({
        refundInProgress: false,
        refundError: error.message,
        refundErrorAt: admin.firestore.FieldValue.serverTimestamp(),
        refundLog: admin.firestore.FieldValue.arrayUnion({
          timestamp: Date.now(),
          message: `[handleMatchCancellation] Error: ${error.message}`,
          stack: error.stack
        })
      });
      await admin.firestore().collection('refund_requests').add({
        matchId: context.params.wagerId,
        hostId: after.hostId,
        guestId: after.guestId,
        amount: Number(after.amount) || 0,
        status: 'pending',
        source: 'error_fallback',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        error: error.message
      });
    } catch (updateError) {

    }
    return { error: error.message };
  }
});

// cloud fn: to process refund requests
exports.processRefundRequests = functions.firestore.
document('refund_requests/{requestId}').
onCreate(async (snapshot, context) => {
  try {
    if (!snapshot) {

      return null;
    }

    const refundData = snapshot.data();
    const requestId = context.params.requestId;



    // spin upFirestore database reference
    const db = admin.firestore();

    // Update the refund request to indicate it's being processed
    await snapshot.ref.update({
      status: 'processing',
      processingStartedAt: admin.firestore.FieldValue.serverTimestamp(),
      processingLog: admin.firestore.FieldValue.arrayUnion({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        message: 'Started processing refund request'
      })
    });

    // see ifthe request has all required data
    if (!refundData.matchId || !refundData.hostId || !refundData.guestId || !refundData.amount) {

      await snapshot.ref.update({
        status: 'error',
        error: 'Missing required data',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        processingLog: admin.firestore.FieldValue.arrayUnion({
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          message: 'Error: Missing required data',
          data: JSON.stringify(refundData)
        })
      });
      return null;
    }


    const refundAmount = Number(refundData.amount);
    if (isNaN(refundAmount) || refundAmount <= 0) {

      await snapshot.ref.update({
        status: 'error',
        error: 'Invalid refund amount',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        processingLog: admin.firestore.FieldValue.arrayUnion({
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          message: `Error: Invalid refund amount: ${refundData.amount}`
        })
      });
      return null;
    }

    // double-checkthis is a test refund request
    const isTestRequest = refundData.matchId.includes('test-match');

    // If not a test request, check the match status and if refunds are already processed
    if (!isTestRequest) {
      const matchRef = db.collection('wagers').doc(refundData.matchId);
      const matchDoc = await matchRef.get();

      if (!matchDoc.exists) {

        await snapshot.ref.update({
          status: 'error',
          error: 'Match not found',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          processingLog: admin.firestore.FieldValue.arrayUnion({
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            message: `Error: Match ${refundData.matchId} not found`
          })
        });
        return null;
      }

      const matchData = matchDoc.data();

      // check:refunds have already been processed
      if (matchData.refundsProcessed) {

        await snapshot.ref.update({
          status: 'completed',
          note: 'Refunds already processed',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          processingLog: admin.firestore.FieldValue.arrayUnion({
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            message: `Refunds already processed for match ${refundData.matchId}`
          })
        });
        return { success: true, status: 'already_processed' };
      }


      if (matchData.refundInProgress) {
        // quick check: the refund has been stuck for too long (more than 5 minutes)
        if (matchData.refundStartedAt) {
          const refundStartTime = matchData.refundStartedAt.toDate();
          const currentTime = new Date();
          const timeDiffMinutes = (currentTime - refundStartTime) / (1000 * 60);

          if (timeDiffMinutes <= 5) {
            // Refund is still within reasonable time window, let the other process handle it

            await snapshot.ref.update({
              status: 'pending',
              note: 'Refund is being processed by another function',
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              processingLog: admin.firestore.FieldValue.arrayUnion({
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                message: `Match ${refundData.matchId} refunds are already being processed by another function (started ${timeDiffMinutes.toFixed(2)} minutes ago)`
              }),
              nextCheckAt: admin.firestore.FieldValue.serverTimestamp({
                seconds: 60 // Check again in 1 minute
              })
            });
            return { success: true, status: 'deferred' };
          }

          // Refund has been stuck for too long, take over processing

          await snapshot.ref.update({
            processingLog: admin.firestore.FieldValue.arrayUnion({
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
              message: `Taking over processing from a stuck refund attempt (started ${timeDiffMinutes.toFixed(2)} minutes ago)`
            })
          });

          // Reset the match refund status
          await matchRef.update({
            refundInProgress: false,
            refundError: 'Previous refund attempt timed out',
            refundErrorAt: admin.firestore.FieldValue.serverTimestamp()
          });

          // Continue with processing
        } else {
          // No timestamp, can't determine how long it's been in progress


          // Reset the match refund status
          await matchRef.update({
            refundInProgress: false,
            refundError: 'Previous refund attempt had no timestamp',
            refundErrorAt: admin.firestore.FieldValue.serverTimestamp()
          });

          // Continue with processing
        }
      }

      // Verify match is cancelled for real matches
      if (matchData.status !== 'cancelled') {

        await snapshot.ref.update({
          status: 'error',
          error: 'Match is not cancelled',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          processingLog: admin.firestore.FieldValue.arrayUnion({
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            message: `Error: Match ${refundData.matchId} is not cancelled (status: ${matchData.status})`
          })
        });
        return null;
      }

      // Mark the match as having refunds in progress to prevent duplicate processing
      await matchRef.update({
        refundInProgress: true,
        refundRequestId: requestId,
        refundStartedAt: admin.firestore.FieldValue.serverTimestamp(),
        refundLog: admin.firestore.FieldValue.arrayUnion({
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          message: `Processing refund via request ${requestId}`
        })
      });
    } else {

      await snapshot.ref.update({
        processingLog: admin.firestore.FieldValue.arrayUnion({
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          message: 'Processing test refund request'
        })
      });
    }

    // Get user references
    const hostRef = db.collection('users').doc(refundData.hostId);
    const guestRef = db.collection('users').doc(refundData.guestId);

    // Get current user data
    const [hostDoc, guestDoc] = await Promise.all([
    hostRef.get(),
    guestRef.get()]
    );

    // Log user data retrieval
    await snapshot.ref.update({
      processingLog: admin.firestore.FieldValue.arrayUnion({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        message: `Retrieved user data: Host exists: ${hostDoc.exists}, Guest exists: ${guestDoc.exists}`
      })
    });

    // Run refunds in one batch so we do not half-write state
    const batch = db.batch();
    let refundedHost = false;
    let refundedGuest = false;

    // Refund tokens to host
    if (hostDoc.exists) {
      const hostBalance = hostDoc.data().tokenBalance || 0;
      batch.update(hostRef, {
        tokenBalance: hostBalance + refundAmount
      });

      // Record transaction
      const hostTransactionRef = db.collection('transactions').doc();
      batch.set(hostTransactionRef, {
        userId: refundData.hostId,
        type: 'refund',
        amount: refundAmount,
        reason: isTestRequest ?
        'Test refund' :
        `Match ${refundData.matchId} cancelled by mutual agreement`,
        wagerId: refundData.matchId,
        requestId: requestId,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });


      await snapshot.ref.update({
        processingLog: admin.firestore.FieldValue.arrayUnion({
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          message: `Prepared refund of ${refundAmount} tokens to host ${refundData.hostId} (current balance: ${hostBalance})`
        })
      });
      refundedHost = true;
    } else {

      await snapshot.ref.update({
        processingLog: admin.firestore.FieldValue.arrayUnion({
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          message: `Warning: Host user ${refundData.hostId} not found`
        })
      });
    }

    // Refund tokens to guest
    if (guestDoc.exists) {
      const guestBalance = guestDoc.data().tokenBalance || 0;
      batch.update(guestRef, {
        tokenBalance: guestBalance + refundAmount
      });

      // Record transaction
      const guestTransactionRef = db.collection('transactions').doc();
      batch.set(guestTransactionRef, {
        userId: refundData.guestId,
        type: 'refund',
        amount: refundAmount,
        reason: isTestRequest ?
        'Test refund' :
        `Match ${refundData.matchId} cancelled by mutual agreement`,
        wagerId: refundData.matchId,
        requestId: requestId,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });


      await snapshot.ref.update({
        processingLog: admin.firestore.FieldValue.arrayUnion({
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          message: `Prepared refund of ${refundAmount} tokens to guest ${refundData.guestId} (current balance: ${guestBalance})`
        })
      });
      refundedGuest = true;
    } else {

      await snapshot.ref.update({
        processingLog: admin.firestore.FieldValue.arrayUnion({
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          message: `Warning: Guest user ${refundData.guestId} not found`
        })
      });
    }

    // Update the refund request status
    batch.update(snapshot.ref, {
      status: 'completed',
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      refundedHost: refundedHost,
      refundedGuest: refundedGuest,
      processingLog: admin.firestore.FieldValue.arrayUnion({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        message: 'Batch transaction prepared and about to be committed'
      })
    });

    // Update the match to indicate refunds were processed (if not a test match)
    if (!isTestRequest) {
      const matchRef = db.collection('wagers').doc(refundData.matchId);
      batch.update(matchRef, {
        refundsProcessed: true,
        refundedAt: admin.firestore.FieldValue.serverTimestamp(),
        refundInProgress: false,
        refundedHost: refundedHost,
        refundedGuest: refundedGuest,
        refundAmount: refundAmount,
        refundProcessedBy: 'refund_request',
        refundRequestId: requestId,
        refundLog: admin.firestore.FieldValue.arrayUnion({
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          message: `Processed refunds via request ${requestId}: Host (${refundedHost}), Guest (${refundedGuest})`
        })
      });
    }

    // Commit the batch with timeout protection
    try {
      await Promise.race([
      batch.commit(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Batch commit timeout')), 10000))]
      );



      // Update the log after successful batch commit
      await snapshot.ref.update({
        processingLog: admin.firestore.FieldValue.arrayUnion({
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          message: 'Batch transaction successfully committed'
        })
      });

      // Add a system message to the chat (if not a test match)
      if (!isTestRequest) {
        try {
          await db.collection('wager_chats').add({
            wagerId: refundData.matchId,
            senderId: 'system',
            senderName: 'System',
            content: `Refund processed: ${refundAmount} tokens have been returned to both players.`,
            isSystem: true,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });

          await snapshot.ref.update({
            processingLog: admin.firestore.FieldValue.arrayUnion({
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
              message: 'Added system message to wager chat'
            })
          });
        } catch (chatError) {

          await snapshot.ref.update({
            processingLog: admin.firestore.FieldValue.arrayUnion({
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
              message: `Warning: Failed to add system message to chat: ${chatError.message}`
            })
          });
        }
      }

      return {
        success: true,
        refundedHost: refundedHost,
        refundedGuest: refundedGuest,
        amount: refundAmount
      };
    } catch (commitError) {


      // Update the refund request with the error
      await snapshot.ref.update({
        status: 'error',
        error: `Batch commit error: ${commitError.message}`,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        processingLog: admin.firestore.FieldValue.arrayUnion({
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          message: `Error: ${commitError.message}`,
          stack: commitError.stack
        })
      });

      // Reset the match refund status if not a test match
      if (!isTestRequest) {
        try {
          const matchRef = db.collection('wagers').doc(refundData.matchId);
          await matchRef.update({
            refundInProgress: false,
            refundError: `Batch commit error: ${commitError.message}`,
            refundErrorAt: admin.firestore.FieldValue.serverTimestamp()
          });
        } catch (matchUpdateError) {

        }
      }

      throw commitError;
    }
  } catch (error) {


    // Update the refund request with the error
    try {
      if (snapshot && snapshot.ref) {
        await snapshot.ref.update({
          status: 'error',
          error: error.message,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          processingLog: admin.firestore.FieldValue.arrayUnion({
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            message: `Error: ${error.message}`,
            stack: error.stack
          }),
          // Schedule a retry in 2 minutes if this wasn't a permanent error
          retryAt: !error.message.includes('not cancelled') && !error.message.includes('not found') ?
          admin.firestore.FieldValue.serverTimestamp({
            seconds: 120 // 2 minutes
          }) :
          null
        });

        // Try to update the match to indicate the error
        if (refundData && refundData.matchId && !refundData.matchId.includes('test-match')) {
          try {
            const matchRef = admin.firestore().collection('wagers').doc(refundData.matchId);
            await matchRef.update({
              refundInProgress: false,
              refundError: error.message,
              refundErrorAt: admin.firestore.FieldValue.serverTimestamp()
            });
          } catch (matchUpdateError) {

          }
        }
      }
    } catch (updateError) {

    }

    return { error: error.message };
  }
});

/**
 * Process a Square payment for tokens
 * This function receives a payment token from Square's Web Payments SDK
 * and processes the payment, then adds tokens to the user's account
 */
exports.processSquarePayment = functions.https.onCall(async (data, context) => {
  // keep this safe:user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to make a purchase'
    );
  }

  try {
    // Extract payment data
    const { sourceId, amount, packageId, referralCode, deviceId, userIp } = data;

    if (!sourceId || !amount || !packageId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required payment information'
      );
    }


    const COIN_PACKAGES = {
      '5_coins': { baseCoins: 5, bonusCoins: 0, totalCoins: 5, amount: 4.75 },
      '10_coins': { baseCoins: 10, bonusCoins: 1, totalCoins: 11, amount: 9.00 },
      '25_coins': { baseCoins: 25, bonusCoins: 3, totalCoins: 28, amount: 22.00 },
      '50_coins': { baseCoins: 50, bonusCoins: 7, totalCoins: 57, amount: 42.00 },
      '100_coins': { baseCoins: 100, bonusCoins: 15, totalCoins: 115, amount: 80.00 }
    };

    const packageInfo = COIN_PACKAGES[packageId];
    if (!packageInfo) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `Invalid package ID: ${packageId}`
      );
    }


    if (Math.abs(amount - packageInfo.amount) > 0.01) {// Allow 1 cent tolerance for floating point
      throw new functions.https.HttpsError(
        'invalid-argument',
        `Amount mismatch: expected ${packageInfo.amount}, received ${amount} for package ${packageId}`
      );
    }

    const userId = context.auth.uid;



    // run the payment with Square
    const paymentResult = await createSquarePayment(sourceId, amount, packageId, userId);

    // If payment successful, add tokens to user's account
    if (paymentResult.success) {
      // Pass referral data to the Square payment handler
      const orderData = {
        referralCode: referralCode || null,
        deviceId: deviceId || null,
        userIp: userIp || null
      };

      const result = await handleSuccessfulSquarePayment(paymentResult, userId, orderData);
      return {
        success: true,
        ...result
      };
    } else {
      throw new functions.https.HttpsError(
        'aborted',
        'Payment was not successful'
      );
    }
  } catch (error) {

    throw new functions.https.HttpsError(
      'internal',
      error.message || 'An error occurred processing your payment'
    );
  }
});

// One-time setup function to create an admin user
exports.setupAdmin = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Add CORS headers
      const allowedOrigins = [
      'https://tokensite-6eef3.web.app',
      'https://tokensite-6eef3.firebaseapp.com',
      'http://localhost:3000',
      'https://www.ronix.gg'];

      const origin = req.get ? req.get('origin') : req.headers.origin;
      if (allowedOrigins.includes(origin)) {
        res.set('Access-Control-Allow-Origin', origin);
      }

      // coverpreflight OPTIONS request
      if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.status(204).send('');
        return;
      }

      // see ifrequest method is POST
      if (req.method !== 'POST') {

        return res.status(405).json({ error: 'Method Not Allowed' });
      }

      // Get request data
      const { userId, secretKey } = req.body;

      // Log request data (excluding sensitive info)



      if (!userId || !secretKey) {

        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Check secret key - use environment variable or hardcoded value for development
      const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY;
      if (!ADMIN_SECRET_KEY) {

        return res.status(500).json({ error: 'Server misconfiguration' });
      }
      if (secretKey !== ADMIN_SECRET_KEY) {

        return res.status(403).json({ error: 'Unauthorized' });
      }

      // spin upFirestore database reference
      const db = admin.firestore();

      // Get user reference
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {

        return res.status(404).json({ error: 'User not found' });
      }

      // Make user an admin
      await userRef.update({
        isAdmin: true,
        adminSetupAt: admin.firestore.FieldValue.serverTimestamp()
      });



      return res.status(200).json({
        success: true,
        message: `User ${userId} is now an admin`
      });
    } catch (error) {

      return res.status(500).json({ error: error.message });
    }
  });
});

// backend fn: to handle manual refunds from the RefundDebug tool
exports.processManualRefund = functions.https.onCall(async (data, context) => {
  try {
    // quick check: user is authenticated and is an admin
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in to process refunds'
      );
    }

    // Get the user's admin status
    const db = admin.firestore();
    const userRef = db.collection('users').doc(context.auth.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists || !userDoc.data().isAdmin) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'You must be an admin to process refunds'
      );
    }

    // Extract data
    const { matchId, hostId, guestId, amount, source = 'debug_tool' } = data;

    if (!matchId || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid match ID or amount'
      );
    }

    // Get match data
    const matchRef = db.collection('wagers').doc(matchId);
    const matchDoc = await matchRef.get();

    if (!matchDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Match not found'
      );
    }

    // Same deal here: one batch keeps refund writes consistent
    const batch = db.batch();
    let hostRefunded = false;
    let guestRefunded = false;
    const refundAmount = Number(amount);

    // Refund host
    if (hostId) {
      const hostRef = db.collection('users').doc(hostId);
      const hostDoc = await hostRef.get();

      if (hostDoc.exists) {
        const hostBalance = hostDoc.data().tokenBalance || 0;
        batch.update(hostRef, {
          tokenBalance: hostBalance + refundAmount
        });

        // Record transaction
        const hostTransactionRef = db.collection('transactions').doc();
        batch.set(hostTransactionRef, {
          userId: hostId,
          type: 'manual_refund',
          amount: refundAmount,
          reason: `Manual refund for match ${matchId} via ${source}`,
          wagerId: matchId,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        hostRefunded = true;

      } else {

      }
    }

    // Refund guest
    if (guestId) {
      const guestRef = db.collection('users').doc(guestId);
      const guestDoc = await guestRef.get();

      if (guestDoc.exists) {
        const guestBalance = guestDoc.data().tokenBalance || 0;
        batch.update(guestRef, {
          tokenBalance: guestBalance + refundAmount
        });

        // Record transaction
        const guestTransactionRef = db.collection('transactions').doc();
        batch.set(guestTransactionRef, {
          userId: guestId,
          type: 'manual_refund',
          amount: refundAmount,
          reason: `Manual refund for match ${matchId} via ${source}`,
          wagerId: matchId,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        guestRefunded = true;

      } else {

      }
    }

    // Update match status
    batch.update(matchRef, {
      refundsProcessed: true,
      refundedAt: admin.firestore.FieldValue.serverTimestamp(),
      refundInProgress: false,
      refundedHost: hostRefunded,
      refundedGuest: guestRefunded,
      refundAmount: refundAmount,
      refundProcessedBy: source,
      refundLog: admin.firestore.FieldValue.arrayUnion({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        message: `Manual refund processed by ${source}`
      })
    });

    // Commit the batch
    await batch.commit();



    // Add a system message to the chat
    try {
      await db.collection('wager_chats').add({
        wagerId: matchId,
        senderId: 'system',
        senderName: 'System',
        content: `Manual refund processed: ${refundAmount} tokens have been returned to players.`,
        isSystem: true,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (chatError) {


    }

    return {
      success: true,
      hostRefunded,
      guestRefunded,
      amount: refundAmount
    };
  } catch (error) {

    return {
      success: false,
      error: error.message
    };
  }
});


exports.handleMatchCompletion = functions.firestore.
document('wagers/{wagerId}').
onUpdate(async (change, context) => {
  try {
    const before = change.before.data();
    const after = change.after.data();
    const wagerId = context.params.wagerId;



    // Only proceed if the match status changed to 'completed'
    if (before.status !== 'completed' && after.status === 'completed') {

      const db = admin.firestore();

      if (after.rewardsProcessed) {

        return { success: true, status: 'already_processed' };
      }

      // Mark that we're processing rewards
      await change.after.ref.update({
        rewardInProgress: true,
        rewardStartedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Get the winner information
      const winner = after.winner; // 'host' or 'guest'
      if (!winner) {
        const msg = `[handleMatchCompletion] ERROR: Match ${wagerId} is completed but has no winner defined.`;

        await change.after.ref.update({
          rewardInProgress: false,
          rewardError: 'No winner defined',
          rewardErrorAt: admin.firestore.FieldValue.serverTimestamp(),
          rewardErrorLog: admin.firestore.FieldValue.arrayUnion({
            timestamp: Date.now(),
            message: msg
          })
        });
        return { error: 'No winner defined' };
      }

      // Get the wager amount
      const wagerAmount = after.amount;
      if (!wagerAmount) {
        const msg = `[handleMatchCompletion] ERROR: Match ${wagerId} has no wager amount defined.`;

        await change.after.ref.update({
          rewardInProgress: false,
          rewardError: 'No wager amount defined',
          rewardErrorAt: admin.firestore.FieldValue.serverTimestamp(),
          rewardErrorLog: admin.firestore.FieldValue.arrayUnion({
            timestamp: Date.now(),
            message: msg
          })
        });
        return { error: 'No wager amount defined' };
      }

      // Make sure wagerAmount is a number
      const amount = Number(wagerAmount);
      if (isNaN(amount) || amount <= 0) {
        const msg = `[handleMatchCompletion] ERROR: Match ${wagerId} has invalid wager amount: ${wagerAmount}`;

        await change.after.ref.update({
          rewardInProgress: false,
          rewardError: 'Invalid wager amount',
          rewardErrorAt: admin.firestore.FieldValue.serverTimestamp(),
          rewardErrorLog: admin.firestore.FieldValue.arrayUnion({
            timestamp: Date.now(),
            message: msg
          })
        });
        return { error: 'Invalid wager amount' };
      }

      // Determine winner and loser IDs
      const winnerId = winner === 'host' ? after.hostId : after.guestId;
      const loserId = winner === 'host' ? after.guestId : after.hostId;
      const winnerName = winner === 'host' ? after.hostName : after.guestName;

      if (!winnerId || !loserId) {
        const msg = `[handleMatchCompletion] ERROR: Match ${wagerId} has missing participant IDs.`;

        await change.after.ref.update({
          rewardInProgress: false,
          rewardError: 'Missing participant IDs',
          rewardErrorAt: admin.firestore.FieldValue.serverTimestamp(),
          rewardErrorLog: admin.firestore.FieldValue.arrayUnion({
            timestamp: Date.now(),
            message: msg
          })
        });
        return { error: 'Missing participant IDs' };
      }

      // Create a batch for atomic operations
      const batch = db.batch();
      // --- FEE AND PRIZE LOGIC START ---
      const feePercent = 0.05;
      const feePerPlayer = Number((amount * feePercent).toFixed(2));
      const prizePerPlayer = Number((amount - feePerPlayer).toFixed(2));
      const totalFee = Number((feePerPlayer * 2).toFixed(2));
      const totalPrize = Number((prizePerPlayer * 2).toFixed(2));
      // --- FEE AND PRIZE LOGIC END ---

      // === HANDLE PARTY WAGER PRIZE DISTRIBUTION ===
      if (after.isPartyWager) {
        const partyWinners = after.winnerTeamMembers || [];
        const sponsorships = after.sponsorships || after.guestSponsorships || [];
        const numWinners = partyWinners.length;
        const entry = Number(after.amount);
        const feePerPlayer = Math.round(entry * feePercent);
        const prizePerPlayer = entry - feePerPlayer;
        const totalPrize = prizePerPlayer * (after.partySize ? parseInt(after.partySize) : numWinners);
        const individualPrize = Math.floor(totalPrize / numWinners);


        // Prize and transaction logic for party winners
        for (const winnerId of partyWinners) {
          const winnerSponsorship = sponsorships.find((s) => s.sponsoredUserId === winnerId);
          if (winnerSponsorship) {
            // Sponsored winner: split their share
            const sponsorShare = Math.floor(individualPrize * (winnerSponsorship.sponsorShare / 100));
            const sponsoredShare = individualPrize - sponsorShare;
            // Update sponsor
            batch.update(db.collection('users').doc(winnerSponsorship.sponsorId), {
              tokenBalance: admin.firestore.FieldValue.increment(sponsorShare),
              wagerEarnings: admin.firestore.FieldValue.increment(sponsorShare)
            });
            // Update sponsored winner
            batch.update(db.collection('users').doc(winnerId), {
              tokenBalance: admin.firestore.FieldValue.increment(sponsoredShare),
              wagerEarnings: admin.firestore.FieldValue.increment(sponsoredShare)
            });
            // Log transactions
            batch.set(db.collection('transactions').doc(), {
              userId: winnerSponsorship.sponsorId,
              type: 'sponsorship_winnings',
              amount: sponsorShare,
              reason: `Sponsorship winnings from ${winnerId} winning party wager ${wagerId}`,
              wagerId: wagerId,
              sponsoredUserId: winnerId,
              timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
            batch.set(db.collection('transactions').doc(), {
              userId: winnerId,
              type: 'sponsored_winnings',
              amount: sponsoredShare,
              reason: `Sponsored winnings from party wager ${wagerId}`,
              wagerId: wagerId,
              sponsorId: winnerSponsorship.sponsorId,
              timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

          } else {
            // Not sponsored: full share
            batch.update(db.collection('users').doc(winnerId), {
              tokenBalance: admin.firestore.FieldValue.increment(individualPrize),
              wagerEarnings: admin.firestore.FieldValue.increment(individualPrize)
            });
            batch.set(db.collection('transactions').doc(), {
              userId: winnerId,
              type: 'reward',
              amount: individualPrize,
              reason: `Won party wager match ${wagerId}`,
              wagerId: wagerId,
              timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

          }
        }
      } else {
        // === HANDLE 1V1 WAGER PRIZE DISTRIBUTION ===
        // Update winner's token balance and stats
        const winnerRef = db.collection('users').doc(winnerId);
        const winnerDoc = await winnerRef.get();
        if (!winnerDoc.exists) {
          const msg = `[handleMatchCompletion] ERROR: Winner user ${winnerId} not found.`;

          await change.after.ref.update({
            rewardInProgress: false,
            rewardError: `Winner user ${winnerId} not found`,
            rewardErrorAt: admin.firestore.FieldValue.serverTimestamp(),
            rewardErrorLog: admin.firestore.FieldValue.arrayUnion({
              timestamp: Date.now(),
              message: msg
            })
          });
          return { error: `Winner user ${winnerId} not found` };
        }

        const winnerData = winnerDoc.data();
        const winnerBalance = winnerData.tokenBalance || 0;
        const winnerStatsRef = db.collection('userStats').doc(winnerId);
        const winnerStatsDoc = await winnerStatsRef.get();

        // Update winner stats
        if (winnerStatsDoc.exists) {
          const winnerStats = winnerStatsDoc.data();
          batch.update(winnerStatsRef, {
            matchesPlayed: (winnerStats.matchesPlayed || 0) + 1,
            matchesWon: (winnerStats.matchesWon || 0) + 1,
            matchesLost: winnerStats.matchesLost || 0,
            winRate: ((winnerStats.matchesWon || 0) + 1) / ((winnerStats.matchesPlayed || 0) + 1),
            totalEarnings: (winnerStats.totalEarnings || 0) + totalPrize,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });

        } else {
          batch.set(winnerStatsRef, {
            userId: winnerId,
            displayName: winnerData.displayName || winnerName,
            matchesPlayed: 1,
            matchesWon: 1,
            matchesLost: 0,
            winRate: 1.0,
            totalEarnings: totalPrize,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });

        }

        // Update winner's balance and wager earnings (pay out the correct prize)
        batch.update(winnerRef, {
          tokenBalance: winnerBalance + totalPrize,
          wagerEarnings: admin.firestore.FieldValue.increment(totalPrize)
        });


        // Record transaction for winner
        batch.set(db.collection('transactions').doc(), {
          userId: winnerId,
          type: 'reward',
          amount: totalPrize,
          reason: `Won wager match ${wagerId}`,
          wagerId: wagerId,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });


        // Update loser's stats
        const loserRef = db.collection('users').doc(loserId);
        const loserDoc = await loserRef.get();
        if (loserDoc.exists) {
          const loserStatsRef = db.collection('userStats').doc(loserId);
          const loserStatsDoc = await loserStatsRef.get();
          if (loserStatsDoc.exists) {
            const loserStats = loserStatsDoc.data();
            batch.update(loserStatsRef, {
              matchesPlayed: (loserStats.matchesPlayed || 0) + 1,
              matchesWon: loserStats.matchesWon || 0,
              matchesLost: (loserStats.matchesLost || 0) + 1,
              winRate: (loserStats.matchesWon || 0) / ((loserStats.matchesPlayed || 0) + 1),
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

          } else {
            batch.set(loserStatsRef, {
              userId: loserId,
              displayName: loserDoc.data().displayName || (after.hostId === loserId ? after.hostName : after.guestName),
              matchesPlayed: 1,
              matchesWon: 0,
              matchesLost: 1,
              winRate: 0.0,
              totalEarnings: 0,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

          }
        } else {
          const msg = `[handleMatchCompletion] WARNING: Loser user ${loserId} not found. Unable to update stats.`;

          await change.after.ref.update({
            rewardErrorLog: admin.firestore.FieldValue.arrayUnion({
              timestamp: Date.now(),
              message: msg
            })
          });
        }
      }

      // === XP AWARDING LOGIC (UNIFIED FOR BOTH PARTY AND 1V1) ===


      // Calculate XP amounts based on wager amount
      const participationBaseXP = 25;
      const participationBonusXP = Math.min(75, Math.floor(amount / 10));
      const participationTotalXP = participationBaseXP + participationBonusXP;
      const winBaseXP = 50;
      const winBonusXP = Math.min(150, Math.floor(amount / 5));
      const winTotalXP = winBaseXP + winBonusXP;

      if (after.isPartyWager) {
        // Build robust participants list to ensure host and all party members are included
        let allParticipantIds = Array.isArray(after.participants) && after.participants.length > 0 ? after.participants.slice() : [];
        // Add hostId if missing
        if (after.hostId && !allParticipantIds.includes(after.hostId)) allParticipantIds.push(after.hostId);
        // Add guestId if missing
        if (after.guestId && !allParticipantIds.includes(after.guestId)) allParticipantIds.push(after.guestId);
        // Add partyMembers
        if (Array.isArray(after.partyMembers)) {
          after.partyMembers.forEach((m) => {
            const id = m.id || m;
            if (id && !allParticipantIds.includes(id)) allParticipantIds.push(id);
          });
        }
        // Add guestPartyMembers
        if (Array.isArray(after.guestPartyMembers)) {
          after.guestPartyMembers.forEach((m) => {
            const id = m.id || m;
            if (id && !allParticipantIds.includes(id)) allParticipantIds.push(id);
          });
        }
        // Remove duplicates and filter out empty values
        allParticipantIds = Array.from(new Set(allParticipantIds)).filter(Boolean);

        const partyWinners = after.winnerTeamMembers || [];
        const partyLosers = allParticipantIds.filter((id) => !partyWinners.includes(id));





        // Award win XP to each winner
        for (const pid of partyWinners) {
          try {

            const userRef = db.collection('users').doc(pid);
            const userDoc = await userRef.get();
            const currentXp = userDoc.exists && userDoc.data().xpTotal ? userDoc.data().xpTotal : 0;
            const newXp = currentXp + winTotalXP;
            batch.update(userRef, {
              xpTotal: newXp,
              lastXpUpdate: admin.firestore.Timestamp.now(),
              xpHistory: admin.firestore.FieldValue.arrayUnion({
                amount: winTotalXP,
                baseAmount: winTotalXP,
                boosted: false,
                multiplier: 1,
                newTotal: newXp,
                reason: `Wager victory (${amount} tokens)`,
                timestamp: admin.firestore.Timestamp.now(),
                levelUp: false
              })
            });

          } catch (err) {

          }
        }

        // Award participation XP to each loser
        for (const pid of partyLosers) {
          try {

            const userRef = db.collection('users').doc(pid);
            const userDoc = await userRef.get();
            const currentXp = userDoc.exists && userDoc.data().xpTotal ? userDoc.data().xpTotal : 0;
            const newXp = currentXp + participationTotalXP;
            batch.update(userRef, {
              xpTotal: newXp,
              lastXpUpdate: admin.firestore.Timestamp.now(),
              xpHistory: admin.firestore.FieldValue.arrayUnion({
                amount: participationTotalXP,
                baseAmount: participationTotalXP,
                boosted: false,
                multiplier: 1,
                newTotal: newXp,
                reason: `Wager participation (${amount} tokens)`,
                timestamp: admin.firestore.Timestamp.now(),
                levelUp: false
              })
            });

          } catch (err) {

          }
        }
      } else {
        // 1v1 wager: award win XP to winner, participation XP to loser


        try {

          const winnerRef = db.collection('users').doc(winnerId);
          const winnerUserDoc = await winnerRef.get();
          const winnerCurrentXp = winnerUserDoc.data().xpTotal || 0;
          const winnerNewXp = winnerCurrentXp + winTotalXP;
          batch.update(winnerRef, {
            xpTotal: winnerNewXp,
            lastXpUpdate: admin.firestore.Timestamp.now(),
            xpHistory: admin.firestore.FieldValue.arrayUnion({
              amount: winTotalXP,
              baseAmount: winTotalXP,
              boosted: false,
              multiplier: 1,
              newTotal: winnerNewXp,
              reason: `Wager victory (${amount} tokens)`,
              timestamp: admin.firestore.Timestamp.now(),
              levelUp: false
            })
          });

        } catch (err) {

        }

        try {

          const loserRef = db.collection('users').doc(loserId);
          const loserUserDoc = await loserRef.get();
          const loserCurrentXp = loserUserDoc.data().xpTotal || 0;
          const loserNewXp = loserCurrentXp + participationTotalXP;
          batch.update(loserRef, {
            xpTotal: loserNewXp,
            lastXpUpdate: admin.firestore.Timestamp.now(),
            xpHistory: admin.firestore.FieldValue.arrayUnion({
              amount: participationTotalXP,
              baseAmount: participationTotalXP,
              boosted: false,
              multiplier: 1,
              newTotal: loserNewXp,
              reason: `Wager participation (${amount} tokens)`,
              timestamp: admin.firestore.Timestamp.now(),
              levelUp: false
            })
          });

        } catch (err) {

        }
      }

      // === INSURANCE PROCESSING FOR LOSERS ===


      // Determine all loser IDs based on wager type
      let loserIds = [];
      if (after.isPartyWager) {
        // For party wagers, get all participants who are not winners
        const partyWinners = after.winnerTeamMembers || [];
        let allParticipantIds = Array.isArray(after.participants) ? after.participants.slice() : [];

        // keep this safe:all party members are included
        if (after.hostId && !allParticipantIds.includes(after.hostId)) allParticipantIds.push(after.hostId);
        if (after.guestId && !allParticipantIds.includes(after.guestId)) allParticipantIds.push(after.guestId);
        if (Array.isArray(after.partyMembers)) {
          after.partyMembers.forEach((m) => {
            const id = m.id || m;
            if (id && !allParticipantIds.includes(id)) allParticipantIds.push(id);
          });
        }
        if (Array.isArray(after.guestPartyMembers)) {
          after.guestPartyMembers.forEach((m) => {
            const id = m.id || m;
            if (id && !allParticipantIds.includes(id)) allParticipantIds.push(id);
          });
        }

        // Remove duplicates and get losers
        allParticipantIds = Array.from(new Set(allParticipantIds)).filter(Boolean);
        loserIds = allParticipantIds.filter((id) => !partyWinners.includes(id));
      } else {
        // For 1v1 wagers, just the single loser
        loserIds = [loserId];
      }



      // work throughinsurance for each loser
      for (const currentLoserId of loserIds) {
        try {


          // Get the loser's user document
          const loserUserRef = db.collection('users').doc(currentLoserId);
          const loserUserDoc = await loserUserRef.get();

          if (!loserUserDoc.exists) {

            continue;
          }

          const loserUserData = loserUserDoc.data();
          const activeInsurance = loserUserData.activeInsurance;

          // Also check for insurance info stored in the wager document
          let wagerInsuranceInfo = null;
          if (after.isPartyWager) {
            // Check both host and guest party insurance
            if (after.hostPartyInsurance && after.hostPartyInsurance[currentLoserId]) {
              wagerInsuranceInfo = after.hostPartyInsurance[currentLoserId];
            } else if (after.guestPartyInsurance && after.guestPartyInsurance[currentLoserId]) {
              wagerInsuranceInfo = after.guestPartyInsurance[currentLoserId];
            }
          } else {
            // Check individual insurance
            if (after.hostInsurance && after.hostId === currentLoserId) {
              wagerInsuranceInfo = after.hostInsurance;
            } else if (after.guestInsurance && after.guestId === currentLoserId) {
              wagerInsuranceInfo = after.guestInsurance;
            }
          }






          // check:user has active insurance (either from user document or wager document)
          const hasActiveInsurance = activeInsurance && activeInsurance.isActive ||
          wagerInsuranceInfo && wagerInsuranceInfo.isActive;

          if (!hasActiveInsurance) {

            continue;
          }

          // Use insurance info from wager document if available, otherwise from user document
          const insuranceToUse = wagerInsuranceInfo && wagerInsuranceInfo.isActive ? wagerInsuranceInfo : activeInsurance;

          // quick check: insurance has expired (only if we're using user document insurance)
          if (insuranceToUse === activeInsurance && activeInsurance.expiresAt) {
            const now = new Date();
            const expiresAt = new Date(activeInsurance.expiresAt);
            if (now > expiresAt) {

              continue;
            }
          }

          // Calculate refund amount (min of entry fee and max refund) [using two decimal places][[memory:2464064438983302488]]
          const maxRefund = insuranceToUse.maxRefund || 50;
          const refundAmount = Number(Math.min(amount, maxRefund).toFixed(2));



          // Add refund to user's balance in the batch
          batch.update(loserUserRef, {
            tokenBalance: admin.firestore.FieldValue.increment(refundAmount)
          });

          // Create refund transaction in the batch
          batch.set(db.collection('transactions').doc(), {
            userId: currentLoserId,
            type: 'insurance_refund',
            amount: refundAmount,
            reason: `Insurance refund for lost wager match ${wagerId}`,
            wagerId: wagerId,
            insuranceData: {
              originalEntryFee: amount,
              maxRefund: maxRefund,
              refundAmount: refundAmount,
              activatedAt: insuranceToUse.activatedAt,
              source: wagerInsuranceInfo ? 'wager_document' : 'user_document'
            },
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });

          // Deactivate insurance and set cooldown in the batch (only if using user document insurance)
          if (insuranceToUse === activeInsurance) {
            batch.update(loserUserRef, {
              activeInsurance: {
                isActive: false,
                activatedAt: null,
                expiresAt: null,
                maxRefund: 50
              },
              lastInsuranceUsed: admin.firestore.FieldValue.serverTimestamp()
            });
          }



        } catch (insuranceError) {


        }
      }

      // Mark insurance as processed in the wager document
      batch.update(change.after.ref, {
        insuranceProcessed: true,
        insuranceProcessedAt: admin.firestore.FieldValue.serverTimestamp()
      });



      // Record site fee in siteEarnings collection
      await db.collection('siteEarnings').add({
        type: 'wager_fee',
        amount: totalFee,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        feePercent,
        sourceUserId: winnerId,
        sourceWagerId: wagerId
      });


      // Add platform wallet fee record
      await recordPlatformWalletFee({ db, batch, feeType: 'wager_fee', amount: totalFee, meta: { wagerId, feePercent } });

      // Update the match document to indicate rewards were processed
      await change.after.ref.update({
        rewardsProcessed: true,
        rewardsProcessedAt: admin.firestore.FieldValue.serverTimestamp(),
        rewardInProgress: false,
        totalPrize,
        totalFee,
        prizePerPlayer,
        feePerPlayer,
        feePercent,
        winnerEarned: totalPrize
      });


      // Record transaction log
      await change.after.ref.update({
        rewardLog: admin.firestore.FieldValue.arrayUnion({
          timestamp: Date.now(),
          message: `Processed rewards: Winner (${winnerId}) received ${totalPrize} tokens (site fee: ${totalFee})`
        })
      });


      // Commit the batch with timeout protection - SINGLE COMMIT FOR ALL OPERATIONS

      try {
        await Promise.race([
        batch.commit(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Batch commit timeout')), 10000))]
        );

      } catch (batchError) {
        const msg = `[handleMatchCompletion] ERROR: Batch commit failed for match ${wagerId}: ${batchError.message}`;

        await change.after.ref.update({
          rewardInProgress: false,
          rewardError: `Batch commit failed: ${batchError.message}`,
          rewardErrorAt: admin.firestore.FieldValue.serverTimestamp(),
          rewardErrorLog: admin.firestore.FieldValue.arrayUnion({
            timestamp: Date.now(),
            message: msg
          })
        });
        return { error: `Batch commit failed: ${batchError.message}` };
      }

      // === HIGH ROLLER ACHIEVEMENT TRACKING ===
      try {
        if (amount >= 5) {
          if (after.isPartyWager) {
            const partyWinners = after.winnerTeamMembers || [];
            for (const partyWinnerId of partyWinners) {
              try {
                await incrementHighRollerWin({ userId: partyWinnerId, wagerAmount: amount, source: 'match_completion_party' });

              } catch (err) {

              }
            }
          } else {
            try {
              await incrementHighRollerWin({ userId: winnerId, wagerAmount: amount, source: 'match_completion_1v1' });

            } catch (err) {

            }
          }
        }
      } catch (err) {

      }

      // === UNBREAKABLE ACHIEVEMENT TRACKING ===



      try {
        // Only for 1v1 wagers
        if (!after.isPartyWager && after.winnerData && typeof after.winnerData.winnerScore === 'number' && typeof after.winnerData.loserScore === 'number') {
          const winnerScore = after.winnerData.winnerScore;
          const loserScore = after.winnerData.loserScore;
          let winnerId;
          if (after.winner === 'host') {
            winnerId = after.hostId;
          } else if (after.winner === 'guest') {
            winnerId = after.guestId;
          } else {
            winnerId = after.winner; // fallback, in case winner is already a UID
          }

          // Check for 5-0 win
          if (winnerScore === 5 && loserScore === 0) {

            await incrementUnbreakableWin(winnerId);

          } else {

          }
        } else {

        }
      } catch (err) {

      }

      // === VIP XP BOOST LOGIC ===
      try {
        // see ifwinner has active VIP subscription
        const inventoryRef = db.collection('userInventory').doc(winnerId);
        const inventoryDoc = await inventoryRef.get();
        let isVip = false;
        if (inventoryDoc.exists) {
          const items = inventoryDoc.data().items || [];
          const now = new Date();
          const vip = items.find((i) => i.id === 'vip_subscription' && i.isActive && i.expiresAt && new Date(i.expiresAt.toDate ? i.expiresAt.toDate() : i.expiresAt) > now);
          isVip = !!vip;
        }
        if (isVip) {
          const xpAmount = Math.round(totalPrize * 0.10);
          // Add an XP reward transaction for the winner
          await db.collection('transactions').add({
            userId: winnerId,
            type: 'xp_reward',
            amount: xpAmount,
            reason: `VIP +10% XP boost for winning wager match ${wagerId}`,
            wagerId: wagerId,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });

        }
      } catch (vipXpError) {

      }

      // === Award Battle Pass XP ===
      const winnerXp = 200;
      const loserXp = 50;
      try {
        // Winner
        const winnerRef = db.collection('users').doc(winnerId);
        const winnerDocLatest = await winnerRef.get();
        if (winnerDocLatest.exists && winnerDocLatest.data().battlepass && winnerDocLatest.data().battlepass.isActive) {
          await winnerRef.update({
            'battlepass.xp': admin.firestore.FieldValue.increment(winnerXp)
          });
        }
        // Loser
        const loserRef = db.collection('users').doc(loserId);
        const loserDocLatest = await loserRef.get();
        if (loserDocLatest.exists && loserDocLatest.data().battlepass && loserDocLatest.data().battlepass.isActive) {
          await loserRef.update({
            'battlepass.xp': admin.firestore.FieldValue.increment(loserXp)
          });
        }
      } catch (err) {

      }

      // === ADMIN NOTIFICATION AND DISCORD ALERT ===
      const { addAdminNotification } = require('./adminNotificationService');
      const { sendDiscordAdminAlert } = require('./discordNotifier');
      const notifMsg = `Wager COMPLETED: Match ${wagerId} completed. Winner: ${winnerName} (${winnerId}), Loser: ${loserId}, Amount: ${amount}`;
      await addAdminNotification({
        type: 'wager_completed',
        message: notifMsg,
        data: {
          wagerId,
          winnerId,
          winnerName,
          loserId,
          amount
        }
      });
      await sendDiscordAdminAlert(notifMsg);


    } else {

    }
  } catch (err) {
    const wagerId = context.params ? context.params.wagerId : 'unknown';
    const msg = `[handleMatchCompletion] UNCAUGHT ERROR for match ${wagerId}: ${err.message}`;

    if (change.after && change.after.ref) {
      await change.after.ref.update({
        rewardInProgress: false,
        rewardError: `Uncaught error: ${err.message}`,
        rewardErrorAt: admin.firestore.FieldValue.serverTimestamp(),
        rewardErrorLog: admin.firestore.FieldValue.arrayUnion({
          timestamp: Date.now(),
          message: msg
        })
      });
    }
    return { error: `Uncaught error: ${err.message}` };
  }
});


exports.updateUserStatsOnTransaction = functions.firestore.
document('transactions/{transactionId}').
onCreate(async (snapshot, context) => {
  const transactionId = context.params.transactionId; // Move this above try block for catch scope
  try {
    const transactionData = snapshot.data();
    const userId = transactionData.userId;



    // Only process transactions related to wagers
    if (!userId || !(transactionData.type === 'reward' || transactionData.reason?.includes('wager'))) {

      return { success: true, status: 'not_wager_related' };
    }



    // kick offFirestore database reference
    const db = admin.firestore();

    // Get all of the user's wager-related transactions
    const userTransactionsQuery = db.collection('transactions').
    where('userId', '==', userId).
    where('type', 'in', ['wager_entry', 'reward']);

    const transactionsSnapshot = await userTransactionsQuery.get();

    if (transactionsSnapshot.empty) {

      return { success: true, status: 'no_transactions' };
    }

    // Calculate stats based on transactions
    let matchesPlayed = 0;
    let matchesWon = 0;
    let totalEarnings = 0;
    let lastRewardAmount = 0;

    transactionsSnapshot.forEach((doc) => {
      const transaction = doc.data();

      // Count all wager entries as matches played
      if (transaction.type === 'wager_entry') {
        matchesPlayed++;
      }

      // Count all rewards as wins and add to earnings
      if (transaction.type === 'reward') {
        matchesWon++;
        const transactionAmount = transaction.amount || 0;
        totalEarnings += transactionAmount;
        lastRewardAmount = transactionAmount;

      }
    });

    // Calculate matches lost and win rate
    const matchesLost = matchesPlayed - matchesWon;
    const winRate = matchesPlayed > 0 ? matchesWon / matchesPlayed : 0;



    // Update or create user stats document
    const userStatsRef = db.collection('userStats').doc(userId);
    const userStatsDoc = await userStatsRef.get();

    if (userStatsDoc.exists) {

      // Update existing stats
      await userStatsRef.update({
        matchesPlayed,
        matchesWon,
        matchesLost,
        winRate,
        totalEarnings,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {

      // Get user data to include displayName
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      let displayName = 'Unknown Player';

      if (userDoc.exists) {
        displayName = userDoc.data().displayName || 'Unknown Player';
      }

      // Create new stats document
      await userStatsRef.set({
        userId,
        displayName,
        matchesPlayed,
        matchesWon,
        matchesLost,
        winRate,
        totalEarnings,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // Automatically check and unlock achievements/cosmetics after stats update
    try {
      const achievementCheck = exports.checkUserAchievements;
      const achievementResult = await achievementCheck({}, { auth: { uid: userId } });

    } catch (achievementError) {

    }





    return {
      success: true,
      userId,
      matchesPlayed,
      matchesWon,
      matchesLost,
      winRate,
      totalEarnings
    };
  } catch (error) {

    return { error: error.message };
  }
});

// cloud fn: to generate sample leaderboard data for testing
exports.generateSampleLeaderboardData = functions.https.onCall(async (data, context) => {
  try {
    // Require admin access
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in to generate sample data'
      );
    }

    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(context.auth.uid).get();

    if (!userDoc.exists || !userDoc.data().isAdmin) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'You must be an admin to generate sample data'
      );
    }

    // Create sample player data - increase this number for more sample players
    const numPlayers = data.numPlayers || 10;
    const batch = db.batch();

    // Generate userIds with a deterministic pattern
    const generateUserId = (index) => `sample-user-${index}`;

    // Create sample user stats
    for (let i = 1; i <= numPlayers; i++) {
      const userId = generateUserId(i);
      const userStatsRef = db.collection('userStats').doc(userId);

      // Generate random stats
      const matchesPlayed = Math.floor(Math.random() * 50) + 5;
      const matchesWon = Math.floor(Math.random() * matchesPlayed);
      const matchesLost = matchesPlayed - matchesWon;
      const winRate = matchesPlayed > 0 ? matchesWon / matchesPlayed : 0;
      const totalEarnings = matchesWon * (Math.floor(Math.random() * 50) + 10);

      batch.set(userStatsRef, {
        userId: userId,
        displayName: `Sample Player ${i}`,
        photoURL: null,
        matchesPlayed: matchesPlayed,
        matchesWon: matchesWon,
        matchesLost: matchesLost,
        winRate: winRate,
        totalEarnings: totalEarnings,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // Commit all the sample data
    await batch.commit();

    // Now update the leaderboard ranks
    await updateLeaderboardRanks();

    return {
      success: true,
      message: `Generated ${numPlayers} sample leaderboard entries`,
      numPlayers: numPlayers
    };
  } catch (error) {

    return {
      success: false,
      error: error.message
    };
  }
});

exports.createPartyWagerNotifications = functions.https.onCall(async (data, context) => {
  // Only allow authenticated users
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to create notifications.');
  }

  const { memberUids, wagerId, partySize, leaderName } = data;

  if (!Array.isArray(memberUids) || !wagerId || !partySize || !leaderName) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required data.');
  }

  const batch = admin.firestore().batch();
  const notificationsRef = admin.firestore().collection('notifications');

  memberUids.forEach((uid) => {
    const docRef = notificationsRef.doc();
    batch.set(docRef, {
      userId: uid,
      type: 'party_wager_created',
      title: 'Party Wager Created',
      message: `${leaderName} has created a ${partySize} wager for your party.`,
      wagerId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
      autoJoin: true
    });
  });

  await batch.commit();
  return { success: true, count: memberUids.length };
});

// Update Discord Avatars (Admin Only)
exports.updateDiscordAvatars = functions.https.onRequest((req, res) => {
  // Set CORS headers for preflight requests
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // coverpreflight requests (OPTIONS method)
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // For POST requests, process the actual function
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Extract auth token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  // Verify Firebase ID token
  admin.auth().verifyIdToken(idToken).
  then(async (decodedToken) => {
    try {
      const userUid = decodedToken.uid;

      // check:user is admin
      const db = admin.firestore();
      const userRef = db.collection('users').doc(userUid);
      const userDoc = await userRef.get();

      if (!userDoc.exists || !userDoc.data().isAdmin) {

        return res.status(403).json({
          error: 'Permission denied',
          message: 'Only administrators can update Discord avatars'
        });
      }



      // Extract data
      const data = req.body;
      const updates = data.updates || [];

      if (!Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'No updates provided or invalid format'
        });
      }

      // Create a batch write
      const batch = db.batch();
      const updatedUsers = [];
      const errors = [];


      for (let i = 0; i < updates.length; i++) {
        const update = updates[i];
        if (!update.userId || !update.discordAvatar) {
          errors.push(`Update at index ${i} is missing required fields`);
          continue;
        }

        try {
          const userDocRef = db.collection('users').doc(update.userId);
          const userSnapshot = await userDocRef.get();

          if (!userSnapshot.exists) {
            errors.push(`User ${update.userId} does not exist`);
            continue;
          }

          // Update Discord fields
          batch.update(userDocRef, {
            discordAvatar: update.discordAvatar,
            discordLinked: true,
            // Only update discordId if provided
            ...(update.discordId ? { discordId: update.discordId } : {}),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          updatedUsers.push(update.userId);
        } catch (error) {

          errors.push(`Error updating user ${update.userId}: ${error.message}`);
        }
      }

      // Commit the batch
      if (updatedUsers.length > 0) {
        await batch.commit();

      }

      return res.status(200).json({
        success: true,
        updatedUsers,
        errorCount: errors.length,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {

      return res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }).
  catch((error) => {

    return res.status(403).json({
      error: 'Unauthorized',
      message: 'Invalid authentication token'
    });
  });
});

// HTTP function to check and cancel expired wagers
exports.checkExpiredWagers = functions.https.onRequest(async (req, res) => {

  const db = admin.firestore();

  try {
    // Get all open wagers
    const wagersQuery = await db.collection('wagers').
    where('status', '==', 'open').
    get();



    let cancelledCount = 0;
    const batch = db.batch();

    // Check each wager to see if it's expired
    for (const doc of wagersQuery.docs) {
      const wager = doc.data();

      // Skip if no creation timestamp
      if (!wager.createdAt) {

        continue;
      }

      const createdAt = wager.createdAt.toDate();
      const expiryTime = new Date(createdAt);
      expiryTime.setMinutes(expiryTime.getMinutes() + 30); // 30 minutes expiry

      const now = new Date();

      // If the wager is expired
      if (now > expiryTime) {


        // Update wager status to cancelled
        batch.update(doc.ref, {
          status: 'cancelled',
          cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          cancellationReason: 'auto-cancelled due to expiry',
          refundInProgress: true
        });

        // work throughrefund if entry fees were deducted
        if (wager.entryFeesDeducted) {


          // Refund the host
          const hostRef = db.collection('users').doc(wager.hostId);
          const hostDoc = await hostRef.get();

          if (hostDoc.exists) {
            const hostBalance = hostDoc.data().tokenBalance || 0;
            batch.update(hostRef, {
              tokenBalance: hostBalance + wager.amount
            });

            // Add transaction record
            const transactionRef = db.collection('transactions').doc();
            batch.set(transactionRef, {
              userId: wager.hostId,
              type: 'refund',
              amount: wager.amount,
              reason: `Wager ${doc.id} auto-cancelled due to expiry`,
              wagerId: doc.id,
              timestamp: admin.firestore.FieldValue.serverTimestamp()
            });


          } else {

          }
        }

        // Add a system message to the chat if there is one
        try {
          const chatRef = db.collection('wager_chats').doc();
          batch.set(chatRef, {
            wagerId: doc.id,
            senderId: 'system',
            senderName: 'System',
            content: `Wager has been automatically cancelled due to expiry. Tokens have been refunded.`,
            isSystem: true,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });
        } catch (error) {

        }

        cancelledCount++;
      }
    }

    // Commit all the updates if there are any
    if (cancelledCount > 0) {
      await batch.commit();

    } else {

    }

    // Return a response
    res.status(200).json({
      success: true,
      cancelledCount,
      message: cancelledCount > 0 ? `Successfully cancelled ${cancelledCount} expired wagers` : 'No expired wagers found'
    });
  } catch (error) {


    // Return error response
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * HTTPS endpoint to verify PayPal payment status securely on the backend.
 * Expects { orderID } in POST body.
 * Returns { success: true } if payment is completed, else { success: false, message }.
 */
exports.verifyPaypalPayment = functions.https.onRequest((req, res) => {
  // Set CORS headers for all responses
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // coverpreflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // Use the cors middleware for the actual request handling
  cors(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
      }

      const { orderID } = req.body;
      if (!orderID) {
        return res.status(400).json({ error: 'Missing orderID' });
      }

      // Use your live PayPal client ID and secret from environment/config
      const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || functions.config().paypal?.client_id;
      const PAYPAL_SECRET = process.env.PAYPAL_SECRET || functions.config().paypal?.secret;

      // Get access token
      const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
      const tokenRes = await axios.post(
        'https://api-m.paypal.com/v1/oauth2/token',
        'grant_type=client_credentials',
        { headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      const accessToken = tokenRes.data.access_token;

      // Verify order
      const orderRes = await axios.get(
        `https://api-m.paypal.com/v2/checkout/orders/${orderID}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (orderRes.data.status === 'COMPLETED') {
        return res.json({ success: true, order: orderRes.data });
      } else {
        return res.status(400).json({ success: false, message: 'Payment not completed', order: orderRes.data });
      }
    } catch (error) {

      return res.status(500).json({ success: false, message: 'PayPal verification failed', error: error.message });
    }
  });
});

// Create a withdrawal request
exports.createWithdrawalRequest = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');

  const { amountTokens, amountUSD, amountAfterFee, fee, withdrawalMethod, identifier, earnedFromWagers, fromReferrals } = data;
  const userId = context.auth.uid;

  if (!earnedFromWagers && !fromReferrals) {
    throw new functions.https.HttpsError('failed-precondition',
    'Only coins earned from wagers or referrals can be withdrawn. Purchased coins are not eligible for withdrawal.');
  }
  if (!amountTokens || amountTokens < 5) {
    throw new functions.https.HttpsError('failed-precondition',
    'You need at least 5 coins earned from wagers or referrals to withdraw.');
  }
  if (!withdrawalMethod || !identifier) {
    throw new functions.https.HttpsError('invalid-argument', 'Withdrawal method and identifier are required.');
  }
  if (withdrawalMethod === 'paypal' && (!identifier.includes('@') || identifier.length < 5)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid PayPal email.');
  }
  if (withdrawalMethod === 'cashapp' && (!identifier.startsWith('$') || identifier.length < 3)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid CashApp $cashtag.');
  }

  // Get user data and check balances
  const userRef = admin.firestore().collection('users').doc(userId);
  const userDoc = await userRef.get();
  if (!userDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'User not found.');
  }
  const userData = userDoc.data();

  // Calculate withdrawable amounts
  const wagerEarnings = userData.wagerEarnings || 0;
  const referralEarnings = userData.referralEarnings || 0; // Bonuses from referrals
  const referralCommission = userData.referralCommission || 0; // Commission from referrals
  const bonusTokens = userData.bonusTokens || 0; // Bonus tokens (withdrawable)
  const currentBalance = userData.tokenBalance || 0;

  // Calculate total withdrawable amount
  const totalWithdrawable = wagerEarnings + referralEarnings + referralCommission + bonusTokens;

  if (totalWithdrawable < amountTokens) {
    throw new functions.https.HttpsError('failed-precondition',
    `You can only withdraw coins earned from wagers and referrals. You have ${totalWithdrawable.toFixed(2)} coins available for withdrawal.`);
  }

  // For referral withdrawals, validate against available referral earnings
  if (fromReferrals) {
    const totalReferralEarnings = referralEarnings + referralCommission + bonusTokens;
    if (totalReferralEarnings < amountTokens) {
      throw new functions.https.HttpsError('failed-precondition',
      `Insufficient referral earnings. You requested to withdraw ${amountTokens} coins but you have ${totalReferralEarnings.toFixed(2)} coins in referral earnings.`);
    }
  } else {
    // For regular withdrawals, check total balance
    if (currentBalance < amountTokens) {
      throw new functions.https.HttpsError('failed-precondition',
      `Insufficient balance. You requested to withdraw ${amountTokens} coins but your balance is ${currentBalance} coins.`);
    }
  }

  // Create the withdrawal request
  const requestRef = await admin.firestore().collection('withdrawalRequests').add({
    userId,
    amountTokens,
    amountUSD,
    amountAfterFee,
    fee,
    withdrawalMethod,
    identifier,
    status: 'pending',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    notes: '',
    earnedFromWagers: earnedFromWagers || false,
    fromReferrals: fromReferrals || false,
    // Add clear withdrawal type for admin/user interface differentiation
    withdrawalType: fromReferrals ? 'referral' : 'regular',
    userBalanceAtRequest: currentBalance,
    wagerEarningsAtRequest: wagerEarnings,
    referralEarningsAtRequest: referralEarnings,
    referralCommissionAtRequest: referralCommission,
    bonusTokensAtRequest: bonusTokens,
    totalWithdrawableAtRequest: totalWithdrawable
  });


  return {
    success: true,
    requestId: requestRef.id,
    message: `Withdrawal request for ${amountTokens} coins submitted successfully. After fees, you will receive $${amountAfterFee.toFixed(2)}.`
  };
});

// Admin-only withdrawal endpoint
exports.processWithdrawalRequest = functions.https.onCall(async (data, context) => {
  try {
    // quick check: admin SDK is properly initialized
    if (!admin) {

      throw new functions.https.HttpsError('internal', 'Firebase Admin SDK not initialized');
    }

    if (!admin.firestore) {

      throw new functions.https.HttpsError('internal', 'Firebase Admin Firestore not available');
    }

    if (!admin.firestore.FieldValue) {

      throw new functions.https.HttpsError('internal', 'Firebase Admin FieldValue not available');
    }

    if (!context.auth) {

      throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }


    if (!context.auth.uid) {

      throw new functions.https.HttpsError('unauthenticated', 'Invalid authentication token.');
    }

    // boot database connection

    const db = admin.firestore();
    if (!db) {

      throw new functions.https.HttpsError('internal', 'Database connection failed');
    }



    // Test database connection
    if (!db.collection) {

      throw new functions.https.HttpsError('internal', 'Database collection method not available');
    }

    // Verify admin status
    const adminDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!adminDoc.exists || !adminDoc.data().isAdmin) {

      throw new functions.https.HttpsError('permission-denied', 'Only admins can process withdrawals.');
    }

    const { requestId, status, adminNote } = data;


    if (!requestId) {

      throw new functions.https.HttpsError('invalid-argument', 'Request ID is required.');
    }

    // Get the withdrawal request

    const withdrawalRequestRef = db.collection('withdrawalRequests').doc(requestId);



    if (!withdrawalRequestRef) {

      throw new functions.https.HttpsError('internal', 'Failed to create document reference');
    }

    const requestDoc = await withdrawalRequestRef.get();


    if (!requestDoc.exists) {

      throw new functions.https.HttpsError('not-found', 'Withdrawal request not found.');
    }

    const requestData = requestDoc.data();



    if (!requestData.userId) {

      throw new functions.https.HttpsError('invalid-argument', 'Invalid withdrawal request: missing userId');
    }
    if (!requestData.amountTokens || isNaN(requestData.amountTokens)) {

      throw new functions.https.HttpsError('invalid-argument', 'Invalid withdrawal request: missing or invalid amountTokens');
    }
    if (!requestData.withdrawalMethod) {

      throw new functions.https.HttpsError('invalid-argument', 'Invalid withdrawal request: missing withdrawalMethod');
    }
    if (!requestData.identifier) {

      throw new functions.https.HttpsError('invalid-argument', 'Invalid withdrawal request: missing identifier');
    }

    if (status === 'approved') {
      // Deduct tokens from user account
      const userRef = db.collection('users').doc(requestData.userId);
      if (!userRef) {

        throw new functions.https.HttpsError('internal', 'Failed to create user document reference');
      }

      const userDoc = await userRef.get();
      if (!userDoc.exists) {

        throw new functions.https.HttpsError('not-found', 'User not found.');
      }
      const userTokens = userDoc.data().tokenBalance || 0;


      // For referral withdrawals, validate against available referral earnings
      if (requestData.fromReferrals) {
        const userData = userDoc.data();
        const totalReferralEarnings = (userData.referralEarnings || 0) + (userData.referralCommission || 0) + (userData.bonusTokens || 0);
        if (totalReferralEarnings < requestData.amountTokens) {

          throw new functions.https.HttpsError(
            'failed-precondition',
            `User has insufficient referral earnings. Requested: ${requestData.amountTokens}, Available: ${totalReferralEarnings}`
          );
        }
      } else {
        // For regular withdrawals, check total balance
        if (userTokens < requestData.amountTokens) {

          throw new functions.https.HttpsError(
            'failed-precondition',
            `User has insufficient tokens. Requested: ${requestData.amountTokens}, Available: ${userTokens}`
          );
        }
      }

      if (requestData.withdrawalMethod === 'paypal') {

      } else if (requestData.withdrawalMethod === 'cashapp') {

      } else {

      }

      const payoutId = `SIMULATED_PAYOUT_${Date.now()}`;


      // Record the transaction

      try {
        await db.collection('transactions').add({
          userId: requestData.userId,
          type: 'withdrawal',
          amount: -requestData.amountTokens,
          withdrawalMethod: requestData.withdrawalMethod,
          identifier: requestData.identifier,
          status: 'completed',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          note: adminNote || 'Withdrawal processed',
          requestId: requestId
        });

      } catch (transactionError) {

        throw new functions.https.HttpsError('internal', `Failed to record transaction: ${transactionError.message}`);
      }

      // Record the withdrawal fee in siteEarnings (with null checks)
      const feeAmount = requestData.fee || 0;
      const feePercent = feeAmount && requestData.amountTokens ? feeAmount / requestData.amountTokens : 0;

      await db.collection('siteEarnings').add({
        type: 'withdrawal_fee',
        amount: feeAmount,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        sourceUserId: requestData.userId,
        sourceRequestId: requestId,
        feePercent: feePercent
      });


      // Add platform wallet fee record (with null checks)
      if (feeAmount > 0) {
        try {
          const batch = db.batch();
          await recordPlatformWalletFee({
            db: db,
            batch: batch,
            feeType: 'withdrawal_fee',
            amount: feeAmount,
            meta: {
              withdrawalRequestId: requestId,
              feePercent: feePercent
            }
          });
          await batch.commit();

        } catch (walletFeeError) {



        }
      } else {

      }

      // Update user balance and earnings - properly deduct from the correct sources
      const updateData = {};

      if (requestData.fromReferrals) {
        // For referral withdrawals, ONLY deduct from referral earnings - do NOT touch tokenBalance
        // The user's tokenBalance should remain intact for wagers

        const userData = userDoc.data();
        const totalReferralEarnings = (userData.referralEarnings || 0) + (userData.bonusTokens || 0);
        const totalReferralCommission = userData.referralCommission || 0;
        const totalReferralWithdrawable = totalReferralEarnings + totalReferralCommission;

        if (totalReferralWithdrawable > 0) {
          const earningsRatio = totalReferralEarnings / totalReferralWithdrawable;
          const commissionRatio = totalReferralCommission / totalReferralWithdrawable;

          const earningsDeduction = Math.min(requestData.amountTokens * earningsRatio, totalReferralEarnings);
          const bonusDeduction = Math.min(earningsDeduction, userData.bonusTokens || 0);
          const referralEarningsDeduction = earningsDeduction - bonusDeduction;
          const commissionDeduction = Math.min(requestData.amountTokens * commissionRatio, totalReferralCommission);

          if (bonusDeduction > 0) {
            updateData.bonusTokens = admin.firestore.FieldValue.increment(-bonusDeduction);
          }
          if (referralEarningsDeduction > 0) {
            updateData.referralEarnings = admin.firestore.FieldValue.increment(-referralEarningsDeduction);
          }
          if (commissionDeduction > 0) {
            updateData.referralCommission = admin.firestore.FieldValue.increment(-commissionDeduction);
          }
        }
      } else {
        // For regular withdrawals, deduct from tokenBalance and wagerEarnings
        updateData.tokenBalance = admin.firestore.FieldValue.increment(-requestData.amountTokens);

        // Deduct from wager earnings if this was earned from wagers
        if (requestData.earnedFromWagers) {
          updateData.wagerEarnings = admin.firestore.FieldValue.increment(-requestData.amountTokens);
        }
      }





      if (!userRef) {

        throw new functions.https.HttpsError('internal', 'User reference is null');
      }

      try {
        await userRef.update(updateData);

      } catch (updateError) {

        throw new functions.https.HttpsError('internal', `Failed to update user balance: ${updateError.message}`);
      }

      // Update request status



      if (!withdrawalRequestRef) {

        throw new functions.https.HttpsError('internal', 'Request reference is null');
      }

      try {
        const updatePayload = {
          status: 'completed',
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
          processedBy: context.auth.uid,
          payoutId: payoutId,
          notes: adminNote || ''
        };


        await withdrawalRequestRef.update(updatePayload);

      } catch (updateError) {

        throw new functions.https.HttpsError('internal', `Failed to update request status: ${updateError.message}`);
      }

      const amountUSD = requestData.amountUSD || requestData.amountTokens * 0.001;
      const amountAfterFee = requestData.amountAfterFee || requestData.amountTokens - feeAmount;

      return {
        success: true,
        message: `Withdrawal of ${requestData.amountTokens} coins ($${amountUSD.toFixed(2)}) processed successfully. After ${feeAmount} coins fee, user received ${amountAfterFee} coins ($${(amountAfterFee * 0.001).toFixed(2)}).`,
        payoutId: payoutId
      };
    } else if (status === 'rejected') {


      if (!withdrawalRequestRef) {

        throw new functions.https.HttpsError('internal', 'Request reference is null');
      }

      try {
        const rejectPayload = {
          status: 'rejected',
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
          processedBy: context.auth.uid,
          notes: adminNote || 'Rejected by admin'
        };


        await withdrawalRequestRef.update(rejectPayload);

      } catch (updateError) {

        throw new functions.https.HttpsError('internal', `Failed to reject request: ${updateError.message}`);
      }

      return {
        success: true,
        message: 'Withdrawal request rejected.'
      };
    } else {

      throw new functions.https.HttpsError('invalid-argument', 'Invalid status provided.');
    }
  } catch (error) {

    if (error.code) {
      // Re-throw Firebase errors
      throw error;
    } else {
      // Wrap other errors
      throw new functions.https.HttpsError('internal', `Internal error: ${error.message}`);
    }
  } finally {





    // Restore original logging behavior (commented out for debugging)
    // if (process.env.NODE_ENV === 'production') {
    //   console.log = () => {};
    //   console.error = () => {};
    // }
  }}); /**
 * Creates a PayPal order for coin purchases
 * Expects amount, currency, and packageId in the request
 */exports.createPaypalOrder = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', 'https://tokensite-6eef3.web.app');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-requested-with');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    // Require authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No auth token provided.' });
    }
    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (err) {
      return res.status(401).json({ error: 'Unauthorized: Invalid auth token.' });
    }
    const userId = decodedToken.uid;


    const COIN_PACKAGES = {
      '5_coins': { baseCoins: 5, bonusCoins: 0, totalCoins: 5, amount: 4.75 },
      '10_coins': { baseCoins: 10, bonusCoins: 1, totalCoins: 11, amount: 9.00 },
      '25_coins': { baseCoins: 25, bonusCoins: 3, totalCoins: 28, amount: 22.00 },
      '50_coins': { baseCoins: 50, bonusCoins: 7, totalCoins: 57, amount: 42.00 },
      '100_coins': { baseCoins: 100, bonusCoins: 15, totalCoins: 115, amount: 80.00 }
    };
    const packageId = req.body.packageId;
    const pkg = COIN_PACKAGES[packageId];
    if (!pkg) {
      return res.status(400).json({ error: 'Invalid packageId.' });
    }

    // --- Referral Code ---
    const referralCode = req.body.referralCode ? String(req.body.referralCode).toUpperCase() : null;
    const deviceId = req.body.deviceId ? String(req.body.deviceId) : null;
    const userIp = req.body.userIp ? String(req.body.userIp) : null;

    // Get PayPal credentials from env/config
    const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || functions.config().paypal?.client_id;
    const PAYPAL_SECRET = process.env.PAYPAL_SECRET || functions.config().paypal?.secret;
    const PAYPAL_API = 'https://api-m.paypal.com'; // LIVE API

    if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
      return res.status(500).json({ error: 'PayPal credentials are not configured.' });
    }

    // Get access token
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
    const tokenResponse = await axios.post(
      `${PAYPAL_API}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    const accessToken = tokenResponse.data.access_token;

    // Create order
    const orderResponse = await axios.post(
      `${PAYPAL_API}/v2/checkout/orders`,
      {
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: req.body.currency || 'USD',
            value: pkg.amount.toFixed(2)
          },
          custom_id: packageId, // Store packageId for later use
          description: `${pkg.baseCoins + pkg.bonusCoins} Coins Package`
        }],
        application_context: {
          return_url: req.body.returnUrl,
          cancel_url: req.body.cancelUrl
        }
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const orderId = orderResponse.data.id;
    const approvalUrl = orderResponse.data.links.find((link) => link.rel === 'approve')?.href;
    if (!approvalUrl) {
      return res.status(500).json({ error: 'No approval URL found in PayPal response.' });
    }

    // Write order to Firestore
    await admin.firestore().collection('paypal_orders').doc(orderId).set({
      orderId,
      userId,
      packageId,
      amount: pkg.amount,
      currency: req.body.currency || 'USD',
      baseCoins: pkg.baseCoins,
      bonusCoins: pkg.bonusCoins,
      totalCoins: pkg.totalCoins,
      status: 'CREATED',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      ...(referralCode ? { referralCode } : {}),
      ...(deviceId ? { deviceId } : {}),
      ...(userIp ? { userIp } : {})
    });

    res.status(200).json({ approvalUrl });
  } catch (error) {

    res.status(500).json({ error: 'Failed to create PayPal order.' });
  }
});

/**
 * Webhook handler for PayPal IPN (Instant Payment Notification) events
 * This endpoint receives notifications when PayPal payments are completed
 */
// Helper to verify Paypal webhook signature
async function verifyPaypalWebhook(req) {
  // You need to set these values from your PayPal developer dashboard
  const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID || functions.config().paypal.webhook_id;
  const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || functions.config().paypal.client_id;
  const PAYPAL_SECRET = process.env.PAYPAL_SECRET || functions.config().paypal.secret;
  const PAYPAL_API = process.env.PAYPAL_API || 'https://api-m.paypal.com'; // or sandbox

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');

  const verificationBody = {
    auth_algo: req.headers['paypal-auth-algo'],
    cert_url: req.headers['paypal-cert-url'],
    transmission_id: req.headers['paypal-transmission-id'],
    transmission_sig: req.headers['paypal-transmission-sig'],
    transmission_time: req.headers['paypal-transmission-time'],
    webhook_id: PAYPAL_WEBHOOK_ID,
    webhook_event: req.body
  };

  try {
    const response = await axios.post(
      `${PAYPAL_API}/v1/notifications/verify-webhook-signature`,
      verificationBody,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.verification_status === 'SUCCESS';
  } catch (err) {

    return false;
  }
}

exports.paypalWebhook = functions.https.onRequest((req, res) => {
  // Secure CORS: only allow trusted origins
  const allowedOrigins = [
  'https://tokensite-6eef3.web.app',
  'https://tokensite-6eef3.firebaseapp.com',
  'http://localhost:3000'];

  const origin = req.get('origin');
  if (allowedOrigins.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  }
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, PayPal-Transmission-Id, PayPal-Transmission-Time, PayPal-Transmission-Sig, PayPal-Cert-Url, PayPal-Auth-Algo');
  res.set('Access-Control-Allow-Credentials', 'true');


  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  cors(req, res, async () => {
    try {


      // Only allow POST method
      if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
      }

      // --- Webhook Verification ---
      const isVerified = await verifyPaypalWebhook(req);
      if (!isVerified) {

        return res.status(400).send('Invalid webhook signature');
      }
      // --- End Verification ---

      // Log the data


      // Get the event type
      const eventType = req.headers['paypal-event-type'] || req.body.event_type;
      const resource = req.body.resource || req.body;

      // deal with different event types
      switch (eventType) {
        case 'PAYMENT.CAPTURE.COMPLETED':
        case 'CHECKOUT.ORDER.APPROVED':
          await handleSuccessfulPaypalPayment(resource);
          break;
        default:

      }

      // Return a success response to acknowledge receipt
      res.status(200).json({ received: true });
    } catch (error) {

      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  });
});

/**
 * Handle a successful PayPal payment by crediting coins to the user's account
 */
async function handleSuccessfulPaypalPayment(paymentData) {
  try {
    const db = admin.firestore();

    // Extract order ID (use multiple possible sources to ensure compatibility)
    const orderId = paymentData.orderId || paymentData.id || paymentData.order_id;




    // Get the order from the database
    const orderDoc = await db.collection('paypal_orders').doc(orderId).get();

    if (!orderDoc.exists) {

      throw new Error('Order not found in database. Please contact support.');
    }

    const orderData = orderDoc.data();

    // double-checkthis order has already been processed
    if (orderData.status === 'COMPLETED') {

      return;
    }

    // Extract user and package information
    const { userId, packageId, amount } = orderData;

    // Get the correct coin amounts from our defined packages
    const COIN_PACKAGES = {
      '5_coins': { baseCoins: 5, bonusCoins: 0, totalCoins: 5, amount: 4.75 },
      '10_coins': { baseCoins: 10, bonusCoins: 1, totalCoins: 11, amount: 9.00 },
      '25_coins': { baseCoins: 25, bonusCoins: 3, totalCoins: 28, amount: 22.00 },
      '50_coins': { baseCoins: 50, bonusCoins: 7, totalCoins: 57, amount: 42.00 },
      '100_coins': { baseCoins: 100, bonusCoins: 15, totalCoins: 115, amount: 80.00 }
    };

    if (!packageId || !COIN_PACKAGES[packageId]) {

      throw new Error('Invalid package ID');
    }

    const { baseCoins, bonusCoins, totalCoins } = COIN_PACKAGES[packageId];

    if (!userId) {

      throw new Error('No user ID associated with this order');
    }

    // Update the user's token balance
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {

      throw new Error('User not found in database');
    }

    // Get current user data
    const userData = userDoc.data();
    const currentBalance = userData.tokenBalance || 0;
    const currentPurchasedTokens = userData.purchasedTokens || 0;
    const newBalance = currentBalance + totalCoins;



    try {
      // Create a new batch
      const batch = db.batch();

      // Update user balance with all relevant fields
      batch.update(userRef, {
        tokenBalance: newBalance,
        coins: newBalance, // Ensure both fields are updated for compatibility
        purchasedTokens: currentPurchasedTokens + totalCoins,
        lastBalanceUpdate: admin.firestore.FieldValue.serverTimestamp()
      });

      // Create a unique transaction ID
      const transactionId = `paypal_${orderId}_${Date.now()}`;
      const transactionRef = db.collection('transactions').doc(transactionId);

      // Record transaction with all necessary details
      batch.set(transactionRef, {
        userId: userId,
        type: 'purchase',
        amount: totalCoins,
        baseAmount: baseCoins,
        bonusAmount: bonusCoins,
        paymentMethod: 'paypal',
        paymentAmount: amount, // Dollar amount for referral commission
        paymentOrderId: orderId,
        packageId: packageId,
        previousBalance: currentBalance,
        newBalance: newBalance,
        status: 'completed',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Update order status
      batch.update(db.collection('paypal_orders').doc(orderId), {
        status: 'COMPLETED',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        paymentData: paymentData,
        coinsAdded: totalCoins,
        previousUserBalance: currentBalance,
        newUserBalance: newBalance
      });

      // Commit the batch
      await batch.commit();



      // Double-check that the balance was updated correctly
      const updatedUserDoc = await userRef.get();
      const updatedBalance = updatedUserDoc.data().tokenBalance;


      // === Referral Logic ===
      if (orderData.referralCode) {
        try {
          const referralService = require('./referralService');
          const referralCode = orderData.referralCode.toUpperCase();
          const deviceId = orderData.deviceId || paymentData.deviceId || '';
          const userIp = orderData.userIp || paymentData.userIp || '';
          // 1. Validate referral code
          const codeObj = await referralService.getReferralCode(referralCode);
          if (!codeObj || !codeObj.isActive) {

            return;
          }
          // 2. Prevent self-referral
          if (codeObj.creatorUserId === userId) {

            return;
          }
          // 3. Prevent multiple uses by same user/device/IP
          const [priorByUser, priorByDevice, priorByIp] = await Promise.all([
          referralService.getReferralUsagesByUser(userId),
          deviceId ? referralService.getReferralUsagesByCode(referralCode) : Promise.resolve([]),
          userIp ? referralService.getReferralUsagesByCode(referralCode) : Promise.resolve([])]
          );
          if (priorByUser.some((u) => u.referralCode === referralCode)) {

            return;
          }
          if (deviceId && priorByDevice.some((u) => u.deviceId === deviceId)) {

            return;
          }
          if (userIp && priorByIp.some((u) => u.userIp === userIp)) {

            return;
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

        } catch (err) {

        }
      }
      // === End Referral Logic ===

      return {
        success: true,
        orderId,
        userId,
        coinsAdded: totalCoins,
        newBalance: updatedBalance
      };
    } catch (batchError) {


      // Try a direct update as fallback
      await userRef.update({
        tokenBalance: newBalance,
        coins: newBalance
      });


      throw batchError;
    }
  } catch (error) {

    throw error;
  }
}
/**
 * Captures a PayPal payment after the user has approved it
 */
exports.capturePaypalPayment = functions.https.onRequest((req, res) => {
  // Set CORS headers for all responses
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // deal with preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  cors(req, res, async () => {
    try {
      // Only allow POST method
      if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
      }

      // Get auth token from headers
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).send('Unauthorized');
        return;
      }

      const idToken = authHeader.split('Bearer ')[1];

      // Verify auth token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      if (!decodedToken) {
        res.status(401).send('Invalid token');
        return;
      }

      const userId = decodedToken.uid;


      const { orderID, PayerID } = req.body;

      if (!orderID) {
        res.status(400).send('Order ID is required');
        return;
      }

      // Get PayPal credentials from Firebase Config
      const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || functions.config().paypal?.client_id;
      const PAYPAL_SECRET = process.env.PAYPAL_SECRET || functions.config().paypal?.secret;

      if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
        res.status(500).send('PayPal API credentials not configured');
        return;
      }

      // Get access token
      const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
      const tokenRes = await axios.post(
        'https://api-m.paypal.com/v1/oauth2/token',
        'grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const accessToken = tokenRes.data.access_token;

      // Capture the payment
      const captureResponse = await axios.post(
        `https://api-m.paypal.com/v2/checkout/orders/${orderID}/capture`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      const captureData = captureResponse.data;


      // Get the order details from our database
      const db = admin.firestore();
      const orderRef = db.collection('paypal_orders').doc(orderID);
      const orderDoc = await orderRef.get();

      let packageDetails;

      // If we have the order in our database
      if (orderDoc.exists) {
        const orderData = orderDoc.data();


        // Check order owner
        if (orderData.userId !== userId) {

        }

        // double-checkthis order has already been processed
        if (orderData.status === 'COMPLETED') {

          res.status(200).json({
            success: true,
            message: 'Payment already processed',
            orderId: orderID
          });
          return;
        }

        // Defensive: packageId must always come from Firestore orderDoc
        const packageId = orderData.packageId;
        const COIN_PACKAGES = {
          '5_coins': { baseCoins: 5, bonusCoins: 0, totalCoins: 5, amount: 4.75 },
          '10_coins': { baseCoins: 10, bonusCoins: 1, totalCoins: 11, amount: 9.00 },
          '25_coins': { baseCoins: 25, bonusCoins: 3, totalCoins: 28, amount: 22.00 },
          '50_coins': { baseCoins: 50, bonusCoins: 7, totalCoins: 57, amount: 42.00 },
          '100_coins': { baseCoins: 100, bonusCoins: 15, totalCoins: 115, amount: 80.00 }
        };

        if (!packageId || !COIN_PACKAGES[packageId]) {

          throw new Error('Invalid or missing packageId in PayPal order. Please contact support.');
        }

        const pkg = COIN_PACKAGES[packageId];
        packageDetails = {
          packageId,
          baseCoins: pkg.baseCoins,
          bonusCoins: pkg.bonusCoins,
          totalCoins: pkg.totalCoins,
          amount: pkg.amount
        };


        // work throughthe payment with our improved handler to ensure balance updates correctly


        // We don't update the order status here - that will be done in handleSuccessfulPaypalPayment
        // to ensure atomicity with the balance update

        // Call our improved handler with complete payment data
        const result = await handleSuccessfulPaypalPayment({
          id: orderID,
          orderId: orderID, // Ensure both id and orderId are available
          status: 'COMPLETED',
          payer: captureData.payer,
          purchase_units: captureData.purchase_units,
          captureData: captureData
        });



        // Refresh user document to get latest balance
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        const currentBalance = userDoc.exists ? userDoc.data().tokenBalance || 0 : 0;

        // Log the final state for debugging


        // Return success response
        res.status(200).json({
          success: true,
          message: 'Payment captured successfully',
          orderId: orderID,
          packageDetails
        });
      } else {
        // If order not in our database, abort and do not process

        throw new Error('Order not found in database. Please contact support.');
      }
    } catch (error) {


      // Try to extract more detailed error information from PayPal
      let errorMessage = error.message;
      if (error.response && error.response.data) {
        const paypalError = error.response.data;
        errorMessage = paypalError.message || paypalError.error_description || errorMessage;

      }

      // Update order status to ERROR for tracking
      try {
        if (orderID) {
          const db = admin.firestore();
          await db.collection('paypal_orders').doc(orderID).update({
            status: 'ERROR',
            errorMessage: errorMessage,
            errorTimestamp: admin.firestore.FieldValue.serverTimestamp(),
            errorDetails: JSON.stringify(error.toString())
          });

        }
      } catch (updateError) {

      }

      res.status(400).json({
        success: false,
        error: errorMessage,
        details: error.toString()
      });
    }
  });
});

// Create a crypto payment charge for Coinbase Commerce
exports.createCryptoCharge = functions.https.onCall(async (data, context) => {
  // guard:the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to create a crypto charge.'
    );
  }

  try {
    const { amount, packageId, redirectUrl, cancelUrl, referralCode, deviceId, userIp } = data;
    if (!amount || amount <= 0) {
      throw new functions.https.HttpsError('invalid-argument', 'A valid amount is required.');
    }
    if (!packageId) {
      throw new functions.https.HttpsError('invalid-argument', 'Package ID is required.');
    }

    const userId = context.auth.uid;


    // Coinbase Commerce API configuration
    const COINBASE_API_KEY = process.env.COINBASE_API_KEY || functions.config().coinbase?.api_key || '';
    const COINBASE_API_URL = 'https://api.commerce.coinbase.com';



    if (!COINBASE_API_KEY) {
      throw new functions.https.HttpsError('failed-precondition', 'Coinbase API key not configured.');
    }

    const payload = {
      name: 'Token Purchase',
      description: `Purchase of ${packageId} by user ${userId}`,
      pricing_type: 'fixed_price',
      local_price: {
        amount: amount.toFixed(2),
        currency: 'USD'
      },
      metadata: {
        userId,
        packageId,
        ...(referralCode ? { referralCode } : {}),
        ...(deviceId ? { deviceId } : {}),
        ...(userIp ? { userIp } : {})
      },
      redirect_url: redirectUrl,
      cancel_url: cancelUrl
    };

    const response = await axios.post(
      `${COINBASE_API_URL}/charges`,
      payload,
      {
        headers: {
          'X-CC-Api-Key': COINBASE_API_KEY,
          'X-CC-Version': '2018-03-22',
          'Content-Type': 'application/json'
        }
      }
    );

    const charge = response.data.data;
    return {
      success: true,
      chargeId: charge.id,
      hostedUrl: charge.hosted_url,
      code: charge.code
    };
  } catch (error) {

    throw new functions.https.HttpsError('internal', 'An error occurred while creating the crypto charge.');
  }
});

// backend fn: to clean up duplicate refund requests and process pending refunds
exports.cleanupRefunds = functions.https.onCall(async (data, context) => {
  // Verify admin access
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  try {
    const db = admin.firestore();
    const results = {
      duplicatesRemoved: 0,
      refundsProcessed: 0,
      errors: []
    };

    // Get all pending refund requests grouped by matchId
    const pendingRequests = await db.collection('refund_requests').
    where('status', '==', 'pending').
    get();

    // Group by matchId
    const matchGroups = {};
    pendingRequests.forEach((doc) => {
      const data = doc.data();
      const matchId = data.matchId;

      if (!matchGroups[matchId]) {
        matchGroups[matchId] = [];
      }

      matchGroups[matchId].push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? data.createdAt.toDate() : new Date()
      });
    });



    // run each match
    for (const [matchId, requests] of Object.entries(matchGroups)) {
      try {


        // If multiple requests, keep only the oldest and cancel duplicates
        if (requests.length > 1) {
          const sorted = requests.sort((a, b) => a.createdAt - b.createdAt);
          const oldestRequest = sorted[0];
          const duplicates = sorted.slice(1);




          // Cancel duplicates
          const batch = db.batch();
          for (const duplicate of duplicates) {
            batch.update(db.collection('refund_requests').doc(duplicate.id), {
              status: 'cancelled',
              note: 'Duplicate request - cancelled by cleanup function',
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }
          await batch.commit();

          results.duplicatesRemoved += duplicates.length;
        }

        // Get the remaining request to process
        const requestToProcess = requests.sort((a, b) => a.createdAt - b.createdAt)[0];

        // Get match data
        const matchDoc = await db.collection('wagers').doc(matchId).get();

        if (!matchDoc.exists) {

          await db.collection('refund_requests').doc(requestToProcess.id).update({
            status: 'error',
            error: 'Match not found',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          results.errors.push(`Match ${matchId} not found`);
          continue;
        }

        const matchData = matchDoc.data();

        // double-checkalready processed
        if (matchData.refundsProcessed) {

          await db.collection('refund_requests').doc(requestToProcess.id).update({
            status: 'completed',
            note: 'Refunds already processed',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          continue;
        }


        if (matchData.status !== 'cancelled') {

          continue;
        }

        // work throughrefund


        const hostRef = db.collection('users').doc(matchData.hostId);
        const guestRef = db.collection('users').doc(matchData.guestId);

        // Get current user balances
        const [hostDoc, guestDoc] = await Promise.all([
        hostRef.get(),
        guestRef.get()]
        );

        if (!hostDoc.exists || !guestDoc.exists) {

          await db.collection('refund_requests').doc(requestToProcess.id).update({
            status: 'error',
            error: 'User(s) not found',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          results.errors.push(`User(s) not found for match ${matchId}`);
          continue;
        }

        const hostBalance = hostDoc.data().tokenBalance || 0;
        const guestBalance = guestDoc.data().tokenBalance || 0;
        const refundAmount = Number(matchData.amount);

        if (isNaN(refundAmount) || refundAmount <= 0) {

          await db.collection('refund_requests').doc(requestToProcess.id).update({
            status: 'error',
            error: 'Invalid refund amount',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          results.errors.push(`Invalid refund amount for match ${matchId}`);
          continue;
        }



        // run refunds in a batch
        const refundBatch = db.batch();

        // Refund to host
        refundBatch.update(hostRef, {
          tokenBalance: hostBalance + refundAmount
        });

        // Refund to guest
        refundBatch.update(guestRef, {
          tokenBalance: guestBalance + refundAmount
        });

        // Add transaction records
        const hostTransactionRef = db.collection('transactions').doc();
        refundBatch.set(hostTransactionRef, {
          userId: matchData.hostId,
          type: 'refund',
          amount: refundAmount,
          reason: `Match ${matchId} cancelled - cleanup function processing`,
          wagerId: matchId,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        const guestTransactionRef = db.collection('transactions').doc();
        refundBatch.set(guestTransactionRef, {
          userId: matchData.guestId,
          type: 'refund',
          amount: refundAmount,
          reason: `Match ${matchId} cancelled - cleanup function processing`,
          wagerId: matchId,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        // Update match to mark refunds as processed
        refundBatch.update(db.collection('wagers').doc(matchId), {
          refundsProcessed: true,
          refundedAt: admin.firestore.FieldValue.serverTimestamp(),
          refundInProgress: false,
          refundedHost: true,
          refundedGuest: true,
          refundAmount: refundAmount,
          refundedBy: 'cleanup_function'
        });

        // Update the refund request
        refundBatch.update(db.collection('refund_requests').doc(requestToProcess.id), {
          status: 'completed',
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
          note: 'Processed by cleanup function'
        });

        // Commit the batch
        await refundBatch.commit();



        // Add system message to chat
        try {
          await db.collection('wager_chats').add({
            wagerId: matchId,
            senderId: 'system',
            senderName: 'System',
            content: `Refund processed: ${refundAmount} tokens have been returned to both players.`,
            isSystem: true,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });
        } catch (chatError) {

        }

        results.refundsProcessed++;

      } catch (matchError) {

        results.errors.push(`Error processing match ${matchId}: ${matchError.message}`);
      }
    }



    return {
      success: true,
      ...results
    };

  } catch (error) {

    throw new functions.https.HttpsError('internal', `Cleanup failed: ${error.message}`);
  }
});

// Test function to manually trigger refund for a specific match (admin only)
exports.triggerRefundTest = functions.https.onCall(async (data, context) => {
  // Verify admin access
  if (!context.auth) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  const db = admin.firestore();
  const userDoc = await db.collection('users').doc(context.auth.uid).get();

  if (!userDoc.exists || !userDoc.data().isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  try {
    const { matchId } = data;

    if (!matchId) {
      throw new functions.https.HttpsError('invalid-argument', 'Match ID is required');
    }



    // Get the match
    const matchRef = db.collection('wagers').doc(matchId);
    const matchDoc = await matchRef.get();

    if (!matchDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Match not found');
    }

    const matchData = matchDoc.data();












    // Simulate the change object that would trigger the cloud function
    const change = {
      before: {
        data: () => ({ ...matchData, status: matchData.previousStatus || 'ready' })
      },
      after: {
        data: () => matchData,
        ref: matchRef
      }
    };

    const context_obj = {
      params: { wagerId: matchId }
    };



    // Call the actual refund logic (copy the relevant parts)
    if (matchData.status === 'cancelled') {


      if (matchData.refundsProcessed) {
        return {
          success: true,
          message: 'Refunds already processed',
          matchId: matchId
        };
      }

      const hostEntryFeesDeducted = matchData.entryFeesDeducted === true;
      const guestEntryFeesDeducted = matchData.guestEntryFeesDeducted === true;
      const hasHostPaid = hostEntryFeesDeducted || matchData.hostPaid === true;
      const hasGuestPaid = guestEntryFeesDeducted || matchData.guestPaid === true;
      const matchProgressed = matchData.previousStatus && ['ready', 'playing', 'submitting', 'dispute'].includes(matchData.previousStatus);
      const hasGuestJoined = matchData.guestId && matchData.guestName;

      const shouldRefundBasedOnFlags = hasHostPaid || hasGuestPaid;
      const shouldRefundBasedOnProgress = matchProgressed && hasGuestJoined;
      const shouldRefundBasedOnReadyStatus = matchData.previousStatus === 'ready' || matchData.status === 'ready';
      const shouldRefundBasedOnParticipants = matchData.participants && matchData.participants.length >= 2;












      if (shouldRefundBasedOnFlags || shouldRefundBasedOnProgress || shouldRefundBasedOnReadyStatus || shouldRefundBasedOnParticipants) {


        // double-checkusers exist
        const hostRef = db.collection('users').doc(matchData.hostId);
        const guestRef = db.collection('users').doc(matchData.guestId);

        const [hostDoc, guestDoc] = await Promise.all([
        hostRef.get(),
        guestRef.get()]
        );

        if (!hostDoc.exists) {
          return {
            success: false,
            error: `Host user ${matchData.hostId} not found`,
            matchId: matchId
          };
        }

        if (!guestDoc.exists) {
          return {
            success: false,
            error: `Guest user ${matchData.guestId} not found`,
            matchId: matchId
          };
        }

        return {
          success: true,
          message: 'Refund test passed - automatic refund should work',
          details: {
            matchId: matchId,
            amount: matchData.amount,
            hostBalance: hostDoc.data().tokenBalance || 0,
            guestBalance: guestDoc.data().tokenBalance || 0,
            refundChecks: {
              shouldRefundBasedOnFlags,
              shouldRefundBasedOnProgress,
              shouldRefundBasedOnReadyStatus,
              shouldRefundBasedOnParticipants
            }
          }
        };
      } else {
        return {
          success: false,
          message: 'No refund indicators found - automatic refund would not trigger',
          details: {
            matchId: matchId,
            refundChecks: {
              shouldRefundBasedOnFlags,
              shouldRefundBasedOnProgress,
              shouldRefundBasedOnReadyStatus,
              shouldRefundBasedOnParticipants
            }
          }
        };
      }
    } else {
      return {
        success: false,
        message: `Match is not cancelled (status: ${matchData.status})`,
        matchId: matchId
      };
    }

  } catch (error) {

    throw new functions.https.HttpsError('internal', `Test failed: ${error.message}`);
  }
});

// === MASTER ACHIEVEMENT AND COSMETIC LISTS (REBUILD) ===

const MASTER_ACHIEVEMENTS = [
{
  id: 'achievement_royal_decree',
  name: 'Royal Decree',
  description: 'Special achievement for Royal Decree.',
  cosmeticReward: 'card_royal_decree',
  criteria: { type: 'custom', key: 'royal_decree' }
},
{
  id: 'achievement_champions_honor',
  name: "Champion's Honor",
  description: 'Special achievement for Champion\'s Honor.',
  cosmeticReward: 'card_champions_honor',
  criteria: { type: 'custom', key: 'champions_honor' }
},
{
  id: 'achievement_one_percent',
  name: 'One Percent',
  description: 'Special achievement for One Percent.',
  cosmeticReward: 'card_one_percent',
  criteria: { type: 'custom', key: 'one_percent' }
},
{
  id: 'achievement_fire_badge',
  name: 'Fire Badge',
  description: 'Win 10 total token matches.',
  cosmeticReward: 'flair_fire',
  criteria: { type: 'stat', stat: 'matchesWon', value: 10 }
},
{
  id: 'achievement_phoenix_rising',
  name: 'Phoenix Rising',
  description: 'Win 25 total wager matches.',
  cosmeticReward: 'card_phoenix_rising',
  criteria: { type: 'stat', stat: 'matchesWon', value: 25 }
},
{
  id: 'achievement_coin_collector',
  name: 'Coin Collector',
  description: 'Earn 50 total coins from wagers.',
  cosmeticReward: 'card_coin_collector',
  criteria: { type: 'stat', stat: 'totalEarnings', value: 50 }
},
{
  id: 'achievement_tycoon',
  name: 'Tycoon',
  description: 'Earn 200+ total coins from wagers.',
  cosmeticReward: 'card_tycoon',
  criteria: { type: 'stat', stat: 'totalEarnings', value: 200 }
},
{
  id: 'achievement_high_roller',
  name: 'High Roller',
  description: 'Win 10 wagers of 5+ coins.',
  cosmeticReward: 'card_high_roller',
  criteria: { type: 'custom', key: 'high_roller_wins', value: 10 }
},
{
  id: 'achievement_veterans_edge',
  name: "Veteran's Edge",
  description: 'Play at least 100 total wagers.',
  cosmeticReward: 'card_veterans_edge',
  criteria: { type: 'stat', stat: 'matchesPlayed', value: 100 }
},
{
  id: 'achievement_snipers_mark',
  name: 'Snipers Mark',
  description: 'Successfully hit 25 snipes.',
  cosmeticReward: 'card_snipers_mark',
  criteria: { type: 'custom', key: 'snipesHit', value: 25 }
},
{
  id: 'achievement_unbreakable',
  name: 'Unbreakable',
  description: 'Go 5-0 in 1v1 wagers without Wager Insurance.',
  cosmeticReward: 'card_unbreakable',
  criteria: { type: 'custom', key: 'unbreakableAchieved', value: true }
},
{
  id: 'achievement_snipe_king',
  name: 'Snipe King',
  description: 'Special achievement for Snipe King.',
  cosmeticReward: 'card_snipe_king',
  criteria: { type: 'custom', key: 'snipe_king' }
},
{
  id: 'achievement_royalty',
  name: 'Royalty',
  description: 'Special achievement for Royalty.',
  cosmeticReward: 'card_royalty',
  criteria: { type: 'custom', key: 'royalty' }
},
{
  id: 'achievement_undefeated',
  name: 'Undefeated',
  description: 'Special achievement for Undefeated.',
  cosmeticReward: 'card_undefeated',
  criteria: { type: 'custom', key: 'undefeated' }
},
{
  id: 'achievement_golden_crown',
  name: 'Golden Crown',
  description: 'Special achievement for Golden Crown.',
  cosmeticReward: 'card_golden_crown',
  criteria: { type: 'custom', key: 'golden_crown' }
},
{
  id: 'achievement_rank_1',
  name: 'Rank #1 Player',
  description: 'Reach #1 on the leaderboard',
  cosmeticReward: 'card_royal_decree',
  criteria: { type: 'custom', key: 'rank_1' }
},
{
  id: 'achievement_top_10',
  name: 'Top 10 Player',
  description: 'Reach top 10 on the leaderboard',
  cosmeticReward: 'card_champions_honor',
  criteria: { type: 'custom', key: 'top_10' }
},
{
  id: 'achievement_top_1_percent',
  name: 'Top 1% Player',
  description: 'Be in the top 1% of earners',
  cosmeticReward: 'card_one_percent',
  criteria: { type: 'custom', key: 'top_1_percent' }
}];


const MASTER_COSMETICS = [
// Only cosmetics tied to achievements
{ id: 'card_royal_decree', name: 'Royal Decree', unlockType: 'achievement', achievementId: 'achievement_royal_decree' },
{ id: 'card_champions_honor', name: "Champion's Honor", unlockType: 'achievement', achievementId: 'achievement_champions_honor' },
{ id: 'card_one_percent', name: 'One Percent', unlockType: 'achievement', achievementId: 'achievement_one_percent' },
{ id: 'flair_fire', name: 'Fire Badge', unlockType: 'achievement', achievementId: 'achievement_fire_badge' },
{ id: 'card_phoenix_rising', name: 'Phoenix Rising', unlockType: 'achievement', achievementId: 'achievement_phoenix_rising' },
{ id: 'card_coin_collector', name: 'Coin Collector', unlockType: 'achievement', achievementId: 'achievement_coin_collector' },
{ id: 'card_tycoon', name: 'Tycoon', unlockType: 'achievement', achievementId: 'achievement_tycoon' },
{ id: 'card_high_roller', name: 'High Roller', unlockType: 'achievement', achievementId: 'achievement_high_roller' },
{ id: 'card_veterans_edge', name: "Veteran's Edge", unlockType: 'achievement', achievementId: 'achievement_veterans_edge' },
{ id: 'card_snipers_mark', name: 'Snipers Mark', unlockType: 'achievement', achievementId: 'achievement_snipers_mark' },
{ id: 'card_unbreakable', name: 'Unbreakable', unlockType: 'achievement', achievementId: 'achievement_unbreakable' },
{ id: 'card_snipe_king', name: 'Snipe King', unlockType: 'achievement', achievementId: 'achievement_snipe_king' },
{ id: 'card_royalty', name: 'Royalty', unlockType: 'achievement', achievementId: 'achievement_royalty' },
{ id: 'card_undefeated', name: 'Undefeated', unlockType: 'achievement', achievementId: 'achievement_undefeated' },
{ id: 'card_golden_crown', name: 'Golden Crown', unlockType: 'achievement', achievementId: 'achievement_golden_crown' },
{ id: 'card_royal_decree', name: 'Royal Decree', unlockType: 'achievement', achievementId: 'achievement_rank_1' },
{ id: 'card_champions_honor', name: "Champion's Honor", unlockType: 'achievement', achievementId: 'achievement_top_10' },
{ id: 'card_one_percent', name: 'One Percent', unlockType: 'achievement', achievementId: 'achievement_top_1_percent' }];


// === UNIVERSAL ACHIEVEMENT/COSMETIC UNLOCK TRIGGER (REBUILD) ===
exports.achievementCosmeticAutoUnlock = functions.firestore.
document('users/{userId}/stats/stats').
onWrite(async (change, context) => {
  const userId = context.params.userId;
  const db = admin.firestore();
  const stats = change.after.exists ? change.after.data() : null;
  if (!stats) return null;

  // Helper: get user's unlocked achievements/cosmetics
  const userAchievementsRef = db.collection(`users/${userId}/achievements`);
  const userCosmeticsRef = db.collection(`users/${userId}/cosmetics`);
  const [achievementsSnap, cosmeticsSnap] = await Promise.all([
  userAchievementsRef.get(),
  userCosmeticsRef.get()]
  );
  const unlockedAchievements = new Set(achievementsSnap.docs.map((doc) => doc.id));
  const ownedCosmetics = new Set(cosmeticsSnap.docs.map((doc) => doc.id));

  let newAchievements = [];
  let newCosmetics = [];
  let batch = db.batch();

  // Check all master achievements
  for (const ach of MASTER_ACHIEVEMENTS) {
    let unlocked = false;
    // Stat-based criteria
    if (ach.criteria.type === 'stat') {
      if ((stats[ach.criteria.stat] || 0) >= ach.criteria.value) unlocked = true;
    }
    // Custom criteria (for migration, admin, or future use)
    if (ach.criteria.type === 'custom') {
      // For now, skip unless we add custom logic or migration
      continue;
    }
    if (unlocked && !unlockedAchievements.has(ach.id)) {
      // Unlock achievement
      batch.set(userAchievementsRef.doc(ach.id), {
        unlockedAt: admin.firestore.FieldValue.serverTimestamp(),
        name: ach.name,
        description: ach.description
      });
      newAchievements.push(ach.id);
      // Unlock cosmetic if not already owned
      if (ach.cosmeticReward && !ownedCosmetics.has(ach.cosmeticReward)) {
        const cosmetic = MASTER_COSMETICS.find((c) => c.id === ach.cosmeticReward);
        if (cosmetic) {
          batch.set(userCosmeticsRef.doc(cosmetic.id), {
            unlockedAt: admin.firestore.FieldValue.serverTimestamp(),
            name: cosmetic.name,
            unlockType: cosmetic.unlockType,
            achievementId: cosmetic.achievementId
          });
          newCosmetics.push(cosmetic.id);
        }
      }
    }
  }

  if (newAchievements.length > 0 || newCosmetics.length > 0) {
    await batch.commit();

  } else {

  }
  return null;
});

// === CLAIM ACHIEVEMENT REWARD FUNCTION ===
exports.claimAchievementReward = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to claim rewards.');
  }

  const userId = context.auth.uid;
  const { achievementId } = data;



  if (!achievementId) {
    throw new functions.https.HttpsError('invalid-argument', 'Achievement ID is required.');
  }

  const db = admin.firestore();
  const achievement = MASTER_ACHIEVEMENTS.find((a) => a.id === achievementId);

  if (!achievement) {

    throw new functions.https.HttpsError('not-found', 'Achievement not found.');
  }



  // Get user data
  const [statsSnap, userAchievementsSnap, userCosmeticsSnap] = await Promise.all([
  db.doc(`userStats/${userId}`).get(),
  db.doc(`userAchievements/${userId}`).get(),
  db.doc(`userCosmetics/${userId}`).get()]
  );

  let stats = statsSnap.exists ? statsSnap.data() : null;
  const userAchievements = userAchievementsSnap.exists ? userAchievementsSnap.data() : { unlockedAchievements: [] };
  const userCosmetics = userCosmeticsSnap.exists ? userCosmeticsSnap.data() : { owned: [] };







  if (stats) {





  }

  if (!stats) {

    // Instead of failing, create empty stats

    stats = { matchesWon: 0, totalEarnings: 0, matchesPlayed: 0 };
  }

  // check:already claimed (both achievement unlocked AND cosmetic owned)
  if (userAchievements.unlockedAchievements?.includes(achievementId) &&
  achievement.cosmeticReward &&
  userCosmetics.owned?.includes(achievement.cosmeticReward)) {

    return { success: false, message: 'Reward already claimed.' };
  }

  // see ifeligible based on criteria
  let eligible = false;

  // IMPORTANT FIX: If the achievement is already marked as unlocked in userAchievements,
  // consider it eligible regardless of other criteria
  if (userAchievements.unlockedAchievements?.includes(achievementId)) {

    eligible = true;
  }
  // Otherwise check criteria
  else if (achievement.criteria.type === 'stat') {
    const statValue = stats[achievement.criteria.stat] || 0;
    eligible = statValue >= achievement.criteria.value;

  } else if (achievement.criteria.type === 'custom') {
    switch (achievement.criteria.key) {
      case 'high_roller_wins':
        const highRollerWins = userAchievements.highRollerWins || 0;
        eligible = highRollerWins >= achievement.criteria.value;

        break;
      case 'snipesHit':
        const snipesHit = userAchievements.snipesHit || 0;
        eligible = snipesHit >= achievement.criteria.value;

        break;
      case 'unbreakableAchieved':
        eligible = userAchievements.unbreakableAchieved === true;

        break;
      default:
        // For other custom achievements (like special admin-granted ones),
        // allow claiming if the achievement is already marked as unlocked in the frontend
        // This provides flexibility for special achievements
        eligible = true; // IMPORTANT FIX: Allow claiming special achievements

        break;
    }
  } else {

    throw new functions.https.HttpsError('failed-precondition', 'Unknown achievement criteria type.');
  }

  if (!eligible) {

    throw new functions.https.HttpsError('failed-precondition', 'Achievement not yet completed.');
  }



  // Grant achievement and cosmetic
  const batch = db.batch();
  const userAchievementsRef = db.doc(`userAchievements/${userId}`);
  const userCosmeticsRef = db.doc(`userCosmetics/${userId}`);

  // Add achievement to unlocked list if not already there
  if (!userAchievements.unlockedAchievements?.includes(achievementId)) {
    const updatedAchievements = [...(userAchievements.unlockedAchievements || []), achievementId];
    batch.set(userAchievementsRef, {
      ...userAchievements,
      unlockedAchievements: updatedAchievements,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }

  // Add cosmetic if it exists and not already owned
  if (achievement.cosmeticReward && !userCosmetics.owned?.includes(achievement.cosmeticReward)) {
    const updatedCosmetics = [...(userCosmetics.owned || []), achievement.cosmeticReward];
    batch.set(userCosmeticsRef, {
      ...userCosmetics,
      owned: updatedCosmetics,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }

  await batch.commit();
  return {
    success: true,
    message: 'Reward claimed!',
    achievementId,
    cosmeticId: achievement.cosmeticReward
  };
});

// === TRACK ACHIEVEMENT PROGRESS FUNCTION ===
exports.trackAchievementProgress = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to track progress.');
  }

  const userId = context.auth.uid;
  const { progressType, progressData } = data;

  if (!progressType) {
    throw new functions.https.HttpsError('invalid-argument', 'Progress type is required.');
  }

  const db = admin.firestore();
  const userAchievementsRef = db.doc(`userAchievements/${userId}`);

  try {
    // Get current achievements data
    const userAchievementsDoc = await userAchievementsRef.get();
    const userAchievements = userAchievementsDoc.exists ? userAchievementsDoc.data() : {
      userId: userId,
      unlockedAchievements: [],
      highRollerWins: 0,
      snipesHit: 0,
      currentUnbreakableStreak: 0,
      unbreakableAchieved: false
    };

    let updated = false;

    // Track different types of progress
    switch (progressType) {
      case 'snipe_hit':
        userAchievements.snipesHit = (userAchievements.snipesHit || 0) + 1;
        updated = true;

        break;

      case 'unbreakable_win':

        await incrementUnbreakableWin(userId);
        updated = true;
        break;

      case 'unbreakable_loss':
        // No operation for loss, do not reset anything
        break;

      default:

        return { success: false, message: 'Unknown progress type' };
    }

    if (updated) {
      // Update the achievements document
      await userAchievementsRef.set({
        ...userAchievements,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      // quick check: any achievements should be unlocked
      await checkAndUnlockAchievements(userId, userAchievements);

      return {
        success: true,
        progressType,
        newProgress: userAchievements
      };
    }

    return { success: true, message: 'No progress to update' };

  } catch (error) {

    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Helper function to check and unlock achievements based on current progress
async function checkAndUnlockAchievements(userId, userAchievements) {
  const db = admin.firestore();
  const userCosmeticsRef = db.doc(`userCosmetics/${userId}`);
  const userCosmeticsDoc = await userCosmeticsRef.get();
  const userCosmetics = userCosmeticsDoc.exists ? userCosmeticsDoc.data() : { owned: [] };

  let batch = db.batch();
  let newUnlocks = [];

  // Check custom achievements
  for (const achievement of MASTER_ACHIEVEMENTS) {
    if (achievement.criteria.type === 'custom' && !userAchievements.unlockedAchievements.includes(achievement.id)) {
      let shouldUnlock = false;

      switch (achievement.criteria.key) {
        case 'high_roller_wins':
          shouldUnlock = (userAchievements.highRollerWins || 0) >= achievement.criteria.value;
          break;
        case 'snipesHit':
          shouldUnlock = (userAchievements.snipesHit || 0) >= achievement.criteria.value;
          break;
        case 'unbreakableAchieved':
          shouldUnlock = userAchievements.unbreakableAchieved === true;
          break;
      }

      if (shouldUnlock) {
        // Unlock achievement
        const updatedAchievements = [...(userAchievements.unlockedAchievements || []), achievement.id];
        batch.set(db.doc(`userAchievements/${userId}`), {
          ...userAchievements,
          unlockedAchievements: updatedAchievements,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // Unlock cosmetic if not already owned
        if (achievement.cosmeticReward && !userCosmetics.owned.includes(achievement.cosmeticReward)) {
          const updatedCosmetics = [...(userCosmetics.owned || []), achievement.cosmeticReward];
          batch.set(userCosmeticsRef, {
            ...userCosmetics,
            owned: updatedCosmetics,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        }

        newUnlocks.push(achievement.id);

      }
    }
  }

  if (newUnlocks.length > 0) {
    await batch.commit();

  }

  return newUnlocks;
}

// === TEST FUNCTION FOR ACHIEVEMENT TRACKING (ADMIN ONLY) ===
exports.testAchievementTracking = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to test tracking.');
  }

  const db = admin.firestore();
  const userDoc = await db.collection('users').doc(context.auth.uid).get();

  if (!userDoc.exists || !userDoc.data().isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required for testing.');
  }

  const { testType, userId, testData } = data;

  if (!testType || !userId) {
    throw new functions.https.HttpsError('invalid-argument', 'testType and userId are required.');
  }

  try {
    const trackProgress = exports.trackAchievementProgress;
    let result;

    switch (testType) {
      case 'snipe_hit':
        result = await trackProgress({
          progressType: 'snipe_hit',
          progressData: {}
        }, { auth: { uid: userId } });
        break;

      case 'unbreakable_win':
        result = await trackProgress({
          progressType: 'unbreakable_win',
          progressData: { usedInsurance: testData?.usedInsurance || false }
        }, { auth: { uid: userId } });
        break;

      case 'unbreakable_loss':
        result = await trackProgress({
          progressType: 'unbreakable_loss',
          progressData: { usedInsurance: testData?.usedInsurance || false }
        }, { auth: { uid: userId } });
        break;

      default:
        throw new functions.https.HttpsError('invalid-argument', 'Invalid test type.');
    }

    return {
      success: true,
      testType,
      userId,
      result
    };

  } catch (error) {

    throw new functions.https.HttpsError('internal', error.message);
  }
});

// --- SHARED HIGH ROLLER LOGIC ---
async function incrementHighRollerWin({ userId, wagerAmount, source = 'backend' }) {
  const db = admin.firestore();
  const userAchievementsRef = db.doc(`userAchievements/${userId}`);

  // Logging for backend triggers


  if (!wagerAmount || typeof wagerAmount !== 'number') {

    throw new Error('Valid wager amount is required.');
  }
  if (wagerAmount < 5) {

    return { success: true, skipped: true, reason: 'Wager amount below 5 coins threshold', wagerAmount, threshold: 5 };
  }

  // Get current achievements data
  const userAchievementsDoc = await userAchievementsRef.get();
  let userAchievements;
  if (userAchievementsDoc.exists) {
    userAchievements = userAchievementsDoc.data();
  } else {
    userAchievements = {
      userId: userId,
      unlockedAchievements: [],
      highRollerWins: 0,
      snipesHit: 0,
      currentUnbreakableStreak: 0,
      unbreakableAchieved: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
  }

  const currentHighRollerWins = userAchievements.highRollerWins || 0;
  const newHighRollerWins = currentHighRollerWins + 1;

  // Update the achievements data
  const updatedAchievements = {
    ...userAchievements,
    highRollerWins: newHighRollerWins,
    lastHighRollerWin: {
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      wagerAmount: wagerAmount,
      source: source
    },
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await userAchievementsRef.set(updatedAchievements, { merge: true });


  // quick check: high roller achievement should be unlocked
  const HIGH_ROLLER_THRESHOLD = 10;
  let achievementUnlocked = false;
  if (newHighRollerWins >= HIGH_ROLLER_THRESHOLD) {
    const isAlreadyUnlocked = (updatedAchievements.unlockedAchievements || []).includes('achievement_high_roller');
    if (!isAlreadyUnlocked) {

      try {
        const unlockResult = await unlockHighRollerAchievement(userId, updatedAchievements);
        achievementUnlocked = unlockResult.success;

      } catch (unlockError) {

      }
    }
  }

  return {
    success: true,
    userId,
    wagerAmount,
    source,
    progress: {
      currentHighRollerWins: newHighRollerWins,
      threshold: HIGH_ROLLER_THRESHOLD,
      remaining: Math.max(0, HIGH_ROLLER_THRESHOLD - newHighRollerWins)
    },
    achievementUnlocked,
    timestamp: new Date().toISOString()
  };
}

// --- END SHARED LOGIC ---

// === UNBREAKABLE ACHIEVEMENT HELPER ===
async function incrementUnbreakableWin(userId) {
  const db = admin.firestore();
  const userAchievementsRef = db.doc(`userAchievements/${userId}`);
  const userAchievementsDoc = await userAchievementsRef.get();
  let userAchievements = userAchievementsDoc.exists ? userAchievementsDoc.data() : {};
  const prevUnbreakableWins = userAchievements.unbreakableWins || 0;
  userAchievements.unbreakableWins = prevUnbreakableWins + 1;
  let achievementUnlocked = false;
  if (userAchievements.unbreakableWins >= 5 && !userAchievements.unbreakableAchieved) {
    userAchievements.unbreakableAchieved = true;
    achievementUnlocked = true;

  }
  await userAchievementsRef.set({
    ...userAchievements,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  return { success: true, achievementUnlocked, unbreakableWins: userAchievements.unbreakableWins };
}

// Update the callable function to use the helper
exports.trackHighRollerProgress = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to track high roller progress.');
  }
  const userId = context.auth.uid;
  const { wagerAmount, source } = data;
  try {
    return await incrementHighRollerWin({ userId, wagerAmount, source: source || 'callable' });
  } catch (error) {

    throw new functions.https.HttpsError('internal', error.message);
  }
});

// In handleMatchCompletion and updateUserStatsOnTransaction, use the helper directly
// (Replace the call to exports.trackHighRollerProgress with incrementHighRollerWin)

// backend fn: to fix user stats (admin only)
exports.fixUserStats = functions.https.onCall(async (data, context) => {
  try {
    // check:user is authenticated and is an admin
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'You must be logged in to fix user stats'
      );
    }

    // Get the user's admin status
    const db = admin.firestore();
    const userRef = db.collection('users').doc(context.auth.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists || !userDoc.data().isAdmin) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'You must be an admin to fix user stats'
      );
    }



    // Get all users
    const usersSnapshot = await db.collection('users').get();



    let processedCount = 0;
    let errorCount = 0;
    const results = [];

    for (const userDoc of usersSnapshot.docs) {
      try {
        const userId = userDoc.id;


        // Get all transactions for this user
        const transactionsQuery = db.collection('transactions').
        where('userId', '==', userId).
        where('type', 'in', ['wager_entry', 'reward']);

        const transactionsSnapshot = await transactionsQuery.get();

        // Calculate stats from transactions
        let matchesPlayed = 0;
        let matchesWon = 0;
        let totalEarnings = 0;

        transactionsSnapshot.forEach((doc) => {
          const transaction = doc.data();

          // Count all wager entries as matches played
          if (transaction.type === 'wager_entry') {
            matchesPlayed++;
          }

          // Count all rewards as wins and add to earnings
          if (transaction.type === 'reward') {
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

        const result = {
          userId,
          displayName,
          matchesPlayed,
          matchesWon,
          matchesLost,
          winRate: winRate.toFixed(3),
          totalEarnings
        };

        results.push(result);
        processedCount++;


      } catch (error) {

        errorCount++;
      }
    }



    return {
      success: true,
      processedCount,
      errorCount,
      totalUsers: usersSnapshot.size,
      results: results.slice(0, 10) // Return first 10 results as sample
    };

  } catch (error) {

    throw new functions.https.HttpsError(
      'internal',
      `Error fixing user stats: ${error.message}`
    );
  }
});


// exports.createTipReceivedTransaction = functions.firestore
//   .document('transactions/{transactionId}')
//   .onCreate(async (snap, context) => {
//     const tipSent = snap.data();

//     // Only process tip_sent transactions
//     if (tipSent.type !== 'tip_sent') return null;


//     try {
//       const db = admin.firestore();

//       // Check if sender is VIP
//       let isVip = false;
//       try {
//         const invDoc = await db.collection('userInventory').doc(tipSent.userId).get();
//         if (invDoc.exists) {
//           const items = invDoc.data().items || [];
//           const now = new Date();
//           const vip = items.find(i => i.id === 'vip_subscription' && i.isActive && i.expiresAt && i.expiresAt.toDate() > now);
//           isVip = !!vip;
//         }
//       } catch (err) {
//       }

//       // Calculate net amount after fee
//       let fee = 0;
//       let netAmount = tipSent.amount;
//       if (!isVip) {
//         fee = Math.round(tipSent.amount * 0.03 * 100) / 100; // 3% tip fee
//         netAmount = tipSent.amount - fee;
//       }

//       // Create a batch for atomic operations
//       const batch = db.batch();

//       // 1. Credit recipient's balance
//       const recipientRef = db.collection('users').doc(tipSent.recipientId);
//       const recipientDoc = await recipientRef.get();

//       if (!recipientDoc.exists) {
//         return null;
//       }

//       const recipientBalance = recipientDoc.data().tokenBalance || 0;
//       batch.update(recipientRef, {
//         tokenBalance: recipientBalance + netAmount
//       });

//       // 2. Create tip_received transaction
//       const tipReceivedRef = db.collection('transactions').doc();
//       batch.set(tipReceivedRef, {
//         userId: tipSent.recipientId,
//         type: 'tip_received',
//         amount: netAmount,
//         originalAmount: tipSent.amount,
//         fee: fee,
//         senderId: tipSent.userId,
//         senderName: tipSent.senderName || null,
//         recipientName: tipSent.recipientName || null,
//         timestamp: admin.firestore.FieldValue.serverTimestamp(),
//         senderIsVip: isVip
//       });

//       // 3. Record site earnings
//       if (fee > 0) {
//         const siteEarningsRef = db.collection('siteEarnings').doc();
//         batch.set(siteEarningsRef, {
//           type: 'tip_fee',
//           amount: fee,
//           timestamp: admin.firestore.FieldValue.serverTimestamp(),
//           feePercent: 0.03,
//           sourceUserId: tipSent.userId,
//           sourceTipId: tipSent.recipientId,
//           note: `Tip fee from ${tipSent.senderName || 'User'} to ${tipSent.recipientName || 'User'}`
//         });
//       }

//       // Commit the batch
//       await batch.commit();


//     } catch (error) {
//     }

//     return null;
//   });

// Scheduled function to auto-finalize wager matches if resultsDeadline has passed and only one result is present
exports.autoFinalizeWagers = functions.pubsub.schedule('every 5 minutes').onRun(async (context) => {
  const db = admin.firestore();
  const now = new Date();
  const snapshot = await db.collection('wagers').
  where('status', '==', 'submitting').
  get();

  let finalizedCount = 0;
  const batch = db.batch();



  for (const doc of snapshot.docs) {
    const wager = doc.data();

    if (!wager.resultsDeadline || !wager.results || wager.results.length !== 1) continue;
    const deadline = wager.resultsDeadline.toDate ? wager.resultsDeadline.toDate() : new Date(wager.resultsDeadline);
    if (now < deadline) continue;
    // Do NOT process rewards here; handleMatchCompletion will run automatically on status change
    const result = wager.results[0];
    const winner = result.winnerId === wager.hostId ? 'host' : 'guest';
    const winnerData = {
      winnerId: result.winnerId,
      winnerName: result.winnerName,
      loserScore: result.loserScore,
      winnerScore: result.winnerScore
    };
    batch.update(doc.ref, {
      status: 'completed',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      winner,
      winnerData,
      verified: true
    });
    // Add a system message to the chat
    const chatRef = db.collection('wager_chats').doc();
    batch.set(chatRef, {
      wagerId: doc.id,
      senderId: 'system',
      senderName: 'System',
      content: `Match auto-finalized. Only one player submitted results before the deadline. ${winnerData.winnerName} wins with a score of ${winnerData.winnerScore}-${winnerData.loserScore}.`,
      isSystem: true,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    finalizedCount++;

  }
  try {
    if (finalizedCount > 0) {
      await batch.commit();

    } else {

    }
  } catch (err) {

  }
  return null;
});

// Instant auto-finalization Firestore trigger for wagers
exports.instantAutoFinalizeWager = functions.firestore.
document('wagers/{wagerId}').
onUpdate(async (change, context) => {
  try {
    const before = change.before.data();
    const after = change.after.data();
    const wagerId = context.params.wagerId;
    const now = new Date();

    // Only act if status is 'submitting', deadline exists, and only one result
    if (
    after.status === 'submitting' &&
    after.resultsDeadline &&
    after.results &&
    after.results.length === 1)
    {
      const deadline = after.resultsDeadline.toDate ? after.resultsDeadline.toDate() : new Date(after.resultsDeadline);
      if (now >= deadline) {
        // Only auto-finalize if not already completed
        if (before.status !== 'completed') {
          const result = after.results[0];
          const winner = result.winnerId === after.hostId ? 'host' : 'guest';
          const winnerData = {
            winnerId: result.winnerId,
            winnerName: result.winnerName,
            loserScore: result.loserScore,
            winnerScore: result.winnerScore
          };
          await change.after.ref.update({
            status: 'completed',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            winner,
            winnerData,
            verified: true
          });

        }
      }
    }
    return null;
  } catch (err) {
    const wagerId = context.params ? context.params.wagerId : 'unknown';

    return null;
  }
});

const { getTwitchStreamStatus, exchangeTwitchCode } = require('./getTwitchStreams');
exports.getTwitchStreamStatus = getTwitchStreamStatus;
exports.exchangeTwitchCode = exchangeTwitchCode;

/**
 * VIP Subscription Purchase Endpoint
 * Allows a user to purchase a VIP subscription using coins.
 * Input: { plan: '1-month' | '3-month' }
 * Deducts coins, updates vipStatus, and logs the transaction atomically.
 */
exports.purchaseVipSubscription = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to purchase VIP.');
  }

  const userId = context.auth.uid;
  const { plan } = data;
  const plans = {
    '1-month': { price: 3.49, durationDays: 30 },
    '3-month': { price: 9.49, durationDays: 90 }
  };

  if (!plans[plan]) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid VIP plan.');
  }

  const { price, durationDays } = plans[plan];
  const db = admin.firestore();
  const userRef = db.collection('users').doc(userId);
  const inventoryRef = db.collection('userInventory').doc(userId);

  // Use a transaction for atomicity
  await db.runTransaction(async (transaction) => {
    // All reads first
    const userDoc = await transaction.get(userRef);
    const inventoryDoc = await transaction.get(inventoryRef);
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found.');
    }
    const userData = userDoc.data();
    if ((userData.tokenBalance || 0) < price) {
      throw new functions.https.HttpsError('failed-precondition', 'Not enough coins.');
    }
    // Deduct coins
    transaction.update(userRef, {
      tokenBalance: admin.firestore.FieldValue.increment(-price)
    });
    // VIP subscription item
    const now = admin.firestore.Timestamp.now();
    const expiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000));
    let items = (inventoryDoc.exists ? inventoryDoc.data().items : []) || [];
    // Add/replace VIP subscription
    const vipIndex = items.findIndex((i) => i.id === 'vip_subscription');
    if (vipIndex >= 0) {
      items[vipIndex] = {
        ...items[vipIndex],
        isActive: true,
        expiresAt,
        grantedAt: now,
        plan,
        type: 'subscription' // Ensure type is set for VIP detection
      };
    } else {
      items.push({
        id: 'vip_subscription',
        isActive: true,
        expiresAt,
        grantedAt: now,
        plan,
        type: 'subscription' // Ensure type is set for VIP detection
      });
    }
    // Grant 1x Wager Insurance
    const insuranceIndex = items.findIndex((i) => i.id === 'wager_insurance');
    if (insuranceIndex >= 0) {
      items[insuranceIndex].count = (items[insuranceIndex].count || 0) + 1;
      if (!items[insuranceIndex].type) items[insuranceIndex].type = 'special';
      if (!items[insuranceIndex].purchasedAt) items[insuranceIndex].purchasedAt = now;
      if (!items[insuranceIndex].grantedAt) items[insuranceIndex].grantedAt = now;
    } else {
      items.push({ id: 'wager_insurance', count: 1, grantedBy: 'vip', grantedAt: now, purchasedAt: now, type: 'special' });
    }
    // Grant 3x Match Snipes (correct id and type)
    const snipeIndex = items.findIndex((i) => i.id === 'match_snipes');
    if (snipeIndex >= 0) {
      items[snipeIndex].count = (items[snipeIndex].count || 0) + 3;
      if (!items[snipeIndex].type) items[snipeIndex].type = 'utility';
      if (!items[snipeIndex].purchasedAt) items[snipeIndex].purchasedAt = now;
      if (!items[snipeIndex].grantedAt) items[snipeIndex].grantedAt = now;
    } else {
      items.push({ id: 'match_snipes', count: 3, grantedBy: 'vip', grantedAt: now, purchasedAt: now, type: 'utility' });
    }
    // Grant 1x Stat Reset (correct type)
    const statResetIndex = items.findIndex((i) => i.id === 'stat_reset');
    if (statResetIndex >= 0) {
      items[statResetIndex].count = (items[statResetIndex].count || 0) + 1;
      if (!items[statResetIndex].type) items[statResetIndex].type = 'utility';
      if (!items[statResetIndex].purchasedAt) items[statResetIndex].purchasedAt = now;
      if (!items[statResetIndex].grantedAt) items[statResetIndex].grantedAt = now;
    } else {
      items.push({ id: 'stat_reset', count: 1, grantedBy: 'vip', grantedAt: now, purchasedAt: now, type: 'utility' });
    }
    // Update inventory
    transaction.set(inventoryRef, { items }, { merge: true });
    // Log transaction (optional)
    const txRef = db.collection('transactions').doc();
    transaction.set(txRef, {
      userId,
      type: 'vip_purchase',
      plan,
      price,
      timestamp: now,
      details: {
        granted: ['vip_subscription', 'wager_insurance', 'match_snipes', 'stat_reset']
      }
    });
    // Also update user doc with VIP status summary
    transaction.update(userRef, {
      vipStatus: {
        isActive: true,
        expiresAt: expiresAt,
        grantedAt: now,
        plan: plan
      }
    });
  });
  return { success: true, message: 'VIP purchased and perks granted.' };
});

/**
 * Scheduled function to expire VIP status for users whose VIP has expired.
 * Runs every hour.
 */
exports.expireVipStatuses = functions.pubsub.schedule('every 60 minutes').onRun(async (context) => {
  const db = admin.firestore();
  const now = new Date();
  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('vipStatus.isActive', '==', true).get();
  let expiredCount = 0;
  for (const userDoc of snapshot.docs) {
    const user = userDoc.data();
    const expiresAt = user.vipStatus?.expiresAt;
    let expiresDate;
    if (expiresAt && typeof expiresAt.toDate === 'function') {
      expiresDate = expiresAt.toDate();
    } else if (expiresAt) {
      expiresDate = new Date(expiresAt);
    }
    if (expiresDate && expiresDate < now) {
      // Expired!
      const userId = userDoc.id;
      const batch = db.batch();
      // 1. Update user doc
      batch.update(userDoc.ref, {
        'vipStatus.isActive': false
      });
      // 2. Update userInventory vip_subscription item
      const invRef = db.collection('userInventory').doc(userId);
      const invDoc = await invRef.get();
      if (invDoc.exists) {
        const items = invDoc.data().items || [];
        const newItems = items.map((item) =>
        item.id === 'vip_subscription' ? { ...item, isActive: false } : item
        );
        batch.update(invRef, { items: newItems });
      }
      await batch.commit();
      expiredCount++;
    }
  }

  return null;
});

/**
 * Callable function to manually expire VIP for a user (for testing)
 * Input: { userId }
 */
exports.expireVipForUser = functions.https.onCall(async (data, context) => {
  const { userId } = data;
  if (!userId) {
    throw new functions.https.HttpsError('invalid-argument', 'userId is required');
  }
  const db = admin.firestore();
  const userRef = db.collection('users').doc(userId);
  const invRef = db.collection('userInventory').doc(userId);
  const batch = db.batch();
  // 1. Update user doc
  batch.update(userRef, {
    'vipStatus.isActive': false
  });
  // 2. Update userInventory vip_subscription item
  const invDoc = await invRef.get();
  if (invDoc.exists) {
    const items = invDoc.data().items || [];
    const newItems = items.map((item) =>
    item.id === 'vip_subscription' ? { ...item, isActive: false } : item
    );
    batch.update(invRef, { items: newItems });
  }
  await batch.commit();
  return { success: true, message: `VIP expired for user ${userId}` };
});

/**
 * Callable function to activate VIP from an inventory item
 * Input: { purchasedAt }
 * Auth required
 */
exports.activateVipFromInventory = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to activate VIP.');
  }
  const userId = context.auth.uid;
  const { purchasedAt } = data;
  if (!purchasedAt) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing purchasedAt timestamp.');
  }
  const db = admin.firestore();
  const userRef = db.collection('users').doc(userId);
  const inventoryRef = db.collection('userInventory').doc(userId);

  // Use a transaction for atomicity
  await db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    const inventoryDoc = await transaction.get(inventoryRef);
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found.');
    }
    let items = (inventoryDoc.exists ? inventoryDoc.data().items : []) || [];
    // Find the VIP subscription item by purchasedAt
    const vipIndex = items.findIndex((i) => i.id === 'vip_subscription' && i.purchasedAt && (i.purchasedAt.toDate ? i.purchasedAt.toDate().toISOString() : i.purchasedAt) === purchasedAt);
    if (vipIndex === -1) {
      throw new functions.https.HttpsError('not-found', 'VIP subscription item not found in inventory.');
    }
    // Set VIP duration (default 30 days)
    const now = admin.firestore.Timestamp.now();
    const expiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    // Update user VIP status
    transaction.update(userRef, {
      vipStatus: {
        isActive: true,
        expiresAt: expiresAt,
        grantedAt: now,
        plan: '1-month',
        activatedByInventory: true
      }
    });
    // Remove or decrement the used VIP subscription item
    if (items[vipIndex].usesRemaining && items[vipIndex].usesRemaining > 1) {
      items[vipIndex].usesRemaining -= 1;
    } else {
      items.splice(vipIndex, 1);
    }
    transaction.set(inventoryRef, { items }, { merge: true });
  });
  return { success: true, message: 'VIP activated from inventory!' };
});

/**
 * Battle Pass: Purchase - Updated to use tokenBalance field
 * Allows user to purchase battle pass if they have enough tokens
 */
exports.purchaseBattlePass = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to purchase the Battle Pass.');
  }
  const userId = context.auth.uid;
  const db = admin.firestore();
  const userRef = db.collection('users').doc(userId);
  const passRef = db.collection('battlepass').doc('current');

  const [userSnap, passSnap] = await Promise.all([
  userRef.get(),
  passRef.get()]
  );
  if (!userSnap.exists) throw new functions.https.HttpsError('not-found', 'User not found');
  if (!passSnap.exists) throw new functions.https.HttpsError('not-found', 'Battle Pass config not found');
  const user = userSnap.data();
  const pass = passSnap.data();

  // see ifalready active and not expired
  if (user.battlepass && user.battlepass.isActive && user.battlepass.expiresAt && user.battlepass.expiresAt.toDate() > new Date()) {
    throw new functions.https.HttpsError('failed-precondition', 'Battle Pass is already active.');
  }

  // Check user balance - use tokenBalance instead of coins
  if ((user.tokenBalance || 0) < pass.price) {
    throw new functions.https.HttpsError('failed-precondition', 'Not enough coins to purchase Battle Pass.');
  }

  // Deduct from tokenBalance and activate pass
  const now = admin.firestore.Timestamp.now();
  const expiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + (pass.durationDays || 30) * 24 * 60 * 60 * 1000));
  await userRef.update({
    tokenBalance: (user.tokenBalance || 0) - pass.price,
    battlepass: {
      isActive: true,
      purchasedAt: now,
      expiresAt,
      xp: 0,
      claimedTiers: [],
      lastClaimed: null
    }
  });
  return { success: true, message: 'Battle Pass purchased and activated!' };
});

/**
 * Battle Pass: Add XP
 * Adds XP to user's battle pass if active and not expired
 */
exports.addBattlePassXp = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to earn Battle Pass XP.');
  }
  const userId = context.auth.uid;
  const { xp } = data;
  if (typeof xp !== 'number' || xp <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'XP must be a positive number.');
  }
  const db = admin.firestore();
  const userRef = db.collection('users').doc(userId);
  const passRef = db.collection('battlepass').doc('current');

  const [userSnap, passSnap] = await Promise.all([
  userRef.get(),
  passRef.get()]
  );
  if (!userSnap.exists) throw new functions.https.HttpsError('not-found', 'User not found');
  if (!passSnap.exists) throw new functions.https.HttpsError('not-found', 'Battle Pass config not found');
  const user = userSnap.data();
  const pass = passSnap.data();

  if (!user.battlepass || !user.battlepass.isActive || !user.battlepass.expiresAt || user.battlepass.expiresAt.toDate() < new Date()) {
    throw new functions.https.HttpsError('failed-precondition', 'Battle Pass is not active.');
  }

  // Cap XP
  const newXp = Math.min((user.battlepass.xp || 0) + xp, pass.xpCap || 7000);
  await userRef.update({
    'battlepass.xp': newXp
  });
  return { success: true, newXp };
});

/**
 * Battle Pass: Claim Tier
 * Checks eligibility, grants reward, and marks tier as claimed
 */
exports.claimBattlePassTier = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to claim Battle Pass rewards.');
  }
  const userId = context.auth.uid;
  const { tierIndex } = data;
  if (typeof tierIndex !== 'number' || tierIndex < 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid tier index.');
  }
  const db = admin.firestore();
  const userRef = db.collection('users').doc(userId);
  const passRef = db.collection('battlepass').doc('current');

  const [userSnap, passSnap] = await Promise.all([
  userRef.get(),
  passRef.get()]
  );
  if (!userSnap.exists) throw new functions.https.HttpsError('not-found', 'User not found');
  if (!passSnap.exists) throw new functions.https.HttpsError('not-found', 'Battle Pass config not found');
  const user = userSnap.data();
  const pass = passSnap.data();

  if (!user.battlepass || !user.battlepass.isActive || !user.battlepass.expiresAt || user.battlepass.expiresAt.toDate() < new Date()) {
    throw new functions.https.HttpsError('failed-precondition', 'Battle Pass is not active.');
  }
  if (user.battlepass.claimedTiers && user.battlepass.claimedTiers.includes(tierIndex)) {
    throw new functions.https.HttpsError('already-exists', 'Tier already claimed.');
  }
  const tier = pass.tiers && pass.tiers[tierIndex];
  if (!tier) {
    throw new functions.https.HttpsError('not-found', 'Tier not found.');
  }
  if ((user.battlepass.xp || 0) < tier.xp) {
    throw new functions.https.HttpsError('failed-precondition', 'Not enough XP to claim this tier.');
  }

  // Grant reward (pseudo-code, implement actual logic for each type)
  // e.g. update inventory, add coins, unlock cosmetic, etc.
  if (tier.reward.type === 'coin') {
    await userRef.update({ tokenBalance: (user.tokenBalance || 0) + (tier.reward.amount || 0) });
  } else if (tier.reward.type === 'utility' || tier.reward.type === 'crate' || tier.reward.type === 'boost') {
    // Add to user inventory
    const inventoryRef = db.collection('userInventory').doc(userId);
    const inventoryDoc = await inventoryRef.get();
    let items = (inventoryDoc.exists ? inventoryDoc.data().items : []) || [];
    const rewardId = tier.reward.id;
    const rewardAmount = tier.reward.amount || 1;
    const now = admin.firestore.Timestamp.now();
    // see ifitem already exists (for stacking uses/count)
    let itemIndex = items.findIndex((i) => i.id === rewardId);
    if (itemIndex >= 0) {
      // Increment uses/count if possible
      if (items[itemIndex].usesRemaining !== undefined) {
        items[itemIndex].usesRemaining += rewardAmount;
      } else if (items[itemIndex].count !== undefined) {
        items[itemIndex].count += rewardAmount;
      } else {
        items[itemIndex].count = rewardAmount;
      }
    } else {
      // Add new item
      let newItem = {
        id: rewardId,
        title: tier.reward.title || rewardId,
        type: tier.reward.type,
        icon: tier.reward.icon || '',
        purchasedAt: now,
        usesRemaining: rewardAmount
      };
      if (tier.reward.type === 'crate') {
        newItem.usesRemaining = rewardAmount;
      }
      items.push(newItem);
    }
    await inventoryRef.set({ items }, { merge: true });
    // Optionally, log transaction
    await db.collection('transactions').add({
      userId,
      type: 'battlepass_reward',
      rewardType: tier.reward.type,
      rewardId,
      amount: rewardAmount,
      tierIndex,
      timestamp: now
    });
  } else if (tier.reward.type === 'cosmetic') {
    // Unlock cosmetic for user (subcollection)
    const cosmeticsRef = db.collection('users').doc(userId).collection('cosmetics').doc(tier.reward.id);
    await cosmeticsRef.set({
      unlockedAt: admin.firestore.Timestamp.now(),
      source: 'battlepass',
      tierIndex
    });
    // Also add to userCosmetics.owned array
    const userCosmeticsRef = db.collection('userCosmetics').doc(userId);
    await userCosmeticsRef.set({
      owned: admin.firestore.FieldValue.arrayUnion(tier.reward.id),
      updatedAt: admin.firestore.Timestamp.now()
    }, { merge: true });
    // Optionally, log transaction
    await db.collection('transactions').add({
      userId,
      type: 'battlepass_reward',
      rewardType: 'cosmetic',
      rewardId: tier.reward.id,
      tierIndex,
      timestamp: admin.firestore.Timestamp.now()
    });
  }

  // Mark tier as claimed
  await userRef.update({
    'battlepass.claimedTiers': admin.firestore.FieldValue.arrayUnion(tierIndex),
    'battlepass.lastClaimed': admin.firestore.Timestamp.now()
  });
  return { success: true, message: 'Tier reward claimed!' };
});

/**
 * Callable function to send a tip atomically and safely.
 * Input: { recipientId, amount }
 */
exports.sendTip = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to send a tip.');
  }
  const senderId = context.auth.uid;
  const { recipientId, amount } = data;
  if (!recipientId || !amount || amount <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid recipient or amount.');
  }
  if (recipientId === senderId) {
    throw new functions.https.HttpsError('failed-precondition', 'You cannot tip yourself.');
  }
  const db = admin.firestore();
  const senderRef = db.collection('users').doc(senderId);
  const recipientRef = db.collection('users').doc(recipientId);
  const senderInventoryRef = db.collection('userInventory').doc(senderId);

  // Use a transaction for atomicity
  await db.runTransaction(async (transaction) => {
    // Get sender and recipient docs
    const senderDoc = await transaction.get(senderRef);
    const recipientDoc = await transaction.get(recipientRef);
    if (!senderDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Sender not found.');
    }
    if (!recipientDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Recipient not found.');
    }
    const senderData = senderDoc.data();
    const recipientData = recipientDoc.data();
    const senderBalance = senderData.tokenBalance || 0;
    if (senderBalance < amount) {
      throw new functions.https.HttpsError('failed-precondition', 'Not enough tokens to send tip.');
    }
    // Check VIP status
    let isVip = false;
    const senderInventoryDoc = await transaction.get(senderInventoryRef);
    if (senderInventoryDoc.exists) {
      const items = senderInventoryDoc.data().items || [];
      const now = new Date();
      const vip = items.find((i) => i.id === 'vip_subscription' && i.isActive && i.expiresAt && (i.expiresAt.toDate ? i.expiresAt.toDate() : i.expiresAt) > now);
      isVip = !!vip;
    }
    // Calculate fee
    let fee = 0;
    let netAmount = amount;
    let feePercent = 0;
    if (!isVip) {
      feePercent = 0.03;
      fee = Math.round(amount * feePercent * 100) / 100;
      netAmount = amount - fee;
    }
    // Deduct from sender
    transaction.update(senderRef, {
      tokenBalance: senderBalance - amount
    });
    // Create tip_sent transaction
    const tipSentRef = db.collection('transactions').doc();
    transaction.set(tipSentRef, {
      userId: senderId,
      type: 'tip_sent',
      amount: amount,
      fee: fee,
      amountAfterFee: netAmount,
      feePercent: feePercent,
      recipientId: recipientId,
      recipientName: recipientData.displayName || 'Unknown User',
      senderName: senderData.displayName || 'Anonymous User',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    // Credit recipient
    const recipientBalance = recipientData.tokenBalance || 0;
    transaction.update(recipientRef, {
      tokenBalance: recipientBalance + netAmount
    });
    // Create tip_received transaction
    const tipReceivedRef = db.collection('transactions').doc();
    transaction.set(tipReceivedRef, {
      userId: recipientId,
      type: 'tip_received',
      amount: netAmount,
      originalAmount: amount,
      fee: fee,
      senderId: senderId,
      senderName: senderData.displayName || null,
      recipientName: recipientData.displayName || null,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      senderIsVip: isVip
    });
    // Record site earnings if fee > 0
    if (fee > 0) {
      const siteEarningsRef = db.collection('siteEarnings').doc();
      transaction.set(siteEarningsRef, {
        type: 'tip_fee',
        amount: fee,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        feePercent: feePercent,
        sourceUserId: senderId,
        sourceTipId: recipientId,
        note: `Tip fee from ${senderData.displayName || 'User'} to ${recipientData.displayName || 'User'}`
      });
    }
  });
  return { success: true, message: 'Tip sent successfully.' };
});

const referralService = require('./referralService');
const models = require('./models');

/**
 * Callable function to validate a referral code in real-time.
 * Input: { referralCode, userId, deviceId, userIp }
 * Returns: { valid, reason, payoutRate, creatorUserId, creatorDisplayName }
 */
exports.validateReferralCode = functions.https.onCall(async (data, context) => {
  const referralService = require('./referralService');
  const db = admin.firestore();
  try {
    let { referralCode, userId, deviceId, userIp } = data;
    if (!referralCode) {
      return { valid: false, reason: 'No code provided.' };
    }
    referralCode = String(referralCode).toUpperCase();
    // 1. Check code exists and is active
    const codeObj = await referralService.getReferralCode(referralCode);
    if (!codeObj || !codeObj.isActive) {
      return { valid: false, reason: 'Code not found or inactive.' };
    }
    // // 2. Prevent self-referral
    // if (userId && codeObj.creatorUserId === userId) {
    //   return { valid: false, reason: 'You cannot use your own code.' };
    // }
    // 3. Prevent multiple uses by same user/device/IP
    const [priorByUser, priorByDevice, priorByIp] = await Promise.all([
    userId ? referralService.getReferralUsagesByUser(userId) : Promise.resolve([]),
    deviceId ? referralService.getReferralUsagesByCode(referralCode) : Promise.resolve([]),
    userIp ? referralService.getReferralUsagesByCode(referralCode) : Promise.resolve([])]
    );
    // Removed userId, deviceId, and userIp restrictions to allow multiple uses by the same user, device, and IP
    // if (userId && priorByUser.some(u => u.referralCode === referralCode)) {
    //   return { valid: false, reason: 'You have already used this code.' };
    // }
    // if (deviceId && priorByDevice.some(u => u.deviceId === deviceId)) {
    //   return { valid: false, reason: 'This device has already used this code.' };
    // }
    // if (userIp && priorByIp.some(u => u.userIp === userIp)) {
    //   return { valid: false, reason: 'This IP has already used this code.' };
    // }
    // if (deviceId && priorByDevice.some(u => u.deviceId === deviceId)) {
    //   return { valid: false, reason: 'This device has already used this code.' };
    // }
    // if (userIp && priorByIp.some(u => u.userIp === userIp)) {
    //   return { valid: false, reason: 'This IP has already used this code.' };
    // }
    // 4. Optionally, fetch creator display name
    let creatorDisplayName = null;
    try {
      const creatorDoc = await db.collection('users').doc(codeObj.creatorUserId).get();
      creatorDisplayName = creatorDoc.exists ? creatorDoc.data().displayName || null : null;
    } catch {}
    return {
      valid: true,
      reason: 'Code is valid!',
      payoutRate: codeObj.payoutRate,
      creatorUserId: codeObj.creatorUserId,
      creatorDisplayName
    };
  } catch (err) {

    return { valid: false, reason: 'Server error.' };
  }
});

/**
 * Callable function for creators to get their referral dashboard stats.
 * Returns: { codes, pendingAmount, totalEarned, referredUsers, payoutHistory }
 */
exports.getCreatorReferralDashboard = functions.https.onCall(async (data, context) => {
  const referralService = require('./referralService');
  const db = admin.firestore();
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in.');
  }
  const creatorUserId = context.auth.uid;
  try {
    // Get all codes owned by this creator
    const codesSnap = await db.collection('referralCodes').where('creatorUserId', '==', creatorUserId).get();
    const codes = codesSnap.docs.map((doc) => ({
      referralCode: doc.id,
      ...doc.data()
    }));
    // Get payout status
    const payoutStatus = await referralService.getCreatorPayoutStatus(creatorUserId);
    // Get all referral usages for this creator's codes
    let totalEarned = 0;
    let referredUsersSet = new Set();
    for (const code of codes) {
      const usages = await referralService.getReferralUsagesByCode(code.referralCode);
      totalEarned += code.totalEarned || 0;
      usages.forEach((u) => referredUsersSet.add(u.userId));
    }
    // Get payout history
    const payoutHistory = await referralService.getPayoutsByCreator(creatorUserId);
    return {
      codes,
      pendingAmount: payoutStatus ? payoutStatus.pendingAmount : 0,
      totalEarned,
      referredUsers: Array.from(referredUsersSet),
      referredUsersCount: referredUsersSet.size,
      payoutHistory
    };
  } catch (err) {

    throw new functions.https.HttpsError('internal', 'Failed to load dashboard.');
  }
});

/**
 * Admin: List/search all referral codes
 * Input: { search, isActive } (optional)
 */
exports.adminGetAllReferralCodes = functions.https.onCall(async (data, context) => {
  const db = admin.firestore();
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'You must be logged in.');
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  if (!userDoc.exists || !userDoc.data().isAdmin) throw new functions.https.HttpsError('permission-denied', 'Admin only.');
  let query = db.collection('referralCodes');
  if (data && data.isActive !== undefined) query = query.where('isActive', '==', !!data.isActive);
  const snap = await query.get();
  let codes = snap.docs.map((doc) => ({
    referralCode: doc.id,
    ...doc.data()
  }));
  if (data && data.search) {
    const s = String(data.search).toLowerCase();
    codes = codes.filter((c) => c.referralCode.toLowerCase().includes(s) || c.creatorUserId && c.creatorUserId.toLowerCase().includes(s));
  }
  return { codes };
});

/**
 * Admin: Get referral usage logs
 * Input: { referralCode, userId, limit, startAfter } (all optional)
 */
exports.adminGetReferralLogs = functions.https.onCall(async (data, context) => {
  const db = admin.firestore();
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'You must be logged in.');
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  if (!userDoc.exists || !userDoc.data().isAdmin) throw new functions.https.HttpsError('permission-denied', 'Admin only.');
  let query = db.collection('referralUsage');
  if (data && data.referralCode) query = query.where('referralCode', '==', String(data.referralCode).toUpperCase());
  if (data && data.userId) query = query.where('userId', '==', data.userId);
  if (data && data.startAfter) query = query.orderBy('timestamp').startAfter(data.startAfter);
  if (data && data.limit) query = query.limit(Number(data.limit));else
  query = query.limit(100);
  const snap = await query.get();
  return { logs: snap.docs.map((doc) => doc.data()) };
});

/**
 * Admin: Add/edit/deactivate/change payout rate for a referral code
 * Input: { referralCode, updates }
 */
exports.adminUpdateReferralCode = functions.https.onCall(async (data, context) => {
  try {
    const referralService = require('./referralService');
    const db = admin.firestore();
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'You must be logged in.');
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!userDoc.exists || !userDoc.data().isAdmin) throw new functions.https.HttpsError('permission-denied', 'Admin only.');
    const { referralCode, updates } = data;
    if (!referralCode || !updates) throw new functions.https.HttpsError('invalid-argument', 'Missing referralCode or updates.');


    await referralService.updateReferralCode(String(referralCode).toUpperCase(), updates);


    return { success: true };
  } catch (err) {

    throw new functions.https.HttpsError('internal', err.message || 'Internal error creating referral code');
  }
});

/**
 * Admin: Mark a referral payout as complete
 * Input: { creatorUserId, amount, method, transactionId }
 */
exports.adminMarkReferralPayoutComplete = functions.https.onCall(async (data, context) => {
  const referralService = require('./referralService');
  const db = admin.firestore();
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'You must be logged in.');
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  if (!userDoc.exists || !userDoc.data().isAdmin) throw new functions.https.HttpsError('permission-denied', 'Admin only.');
  const { creatorUserId, amount, method, transactionId } = data;
  if (!creatorUserId || !amount || !method || !transactionId) throw new functions.https.HttpsError('invalid-argument', 'Missing required fields.');
  // Log payout
  await referralService.logReferralPayout({
    creatorUserId,
    amount,
    paidAt: new Date().toISOString(),
    method,
    transactionId
  });
  // Reset pending amount
  await referralService.updateCreatorPayoutStatus(creatorUserId, {
    pendingAmount: 0,
    payoutRequested: false,
    lastPaidOut: new Date().toISOString()
  });
  return { success: true };
});

/**
 * Admin: Delete a referral code
 * Input: { referralCode }
 */
exports.adminDeleteReferralCode = functions.https.onCall(async (data, context) => {
  try {
    const referralService = require('./referralService');
    const db = admin.firestore();
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'You must be logged in.');
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!userDoc.exists || !userDoc.data().isAdmin) throw new functions.https.HttpsError('permission-denied', 'Admin only.');
    const { referralCode } = data;
    if (!referralCode) throw new functions.https.HttpsError('invalid-argument', 'Missing referralCode.');


    await referralService.deleteReferralCode(String(referralCode).toUpperCase());


    return { success: true };
  } catch (err) {

    throw new functions.https.HttpsError('internal', err.message || 'Internal error deleting referral code');
  }
});

// Epic Username Updater exports
exports.scheduleEpicUsernameUpdates = scheduleEpicUsernameUpdates;
exports.updateEpicUsernames = updateEpicUsernames;
exports.checkUserEpicUsername = checkUserEpicUsername;

const corsForCallable = require('cors')({
  origin: [
  'https://www.ronix.gg',
  'https://tokensite-6eef3.web.app',
  'https://tokensite-6eef3.firebaseapp.com',
  'http://localhost:3000'],

  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});

exports.initializeNameplateSystem = functions.https.onCall(async (data, context) => {
  // CORS is not strictly needed for onCall, but we include the logic for future HTTP migration
  // If you later switch to onRequest, wrap with corsForCallable(req, res, ...)
  // For now, just return a success message
  return { success: true, message: 'Nameplate system initialized.' };
});

// TEST FUNCTION: Log every update to wagers collection
exports.testWagerUpdate = functions.firestore.
document('wagers/{wagerId}').
onUpdate((change, context) => {

  const before = change.before.data();
  const after = change.after.data();

  return null;
});

// Deduct tokens for multiple users (party wager entry)
exports.deductTokensForUsers = functions.https.onCall(async (data, context) => {
  // 1. Auth check
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in.');
  }

  // 2. Validate input
  const { deductions } = data;
  if (!Array.isArray(deductions) || deductions.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'No deductions provided.');
  }

  const db = admin.firestore();
  const results = [];

  // 3. Process each deduction
  for (const { userId, amount, wagerId } of deductions) {
    try {
      if (!userId || typeof amount !== 'number' || amount <= 0) {
        results.push({ userId, success: false, error: 'Invalid input' });
        continue;
      }
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      if (!userDoc.exists) {
        results.push({ userId, success: false, error: 'User not found' });
        continue;
      }
      const balance = userDoc.data().tokenBalance || 0;
      if (balance < amount) {
        results.push({ userId, success: false, error: 'Insufficient balance' });
        continue;
      }
      // Deduct tokens and log transaction
      await userRef.update({ tokenBalance: balance - amount });
      await db.collection('transactions').add({
        userId,
        type: 'wager_entry',
        amount,
        wagerId,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
      results.push({ userId, success: true });
    } catch (err) {
      results.push({ userId, success: false, error: err.message });
    }
  }

  return { results };
});

const sponsorship = require('./sponsorship');

exports.adminCashOutPlatformWallet = functions.https.onCall(async (data, context) => {
  // Only allow admins
  const adminUid = context.auth && context.auth.uid;
  if (!adminUid) throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated.');
  const adminUser = await admin.firestore().collection('users').doc(adminUid).get();
  if (!adminUser.exists || !adminUser.data().isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can perform this action.');
  }

  const { amount, note } = data;
  if (!amount || amount <= 0) throw new functions.https.HttpsError('invalid-argument', 'Amount must be positive.');

  const platformWalletRef = admin.firestore().collection('platformWallet').doc('main');
  const cashOutsRef = platformWalletRef.collection('cashOuts').doc();
  const siteEarningsRef = admin.firestore().collection('siteEarnings').doc();

  return await admin.firestore().runTransaction(async (transaction) => {
    const walletDoc = await transaction.get(platformWalletRef);
    if (!walletDoc.exists) throw new functions.https.HttpsError('not-found', 'Platform wallet not found.');
    const wallet = walletDoc.data();
    if ((wallet.coinBalance || 0) < amount) throw new functions.https.HttpsError('failed-precondition', 'Insufficient platform wallet balance.');

    // Decrement coinBalance
    transaction.update(platformWalletRef, {
      coinBalance: (wallet.coinBalance || 0) - amount,
      totalCashedOut: admin.firestore.FieldValue.increment(amount),
      lastCashOutAt: admin.firestore.FieldValue.serverTimestamp()
    });
    // Log cash-out in /platformWallet/cashOuts
    transaction.set(cashOutsRef, {
      amount,
      adminUid,
      note: note || '',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    // Log in siteEarnings
    transaction.set(siteEarningsRef, {
      type: 'platform_cashout',
      amount,
      adminUid,
      note: note || '',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    return { success: true, newBalance: (wallet.coinBalance || 0) - amount };
  });
});

// Helper to increment platform wallet and log fee event
async function recordPlatformWalletFee({ db, batch, feeType, amount, meta }) {
  const platformWalletRef = db.collection('platformWallet').doc('main');
  const earningsRef = platformWalletRef.collection('earnings').doc();

  // keep this safe:the platform wallet doc exists before batch.update
  const walletDoc = await platformWalletRef.get();
  if (!walletDoc.exists) {
    // Create with default values (adjust as needed)
    await platformWalletRef.set({
      coinBalance: 0,
      totalCashedOut: 0,
      lastCashOutAt: null
    }, { merge: true });
  }

  batch.update(platformWalletRef, {
    coinBalance: admin.firestore.FieldValue.increment(amount)
  });
  batch.set(earningsRef, {
    type: feeType,
    amount,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    ...meta
  });
}

// In handleMatchCompletion, after recording siteEarnings for wager_fee:
// await db.collection('siteEarnings').add({ ... });
// Add:
// await recordPlatformWalletFee({ db, batch, feeType: 'wager_fee', amount: totalFee, meta: { wagerId, feePercent } });

// In tip and withdrawal fee logic, after recording siteEarnings:
// await recordPlatformWalletFee({ db, batch, feeType: 'tip_fee', amount: fee, meta: { tipId, feePercent } });
// await recordPlatformWalletFee({ db, batch, feeType: 'withdrawal_fee', amount: fee, meta: { withdrawalRequestId, feePercent } });

// Helper to check admin
async function isAdmin(uid) {
  if (!uid) return false;
  const userDoc = await admin.firestore().collection('users').doc(uid).get();
  return userDoc.exists && userDoc.data().isAdmin;
}

// Admin: Get platform wallet summary
exports.adminGetPlatformWalletSummary = functions.https.onCall(async (data, context) => {
  if (!(await isAdmin(context.auth && context.auth.uid))) throw new functions.https.HttpsError('permission-denied', 'Admins only');
  const doc = await admin.firestore().collection('platformWallet').doc('main').get();
  if (!doc.exists) throw new functions.https.HttpsError('not-found', 'Platform wallet not found');
  const { coinBalance = 0, totalCashedOut = 0, lastCashOutAt = null } = doc.data();
  return { coinBalance, totalCashedOut, lastCashOutAt };
});

// Admin: Get paginated platform wallet earnings
exports.adminGetPlatformWalletEarnings = functions.https.onCall(async (data, context) => {
  if (!(await isAdmin(context.auth && context.auth.uid))) throw new functions.https.HttpsError('permission-denied', 'Admins only');
  const { pageSize = 50, startAfter } = data || {};
  let query = admin.firestore().collection('platformWallet').doc('main').collection('earnings').orderBy('timestamp', 'desc').limit(pageSize);
  if (startAfter) {
    const startDoc = await admin.firestore().collection('platformWallet').doc('main').collection('earnings').doc(startAfter).get();
    if (startDoc.exists) query = query.startAfter(startDoc);
  }
  const snap = await query.get();
  const results = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return { results, lastDocId: snap.docs.length ? snap.docs[snap.docs.length - 1].id : null };
});

// Admin: Get paginated platform wallet cash-outs
exports.adminGetPlatformWalletCashOuts = functions.https.onCall(async (data, context) => {
  if (!(await isAdmin(context.auth && context.auth.uid))) throw new functions.https.HttpsError('permission-denied', 'Admins only');
  const { pageSize = 50, startAfter } = data || {};
  let query = admin.firestore().collection('platformWallet').doc('main').collection('cashOuts').orderBy('timestamp', 'desc').limit(pageSize);
  if (startAfter) {
    const startDoc = await admin.firestore().collection('platformWallet').doc('main').collection('cashOuts').doc(startAfter).get();
    if (startDoc.exists) query = query.startAfter(startDoc);
  }
  const snap = await query.get();
  const results = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return { results, lastDocId: snap.docs.length ? snap.docs[snap.docs.length - 1].id : null };
});

// Admin: Get quick stats
exports.adminGetPlatformQuickStats = functions.https.onCall(async (data, context) => {
  if (!(await isAdmin(context.auth && context.auth.uid))) throw new functions.https.HttpsError('permission-denied', 'Admins only');
  const db = admin.firestore();
  const [wagerSnap, tipSnap, withdrawalSnap] = await Promise.all([
  db.collection('siteEarnings').where('type', '==', 'wager_fee').get(),
  db.collection('siteEarnings').where('type', '==', 'tip_fee').get(),
  db.collection('siteEarnings').where('type', '==', 'withdrawal_fee').get()]
  );
  return {
    totalWagerFees: wagerSnap.docs.reduce((sum, d) => sum + (d.data().amount || 0), 0),
    totalTipFees: tipSnap.docs.reduce((sum, d) => sum + (d.data().amount || 0), 0),
    totalWithdrawalFees: withdrawalSnap.docs.reduce((sum, d) => sum + (d.data().amount || 0), 0),
    numWagers: wagerSnap.size,
    numTips: tipSnap.size,
    numWithdrawals: withdrawalSnap.size
  };
});


exports.cleanupFriendsOnRemove = functions.firestore.
document('friendships/{friendshipId}').
onUpdate(async (change, context) => {
  const before = change.before.data();
  const after = change.after.data();

  // Only act if status changed to 'removed'
  if (before.status === 'active' && after.status === 'removed') {
    const [userA, userB] = after.users;
    const db = admin.firestore();

    const userAFriendsRef = db.collection('friends').doc(userA);
    const userBFriendsRef = db.collection('friends').doc(userB);

    // Remove each other's ID from friendIds array
    await Promise.all([
    userAFriendsRef.update({ friendIds: admin.firestore.FieldValue.arrayRemove(userB) }),
    userBFriendsRef.update({ friendIds: admin.firestore.FieldValue.arrayRemove(userA) })]
    );

  }
  return null;
});

// Coinbase Commerce webhook endpoint (standalone)
exports.coinbaseCryptoWebhook = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, X-CC-Webhook-Signature');

  if (req.method === 'OPTIONS') {
    return res.status(200).send();
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  try {
    const COINBASE_WEBHOOK_SECRET = process.env.COINBASE_WEBHOOK_SECRET || functions.config().coinbase?.webhook_secret || '';

    if (!COINBASE_WEBHOOK_SECRET) {

      return res.status(500).send('Webhook secret not configured');
    }

    // Verify webhook signature
    const signature = req.headers['x-cc-webhook-signature'];
    const payload = JSON.stringify(req.body);
    const crypto = require('crypto');
    const computed = crypto.
    createHmac('sha256', COINBASE_WEBHOOK_SECRET).
    update(payload).
    digest('hex');

    if (signature !== computed) {

      return res.status(400).send('Invalid signature');
    }

    const event = req.body.event;
    if (!event) {
      return res.status(400).send('No event');
    }



    // Only process confirmed charges
    if (event.type === 'charge:confirmed') {
      const charge = event.data;
      const { userId, packageId, referralCode, deviceId, userIp } = charge.metadata || {};
      const amount = parseFloat(charge.pricing.local.amount);



      if (!userId || !packageId || !amount) {

        return res.status(400).send('Missing metadata');
      }

      // Credit coins to user using the same logic as Square payments
      try {
        const db = admin.firestore();
        const userRef = db.collection('users').doc(userId);

        // Parse package to get coin amount
        let coinAmount = 0;
        if (packageId.includes('_coins')) {
          coinAmount = parseInt(packageId.replace('_coins', ''));
        } else {
          // coverother package formats if needed
          const packageMap = {
            '1': 100,
            '2': 500,
            '3': 1000,
            '4': 2500,
            '5': 5000,
            '6': 10000
          };
          coinAmount = packageMap[packageId] || 0;
        }

        if (coinAmount === 0) {

          return res.status(400).send('Invalid package');
        }

        // Update user balance
        await userRef.update({
          tokenBalance: admin.firestore.FieldValue.increment(coinAmount),
          purchasedTokens: admin.firestore.FieldValue.increment(coinAmount)
        });

        // Log transaction with proper format for referral commission processing
        await db.collection('transactions').add({
          userId,
          type: 'purchase', // Use 'purchase' so referral trigger processes it
          paymentMethod: 'crypto',
          amount: coinAmount,
          paymentAmount: amount, // Dollar amount for referral commission
          usdAmount: amount, // Keep for backward compatibility
          packageId,
          chargeId: charge.id,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'completed'
        });



        // === Process Referral Logic (if referral code provided) ===
        if (referralCode) {
          try {
            const referralService = require('./referralService');
            const referralCodeUpper = referralCode.toUpperCase();


            // 1. Validate referral code
            const codeObj = await referralService.getReferralCode(referralCodeUpper);
            if (!codeObj || !codeObj.isActive) {

              return res.status(200).send('OK');
            }

            // 2. Prevent self-referral
            if (codeObj.creatorUserId === userId) {

              return res.status(200).send('OK');
            }

            // 3. Prevent multiple uses by same user/device/IP
            const [priorByUser, priorByDevice, priorByIp] = await Promise.all([
            referralService.getReferralUsagesByUser(userId),
            deviceId ? referralService.getReferralUsagesByCode(referralCodeUpper) : Promise.resolve([]),
            userIp ? referralService.getReferralUsagesByCode(referralCodeUpper) : Promise.resolve([])]
            );

            if (priorByUser.some((u) => u.referralCode === referralCodeUpper)) {

              return res.status(200).send('OK');
            }

            if (deviceId && priorByDevice.some((u) => u.deviceId === deviceId)) {

              return res.status(200).send('OK');
            }

            if (userIp && priorByIp.some((u) => u.userIp === userIp)) {

              return res.status(200).send('OK');
            }

            // 4. Calculate payout
            const payout = amount * codeObj.payoutRate;

            // 5. Log referral usage
            await referralService.logReferralUsage({
              userId,
              referralCode: referralCodeUpper,
              coinPackage: packageId,
              amountSpent: amount,
              payoutGenerated: payout,
              timestamp: new Date().toISOString(),
              userIp: userIp || '',
              deviceId: deviceId || ''
            });

            // 6. Update referral code stats
            await referralService.updateReferralCode(referralCodeUpper, {
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


          } catch (err) {


          }
        }
        // === End Referral Logic ===

        return res.status(200).send('OK');
      } catch (err) {

        return res.status(500).send('Failed to credit coins');
      }
    }

    // Ignore other event types

    return res.status(200).send('Ignored');
  } catch (error) {

    return res.status(500).send('Internal error');
  }
});

// Global Chat Functions
const badWords = [
'fuck', 'shit', 'damn', 'bitch', 'ass', 'hell', 'crap', 'piss', 'bastard', 'slut',
'whore', 'faggot', 'nigger', 'nigga', 'retard', 'gay', 'lesbian', 'homo', 'dyke',
'tranny', 'chink', 'spic', 'wetback', 'gook', 'kike', 'towelhead', 'raghead'];
// Basic profanity filter - you can expand this or use a library

// Rate limiting map to track user message frequency
const userMessageCooldowns = new Map();

// Function to check if text contains profanity
function containsProfanity(text) {
  const lowercaseText = text.toLowerCase();
  return badWords.some((word) => lowercaseText.includes(word));
}

// Function to filter profanity from text
function filterProfanity(text) {
  let filteredText = text;
  badWords.forEach((word) => {
    const regex = new RegExp(word, 'gi');
    filteredText = filteredText.replace(regex, '*'.repeat(word.length));
  });
  return filteredText;
}

// Function to check rate limiting
function isRateLimited(userId) {
  const now = Date.now();
  const userCooldown = userMessageCooldowns.get(userId);

  if (userCooldown && now - userCooldown < 3000) {// 3 second cooldown
    return true;
  }

  userMessageCooldowns.set(userId, now);
  return false;
}

// Function to get the proper avatar URL (prioritizing Discord)
function getAvatarUrl(userData) {
  if (!userData) {

    return null;
  }








  // double-checkuser has Discord linked with avatar
  if (userData.discordLinked && userData.discordId && userData.discordAvatar) {
    let avatarUrl;
    // see ifdiscordAvatar is already a full URL
    if (userData.discordAvatar.includes('http')) {
      avatarUrl = `${userData.discordAvatar}?t=${Date.now()}`;
    } else {
      // Otherwise construct the URL from the avatar hash
      avatarUrl = `https://cdn.discordapp.com/avatars/${userData.discordId}/${userData.discordAvatar}.png?t=${Date.now()}`;
    }

    return avatarUrl;
  }

  // Fall back to photoURL if available
  const fallbackUrl = userData.photoURL || null;

  return fallbackUrl;
}

// Helper function to check if a user is muted
async function isUserMuted(userId) {
  try {
    const db = admin.firestore();
    const muteDoc = await db.collection('chat_mutes').doc(userId).get();

    if (!muteDoc.exists) {
      return { isMuted: false };
    }

    const muteData = muteDoc.data();
    const now = new Date();
    const expiresAt = muteData.expiresAt.toDate();

    // double-checkmute has expired
    if (now >= expiresAt) {
      // Clean up expired mute
      await db.collection('chat_mutes').doc(userId).delete();
      return { isMuted: false };
    }

    return {
      isMuted: true,
      reason: muteData.reason,
      expiresAt: expiresAt.toISOString(),
      mutedBy: muteData.mutedBy
    };
  } catch (error) {

    return { isMuted: false };
  }
}

// cloud fn: to send a global chat message
exports.sendGlobalChatMessage = functions.https.onCall(async (data, context) => {
  // make sure the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to send chat messages.'
    );
  }

  try {
    const { text } = data;
    const userId = context.auth.uid;


    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Message text is required.'
      );
    }

    if (text.length > 500) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Message is too long. Maximum 500 characters allowed.'
      );
    }

    // Check rate limiting
    if (isRateLimited(userId)) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Please wait before sending another message.'
      );
    }

    // Get user data
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'User profile not found.'
      );
    }

    const userData = userDoc.data();

    // see ifuser is banned
    if (userData.isBanned) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'You are banned from sending messages.'
      );
    }

    // quick check: user is muted
    const muteStatus = await isUserMuted(userId);
    if (muteStatus.isMuted) {
      const expiresAt = new Date(muteStatus.expiresAt);
      const timeRemaining = Math.ceil((expiresAt - new Date()) / (1000 * 60)); // minutes
      throw new functions.https.HttpsError(
        'permission-denied',
        `You are muted for ${timeRemaining} more minutes. Reason: ${muteStatus.reason}`
      );
    }

    // Filter profanity
    const filteredText = filterProfanity(text.trim());

    // Create the message document
    const messageData = {
      userId: userId,
      username: userData.displayName || 'Anonymous',
      avatarUrl: getAvatarUrl(userData),
      text: filteredText,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      originalText: containsProfanity(text) ? text : null, // Store original if filtered
      // Add rank and VIP status
      rank: userData.rank || 'bronze', // Default to bronze if no rank
      isVip: userData.vipStatus?.isActive || false,
      vipTier: userData.vipStatus?.tier || null,
      isAdmin: userData.isAdmin === true // Add admin status for visual marking
    };

    // Add message to Firestore
    const messageRef = await db.collection('global_chat').add(messageData);

    return {
      success: true,
      messageId: messageRef.id,
      filtered: containsProfanity(text)
    };

  } catch (error) {


    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      'An error occurred while sending the message.'
    );
  }
});

// backend fn: to delete a global chat message (admin only)
exports.deleteGlobalChatMessage = functions.https.onCall(async (data, context) => {
  // keep this safe:the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in.'
    );
  }

  try {
    const { messageId } = data;
    const userId = context.auth.uid;

    if (!messageId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Message ID is required.'
      );
    }

    const db = admin.firestore();

    // check:user is admin or message owner
    const userDoc = await db.collection('users').doc(userId).get();
    const messageDoc = await db.collection('global_chat').doc(messageId).get();

    if (!userDoc.exists || !messageDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'User or message not found.'
      );
    }

    const userData = userDoc.data();
    const messageData = messageDoc.data();

    // Check permissions (admin only in current implementation)
    if (!userData.isAdmin) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only administrators can delete messages.'
      );
    }

    // Delete the message
    await db.collection('global_chat').doc(messageId).delete();

    return { success: true };

  } catch (error) {


    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      'An error occurred while deleting the message.'
    );
  }
});

// backend fn: to get global chat history
exports.getGlobalChatHistory = functions.https.onCall(async (data, context) => {
  try {
    const { limit = 50, before } = data;
    const db = admin.firestore();

    let query = db.collection('global_chat').
    orderBy('timestamp', 'desc').
    limit(Math.min(limit, 100)); // Cap at 100 messages

    if (before) {
      query = query.startAfter(before);
    }

    const snapshot = await query.get();
    const messages = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp ? data.timestamp.toDate().toISOString() : null
      });
    });

    return { messages };

  } catch (error) {

    throw new functions.https.HttpsError(
      'internal',
      'An error occurred while fetching chat history.'
    );
  }
});

// cloud fn: to mute a user in global chat (admin only)
exports.muteUserInChat = functions.https.onCall(async (data, context) => {
  // guard:the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in.'
    );
  }

  try {
    const { targetUserId, durationMinutes = 60, reason = 'Violating chat rules' } = data;
    const adminUserId = context.auth.uid;

    if (!targetUserId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Target user ID is required.'
      );
    }

    const db = admin.firestore();

    // check:requesting user is admin
    const adminDoc = await db.collection('users').doc(adminUserId).get();
    if (!adminDoc.exists || !adminDoc.data().isAdmin) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only admins can mute users.'
      );
    }


    const targetUserDoc = await db.collection('users').doc(targetUserId).get();
    if (!targetUserDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Target user not found.'
      );
    }

    // Don't allow muting other admins
    if (targetUserDoc.data().isAdmin) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Cannot mute other administrators.'
      );
    }

    const muteExpiry = new Date(Date.now() + durationMinutes * 60 * 1000);

    // Create mute record
    await db.collection('chat_mutes').doc(targetUserId).set({
      userId: targetUserId,
      mutedBy: adminUserId,
      mutedAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(muteExpiry),
      reason: reason,
      durationMinutes: durationMinutes,
      isActive: true
    });

    return {
      success: true,
      message: `User muted for ${durationMinutes} minutes`,
      expiresAt: muteExpiry.toISOString()
    };

  } catch (error) {


    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      'An error occurred while muting the user.'
    );
  }
});

// cloud fn: to unmute a user in global chat (admin only)
exports.unmuteUserInChat = functions.https.onCall(async (data, context) => {
  // keep this safe:the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in.'
    );
  }

  try {
    const { targetUserId } = data;
    const adminUserId = context.auth.uid;

    if (!targetUserId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Target user ID is required.'
      );
    }

    const db = admin.firestore();

    // double-checkrequesting user is admin
    const adminDoc = await db.collection('users').doc(adminUserId).get();
    if (!adminDoc.exists || !adminDoc.data().isAdmin) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only admins can unmute users.'
      );
    }

    // Remove mute record
    await db.collection('chat_mutes').doc(targetUserId).delete();

    return {
      success: true,
      message: 'User has been unmuted'
    };

  } catch (error) {


    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      'An error occurred while unmuting the user.'
    );
  }
});

// backend fn: to check if current user is muted
exports.checkUserMuteStatus = functions.https.onCall(async (data, context) => {
  // make sure the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in.'
    );
  }

  try {
    const userId = context.auth.uid;
    const muteStatus = await isUserMuted(userId);
    return muteStatus;
  } catch (error) {

    return { isMuted: false };
  }
});

// Scheduled function to clean up expired mutes
exports.cleanupExpiredMutes = functions.pubsub.schedule('every 30 minutes').onRun(async (context) => {
  try {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();

    const expiredMutes = await db.collection('chat_mutes').
    where('expiresAt', '<=', now).
    get();

    const batch = db.batch();
    expiredMutes.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();


  } catch (error) {

  }
});

// Scheduled function to prune old chat messages (older than 7 days)
exports.pruneOldChatMessages = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  try {
    const db = admin.firestore();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const oldMessages = await db.collection('global_chat').
    where('timestamp', '<', admin.firestore.Timestamp.fromDate(sevenDaysAgo)).
    get();

    const batch = db.batch();
    oldMessages.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();


  } catch (error) {

  }
});

// cloud fn: to clear all chat messages (admin only)
exports.clearGlobalChat = functions.https.onCall(async (data, context) => {
  // guard:the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in.'
    );
  }

  try {
    const adminUserId = context.auth.uid;
    const db = admin.firestore();

    // double-checkrequesting user is admin
    const adminDoc = await db.collection('users').doc(adminUserId).get();
    if (!adminDoc.exists || !adminDoc.data().isAdmin) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only admins can clear the chat.'
      );
    }

    // Get all messages in the global chat
    const messagesSnapshot = await db.collection('global_chat').get();

    // Delete all messages in batches (Firestore batch limit is 500)
    const batchSize = 500;
    const batches = [];
    let currentBatch = db.batch();
    let operationCount = 0;

    messagesSnapshot.forEach((doc) => {
      currentBatch.delete(doc.ref);
      operationCount++;

      if (operationCount === batchSize) {
        batches.push(currentBatch);
        currentBatch = db.batch();
        operationCount = 0;
      }
    });

    // Add the last batch if it has operations
    if (operationCount > 0) {
      batches.push(currentBatch);
    }

    // Execute all batches
    await Promise.all(batches.map((batch) => batch.commit()));

    // Add a system message indicating the chat was cleared
    await db.collection('global_chat').add({
      userId: 'system',
      username: 'System',
      avatarUrl: null,
      text: 'Chat has been cleared by an administrator.',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      isSystem: true,
      rank: 'system',
      isVip: false,
      isAdmin: false
    });



    return {
      success: true,
      message: `Cleared ${messagesSnapshot.size} messages`,
      clearedCount: messagesSnapshot.size
    };

  } catch (error) {


    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      'An error occurred while clearing the chat.'
    );
  }
});

// ===== NEW REFERRAL SYSTEM EXPORTS =====
// Export all referral callable functions
const referralCallables = require('./referralCallables');
exports.getReferralStats = referralCallables.getReferralStats;
exports.setCustomReferralCode = referralCallables.setCustomReferralCode;
exports.generateReferralLink = referralCallables.generateReferralLink;
exports.validateNewReferralCode = referralCallables.validateReferralCode;
exports.handleReferralCodeUsage = referralCallables.handleReferralCodeUsage;
exports.initializeReferralSystem = referralCallables.initializeReferralSystem;
exports.fixReferralCodeCustomization = referralCallables.fixReferralCodeCustomization;
exports.getAdminReferralData = referralCallables.getAdminReferralData;
exports.testReferralCommission = referralCallables.testReferralCommission;
exports.testCreateReferralRelationship = referralCallables.testCreateReferralRelationship;

// Export all referral trigger functions
const referralTriggers = require('./referralTriggers');
exports.onReferralPurchaseCreate = referralTriggers.onReferralPurchaseCreate;
exports.onReferralUserCreate = referralTriggers.onReferralUserCreate;
exports.onReferralUserUpdate = referralTriggers.onReferralUserUpdate;
exports.cleanupExpiredReferralRewards = referralTriggers.cleanupExpiredReferralRewards;
exports.generateReferralStats = referralTriggers.generateReferralStats;
exports.onReferralRewardEarned = referralTriggers.onReferralRewardEarned;
