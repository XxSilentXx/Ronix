import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, getDoc, serverTimestamp, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import { useParty } from './PartyContext';
import { playNotificationSound } from '../utils/audioUtils';

// Create notification context
const NotificationContext = createContext();

export const useNotification = () => {
  return useContext(NotificationContext);
};

export function NotificationProvider({ children }) {
  const { currentUser } = useAuth();
  const party = useParty();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [partyInvites, setPartyInvites] = useState([]);
  
  // Initialize cleared invites from localStorage
  const [clearedInvites, setClearedInvites] = useState(() => {
    try {
      const stored = localStorage.getItem('clearedInvites');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch (e) {
      return new Set();
    }
  });
  
  // Save cleared invites to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('clearedInvites', JSON.stringify([...clearedInvites]));
    } catch (e) {
    }
  }, [clearedInvites]);
  
  // Add cleared invite to tracking set
  const addClearedInvite = (partyId) => {
    setClearedInvites(prev => {
      const newSet = new Set(prev);
      newSet.add(partyId);
      return newSet;
    });
  };
  
  // Check if invite was cleared
  const isInviteCleared = (partyId) => {
    return clearedInvites.has(partyId);
  };
  
  // Listen for party invites
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      setPartyInvites([]);
      return;
    }
    
    // Check for pending party invites
    let unsubscribeFunction = () => {};
    
    // First try to query with the invitedUsers field
    const invitesQuery = query(
      collection(db, 'parties'), 
      where('invitedUsers', 'array-contains', currentUser.uid)
    );
    
    try {
      unsubscribeFunction = onSnapshot(invitesQuery, async (snapshot) => {
        const invites = [];
        
        for (const docSnapshot of snapshot.docs) {
          const partyData = docSnapshot.data();
          
          // Only include pending invites
          const userInvite = partyData.invites && partyData.invites.find(
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
        
        // If no results with invitedUsers, try checking all parties as a fallback
        if (invites.length === 0) {
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
        }
        
        setPartyInvites(invites);
        updateNotificationsFromInvites(invites);
      });
    } catch (error) {
    }
    
    return () => {
      if (typeof unsubscribeFunction === 'function') {
        unsubscribeFunction();
      }
    };
  }, [currentUser]);
  
  // Listen for Firestore party-wager notifications
  useEffect(() => {
    if (!currentUser) return;

    const notifRef = collection(db, 'users', currentUser.uid, 'notifications');
    const unsubscribe = onSnapshot(notifRef, (snapshot) => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const notif = change.doc.data();
          
          // Check if this is a wager-related notification
          if (!notif.read && !notif.cleared) {
            // Handle different notification types
            if (notif.type === 'party-wager') {
              addNotification(
                'Party Wager',
                notif.message,
                'info',
                { matchId: notif.matchId },
                [
                  {
                    label: 'Go to Wager',
                    action: async () => {
                      // Mark as read in Firestore
                      await updateDoc(change.doc.ref, { read: true });
                      // Redirect to the wager page
                      window.location.href = `/wager/${notif.matchId}`;
                    }
                  }
                ]
              );
              
              // Play notification sound
              playNotificationSound('notification');
            } else if (notif.type === 'party-wager-joined' || notif.type === 'wager-joined') {
              // Someone joined a wager
              addNotification(
                'Wager Joined',
                notif.message,
                'success',
                { matchId: notif.matchId },
                [
                  {
                    label: 'View Match',
                    action: async () => {
                      // Mark as read in Firestore
                      await updateDoc(change.doc.ref, { read: true });
                      // Redirect to the wager match page
                      window.location.href = `/wager/${notif.matchId}`;
                    }
                  }
                ]
              );
              // Immediately mark as read in Firestore to prevent repeat sound
              updateDoc(change.doc.ref, { read: true });
              // Play join sound
              playNotificationSound('join');
            }
          }
        }
      });
    });

    return () => unsubscribe();
  }, [currentUser]);
  
  // Listen for admin notifications if user is admin
  useEffect(() => {
    if (!currentUser) return;

    // Check if user is admin - fetch from Firestore if not available on currentUser
    const checkAdminAndListen = async () => {
      let isAdmin = currentUser.isAdmin;
      
      // If isAdmin is not on currentUser, fetch from Firestore
      if (isAdmin === undefined) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            isAdmin = userDoc.data().isAdmin || false;
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          return;
        }
      }

      console.log('Admin check result:', { userId: currentUser.uid, isAdmin });

      if (!isAdmin) return;

      // Listen to admin_notifications collection
      const adminNotifRef = query(
        collection(db, 'admin_notifications'),
        orderBy('createdAt', 'desc')
      );
      const unsubscribeAdmin = onSnapshot(adminNotifRef, (snapshot) => {
        console.log('Admin notifications snapshot received, count:', snapshot.size);
        const adminNotifs = [];
        snapshot.forEach(doc => {
          const notif = doc.data();
          console.log('Admin notification:', notif);
          adminNotifs.push({
            id: `admin-${doc.id}`,
            type: 'admin_notification',
            title: notif.type ? notif.type.replace(/_/g, ' ').toUpperCase() : 'Admin Alert',
            message: notif.message,
            timestamp: notif.createdAt?.toDate ? notif.createdAt.toDate() : new Date(),
            read: notif.read || false,
            data: notif.data || {},
          });
        });
        // Merge admin notifications with user notifications, avoiding duplicates
        setNotifications(prev => {
          // Remove old admin notifications
          const filtered = prev.filter(n => n.type !== 'admin_notification');
          const newNotifs = [...adminNotifs, ...filtered];
          console.log('Updated notifications with admin notifs:', newNotifs.length, 'total');
          return newNotifs;
        });
        // Update unread count for admin notifications
        setUnreadCount(prev => {
          const adminUnread = adminNotifs.filter(n => !n.read).length;
          const otherUnread = prev - (prev.filter ? prev.filter(n => n.type === 'admin_notification' && !n.read).length : 0);
          const newCount = adminUnread + otherUnread;
          console.log('Updated unread count:', newCount, 'admin unread:', adminUnread);
          return newCount;
        });
      });

      // Store unsubscribe function for cleanup
      return unsubscribeAdmin;
    };

    let unsubscribeAdmin;
    checkAdminAndListen().then(unsub => {
      unsubscribeAdmin = unsub;
    });

    return () => {
      if (unsubscribeAdmin) {
        unsubscribeAdmin();
      }
    };
  }, [currentUser]);
  
  // Update notifications based on party invites
  const updateNotificationsFromInvites = (invites) => {
    // Filter out cleared invites
    const activeInvites = invites.filter(invite => !isInviteCleared(invite.partyId));
    
    // Convert party invites to notifications
    const partyNotifications = activeInvites.map(invite => ({
      id: `party-${invite.partyId}`,
      type: 'party_invite',
      title: 'Party Invitation',
      message: `${invite.leaderName} has invited you to join their party: ${invite.partyName}`,
      timestamp: invite.timestamp,
      data: invite,
      read: false,
      actions: [
        {
          label: 'Accept',
          action: () => handleAcceptInvite(invite.partyId)
        },
        {
          label: 'Decline',
          action: () => handleDeclineInvite(invite.partyId)
        }
      ]
    }));
    
    // Update notifications with party invites
    setNotifications(prev => {
      // Filter out existing party invites
      const filteredNotifications = prev.filter(n => n.type !== 'party_invite');
      // Add new party invites
      const newNotifications = [...filteredNotifications, ...partyNotifications];
      return newNotifications;
    });
    
    // Update unread count
    setUnreadCount(prev => {
      const unreadPartyInvites = partyNotifications.filter(n => !n.read).length;
      const otherUnread = prev - notifications.filter(n => n.type === 'party_invite' && !n.read).length;
      const newCount = otherUnread + unreadPartyInvites;
      return newCount;
    });
  };
  
  // Handle accepting a party invite
  const handleAcceptInvite = async (partyId) => {
    if (!currentUser) {
      return;
    }
    
    try {
      // Use the PartyContext's acceptInvite function instead of our own implementation
      await party.acceptInvite(partyId);
      
      // Remove the notification
      removeNotification(`party-${partyId}`);
    } catch (error) {
    }
  };
  
  // Handle declining a party invite
  const handleDeclineInvite = async (partyId) => {
    if (!currentUser) {
      return;
    }
    
    try {
      // Use the PartyContext's declineInvite function
      await party.declineInvite(partyId);
      
      // Remove the notification
      removeNotification(`party-${partyId}`);
    } catch (error) {
    }
  };
  
  // Add a notification
  const addNotification = (title, message, type = 'info', data = {}, actions = []) => {
    const id = `notification-${Date.now()}`;
    const newNotification = {
      id,
      type,
      title,
      message,
      timestamp: new Date(),
      data,
      read: false,
      actions
    };
    
    // Add new notifications to the beginning of the array so they appear at the top
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    return id;
  };
  
  // Mark notification as read
  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
    
    // Update unread count
    setUnreadCount(prev => Math.max(0, prev - 1));
  };
  
  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  const removeNotification = (id) => {
    const notification = notifications.find(n => n.id === id);
    const wasUnread = notification && !notification.read;
    
    // If this is a party invite notification, mark it as cleared
    if (notification && notification.type === 'party_invite' && notification.data && notification.data.partyId) {
      addClearedInvite(notification.data.partyId);
    }
    
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    
    if (wasUnread) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };
  // Clear all notifications
  const clearAllNotifications = async () => {
    if (!currentUser) return;

    try {
      // Clear local state
      setNotifications([]);
      setUnreadCount(0);
      
      // Mark all current party invites as cleared
      partyInvites.forEach(invite => {
        addClearedInvite(invite.partyId);
      });
      
      // Clear notifications from Firestore
      const notifRef = collection(db, 'users', currentUser.uid, 'notifications');
      const notificationsSnapshot = await getDocs(notifRef);
      
      // Batch delete all notifications
      const batchPromises = [];
      const batchSize = 500; // Firestore batch limit is 500
      let batch = [];
      
      notificationsSnapshot.forEach(doc => {
        batch.push(doc.ref);
        
        if (batch.length >= batchSize) {
          batchPromises.push(
            Promise.all(batch.map(ref => updateDoc(ref, { read: true, cleared: true })))
          );
          batch = [];
        }
      });
      
      if (batch.length > 0) {
        batchPromises.push(
          Promise.all(batch.map(ref => updateDoc(ref, { read: true, cleared: true })))
        );
      }
      
      await Promise.all(batchPromises);
      
      // For party invites, decline all pending invites
      for (const invite of partyInvites) {
        try {
          await party.declineInvite(invite.partyId);
        } catch (error) {
        }
      }
    } catch (error) {
    }
  };
  
  const value = {
    notifications,
    unreadCount,
    partyInvites,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    handleAcceptInvite,
    handleDeclineInvite,
    isInviteCleared,
    addClearedInvite
  };
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
} 