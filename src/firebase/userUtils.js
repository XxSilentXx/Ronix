import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth, updateProfile } from 'firebase/auth';

// Function to check if a display name is already in use
export const isDisplayNameAvailable = async (displayName, currentUserId) => {
  if (!displayName || !displayName.trim()) {
    return { available: false, error: "Display name cannot be empty" };
  }
  
  try {
    const db = getFirestore();
    const trimmedName = displayName.trim();
    
    // Query users collection for the display name
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('displayName', '==', trimmedName));
    const querySnapshot = await getDocs(q);
    
    // No results means the name is available
    if (querySnapshot.empty) {
      return { available: true };
    }
    
    // Check if the only result is the current user (updating their own name)
    if (querySnapshot.size === 1 && querySnapshot.docs[0].id === currentUserId) {
      return { available: true };
    }
    
    // Name is taken by another user
    return { 
      available: false, 
      error: `The display name "${trimmedName}" is already in use by another player. Please choose a different name.` 
    };
  } catch (error) {
    console.error('Error checking display name availability:', error);
    return { 
      available: false, 
      error: `Error checking display name availability: ${error.message}` 
    };
  }
};

// Function to synchronize user display name between Auth and Firestore
export const syncUserDisplayName = async (userId, newDisplayName) => {
  if (!userId || !newDisplayName) return false;
  
  try {
    // Check if display name is available
    const isAvailable = await isDisplayNameAvailable(newDisplayName);
    
    if (!isAvailable) {
      return false;
    }
    
    const db = getFirestore();
    const auth = getAuth();
    
    // Update Firestore user document
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      displayName: newDisplayName,
      displayNameLower: newDisplayName.toLowerCase(),
      updatedAt: new Date().toISOString()
    });
    
    // Update Auth profile if this is the current user
    if (auth.currentUser && auth.currentUser.uid === userId) {
      await updateProfile(auth.currentUser, {
        displayName: newDisplayName
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error syncing display name:', error);
    return false;
  }
};

// Function to ensure user data is consistent
export const ensureUserData = async (user) => {
  if (!user) return null;
  
  try {
    const db = getFirestore();
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    // Check if this is a new user (first login)
    if (!userDoc.exists()) {
      console.log('New user detected - creating user document:', user.uid);
      let displayName = user.displayName || '';
      
      // For new users, make sure the display name is unique if provided
      if (displayName) {
        // First check if it's available
        const nameCheck = await isDisplayNameAvailable(displayName, user.uid);
        
        if (!nameCheck.available) {
          // Name taken, generate a unique variant by adding a timestamp-derived number
          const timestamp = Date.now().toString().slice(-5);
          displayName = `${displayName}${timestamp}`;
          
          // Update the user's Auth profile with the unique name
          await updateProfile(user, {
            displayName: displayName
          });
        }
      }
      
      // Create user document for new user with new user flags
      const newUserData = {
        email: user.email || '',
        displayName: displayName,
        photoURL: user.photoURL || '',
        tokenBalance: 0, // New users get 100 tokens instead of 0
        isNewUser: true, // Flag to detect new users
        discordLinked: false, // Track Discord linking status
        epicLinked: false, // Track Epic Games linking status
        createdAt: new Date()
      };
      
      await setDoc(userDocRef, newUserData);
      console.log('New user document created with flags:', newUserData);
      
      return {
        ...user,
        ...newUserData
      };
    } else {
      const userData = userDoc.data();
      
      // Check if display name needs to be synchronized
      if (user.displayName && user.displayName !== userData.displayName) {
        // User's Auth profile has a different name than Firestore
        // We prioritize the Firestore value since it's our source of truth for display names
        await updateProfile(user, {
          displayName: userData.displayName
        });
      } else if (userData.displayName && userData.displayName !== user.displayName) {
        // Firestore has a display name but Auth profile doesn't
        // Update Auth profile if Firestore has a different display name
        await updateProfile(user, {
          displayName: userData.displayName
        });
      }
      
      return {
        ...user,
        ...userData
      };
    }
  } catch (error) {
    console.error('Error ensuring user data:', error);
    return user;
  }
};

// Create or update displayNameLower field whenever displayName is updated
export const updateDisplayNameLower = async (userId, displayName) => {
  if (!userId || !displayName) return false;
  
  try {
    const db = getFirestore();
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      displayNameLower: displayName.toLowerCase(),
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error updating displayNameLower:', error);
    return false;
  }
};

// Fetch all users with Twitch linked
export const getAllTwitchLinkedUsers = async () => {
  try {
    const db = getFirestore();
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('twitchLinked', '==', true));
    const querySnapshot = await getDocs(q);
    const users = [];
    querySnapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data.twitchUsername) {
        users.push({
          id: docSnap.id,
          displayName: data.displayName || 'Twitch User',
          twitchUsername: data.twitchUsername,
          photoURL: data.photoURL || null,
        });
      }
    });
    return users;
  } catch (error) {
    console.error('Error fetching Twitch linked users:', error);
    return [];
  }
}; 