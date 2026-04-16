import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParty } from '../contexts/PartyContext';
import { Link } from 'react-router-dom';
import RankBadge from './RankBadge';
import { getAvatarUrl } from '../utils/avatarUtils';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 15px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 15px rgba(79, 172, 254, 0.3);
  border: 1px solid rgba(79, 172, 254, 0.2);
  padding: 1.5rem;
  position: relative;
  z-index: 1001;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  
  h2 {
    color: #fff;
    margin: 0;
    font-size: 1.8rem;
    font-weight: 700;
    text-transform: uppercase;
    background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: 1px;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #b8c1ec;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    color: #fff;
    transform: scale(1.1);
  }
`;

const SearchInput = styled.input`
  width: 100%;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  padding: 0.9rem 1.2rem;
  color: #fff;
  font-size: 1rem;
  margin-bottom: 1.2rem;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #4facfe;
    box-shadow: 0 0 10px rgba(79, 172, 254, 0.3);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const FriendsList = styled.div`
  max-height: 50vh;
  overflow-y: auto;
  
  /* Scrollbar styling */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    
    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }
`;

const FriendItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.8rem 1rem;
  background: rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  margin-bottom: 0.8rem;
  transition: all 0.2s ease;
  border: 1px solid rgba(255, 255, 255, 0.05);
  
  &:hover {
    background: rgba(255, 255, 255, 0.12);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  .friend-info {
    display: flex;
    align-items: center;
    flex-grow: 1;
    max-width: 70%;
    
    .avatar {
      width: 40px;
      height: 40px;
      min-width: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      margin-right: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 16px;
      color: white;
      overflow: hidden;
      border: 2px solid rgba(255, 255, 255, 0.2);
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }
    
    .friend-text {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    
    .name {
      font-weight: 600;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .epic-username {
      font-size: 0.8rem;
      color: #b8c1ec;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
`;

const InviteButton = styled.button`
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  opacity: ${props => props.disabled ? 0.7 : 1};
  min-width: 90px;
  text-transform: uppercase;
  font-size: 0.85rem;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    transform: ${props => props.disabled ? 'none' : 'translateY(-2px)'};
    box-shadow: ${props => props.disabled ? 'none' : '0 5px 15px rgba(0, 242, 254, 0.3)'};
  }
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 2rem 1rem;
  color: #b8c1ec;
  
  p {
    margin-bottom: 1rem;
  }
`;

const FriendLink = styled(Link)`
  display: inline-block;
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
  text-decoration: none;
  padding: 0.8rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  margin-top: 1rem;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 20px rgba(0, 242, 254, 0.3);
  }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s linear infinite;
  margin-right: 8px;
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const InviteFriendsModal = ({ onClose }) => {
  const { getFriendsToInvite, inviteToParty } = useParty();
  const [friends, setFriends] = useState([]);
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState({});
  
  // Fetch friends when component mounts
  useEffect(() => {
    const loadFriends = async () => {
      try {
        const friendsList = await getFriendsToInvite();
        setFriends(friendsList);
        setFilteredFriends(friendsList);
        setLoading(false);
      } catch (err) {
        console.error('Error loading friends:', err);
        setLoading(false);
      }
    };
    
    loadFriends();
  }, [getFriendsToInvite]);
  
  // Filter friends based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredFriends(friends);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = friends.filter(friend => 
      friend.displayName.toLowerCase().includes(term) ||
      (friend.epicUsername && friend.epicUsername.toLowerCase().includes(term))
    );
    
    setFilteredFriends(filtered);
  }, [searchTerm, friends]);
  
  const handleInvite = async (friendId) => {
    try {
      setInviting(prev => ({ ...prev, [friendId]: true }));
      await inviteToParty(friendId);
      
      // Keep the invitation status for visual feedback
      setTimeout(() => {
        setInviting(prev => ({ ...prev, [friendId]: false }));
      }, 2000);
    } catch (err) {
      console.error('Error inviting friend:', err);
      setInviting(prev => ({ ...prev, [friendId]: false }));
    }
  };
  
  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <h2>Invite Friends</h2>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </ModalHeader>
        
        <SearchInput
          type="text"
          placeholder="Search friends..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <LoadingSpinner /> Loading friends...
          </div>
        ) : (
          <FriendsList>
            {filteredFriends.length > 0 ? (
              filteredFriends.map(friend => (
                <FriendItem key={friend.id}>
                  <div className="friend-info">
                    <div className="avatar">
                      {(() => {
                        const avatarUrl = getAvatarUrl(friend);
                        return avatarUrl ? (
                          <img src={avatarUrl} alt={friend.displayName} />
                        ) : (
                          friend.displayName.charAt(0).toUpperCase()
                        );
                      })()}
                    </div>
                    <div className="friend-text">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span className="name">{friend.displayName}</span>
                        <RankBadge userId={friend.id} size={18} marginLeft="0" />
                      </div>
                      {friend.epicUsername && (
                        <span className="epic-username">({friend.epicUsername})</span>
                      )}
                    </div>
                  </div>
                  
                  <InviteButton 
                    onClick={() => handleInvite(friend.id)}
                    disabled={inviting[friend.id]}
                  >
                    {inviting[friend.id] ? (
                      <>
                        <LoadingSpinner /> Inviting...
                      </>
                    ) : (
                      'Invite'
                    )}
                  </InviteButton>
                </FriendItem>
              ))
            ) : (
              <EmptyMessage>
                {searchTerm ? (
                  <p>No friends match your search</p>
                ) : (
                  <>
                    <p>You don't have any friends to invite yet.</p>
                    <p>Add friends by searching for their Epic Games username in the Friends tab.</p>
                    <FriendLink to="/friends" onClick={onClose}>Go to Friends</FriendLink>
                  </>
                )}
              </EmptyMessage>
            )}
          </FriendsList>
        )}
      </ModalContainer>
    </ModalOverlay>
  );
};

export default InviteFriendsModal; 