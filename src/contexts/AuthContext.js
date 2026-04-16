import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged,
  OAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  browserLocalPersistence,
  setPersistence,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { ensureUserData } from '../firebase/userUtils';
import { useNotification } from '../contexts/NotificationContext';
import { getFirestore, getDoc, doc, setDoc } from 'firebase/firestore';
import { updateUserIP, checkUserBanStatus, checkIPBanStatus, checkEpicIdBanStatus } from '../firebase/banUtils';

// Enable Firebase debugging in development environment
if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {

  window.firebase = { auth };
}

// Create the authentication context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider component that wraps the app and makes auth object available to any child component that calls useAuth()
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [userAvatarUrl, setUserAvatarUrl] = useState(null);
  const [userIP, setUserIP] = useState(null);
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const notification = useNotification();

  // Set persistent authentication on mount and get IP
  useEffect(() => {
    const setupPersistence = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);

      } catch (error) {
        console.error('Error setting persistence:', error);
      }
    };

    const getUserIP = async () => {
      try {
        // Get user's IP address (you can use any IP detection service)
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        setUserIP(data.ip);
      } catch (error) {
        console.error('Error getting user IP:', error);
      }
    };
    
    setupPersistence();
    getUserIP();
  }, []);

  // Function to handle Google sign in
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    // Add scopes if needed
    provider.addScope('profile');
    provider.addScope('email');
    
    // Set custom parameters
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    try {
      const result = await signInWithPopup(auth, provider);
      
      // Ensure user data is synchronized and check if new user
      const syncedUser = await ensureUserData(result.user);
      
      // Check if this is a new user and trigger modal
      if (syncedUser && syncedUser.isNewUser) {
        console.log('New user detected - will show modal after delay');
        // Delay to ensure everything loads
        setTimeout(() => {
          setShowNewUserModal(true);
        }, 1000);
      }
      
      // Show success notification
      if (notification) {
        notification.addNotification(`Welcome, ${result.user.displayName || 'User'}!`, 'success');
      }
      
      return result.user;
    } catch (error) {
      console.error("Error signing in with Google:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      if (error.email) {
        console.error("Email associated with error:", error.email);
      }
      if (error.credential) {
        console.error("Credential associated with error:", error.credential);
      }
      
      // Show error notification
      if (notification) {
        notification.addNotification(`Login failed: ${error.message}`, 'error');
      }
      
      setAuthError(error);
      throw error;
    }
  };

  // Function to handle Discord sign in - using direct OAuth approach like in Profile.js
  const signInWithDiscord = async () => {
    try {

      
      // Discord application credentials
      const clientId = process.env.REACT_APP_DISCORD_CLIENT_ID;
      const redirectUri = window.location.origin + '/auth-callback';
              
        // Generate Discord OAuth URL with necessary scopes - simplified to only what's required
      const discordUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify%20email`;
      
      
      
      // Store a flag to detect when we return - but for auth, not linking
      localStorage.setItem('discord_auth_started', Date.now().toString());
      
      if (notification) {
        notification.addNotification('Redirecting to Discord for login...', 'info');
      }
      
      // Redirect to Discord
      window.location.href = discordUrl;
      
      // This function won't return normally due to the redirect
      return null;
    } catch (error) {
      console.error("Error initiating Discord sign-in:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      
      if (error.customData) {
        console.error('Error custom data:', error.customData);
      }
      
      if (notification) {
        notification.addNotification(`Discord login failed: ${error.message}`, 'error');
      }
      
      setAuthError(error);
      throw error;
    }
  };

  // Function to handle Twitch sign in
  const signInWithTwitch = async () => {
    try {

      
      // Twitch application credentials
      const twitchClientId = '0b2ky6cvke29pzotf5cq6ocfwzhlil';
      const redirectUri = window.location.origin + '/auth-callback';
      
      
      
      // Generate Twitch OAuth URL with necessary scopes
      // Include user:read:broadcast to check streaming status
      const twitchUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${twitchClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=user:read:email%20user:read:broadcast`;
      
      
      
      // Store a flag to detect when we return - for linking
      if (localStorage.getItem('twitch_link_started')) {
        // Generate a nonce for security
        const nonce = Math.random().toString(36).substring(2, 15);
        localStorage.setItem('twitch_link_nonce', nonce);
      } else {
        // For direct auth, not linking
        localStorage.setItem('twitch_auth_started', Date.now().toString());
      }
      
      if (notification) {
        notification.addNotification('Redirecting to Twitch for login...', 'info');
      }
      
      // Redirect to Twitch
      window.location.href = twitchUrl;
      
      // This function won't return normally due to the redirect
      return null;
    } catch (error) {
      console.error("Error initiating Twitch sign-in:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      
      if (error.customData) {
        console.error('Error custom data:', error.customData);
      }
      
      if (notification) {
        notification.addNotification(`Twitch login failed: ${error.message}`, 'error');
      }
      
      setAuthError(error);
      throw error;
    }
  };

  // Function to handle sign out
  const logout = async () => {
    try {
      const displayName = currentUser?.displayName || 'User';
      await signOut(auth);
      
      // Show logout notification
      if (notification) {
        notification.addNotification(`Goodbye, ${displayName}! You've been signed out.`, 'info');
      }
    } catch (error) {
      console.error("Error signing out", error);
      
      if (notification) {
        notification.addNotification(`Sign out failed: ${error.message}`, 'error');
      }
      
      throw error;
    }
  };

  // Function to check for auth redirect results
  const checkRedirectResult = async () => {
    try {
      const result = await getRedirectResult(auth);
      if (result) {
        // Ensure user data is synchronized after redirect sign-in and check if new user
        const syncedUser = await ensureUserData(result.user);
        setAuthError(null);
        
        // Check if this is a new user and trigger modal
        if (syncedUser && syncedUser.isNewUser) {
          console.log('New user detected from redirect - will show modal after delay');
          // Delay to ensure everything loads
          setTimeout(() => {
            setShowNewUserModal(true);
          }, 1000);
        } else {
          // Check if user just returned from Discord linking initiated from modal
          const modalLinkingFlag = localStorage.getItem('discord_linking_from_modal');
          const discordNeedsRefresh = localStorage.getItem('discord_needs_refresh');
          
          if (modalLinkingFlag) {
            console.log('User returned from Discord linking initiated from modal - reopening modal');
            // Clear the flags
            localStorage.removeItem('discord_linking_from_modal');
            localStorage.removeItem('discord_needs_refresh');
            
            // Reopen the modal after a brief delay to ensure everything is loaded
            setTimeout(() => {
              setShowNewUserModal(true);
            }, 1000);
          }
        }
        
        // Show success notification
        if (notification) {
          notification.addNotification(`Welcome back, ${result.user.displayName || 'User'}!`, 'success');
        }
        
        return result.user;
      }
      return null;
    } catch (error) {
      console.error('Error processing redirect result:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (notification) {
        notification.addNotification(`Authentication failed: ${error.message}`, 'error');
      }
      
      setAuthError(error);
      throw error;
    }
  };

  // Function to get Discord avatar URL
  const updateUserAvatar = async (user) => {
    if (!user) {
      console.log('updateUserAvatar: No user provided, setting avatar to null');
      setUserAvatarUrl(null);
      return;
    }

    try {
      const db = getFirestore();
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('User data from Firestore:', userData);
        // Use Discord avatar if linked
        if (userData.discordLinked && userData.discordId && userData.discordAvatar) {
          console.log('User has Discord linked. ID:', userData.discordId, 'Avatar:', userData.discordAvatar);
          // Check if discordAvatar is already a full URL
          if (userData.discordAvatar.includes('http')) {
            const url = `${userData.discordAvatar}?t=${Date.now()}`;
            console.log('Setting avatar to Discord URL:', url);
            setUserAvatarUrl(url);
          } else {
            // Otherwise construct the URL from the avatar hash
            const avatarURL = `https://cdn.discordapp.com/avatars/${userData.discordId}/${userData.discordAvatar}.png?t=${Date.now()}`;
            console.log('Setting avatar to constructed Discord URL:', avatarURL);
            setUserAvatarUrl(avatarURL);
          }
        } else if (user.photoURL) {
          // Fallback to Firebase auth photoURL
          console.log('No Discord avatar, using Firebase photoURL:', user.photoURL);
          setUserAvatarUrl(user.photoURL);
        } else {
          console.log('No avatar available, setting to null');
          setUserAvatarUrl(null);
        }
      } else {
        // Fallback to Firebase auth photoURL
        console.log('User document does not exist in Firestore, using Firebase photoURL:', user.photoURL || null);
        setUserAvatarUrl(user.photoURL || null);
      }
    } catch (error) {
      console.error("Error fetching user avatar:", error);
      // Fallback to Firebase auth photoURL
      console.log('Error occurred, using Firebase photoURL as fallback:', user.photoURL || null);
      setUserAvatarUrl(user.photoURL || null);
    }
  };

    // Set up an observer on the Auth object to update the user state when auth state changes
  useEffect(() => {
    // Check for redirect results first
    checkRedirectResult().catch(error => {
      console.error("Error checking redirect result:", error);
    });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
  
        
        // Get current IP if we don't have it yet
        let currentIP = userIP;
        if (!currentIP) {
          try {
  
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            currentIP = data.ip;
            setUserIP(currentIP);
            
          } catch (error) {
            console.error('Error getting user IP:', error);
            // Try alternative IP services
            try {
              const response = await fetch('https://ipapi.co/ip/');
              currentIP = await response.text();
              currentIP = currentIP.trim();
              setUserIP(currentIP);
              
            } catch (altError) {
              console.error('Error with alternative IP service:', altError);
            }
          }
        }
        
        // Check ban status before allowing user access
        try {
          const banStatus = await checkUserBanStatus(user.uid);
          if (banStatus.isBanned) {
  
            // User is banned, but still set as current user so BanGuard can show notification
            const syncedUser = await ensureUserData(user);
            setCurrentUser(syncedUser);
            await updateUserAvatar(syncedUser);
            setLoading(false);
            return;
          }

          // Check IP ban if we have user's IP
          if (currentIP) {
            const ipBanStatus = await checkIPBanStatus(currentIP);
            if (ipBanStatus.isBanned) {
  
              // IP is banned, but still allow user through so they can see notification
              const syncedUser = await ensureUserData(user);
              setCurrentUser(syncedUser);
              await updateUserAvatar(syncedUser);
              setLoading(false);
              return;
            }
            
            // Update user's IP in their profile
            console.log('Updating user IP in profile:', currentIP);
            await updateUserIP(user.uid, currentIP);
          }

          // Get user data and check Epic ID ban
          const syncedUser = await ensureUserData(user);
          
          if (syncedUser.epicId) {
            const epicBanStatus = await checkEpicIdBanStatus(syncedUser.epicId);
            if (epicBanStatus.isBanned) {
              console.log('Epic ID is banned:', epicBanStatus);
              // Epic ID is banned, but still allow user through so they can see notification
              setCurrentUser(syncedUser);
              await updateUserAvatar(syncedUser);
              setLoading(false);
              return;
            }
          }

          // User is not banned, proceed normally
          setCurrentUser(syncedUser);
          await updateUserAvatar(syncedUser);
          
          // Check if user just returned from Discord linking initiated from modal
          const modalLinkingFlag = localStorage.getItem('discord_linking_from_modal');
          const discordNeedsRefresh = localStorage.getItem('discord_needs_refresh');
          
          if (modalLinkingFlag && discordNeedsRefresh) {
            console.log('User returned from Discord linking initiated from modal - reopening modal');
            // Clear the flags
            localStorage.removeItem('discord_linking_from_modal');
            localStorage.removeItem('discord_needs_refresh');
            
            // Reopen the modal after a brief delay to ensure everything is loaded
            setTimeout(() => {
              setShowNewUserModal(true);
            }, 1000);
          }
          
        } catch (error) {
          console.error('Error checking ban status:', error);
          // In case of error, allow user through but log the issue
          const syncedUser = await ensureUserData(user);
          setCurrentUser(syncedUser);
          await updateUserAvatar(syncedUser);
          
          // Check if user just returned from Discord linking initiated from modal (even with errors)
          const modalLinkingFlag = localStorage.getItem('discord_linking_from_modal');
          const discordNeedsRefresh = localStorage.getItem('discord_needs_refresh');
          
          if (modalLinkingFlag && discordNeedsRefresh) {
            console.log('User returned from Discord linking initiated from modal (with errors) - reopening modal');
            // Clear the flags
            localStorage.removeItem('discord_linking_from_modal');
            localStorage.removeItem('discord_needs_refresh');
            
            // Reopen the modal after a brief delay to ensure everything is loaded
            setTimeout(() => {
              setShowNewUserModal(true);
            }, 1000);
          }
        }
      } else {
  
        setCurrentUser(null);
        setUserAvatarUrl(null);
      }
      setLoading(false);
    });

    // Clean up the observer when the component unmounts
    return unsubscribe;
  }, [userIP]); // Add userIP to dependency array

  // The value object that will be passed to the context
  const value = {
    currentUser,
    userAvatarUrl,
    signInWithGoogle,
    signInWithDiscord,
    signInWithTwitch,
    logout,
    setCurrentUser,
    updateUserAvatar,
    checkRedirectResult,
    authError,
    setAuthError,
    showNewUserModal,
    setShowNewUserModal
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Function to create a new user document in Firestore
const createUserDocument = async (user, additionalData = {}) => {
  if (!user) return;
  
  const userRef = doc(getFirestore(), "users", user.uid);
  const snapshot = await getDoc(userRef);
  
  if (!snapshot.exists()) {
    const { email, displayName, photoURL } = user;
    const createdAt = new Date();
    
    try {
      await setDoc(userRef, {
        displayName: displayName || additionalData.displayName || email.split('@')[0],
        displayNameLower: (displayName || additionalData.displayName || email.split('@')[0]).toLowerCase(),
        email,
        photoURL: photoURL || null,
        createdAt,
        updatedAt: createdAt,
        ...additionalData
      });
    } catch (error) {
      console.error("Error creating user document", error);
    }
  }
  
  return userRef;
};

// Update the createUser function to include displayNameLower
export const createUser = async (email, password, displayName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update display name in Firebase Auth
    await updateProfile(userCredential.user, {
      displayName: displayName
    });
    
    // Create user document in Firestore with displayNameLower
    await createUserDocument(userCredential.user, {
      displayName: displayName,
      displayNameLower: displayName.toLowerCase()
    });
    
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};
