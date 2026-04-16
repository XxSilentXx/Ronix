import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useFriends } from '../contexts/FriendsContext';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import TipUserModalRedesigned from './TipUserModalRedesigned';
import { getFirestore, getDoc, doc } from 'firebase/firestore';
import { useNotification } from '../contexts/NotificationContext';
import RankBadge from './RankBadge';
import { getAvatarUrl } from '../utils/avatarUtils';
import { FaSearch, FaTimes, FaUserFriends } from 'react-icons/fa';

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

const UserDetails = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const UserAvatar = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const Button = styled.button`
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
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

const ActionButton = styled.button`
  background: ${props => props.$danger ? 'rgba(255, 71, 87, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.$danger ? '#ff4757' : '#fff'};
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
  font-weight: 600;
  
  &:hover {
    background: ${props => props.$danger ? 'rgba(255, 71, 87, 0.3)' : 'rgba(255, 255, 255, 0.2)'};
    transform: translateY(-2px);
  }
`;

const TipButton = styled(Button)`
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  display: flex;
  align-items: center;
  gap: 5px;
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

const ProfileLink = styled(Link)`
  color: #4facfe;
  text-decoration: none;
  font-weight: 600;
  
  &:hover {
    text-decoration: underline;
  }
`;

const SearchBarWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 18px;
`;

const SearchIcon = styled(FaSearch)`
  position: absolute;
  left: 14px;
  color: #4facfe;
  font-size: 1.1rem;
  pointer-events: none;
`;

const ClearButton = styled.button`
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: #ff61e6;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 50%;
  transition: background 0.15s;
  &:hover {
    background: rgba(255, 97, 230, 0.08);
  }
`;

const Divider = styled.div`
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, #23234a 0%, #4facfe 100%);
  margin: 18px 0 24px 0;
  border-radius: 2px;
`;

const FloatingFriendsButton = styled.button`
  position: fixed;
  bottom: 32px;
  right: 32px;
  z-index: 1000;
  background: linear-gradient(90deg, #4facfe 0%, #ff61e6 100%);
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  box-shadow: 0 8px 32px #4facfe55;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s;
  &:hover {
    box-shadow: 0 12px 40px #ff61e6aa;
    transform: scale(1.07);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 20px;
  color: rgba(255, 255, 255, 0.5);
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 1rem;
  background: rgba(36, 38, 58, 0.95);
  border: 2px solid #23234a;
  border-radius: 8px;
  color: #fff;
  font-size: 1.1rem;
  height: 44px;
  transition: border 0.2s;
  box-sizing: border-box;
  outline: none;
  &::placeholder {
    color: #4facfe99;
    opacity: 1;
  }
  &:focus {
    border-color: #4facfe;
  }
`;

// Helper function to force reload images breaking cache
const forceReloadImages = (selector) => {
  const images = document.querySelectorAll(selector);
  console.log(`Attempting to force reload ${images.length} images with selector: ${selector}`);
  
  if (images.length === 0) return;
  
  const timestamp = Date.now();
  
  images.forEach((img, index) => {
    try {
      // Store the original source
      const originalSrc = img.src;
      
      // Create a new Image object to force reload from server
      const newImg = new Image();
      
      // Set up load handlers for the new image
      newImg.onload = () => {
        console.log(`Force reload success [${index}]: ${newImg.src}`);
        // Replace the original image source with the reloaded one
        img.src = newImg.src;
      };
      
      newImg.onerror = (err) => {
        console.error(`Force reload failed [${index}]:`, err);
      };
      
      // Add cache-busting parameter and load the new image
      const baseUrl = originalSrc.split('?')[0];
      const newSrc = `${baseUrl}?forceReload=${timestamp}`;
      console.log(`Attempting force reload [${index}]: ${originalSrc} → ${newSrc}`);
      
      // Start loading the new image
      newImg.src = newSrc;
      
      // For immediate feedback, also update the original image
      img.src = newSrc;
    } catch (error) {
      console.error(`Error during force reload of image [${index}]:`, error);
    }
  });
};

const FriendsList = () => {
  const { currentUser } = useAuth();
  const { 
    friends, 
    friendRequests, 
    sentRequests,
    refreshFriends,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    removeFriend,
    searchUsersByEpicName,
    sendFriendRequest,
    syncFriendships
  } = useFriends();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState(null);
  
  const notification = useNotification();
  
  // Function to fetch user data including Discord avatar
  const fetchUserWithAvatar = async (userId) => {
    try {
      const db = getFirestore();
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Use the universal utility to get the avatar URL
        const avatarUrl = getAvatarUrl(userData);
        return {
          ...userData,
          photoURL: avatarUrl
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };
  
  // Handle search
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const results = await searchUsersByEpicName(searchTerm);
      
      // Update results with Discord avatars
      const enhancedResults = await Promise.all(
        results.map(async (user) => {
          const userData = await fetchUserWithAvatar(user.id);
          return {
            ...user,
            photoURL: userData?.photoURL || user.photoURL
          };
        })
      );
      
      setSearchResults(enhancedResults);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      console.log("Refreshing friends list with timestamp:", Date.now());
      await refreshFriends();
      
      // Extra step: Apply cache busting to avatars
      const timestamp = Date.now();
      if (friends && friends.length > 0) {
        friends.forEach(friend => {
          if (friend.photoURL && friend.photoURL.includes('discordapp.com')) {
            // Add timestamp to Discord avatar URLs
            friend.photoURL = `${friend.photoURL.split('?')[0]}?t=${timestamp}`;
          }
        });
      }
    } finally {
      setRefreshing(false);
    }
  };

  // Handle sync friendships
  const handleSyncFriendships = async () => {
    setSyncing(true);
    try {
      console.log("Syncing friendships...");
      const result = await syncFriendships();
      console.log("Sync result:", result);
      
      if (result.success) {
        if (result.addedCount > 0) {
          alert(`Added ${result.addedCount} missing friends to your friends list`);
        } else {
          alert('Your friends list is already in sync');
        }
      } else {
        alert(`Error syncing friendships: ${result.error}`);
      }
    } catch (error) {
      console.error("Error syncing friendships:", error);
      alert(`Error syncing friendships: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };
  
  // Handle send friend request
  const handleSendRequest = async (userId) => {
    try {
      await sendFriendRequest(userId);
      // Clear search results after sending request
      setSearchResults([]);
      setSearchTerm('');
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };
  
  // Handle accept friend request
  const handleAcceptRequest = async (requestId) => {
    try {
      setRefreshing(true); // Show loading state
      
      // Call the acceptFriendRequest function
      const result = await acceptFriendRequest(requestId);
      
      if (result.success) {
        // Force refresh the friends list to show the new friend
        await Promise.all([
          handleRefresh(), // Refresh the entire friends list
        ]);
        
        // Provide feedback to the user
        notification.addNotification('Friend request accepted!', 'success');
      } else {
        // Show error message if the operation failed
        alert(`Failed to accept friend request: ${result.error}`);
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert(`Error accepting friend request: ${error.message}`);
    } finally {
      setRefreshing(false); // Hide loading state
    }
  };
  
  // Handle decline friend request
  const handleDeclineRequest = async (requestId) => {
    try {
      setRefreshing(true); // Show loading state
      
      // Call the declineFriendRequest function
      const result = await declineFriendRequest(requestId);
      
      if (result.success) {
        // Force refresh the friends list
        await handleRefresh();
        
        // Provide feedback to the user
        alert("Friend request declined.");
      } else {
        // Show error message if the operation failed
        alert(`Failed to decline friend request: ${result.error}`);
      }
    } catch (error) {
      console.error('Error declining friend request:', error);
      alert(`Error declining friend request: ${error.message}`);
    } finally {
      setRefreshing(false); // Hide loading state
    }
  };
  
  // Handle cancel friend request
  const handleCancelRequest = async (requestId) => {
    try {
      await cancelFriendRequest(requestId);
    } catch (error) {
      console.error('Error cancelling friend request:', error);
    }
  };
  
  // Handle remove friend
  const handleRemoveFriend = async (friendId) => {
    if (window.confirm('Are you sure you want to remove this friend?')) {
      try {
        await removeFriend(friendId);
      } catch (error) {
        console.error('Error removing friend:', error);
      }
    }
  };
  
  // Handle open tip modal
  const handleOpenTipModal = (friendId) => {
    setSelectedFriendId(friendId);
    setIsTipModalOpen(true);
  };
  
  // Handle close tip modal
  const handleCloseTipModal = () => {
    setIsTipModalOpen(false);
    setSelectedFriendId(null);
  };
  
  // Perform search when search term changes
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchTerm) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 500);
    
    return () => clearTimeout(delaySearch);
  }, [searchTerm]);
  
  // Initial load
  useEffect(() => {
    if (currentUser) {
      // Force a refresh of friends data
      const refreshWithTimestamp = async () => {
        console.log("Refreshing friends with timestamp:", Date.now());
        await handleRefresh();
        
        // Force reload all Discord avatar images by adding a fresh cache-busting timestamp
        setTimeout(() => {
          try {
            console.log("Auto-refreshing Discord avatars on component mount");
            const now = Date.now();
            const discordImages = document.querySelectorAll('img[src*="discord"]');
            
            console.log(`Found ${discordImages.length} Discord images to auto-refresh`);
            
            discordImages.forEach(img => {
              // Store original src for logging
              const oldSrc = img.src;
              
              // Handle URL with or without query parameters
              const baseUrl = img.src.split('?')[0];
              img.src = `${baseUrl}?t=${now}`;
              
              console.log(`Auto-refreshed: ${oldSrc} → ${img.src}`);
              
              // Force browser to reload the image by setting onload and onerror
              img.onload = () => console.log(`Successfully loaded: ${img.src}`);
              img.onerror = () => console.error(`Failed to load: ${img.src}`);
            });
            
            if (discordImages.length === 0) {
              console.log("No Discord images found to auto-refresh. Trying alternative selectors...");
              // Try with a more generic selector - all avatar images
              const avatarImages = document.querySelectorAll('.UserAvatar img');
              console.log(`Found ${avatarImages.length} avatar images`);
              
              avatarImages.forEach(img => {
                const oldSrc = img.src;
                const baseUrl = img.src.split('?')[0];
                img.src = `${baseUrl}?t=${now}`;
                console.log(`Auto-refreshed avatar: ${oldSrc} → ${img.src}`);
              });
            }
          } catch (error) {
            console.error("Error auto-refreshing avatars:", error);
          }
        }, 1000); // Increased timeout to ensure images are loaded
      };
      
      refreshWithTimestamp();
    }
  }, [currentUser]);
  
  if (!currentUser) {
    return (
      <Container>
        <Title>Friends</Title>
        <p>Please log in to view your friends.</p>
      </Container>
    );
  }
  
  return (
    <>
      {/* Floating quick-access button (stub for future sidebar/dropdown) */}
      {/* <FloatingFriendsButton title="Quick Friends Access (coming soon)">
        <FaUserFriends />
      </FloatingFriendsButton> */}
      <Container>
        <Title>Friends</Title>
        <Section>
          <SectionTitle>Find Friends</SectionTitle>
          <SearchBarWrapper>
            <SearchIcon />
            <Input
              type="text"
              placeholder="Epic username or display name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.2rem', paddingRight: searchTerm ? '2.2rem' : '1rem', fontSize: '1.1rem', height: '44px', border: '2px solid #23234a', background: 'rgba(36, 38, 58, 0.95)' }}
              aria-label="Search for friends by Epic username or display name"
              autoComplete="off"
            />
            {searchTerm && (
              <ClearButton onClick={() => setSearchTerm('')} aria-label="Clear search">
                <FaTimes />
              </ClearButton>
            )}
          </SearchBarWrapper>
          {/* Divider between search and results */}
          <Divider />
          {searchResults.length > 0 && (
            <UserList>
              {searchResults.map(user => (
                <UserItem key={user.id}>
                  <UserInfo>
                    <UserAvatar>
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName} />
                      ) : (
                        user.displayName?.charAt(0)
                      )}
                    </UserAvatar>
                    <div>
                      <UserDetails>
                        <div>{user.displayName}</div>
                        <RankBadge userId={user.id} size={18} marginLeft="0.25rem" />
                      </UserDetails>
                      <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                        {user.epicUsername}
                      </div>
                    </div>
                  </UserInfo>
                  <Button onClick={() => handleSendRequest(user.id)} disabled={isSearching}>
                    Add Friend
                  </Button>
                </UserItem>
              ))}
            </UserList>
          )}
          
          {searchTerm && searchResults.length === 0 && !isSearching && (
            <EmptyState>No users found matching "{searchTerm}"</EmptyState>
          )}
        </Section>
        
        {friendRequests.length > 0 && (
          <Section>
            <SectionTitle>Friend Requests ({friendRequests.length})</SectionTitle>
            <UserList>
              {friendRequests.map(request => (
                <UserItem key={request.id}>
                  <UserInfo>
                    <UserAvatar>
                      {request.senderPhoto ? (
                        <img src={request.senderPhoto} alt={request.senderName} />
                      ) : (
                        request.senderName?.charAt(0)
                      )}
                    </UserAvatar>
                    <div>
                      <UserDetails>
                        <div>{request.senderName}</div>
                        <RankBadge userId={request.senderId} size={18} marginLeft="0.25rem" />
                      </UserDetails>
                      {request.epicUsername && (
                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                          {request.epicUsername}
                        </div>
                      )}
                    </div>
                  </UserInfo>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <Button 
                      onClick={() => handleAcceptRequest(request.id)} 
                      disabled={refreshing}
                    >
                      {refreshing ? 'Processing...' : 'Accept'}
                    </Button>
                    <ActionButton 
                      $danger 
                      onClick={() => handleDeclineRequest(request.id)}
                      disabled={refreshing}
                    >
                      {refreshing ? 'Processing...' : 'Decline'}
                    </ActionButton>
                  </div>
                </UserItem>
              ))}
            </UserList>
          </Section>
        )}
        
        {sentRequests.length > 0 && (
          <Section>
            <SectionTitle>Sent Requests ({sentRequests.length})</SectionTitle>
            <UserList>
              {sentRequests.map(request => (
                <UserItem key={request.id}>
                  <UserInfo>
                    <UserAvatar>
                      {request.recipientPhoto ? (
                        <img src={request.recipientPhoto} alt={request.recipientName} />
                      ) : (
                        request.recipientName?.charAt(0)
                      )}
                    </UserAvatar>
                    <div>
                      <UserDetails>
                        <div>{request.recipientName}</div>
                        <RankBadge userId={request.recipientId} size={18} marginLeft="0.25rem" />
                      </UserDetails>
                      {request.epicUsername && (
                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                          {request.epicUsername}
                        </div>
                      )}
                    </div>
                  </UserInfo>
                  <ActionButton $danger onClick={() => handleCancelRequest(request.id)}>
                    Cancel
                  </ActionButton>
                </UserItem>
              ))}
            </UserList>
          </Section>
        )}
        
        <Section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <SectionTitle style={{ margin: 0 }}>My Friends ({friends.length})</SectionTitle>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>
          
          {friends.length === 0 ? (
            <EmptyState>
              You don't have any friends yet. Search for users to add them as friends.
            </EmptyState>
          ) : (
            <UserList>
              {friends.map(friend => (
                <UserItem key={friend.id}>
                  <UserInfo>
                    <UserAvatar>
                      {getAvatarUrl(friend) ? (
                        <img src={getAvatarUrl(friend)} alt={friend.displayName} />
                      ) : (
                        friend.displayName?.charAt(0)
                      )}
                    </UserAvatar>
                    <div>
                      <UserDetails>
                        <ProfileLink to={`/user/${friend.id}`}>
                          {friend.displayName}
                        </ProfileLink>
                        <RankBadge userId={friend.id} size={18} marginLeft="0.25rem" />
                      </UserDetails>
                      {friend.epicUsername && (
                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                          {friend.epicUsername}
                        </div>
                      )}
                    </div>
                  </UserInfo>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <TipButton onClick={() => handleOpenTipModal(friend.id)}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
                      </svg>
                      Tip
                    </TipButton>
                    <ActionButton $danger onClick={() => handleRemoveFriend(friend.id)}>
                      Remove
                    </ActionButton>
                  </div>
                </UserItem>
              ))}
            </UserList>
          )}
        </Section>
        
        <TipUserModalRedesigned
          isOpen={isTipModalOpen}
          onClose={handleCloseTipModal}
          preSelectedUserId={selectedFriendId}
        />
      </Container>
    </>
  );
};

export default FriendsList; 