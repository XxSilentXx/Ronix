import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc, onSnapshot, updateDoc, collection, addDoc, arrayUnion, serverTimestamp, query, getDocs, where, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useTokens } from '../contexts/TokenContext';
import ReadyUpButton from '../components/ReadyUpButton';
import WagerChatBox from '../components/WagerChatBox';
import SubmitResultsModal from '../components/SubmitResultsModal';
import useMatchRefund from '../hooks/useMatchRefund';
import { useNotification } from '../contexts/NotificationContext';
import { getWagerPrizeAndFee } from '../utils/feeUtils';
import { areAllPlayersReady, getPlayerReadyStatus, isUserPartyLeader } from '../utils/wagerUtils';
import AdminRequestModal from '../components/AdminRequestModal';
import CosmeticNameplate from '../components/CosmeticNameplate';
import CosmeticFlair from '../components/CosmeticFlair';
import CosmeticCallingCard from '../components/CosmeticCallingCard';
import { findCosmeticById } from '../data/cosmeticData';
import CosmeticProfile from '../components/CosmeticProfile';
import MatchResultsViewer from '../components/MatchResultsViewer';
import { Modal, Button } from '@mui/material'; // Add at the top with other imports

const MatchContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
  display: flex;
  gap: 1rem;
`;

const MainContent = styled.div`
  flex: 1;
  padding: 2rem;
  padding-right: 1rem;
`;

const ChatSidebar = styled.div`
  width: 350px;
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(10px);
  border-left: 1px solid rgba(79, 172, 254, 0.3);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 60px; /* Account for top navbar */
  height: calc(100vh - 60px);
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  
  @media (max-width: 1200px) {
    width: 320px;
  }
  
  @media (max-width: 1024px) {
    width: 300px;
  }
  
  @media (max-width: 768px) {
    position: fixed;
    top: 60px;
    right: 0;
    z-index: 1000;
    transform: ${props => props.$mobileOpen ? 'translateX(0)' : 'translateX(100%)'};
    transition: transform 0.3s ease;
    box-shadow: -5px 0 20px rgba(0, 0, 0, 0.2);
  }
`;

const ChatSidebarHeader = styled.div`
  background: rgba(22, 33, 62, 0.95);
  padding: 1rem;
  border-bottom: 1px solid rgba(79, 172, 254, 0.3);
  backdrop-filter: blur(5px);
  
  h3 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: #fff;
    display: flex;
    align-items: center;
    gap: 8px;
    
    svg {
      color: #4facfe;
    }
  }
  
  .player-count {
    font-size: 0.85rem;
    color: #b8c1ec;
    margin-top: 0.25rem;
    font-weight: 500;
  }
`;

const ChatSidebarContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const MatchHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const MatchTitle = styled.h1`
  font-size: 2.5rem;
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const ShareButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const MatchInfo = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 2rem;
  background: rgba(30, 32, 50, 0.7);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(79, 172, 254, 0.04);
  border: 1px solid rgba(79, 172, 254, 0.08);
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const InfoItem = styled.div`
  background: ${({ index }) => index % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(79,172,254,0.06)'};
  border-right: 1px solid rgba(79,172,254,0.13);
  &:last-child { border-right: none; }
  border-radius: 0;
  padding: 1rem;
  text-align: center;
  flex: 1;
  margin: 0;
  @media (max-width: 768px) {
    margin: 0;
    border-right: none;
    border-bottom: 1px solid rgba(79,172,254,0.13);
    &:last-child { border-bottom: none; }
  }
`;

const InfoLabel = styled.div`
  color: #b8c1ec;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
`;

const InfoValue = styled.div`
  font-weight: bold;
  font-size: 1.2rem;
  color: ${props => props.$highlight ? '#4facfe' : '#fff'};
`;

const MapCodeSection = styled.div`
  background: rgba(79, 172, 254, 0.07); // lighter, less saturated
  border-radius: 10px;
  padding: 1rem;
  margin: 1rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px solid rgba(79, 172, 254, 0.15); // lighter border
  box-shadow: none;
`;

const MapCodeLabel = styled.div`
  font-size: 0.9rem;
  color: #b8c1ec;
  margin-bottom: 0.5rem;
`;

const MapCode = styled.div`
  font-size: 1.4rem;
  font-weight: bold;
  color: #4facfe;
  text-align: center;
  word-break: keep-all;
  background: rgba(79, 172, 254, 0.1);
  padding: 0.5rem 1rem;
  border-radius: 5px;
  border: 1px solid rgba(79, 172, 254, 0.3);
`;

const MapGameMode = styled.div`
  margin-top: 0.5rem;
  font-size: 1rem;
  color: #fff;
`;

const ProgressBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 2rem 0;
  position: relative;
`;

const ProgressStep = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
  z-index: 2;
  &:not(:last-child)::after {
    content: '';
    position: absolute;
    top: 22px;
    left: 50%;
    width: 100%;
    height: 4px;
    background: linear-gradient(90deg, #4facfe 0%, #00ffd0 100%);
    opacity: ${props => props.$active ? 1 : 0.25};
    z-index: 1;
    transition: opacity 0.5s;
  }
`;

const StepCircle = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${props => props.$active ? 'linear-gradient(135deg, #A259F7 0%, #00FFD0 100%)' : 'rgba(255,255,255,0.08)'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
  position: relative;
  z-index: 2;
  color: ${props => props.$active ? '#1a1a2e' : '#b8c1ec'};
  font-weight: 700;
  font-size: 1.1rem;
  box-shadow: ${props => props.$active ? '0 0 0 4px rgba(162,89,247,0.15)' : 'none'};
  border: 2px solid ${props => props.$active ? '#A259F7' : 'rgba(255,255,255,0.12)'};
  transition: background 0.3s, color 0.3s, border 0.3s;
`;

const StepLabel = styled.div`
  font-size: 0.8rem;
  color: ${props => props.$active ? '#4facfe' : '#b8c1ec'};
  text-align: center;
`;

const StepDescription = styled.div`
  font-size: 0.7rem;
  color: #b8c1ec;
  text-align: center;
  max-width: 120px;
`;

const TeamsSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const TeamCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 1.5rem;
  border: 1px solid ${props => props.$isHost ? 'rgba(79, 172, 254, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
`;

const TeamHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  
  h3 {
    font-size: 1.2rem;
    color: ${props => props.$isHost ? '#4facfe' : '#fff'};
  }
`;

const PlayersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ThemedPlayerBox = styled.div`
  background: ${({ profileBg, profileImg }) =>
    profileImg
      ? `${profileImg}, ${profileBg || 'rgba(44,62,80,0.95)'}`
      : profileBg || 'rgba(44,62,80,0.95)'};
  border: 3px solid ${({ borderColor }) => borderColor || '#4facfe'};
  border-radius: 16px;
  box-shadow: 0 0 20px ${({ glowColor }) => glowColor || '#4facfe88'};
  padding: 1.2rem 1.5rem;
  margin-bottom: 1.2rem;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  background-size: cover;
  background-position: center;
`;

// Memoized PlayerAvatar to prevent unnecessary re-renders
const PlayerAvatar = React.memo(({ $photoURL, displayName }) => (
  <div
    style={{
      width: '50px',
      height: '50px',
      minWidth: '50px',
      borderRadius: '8px',
      backgroundImage: $photoURL ? `url(${$photoURL})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: $photoURL ? 'transparent' : '#4facfe',
      color: '#fff',
      fontSize: '1.5rem',
      fontWeight: 'bold',
      boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}
  >
    {!$photoURL && displayName.charAt(0)}
  </div>
));

const PlayerInfo = React.memo(({ player, hostingTeam, match, playerCosmetics, currentUser, matchId, isPartyWager }) => (
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
      {hostingTeam === 'host' && player.id === match.hostId && (
        <span className="host-crown" title="This team will host the lobby"></span>
      )}
      {hostingTeam === 'guest' && player.id === match.guestId && (
        <span className="host-crown" title="This team will host the lobby"></span>
      )}
      {player.id === match.hostId && <span className="leader-badge">Creator</span>}
      {player.id === match.guestId && <span className="leader-badge">Joiner</span>}
      {playerCosmetics[player.id]?.flair && (
        <CosmeticFlair cosmetic={playerCosmetics[player.id].flair} style={{ marginLeft: '8px' }} />
      )}
    </div>
    <div style={{ fontSize: '0.85rem', color: '#b8c1ec' }}>Epic: {player.epicUsername}</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 10px', borderRadius: '20px', background: player.isReady ? 'rgba(81, 207, 102, 0.2)' : 'rgba(255, 255, 255, 0.1)', color: player.isReady ? '#51cf66' : '#b8c1ec', fontSize: '0.8rem', marginTop: '4px', width: 'fit-content' }}>
      {player.isReady ? (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: '14px', height: '14px' }}>
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
          Ready
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: '14px', height: '14px' }}>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
          </svg>
          Not Ready
        </>
      )}
    </div>
    {player.id === currentUser?.uid && match.status === 'ready' && (
      <ReadyUpButton
        matchId={matchId}
        isReady={player.isReady}
        {...(isPartyWager ? { userId: player.id } : { isHost: player.id === match.hostId })}
      />
    )}
  </div>
));

