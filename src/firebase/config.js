// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getAnalytics } from "firebase/analytics";
import { getDoc, doc, runTransaction, serverTimestamp, deleteDoc } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// Replace these placeholder values with your actual Firebase config values for ronix-main
// You can find these in your Firebase Console > Project Settings > General > Your Apps > SDK setup and configuration
// Example:
// const firebaseConfig = {
//   apiKey: "AIzaSyC1a5XYZ123456789",
//   authDomain: "ronix-main.firebaseapp.com",
//   projectId: "ronix-main",
//   storageBucket: "ronix-main.appspot.com",
//   messagingSenderId: "123456789",
//   appId: "1:123456789:web:abc123def456",
//   measurementId: "G-ABCDEF123"
// };

// Get the current environment
const isLocalhost = window.location.hostname === 'localhost' || 
                 window.location.hostname === '127.0.0.1' ||
                 window.location.hostname.includes('192.168.');

// IMPORTANT - Auth domain for local development
// When using Firebase Authentication on localhost, you need to make sure that
// 'localhost' is added to the authorized domains in Firebase Console
// Firebase Authentication > Settings > Authorized Domains

// Determine environment (production, staging, etc.)
const ENV = process.env.REACT_APP_ENV || 'production';

// Load Firebase config from environment variables based on environment
const firebaseConfig = ENV === 'staging' ? {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY_STAGING,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN_STAGING,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID_STAGING,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET_STAGING,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID_STAGING,
  appId: process.env.REACT_APP_FIREBASE_APP_ID_STAGING,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID_STAGING
} : {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Optionally, throw error if any are missing
Object.entries(firebaseConfig).forEach(([key, value]) => {
  if (!value) {
    console.warn(`Missing Firebase config value for: ${key}`);
  }
});

// If on localhost, use a direct auth domain override
// The proper solution is to add localhost to authorized domains in Firebase Console
if (isLocalhost) {
  // No need to override authDomain here - just make sure localhost is added to
  // Firebase Console > Authentication > Settings > Authorized Domains
}

// IMPORTANT: Before deploying to production:
// 1. Replace the placeholder values above with your actual Firebase config
// 2. Set up authentication providers in Firebase Console:
//    - Google: Enable and add authorized domains
//    - Discord: Enable and set up OAuth redirect URI
//      - Provider ID must be 'discord.com'
//      - Add your production domain and localhost to authorized domains
//    - Twitch: Enable and configure properly
// 3. For Discord authentication to work:
//    - Set up a Discord application at https://discord.com/developers/applications
//    - Add redirect URIs: 
//        * https://tokensite-6eef3.firebaseapp.com/__/auth/handler
//        * http://localhost:3000/__/auth/handler (for local development)
//    - Add these same domains to Firebase Authentication > Settings > Authorized Domains

// Initialize Firebase

// Create variables before the try-catch for export
let app = null;
let auth = null;
let db = null;
let storage = null;
let functions = null;
let analytics = null;

try {
  // Initialize Firebase app
  app = initializeApp(firebaseConfig);

  // Initialize Auth
  auth = getAuth(app);

  // Initialize Firestore
  db = getFirestore(app);
  
  // Initialize Storage
  storage = getStorage(app);
  
  // Initialize Functions
  functions = getFunctions(app, 'us-central1');

  // Initialize Analytics
  analytics = getAnalytics(app);

  // For local development - connect to emulator if needed
  // Uncomment this if you're using Firebase emulators
  // if (isLocalhost) {
  //   connectFirestoreEmulator(db, 'localhost', 8080);
  //   connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
  //   connectFunctionsEmulator(functions, "localhost", 5001);
  // }
} catch (error) {
  console.error("Error initializing Firebase:", error);
  console.error("Firebase initialization failed - using null instances");
}

// Function to check if Epic account is already linked to any user
export const isEpicAccountLinked = async (epicId) => {
  if (!epicId) return false;

  try {
    const db = getFirestore();
    const epicAccountLinkDoc = await getDoc(doc(db, 'epicAccountLinks', epicId));
    
    return epicAccountLinkDoc.exists();
  } catch (error) {
    console.error('Error checking Epic account link:', error);
    return false;
  }
};

// Function to create Epic account link
export const createEpicAccountLink = async (userId, epicId, epicUsername) => {
  if (!userId || !epicId) {
    throw new Error('User ID and Epic ID are required');
  }

  const db = getFirestore();
  
  // Check if Epic account is already linked
  const epicAccountLinkDoc = await getDoc(doc(db, 'epicAccountLinks', epicId));
  
  if (epicAccountLinkDoc.exists()) {
    // If linked to a different user, throw error
    if (epicAccountLinkDoc.data().userId !== userId) {
      throw new Error('This Epic Games account is already linked to another user');
    }
    // If already linked to this user, just return success
    return true;
  }
  
  // Create new link using transaction to ensure atomicity
  try {
    await runTransaction(db, async (transaction) => {
      // Double-check the link doesn't exist during transaction
      const epicLinkRef = doc(db, 'epicAccountLinks', epicId);
      const epicLinkDoc = await transaction.get(epicLinkRef);
      
      if (epicLinkDoc.exists()) {
        throw new Error('This Epic Games account was just linked to another user');
      }
      
      // Create the new link
      transaction.set(epicLinkRef, {
        userId: userId,
        epicId: epicId,
        epicUsername: epicUsername || '',
        linkedAt: serverTimestamp()
      });
    });
    
    return true;
  } catch (error) {
    console.error('Error creating Epic account link:', error);
    throw error;
  }
};

// Function to remove Epic account link
export const removeEpicAccountLink = async (epicId) => {
  if (!epicId) {
    throw new Error('Epic ID is required');
  }
  
  try {
    const db = getFirestore();
    
    // Check if the link exists
    const epicLinkRef = doc(db, 'epicAccountLinks', epicId);
    const epicLinkDoc = await getDoc(epicLinkRef);
    
    // If it exists, delete it
    if (epicLinkDoc.exists()) {
      await deleteDoc(epicLinkRef);
    }
    
    return true;
  } catch (error) {
    console.error('Error removing Epic account link:', error);
    throw error;
  }
};

export { auth, db, storage, functions, isLocalhost, analytics, app };
