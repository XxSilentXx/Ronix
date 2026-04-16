import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
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
  serverTimestamp, 
  onSnapshot,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import { useNotification } from '../contexts/NotificationContext';

// Create the party context
const PartyContext = createContext();

// Custom hook to use the party context
export const useParty = () => {
  return useContext(PartyContext);
};

// Provider component that wraps the app and makes party object available
export function PartyProvider({ children }) {
  const { currentUser } = useAuth();
  const notification = useNotification();
  
  const [currentParty, setCurrentParty] = useState(null);
  const [partyMembers, setPartyMembers] = useState([]);
  const [partyInvites, setPartyInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Listen for party changes when user is logged in
  useEffect(() => {
    if (!currentUser) {
      setCurrentParty(null);
      setPartyMembers([]);
      setPartyInvites([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    // Check if user is in a party
    const unsubscribe = onSnapshot(
      query(collection(db, 'parties'), where('members', 'array-contains', currentUser.uid)),
      async (snapshot) => {
        if (snapshot.empty) {
          // User is not in any party
          setCurrentParty(null);
          setPartyMembers([]);
          
          // Check for pending invites
          try {
            // Try to query with the new invitedUsers field
            const invitesQuery = query(
              collection(db, 'parties'), 
              where('invitedUsers', 'array-contains', currentUser.uid)
            );
            
            const invitesSnapshot = await getDocs(invitesQuery);
            const invites = [];
            
            if (invitesSnapshot.empty) {
              // If no results with invitedUsers, try the old way by fetching all parties
              console.log('No invites found with invitedUsers field, checking all parties');
              const allPartiesQuery = query(collection(db, 'parties'));
              const allPartiesSnapshot = await getDocs(allPartiesQuery);
              
              for (const docSnapshot of allPartiesSnapshot.docs) {
                const partyData = docSnapshot.data();
                // Check if user has a pending invite in the invites array
                const hasPendingInvite = partyData.invites && 
                  partyData.invites.some(invite => 
                    invite.userId === currentUser.uid && invite.status === 'pending'
                  );
                
                if (hasPendingInvite) {
                  // Get party leader info
                  const leaderDocRef = doc(db, 'users', partyData.leader);
                  const leaderDocSnapshot = await getDoc(leaderDocRef);
                  const leaderName = leaderDocSnapshot.exists() ? 
                    (leaderDocSnapshot.data().displayName || leaderDocSnapshot.data().email) : 'Unknown user';
                  
                  invites.push({
                    partyId: docSnapshot.id,
                    partyName: partyData.name,
                    leader: partyData.leader,
                    leaderName,
                    timestamp: partyData.createdAt
                  });
                }
              }
            } else {
              // Process results from invitedUsers query
              for (const docSnapshot of invitesSnapshot.docs) {
                const partyData = docSnapshot.data();
                // Only include pending invites
                const userInvite = partyData.invites.find(
                  invite => invite.userId === currentUser.uid && invite.status === 'pending'
                );
                
                if (userInvite) {
                  // Get party leader info
                  const leaderDocRef = doc(db, 'users', partyData.leader);
                  const leaderDocSnapshot = await getDoc(leaderDocRef);
                  const leaderName = leaderDocSnapshot.exists() ? 
                    (leaderDocSnapshot.data().displayName || leaderDocSnapshot.data().email) : 'Unknown user';
                  
                  invites.push({
                    partyId: docSnapshot.id,
                    partyName: partyData.name,
                    leader: partyData.leader,
                    leaderName,
                    timestamp: partyData.createdAt
                  });
                }
              }
            }
            
            setPartyInvites(invites);
          } catch (err) {
            console.error('Error fetching party invites:', err);
          }
        } else {
          // User is in a party
          const partyDoc = snapshot.docs[0];
          const partyData = partyDoc.data();
          
          setCurrentParty({
            id: partyDoc.id,
            ...partyData
          });
          
          // Fetch member details
          const memberPromises = partyData.members.map(async (memberId) => {
            const memberDocRef = doc(db, 'users', memberId);
            const memberDocSnapshot = await getDoc(memberDocRef);
            if (memberDocSnapshot.exists()) {
              const userData = memberDocSnapshot.data();
              return {
                id: memberId,
                // Prioritize Firestore displayName, fall back to auth displayName or email
                displayName: userData.displayName || (memberId === currentUser.uid ? currentUser.displayName : null) || userData.email || 'Unknown user',
                isLeader: memberId === partyData.leader,
                photoURL: userData.photoURL || null,
                epicUsername: userData.epicUsername || null
              };
            }
            return {
              id: memberId,
              displayName: memberId === currentUser.uid ? currentUser.displayName : 'Unknown user',
              isLeader: memberId === partyData.leader
            };
          });
          
          const members = await Promise.all(memberPromises);
          setPartyMembers(members);
        }
        
        setLoading(false);
      },
      (err) => {
        console.error('Error listening for party changes:', err);
        setError('Failed to load party information');
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [currentUser]);
  
  // Create a new party
  const createParty = async (partyName) => {
    if (!currentUser) {
      throw new Error('You must be logged in to create a party');
    }
    
    if (currentParty) {
      throw new Error('You are already in a party');
    }
    
    try {
      // Get the latest user data from Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.exists() ? userDoc.data() : {};
      
      const partyRef = doc(collection(db, 'parties'));
      await setDoc(partyRef, {
        name: partyName,
        leader: currentUser.uid,
        leaderName: userData.displayName || currentUser.displayName || 'Unknown user',
        members: [currentUser.uid],
        maxSize: 4,
        status: 'open',
        createdAt: serverTimestamp(),
        invites: [],
        invitedUsers: []
      });
      
      notification.addNotification('Party created successfully!', 'success');
      return partyRef.id;
    } catch (err) {
      console.error('Error creating party:', err);
      notification.addNotification('Failed to create party', 'error');
      throw err;
    }
  };
  
  // Leave current party
  const leaveParty = async () => {
    if (!currentUser || !currentParty) {
      return;
    }
    
    try {
      const partyRef = doc(db, 'parties', currentParty.id);
      const partyDoc = await getDoc(partyRef);
      
      if (!partyDoc.exists()) {
        setCurrentParty(null);
        setPartyMembers([]);
        return;
      }
      
      const partyData = partyDoc.data();
      
      if (partyData.leader === currentUser.uid) {
        // If leader leaves and there are other members, transfer leadership
        if (partyData.members.length > 1) {
          const newLeader = partyData.members.find(id => id !== currentUser.uid);
          await updateDoc(partyRef, {
            leader: newLeader,
            members: arrayRemove(currentUser.uid)
          });
          notification.addNotification('You left the party. Leadership transferred.', 'info');
        } else {
          // If leader is alone, delete the party
          await deleteDoc(partyRef);
          notification.addNotification('Party disbanded', 'info');
        }
      } else {
        // Regular member leaving
        await updateDoc(partyRef, {
          members: arrayRemove(currentUser.uid)
        });
        notification.addNotification('You left the party', 'info');
      }
      
      setCurrentParty(null);
      setPartyMembers([]);
    } catch (err) {
      console.error('Error leaving party:', err);
      notification.addNotification('Failed to leave party', 'error');
      throw err;
    }
  };
  
  // Invite a user to the party
  const inviteToParty = async (userId) => {
    if (!currentUser || !currentParty) {
      throw new Error('You must be in a party to invite others');
    }
    
    // Allow any party member to send invites, not just the leader
    
    try {
      const partyRef = doc(db, 'parties', currentParty.id);
      
      // Check if user is already in the party
      if (currentParty.members.includes(userId)) {
        throw new Error('User is already in your party');
      }
      
      // Check if party is full
      if (currentParty.members.length >= currentParty.maxSize) {
        throw new Error('Party is already full');
      }
      
      // Get current party data to check if invitedUsers exists
      const partyDoc = await getDoc(partyRef);
      const partyData = partyDoc.data();
      
      // Add invite
      if (partyData.invitedUsers) {
        // invitedUsers field exists, update normally
        await updateDoc(partyRef, {
          invites: arrayUnion({
            userId,
            status: 'pending',
            timestamp: new Date().toISOString()
          }),
          invitedUsers: arrayUnion(userId)
        });
      } else {
        // invitedUsers field doesn't exist, initialize it
        await updateDoc(partyRef, {
          invites: arrayUnion({
            userId,
            status: 'pending',
            timestamp: new Date().toISOString()
          }),
          invitedUsers: [userId]
        });
      }
      
      notification.addNotification('Invitation sent', 'success');
    } catch (err) {
      console.error('Error inviting to party:', err);
      notification.addNotification(`Failed to send invite: ${err.message}`, 'error');
      throw err;
    }
  };
  
  // Accept a party invitation
  const acceptInvite = async (partyId) => {
    if (!currentUser) {
      throw new Error('You must be logged in to accept an invite');
    }
    
    if (currentParty) {
      throw new Error('You must leave your current party before joining another');
    }
    
    try {
      const partyRef = doc(db, 'parties', partyId);
      const partyDoc = await getDoc(partyRef);
      
      if (!partyDoc.exists()) {
        throw new Error('This party no longer exists');
      }
      
      const partyData = partyDoc.data();
      
      // Check if party is full
      if (partyData.members.length >= partyData.maxSize) {
        throw new Error('This party is already full');
      }
      
      // Check if user is already invited
      const isInvited = partyData.invites.some(
        invite => invite.userId === currentUser.uid && invite.status === 'pending'
      );
      
      if (!isInvited) {
        throw new Error('You do not have an invitation to this party');
      }
      
      // Update the invite status and add user to members
      const updatedInvites = partyData.invites.map(invite => {
        if (invite.userId === currentUser.uid) {
          return { ...invite, status: 'accepted' };
        }
        return invite;
      });
      
      // Check if invitedUsers exists
      if (partyData.invitedUsers) {
        await updateDoc(partyRef, {
          members: arrayUnion(currentUser.uid),
          invites: updatedInvites,
          invitedUsers: arrayRemove(currentUser.uid)
        });
      } else {
        await updateDoc(partyRef, {
          members: arrayUnion(currentUser.uid),
          invites: updatedInvites,
          invitedUsers: []
        });
      }
      
      notification.addNotification('You joined the party!', 'success');
    } catch (err) {
      console.error('Error accepting party invite:', err);
      notification.addNotification(`Failed to join party: ${err.message}`, 'error');
      throw err;
    }
  };
  
  // Decline a party invitation
  const declineInvite = async (partyId) => {
    if (!currentUser) {
      return;
    }
    
    try {
      const partyRef = doc(db, 'parties', partyId);
      const partyDoc = await getDoc(partyRef);
      
      if (!partyDoc.exists()) {
        // Remove from local state if party doesn't exist
        setPartyInvites(prev => prev.filter(invite => invite.partyId !== partyId));
        return;
      }
      
      const partyData = partyDoc.data();
      
      // Update the invite status
      const updatedInvites = partyData.invites.map(invite => {
        if (invite.userId === currentUser.uid) {
          return { ...invite, status: 'declined' };
        }
        return invite;
      });
      
      // Check if invitedUsers exists
      if (partyData.invitedUsers) {
        await updateDoc(partyRef, {
          invites: updatedInvites,
          invitedUsers: arrayRemove(currentUser.uid)
        });
      } else {
        await updateDoc(partyRef, {
          invites: updatedInvites,
          invitedUsers: []
        });
      }
      
      // Remove from local state
      setPartyInvites(prev => prev.filter(invite => invite.partyId !== partyId));
      notification.addNotification('Invitation declined', 'info');
    } catch (err) {
      console.error('Error declining party invite:', err);
      notification.addNotification('Failed to decline invitation', 'error');
    }
  };
  
  // Kick a member from the party (leader only)
  const kickMember = async (userId) => {
    if (!currentUser || !currentParty) {
      return;
    }
    
    if (currentParty.leader !== currentUser.uid) {
      throw new Error('Only the party leader can kick members');
    }
    
    if (userId === currentUser.uid) {
      throw new Error('You cannot kick yourself from the party');
    }
    
    try {
      const partyRef = doc(db, 'parties', currentParty.id);
      await updateDoc(partyRef, {
        members: arrayRemove(userId)
      });
      
      notification.addNotification('Member removed from party', 'info');
    } catch (err) {
      console.error('Error kicking member from party:', err);
      notification.addNotification('Failed to remove member', 'error');
      throw err;
    }
  };
  
  // Transfer party leadership
  const transferLeadership = async (newLeaderId) => {
    if (!currentUser || !currentParty) {
      return;
    }
    
    if (currentParty.leader !== currentUser.uid) {
      throw new Error('Only the current leader can transfer leadership');
    }
    
    if (!currentParty.members.includes(newLeaderId)) {
      throw new Error('Cannot transfer leadership to someone not in the party');
    }
    
    try {
      const partyRef = doc(db, 'parties', currentParty.id);
      await updateDoc(partyRef, {
        leader: newLeaderId
      });
      
      notification.addNotification('Party leadership transferred', 'success');
    } catch (err) {
      console.error('Error transferring party leadership:', err);
      notification.addNotification('Failed to transfer leadership', 'error');
      throw err;
    }
  };
  
  // Find user's friends to invite
  const getFriendsToInvite = async () => {
    if (!currentUser) {
      return [];
    }
    
    try {
      // Get user's friends from the friends collection
      const userFriendsRef = doc(db, 'friends', currentUser.uid);
      const userFriendsDoc = await getDoc(userFriendsRef);
      
      if (!userFriendsDoc.exists() || !userFriendsDoc.data().friendIds || userFriendsDoc.data().friendIds.length === 0) {
        return [];
      }
      
      const { friendIds } = userFriendsDoc.data();
      
      // Get details for each friend
      const friendsList = await Promise.all(
        friendIds.map(async (friendId) => {
          // Skip friends who are already in the party
          if (currentParty && currentParty.members.includes(friendId)) {
            return null;
          }
          
          const userDoc = await getDoc(doc(db, 'users', friendId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            return {
              id: friendId,
              displayName: userData.displayName || 'Unknown User',
              photoURL: userData.photoURL || null,
              epicUsername: userData.epicUsername || null,
              discordLinked: userData.discordLinked || false,
              discordId: userData.discordId || null,
              discordAvatar: userData.discordAvatar || null
            };
          }
          return null;
        })
      );
      
      // Filter out null values (users already in party or deleted users)
      return friendsList.filter(friend => friend !== null);
    } catch (err) {
      console.error('Error fetching friends:', err);
      return [];
    }
  };
  
  // Create a wager with the current party
  const createPartyWager = async (wagerData) => {
    if (!currentUser || !currentParty) {
      throw new Error('You must be in a party to create a party wager');
    }
    
    if (currentParty.leader !== currentUser.uid) {
      throw new Error('Only the party leader can create wagers');
    }
    
    // This would integrate with your existing wager creation system
    // For now, we'll just return the structure
    return {
      ...wagerData,
      partyId: currentParty.id,
      partySize: currentParty.members.length,
      partyMembers: currentParty.members,
      hostId: currentUser.uid,
      teamMode: `${currentParty.members.length}v${currentParty.members.length}`
    };
  };
  
  // The value object that will be passed to the context
  const value = {
    currentParty,
    partyMembers,
    partyInvites,
    loading,
    error,
    createParty,
    leaveParty,
    inviteToParty,
    acceptInvite,
    declineInvite,
    kickMember,
    transferLeadership,
    getFriendsToInvite,
    createPartyWager,
    isPartyLeader: currentParty && currentUser ? currentParty.leader === currentUser.uid : false
  };
  
  return (
    <PartyContext.Provider value={value}>
      {children}
    </PartyContext.Provider>
  );
} 