import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useParams, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc, onSnapshot, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useTokens } from '../contexts/TokenContext';
import { useCosmetics } from '../contexts/CosmeticContext';
import TipUserModalRedesigned from '../components/TipUserModalRedesigned';
import PlayerStats from '../components/PlayerStats';
import TwitchStreamStatus from '../components/TwitchStreamStatus';
import RankBadge from '../components/RankBadge';
import CosmeticProfile from '../components/CosmeticProfile';
import CosmeticNameplate from '../components/CosmeticNameplate';
import CosmeticFlair from '../components/CosmeticFlair';
import { findCosmeticById } from '../data/cosmeticData';
import UserAvatar from '../components/UserAvatar';

const shimmer = keyframes`
  0% { filter: brightness(1) drop-shadow(0 0 8px #4facfe88); }
  50% { filter: brightness(1.3) drop-shadow(0 0 16px #ff61e6cc); }
  100% { filter: brightness(1) drop-shadow(0 0 8px #4facfe88); }
`;

const ProfileContainer = styled.div`
  min-height: 100vh;
  background: ${props => {
    if (props.$hasProfileCosmetic && props.$cosmeticBackground) {
      return props.$cosmeticBackground;
    }
    return '#131124';
  }};
  color: #fff;
  padding: 2rem 0;
  position: relative;
  overflow: hidden;
  
  /* Debug: Add a temporary border when cosmetic is active */
  ${props => props.$hasProfileCosmetic && css`
    border: 3px solid lime !important;
  `}
  
  /* Temporary test: Force bright red background when cosmetic is active */
  ${props => props.$hasProfileCosmetic && css`
    background: linear-gradient(135deg, #ff0000 0%, #ff6600 50%, #ff0066 100%) !important;
  `}
  
  /* Default background for when no cosmetic is equipped */
  ${props => !props.$hasProfileCosmetic && css`
    &::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: url('https://fortnite-api.com/images/cosmetics/br/character_default.png') no-repeat right bottom/auto 60vh, url('https://fortnite-api.com/images/cosmetics/br/backpack_default.png') no-repeat left 40%/auto 40vh;
      opacity: 0.10;
      z-index: 0;
      pointer-events: none;
    }
  `}
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 2.5rem;
  margin-bottom: 3rem;
  position: relative;
  z-index: 1;
  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    gap: 1.5rem;
  }
`;

const Avatar = styled.div`
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background-image: ${props => props.$photoURL ? `url(${props.$photoURL})` : 'url("https://placehold.co/160x160")'};
  background-size: cover;
  background-position: center;
  border: 5px solid #4facfe;
  box-shadow: 0 10px 32px #4facfe55, 0 0 32px #ff61e655;
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 3rem;
`;

const ProfileInfo = styled.div`
  h1 {
    font-size: 2.8rem;
    margin-bottom: 0.5rem;
    background: linear-gradient(90deg, #4facfe 0%, #ff61e6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-family: 'Inter', Arial, sans-serif;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-shadow: 0 4px 24px #4facfe88;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  p {
    color: #b8c1ec;
    margin-bottom: 1rem;
    font-weight: 600;
    text-shadow: 0 2px 8px #2b105555;
  }
`;

const TipButton = styled.button`
  background: linear-gradient(90deg, #4facfe 0%, #ff61e6 100%);
  color: #fff;
  border: none;
  padding: 1.1rem 2.5rem;
  border-radius: 50px;
  font-weight: 900;
  font-size: 1.2rem;
  font-family: 'Inter', Arial, sans-serif;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-top: 1rem;
  transition: all 0.3s cubic-bezier(.25,1.7,.45,.87);
  box-shadow: 0 0 32px #4facfe99;
  letter-spacing: 0.04em;
  text-shadow: 0 2px 8px #00f2fe55;
  &:hover {
    transform: translateY(-6px) scale(1.05) rotate(-2deg);
    box-shadow: 0 0 48px #ff61e6cc, 0 0 64px #00f2fe99;
    background: linear-gradient(90deg, #ff61e6 0%, #4facfe 100%);
  }
  svg {
    width: 22px;
    height: 22px;
  }
  &:disabled {
    background: rgba(255, 255, 255, 0.1);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
  position: relative;
  z-index: 1;
`;

