import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  query, 
  where, 
  deleteDoc, 
  onSnapshot,
  addDoc
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

const FriendsContext = createContext();

export function useFriends() {
  return useContext(FriendsContext);
}

export function FriendsProvider({ children }) {
  const { currentUser } = useAuth();
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const notification = useNotification();
  const db = getFirestore();

  // Load friends data when user changes
  useEffect(() => {
    if (currentUser) {
      loadFriendsData();
      
      // Automatically sync friendships when the component loads
      setTimeout(() => {
        syncFriendships().then(result => {
          if (result.success && result.addedCount > 0) {
            console.log(`Auto-sync: Added ${result.addedCount} missing friends to your friends list`);
          }
        }).catch(error => {
          console.error('Error in auto-sync:', error);
        });
      }, 2000); // Wait 2 seconds after initial load to avoid overwhelming the system
    } else {
      // Reset state when user logs out
      setFriends([]);
      setFriendRequests([]);
      setSentRequests([]);
      setLoading(false);
    }
  }, [currentUser]);

  // Load all friends data (friends, requests, sent requests)
  const loadFriendsData = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      console.log(`Loading friends data for user: ${currentUser.uid}`);
      
      // First check if the friends document exists
      const userFriendsRef = doc(db, 'friends', currentUser.uid);
      const userFriendsDoc = await getDoc(userFriendsRef);
      
      // If it doesn't exist, create it with an empty array
      if (!userFriendsDoc.exists()) {
        console.log(`Creating new friends document for user: ${currentUser.uid}`);
        await setDoc(userFriendsRef, { friendIds: [] });
      } else if (!userFriendsDoc.data().friendIds) {
        // If the document exists but doesn't have a friendIds array, add it
        console.log(`Adding missing friendIds array to document for user: ${currentUser.uid}`);
        await updateDoc(userFriendsRef, { friendIds: [] });
      }
      
      // Check for existing friendship documents that might not be in the user's friends list
      console.log(`Checking for missing friendships for user: ${currentUser.uid}`);
      try {
        // Query friendships where the current user is one of the users and status is active
        const friendshipsQuery = query(
          collection(db, 'friendships'),
          where('users', 'array-contains', currentUser.uid),
          where('status', '==', 'active')
        );
        
        const friendshipsSnapshot = await getDocs(friendshipsQuery);
        const missingFriendIds = [];
        
        // Get current friend IDs
        const currentFriendIds = userFriendsDoc.exists() ? 
          userFriendsDoc.data().friendIds || [] : [];
        
        // Check each friendship document
        friendshipsSnapshot.forEach(friendshipDoc => {
          const friendshipData = friendshipDoc.data();
          // Find the other user in the friendship
          const otherUserId = friendshipData.users.find(id => id !== currentUser.uid);
          
          // If the other user is not in the friends list, add them
          if (otherUserId && !currentFriendIds.includes(otherUserId)) {
            missingFriendIds.push(otherUserId);
            console.log(`Found missing friend in friendship document: ${otherUserId}`);
          }
        });
        
        // Add missing friends to the user's friends list
        if (missingFriendIds.length > 0) {
          console.log(`Adding ${missingFriendIds.length} missing friends to user's friends list`);
          await updateDoc(userFriendsRef, {
            friendIds: arrayUnion(...missingFriendIds)
          });
        }
      } catch (error) {
        console.error('Error checking for missing friendships:', error);
      }
      
      // Load all data in parallel
      const [friendsResult, requestsResult, sentResult] = await Promise.all([
        loadFriends(),
        loadFriendRequests(),
        loadSentRequests()
      ]);
      
      console.log(`Loaded ${friendsResult.length} friends for user: ${currentUser.uid}`);
      
      // Verify and create friendship documents for each friend
      if (friendsResult.length > 0) {
        console.log(`Ensuring friendship consistency for ${friendsResult.length} friends...`);
        const friendshipPromises = friendsResult.map(async (friend) => {
          // Ensure friendship document exists
          const docCreated = await ensureFriendshipDocumentExists(friend.id);
          
          // Ensure reciprocal friendship
          await ensureUsersAreFriends(friend.id, currentUser.uid);
          
          return docCreated;
        });
        
        const results = await Promise.all(friendshipPromises);
        const fixedCount = results.filter(result => result === true).length;
        
        if (fixedCount > 0) {
          console.log(`Fixed ${fixedCount} friendship documents`);
        }
      }
    } catch (error) {
      console.error('Error loading friends data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Ensure friendship document exists for a given friend
  const ensureFriendshipDocumentExists = async (friendId) => {
    try {
      if (!currentUser || !friendId) return;
      
      // Generate friendship ID
      const friendshipId = [currentUser.uid, friendId].sort().join('_');
      
      // Check if friendship document exists
      const friendshipRef = doc(db, 'friendships', friendshipId);
      const friendshipDoc = await getDoc(friendshipRef);
      
      if (!friendshipDoc.exists()) {
        console.log(`Creating missing friendship document between ${currentUser.uid} and ${friendId}`);
        // Create friendship document
        await setDoc(friendshipRef, {
          users: [currentUser.uid, friendId],
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'active'
        });
        return true;
      } else if (friendshipDoc.data().status !== 'active') {
        console.log(`Reactivating friendship document between ${currentUser.uid} and ${friendId}`);
        // Reactivate friendship if it was removed
        await updateDoc(friendshipRef, {
          status: 'active',
          updatedAt: new Date()
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error ensuring friendship document exists for ${friendId}:`, error);
      return false;
    }
  };

  // Load current friends
  const loadFriends = async () => {
    try {
      // Get user's friends document
      const userFriendsRef = doc(db, 'friends', currentUser.uid);
      const userFriendsDoc = await getDoc(userFriendsRef);
      
      if (!userFriendsDoc.exists()) {
        // Create empty friends document if it doesn't exist
        await setDoc(userFriendsRef, { 
          friendIds: [] 
        });
        setFriends([]);
        return [];
      }
      
      const { friendIds } = userFriendsDoc.data();
      
      if (!friendIds || friendIds.length === 0) {
        setFriends([]);
        return [];
      }
      
      console.log(`Found ${friendIds.length} friend IDs for user: ${currentUser.uid}`, friendIds);
      
      // Get details for each friend
      const friendsList = await Promise.all(
        friendIds.map(async (friendId) => {
          try {
            const userDoc = await getDoc(doc(db, 'users', friendId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              return {
                id: friendId,
                displayName: userData.displayName || 'Unknown User',
                photoURL: userData.photoURL || null,
                epicUsername: userData.epicUsername || null,
                email: userData.email || null
              };
            }
            console.warn(`Friend user document not found for ID: ${friendId}`);
            return null;
          } catch (error) {
            console.error(`Error loading friend data for ID: ${friendId}`, error);
            return null;
          }
        })
      );
      
      // Filter out any null values (deleted users)
      const validFriends = friendsList.filter(friend => friend !== null);
      setFriends(validFriends);
      return validFriends;
    } catch (error) {
      console.error('Error loading friends:', error);
      setFriends([]);
      return [];
    }
  };

  // Load incoming friend requests
  const loadFriendRequests = async () => {
    try {
      // Query friend requests where current user is the recipient
      const requestsQuery = query(
        collection(db, 'friend_requests'),
        where('recipientId', '==', currentUser.uid),
        where('status', '==', 'pending')
      );
      
      const requestsSnapshot = await getDocs(requestsQuery);
      const requestsList = [];
      
      // Process each request
      for (const requestDoc of requestsSnapshot.docs) {
        const requestData = requestDoc.data();
        
        // Get sender details
        const senderDoc = await getDoc(doc(db, 'users', requestData.senderId));
        if (senderDoc.exists()) {
          const senderData = senderDoc.data();
          
          const requestInfo = {
            id: requestDoc.id,
            senderId: requestData.senderId,
            senderName: senderData.displayName || 'Unknown User',
            senderPhoto: getDiscordAvatarUrl(senderData),
            epicUsername: senderData.epicUsername || null,
            createdAt: requestData.createdAt?.toDate() || new Date(),
            message: requestData.message || ''
          };
          
          requestsList.push(requestInfo);
          
          // Add to notification center if this is a new request
          // Check if the request was created within the last 5 minutes to avoid notifications for old requests
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
          if (requestInfo.createdAt > fiveMinutesAgo) {
            notification.addNotification(
              'Friend Request',
              `${requestInfo.senderName} sent you a friend request`,
              'info',
              { requestId: requestInfo.id },
              [
                {
                  label: 'Accept',
                  action: async () => {
                    const result = await acceptFriendRequest(requestInfo.id);
                    if (result.success) {
                      notification.addNotification(
                        'Friend Request Accepted',
                        `You are now friends with ${requestInfo.senderName}`,
                        'success'
                      );
                    }
                  }
                },
                {
                  label: 'Decline',
                  action: async () => {
                    await declineFriendRequest(requestInfo.id);
                  }
                }
              ]
            );
          }
        }
      }
      
      setFriendRequests(requestsList);
      return requestsList;
    } catch (error) {
      console.error('Error loading friend requests:', error);
      setFriendRequests([]);
      return [];
    }
  };

  // Load sent friend requests
  const loadSentRequests = async () => {
    try {
      // Query friend requests sent by current user
      const sentQuery = query(
        collection(db, 'friend_requests'),
        where('senderId', '==', currentUser.uid),
        where('status', '==', 'pending')
      );
      
      const sentSnapshot = await getDocs(sentQuery);
      const sentList = [];
      
      // Process each sent request
      for (const requestDoc of sentSnapshot.docs) {
        const requestData = requestDoc.data();
        
        // Get recipient details
        const recipientDoc = await getDoc(doc(db, 'users', requestData.recipientId));
        if (recipientDoc.exists()) {
          const recipientData = recipientDoc.data();
          sentList.push({
            id: requestDoc.id,
            recipientId: requestData.recipientId,
            recipientName: recipientData.displayName || 'Unknown User',
            recipientPhoto: getDiscordAvatarUrl(recipientData),
            epicUsername: recipientData.epicUsername || null,
            createdAt: requestData.createdAt?.toDate() || new Date(),
            message: requestData.message || ''
          });
        }
      }
      
      setSentRequests(sentList);
      return sentList;
    } catch (error) {
      console.error('Error loading sent requests:', error);
      setSentRequests([]);
      return [];
    }
  };

  // Search users by Epic username or display name
  const searchUsersByEpicName = async (searchTerm) => {
    if (!searchTerm || searchTerm.trim() === '') {
      return [];
    }
    try {
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      const matchingUsers = [];
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        // Skip current user
        if (doc.id === currentUser.uid) {
          return;
        }
        // Check if user has an Epic username or display name that matches the search
        const epicMatch = userData.epicUsername && userData.epicUsername.toLowerCase().includes(searchTerm.toLowerCase());
        const displayNameMatch = userData.displayName && userData.displayName.toLowerCase().includes(searchTerm.toLowerCase());
        if (epicMatch || displayNameMatch) {
          matchingUsers.push({
            id: doc.id,
            displayName: userData.displayName || 'Unknown User',
            photoURL: userData.photoURL || null,
            epicUsername: userData.epicUsername || null
          });
        }
      });
      return matchingUsers;
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  };

  // Send a friend request
  const sendFriendRequest = async (userId, message = '') => {
    if (!currentUser || userId === currentUser.uid) {
      return { success: false, error: 'Invalid request' };
    }
    
    try {
      // Check if already friends
      const userFriendsRef = doc(db, 'friends', currentUser.uid);
      const userFriendsDoc = await getDoc(userFriendsRef);
      
      if (userFriendsDoc.exists()) {
        const { friendIds } = userFriendsDoc.data();
        if (friendIds && friendIds.includes(userId)) {
          return { success: false, error: 'Already friends with this user' };
        }
      }
      
      // Check if request already sent
      const existingRequestQuery = query(
        collection(db, 'friend_requests'),
        where('senderId', '==', currentUser.uid),
        where('recipientId', '==', userId),
        where('status', '==', 'pending')
      );
      
      const existingRequestSnapshot = await getDocs(existingRequestQuery);
      
      if (!existingRequestSnapshot.empty) {
        return { success: false, error: 'Friend request already sent' };
      }
      
      // Check if user has a pending request from this person
      const pendingRequestQuery = query(
        collection(db, 'friend_requests'),
        where('senderId', '==', userId),
        where('recipientId', '==', currentUser.uid),
        where('status', '==', 'pending')
      );
      
      const pendingRequestSnapshot = await getDocs(pendingRequestQuery);
      
      // Create new friend request
      const requestRef = doc(collection(db, 'friend_requests'));
      await setDoc(requestRef, {
        senderId: currentUser.uid,
        recipientId: userId,
        status: 'pending',
        message: message.trim(),
        createdAt: new Date()
      });
      
      // Reload sent requests
      await loadSentRequests();
      
      return { success: true, message: 'Friend request sent' };
    } catch (error) {
      console.error('Error sending friend request:', error);
      return { success: false, error: 'Failed to send friend request' };
    }
  };

  // Helper function to ensure users are friends in the database
  const ensureUsersAreFriends = async (userId, friendId) => {
    try {
      const userFriendsRef = doc(db, 'friends', userId);
      const userFriendsDoc = await getDoc(userFriendsRef);
      
      if (!userFriendsDoc.exists()) {
        // Create friends document with the friendId
        await setDoc(userFriendsRef, { 
          friendIds: [friendId] 
        });
        console.log(`Created friends document for ${userId} with ${friendId}`);
      } else {
        const userData = userFriendsDoc.data();
        if (!userData.friendIds) {
          // Add friendIds array if missing
          await updateDoc(userFriendsRef, { 
            friendIds: [friendId] 
          });
          console.log(`Added missing friendIds array for ${userId} with ${friendId}`);
        } else if (!userData.friendIds.includes(friendId)) {
          // Add friend to array if not present
          await updateDoc(userFriendsRef, {
            friendIds: arrayUnion(friendId)
          });
          console.log(`Added ${friendId} to ${userId}'s friends list`);
        }
      }
      return true;
    } catch (error) {
      // Remove or silence this error in production
      if (process.env.NODE_ENV === 'development') {
        console.error(`Error ensuring users are friends (${userId}, ${friendId}):`, error);
      }
      return false;
    }
  };

  // Accept a friend request
  const acceptFriendRequest = async (requestId) => {
    try {
      console.log(`Accepting friend request: ${requestId}`);
      
      // Get the request
      let requestDoc;
      try {
        const requestRef = doc(db, 'friend_requests', requestId);
        requestDoc = await getDoc(requestRef);
        if (!requestDoc.exists()) {
          console.error(`Request not found: ${requestId}`);
          return { success: false, error: 'Request not found' };
        }
      } catch (error) {
        console.error('Error fetching friend request document:', error);
        return { success: false, error: 'Failed to fetch friend request document' };
      }
      
      const requestData = requestDoc.data();
      console.log(`Request data:`, requestData);
      
      // Verify this request is for the current user
      if (requestData.recipientId !== currentUser.uid) {
        console.error(`Not authorized to accept request: ${requestId}`);
        return { success: false, error: 'Not authorized to accept this request' };
      }
      
      const senderId = requestData.senderId;
      console.log(`Sender ID: ${senderId}, Current user ID: ${currentUser.uid}`);
      
      // First, update request status to accepted
      try {
        const requestRef = doc(db, 'friend_requests', requestId);
        await updateDoc(requestRef, {
          status: 'accepted',
          updatedAt: new Date()
        });
      } catch (error) {
        console.error('Error updating friend request status:', error);
        return { success: false, error: 'Failed to update friend request status' };
      }
      
      // Create or update the friendship document
      let friendshipRef;
      try {
        const friendshipId = [currentUser.uid, senderId].sort().join('_');
        friendshipRef = doc(db, 'friendships', friendshipId);
        await setDoc(friendshipRef, {
          users: [currentUser.uid, senderId],
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'active'
        }, { merge: true });
        console.log(`Created/updated friendship document`);
      } catch (error) {
        console.error('Error creating/updating friendship document:', error);
        return { success: false, error: 'Failed to create/update friendship document' };
      }
      
      // Add to current user's friends
      try {
        const userFriendsRef = doc(db, 'friends', currentUser.uid);
        const userFriendsDoc = await getDoc(userFriendsRef);
        let currentUserFriends = [];
        if (!userFriendsDoc.exists()) {
          await setDoc(userFriendsRef, { friendIds: [] });
        } else {
          currentUserFriends = userFriendsDoc.data().friendIds || [];
        }
        if (!currentUserFriends.includes(senderId)) {
          await updateDoc(userFriendsRef, {
            friendIds: arrayUnion(senderId)
          });
          console.log(`Added sender to current user's friends`);
        }
      } catch (error) {
        console.error('Error updating current user friends list:', error);
        return { success: false, error: 'Failed to update your friends list' };
      }
      
      // Reload friends data
      try {
        await Promise.all([
          loadFriends(),
          loadFriendRequests(),
          loadSentRequests()
        ]);
      } catch (error) {
        console.error('Error reloading friends data:', error);
      }
      
      return { success: true, message: 'Friend request accepted' };
    } catch (error) {
      console.error('Error accepting friend request (outer catch):', error);
      return { success: false, error: 'Failed to accept friend request' };
    }
  };

  // Decline a friend request
  const declineFriendRequest = async (requestId) => {
    try {
      // Get the request
      const requestRef = doc(db, 'friend_requests', requestId);
      const requestDoc = await getDoc(requestRef);
      
      if (!requestDoc.exists()) {
        return { success: false, error: 'Request not found' };
      }
      
      const requestData = requestDoc.data();
      
      // Verify this request is for the current user
      if (requestData.recipientId !== currentUser.uid) {
        return { success: false, error: 'Not authorized to decline this request' };
      }
      
      // Update request status
      await updateDoc(requestRef, {
        status: 'declined',
        updatedAt: new Date()
      });
      
      // Reload friend requests
      await loadFriendRequests();
      
      return { success: true, message: 'Friend request declined' };
    } catch (error) {
      console.error('Error declining friend request:', error);
      return { success: false, error: 'Failed to decline friend request' };
    }
  };

  // Cancel a sent friend request
  const cancelFriendRequest = async (requestId) => {
    try {
      // Get the request
      const requestRef = doc(db, 'friend_requests', requestId);
      const requestDoc = await getDoc(requestRef);
      
      if (!requestDoc.exists()) {
        return { success: false, error: 'Request not found' };
      }
      
      const requestData = requestDoc.data();
      
      // Verify this request was sent by the current user
      if (requestData.senderId !== currentUser.uid) {
        return { success: false, error: 'Not authorized to cancel this request' };
      }
      
      // Delete the request
      await deleteDoc(requestRef);
      
      // Reload sent requests
      await loadSentRequests();
      
      return { success: true, message: 'Friend request cancelled' };
    } catch (error) {
      console.error('Error cancelling friend request:', error);
      return { success: false, error: 'Failed to cancel friend request' };
    }
  };

  // Remove a friend
  const removeFriend = async (friendId) => {
    if (!currentUser || !friendId) {
      alert('Invalid request: missing user or friendId');
      return { success: false, error: 'Invalid request' };
    }
    try {
      console.log(`Removing friend: ${friendId} from user: ${currentUser.uid}`);
      
      // First update the friendship document to ensure it's marked as removed
      try {
        const friendshipId = [currentUser.uid, friendId].sort().join('_');
        const friendshipRef = doc(db, 'friendships', friendshipId);
        const friendshipDoc = await getDoc(friendshipRef);
        if (friendshipDoc.exists()) {
          await updateDoc(friendshipRef, {
            status: 'removed',
            updatedAt: new Date(),
            removedBy: currentUser.uid
          });
          console.log('Updated friendship document status to removed');
        } else {
          console.warn(`Friendship document not found: ${friendshipId}`);
        }
      } catch (error) {
        console.error('Error updating friendship document:', error);
        return { success: false, error: 'Failed to update friendship document: ' + error.message };
      }
      
      // Remove from current user's friends
      try {
        const currentUserFriendsRef = doc(db, 'friends', currentUser.uid);
        await updateDoc(currentUserFriendsRef, {
          friendIds: arrayRemove(friendId)
        });
        console.log('Removed friend from current user friends document');
      } catch (error) {
        console.error('Error removing friend from current user friends:', error);
        return { success: false, error: 'Failed to update your friends list: ' + error.message };
      }
      
      // Try to remove from friend's friends list
      try {
        const friendFriendsRef = doc(db, 'friends', friendId);
        const friendFriendsDoc = await getDoc(friendFriendsRef);
        if (friendFriendsDoc.exists()) {
          await updateDoc(friendFriendsRef, {
            friendIds: arrayRemove(currentUser.uid)
          });
          console.log('Removed current user from friend\'s friends document');
        } else {
          console.warn(`Friend's friends document doesn't exist: ${friendId}`);
        }
      } catch (error) {
        console.warn('Could not update friend\'s document:', error.message);
        // Continue even if we can't update the other user's document
        // They'll need to refresh or the real-time listener will eventually catch up
      }
      
      // Force update the local state to reflect the change immediately
      setFriends(prevFriends => prevFriends.filter(friend => friend.id !== friendId));
      
      return { success: true, message: 'Friend removed' };
    } catch (error) {
      console.error('Error removing friend:', error);
      return { success: false, error: 'Failed to remove friend: ' + error.message };
    }
  };

  // Fix friendship with another user
  const fixFriendship = async (friendId) => {
    if (!currentUser || !friendId) {
      return { success: false, error: 'Invalid request' };
    }
    
    try {
      console.log(`Fixing friendship between ${currentUser.uid} and ${friendId}`);
      
      // Generate friendship ID
      const friendshipId = [currentUser.uid, friendId].sort().join('_');
      
      // Check if friendship document exists
      const friendshipRef = doc(db, 'friendships', friendshipId);
      const friendshipDoc = await getDoc(friendshipRef);
      
      if (!friendshipDoc.exists()) {
        // Create friendship document
        await setDoc(friendshipRef, {
          users: [currentUser.uid, friendId],
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'active'
        });
        console.log(`Created missing friendship document: ${friendshipId}`);
      } else if (friendshipDoc.data().status !== 'active' && friendshipDoc.data().status !== 'removed') {
        // Reactivate friendship if it was not removed
        await updateDoc(friendshipRef, {
          status: 'active',
          updatedAt: new Date()
        });
        console.log(`Reactivated friendship document: ${friendshipId}`);
      } else if (friendshipDoc.data().status === 'removed') {
        console.log(`Friendship document is removed and will not be reactivated: ${friendshipId}`);
        return { success: false, error: 'This friendship was removed and cannot be auto-fixed.' };
      }
      
      // Ensure current user's friends document exists and contains the friend
      const userFriendsRef = doc(db, 'friends', currentUser.uid);
      const userFriendsDoc = await getDoc(userFriendsRef);
      
      if (!userFriendsDoc.exists()) {
        // Create user's friends document
        await setDoc(userFriendsRef, { 
          friendIds: [friendId] 
        });
        console.log(`Created user's friends document with ${friendId}`);
      } else {
        const userData = userFriendsDoc.data();
        if (!userData.friendIds) {
          // Add friendIds array if missing
          await updateDoc(userFriendsRef, { 
            friendIds: [friendId] 
          });
          console.log(`Added missing friendIds array with ${friendId}`);
        } else if (!userData.friendIds.includes(friendId)) {
          // Add friend to array if not present
          await updateDoc(userFriendsRef, {
            friendIds: arrayUnion(friendId)
          });
          console.log(`Added ${friendId} to user's friends list`);
        }
      }
      
      // Reload friends data
      await loadFriendsData();
      
      return { 
        success: true, 
        message: 'Friendship fixed on your side. The other user needs to run the fix as well.' 
      };
    } catch (error) {
      console.error('Error fixing friendship:', error);
      return { success: false, error: 'Failed to fix friendship' };
    }
  };

  // Sync friendships from friendship documents
  const syncFriendships = async () => {
    if (!currentUser) return { success: false, error: 'No user logged in' };
    
    try {
      console.log(`Syncing friendships for user: ${currentUser.uid}`);
      
      // Query friendships where the current user is one of the users and status is active
      const friendshipsQuery = query(
        collection(db, 'friendships'),
        where('users', 'array-contains', currentUser.uid),
        where('status', '==', 'active')
      );
      
      const friendshipsSnapshot = await getDocs(friendshipsQuery);
      console.log(`Found ${friendshipsSnapshot.size} active friendship documents`);
      
      // Get current friend IDs
      const userFriendsRef = doc(db, 'friends', currentUser.uid);
      const userFriendsDoc = await getDoc(userFriendsRef);
      
      if (!userFriendsDoc.exists()) {
        await setDoc(userFriendsRef, { friendIds: [] });
        console.log('Created missing friends document with empty friends list');
      }
      
      const currentFriendIds = userFriendsDoc.exists() ? 
        userFriendsDoc.data().friendIds || [] : [];
      
      // Check each friendship document
      const missingFriendIds = [];
      friendshipsSnapshot.forEach(friendshipDoc => {
        const friendshipData = friendshipDoc.data();
        // Find the other user in the friendship
        const otherUserId = friendshipData.users.find(id => id !== currentUser.uid);
        
        // If the other user is not in the friends list, add them
        if (otherUserId && !currentFriendIds.includes(otherUserId)) {
          missingFriendIds.push(otherUserId);
          console.log(`Found missing friend in friendship document: ${otherUserId}`);
        }
      });
      
      // Add missing friends to the user's friends list
      if (missingFriendIds.length > 0) {
        console.log(`Adding ${missingFriendIds.length} missing friends to user's friends list`);
        await updateDoc(userFriendsRef, {
          friendIds: arrayUnion(...missingFriendIds)
        });
        
        // Reload friends data
        await loadFriends();
        
        return { 
          success: true, 
          message: `Added ${missingFriendIds.length} missing friends to your friends list`,
          addedCount: missingFriendIds.length
        };
      }
      
      return { 
        success: true, 
        message: 'No missing friends found, your friends list is in sync',
        addedCount: 0
      };
    } catch (error) {
      console.error('Error syncing friendships:', error);
      return { success: false, error: error.message };
    }
  };

  // Helper function to get Discord avatar URL
  const getDiscordAvatarUrl = (userData) => {
    if (userData && userData.discordLinked && userData.discordId && userData.discordAvatar) {
      // Check if discordAvatar is already a full URL
      if (userData.discordAvatar.includes('http')) {
        return `${userData.discordAvatar}?t=${Date.now()}`;
      } else {
        // Otherwise construct the URL from the avatar hash
        return `https://cdn.discordapp.com/avatars/${userData.discordId}/${userData.discordAvatar}.png?t=${Date.now()}`;
      }
    }
    return userData?.photoURL || null;
  };

  // Update the refreshFriends function to fetch Discord avatars
  const refreshFriends = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch friend requests (incoming)
      const incomingRequestsQuery = query(
        collection(db, 'friend_requests'),
        where('recipientId', '==', currentUser.uid),
        where('status', '==', 'pending')
      );
      
      const incomingRequestsSnapshot = await getDocs(incomingRequestsQuery);
      const incomingRequests = [];
      
      for (const doc of incomingRequestsSnapshot.docs) {
        const request = { id: doc.id, ...doc.data() };
        
        // Fetch sender's profile including Discord avatar
        try {
          const senderDoc = await getDoc(doc(db, 'users', request.senderId));
          if (senderDoc.exists()) {
            const senderData = senderDoc.data();
            request.senderName = senderData.displayName || 'Unknown User';
            // Use Discord avatar if available
            request.senderPhoto = getDiscordAvatarUrl(senderData);
            request.epicUsername = senderData.epicUsername;
          }
        } catch (error) {
          console.error('Error fetching sender profile:', error);
        }
        
        incomingRequests.push(request);
      }
      
      // Fetch friend requests (outgoing)
      const outgoingRequestsQuery = query(
        collection(db, 'friend_requests'),
        where('senderId', '==', currentUser.uid),
        where('status', '==', 'pending')
      );
      
      const outgoingRequestsSnapshot = await getDocs(outgoingRequestsQuery);
      const outgoingRequests = [];
      
      for (const doc of outgoingRequestsSnapshot.docs) {
        const request = { id: doc.id, ...doc.data() };
        
        // Fetch recipient's profile including Discord avatar
        try {
          const recipientDoc = await getDoc(doc(db, 'users', request.recipientId));
          if (recipientDoc.exists()) {
            const recipientData = recipientDoc.data();
            request.recipientName = recipientData.displayName || 'Unknown User';
            // Use Discord avatar if available
            request.recipientPhoto = getDiscordAvatarUrl(recipientData);
            request.epicUsername = recipientData.epicUsername;
          }
        } catch (error) {
          console.error('Error fetching recipient profile:', error);
        }
        
        outgoingRequests.push(request);
      }
      
      // Fetch friends
      const userFriendsQuery = query(
        collection(db, 'friendships'),
        where('users', 'array-contains', currentUser.uid),
        where('status', '==', 'active')
      );
      const userFriendsSnapshot = await getDocs(userFriendsQuery);
      const friendIds = userFriendsSnapshot.docs.map(doc => {
        const data = doc.data();
        // Find the other user in the friendship
        return (data.users || []).find(id => id !== currentUser.uid);
      }).filter(Boolean);
      const friendsList = [];
      
      // Fetch friend profiles including Discord avatars
      for (const friendId of friendIds) {
        try {
          const friendDoc = await getDoc(doc(db, 'users', friendId));
          if (friendDoc.exists()) {
            const friendData = friendDoc.data();
            friendsList.push({
              id: friendId,
              displayName: friendData.displayName || 'Unknown User',
              // Use Discord avatar if available
              photoURL: getDiscordAvatarUrl(friendData),
              online: friendData.online || false,
              lastSeen: friendData.lastSeen || null,
              epicUsername: friendData.epicUsername || null,
              discordUsername: friendData.discordUsername || null
            });
          }
        } catch (error) {
          console.error('Error fetching friend profile:', error);
        }
      }
      
      setFriendRequests(incomingRequests);
      setSentRequests(outgoingRequests);
      setFriends(friendsList);
      setLoading(false);
      return { success: true };
      
    } catch (error) {
      console.error('Error refreshing friends:', error);
      setError(error.message);
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  // Add a real-time listener for new friend requests
  useEffect(() => {
    if (!currentUser) return;

    // Set up listener for new friend requests
    const requestsQuery = query(
      collection(db, 'friend_requests'),
      where('recipientId', '==', currentUser.uid),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(requestsQuery, async (snapshot) => {
      // Gather all new/added requests and fetch sender data in parallel
      const addedRequests = snapshot.docChanges()
        .filter(change => change.type === 'added')
        .map(change => ({ id: change.doc.id, ...change.doc.data() }));

      if (addedRequests.length > 0) {
        const requestsWithSender = await Promise.all(addedRequests.map(async (request) => {
          let senderName = 'Unknown User';
          let senderPhoto = undefined;
          let epicUsername = undefined;
          try {
            const senderDoc = await getDoc(doc(db, 'users', request.senderId));
            if (senderDoc.exists()) {
              const senderData = senderDoc.data();
              senderName = senderData.displayName || 'Unknown User';
              senderPhoto = getDiscordAvatarUrl(senderData);
              epicUsername = senderData.epicUsername || null;
            }
          } catch (e) {
            // fallback to defaults
          }
          return {
            id: request.id,
            senderId: request.senderId,
            senderName,
            senderPhoto,
            epicUsername,
            createdAt: request.createdAt?.toDate ? request.createdAt.toDate() : new Date(),
            message: request.message || ''
          };
        }));

        // Only show notification for new requests
        requestsWithSender.forEach(requestInfo => {
          const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
          if (requestInfo.createdAt > twoMinutesAgo) {
            notification.addNotification(
              'Friend Request',
              `${requestInfo.senderName} sent you a friend request`,
              'info',
              { requestId: requestInfo.id },
              [
                {
                  label: 'Accept',
                  action: async () => {
                    const result = await acceptFriendRequest(requestInfo.id);
                    if (result.success) {
                      notification.addNotification(
                        'Friend Request Accepted',
                        `You are now friends with ${requestInfo.senderName}`,
                        'success'
                      );
                    }
                  }
                },
                {
                  label: 'Decline',
                  action: async () => {
                    await declineFriendRequest(requestInfo.id);
                  }
                }
              ]
            );
          }
        });

        // Add new requests to state, avoiding duplicates
        setFriendRequests(prev => {
          const prevIds = new Set(prev.map(r => r.id));
          return [...prev, ...requestsWithSender.filter(r => !prevIds.has(r.id))];
        });
      }

      // Handle removed/modified (non-pending) requests
      snapshot.docChanges().forEach(change => {
        if (change.type === 'removed' || (change.type === 'modified' && change.doc.data().status !== 'pending')) {
          setFriendRequests(prev => prev.filter(r => r.id !== change.doc.id));
        }
      });
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Add after the real-time listener for friend requests
  useEffect(() => {
    if (!currentUser) return;
    const friendsQuery = query(
      collection(db, 'friendships'),
      where('users', 'array-contains', currentUser.uid),
      where('status', '==', 'active')
    );
    const unsubscribe = onSnapshot(friendsQuery, async (snapshot) => {
      const friendIds = snapshot.docs.map(doc => {
        const data = doc.data();
        return (data.users || []).find(id => id !== currentUser.uid);
      }).filter(Boolean);

      const friendsList = [];
      for (const friendId of friendIds) {
        try {
          const friendDoc = await getDoc(doc(db, 'users', friendId));
          if (friendDoc.exists()) {
            const friendData = friendDoc.data();
            friendsList.push({
              id: friendId,
              displayName: friendData.displayName || 'Unknown User',
              photoURL: getDiscordAvatarUrl(friendData),
              online: friendData.online || false,
              lastSeen: friendData.lastSeen || null,
              epicUsername: friendData.epicUsername || null,
              discordUsername: friendData.discordUsername || null
            });
          }
        } catch (error) {
          console.error('Error fetching friend profile:', error);
        }
      }
      setFriends(friendsList);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Real-time listener for friendships - detects both additions and removals
  useEffect(() => {
    if (!currentUser) return;
    
    // Listen for all friendships where the current user is involved
    const friendshipsQuery = query(
      collection(db, 'friendships'),
      where('users', 'array-contains', currentUser.uid)
    );
    
    const unsubscribe = onSnapshot(friendshipsQuery, async (snapshot) => {
      // Process all active friendships
      const activeFriendships = snapshot.docs
        .filter(doc => doc.data().status === 'active')
        .map(doc => {
          const data = doc.data();
          return (data.users || []).find(id => id !== currentUser.uid);
        })
        .filter(Boolean);
      
      // Get unique friend IDs
      const uniqueFriendIds = [...new Set(activeFriendships)];
      console.log(`Real-time update: Found ${uniqueFriendIds.length} active friendships`);
      
      // Fetch friend details
      const friendsList = [];
      for (const friendId of uniqueFriendIds) {
        try {
          const friendDoc = await getDoc(doc(db, 'users', friendId));
          if (friendDoc.exists()) {
            const friendData = friendDoc.data();
            friendsList.push({
              id: friendId,
              displayName: friendData.displayName || 'Unknown User',
              photoURL: getDiscordAvatarUrl(friendData),
              online: friendData.online || false,
              lastSeen: friendData.lastSeen || null,
              epicUsername: friendData.epicUsername || null,
              discordUsername: friendData.discordUsername || null
            });
          }
        } catch (error) {
          console.error('Error fetching friend profile:', error);
        }
      }
      
      // Update local state with the current list of active friends
      setFriends(friendsList);
      
      // Also update the friends document to ensure it's in sync
      try {
        const userFriendsRef = doc(db, 'friends', currentUser.uid);
        const userFriendsDoc = await getDoc(userFriendsRef);
        
        if (userFriendsDoc.exists()) {
          const currentFriendIds = userFriendsDoc.data().friendIds || [];
          
          // Find IDs to add and remove
          const idsToAdd = uniqueFriendIds.filter(id => !currentFriendIds.includes(id));
          const idsToRemove = currentFriendIds.filter(id => !uniqueFriendIds.includes(id));
          
          // Update if needed
          if (idsToAdd.length > 0 || idsToRemove.length > 0) {
            console.log(`Syncing friends document: Adding ${idsToAdd.length}, Removing ${idsToRemove.length}`);
            
            // Create a new friendIds array with the changes
            const updatedFriendIds = [...currentFriendIds.filter(id => !idsToRemove.includes(id)), ...idsToAdd];
            
            // Update the document
            await setDoc(userFriendsRef, { friendIds: updatedFriendIds }, { merge: true });
          }
        }
      } catch (error) {
        console.error('Error syncing friends document:', error);
      }
    });
    
    return () => unsubscribe();
  }, [currentUser]);

  // Context value
  const value = {
    friends,
    friendRequests,
    sentRequests,
    loading,
    error,
    searchUsersByEpicName,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    removeFriend,
    fixFriendship,
    refreshFriends,
    ensureFriendshipDocumentExists,
    ensureUsersAreFriends,
    syncFriendships
  };

  return (
    <FriendsContext.Provider value={value}>
      {children}
    </FriendsContext.Provider>
  );
} 