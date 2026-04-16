exports.createPartyWagerNotifications = functions.https.onCall(async (data, context) => {
  // Only allow authenticated users
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'You must be logged in to create notifications.');
  }

  const { memberUids, wagerId, partySize, leaderName } = data;

  if (!Array.isArray(memberUids) || !wagerId || !partySize || !leaderName) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required data.');
  }

  console.log(`Party wager notifications requested for wager ${wagerId} by ${leaderName}`);
  console.log(`Would have sent notifications to ${memberUids.length} members for a ${partySize} wager`);

  // No actual notifications created - feature removed
  return { success: true, count: 0, message: "Party wager notification feature has been disabled" };
}); 