const StatCard = styled.div`
  background: rgba(24, 28, 40, 0.45);
  backdrop-filter: blur(14px);
  border-radius: 18px;
  padding: 2.2rem 1.5rem;
  text-align: center;
  border: 1.5px solid rgba(255,255,255,0.13);
  box-shadow: 0 8px 32px 0 rgba(31,38,135,0.18);
  font-family: 'Inter', Arial, sans-serif;
  font-weight: 900;
  font-size: 1.5rem;
  color: #fff;
  transition: all 0.3s cubic-bezier(.25,1.7,.45,.87);
  position: relative;
  overflow: hidden;
  &:hover {
    transform: translateY(-12px) scale(1.04) rotate(-1deg);
    box-shadow: 0 16px 40px 0 #ff61e6aa;
    border-color: #ff61e6;
    background: rgba(44, 62, 80, 0.98);
  }
  h3 {
    font-size: 2.2rem;
    margin-bottom: 0.5rem;
    background: linear-gradient(90deg, #4facfe 0%, #ff61e6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-family: 'Inter', Arial, sans-serif;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-shadow: 0 2px 8px #4facfe55;
  }
  p {
    color: #b8c1ec;
    font-size: 1.1rem;
    font-weight: 700;
  }
`;

const SectionTitle = styled.h2`
  font-size: 2rem;
  margin-bottom: 1.5rem;
  color: #fff;
  font-family: 'Inter', Arial, sans-serif;
  letter-spacing: 0.04em;
  text-shadow: 0 2px 8px #4facfe55;
`;

const FortniteSection = styled.div`
  margin-bottom: 3rem;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  
  .spinner {
    width: 50px;
    height: 50px;
    border: 5px solid rgba(79, 172, 254, 0.3);
    border-radius: 50%;
    border-top-color: #4facfe;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  background: rgba(255, 71, 87, 0.1);
  color: #ff4757;
  padding: 1rem;
  border-radius: 10px;
  margin-bottom: 2rem;
  text-align: center;
`;

const BackButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 50px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  margin-bottom: 2rem;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const LinkedAccounts = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const AccountBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50px;
  padding: 0.5rem 1rem;
  
  svg {
    width: 20px;
    height: 20px;
  }
  
  span {
    font-size: 0.9rem;
    color: #b8c1ec;
  }
`;

const MatchHistory = styled.div`
  background: rgba(44, 62, 80, 0.92);
  border-radius: 18px;
  overflow: hidden;
  border: 2px solid #4facfe;
  box-shadow: 0 8px 32px 0 #4facfe33;
  margin-bottom: 2rem;
  position: relative;
  z-index: 1;
`;

const MatchRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  padding: 1.2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  align-items: center;
  transition: all 0.3s cubic-bezier(.25,1.7,.45,.87);
  &:last-child { border-bottom: none; }
  &:hover {
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 4px 16px #ff61e655;
    transform: scale(1.01) rotate(-1deg);
  }
`;

const MatchHeader = styled(MatchRow)`
  background: linear-gradient(90deg, #4facfe 0%, #ff61e6 100%);
  font-weight: 800;
  color: #fff;
  font-size: 1.1rem;
  letter-spacing: 0.03em;
  box-shadow: 0 2px 8px #4facfe55;
`;

const Tooltip = styled.div`
  position: absolute;
  left: 50%;
  bottom: 110%;
  transform: translateX(-50%);
  background: rgba(44,62,80,0.95);
  color: #fff;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 1rem;
  font-family: 'Inter', Arial, sans-serif;
  white-space: nowrap;
  box-shadow: 0 2px 8px #4facfe55;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.18s;
  z-index: 10;
`;

const StatIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.5rem;
  font-size: 1.7rem;
  transition: transform 0.18s cubic-bezier(.25,1.7,.45,.87), filter 0.18s cubic-bezier(.25,1.7,.45,.87);
  filter: drop-shadow(0 0 8px #4facfe88);
  animation: ${shimmer} 2.2s infinite;
  position: relative;
  &:hover {
    filter: drop-shadow(0 0 24px #ff61e6cc) brightness(1.2);
    transform: scale(1.15) rotate(-3deg);
  }
  &.pop {
    animation: iconPop 0.4s cubic-bezier(.25,1.7,.45,.87), ${shimmer} 2.2s infinite;
  }
  &.bounce {
    animation: iconBounce 1.2s infinite alternate cubic-bezier(.25,1.7,.45,.87), ${shimmer} 2.2s infinite;
    filter: drop-shadow(0 0 12px #FFD70088);
  }
  @keyframes iconPop {
    0% { transform: scale(1); }
    50% { transform: scale(1.25); }
    100% { transform: scale(1); }
  }
  @keyframes iconBounce {
    from { transform: translateY(0) scale(1); }
    to { transform: translateY(-8px) scale(1.12); }
  }
`;

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { balance } = useTokens();
  const { userCosmetics } = useCosmetics();
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [isUserFetched, setIsUserFetched] = useState(false);
  const [userAvatarUrl, setUserAvatarUrl] = useState(null);
  
  // User stats state
  const [userStats, setUserStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  
  // User match history state
  const [userMatches, setUserMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  
  // VIP state
  const [isVip, setIsVip] = useState(false);
  
  // Function to get Discord avatar for the viewed user
  const fetchUserAvatar = async (userData) => {
    if (!userData) return null;
    
    // Use Discord avatar if linked
    if (userData.discordLinked && userData.discordId && userData.discordAvatar) {
      // Check if discordAvatar is already a full URL
      if (userData.discordAvatar.includes('http')) {
        return `${userData.discordAvatar}?t=${Date.now()}`;
      } else {
        // Otherwise construct the URL from the avatar hash
        return `https://cdn.discordapp.com/avatars/${userData.discordId}/${userData.discordAvatar}.png?t=${Date.now()}`;
      }
    }
    
    // Fallback to standard photoURL
    return userData.photoURL || null;
  };

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const db = getFirestore();
        const userRef = doc(db, 'users', userId);
        
        // Set up a real-time listener for the user data
        const unsubscribe = onSnapshot(userRef, async (docSnapshot) => {
          if (docSnapshot.exists()) {
            const userData = docSnapshot.data();
            
            // Set the user data
            setUser(userData);
            setDisplayName(userData.displayName || 'User');
            
            // Fetch and set avatar URL
            const avatarUrl = await fetchUserAvatar(userData);
            setUserAvatarUrl(avatarUrl);
            
            setIsUserFetched(true);
          } else {
            console.log("No such user!");
            setLoading(false);
          }
          setLoading(false);
        });
        
        return unsubscribe;
      } catch (error) {
        console.error("Error fetching user:", error);
        setLoading(false);
      }
    };
    
    if (userId) {
      fetchUser();
    }
  }, [userId]);
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) {
        setError('User ID is missing');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, 'users', userId));
        
        if (!userDoc.exists()) {
          setError('User not found');
          setLoading(false);
          return;
        }
        
        setUser({
          id: userId,
          ...userDoc.data()
        });
        
        // Fetch user's match history
        fetchUserMatches(userId);
        
        // Set up real-time listener for user stats
        const statsRef = doc(db, 'userStats', userId);
        
        const unsubscribe = onSnapshot(statsRef, (snapshot) => {
          if (snapshot.exists()) {
            setUserStats(snapshot.data());
          } else {
            // If no stats document exists, use default values
            setUserStats({
              matchesPlayed: 0,
              matchesWon: 0,
              winRate: 0,
              totalEarnings: 0
            });
          }
          setLoadingStats(false);
        }, (error) => {
          console.error('Error fetching user stats:', error);
          setLoadingStats(false);
        });
        
        return () => unsubscribe();
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to load user profile');
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [userId]);
  
  useEffect(() => {
    if (!userId) return;
    const db = getFirestore();
    const invRef = doc(db, 'userInventory', userId);
    const userRef = doc(db, 'users', userId);
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
    return () => { unsubInv && unsubInv(); unsubUser && unsubUser(); };
  }, [userId]);
  
  // Use actual stats if available, otherwise use placeholders
  const matchesPlayed = userStats ? userStats.matchesPlayed : 0;
  const wagersWon = userStats ? userStats.matchesWon : 0;
  const winRate = userStats ? (userStats.winRate * 100).toFixed(1) : '0.0';
  const totalEarnings = userStats ? userStats.totalEarnings : 0;
  
  // Add this function inside UserProfile component
  const fetchUserMatches = async (userId) => {
    if (!userId) return;

    try {
      setLoadingMatches(true);
      const db = getFirestore();
      const matchesRef = collection(db, 'wagers');
      
      // First try to get matches where user is explicitly listed as a participant
      let matchesQuery = query(
        matchesRef,
        where('participants', 'array-contains', userId),
        where('status', '==', 'completed'),
        orderBy('updatedAt', 'desc'),
        limit(5)
      );
      
      let matchesSnapshot = await getDocs(matchesQuery);
      let matches = [];
      
      // If no matches found, try alternative queries
      if (matchesSnapshot.empty) {
        // Try as host
        const hostQuery = query(
          matchesRef,
          where('hostId', '==', userId),
          where('status', '==', 'completed'),
          orderBy('updatedAt', 'desc'),
          limit(5)
        );
        
        matchesSnapshot = await getDocs(hostQuery);
        
        // If still no matches, try as guest
        if (matchesSnapshot.empty) {
          const guestQuery = query(
            matchesRef,
            where('guestId', '==', userId),
            where('status', '==', 'completed'),
            orderBy('updatedAt', 'desc'),
            limit(5)
          );
          
          matchesSnapshot = await getDocs(guestQuery);
        }
      }
      
      // Process match results
      matchesSnapshot.forEach((doc) => {
        const match = doc.data();
        const isWinner = 
          (match.winner === 'host' && match.hostId === userId) || 
          (match.winner === 'guest' && match.guestId === userId);
        
        matches.push({
          id: doc.id,
          date: match.updatedAt ? match.updatedAt.toDate() : new Date(),
          gameMode: match.gameMode || 'Unknown',
          amount: match.amount || 0,
          result: isWinner ? 'Win' : 'Loss'
        });
      });
      
      setUserMatches(matches);
    } catch (error) {
      console.error('Error getting user matches:', error);
      setUserMatches([]);
    } finally {
      setLoadingMatches(false);
    }
  };
  
  if (loading) {
    return (
      <ProfileContainer>
        <BackButton onClick={() => navigate(-1)}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
          Back
        </BackButton>
        <LoadingContainer>
          <div className="spinner"></div>
        </LoadingContainer>
      </ProfileContainer>
    );
  }
  
  if (error) {
    return (
      <ProfileContainer>
        <BackButton onClick={() => navigate(-1)}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
          Back
        </BackButton>
        <ErrorMessage>{error}</ErrorMessage>
      </ProfileContainer>
    );
  }
  
  if (!user) {
    return (
      <ProfileContainer>
        <BackButton onClick={() => navigate(-1)}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
          Back
        </BackButton>
        <ErrorMessage>User not found</ErrorMessage>
      </ProfileContainer>
    );
  }
  
  const initial = displayName.charAt(0).toUpperCase();
  let joinDate = 'Unknown';
  try {
    if (user.createdAt) {
      const date = user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
      if (!isNaN(date.getTime())) {
        joinDate = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      }
    }
  } catch (err) {
    console.error('Error formatting join date:', err);
  }
  const isSelf = currentUser && currentUser.uid === userId;
  
  return (
    <ProfileContainer $hasProfileCosmetic={!!userCosmetics.equipped?.profile} $cosmeticBackground={userCosmetics.equipped?.profile ? findCosmeticById(userCosmetics.equipped.profile)?.effects?.backgroundColor : null}>
      {/* Direct debug indicator */}
      {userCosmetics.equipped?.profile && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(255, 255, 0, 0.9)',
          color: 'black',
          padding: '10px',
          borderRadius: '4px',
          fontSize: '14px',
          zIndex: 9999,
          border: '2px solid red'
        }}>
          COSMETIC DETECTED: {findCosmeticById(userCosmetics.equipped.profile)?.name}
          <br />
          BG: {findCosmeticById(userCosmetics.equipped.profile)?.effects?.backgroundColor}
        </div>
      )}
      
      {/* Remove the separate CosmeticProfile component temporarily */}
      {false && userCosmetics.equipped?.profile && (
        <CosmeticProfile 
          cosmetic={findCosmeticById(userCosmetics.equipped.profile)}
          fullScreen={true}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 0,
            borderRadius: '0px',
            border: 'none',
            minHeight: '100vh'
          }}
        >
          {/* Temporary debug indicator */}
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(255, 0, 0, 0.8)',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 1000
          }}>
            COSMETIC ACTIVE: {findCosmeticById(userCosmetics.equipped.profile)?.name}
          </div>
          
          {/* Background color debug indicator */}
          <div style={{
            position: 'absolute',
            top: '50px',
            right: '10px',
            background: 'rgba(0, 255, 0, 0.8)',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '4px',
            fontSize: '10px',
            zIndex: 1000,
            maxWidth: '200px',
            wordBreak: 'break-all'
          }}>
            BG: {findCosmeticById(userCosmetics.equipped.profile)?.effects?.backgroundColor}
          </div>
        </CosmeticProfile>
      )}
      
      <BackButton onClick={() => navigate(-1)}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
        Back
      </BackButton>
      
      <ProfileHeader>
        <UserAvatar
          userData={user}
          size={160}
          initial={displayName ? displayName.charAt(0).toUpperCase() : '?'}
          borderColor="#4facfe"
          hoverBorderColor="#ff61e6"
          borderWidth={5}
        />
        <ProfileInfo>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {userCosmetics.equipped?.nameplate ? (
              <CosmeticNameplate cosmetic={findCosmeticById(userCosmetics.equipped.nameplate)}>
                {displayName}
              </CosmeticNameplate>
            ) : (
              displayName
            )}
            {isVip && (
              <span title="VIP Member" style={{marginLeft:'0.25rem',display:'inline-flex',alignItems:'center'}}>
                <svg viewBox="0 0 24 24" fill="#ffd700" width="28" height="28"><path d="M12 2l2.09 6.26L20 9.27l-5 3.64L16.18 20 12 16.77 7.82 20 9 12.91l-5-3.64 5.91-.01z"/></svg>
              </span>
            )}
            <RankBadge userId={userId} size={32} marginLeft="0" />
            {userCosmetics.equipped?.flair && (
              <CosmeticFlair 
                cosmetic={findCosmeticById(userCosmetics.equipped.flair)}
                style={{ marginLeft: '8px' }}
              />
            )}
          </h1>
          <p>Member since {joinDate}</p>
          
          {!isSelf && currentUser && (
            <TipButton onClick={() => setIsTipModalOpen(true)} disabled={!currentUser}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
              </svg>
              Send Tip
            </TipButton>
          )}
        </ProfileInfo>
      </ProfileHeader>
      
      {/* Show Twitch stream status if user has linked their Twitch account */}
      {user.twitchLinked && user.twitchUsername && (
        <TwitchStreamStatus twitchUsername={user.twitchUsername} />
      )}
      
      <StatsGrid>
        <StatCard>
          <div style={{position:'relative'}}>
            <StatIcon className="bounce">{/* SVG */}</StatIcon>
            {/* {showTooltip && <Tooltip>"Total Battles Fought!"</Tooltip>} */}
            {/* {isTopUser && <span style={{position:'absolute',top:'-1.5rem',right:'-1.2rem'}}><CrownSVG /></span>} */}
          </div>
          <h3>{matchesPlayed}</h3>
          <p>Matches Played</p>
        </StatCard>
        <StatCard>
          <div style={{position:'relative'}}>
            <StatIcon className="bounce">{/* SVG */}</StatIcon>
            {/* {showTooltip && <Tooltip>"Total Battles Fought!"</Tooltip>} */}
            {/* {isTopUser && <span style={{position:'absolute',top:'-1.5rem',right:'-1.2rem'}}><CrownSVG /></span>} */}
          </div>
          <h3>{wagersWon}</h3>
          <p>Matches Won</p>
        </StatCard>
        <StatCard>
          <div style={{position:'relative'}}>
            <StatIcon className="bounce">{/* SVG */}</StatIcon>
            {/* {showTooltip && <Tooltip>"Total Battles Fought!"</Tooltip>} */}
            {/* {isTopUser && <span style={{position:'absolute',top:'-1.5rem',right:'-1.2rem'}}><CrownSVG /></span>} */}
          </div>
          <h3>{winRate}%</h3>
          <p>Win Rate</p>
        </StatCard>
        <StatCard>
          <div style={{position:'relative'}}>
            <StatIcon className="bounce">{/* SVG */}</StatIcon>
            {/* {showTooltip && <Tooltip>"Total Battles Fought!"</Tooltip>} */}
            {/* {isTopUser && <span style={{position:'absolute',top:'-1.5rem',right:'-1.2rem'}}><CrownSVG /></span>} */}
          </div>
          <h3>{totalEarnings}</h3>
          <p>Total Earnings</p>
        </StatCard>
      </StatsGrid>
      
      {/* Linked Accounts Section */}
      <SectionTitle>Linked Accounts</SectionTitle>
      <LinkedAccounts>
        {user.discordLinked && (
          <AccountBadge>
            <svg width="20" height="15" viewBox="0 0 71 55" fill="#5865F2" xmlns="http://www.w3.org/2000/svg">
              <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z"/>
            </svg>
            <span>{user.discordUsername || 'Discord User'}</span>
          </AccountBadge>
        )}
        
        {user.epicLinked && (
          <AccountBadge>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#00BFFF" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0C5.383 0 0 5.383 0 12C0 18.617 5.383 24 12 24C18.617 24 24 18.617 24 12C24 5.383 18.617 0 12 0ZM13.121 17.896H10.879V12.76H8.637V10.76H15.363V12.76H13.121V17.896ZM12 9.12C11.275 9.12 10.69 8.534 10.69 7.81C10.69 7.086 11.275 6.5 12 6.5C12.725 6.5 13.31 7.086 13.31 7.81C13.31 8.534 12.725 9.12 12 9.12Z"/>
            </svg>
            <span>{user.epicUsername || 'Epic Games User'}</span>
          </AccountBadge>
        )}
        
        {user.twitchLinked && (
          <AccountBadge>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#9146FF" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
            </svg>
            <span>{user.twitchUsername || 'Twitch User'}</span>
          </AccountBadge>
        )}
        
        {!user.discordLinked && !user.epicLinked && !user.twitchLinked && (
          <div style={{ color: '#b8c1ec', padding: '0.5rem 0' }}>
            No linked accounts
          </div>
        )}
      </LinkedAccounts>
      
      {/* Recent Matches Section */}
      <SectionTitle>Recent Matches</SectionTitle>
      {loadingMatches ? (
        <div style={{ textAlign: 'center', padding: '1rem' }}>
          <div className="spinner"></div>
        </div>
      ) : userMatches.length > 0 ? (
        <MatchHistory>
          <MatchHeader>
            <div>Date</div>
            <div>Game Mode</div>
            <div>Amount</div>
            <div>Result</div>
          </MatchHeader>
          
          {userMatches.map(match => (
            <MatchRow key={match.id}>
              <div>{new Date(match.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}</div>
              <div>{match.gameMode}</div>
              <div>{match.amount} tokens</div>
              <div style={{ color: match.result === 'Win' ? '#2ed573' : '#ff4757' }}>
                {match.result}
              </div>
            </MatchRow>
          ))}
        </MatchHistory>
      ) : (
        <div style={{ color: '#b8c1ec', padding: '0.5rem 0' }}>
          No recent matches found
        </div>
      )}
      
      {user.epicLinked && user.epicUsername && (
        <FortniteSection>
          <SectionTitle>Fortnite Stats</SectionTitle>
          <PlayerStats username={user.epicUsername} />
        </FortniteSection>
      )}
      
      <TipUserModalRedesigned
        isOpen={isTipModalOpen}
        onClose={() => setIsTipModalOpen(false)}
        preSelectedUserId={userId}
      />
    </ProfileContainer>
  );
};

export default UserProfile; 