import axios from 'axios';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebase/config';

// Twitch API constants
const TWITCH_API_URL = 'https://api.twitch.tv/helix';
const TWITCH_CLIENT_ID = '0b2ky6cvke29pzotf5cq6ocfwzhlil';
// Note: Client secrets should be kept secure and not in client-side code
// For production, this should be handled by a server-side function

/**
 * Get Twitch access token from Firestore for a user
 * @param {string} userId - Firebase user ID
 * @returns {Promise<string|null>} - Twitch access token or null if not found
 */
export const getTwitchAccessToken = async (userId) => {
  try {
    const db = getFirestore();
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (userDoc.exists() && userDoc.data().twitchAccessToken) {
      return userDoc.data().twitchAccessToken;
    }
    
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Check if a Twitch user is currently streaming
 * @param {string} twitchUsername - Twitch username to check
 * @returns {Promise<{isLive: boolean, streamTitle: string|null, viewerCount: number|null, thumbnailUrl: string|null}>}
 */
export const checkIfUserIsStreaming = async (twitchUsername) => {
  try {
    const functions = getFunctions(app, 'us-central1');
    const getTwitchStreamStatus = httpsCallable(functions, 'getTwitchStreamStatus');
    const result = await getTwitchStreamStatus({ twitchUsername });
    return result.data;
  } catch (error) {
    return {
      isLive: false,
      streamTitle: null,
      viewerCount: null,
      thumbnailUrl: null,
      error: error.message
    };
  }
};

/**
 * Get Twitch user information
 * @param {string} userId - Firebase user ID
 * @returns {Promise<{twitchId: string|null, twitchUsername: string|null, isLinked: boolean}>}
 */
export const getTwitchUserInfo = async (userId) => {
  try {
    const db = getFirestore();
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (userDoc.exists() && userDoc.data().twitchLinked) {
      return {
        twitchId: userDoc.data().twitchId || null,
        twitchUsername: userDoc.data().twitchUsername || null,
        isLinked: true
      };
    }
    
    return {
      twitchId: null,
      twitchUsername: null,
      isLinked: false
    };
  } catch (error) {
    return {
      twitchId: null,
      twitchUsername: null,
      isLinked: false,
      error: error.message
    };
  }
}; 