const PlayerUsername = styled.div`
  font-size: 0.85rem;
  color: #b8c1ec;
`;

const PlayerStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  border-radius: 20px;
  background: ${props => props.$isReady ? 'rgba(81, 207, 102, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.$isReady ? '#51cf66' : '#b8c1ec'};
  font-size: 0.8rem;
  margin-top: 4px;
  width: fit-content;
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

const ActionArea = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
`;

const ActionButton = styled.button`
  background: ${props => props.$secondary ? 'transparent' : 'linear-gradient(90deg, #A259F7 0%, #00FFD0 100%)'};
  color: ${props => props.$secondary ? '#A259F7' : '#18192a'};
  border: 2px solid ${props => props.$secondary ? '#A259F7' : 'transparent'};
  padding: 0.8rem 1.5rem;
  border-radius: 10px;
  font-weight: 700;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s;
  box-shadow: ${props => props.$secondary ? 'none' : '0 10px 20px rgba(162, 89, 247, 0.13)'};
  &:hover {
    background: ${props => props.$secondary ? 'rgba(162,89,247,0.08)' : 'linear-gradient(90deg, #A259F7 0%, #00FFD0 100%)'};
    color: #fff;
    border-color: #A259F7;
  }
  &:active {
    opacity: 0.85;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AdminRequestButton = styled(ActionButton)`
  background: linear-gradient(90deg, #ff4242 0%, #ff61e6 100%);
  color: #fff;
  border: none;
  &:hover {
    background: linear-gradient(90deg, #ff4242 0%, #ff61e6 100%);
    filter: brightness(1.1);
  }
`;

const CancelButton = styled(ActionButton)`
  background: ${props => props.$confirmed ? 'rgba(255, 87, 87, 0.7)' : 'rgba(255, 87, 87, 0.4)'};
  
  &:hover {
    background: rgba(255, 87, 87, 0.8);
    box-shadow: ${props => props.$disabled ? 'none' : '0 5px 15px rgba(255, 87, 87, 0.3)'};
  }
`;

const CancelStatus = styled.div`
  background: rgba(255, 87, 87, 0.1);
  border: 1px solid rgba(255, 87, 87, 0.3);
  border-radius: 8px;
  padding: 12px 15px;
  margin-top: 10px;
  color: #ff5757;
  font-size: 0.9rem;
  text-align: center;
`;

const CancelActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 20px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  border: 1px solid rgba(255, 87, 87, 0.3);
`;

const CancelTitle = styled.div`
  font-weight: bold;
  font-size: 1.1rem;
  margin-bottom: 10px;
  color: #ff5757;
  text-align: center;
`;

const CancelDescription = styled.div`
  color: #b8c1ec;
  font-size: 0.9rem;
  margin-bottom: 15px;
  text-align: center;
`;

const RulesSection = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(79, 172, 254, 0.3);
`;

const RulesTabs = styled.div`
  display: flex;
  margin-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    gap: 0.5rem;
  }
`;

const RuleTab = styled.div`
  padding: 0.8rem 1.2rem;
  cursor: pointer;
  position: relative;
  color: ${props => props.$active ? '#4facfe' : '#b8c1ec'};
  
  &::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 100%;
    height: 2px;
    background: ${props => props.$active ? '#4facfe' : 'transparent'};
  }
  
  &:hover {
    color: ${props => props.$active ? '#4facfe' : 'rgba(79, 172, 254, 0.7)'};
  }
`;

const RulesContent = styled.div`
  line-height: 1.6;
  
  h4 {
    color: #4facfe;
    margin-top: 1.2rem;
    margin-bottom: 0.5rem;
    font-size: 1.1rem;
  }
  
  h4:first-child {
    margin-top: 0.5rem;
  }
  
  p {
    margin-bottom: 1rem;
  }
  
  ul {
    padding-left: 1.2rem;
    margin-bottom: 1rem;
  }
  
  li {
    margin-bottom: 0.5rem;
  }
`;

const RulesTitle = styled.h3`
  font-size: 1.4rem;
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 1rem;
  text-align: center;
`;

const ChatSection = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

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

// Add these styled-components above the WagerMatch component:

const StickyActionBar = styled.div`
  position: sticky;
  bottom: 0;
  left: 0;
  width: 100%;
  background: linear-gradient(90deg, #18192a 80%, #1a1a2e 100%);
  box-shadow: 0 -2px 16px 0 rgba(79, 172, 254, 0.08);
  padding: 1.2rem 0 1.2rem 0;
  z-index: 100;
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
`;

const PlaceholderCard = styled.div`
  background: rgba(255,255,255,0.07);
  border: 2px dashed #4facfe;
  border-radius: 12px;
  padding: 1.2rem 1.5rem;
  margin-bottom: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #b8c1ec;
  font-size: 1.1rem;
  opacity: 0.6;
  min-height: 70px;
  font-weight: 600;
  gap: 0.7rem;
`;

const ChatToggleMobile = styled.button`
  display: none;
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #A259F7 0%, #00FFD0 100%);
  border: none;
  color: #fff;
  font-size: 1.2rem;
  cursor: pointer;
  z-index: 1001;
  box-shadow: 0 4px 15px rgba(162, 89, 247, 0.3);
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(162, 89, 247, 0.4);
  }
  
  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const MobileOverlay = styled.div`
  display: none;
  
  @media (max-width: 768px) {
    display: ${props => props.$open ? 'block' : 'none'};
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(2px);
    z-index: 999;
  }
`;

const WagerMatch = () => {
  const { matchId } = useParams();
  const { currentUser } = useAuth();
  const { balance, refreshBalance } = useTokens();
  const navigate = useNavigate();
  const notification = useNotification();
  const location = useLocation();
  
  // Check if the user is a spectator (via URL parameter)
  const [isSpectator, setIsSpectator] = useState(false);
  
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const [currentStep, setCurrentStep] = useState(1);
  const [hostReady, setHostReady] = useState(false);
  const [guestReady, setGuestReady] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [hostCancelRequested, setHostCancelRequested] = useState(false);
  const [guestCancelRequested, setGuestCancelRequested] = useState(false);
  const [cancelInProgress, setCancelInProgress] = useState(false);
  const [userMap, setUserMap] = useState({});
  const [usersLoading, setUsersLoading] = useState(false);
  const [showAdminRequestModal, setShowAdminRequestModal] = useState(false);
  const [hostingTeam, setHostingTeam] = useState(null); // 'host' or 'guest'
  const [coinFlipPerformed, setCoinFlipPerformed] = useState(false);
  const [refundNotificationShown, setRefundNotificationShown] = useState(false);
  const [mobilechatOpen, setMobilechatOpen] = useState(false);
  
  // Player cosmetics state
  const [playerCosmetics, setPlayerCosmetics] = useState({});
  
  // Function to fetch cosmetics for all players
  const fetchPlayerCosmetics = async (userIds) => {
    if (!userIds || userIds.length === 0) return;
    try {
      const cosmeticsMap = {};
      await Promise.all(userIds.map(async (userId) => {
        try {
          const cosmeticDoc = await getDoc(doc(db, 'userCosmetics', userId));
          if (cosmeticDoc.exists()) {
            const cosmeticData = cosmeticDoc.data();
            const equipped = cosmeticData.equipped || {};
            const owned = cosmeticData.owned || [];
            // Only set nameplate if equipped and owned
            let nameplate = null;
            if (equipped.nameplate && owned.includes(equipped.nameplate)) {
              nameplate = findCosmeticById(equipped.nameplate);
            }
            cosmeticsMap[userId] = {
              nameplate,
              flair: equipped.flair && owned.includes(equipped.flair) ? findCosmeticById(equipped.flair) : null,
              callingCard: equipped.callingCard && owned.includes(equipped.callingCard) ? findCosmeticById(equipped.callingCard) : null
            };
          }
        } catch (error) {
          // No cosmetics found for user
        }
      }));
      setPlayerCosmetics(cosmeticsMap);
    } catch (error) {
      console.error('Error fetching player cosmetics:', error);
    }
  };
  
  // Use the full refund status from the hook
  const { 
    isRefundProcessed, 
    isRefundRequested, 
    isRefundInProgress, 
    refundError,
    checkRefundStatus,
    requestRefund
  } = useMatchRefund(
    match, 
    matchId, 
    match?.status === 'cancelled'
  );
  
  // Refresh token balance when refund is processed (only once per refund)
  useEffect(() => {
    if (isRefundProcessed && currentUser && !refundNotificationShown) {
      refreshBalance();
      notification.addNotification('Refund processed! Your tokens have been returned.', 'success');
      setRefundNotificationShown(true);
    }
  }, [isRefundProcessed, currentUser, refreshBalance, notification, refundNotificationShown]);

  // Reset notification flag when match changes or when refund is no longer processed
  useEffect(() => {
    if (!isRefundProcessed) {
      setRefundNotificationShown(false);
    }
  }, [isRefundProcessed, matchId]);
  
  // Check for spectator mode from URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setIsSpectator(params.get('spectator') === 'true');
  }, [location]);
  
  // Set active tab based on match game mode
  useEffect(() => {
    if (!match) return;
    
    // Set the appropriate tab based on the match's game mode
    if (match.gameMode?.toLowerCase().includes('realistic')) {
      setActiveTab('realistic');
    } else if (match.gameMode?.toLowerCase().includes('box')) {
      setActiveTab('boxfights');
    } else if (match.gameMode?.toLowerCase().includes('zone')) {
      setActiveTab('zonewars');
    } else {
      setActiveTab('general');
    }
  }, [match]);
  
  // When game mode tabs are conditionally rendered, make sure we only show valid tabs
  useEffect(() => {
    // If the current tab doesn't match the game mode, switch to the appropriate one
    const isRealistic = match?.gameMode?.toLowerCase().includes('realistic');
    const isBoxFights = match?.gameMode?.includes('box');
    const isZoneWars = match?.gameMode?.includes('zone');

    if (isRealistic && activeTab !== 'realistic' && activeTab !== 'general') {
      setActiveTab('realistic');
    } else if (isBoxFights && activeTab !== 'boxfights' && activeTab !== 'general') {
      setActiveTab('boxfights');
    } else if (isZoneWars && activeTab !== 'zonewars' && activeTab !== 'general') {
      setActiveTab('zonewars');
    }
  }, [match, activeTab]);
  
  useEffect(() => {
    if (!matchId) {
      setError('Match ID is missing');
      setLoading(false);
      return;
    }
    
    const fetchMatch = async () => {
      try {
        const matchRef = doc(db, 'wagers', matchId);
        const matchDoc = await getDoc(matchRef);
        
        if (!matchDoc.exists()) {
          setError('Match not found');
          setLoading(false);
          return;
        }
        
        // Set up real-time listener for match updates
        const unsubscribe = onSnapshot(matchRef, (doc) => {
          if (doc.exists()) {
            const matchData = {
              id: doc.id,
              ...doc.data()
            };
            
            setMatch(matchData);
            setHostReady(matchData.hostReady || false);
            setGuestReady(matchData.guestReady || false);
            setHostCancelRequested(matchData.hostCancelRequested || false);
            setGuestCancelRequested(matchData.guestCancelRequested || false);
            
            // If hostingTeam is already set, use it
            if (matchData.hostingTeam) {
              setHostingTeam(matchData.hostingTeam);
              setCoinFlipPerformed(true);
            }
            
            // Determine current step based on match status
            if (matchData.status === 'waiting' || matchData.status === 'open') {
              setCurrentStep(1);
            } else if (matchData.status === 'ready') {
              setCurrentStep(2);
            } else if (matchData.status === 'playing') {
              setCurrentStep(3);
            } else if (matchData.status === 'submitting') {
              setCurrentStep(4);
            } else if (matchData.status === 'completed') {
              setCurrentStep(5);
            } else if (matchData.status === 'cancelled') {
              setCurrentStep(0); // Special case for cancelled matches
            }
            
            setLoading(false);
          }
        }, (error) => {
          console.error("Error listening to match updates:", error);
          setError('Error loading match data');
          setLoading(false);
        });
        
        return () => unsubscribe();
      } catch (err) {
        console.error('Error fetching match:', err);
        setError('Failed to load match');
        setLoading(false);
      }
    };
    
    fetchMatch();
  }, [matchId]);
  
  // Watch for ready status changes
  useEffect(() => {
    if (!match) return;
    
    const isHost = currentUser && match.hostId === currentUser.uid;
    const isGuest = currentUser && match.guestId === currentUser.uid;
    const isParticipant = isHost || isGuest;
    
    // Debug logging removed for production
    
    // Check if all players are ready using the utility function
    if (match.status === 'ready' && areAllPlayersReady(match) && !coinFlipPerformed && !match.hostingTeam) {
      
      // Perform coin flip to determine hosting team
      const performCoinFlip = async () => {
        try {
          // Double-check that coin flip hasn't been performed yet by checking the database
          const matchRef = doc(db, 'wagers', matchId);
          const currentMatchDoc = await getDoc(matchRef);
          
          if (!currentMatchDoc.exists()) {
            return;
          }
          
          const currentMatchData = currentMatchDoc.data();
          
          // If hostingTeam is already set or status is no longer 'ready', skip
          if (currentMatchData.hostingTeam || currentMatchData.status !== 'ready') {
            setHostingTeam(currentMatchData.hostingTeam);
            setCoinFlipPerformed(true);
            return;
          }
          
          // Randomly select host or guest
          const hostWins = Math.random() >= 0.5;
          const winningTeam = hostWins ? 'host' : 'guest';
          
          // Coin flip completed
          
          // Update match with hosting team info - use atomic update to prevent race conditions
          await updateDoc(matchRef, {
            hostingTeam: winningTeam,
            status: 'playing',
            coinFlipPerformed: true,
            coinFlipTimestamp: new Date(),
            updatedAt: new Date()
          });
          
          // Set local state
          setHostingTeam(winningTeam);
          setCoinFlipPerformed(true);
          
          // Get appropriate team names
          let hostTeamName = match.hostName || 'Host team';
          let guestTeamName = match.guestName || 'Guest team';
          
          // If it's a party wager, use the party names
          if (match.isPartyWager) {
            if (match.partyMembers && match.partyMembers.length > 0) {
              // Try to find the leader's name
              const hostLeader = match.partyMembers.find(m => m.isLeader);
              if (hostLeader) {
                hostTeamName = `${hostLeader.displayName || 'Unknown'}'s team`;
              }
            }
            
            // For guest team, try to find the first participant who's not in host team
            if (Array.isArray(match.participants) && match.participants.length > 0 && 
                Array.isArray(match.partyMembers)) {
                
              const hostIds = match.partyMembers.map(m => m.id);
              const guestIds = match.participants.filter(id => !hostIds.includes(id));
              
              if (guestIds.length > 0 && userMap[guestIds[0]]) {
                guestTeamName = `${userMap[guestIds[0]].displayName || 'Unknown'}'s team`;
              }
            }
          }
          
          // Add system message to chat - only if coin flip was successful
          const chatRef = collection(db, 'wager_chats');
          await addDoc(chatRef, {
            wagerId: matchId,
            senderId: 'system',
            senderName: 'System',
            content: ` Coin flip result: ${hostWins ? hostTeamName : guestTeamName} will host the lobby. Good luck!`,
            isSystem: true,
            timestamp: new Date()
          });
          
        } catch (error) {
          console.error('Error performing coin flip:', error);
          // If there was an error, don't set coinFlipPerformed so it can be retried
        }
      };
      
      performCoinFlip();
    }
  }, [match, currentUser, matchId, coinFlipPerformed, userMap]);
  
  // Watch for cancel requests from both players
  useEffect(() => {
    if (!match) return;
    
    // If both players have requested to cancel, update the match status
    if (hostCancelRequested && guestCancelRequested && match.status !== 'cancelled' && !cancelInProgress) {
      const cancelMatch = async () => {
        try {
          setCancelInProgress(true);
          const matchRef = doc(db, 'wagers', matchId);
          
          // Double-check that the match hasn't already been cancelled
          const currentMatchDoc = await getDoc(matchRef);
          if (!currentMatchDoc.exists() || currentMatchDoc.data().status === 'cancelled') {
            setCancelInProgress(false);
            return;
          }
          
          // Update the match status to cancelled
          await updateDoc(matchRef, {
            status: 'cancelled',
            previousStatus: match.status, // Store the previous status to help refund logic
            cancelledAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            // Don't set refundInProgress here - let the cloud function handle it
          });
          
          // Add a system message to the chat - only once
          const chatRef = collection(db, 'wager_chats');
          await addDoc(chatRef, {
            wagerId: matchId,
            senderId: 'system',
            senderName: 'System',
            content: `Match has been cancelled by mutual agreement. ${match.amount} tokens will be refunded to both players.`,
            isSystem: true,
            timestamp: serverTimestamp()
          });
          
          // Check refund status after a short delay to allow cloud function to run
          setTimeout(() => {
            checkRefundStatus();
          }, 5000);
          
          setCancelInProgress(false);
        } catch (error) {
          console.error('Error cancelling match:', error);
          setCancelInProgress(false);
        }
      };
      
      cancelMatch();
    }
  }, [hostCancelRequested, guestCancelRequested, match, matchId, checkRefundStatus, cancelInProgress]);
  
  const handleReadyChange = async (isReady) => {
    // This function will be called when the user's ready status changes
    // The actual update is handled in the ReadyUpButton component
    
    // The coin flip logic in useEffect will handle the status change when all players are ready
    // No need to manually update status here since the useEffect will trigger
  };
  
  const handleShareMatch = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Match link copied to clipboard!');
  };
  
  const handleSubmitResults = () => {
    setShowResultsModal(true);
  };
  
  const handleResultSubmitted = (resultData) => {
    // Handle any additional logic after results are submitted
    // For example, update UI or redirect
  };
  
  const handleCancelRequest = async () => {
    if (!match || !currentUser) return;
    
    try {
      const matchRef = doc(db, 'wagers', matchId);
      const isHost = currentUser.uid === match.hostId;
      const isGuest = currentUser.uid === match.guestId;
      
      // For party wagers, only allow party leaders to send cancel messages
      if (match.isPartyWager) {
        const isPartyLeader = isUserPartyLeader(match, currentUser.uid);
        if (!isPartyLeader) {
          return;
        }
      }
      
      // Update the appropriate cancel request flag
      if (isHost) {
        await updateDoc(matchRef, {
          hostCancelRequested: !hostCancelRequested,
          updatedAt: serverTimestamp()
        });
        
        // Add a system message to the chat
        const chatRef = collection(db, 'wager_chats');
        await addDoc(chatRef, {
          wagerId: matchId,
          senderId: 'system',
          senderName: 'System',
          content: hostCancelRequested 
            ? `${currentUser.displayName || 'Host'} has withdrawn their request to cancel the match.` 
            : `${currentUser.displayName || 'Host'} has requested to cancel the match.`,
          isSystem: true,
          timestamp: serverTimestamp()
        });
      } else if (isGuest) {
        await updateDoc(matchRef, {
          guestCancelRequested: !guestCancelRequested,
          updatedAt: serverTimestamp()
        });
        
        // Add a system message to the chat
        const chatRef = collection(db, 'wager_chats');
        await addDoc(chatRef, {
          wagerId: matchId,
          senderId: 'system',
          senderName: 'System',
          content: guestCancelRequested 
            ? `${currentUser.displayName || 'Guest'} has withdrawn their request to cancel the match.` 
            : `${currentUser.displayName || 'Guest'} has requested to cancel the match.`,
          isSystem: true,
          timestamp: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error updating cancel request:', error);
    }
  };
  
  // Fetch user info for all unique user IDs in the match
  useEffect(() => {
    if (!match) return;
    let userIds = [];
    if (match.isPartyWager && Array.isArray(match.partyMembers)) {
      userIds = [
        ...match.partyMembers.map(m => m.id),
        ...(Array.isArray(match.participants) ? match.participants.filter(uid => !match.partyMembers.some(m => m.id === uid)) : [])
      ];
    } else {
      userIds = [match.hostId, match.guestId].filter(Boolean);
    }
    userIds = Array.from(new Set(userIds));
    if (userIds.length === 0) return;
    setUsersLoading(true);
    Promise.all(userIds.map(async (uid) => {
      try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          return { id: uid, ...userDoc.data() };
        }
      } catch (e) {}
      return { id: uid, displayName: 'Unknown', photoURL: null, epicUsername: 'Unknown' };
    })).then(users => {
      const map = {};
      users.forEach(u => { map[u.id] = u; });
      setUserMap(map);
      setUsersLoading(false);
      
      // Fetch cosmetics for all users
      fetchPlayerCosmetics(userIds);
    });
  }, [match]);
  
  const handleAdminRequest = () => {
    if (!currentUser) {
      notification.addNotification('You need to be logged in to request admin assistance.', 'error');
      return;
    }
    
    setShowAdminRequestModal(true);
  };
  
  const handleSubmitAdminRequest = async (reason) => {
    try {
      if (!match || !currentUser) return;
      
      // Create a new admin request document in Firestore
      const requestRef = collection(db, 'adminRequests');
      const newRequest = {
        wagerId: match.id,
        userId: currentUser.uid,
        userDisplayName: currentUser.displayName || 'Anonymous User',
        wagerAmount: match.amount,
        wagerPartySize: match.partySize,
        reason: reason,
        status: 'pending',
        createdAt: serverTimestamp(),
        resolved: false,
        resolvedAt: null,
        resolvedBy: null
      };
      
      await addDoc(requestRef, newRequest);
      
      // Close the modal and show success message
      setShowAdminRequestModal(false);
      notification.addNotification('Admin request submitted successfully. An admin will review your request.', 'success');
    } catch (error) {
      console.error('Error submitting admin request:', error);
      notification.addNotification(`Failed to submit admin request: ${error.message}`, 'error');
    }
  };
  
  const handleCloseAdminRequestModal = () => {
    setShowAdminRequestModal(false);
  };
  
  // Check if user is an admin
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminJoinMessageSent, setAdminJoinMessageSent] = useState(false);
  
  // Check if the current user is an admin
  useEffect(() => {
    if (!currentUser) return;
    
    const checkAdminStatus = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists() && userDoc.data().isAdmin) {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };
    
    checkAdminStatus();
  }, [currentUser]);
  
  // Send an admin join message when an admin views the wager
  useEffect(() => {
    if (!isAdmin || !currentUser || !match || adminJoinMessageSent) return;
    
    const sendAdminJoinMessage = async () => {
      try {
        // Check if there's an admin request for this wager
        const requestsQuery = query(
          collection(db, 'adminRequests'),
          where('wagerId', '==', match.id),
          where('status', '==', 'in-progress'),
          where('adminId', '==', currentUser.uid),
          limit(1)
        );
        
        const requestsSnapshot = await getDocs(requestsQuery);
        
        // Only send the message if there's an active admin request assigned to this admin
        if (!requestsSnapshot.empty) {
          const chatRef = collection(db, 'wager_chats');
          await addDoc(chatRef, {
            wagerId: match.id,
            senderId: 'system',
            senderName: 'System',
            content: `Admin ${currentUser.displayName || 'Admin'} has joined the chat to assist with this wager.`,
            isSystem: true,
            timestamp: serverTimestamp()
          });
          
          setAdminJoinMessageSent(true);
        }
      } catch (error) {
        console.error('Error sending admin join message:', error);
      }
    };
    
    sendAdminJoinMessage();
  }, [isAdmin, currentUser, match, adminJoinMessageSent]);
  
  const [resultsTimer, setResultsTimer] = useState(0);
  const [resultsDeadline, setResultsDeadline] = useState(null);

  // Watch for resultsDeadline in match data
  useEffect(() => {
    if (match && match.resultsDeadline) {
      setResultsDeadline(match.resultsDeadline.toDate ? match.resultsDeadline.toDate() : new Date(match.resultsDeadline));
    } else {
      setResultsDeadline(null);
    }
  }, [match]);

  // Timer countdown effect
  useEffect(() => {
    if (!resultsDeadline) return;
    const updateTimer = () => {
      const now = new Date();
      const diff = Math.max(0, Math.floor((resultsDeadline - now) / 1000));
      setResultsTimer(diff);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [resultsDeadline]);

  const formatResultsTimer = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };
  
  // Add this useEffect after the match state is set up
  useEffect(() => {
    if (!match || !match.id) return;
    // Only nudge if status is 'submitting', deadline exists and is in the past, and only one result
    if (
      match.status === 'submitting' &&
      match.resultsDeadline &&
      match.results &&
      match.results.length === 1
    ) {
      const deadline = match.resultsDeadline.toDate ? match.resultsDeadline.toDate() : new Date(match.resultsDeadline);
      if (new Date() > deadline) {
        // Only nudge once per page load
        if (!window._wagerNudged || window._wagerNudged !== match.id) {
          window._wagerNudged = match.id;
          updateDoc(doc(db, 'wagers', match.id), { lastNudged: new Date() })
            .catch((err) => console.error('[WagerMatch] Nudge failed:', err));
        }
      }
    }
  }, [match]);
  
  // Host-only cancel for non-party 1v1s before guest joins
  const handleHostSoloCancel = async () => {
    if (!match || !currentUser) return;
    setHostSoloCancelInProgress(true);
    try {
      const matchRef = doc(db, 'wagers', matchId);
      // Double-check match is still open and no guest has joined
      const currentMatchDoc = await getDoc(matchRef);
      if (!currentMatchDoc.exists() || currentMatchDoc.data().status === 'cancelled' || currentMatchDoc.data().guestId) {
        setHostSoloCancelInProgress(false);
        setShowHostSoloCancelModal(false);
        notification.addNotification('Unable to cancel: guest has already joined or match is cancelled.', 'error');
        return;
      }
      await updateDoc(matchRef, {
        status: 'cancelled',
        previousStatus: match.status,
        cancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        cancellationReason: 'host-cancelled-before-join',
      });
      // Add a system message to the chat
      const chatRef = collection(db, 'wager_chats');
      await addDoc(chatRef, {
        wagerId: matchId,
        senderId: 'system',
        senderName: 'System',
        content: `Match was cancelled by the host before anyone joined. Entry fee refunded.`,
        isSystem: true,
        timestamp: serverTimestamp()
      });
      setShowHostSoloCancelModal(false);
      notification.addNotification('Match cancelled and entry refunded.', 'success');
    } catch (error) {
      console.error('Error cancelling match:', error);
      notification.addNotification('Error cancelling match: ' + error.message, 'error');
    } finally {
      setHostSoloCancelInProgress(false);
    }
  };
  
  const [showHostSoloCancelModal, setShowHostSoloCancelModal] = useState(false);
  const [hostSoloCancelInProgress, setHostSoloCancelInProgress] = useState(false);
  
  if (loading) {
    return (
      <MatchContainer>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <div>Loading match...</div>
        </div>
      </MatchContainer>
    );
  }
  
  if (error) {
    return (
      <MatchContainer>
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/wagers')}>Back to Wagers</button>
        </div>
      </MatchContainer>
    );
  }
  
  if (!match) {
    return (
      <MatchContainer>
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <h2>Match not found</h2>
          <button onClick={() => navigate('/wagers')}>Back to Wagers</button>
        </div>
      </MatchContainer>
    );
  }
  
  // Determine if current user is host
  const isHost = match.hostId === currentUser?.uid;
  const isGuest = match.guestId === currentUser?.uid;
  const isParticipant = isHost || isGuest || (match.isPartyWager && match.participants?.includes(currentUser?.uid));
  
  // If user is a spectator, they are not a participant regardless of their actual status
  const effectiveIsParticipant = isSpectator ? false : isParticipant;
  
  // Calculate prize and fee breakdown
  const entry = match.amount || 0;
  const numPlayers = match.partySize ? parseInt(match.partySize) || 2 : 2;
  const { feePerPlayer, totalFee, totalPrize, feePercent } = getWagerPrizeAndFee(entry, numPlayers);
  
  // --- Build teams for party wagers with real user info ---
  let hostTeam = { name: 'Team 1', players: [] };
  let guestTeam = { name: 'Team 2', players: [] };
  
  if (match.isPartyWager) {
    // Debug logging removed for production
    
    // For party wagers, build teams based on the stored party data
    
    // Build hostTeam: Use partyMembers (the original party that created the wager)
    if (Array.isArray(match.partyMembers) && match.partyMembers.length > 0) {
      hostTeam.players = match.partyMembers.map(member => {
        const user = userMap[member.id] || {};
        return {
          id: member.id,
          displayName: user.displayName || member.displayName || 'Unknown',
          photoURL: getDiscordAvatarUrl(user) || null,
          epicUsername: user.epicUsername || 'Unknown',
          isReady: getPlayerReadyStatus(match, member.id)
        };
      });
      
      // IMPORTANT FIX: If partyMembers exists but doesn't include all original party members,
      // we need to add any missing members who should be on the host team
      // This handles cases where the partyMembers data was incomplete during creation
      if (match.participants) {
        // For any status, ensure all host team members are included
        const hostMemberIds = hostTeam.players.map(p => p.id);
        
        // Find missing host team members - these should be participants who:
        // 1. Are not already in hostTeam.players
        // 2. Are not in guestPartyMembers (if it exists)
        // 3. Have valid user data
        const guestMemberIds = Array.isArray(match.guestPartyMembers) 
          ? match.guestPartyMembers.map(m => m.id) 
          : [];
          
        const missingHostMembers = match.participants.filter(participantId => 
          !hostMemberIds.includes(participantId) && 
          !guestMemberIds.includes(participantId) &&
          participantId && // Make sure ID is valid
          userMap[participantId] // Make sure user exists in userMap
        );
        
        // Add missing members to host team
        missingHostMembers.forEach(participantId => {
          const user = userMap[participantId] || {};
          // Only add if we have valid user data
          if (user.displayName || participantId === match.hostId) {
            hostTeam.players.push({
              id: participantId,
              displayName: user.displayName || 'Unknown',
              photoURL: getDiscordAvatarUrl(user) || null,
              epicUsername: user.epicUsername || 'Unknown',
              isReady: getPlayerReadyStatus(match, participantId)
            });
          }
        });
        
        // Missing host team members added if any
      }
      
      // Clean up: Remove any players with invalid IDs or no display names (except host)
      hostTeam.players = hostTeam.players.filter(player => 
        player.id && 
        (player.displayName !== 'Unknown' || player.id === match.hostId) &&
        userMap[player.id] // Ensure user exists in userMap
      );
    } else {
      // Fallback: If no partyMembers, build host team from participants
      
      if (match.hostId && userMap[match.hostId]) {
        const hostUser = userMap[match.hostId] || {};
        hostTeam.players = [{
          id: match.hostId,
          displayName: hostUser.displayName || match.hostName || 'Host',
          photoURL: getDiscordAvatarUrl(hostUser) || match.hostPhoto,
          epicUsername: hostUser.epicUsername || match.hostEpicName || 'Unknown',
          isReady: getPlayerReadyStatus(match, match.hostId)
        }];
        
        // Add other participants to host team, excluding guest party members
        if (match.participants) {
          const guestMemberIds = Array.isArray(match.guestPartyMembers) 
            ? match.guestPartyMembers.map(m => m.id) 
            : [];
            
          const remainingParticipants = match.participants.filter(id => 
            id !== match.hostId && 
            !guestMemberIds.includes(id) &&
            id && 
            userMap[id] && 
            userMap[id].displayName
          );
          
          remainingParticipants.forEach(participantId => {
            const user = userMap[participantId] || {};
            hostTeam.players.push({
              id: participantId,
              displayName: user.displayName,
              photoURL: getDiscordAvatarUrl(user) || null,
              epicUsername: user.epicUsername || 'Unknown',
              isReady: getPlayerReadyStatus(match, participantId)
            });
          });
          
          // Added valid participants to host team
        }
      }
    }
    
    // Build guestTeam: Use guestPartyMembers (the party that joined the wager)
    if (Array.isArray(match.guestPartyMembers) && match.guestPartyMembers.length > 0) {
      guestTeam.players = match.guestPartyMembers
        .filter(member => member.id && userMap[member.id]) // Only include valid members
        .map(member => {
          const user = userMap[member.id] || {};
          return {
            id: member.id,
            displayName: user.displayName || member.displayName || 'Unknown',
            photoURL: getDiscordAvatarUrl(user) || null,
            epicUsername: user.epicUsername || 'Unknown',
            isReady: getPlayerReadyStatus(match, member.id)
          };
        });
    } else {
      // Fallback: If no guestPartyMembers, build guest team from remaining participants
      // BUT make sure we don't include anyone who's already on the host team
      const hostIds = hostTeam.players.map(p => p.id);
      const guestIds = Array.isArray(match.participants) 
        ? match.participants.filter(uid => 
            !hostIds.includes(uid) && 
            uid && 
            userMap[uid] && 
            userMap[uid].displayName
          )
        : [];
      
      // Only add to guest team if there are actually guest participants
      // If the wager is still 'open', there might not be any guests yet
      if (guestIds.length > 0) {
        guestTeam.players = guestIds.map(uid => {
          const user = userMap[uid] || {};
          return {
            id: uid,
            displayName: user.displayName,
            photoURL: getDiscordAvatarUrl(user) || null,
            epicUsername: user.epicUsername || 'Unknown',
            isReady: getPlayerReadyStatus(match, uid)
          };
        });
      } else if (match.status === 'open') {
        // If wager is still open and no guests, leave guest team empty
        guestTeam.players = [];
      }
    }
    
    // Additional safety check: If somehow the host ended up on the guest team, move them back
    if (match.hostId) {
      const hostOnGuestTeam = guestTeam.players.findIndex(p => p.id === match.hostId);
      if (hostOnGuestTeam !== -1) {
        // Host found on guest team, moving to host team
        const hostPlayer = guestTeam.players.splice(hostOnGuestTeam, 1)[0];
        
        // Only add if not already on host team
        const hostAlreadyOnHostTeam = hostTeam.players.some(p => p.id === match.hostId);
        if (!hostAlreadyOnHostTeam) {
          hostTeam.players.push(hostPlayer);
        }
      }
    }
    
    // Debug logging removed for production
    
    // Final safety check: Ensure host team is never empty
    if (hostTeam.players.length === 0 && match.hostId) {
      const hostUser = userMap[match.hostId] || {};
      hostTeam.players = [{
        id: match.hostId,
        displayName: hostUser.displayName || match.hostName || 'Host',
        photoURL: getDiscordAvatarUrl(hostUser) || match.hostPhoto,
        epicUsername: hostUser.epicUsername || match.hostEpicName || 'Unknown',
        isReady: getPlayerReadyStatus(match, match.hostId)
      }];
      
      // If this is a party wager, try to add other non-guest participants
      if (match.isPartyWager && match.participants) {
        const guestMemberIds = Array.isArray(match.guestPartyMembers) 
          ? match.guestPartyMembers.map(m => m.id) 
          : [];
          
        const otherHostMembers = match.participants.filter(id => 
          id !== match.hostId && 
          !guestMemberIds.includes(id) &&
          userMap[id]?.displayName
        );
        
        otherHostMembers.forEach(participantId => {
          const user = userMap[participantId] || {};
          hostTeam.players.push({
            id: participantId,
            displayName: user.displayName,
            photoURL: getDiscordAvatarUrl(user) || null,
            epicUsername: user.epicUsername || 'Unknown',
            isReady: getPlayerReadyStatus(match, participantId)
          });
        });
        
        // Emergency rebuild: Added host team members
      }
    }
  } else {
    // Non-party wagers: Simple host vs guest
    const hostUser = userMap[match.hostId] || {};
    const guestUser = userMap[match.guestId] || {};
    
    hostTeam.players = [{
      id: match.hostId,
      displayName: hostUser.displayName || match.hostName || 'Host',
      photoURL: getDiscordAvatarUrl(hostUser) || match.hostPhoto,
      epicUsername: hostUser.epicUsername || match.hostEpicName || 'Unknown',
      isReady: getPlayerReadyStatus(match, match.hostId)
    }];
    
    guestTeam.players = [{
      id: match.guestId,
      displayName: guestUser.displayName || match.guestName || 'Guest',
      photoURL: getDiscordAvatarUrl(guestUser) || match.guestPhoto,
      epicUsername: guestUser.epicUsername || match.guestEpicName || 'Unknown',
      isReady: getPlayerReadyStatus(match, match.guestId)
    }];
  }
  
  // Move isPartyLeader logic here, after hostTeam and guestTeam are defined
  const isPartyLeader = isUserPartyLeader(match, currentUser?.uid);
  
  // Mock chat messages for demonstration
  const chatMessages = [
    {
      id: 1,
      author: 'System',
      content: 'Match created. Waiting for all players to get ready.',
      timestamp: new Date(Date.now() - 300000),
      isSystem: true
    },
    {
      id: 2,
      author: match.hostName || 'Host',
      authorId: match.hostId,
      content: 'I\'m ready to play!',
      timestamp: new Date(Date.now() - 240000)
    },
    {
      id: 3,
      author: 'System',
      content: 'All players are ready. Start competing now.',
      timestamp: new Date(Date.now() - 180000),
      isSystem: true
    }
  ];
  
  return (
    <MatchContainer>
      <MainContent>
        <MatchHeader>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {/* Debug logging removed for production */}
            <MatchTitle>
              {match.mode === 'fun'
                ? `Fun ${match.partySize || '1v1'} ${match.gameMode && !match.gameMode.toLowerCase().includes('fun') ? match.gameMode : ''}`.trim()
                : match.gameMode === 'Realistic' 
                  ? 'Finest Realistic 2 (1v1-4v4)' 
                  : match.gameMode === 'Box Fights' 
                    ? 'PRO BOX FIGHTS (1V1 TO 4V4)' 
                    : `${match.gameMode || 'Fortnite Match'} ${match.partySize || '1v1'}`}
            </MatchTitle>
            {isSpectator && (
              <div style={{
                background: 'rgba(79, 172, 254, 0.15)',
                padding: '4px 10px',
                borderRadius: '4px',
                margin: '0 0 0 15px',
                fontSize: '0.9rem',
                border: '1px solid rgba(79, 172, 254, 0.3)',
                color: '#4facfe'
              }}>
                Spectator Mode
              </div>
            )}
          </div>
          <ShareButton onClick={handleShareMatch}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.499 2.499 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5zm-8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm11 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/>
            </svg>
            Share Match
          </ShareButton>
        </MatchHeader>

        {/* Result Submission Timer - PROMINENT, TOP OF PAGE */}
        {match && match.status === 'submitting' && match.results && match.results.length === 1 && resultsDeadline && resultsTimer > 0 && (
          <div style={{
            background: 'linear-gradient(90deg, #ffe259 0%, #ffa751 100%)',
            border: '2px solid #ffb347',
            borderRadius: '12px',
            padding: '18px 24px',
            margin: '24px 0 28px 0',
            color: '#1a1a2e',
            fontSize: '1.35rem',
            fontWeight: 700,
            textAlign: 'center',
            boxShadow: '0 2px 16px 0 rgba(255, 183, 77, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            letterSpacing: '0.01em',
          }}>
            <span style={{ fontSize: '2rem', color: '#ff4757', marginRight: '10px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24"><path fill="#ff4757" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 15h-2v-2h2v2Zm0-4h-2V7h2v6Z"/></svg>
            </span>
            <span>
              <b>One player has submitted results.</b> The other player has <span style={{ color: '#ff4757', fontWeight: 900, fontSize: '1.5em' }}>{formatResultsTimer(resultsTimer)}</span> to submit their results.<br/>
              <span style={{ color: '#1a1a2e', fontWeight: 600 }}>If they do not submit in time, the first submission will stand.</span>
            </span>
          </div>
        )}
        {match && match.status === 'submitting' && match.results && match.results.length === 1 && resultsDeadline && resultsTimer === 0 && (
          <div style={{
            background: 'linear-gradient(90deg, #ff5858 0%, #f09819 100%)',
            border: '2px solid #ff4757',
            borderRadius: '12px',
            padding: '18px 24px',
            margin: '24px 0 28px 0',
            color: '#fff',
            fontSize: '1.35rem',
            fontWeight: 700,
            textAlign: 'center',
            boxShadow: '0 2px 16px 0 rgba(255, 87, 87, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            letterSpacing: '0.01em',
          }}>
            <span style={{ fontSize: '2rem', color: '#fff', marginRight: '10px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24"><path fill="#fff" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 15h-2v-2h2v2Zm0-4h-2V7h2v6Z"/></svg>
            </span>
            <span>
              <b>The deadline to submit results has passed.</b> The first submission will stand as the final result.
            </span>
          </div>
        )}

        {/* Map Code Section */}
        {match.gameMode?.toLowerCase().includes('realistic') && (
          <MapCodeSection>
            <MapCodeLabel>MAP CODE</MapCodeLabel>
            <MapCode>9854-1829-8735</MapCode>
            <MapGameMode>Finest Realistic 2 (1v1-4v4)</MapGameMode>
          </MapCodeSection>
        )}
        {match.gameMode?.toLowerCase().includes('box') && (
          <MapCodeSection>
            <MapCodeLabel>MAP CODE</MapCodeLabel>
            <MapCode>2355-0939-8965</MapCode>
            <MapGameMode>PRO BOX FIGHTS (1V1 TO 4V4)</MapGameMode>
          </MapCodeSection>
        )}
        {match.gameMode?.toLowerCase().includes('zone wars') && (
          <MapCodeSection>
            <MapCodeLabel>MAP CODE</MapCodeLabel>
            <MapCode>3537-4087-0888</MapCode>
            <MapGameMode>PRO ZONE WARS (1V1 TO 4V4)</MapGameMode>
          </MapCodeSection>
        )}
        
        <MatchInfo>
          {[{ label: 'Entry', value: `${entry} tokens`, highlight: true },
            { label: 'Prize', value: `${totalPrize} tokens`, highlight: true },
            { label: 'First To', value: match.firstTo || 'First to: 1' },
            { label: 'Round Lead', value: match.roundLead || 'None' },
            { label: 'Platform', value: match.platform || 'All' },
            { label: 'Region', value: match.region || 'NA-East' },
            { label: 'Team Size', value: match.partySize || '1v1' },
            { label: 'Loot Type', value: match.lootPool || 'Default' }
          ].map((item, idx) => (
            <InfoItem key={item.label} index={idx}>
              <InfoLabel>{item.label}</InfoLabel>
              <InfoValue $highlight={item.highlight}>{item.value}</InfoValue>
            </InfoItem>
          ))}
        </MatchInfo>
        
        {/* Optionally, add a breakdown below */}
        <div style={{marginTop: '1rem', color: '#b8c1ec', fontSize: '0.95rem'}}>
          Each player pays {entry} tokens. {feePerPlayer} tokens ({feePercent * 100}%) is taken as a site fee from each player. The winner receives {totalPrize} tokens.
        </div>
        
        <ProgressBar>
          {[1,2,3,4,5].map((step, idx) => (
            <ProgressStep key={step} $active={currentStep >= step}>
              <StepCircle $active={currentStep >= step}>
                {step}
              </StepCircle>
              <StepLabel $active={currentStep >= step}>
                {['Waiting','Ready Up','Playing','Submitting','Completed'][idx]}
              </StepLabel>
              <StepDescription>
                {[
                  'Waiting for an opponent to accept this match',
                  'All players must ready up to start competing',
                  'Start competing now',
                  'Submit your results to conclude the match',
                  'This match has concluded'
                ][idx]}
              </StepDescription>
            </ProgressStep>
          ))}
        </ProgressBar>
        
        {/* Show submitted results and screenshots if any exist - visible to all users */}
        {(match.results && match.results.length > 0) && (
          <MatchResultsViewer match={match} currentUser={currentUser} />
        )}
        
        {isParticipant && (
          <StickyActionBar>
            {(match.status === 'playing' || match.status === 'submitting') && (
              // Only party leaders can submit results in party wagers, or any participant in regular wagers
              (match.isPartyWager ? isPartyLeader : true) && (
                <ActionButton onClick={handleSubmitResults}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                  Submit Results
                </ActionButton>
              )
            )}
            {/* Only party leaders can request admin help in party wagers, or any participant in regular wagers */}
            {(match.isPartyWager ? isPartyLeader : true) && (
              <AdminRequestButton onClick={handleAdminRequest}>
                Report / Request Admin
              </AdminRequestButton>
            )}
            <ActionButton $secondary onClick={handleShareMatch}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24"><path fill="#A259F7" d="M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.499 2.499 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5zm-8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm11 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/></svg>
              Share Match
            </ActionButton>
          </StickyActionBar>
        )}
        
        <TeamsSection>
          <TeamCard $isHost={true}>
            <TeamHeader $isHost={true}>
              <h3>Match Creator</h3>
            </TeamHeader>
            <PlayersList>
              {hostTeam.players.map((player, idx) => {
                const callingCard = playerCosmetics[player.id]?.callingCard;
                return (
                  <CosmeticCallingCard
                    key={player.id || player.displayName || idx}
                    cosmetic={callingCard}
                    title={
                      <CosmeticNameplate cosmetic={playerCosmetics[player.id]?.nameplate || null}>
                        {player.displayName}
                      </CosmeticNameplate>
                    }
                    style={{ width: '100%', maxWidth: 'none', marginBottom: '1rem' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <PlayerAvatar $photoURL={player.photoURL} displayName={player.displayName} />
                      <PlayerInfo player={player} hostingTeam={hostingTeam} match={match} playerCosmetics={playerCosmetics} currentUser={currentUser} matchId={matchId} isPartyWager={match.isPartyWager} />
                    </div>
                  </CosmeticCallingCard>
                );
              })}
              {/* Empty slot placeholders */}
              {Array.from({length: (parseInt(match.partySize)||1) - hostTeam.players.length}).map((_, idx) => (
                <PlaceholderCard key={`host-placeholder-${idx}`}>
                  <span style={{fontSize:'1.5rem',opacity:0.7}}>+</span> Waiting for player
                </PlaceholderCard>
              ))}
            </PlayersList>
          </TeamCard>
          <TeamCard>
            <TeamHeader>
              <h3>Joining team</h3>
            </TeamHeader>
            <PlayersList>
              {guestTeam.players.map((player, idx) => {
                // Defensive: skip if player is invalid or is the host
                if (!player.id || player.id === match.hostId) return null;
                const callingCard = playerCosmetics[player.id]?.callingCard;
                return (
                  <CosmeticCallingCard
                    key={player.id || player.displayName || idx}
                    cosmetic={callingCard}
                    title={
                      <CosmeticNameplate cosmetic={playerCosmetics[player.id]?.nameplate || null}>
                        {player.displayName}
                      </CosmeticNameplate>
                    }
                    style={{ width: '100%', maxWidth: 'none', marginBottom: '1rem' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <PlayerAvatar $photoURL={player.photoURL} displayName={player.displayName} />
                      <PlayerInfo player={player} hostingTeam={hostingTeam} match={match} playerCosmetics={playerCosmetics} currentUser={currentUser} matchId={matchId} isPartyWager={match.isPartyWager} />
                    </div>
                  </CosmeticCallingCard>
                );
              })}
              {/* Empty slot placeholders */}
              {Array.from({length: (parseInt(match.partySize)||1) - guestTeam.players.length}).map((_, idx) => (
                <PlaceholderCard key={`guest-placeholder-${idx}`}>
                  <span style={{fontSize:'1.5rem',opacity:0.7}}>+</span> Waiting for player
                </PlaceholderCard>
              ))}
            </PlayersList>
          </TeamCard>
        </TeamsSection>
        
        {match && !match.isPartyWager && isHost && !match.guestId && match.status !== 'completed' && match.status !== 'cancelled' && (
          <CancelActions>
            <CancelTitle>Cancel Match</CancelTitle>
            <CancelDescription>
              You can cancel this match and receive a full refund since no one has joined yet.
            </CancelDescription>
            <CancelButton
              $danger
              $disabled={hostSoloCancelInProgress}
              onClick={() => setShowHostSoloCancelModal(true)}
            >
              {hostSoloCancelInProgress ? 'Cancelling...' : 'Cancel Match'}
            </CancelButton>
            <Modal
              open={showHostSoloCancelModal}
              onClose={() => setShowHostSoloCancelModal(false)}
              aria-labelledby="host-solo-cancel-modal-title"
              aria-describedby="host-solo-cancel-modal-description"
            >
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: '#18192a',
                color: '#fff',
                padding: '2rem',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                minWidth: 320,
                maxWidth: '90vw',
              }}>
                <h2 id="host-solo-cancel-modal-title" style={{marginTop:0}}>Cancel Match?</h2>
                <p id="host-solo-cancel-modal-description">Are you sure you want to cancel this match? Your entry fee will be refunded. This cannot be undone.</p>
                <div style={{display:'flex',gap:'1rem',marginTop:'2rem',justifyContent:'flex-end'}}>
                  <Button variant="contained" color="error" onClick={handleHostSoloCancel} disabled={hostSoloCancelInProgress}>
                    {hostSoloCancelInProgress ? 'Cancelling...' : 'Yes, Cancel Match'}
                  </Button>
                  <Button variant="outlined" onClick={() => setShowHostSoloCancelModal(false)} disabled={hostSoloCancelInProgress}>
                    No, Go Back
                  </Button>
                </div>
              </div>
            </Modal>
          </CancelActions>
        )}
        
        {match && match.status === 'cancelled' && (
          <CancelActions>
            <CancelTitle>Match Cancelled</CancelTitle>
            <CancelDescription>
              This match has been cancelled by mutual agreement.
            </CancelDescription>
            
            <div 
              style={{ 
                marginTop: '1rem', 
                padding: '0.8rem', 
                borderRadius: '8px',
                background: isRefundProcessed 
                  ? 'rgba(81, 207, 102, 0.1)' 
                  : isRefundInProgress 
                    ? 'rgba(255, 193, 7, 0.1)'
                    : refundError
                      ? 'rgba(255, 87, 87, 0.1)'
                      : 'rgba(255, 193, 7, 0.1)',
                border: isRefundProcessed 
                  ? '1px solid rgba(81, 207, 102, 0.3)' 
                  : isRefundInProgress 
                    ? '1px solid rgba(255, 193, 7, 0.3)'
                    : refundError
                      ? '1px solid rgba(255, 87, 87, 0.3)'
                      : '1px solid rgba(255, 193, 7, 0.3)',
                color: isRefundProcessed 
                  ? '#51cf66' 
                  : isRefundInProgress 
                    ? '#ffc107'
                    : refundError
                      ? '#ff5757'
                      : '#ffc107'
              }}
            >
              {isRefundProcessed ? (
                <>
                  <strong>Refund Completed</strong>
                  <p>{match.amount} tokens have been refunded to both players.</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                      {match.refundedAt ? new Date(match.refundedAt.seconds * 1000).toLocaleString() : 'Unknown time'}
                    </span>
                    <ActionButton 
                      $secondary 
                      style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                      onClick={refreshBalance}
                    >
                      Refresh Balance
                    </ActionButton>
                  </div>
                </>
              ) : isRefundInProgress ? (
                <>
                  <strong>Refund In Progress</strong>
                  <p>Your refund is being processed. This may take a moment.</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                      Started: {match.refundStartedAt ? new Date(match.refundStartedAt.seconds * 1000).toLocaleString() : 'Unknown'}
                    </span>
                    <ActionButton 
                      $secondary 
                      style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                      onClick={checkRefundStatus}
                    >
                      Check Status
                    </ActionButton>
                  </div>
                </>
              ) : isRefundRequested ? (
                <>
                  <strong>Refund Requested</strong>
                  <p>A refund request has been submitted and will be processed shortly.</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                      Requested: {match.refundRequestedAt ? new Date(match.refundRequestedAt.seconds * 1000).toLocaleString() : 'Just now'}
                    </span>
                    <ActionButton 
                      $secondary 
                      style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                      onClick={checkRefundStatus}
                    >
                      Check Status
                    </ActionButton>
                  </div>
                </>
              ) : refundError ? (
                <>
                  <strong>Refund Error</strong>
                  <p>There was an error processing the refund: {refundError}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', gap: '0.5rem' }}>
                    <ActionButton
                      onClick={checkRefundStatus}
                      style={{ flex: '1', padding: '6px 10px', fontSize: '0.9rem' }}
                      $secondary
                    >
                      Check Status
                    </ActionButton>
                    <ActionButton
                      onClick={requestRefund}
                      style={{ flex: '1', padding: '6px 10px', fontSize: '0.9rem' }}
                    >
                      Retry Refund Request
                    </ActionButton>
                  </div>
                </>
              ) : (
                <>
                  <strong>Refund Pending</strong>
                  <p>Refund will begin processing momentarily. Please wait.</p>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <ActionButton 
                      $secondary 
                      style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                      onClick={checkRefundStatus}
                    >
                      Check Status
                    </ActionButton>
                  </div>
                </>
              )}
            </div>
          </CancelActions>
        )}
        
        <RulesSection>
          <RulesTitle>
            {match.gameMode?.toLowerCase().includes('realistic') ? 'Realistic Mode Rules' : 
             match.gameMode?.toLowerCase().includes('box') ? 'Box Fights Rules' : 
             match.gameMode?.toLowerCase().includes('zone') ? 'Zone Wars Rules' : 
             'General Match Rules'}
          </RulesTitle>
          
          {/* Only show relevant tabs based on game mode */}
          {(() => {
            // Determine which game mode we're currently in
            const isRealistic = match.gameMode?.toLowerCase().includes('realistic');
            const isBoxFights = match.gameMode?.toLowerCase().includes('box');
            const isZoneWars = match.gameMode?.toLowerCase().includes('zone');
            
            // If we have a specific game mode, only show that mode + general rules
            if (isRealistic || isBoxFights || isZoneWars) {
              return (
                <RulesTabs>
                  {isRealistic && (
                    <RuleTab $active={activeTab === 'realistic'} onClick={() => setActiveTab('realistic')}>
                      Realistic Rules
                    </RuleTab>
                  )}
                  {isBoxFights && (
                    <RuleTab $active={activeTab === 'boxfights'} onClick={() => setActiveTab('boxfights')}>
                      Box Fights
                    </RuleTab>
                  )}
                  {isZoneWars && (
                    <RuleTab $active={activeTab === 'zonewars'} onClick={() => setActiveTab('zonewars')}>
                      Zone Wars
                    </RuleTab>
                  )}
                  <RuleTab $active={activeTab === 'general'} onClick={() => setActiveTab('general')}>
                    General Rules
                  </RuleTab>
                </RulesTabs>
              );
            } else {
              // If no specific game mode, show all tabs
              return (
                <RulesTabs>
                  <RuleTab $active={activeTab === 'realistic'} onClick={() => setActiveTab('realistic')}>
                    Realistic Rules
                  </RuleTab>
                  <RuleTab $active={activeTab === 'boxfights'} onClick={() => setActiveTab('boxfights')}>
                    Box Fights
                  </RuleTab>
                  <RuleTab $active={activeTab === 'zonewars'} onClick={() => setActiveTab('zonewars')}>
                    Zone Wars
                  </RuleTab>
                  <RuleTab $active={activeTab === 'general'} onClick={() => setActiveTab('general')}>
                    General Rules
                  </RuleTab>
                </RulesTabs>
              );
            }
          })()}
          
          <RulesContent>
            {(() => {
              // Default to showing content based on the match's game mode
              const isRealistic = match.gameMode?.toLowerCase().includes('realistic');
              const isBoxFights = match.gameMode?.toLowerCase().includes('box');
              const isZoneWars = match.gameMode?.toLowerCase().includes('zone');
              
              // If user has selected a tab, show that content (but only if it's available for this game mode)
              if (activeTab === 'realistic' && (isRealistic || !isBoxFights && !isZoneWars)) {
                return (
                  <>
                    <h4>MAP</h4>
                    <p>9854-1829-8735 Finest Realistic 2 (1v1-4v4)</p>
                    
                    <h4>MODE</h4>
                    <p>Default</p>
                    
                    <h4>TEAMS</h4>
                    <p>Host is denoted by crown</p>
                    
                    <h4>ROUND ELIGIBILITY</h4>
                    <ul>
                      <li>If you spawn into the playing area the round counts unless a member of the other team or your team has not.</li>
                      <li>If you are playing with random loot, you forfeit the round if you leave/disconnect at any point after you have received the loot.</li>
                      <li>If you respawn mid-round, you forfeit the round.</li>
                      <li>If you are caught opening chests, or picking up floor loot, you will forfeit the round. Ammo crates are allowed but you are not allowed to take the heals from them.</li>
                    </ul>
                  </>
                );
              } else if (activeTab === 'boxfights' && (isBoxFights || !isRealistic && !isZoneWars)) {
                return (
                  <>
                    <h4>MAP</h4>
                    <p>2355-0939-8965 PRO BOX FIGHTS (1V1 TO 4V4)</p>
                    
                    <h4>SHOTGUN</h4>
                    <p>Gold Pumps</p>
                    
                    <h4>TEAMS</h4>
                    <p>Host is denoted by crown</p>
                  </>
                );
              } else if (activeTab === 'zonewars' && (isZoneWars || !isRealistic && !isBoxFights)) {
                return (
                  <>
                    <h4>SHOTGUN</h4>
                    <p>Gold Pumps</p>
                    
                    <h4>TEAMS</h4>
                    <p>Host is denoted by crown</p>
                    
                    <h4>ROUND ELIGIBILITY</h4>
                    <ul>
                      <li>If damage is dealt the round counts no matter what.</li>
                      <li>If no players leave the portal, the round does not count.</li>
                      <li>If one or more players come out of the portals, the round counts.</li>
                    </ul>
                  </>
                );
              } else {
                return (
                  <>
                    <h4>General Rules</h4>
                    <ul>
                      <li>Be respectful to all players</li>
                      <li>No cheating or exploiting game mechanics</li>
                      <li>Report any issues immediately in the chat</li>
                      <li>The host is responsible for creating the match with the correct settings</li>
                      <li>Both teams must agree on the final result</li>
                      <li>In case of a dispute, provide video evidence if possible</li>
                    </ul>
                  </>
                );
              }
            })()}
                     </RulesContent>
         </RulesSection>
       </MainContent>
       
       <MobileOverlay $open={mobilechatOpen} onClick={() => setMobilechatOpen(false)} />
       
       <ChatSidebar $mobileOpen={mobilechatOpen}>
         <ChatSidebarHeader>
           <h3>
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
               <path d="M2.678 11.894a1 1 0 0 1 .287.801 10.97 10.97 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8.06 8.06 0 0 0 8 14c3.996 0 7-2.807 7-6 0-3.192-3.004-6-7-6S1 4.808 1 8c0 1.468.617 2.83 1.678 3.894zm-.493 3.905a21.682 21.682 0 0 1-.713.129c-.2.032-.352-.176-.273-.362a9.68 9.68 0 0 0 .244-.637l.003-.010c.248-.72.45-1.548.524-2.319C.743 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7-3.582 7-8 7a9.06 9.06 0 0 1-2.347-.306c-.52.263-1.639.742-3.468 1.105z"/>
             </svg>
             Match Chat
           </h3>
           <div className="player-count">
             {match ? `${match.partySize || '1v1'}` : 'Loading...'}
           </div>
         </ChatSidebarHeader>
         <ChatSidebarContent>
           <WagerChatBox matchId={matchId} readOnly={isSpectator} sidebar={true} />
         </ChatSidebarContent>
       </ChatSidebar>
       
       <ChatToggleMobile onClick={() => setMobilechatOpen(!mobilechatOpen)}>
         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
           <path d="M2.678 11.894a1 1 0 0 1 .287.801 10.97 10.97 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8.06 8.06 0 0 0 8 14c3.996 0 7-2.807 7-6 0-3.192-3.004-6-7-6S1 4.808 1 8c0 1.468.617 2.83 1.678 3.894zm-.493 3.905a21.682 21.682 0 0 1-.713.129c-.2.032-.352-.176-.273-.362a9.68 9.68 0 0 0 .244-.637l.003-.010c.248-.72.45-1.548.524-2.319C.743 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7-3.582 7-8 7a9.06 9.06 0 0 1-2.347-.306c-.52.263-1.639.742-3.468 1.105z"/>
         </svg>
       </ChatToggleMobile>
       
       {/* Results Modal */}
       <SubmitResultsModal
         isOpen={showResultsModal}
         onClose={() => setShowResultsModal(false)}
         match={match}
         onResultSubmitted={handleResultSubmitted}
       />
       
       {/* Admin Request Modal */}
       {showAdminRequestModal && (
         <AdminRequestModal 
           isOpen={showAdminRequestModal}
           wager={match}
           onClose={handleCloseAdminRequestModal}
           onSubmit={handleSubmitAdminRequest}
         />
       )}
    </MatchContainer>
  );
};

export default WagerMatch; 