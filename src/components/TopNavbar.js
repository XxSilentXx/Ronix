import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { useTokens } from '../contexts/TokenContext';
import { useNotification } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { FaBell, FaChevronDown, FaUser, FaWallet, FaUserFriends, FaStar, FaVolumeUp, FaVolumeMute, FaSignOutAlt } from 'react-icons/fa';
import UserAvatar from './UserAvatar';
import RankBadge from './RankBadge';
import { getAvatarUrl } from '../utils/avatarUtils';
import { useActiveWager } from '../hooks/useActiveWager';
import UserSearchModal from './UserSearchModal';
import { collection, query, getDocs, limit, doc, onSnapshot, getFirestore } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useXp } from '../contexts/XpContext';
import NotificationCenter from './NotificationCenter';
import { useFriends } from '../contexts/FriendsContext';
import { getFunctions, httpsCallable } from 'firebase/functions';

const NavbarContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: #181825;
  display: flex;
  align-items: center;
  z-index: 150;
  border-bottom: 1.5px solid #23233a;
  padding-left: 0;
  padding-right: 2.5rem;
  padding-left: 0;
  margin-left: 0;
  box-shadow: 0 2px 16px #0006;
  @media (min-width: 700px) {
    left: 0;
    margin-left: 0;
  }
`;

const Content = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  padding-left: 70px; /* leave space for sidebar */
  @media (min-width: 700px) {
    padding-left: 260px;
  }
`;

const SearchBar = styled.input`
  background: #23233a;
  border: none;
  border-radius: 8px;
  padding: 0.6rem 1.2rem;
  color: #fff;
  font-size: 1.1rem;
  margin-right: 2rem;
  width: 260px;
  font-family: 'Inter', Arial, sans-serif;
  font-weight: 600;
  outline: none;
  transition: box-shadow 0.2s;
  box-shadow: 0 2px 8px #0002;
  &:focus {
    box-shadow: 0 0 0 2px #A259F7;
  }
`;

const SearchContainer = styled.div`
  position: relative;
  margin-right: 2rem;
`;

const SearchResults = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  max-height: 300px;
  overflow-y: auto;
  background: #23233a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  z-index: 1000;
  margin-top: 0.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
`;

const SearchResultItem = styled.div`
  display: flex;
  align-items: center;
  padding: 0.8rem 1rem;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  &:not(:last-child) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
`;

const SearchUserAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-right: 0.8rem;
  background-image: ${props => props.src ? `url(${props.src})` : 'none'};
  background-color: ${props => props.src ? 'transparent' : '#A259F7'};
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 0.9rem;
  font-weight: 600;
`;

const SearchUserName = styled.div`
  font-weight: 600;
  color: #fff;
  font-size: 0.9rem;
`;

const SearchText = styled.div`
  color: #b8c1ec;
  padding: 0.8rem 1rem;
  font-size: 0.9rem;
`;

const Spacer = styled.div`
  flex: 1;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  color: #fff;
  font-size: 1.5rem;
  margin: 0 0.7rem;
  cursor: pointer;
  position: relative;
  transition: color 0.2s;
  &:hover {
    color: #A259F7;
  }
`;

const TokenBalance = styled.div`
  background: #23233a;
  color: #FFD700;
  padding: 0.4rem 1.1rem;
  border-radius: 50px;
  display: flex;
  align-items: center;
  font-weight: bold;
  font-size: 1.08rem;
  margin-right: 1.2rem;
  box-shadow: 0 2px 10px #FFD70022;
  border: 1px solid #FFD70033;
`;

const ProfileButton = styled.button`
  background: none;
  border: none;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  cursor: pointer;
  position: relative;
  padding: 0.2rem 0.4rem;
  border-radius: 8px;
  transition: background 0.2s;
  &:hover {
    background: #23233a;
  }
`;

const Dropdown = styled.div`
  position: absolute;
  top: 60px;
  right: 0;
  background: #23233a;
  border-radius: 12px;
  box-shadow: 0 8px 32px #0008;
  min-width: 220px;
  z-index: 1000;
  padding: 0.7rem 0;
  border: 1.5px solid #23233a;
`;

const DropdownItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.9rem 1.5rem;
  white-space: nowrap;
  color: #fff;
  font-size: 1.08rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s, color 0.18s;
  &:hover {
    background: #181825;
    color: #A259F7;
  }
  &.logout {
    color: #ff4757;
    border-top: 1px solid #23233a;
    margin-top: 0.3rem;
  }
`;

const NotificationBadge = styled.span`
  position: absolute;
  top: -6px;
  right: -6px;
  background: #ff4757;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
`;

const ActiveWagerBanner = styled.div`
  background: linear-gradient(90deg, #4facfe 0%, #ff61e6 100%);
  color: #fff;
  padding: 0.5rem 1.2rem;
  border-radius: 25px;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(79, 172, 254, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.2);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(255, 97, 230, 0.5);
    background: linear-gradient(90deg, #ff61e6 0%, #4facfe 100%);
  }
  
  .status {
    padding: 0.2rem 0.6rem;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .amount {
    font-size: 1.1rem;
    font-weight: 900;
  }
`;

const XpBarContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  background: rgba(35, 35, 58, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 0.5rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-width: 220px;
  
  @media (max-width: 1024px) {
    display: none;
  }
`;

const XpLevelInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #b8c1ec;
  font-weight: 600;
  white-space: nowrap;
`;

const XpTierBadge = styled.div`
  padding: 0.15rem 0.4rem;
  background: ${props => props.$color || '#cd7f32'};
  color: white;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: bold;
  text-transform: uppercase;
`;

const XpProgressContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

const XpProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
`;

const XpProgressFill = styled.div`
  height: 100%;
  width: ${props => props.$progress}%;
  background: linear-gradient(90deg, #00FFD0 0%, #A259F7 100%);
  border-radius: 3px;
  transition: width 0.5s ease-out;
`;

const XpText = styled.div`
  font-size: 0.7rem;
  color: #4facfe;
  font-weight: 600;
  text-align: center;
`;

const VipBadge = styled.span`
  margin-left: 0.3rem;
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
  svg {
    width: 20px;
    height: 20px;
    color: #ffd700;
    filter: drop-shadow(0 1px 4px #ffd70088);
  }
`;

const TopNavbar = () => {
  const { currentUser, logout } = useAuth();
  const { balance } = useTokens();
  const { notifications } = useNotification();
  const { activeWager } = useActiveWager();
  const { xpTotal, currentLevel, nextLevelXp, progress, currentTier, tierColor } = useXp();
  const { friendRequests } = useFriends();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [isVip, setIsVip] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [checkingCreator, setCheckingCreator] = useState(false);
  const navigate = useNavigate();
  const profileRef = useRef();
  const notificationRef = useRef();
  const searchRef = useRef();

  // VIP status checking
  useEffect(() => {
    if (!currentUser) return;
    
    const db = getFirestore();
    const invRef = doc(db, 'userInventory', currentUser.uid);
    const userRef = doc(db, 'users', currentUser.uid);
    let unsubInv, unsubUser;
    
    unsubInv = onSnapshot(invRef, (docSnap) => {
      let isVip = false;
      if (docSnap.exists()) {
        const items = docSnap.data().items || [];
        const now = new Date();
        const vip = items.find(i => i.id === 'vip_subscription' && i.isActive && i.expiresAt && (i.expiresAt.toDate ? i.expiresAt.toDate() : new Date(i.expiresAt)) > now);
        isVip = !!vip;
      }
      setIsVip(isVip);
    });
    
    unsubUser = onSnapshot(userRef, (docSnap) => {
      if (!docSnap.exists()) return;
      const vipStatus = docSnap.data().vipStatus;
      if (vipStatus && vipStatus.isActive && vipStatus.expiresAt) {
        const now = new Date();
        const expiresAt = vipStatus.expiresAt.toDate ? vipStatus.expiresAt.toDate() : new Date(vipStatus.expiresAt);
        if (expiresAt > now) setIsVip(true);
      }
    });
    
    return () => { 
      unsubInv && unsubInv(); 
      unsubUser && unsubUser(); 
    };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setIsCreator(false);
      return;
    }
    setCheckingCreator(true);
    const fn = httpsCallable(getFunctions(), 'getCreatorReferralDashboard');
    fn()
      .then(res => {
        if (res.data && Array.isArray(res.data.codes) && res.data.codes.length > 0) {
          setIsCreator(true);
        } else {
          setIsCreator(false);
        }
      })
      .catch(() => setIsCreator(false))
      .finally(() => setCheckingCreator(false));
  }, [currentUser]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setNotificationDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchResults(false);
      }
    }
    if (dropdownOpen || notificationDropdownOpen || showSearchResults) {
      document.addEventListener('mousedown', handleClick);
    } else {
      document.removeEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen, notificationDropdownOpen, showSearchResults]);

  // Search users with debounce
  React.useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchUsers = async (searchTerm) => {
    if (!searchTerm.trim() || searchTerm.length < 2) return;
    
    setSearchLoading(true);
    try {
      const displayNameQuery = searchTerm.toLowerCase();
      const usersRef = collection(db, 'users');
      
      // Get users and filter client-side for flexible matching
      const querySnapshot = await getDocs(query(usersRef, limit(50)));
      
      const users = [];
      querySnapshot.forEach((doc) => {
        // Don't include current user in search results
        if (currentUser && doc.id === currentUser.uid) return;
        
        const userData = doc.data();
        const displayNameLower = userData.displayNameLower || (userData.displayName ? userData.displayName.toLowerCase() : '');
        
        // Check if displayName contains the search query
        if (displayNameLower.includes(displayNameQuery)) {
          users.push({
            id: doc.id,
            displayName: userData.displayName || 'Anonymous User',
            photoURL: getAvatarUrl(userData)
          });
        }
      });
      
      setSearchResults(users.slice(0, 8)); // Limit to 8 results
      setShowSearchResults(true);
    } catch (error) {
      console.error('Error searching for users:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
    setShowSearchResults(false);
    setSearchQuery('');
  };

  const handleSearchFocus = () => {
    if (searchQuery.trim() && searchQuery.length >= 2) {
      setShowSearchResults(true);
    }
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'open': return 'Waiting';
      case 'ready': return 'Ready';
      case 'playing': return 'Live';
      case 'submitting': return 'Results';
      default: return status;
    }
  };

  const handleActiveWagerClick = () => {
    if (activeWager) {
      navigate(`/wager/${activeWager.id}`);
    }
  };

  return (
    <>
    <NavbarContainer>
      <Content>
        <SearchContainer ref={searchRef}>
          <SearchBar
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={handleSearchFocus}
          />
          {showSearchResults && (
            <SearchResults>
              {searchLoading ? (
                <SearchText>Searching...</SearchText>
              ) : (
                <>
                  {searchQuery.length < 2 ? (
                    <SearchText>Type at least 2 characters to search</SearchText>
                  ) : searchResults.length === 0 ? (
                    <SearchText>No users found for "{searchQuery}"</SearchText>
                  ) : (
                    searchResults.map(user => (
                      <SearchResultItem key={user.id} onClick={() => handleUserSelect(user)}>
                        <SearchUserAvatar src={user.photoURL}>
                          {!user.photoURL && user.displayName.charAt(0).toUpperCase()}
                        </SearchUserAvatar>
                        <SearchUserName>{user.displayName}</SearchUserName>
                      </SearchResultItem>
                    ))
                  )}
                </>
              )}
            </SearchResults>
          )}
        </SearchContainer>
        {activeWager && (
          <ActiveWagerBanner onClick={handleActiveWagerClick}>
            <span className="status">{getStatusDisplay(activeWager.status)}</span>
            <span>{activeWager.partySize} {activeWager.gameMode}</span>
            {activeWager.mode !== 'fun' && (
              <span className="amount">{activeWager.amount} Tokens</span>
            )}
            {activeWager.mode === 'fun' && (
              <span style={{ color: '#51cf66' }}> Fun Play</span>
            )}
          </ActiveWagerBanner>
        )}
        {currentUser && (
          <XpBarContainer>
            <XpLevelInfo>
              <RankBadge 
                userId={currentUser.uid}
                tier={currentTier}
                level={currentLevel}
                size={18}
                marginLeft="0"
                showTooltip={true}
              />
              Level {currentLevel}
              <XpTierBadge $color={tierColor}>{currentTier}</XpTierBadge>
            </XpLevelInfo>
            <XpProgressContainer>
              <XpProgressBar>
                <XpProgressFill $progress={progress} />
              </XpProgressBar>
              <XpText>{xpTotal} / {nextLevelXp} XP</XpText>
            </XpProgressContainer>
          </XpBarContainer>
        )}
        <Spacer />
        <NotificationCenter />
        {currentUser ? (
          <>
            <TokenBalance>
              <img src="/assets/token-logo.png" alt="Token" style={{ height: '22px', marginRight: 8, verticalAlign: 'middle' }} />
              {balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </TokenBalance>
            <ProfileButton ref={profileRef} onClick={() => setDropdownOpen(d => !d)}>
              <UserAvatar size={38} userData={currentUser} />
              {isVip && (
                <VipBadge title="VIP Member">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l2.09 6.26L20 9.27l-5 3.64L16.18 20 12 16.77 7.82 20 9 12.91l-5-3.64 5.91-.01z"/>
                  </svg>
                </VipBadge>
              )}
              <FaChevronDown style={{ fontSize: '1.1em', color: '#A259F7' }} />
              {dropdownOpen && (
                <Dropdown>
                  <DropdownItem onClick={() => navigate('/profile')}><FaUser /> Profile</DropdownItem>
                  <DropdownItem onClick={() => navigate('/wallet')}><FaWallet /> Wallet</DropdownItem>
                  <DropdownItem onClick={() => navigate('/friends')}><FaUserFriends /> Friends</DropdownItem>
                  {checkingCreator ? (
                    <DropdownItem style={{ opacity: 0.6, pointerEvents: 'none' }}><FaStar /> Checking...</DropdownItem>
                  ) : isCreator ? (
                    <DropdownItem onClick={() => navigate('/creator-dashboard')}><FaStar /> Creator Dashboard</DropdownItem>
                  ) : (
                    <DropdownItem onClick={() => navigate('/become-creator')}><FaStar /> Become Creator</DropdownItem>
                  )}
                  <DropdownItem onClick={() => setSoundOn(s => !s)}>
                    {soundOn ? <FaVolumeUp /> : <FaVolumeMute />} Sound {soundOn ? 'On' : 'Off'}
                  </DropdownItem>
                  <DropdownItem className="logout" onClick={logout}><FaSignOutAlt /> Logout</DropdownItem>
                </Dropdown>
              )}
            </ProfileButton>
            {/* Friends Icon with Badge */}
            <IconButton onClick={() => navigate('/friends')} style={{ position: 'relative' }} aria-label="Friends">
              <FaUserFriends />
              {friendRequests && friendRequests.length > 0 && (
                <NotificationBadge title={`You have ${friendRequests.length} pending friend request${friendRequests.length > 1 ? 's' : ''}`}>{friendRequests.length}</NotificationBadge>
              )}
            </IconButton>
          </>
        ) : (
          <>
            <button
              style={{
                background: 'linear-gradient(90deg, #A259F7 0%, #00FFD0 100%)',
                color: '#18122B',
                border: 'none',
                borderRadius: '8px',
                padding: '0.7rem 1.5rem',
                fontWeight: 800,
                fontSize: '1.08rem',
                marginRight: '1rem',
                cursor: 'pointer',
                boxShadow: '0 2px 10px #A259F799',
                letterSpacing: '0.03em',
                transition: 'background 0.18s, color 0.18s',
              }}
              onClick={() => navigate('/login')}
            >
              Login
            </button>
            <button
              style={{
                background: 'linear-gradient(90deg, #00FFD0 0%, #A259F7 100%)',
                color: '#18122B',
                border: 'none',
                borderRadius: '8px',
                padding: '0.7rem 1.5rem',
                fontWeight: 800,
                fontSize: '1.08rem',
                cursor: 'pointer',
                boxShadow: '0 2px 10px #00FFD099',
                letterSpacing: '0.03em',
                transition: 'background 0.18s, color 0.18s',
              }}
              onClick={() => navigate('/register')}
            >
              Sign Up
            </button>
          </>
        )}
      </Content>
    </NavbarContainer>
    
    {/* User Search Modal */}
    {selectedUser && (
      <UserSearchModal 
        isOpen={showUserModal} 
        onClose={() => {
          setShowUserModal(false);
          setSelectedUser(null);
        }}
        preSelectedUserId={selectedUser.id}
      />
    )}
    </>
  );
};

export default TopNavbar; 