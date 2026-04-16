const functions = require('firebase-functions');
const axios = require('axios');

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID || functions.config().twitch?.client_id || '';
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET || functions.config().twitch?.client_secret || '';

let cachedToken = null;
let tokenExpiry = 0;

async function getAppAccessToken() {
  if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
    throw new Error('Twitch API credentials are not configured');
  }
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }
  const resp = await axios.post('https://id.twitch.tv/oauth2/token', null, {
    params: {
      client_id: TWITCH_CLIENT_ID,
      client_secret: TWITCH_CLIENT_SECRET,
      grant_type: 'client_credentials'
    }
  });
  cachedToken = resp.data.access_token;
  tokenExpiry = Date.now() + (resp.data.expires_in - 60) * 1000;
  return cachedToken;
}

exports.getTwitchStreamStatus = functions.https.onCall(async (data, context) => {
  const { twitchUsername } = data;
  if (!twitchUsername) throw new functions.https.HttpsError('invalid-argument', 'Missing twitchUsername');
  if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
    throw new functions.https.HttpsError('failed-precondition', 'Twitch API credentials are not configured.');
  }
  const accessToken = await getAppAccessToken();
  const resp = await axios.get('https://api.twitch.tv/helix/streams', {
    params: { user_login: twitchUsername },
    headers: {
      'Client-ID': TWITCH_CLIENT_ID,
      'Authorization': `Bearer ${accessToken}`
    }
  });
  const streamData = resp.data.data;
  if (streamData && streamData.length > 0) {
    const stream = streamData[0];
    return {
      isLive: true,
      streamTitle: stream.title,
      viewerCount: stream.viewer_count,
      thumbnailUrl: stream.thumbnail_url.replace('{width}', '320').replace('{height}', '180')
    };
  }
  return {
    isLive: false,
    streamTitle: null,
    viewerCount: null,
    thumbnailUrl: null
  };
}); 

exports.exchangeTwitchCode = functions.https.onCall(async (data, context) => {
  try {
    if (!data || !data.code || !data.redirectUri) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'The function must be called with code and redirectUri arguments.'
      );
    }

    if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Twitch OAuth credentials are not configured.'
      );
    }

    const tokenResponse = await axios.post(
      'https://id.twitch.tv/oauth2/token',
      new URLSearchParams({
        client_id: TWITCH_CLIENT_ID,
        client_secret: TWITCH_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: String(data.code),
        redirect_uri: String(data.redirectUri)
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token } = tokenResponse.data;

    const userResponse = await axios.get('https://api.twitch.tv/helix/users', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Client-Id': TWITCH_CLIENT_ID
      }
    });

    return {
      userData: userResponse.data,
      accessToken: access_token
    };
  } catch (error) {
    throw new functions.https.HttpsError(
      'internal',
      `Failed to exchange Twitch code: ${error.response?.data?.message || error.message}`
    );
  }
});