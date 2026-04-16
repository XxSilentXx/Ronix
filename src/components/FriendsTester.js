import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useFriends } from '../contexts/FriendsContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { doc, getDoc, collection, getDocs, query, where, updateDoc, arrayUnion, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const Container = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 20px;
  color: white;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 15px;
  color: #4facfe;
`;

const Section = styled.div`
  margin-bottom: 20px;
  padding: 15px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
`;

const SectionTitle = styled.h3`
  font-size: 1.2rem;
  margin-bottom: 10px;
  color: #4facfe;
`;

const InputGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
`;

const Input = styled.input`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 10px;
  color: white;
  flex: 1;
  
  &:focus {
    outline: none;
    border-color: #4facfe;
  }
`;

const Button = styled.button`
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 15px;
  cursor: pointer;
  font-weight: 600;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 242, 254, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const LogContainer = styled.div`
  background: #1a1a2e;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 10px;
  height: 200px;
  overflow-y: auto;
  margin-top: 10px;
  font-family: monospace;
  font-size: 0.9rem;
`;

const LogEntry = styled.div`
  margin-bottom: 5px;
  padding: 5px;
  border-radius: 4px;
  
  &.info {
    color: #4facfe;
  }
  
  &.success {
    color: #2ecc71;
  }
  
  &.error {
    color: #ff4757;
  }
  
  &.warning {
    color: #ffa502;
  }
`;

const UserList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
`;

const UserItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  padding: 10px;
  border-radius: 8px;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const UserAvatar = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: ${props => props.$photoURL ? `url(${props.$photoURL}) no-repeat center/cover` : 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
`;

const FriendsTester = () => {
  const { currentUser } = useAuth();
  const { 
    friends, 
    friendRequests, 
    sentRequests, 
    searchUsersByEpicName, 
    sendFriendRequest, 
    acceptFriendRequest, 
    declineFriendRequest, 
    cancelFriendRequest, 
    removeFriend,
    refreshFriends,
    fixFriendship,
    ensureFriendshipDocumentExists,
    syncFriendships
  } = useFriends();
  const notification = useNotification();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [friendshipData, setFriendshipData] = useState(null);
  const [friendDocData, setFriendDocData] = useState(null);
  const [friendId, setFriendId] = useState('');
  const [isFixingAll, setIsFixingAll] = useState(false);
  const [fixAllResults, setFixAllResults] = useState({ success: 0, failed: 0, total: 0 });
  
  // Add log entry
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
  };
  
  // Handle search
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    try {
      setIsSearching(true);
      addLog(`Searching for users with Epic name containing: ${searchTerm}`, 'info');
      
      const results = await searchUsersByEpicName(searchTerm);
      setSearchResults(results);
      
      addLog(`Found ${results.length} users matching search criteria`, 'success');
    } catch (error) {
      addLog(`Error searching users: ${error.message}`, 'error');
    } finally {
      setIsSearching(false);
    }
  };
  
  // Handle send friend request
  const handleSendRequest = async (userId) => {
    try {
      addLog(`Sending friend request to user ID: ${userId}`, 'info');
      
      const result = await sendFriendRequest(userId);
      
      if (result.success) {
        addLog(result.message, 'success');
        notification.addNotification(result.message, 'success');
      } else {
        addLog(`Failed: ${result.error}`, 'error');
        notification.addNotification(result.error, 'error');
      }
    } catch (error) {
      addLog(`Error sending friend request: ${error.message}`, 'error');
    }
  };
  
  // Handle accept friend request
  const handleAcceptRequest = async (requestId) => {
    try {
      addLog(`Accepting friend request ID: ${requestId}`, 'info');
      
      const result = await acceptFriendRequest(requestId);
      
      if (result.success) {
        addLog(result.message, 'success');
        notification.addNotification(result.message, 'success');
      } else {
        addLog(`Failed: ${result.error}`, 'error');
        notification.addNotification(result.error, 'error');
      }
    } catch (error) {
      addLog(`Error accepting friend request: ${error.message}`, 'error');
    }
  };
  
  // Handle decline friend request
  const handleDeclineRequest = async (requestId) => {
    try {
      addLog(`Declining friend request ID: ${requestId}`, 'info');
      
      const result = await declineFriendRequest(requestId);
      
      if (result.success) {
        addLog(result.message, 'success');
        notification.addNotification(result.message, 'success');
      } else {
        addLog(`Failed: ${result.error}`, 'error');
        notification.addNotification(result.error, 'error');
      }
    } catch (error) {
      addLog(`Error declining friend request: ${error.message}`, 'error');
    }
  };
  
  // Handle cancel friend request
  const handleCancelRequest = async (requestId) => {
    try {
      addLog(`Cancelling friend request ID: ${requestId}`, 'info');
      
      const result = await cancelFriendRequest(requestId);
      
      if (result.success) {
        addLog(result.message, 'success');
        notification.addNotification(result.message, 'success');
      } else {
        addLog(`Failed: ${result.error}`, 'error');
        notification.addNotification(result.error, 'error');
      }
    } catch (error) {
      addLog(`Error cancelling friend request: ${error.message}`, 'error');
    }
  };
  
  // Handle remove friend
  const handleRemoveFriend = async (friendId) => {
    try {
      addLog(`Removing friend with ID: ${friendId}`, 'info');
      
      const result = await removeFriend(friendId);
      
      if (result.success) {
        addLog(result.message, 'success');
        notification.addNotification(result.message, 'success');
      } else {
        addLog(`Failed: ${result.error}`, 'error');
        notification.addNotification(result.error, 'error');
      }
    } catch (error) {
      addLog(`Error removing friend: ${error.message}`, 'error');
    }
  };
  
  // Check friendship document
  const checkFriendship = async () => {
    if (!friendId.trim() || !currentUser) {
      addLog('Please enter a valid friend ID', 'warning');
      return;
    }
    
    try {
      addLog(`Checking friendship between ${currentUser.uid} and ${friendId}`, 'info');
      
      // Generate friendship ID the same way the system does
      const friendshipId = [currentUser.uid, friendId].sort().join('_');
      addLog(`Generated friendship ID: ${friendshipId}`, 'info');
      
      try {
        // Check friendship document
        const friendshipRef = doc(db, 'friendships', friendshipId);
        const friendshipDoc = await getDoc(friendshipRef);
        
        if (friendshipDoc.exists()) {
          const data = friendshipDoc.data();
          setFriendshipData(data);
          addLog(`Friendship document found: ${JSON.stringify(data)}`, 'success');
        } else {
          setFriendshipData(null);
          addLog('No friendship document found', 'warning');
        }
      } catch (error) {
        if (error.code === 'permission-denied') {
          addLog('Permission denied accessing friendship document. Security rules may need updating.', 'error');
          addLog('Make sure the Firestore rules allow access to friendships collection.', 'info');
        } else {
          addLog(`Error accessing friendship document: ${error.message}`, 'error');
        }
      }
      
      try {
        // Check current user's friends document
        const userFriendsRef = doc(db, 'friends', currentUser.uid);
        const userFriendsDoc = await getDoc(userFriendsRef);
        
        if (userFriendsDoc.exists()) {
          const data = userFriendsDoc.data();
          setFriendDocData(data);
          addLog(`User's friends document: ${JSON.stringify(data)}`, 'info');
          
          if (data.friendIds && data.friendIds.includes(friendId)) {
            addLog(`Friend ID ${friendId} found in user's friend list`, 'success');
          } else {
            addLog(`Friend ID ${friendId} NOT found in user's friend list`, 'warning');
          }
        } else {
          setFriendDocData(null);
          addLog('User has no friends document', 'warning');
        }
      } catch (error) {
        if (error.code === 'permission-denied') {
          addLog('Permission denied accessing user\'s friends document. Security rules may need updating.', 'error');
        } else {
          addLog(`Error accessing user's friends document: ${error.message}`, 'error');
        }
      }
      
      try {
        // Check friend's friends document
        const friendFriendsRef = doc(db, 'friends', friendId);
        const friendFriendsDoc = await getDoc(friendFriendsRef);
        
        if (friendFriendsDoc.exists()) {
          const data = friendFriendsDoc.data();
          addLog(`Friend's friends document: ${JSON.stringify(data)}`, 'info');
          
          if (data.friendIds && data.friendIds.includes(currentUser.uid)) {
            addLog(`Current user ID found in friend's friend list`, 'success');
          } else {
            addLog(`Current user ID NOT found in friend's friend list`, 'warning');
          }
        } else {
          addLog('Friend has no friends document', 'warning');
        }
      } catch (error) {
        if (error.code === 'permission-denied') {
          addLog('Permission denied accessing friend\'s friends document. This is expected since you can only access your own friends document.', 'warning');
        } else {
          addLog(`Error accessing friend's friends document: ${error.message}`, 'error');
        }
      }
      
      try {
        // Check for any pending friend requests
        const sentRequestQuery = query(
          collection(db, 'friend_requests'),
          where('senderId', '==', currentUser.uid),
          where('recipientId', '==', friendId),
          where('status', '==', 'pending')
        );
        
        const receivedRequestQuery = query(
          collection(db, 'friend_requests'),
          where('senderId', '==', friendId),
          where('recipientId', '==', currentUser.uid),
          where('status', '==', 'pending')
        );
        
        const [sentResults, receivedResults] = await Promise.all([
          getDocs(sentRequestQuery),
          getDocs(receivedRequestQuery)
        ]);
        
        if (!sentResults.empty) {
          addLog('You have a pending friend request to this user', 'info');
          sentResults.forEach(doc => {
            addLog(`Request ID: ${doc.id}, Created: ${doc.data().createdAt?.toDate().toLocaleString()}`, 'info');
          });
        }
        
        if (!receivedResults.empty) {
          addLog('You have a pending friend request from this user', 'info');
          receivedResults.forEach(doc => {
            addLog(`Request ID: ${doc.id}, Created: ${doc.data().createdAt?.toDate().toLocaleString()}`, 'info');
          });
        }
      } catch (error) {
        if (error.code === 'permission-denied') {
          addLog('Permission denied accessing friend requests. Security rules may need updating.', 'error');
        } else {
          addLog(`Error checking friend requests: ${error.message}`, 'error');
        }
      }
      
    } catch (error) {
      addLog(`Error checking friendship: ${error.message}`, 'error');
      
      if (error.code === 'permission-denied') {
        addLog('This is likely a security rules issue. Make sure the Firestore rules allow access to the necessary collections.', 'info');
      }
    }
  };
  
  // Fix friendship inconsistencies
  const handleFixFriendship = async () => {
    if (!friendId.trim() || !currentUser) {
      addLog('Please enter a valid friend ID', 'warning');
      return;
    }
    
    try {
      addLog(`Attempting to fix friendship between ${currentUser.uid} and ${friendId}...`, 'info');
      
      const result = await fixFriendship(friendId);
      
      if (result.success) {
        addLog(result.message, 'success');
        notification.addNotification(result.message, 'success');
      } else {
        addLog(`Failed: ${result.error}`, 'error');
        notification.addNotification(result.error, 'error');
      }
      
      // Refresh the friendship status
      await checkFriendship();
      
    } catch (error) {
      addLog(`Error fixing friendship: ${error.message}`, 'error');
    }
  };
  
  // Fix all friendships
  const handleFixAllFriendships = async () => {
    if (!currentUser || friends.length === 0) {
      addLog('No friends to fix', 'warning');
      return;
    }
    
    setIsFixingAll(true);
    setFixAllResults({ success: 0, failed: 0, total: friends.length });
    
    try {
      addLog(`Starting to fix all ${friends.length} friendships...`, 'info');
      
      let successCount = 0;
      let failedCount = 0;
      
      for (const friend of friends) {
        try {
          addLog(`Fixing friendship with ${friend.displayName} (${friend.id})...`, 'info');
          
          // First ensure friendship document exists
          const friendshipFixed = await ensureFriendshipDocumentExists(friend.id);
          
          if (friendshipFixed) {
            addLog(`Fixed friendship document with ${friend.displayName}`, 'success');
          } else {
            addLog(`Friendship document with ${friend.displayName} already exists and is active`, 'info');
          }
          
          // Now check if the friend is in the user's friends list
          const userFriendsRef = doc(db, 'friends', currentUser.uid);
          const userFriendsDoc = await getDoc(userFriendsRef);
          
          if (!userFriendsDoc.exists()) {
            await setDoc(userFriendsRef, { friendIds: [friend.id] });
            addLog(`Created missing friends document with ${friend.id}`, 'success');
          } else {
            const userData = userFriendsDoc.data();
            if (!userData.friendIds || !userData.friendIds.includes(friend.id)) {
              await updateDoc(userFriendsRef, {
                friendIds: arrayUnion(friend.id)
              });
              addLog(`Added ${friend.id} to user's friends list`, 'success');
            }
          }
          
          successCount++;
          setFixAllResults(prev => ({ ...prev, success: successCount }));
        } catch (error) {
          addLog(`Error fixing friendship with ${friend.displayName}: ${error.message}`, 'error');
          failedCount++;
          setFixAllResults(prev => ({ ...prev, failed: failedCount }));
        }
      }
      
      addLog(`Finished fixing friendships. Success: ${successCount}, Failed: ${failedCount}`, 
        successCount === friends.length ? 'success' : 'warning');
      
      // Refresh friends data
      await refreshFriends();
      
    } catch (error) {
      addLog(`Error during fix all operation: ${error.message}`, 'error');
    } finally {
      setIsFixingAll(false);
    }
  };
  
  // Create missing friends document
  const createFriendsDocument = async () => {
    if (!currentUser) {
      addLog('You must be logged in to create a friends document', 'warning');
      return;
    }
    
    try {
      addLog('Checking for friends document...', 'info');
      
      const userFriendsRef = doc(db, 'friends', currentUser.uid);
      const userFriendsDoc = await getDoc(userFriendsRef);
      
      if (!userFriendsDoc.exists()) {
        // Create the document with an empty array
        await setDoc(userFriendsRef, { friendIds: [] });
        addLog('Created missing friends document with empty friends list', 'success');
      } else {
        addLog('Friends document already exists', 'info');
        
        // Check if friendIds array exists
        const data = userFriendsDoc.data();
        if (!data.friendIds) {
          await updateDoc(userFriendsRef, { friendIds: [] });
          addLog('Added missing friendIds array to existing document', 'success');
        }
      }
      
      // Refresh friends data
      await refreshFriends();
      
    } catch (error) {
      addLog(`Error creating friends document: ${error.message}`, 'error');
    }
  };
  
  // Manual refresh
  const handleRefresh = async () => {
    try {
      addLog('Manually refreshing friends data...', 'info');
      await refreshFriends();
      addLog('Friends data refreshed successfully', 'success');
    } catch (error) {
      addLog(`Error refreshing friends data: ${error.message}`, 'error');
    }
  };
  
  // Sync friendships
  const handleSyncFriendships = async () => {
    if (!currentUser) {
      addLog('You must be logged in to sync friendships', 'warning');
      return;
    }
    
    try {
      addLog('Syncing friendships from friendship documents...', 'info');
      
      const result = await syncFriendships();
      
      if (result.success) {
        if (result.addedCount > 0) {
          addLog(`Successfully added ${result.addedCount} missing friends to your friends list`, 'success');
        } else {
          addLog('No missing friends found, your friends list is in sync', 'success');
        }
      } else {
        addLog(`Error syncing friendships: ${result.error}`, 'error');
      }
      
    } catch (error) {
      addLog(`Error syncing friendships: ${error.message}`, 'error');
    }
  };
  
  // Handle check friendship for a specific friend
  const handleCheckFriendship = (friendId) => {
    setFriendId(friendId);
    // Use setTimeout to ensure the state is updated before checking
    setTimeout(() => {
      checkFriendship();
    }, 0);
  };
  
  // Initial log
  useEffect(() => {
    if (currentUser) {
      addLog(`Logged in as ${currentUser.displayName || currentUser.email} (${currentUser.uid})`, 'info');
      addLog(`You have ${friends.length} friends, ${friendRequests.length} incoming requests, and ${sentRequests.length} sent requests`, 'info');
    } else {
      addLog('Please log in to use the friend system tester', 'warning');
    }
  }, [currentUser, friends, friendRequests, sentRequests]);
  
  if (!currentUser) {
    return (
      <Container>
        <Title>Friend System Tester</Title>
        <p>Please log in to use this tool.</p>
      </Container>
    );
  }
  
  return (
    <Container>
      <Title>Friend System Tester</Title>
      
      <Section>
        <SectionTitle>Debug Log</SectionTitle>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <Button onClick={handleRefresh}>Refresh Friends Data</Button>
          <Button onClick={createFriendsDocument}>Create Friends Document</Button>
        </div>
        <LogContainer>
          {logs.map((log, index) => (
            <LogEntry key={index} className={log.type}>
              [{log.timestamp}] {log.message}
            </LogEntry>
          ))}
        </LogContainer>
      </Section>
      
      <Section>
        <SectionTitle>Fix All Friendships</SectionTitle>
        <p>This will check and fix all friendship documents for your current friends.</p>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
          <Button 
            onClick={handleFixAllFriendships} 
            disabled={isFixingAll || friends.length === 0}
          >
            {isFixingAll ? 'Fixing...' : 'Fix All Friendships'}
          </Button>
          {isFixingAll && (
            <span>
              Progress: {fixAllResults.success + fixAllResults.failed}/{fixAllResults.total}
            </span>
          )}
        </div>
        {fixAllResults.success > 0 || fixAllResults.failed > 0 ? (
          <div>
            <p>Results: {fixAllResults.success} successful, {fixAllResults.failed} failed</p>
          </div>
        ) : null}
      </Section>
      
      <Section>
        <SectionTitle>Check Friendship Status</SectionTitle>
        <InputGroup>
          <Input 
            type="text" 
            placeholder="Enter friend's user ID" 
            value={friendId}
            onChange={(e) => setFriendId(e.target.value)}
          />
          <Button onClick={checkFriendship}>Check</Button>
          <Button onClick={handleFixFriendship}>Fix Friendship</Button>
        </InputGroup>
        
        {friendshipData && (
          <div>
            <p>Friendship Status: {friendshipData.status}</p>
            <p>Created: {friendshipData.createdAt?.toDate().toLocaleString()}</p>
            <p>Updated: {friendshipData.updatedAt?.toDate().toLocaleString()}</p>
          </div>
        )}
      </Section>
      
      <Section>
        <SectionTitle>Search Users</SectionTitle>
        <InputGroup>
          <Input 
            type="text" 
            placeholder="Search by Epic username or display name" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button onClick={handleSearch} disabled={isSearching}>
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </InputGroup>
        
        {searchResults.length > 0 && (
          <UserList>
            {searchResults.map(user => (
              <UserItem key={user.id}>
                <UserInfo>
                  <UserAvatar $photoURL={user.photoURL}>
                    {!user.photoURL && user.displayName?.charAt(0)}
                  </UserAvatar>
                  <div>
                    <div>{user.displayName}</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                      {user.epicUsername}
                    </div>
                  </div>
                </UserInfo>
                <Button onClick={() => handleSendRequest(user.id)}>
                  Add Friend
                </Button>
              </UserItem>
            ))}
          </UserList>
        )}
      </Section>
      
      <Section>
        <SectionTitle>Friend Requests ({friendRequests.length})</SectionTitle>
        {friendRequests.length === 0 ? (
          <p>No pending friend requests</p>
        ) : (
          <UserList>
            {friendRequests.map(request => (
              <UserItem key={request.id}>
                <UserInfo>
                  <UserAvatar $photoURL={request.senderPhoto}>
                    {!request.senderPhoto && request.senderName?.charAt(0)}
                  </UserAvatar>
                  <div>
                    <div>{request.senderName}</div>
                    {request.epicUsername && (
                      <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                        {request.epicUsername}
                      </div>
                    )}
                  </div>
                </UserInfo>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Button onClick={() => handleAcceptRequest(request.id)}>
                    Accept
                  </Button>
                  <Button onClick={() => handleDeclineRequest(request.id)}>
                    Decline
                  </Button>
                </div>
              </UserItem>
            ))}
          </UserList>
        )}
      </Section>
      
      <Section>
        <SectionTitle>Sent Requests ({sentRequests.length})</SectionTitle>
        {sentRequests.length === 0 ? (
          <p>No sent friend requests</p>
        ) : (
          <UserList>
            {sentRequests.map(request => (
              <UserItem key={request.id}>
                <UserInfo>
                  <UserAvatar $photoURL={request.recipientPhoto}>
                    {!request.recipientPhoto && request.recipientName?.charAt(0)}
                  </UserAvatar>
                  <div>
                    <div>{request.recipientName}</div>
                    {request.epicUsername && (
                      <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                        {request.epicUsername}
                      </div>
                    )}
                  </div>
                </UserInfo>
                <Button onClick={() => handleCancelRequest(request.id)}>
                  Cancel
                </Button>
              </UserItem>
            ))}
          </UserList>
        )}
      </Section>
      
      <Section>
        <SectionTitle>Friends ({friends.length})</SectionTitle>
        {friends.length === 0 ? (
          <p>No friends yet</p>
        ) : (
          <UserList>
            {friends.map(friend => (
              <UserItem key={friend.id}>
                <UserInfo>
                  <UserAvatar $photoURL={friend.photoURL}>
                    {!friend.photoURL && friend.displayName?.charAt(0)}
                  </UserAvatar>
                  <div>
                    <div>{friend.displayName}</div>
                    {friend.epicUsername && (
                      <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                        {friend.epicUsername}
                      </div>
                    )}
                  </div>
                </UserInfo>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Button onClick={() => handleCheckFriendship(friend.id)}>
                    Check
                  </Button>
                  <Button onClick={() => handleRemoveFriend(friend.id)}>
                    Remove
                  </Button>
                </div>
              </UserItem>
            ))}
          </UserList>
        )}
      </Section>
    </Container>
  );
};

export default FriendsTester; 