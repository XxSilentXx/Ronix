import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getFirestore, collection, query, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { LoadingIndicator, ErrorMessage } from '../components/LoadingIndicator';
import { useAuth } from '../contexts/AuthContext';
import { getXpLeaderboard } from '../firebase/xpSystem';
import UserAvatar from '../components/UserAvatar';
import { getAvatarUrl } from '../utils/avatarUtils';
import RankBadge from '../components/RankBadge';
import CosmeticFlair from '../components/CosmeticFlair';
import { findCosmeticById } from '../data/cosmeticData';
import { TIERS, XP_LEVELS } from '../firebase/xpSystem';
import { FaCrown, FaMedal } from 'react-icons/fa';

const LeaderboardContainer = styled.div`
  min-height: 100vh;
  background: #131124;
  color: #fff;
  padding: 2rem 0;
  position: relative;
  overflow: hidden;
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: url('https://fortnite-api.com/images/cosmetics/br/character_default.png') no-repeat right bottom/auto 60vh, url('https://fortnite-api.com/images/cosmetics/br/backpack_default.png') no-repeat left 40%/auto 40vh;
    opacity: 0.10;
    z-index: 0;
    pointer-events: none;
  }
`;

const LeaderboardHeader = styled.div`
  text-align: center;
  margin-bottom: 3rem;
  position: relative;
  z-index: 1;
  h1 {
    font-size: 3.5rem;
    background: linear-gradient(90deg, #4facfe 0%, #ff61e6 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    font-family: 'Inter', Arial, sans-serif;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-shadow: 0 4px 24px #4facfe88;
    margin-bottom: 1rem;
  }
  p {
    color: #b8c1ec;
    font-size: 1.3rem;
    max-width: 800px;
    margin: 0 auto;
    font-weight: 600;
    text-shadow: 0 2px 8px #2b105555;
  }
`;

const TabsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
  position: relative;
  z-index: 1;
`;

const TabButton = styled.button`
  background: ${props => props.active ? 'linear-gradient(90deg, #4facfe 0%, #ff61e6 100%)' : 'rgba(255, 255, 255, 0.12)'};
  color: #fff;
  border: none;
  padding: 0.7rem 1.7rem;
  border-radius: 50px;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  transition: all 0.3s cubic-bezier(.25,1.7,.45,.87);
  box-shadow: ${props => props.active ? '0 0 16px #ff61e6cc' : 'none'};
  &:hover {
    background: linear-gradient(90deg, #ff61e6 0%, #4facfe 100%);
    color: #fff;
    box-shadow: 0 0 24px #4facfe99;
  }
`;

const FiltersContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
`;

const FilterButton = styled.button`
  background: ${props => props.active ? 'linear-gradient(90deg, #4facfe 0%, #ff61e6 100%)' : 'rgba(255, 255, 255, 0.12)'};
  color: #fff;
  border: none;
  padding: 0.7rem 1.7rem;
  border-radius: 50px;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  transition: all 0.3s cubic-bezier(.25,1.7,.45,.87);
  box-shadow: ${props => props.active ? '0 0 16px #ff61e6cc' : 'none'};
  &:hover {
    background: linear-gradient(90deg, #ff61e6 0%, #4facfe 100%);
    color: #fff;
    box-shadow: 0 0 24px #4facfe99;
  }
`;

// Token Leaderboard Components
const TokenLeaderboardTable = styled.div`
  background: rgba(44, 62, 80, 0.92);
  backdrop-filter: blur(10px);
  border-radius: 18px;
  overflow: hidden;
  border: 2px solid #4facfe;
  max-width: 1100px;
  margin: 0 auto;
  box-shadow: 0 8px 32px 0 #4facfe33;
  position: relative;
  z-index: 1;
`;

const TokenTableHeader = styled.div`
  display: grid;
  grid-template-columns: 0.5fr 2fr 1fr 1fr 1fr 1fr 1fr;
  padding: 1.2rem;
  background: linear-gradient(90deg, #4facfe 0%, #ff61e6 100%);
  font-weight: 800;
  color: #fff;
  font-size: 1.1rem;
  letter-spacing: 0.03em;
  box-shadow: 0 2px 8px #4facfe55;
  @media (max-width: 768px) {
    display: none;
  }
`;

const TokenTableRow = styled.div`
  display: grid;
  grid-template-columns: 0.5fr 2fr 1fr 1fr 1fr 1fr 1fr;
  padding: 1.2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  align-items: center;
  transition: all 0.3s cubic-bezier(.25,1.7,.45,.87);
  background: ${({ $index, $isCurrentUser }) =>
    $isCurrentUser
      ? 'rgba(162, 89, 247, 0.18)'
      : $index % 2 === 0
      ? 'rgba(44, 62, 80, 0.92)'
      : 'rgba(36, 40, 56, 0.92)'};
  box-shadow: ${({ $isCurrentUser }) =>
    $isCurrentUser ? '0 0 0 3px #A259F7, 0 0 24px #A259F799' : 'none'};
  position: relative;
  &:last-child { border-bottom: none; }
  &:hover {
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 4px 16px #ff61e655;
    transform: scale(1.01) rotate(-1deg);
  }
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 0.5rem;
    padding: 1.5rem 1rem;
    &::before {
      content: attr(data-label);
      font-weight: 600;
      color: #4facfe;
    }
  }
`;

// XP Leaderboard Layout Components
const XpLeaderboardLayout = styled.div`
  display: flex;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  
  @media (max-width: 1200px) {
    flex-direction: column;
    gap: 1.5rem;
  }
`;

const XpLeaderboardMain = styled.div`
  flex: 1;
  min-width: 0;
`;

const XpLeaderboardTable = styled.div`
  background: rgba(44, 62, 80, 0.92);
  backdrop-filter: blur(10px);
  border-radius: 18px;
  overflow: hidden;
  border: 2px solid #4facfe;
  box-shadow: 0 8px 32px 0 #4facfe33;
  position: relative;
  z-index: 1;
`;

const RankingSystemSidebar = styled.div`
  width: 350px;
  flex-shrink: 0;
  
  @media (max-width: 1200px) {
    width: 100%;
  }
`;

const XpTableHeader = styled.div`
  display: grid;
  grid-template-columns: 80px 1fr 150px 150px;
  padding: 1.2rem;
  background: linear-gradient(90deg, #4facfe 0%, #ff61e6 100%);
  font-weight: 800;
  color: #fff;
  font-size: 1.1rem;
  letter-spacing: 0.03em;
  box-shadow: 0 2px 8px #4facfe55;
  
  @media (max-width: 768px) {
    grid-template-columns: 60px 1fr 80px 80px;
  }
`;

const XpPlayerRow = styled.div`
  display: grid;
  grid-template-columns: 80px 1fr 150px 150px;
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  align-items: center;
  background: ${props => props.$isCurrentUser ? 'rgba(79, 172, 254, 0.1)' : 'transparent'};
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 4px 16px #ff61e655;
    transform: scale(1.01) rotate(-1deg);
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 60px 1fr 80px 80px;
  }
`;

// Shared Components
const RankCell = styled.div`
  font-weight: 900;
  font-size: 1.4rem;
  color: ${props => {
    if (props.$rank === 1) return '#FFD700';
    if (props.$rank === 2) return '#C0C0C0';
    if (props.$rank === 3) return '#CD7F32';
    return '#fff';
  }};
  text-shadow: 0 2px 8px #4facfe55;
`;

const PlayerCell = styled.div`
  display: flex;
  align-items: center;
  gap: 1.2rem;
  @media (max-width: 768px) {
    justify-content: space-between;
  }
`;

const PlayerInfo = styled.div`
  display: flex;
  align-items: center;
`;

const PlayerName = styled.div`
  font-weight: bold;
`;

const Username = styled.span`
  font-weight: 800;
  font-size: 1.13rem;
  color: #fff;
  letter-spacing: 0.02em;
`;

const StatCell = styled.div`
  font-weight: ${props => props.$highlight ? '900' : '600'};
  color: ${props => props.$highlight ? '#ff61e6' : '#b8c1ec'};
  font-size: 1.08rem;
  text-align: center;
`;

const LevelCell = styled.div`
  font-weight: bold;
`;

const XpCell = styled.div`
  font-weight: bold;
  color: #4facfe;
`;

const TierBadge = styled.span`
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  background: ${props => props.$color || '#cd7f32'};
  color: white;
  margin-left: 0.5rem;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #b8c1ec;
`;

// Ranking System Explanation Components
const RankingSystemSection = styled.div`
  background: linear-gradient(135deg, rgba(79, 172, 254, 0.1) 0%, rgba(255, 97, 230, 0.1) 100%);
  backdrop-filter: blur(15px);
  border: 2px solid rgba(79, 172, 254, 0.2);
  border-radius: 16px;
  padding: 1.5rem;
  position: relative;
  z-index: 1;
  box-shadow: 
    0 15px 35px rgba(79, 172, 254, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, 
      rgba(79, 172, 254, 0.05) 0%, 
      transparent 50%, 
      rgba(255, 97, 230, 0.05) 100%
    );
    border-radius: 16px;
    pointer-events: none;
  }
`;

const RankingHeader = styled.div`
  text-align: center;
  margin-bottom: 1.5rem;
  position: relative;
  z-index: 1;
  
  h2 {
    font-size: 1.6rem;
    font-weight: 700;
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 50%, #ff61e6 100%);
    background-size: 200% 200%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 0.5rem;
    letter-spacing: -0.5px;
    animation: titleShimmer 3s ease-in-out infinite alternate;
  }
  
  p {
    color: #b8c1ec;
    font-size: 0.9rem;
    margin: 0 auto;
    line-height: 1.5;
  }
  
  @keyframes titleShimmer {
    0% { background-position: 0% 50%; }
    100% { background-position: 100% 50%; }
  }
`;

const RanksGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  position: relative;
  z-index: 1;
`;

const RankCard = styled.div`
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border: 1px solid ${props => props.$tierColor}40;
  border-radius: 12px;
  padding: 1rem;
  transition: all 0.3s cubic-bezier(.25,1.7,.45,.87);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, ${props => props.$tierColor}, ${props => props.$tierColor}80);
    border-radius: 12px 12px 0 0;
  }
  
  &:hover {
    transform: translateY(-2px) scale(1.01);
    border-color: ${props => props.$tierColor}80;
    box-shadow: 0 8px 20px ${props => props.$tierColor}30;
  }
`;

const RankCardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
`;

const RankLogo = styled.div`
  width: 35px;
  height: 35px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${props => props.$tierColor}, ${props => props.$tierColor}80);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 0.9rem;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  box-shadow: 0 4px 12px ${props => props.$tierColor}40;
  position: relative;
  flex-shrink: 0;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }
  
  &::after {
    content: '';
    position: absolute;
    inset: -1px;
    background: linear-gradient(45deg, ${props => props.$tierColor}, transparent, ${props => props.$tierColor});
    border-radius: 50%;
    z-index: -1;
    animation: rankGlow 2s ease-in-out infinite alternate;
  }
  
  @keyframes rankGlow {
    0% { opacity: 0.5; }
    100% { opacity: 1; }
  }
`;

const RankInfo = styled.div`
  flex: 1;
  min-width: 0;
  
  h3 {
    font-size: 1.1rem;
    font-weight: 700;
    color: ${props => props.$tierColor};
    margin: 0 0 0.2rem 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
  
  .level-range {
    color: #b8c1ec;
    font-size: 0.8rem;
    font-weight: 600;
  }
`;

const XpRequirement = styled.div`
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 0.75rem;
  
  .xp-label {
    color: #b8c1ec;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.25rem;
  }
  
  .xp-amount {
    font-size: 1rem;
    font-weight: 700;
    color: #4facfe;
    text-shadow: 0 0 10px rgba(79, 172, 254, 0.5);
  }
  
  .xp-range {
    color: #b8c1ec;
    font-size: 0.75rem;
    margin-top: 0.2rem;
  }
`;

const HowToEarnSection = styled.div`
  background: rgba(0, 0, 0, 0.15);
  border-radius: 12px;
  padding: 1rem;
  position: relative;
  z-index: 1;
  
  h3 {
    color: #fff;
    font-size: 1rem;
    margin-bottom: 0.75rem;
    text-align: center;
  }
  
  .earning-methods {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
`;

const EarningMethod = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 0.75rem;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  .icon {
    font-size: 1.5rem;
    margin-bottom: 0.25rem;
  }
  
  .method-name {
    color: #fff;
    font-weight: 600;
    margin-bottom: 0.2rem;
    font-size: 0.8rem;
  }
  
  .xp-amount {
    color: #4facfe;
    font-size: 0.75rem;
  }
`;

// Helper function to get tier color
const getTierColor = (tier) => {
  const tierColors = {
    'Bronze': '#cd7f32',
    'Silver': '#c0c0c0',
    'Gold': '#ffd700',
    'Platinum': '#e5e4e2',
    'Diamond': '#b9f2ff',
    'Master': '#ff4500'
  };
  
  return tierColors[tier] || '#cd7f32';
};

// Helper function to get XP range for a tier
const getTierXpRange = (tierName) => {
  const tier = TIERS[tierName];
  if (!tier) return { min: 0, max: 0 };
  
  const minXp = XP_LEVELS[tier.minLevel] || 0;
  const maxLevel = tier.maxLevel === 999 ? 50 : tier.maxLevel; // Cap display at level 50
  const maxXp = XP_LEVELS[maxLevel] || 0;
  
  return { min: minXp, max: maxXp };
};

// Component to render the ranking system explanation
const RankingSystemExplanation = () => {
  return (
    <RankingSystemSection>
      <RankingHeader>
        <h2> Ranking System</h2>
        <p>
          Climb the ranks by earning XP through matches, wins, and daily logins. 
          Each tier unlocks exclusive rewards and recognition!
        </p>
      </RankingHeader>
      
      <RanksGrid>
        {Object.entries(TIERS).map(([tierName, tierData]) => {
          const xpRange = getTierXpRange(tierName);
          const tierAbbreviation = tierName.substring(0, 2).toUpperCase();
          
          return (
            <RankCard key={tierName} $tierColor={tierData.color}>
              <RankCardHeader>
                <RankLogo $tierColor={tierData.color}>
                  <img 
                    src={`/assets/ranks/${tierName.toLowerCase()}.png`}
                    alt={`${tierName} Rank`}
                    onError={(e) => {
                      // Fallback to text if image fails to load
                      e.target.style.display = 'none';
                      e.target.parentElement.querySelector('.rank-fallback').style.display = 'flex';
                    }}
                    style={{ display: 'block' }}
                  />
                  <div 
                    className="rank-fallback" 
                    style={{ 
                      display: 'none', 
                      width: '100%', 
                      height: '100%', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      position: 'absolute',
                      top: 0,
                      left: 0
                    }}
                  >
                    {tierAbbreviation}
                  </div>
                </RankLogo>
                <RankInfo $tierColor={tierData.color}>
                  <h3>{tierName}</h3>
                  <div className="level-range">
                    Level {tierData.minLevel} - {tierData.maxLevel === 999 ? '50+' : tierData.maxLevel}
                  </div>
                </RankInfo>
              </RankCardHeader>
              
              <XpRequirement>
                <div className="xp-label">XP Requirement</div>
                <div className="xp-amount">
                  {xpRange.min.toLocaleString()} XP
                </div>
                {tierData.maxLevel !== 999 && (
                  <div className="xp-range">
                    Up to {xpRange.max.toLocaleString()} XP
                  </div>
                )}
              </XpRequirement>
            </RankCard>
          );
        })}
      </RanksGrid>
      
      <HowToEarnSection>
        <h3> How to Earn XP</h3>
        <div className="earning-methods">
          <EarningMethod>
            <div className="icon"></div>
            <div className="method-name">Winning Matches</div>
            <div className="xp-amount">50-200 XP</div>
          </EarningMethod>
          <EarningMethod>
            <div className="icon"></div>
            <div className="method-name">Participating in Matches</div>
            <div className="xp-amount">10-50 XP</div>
          </EarningMethod>
          <EarningMethod>
            <div className="icon"></div>
            <div className="method-name">Daily Login</div>
            <div className="xp-amount">5-25 XP</div>
          </EarningMethod>
          <EarningMethod>
            <div className="icon"></div>
            <div className="method-name">Login Streaks</div>
            <div className="xp-amount">Bonus XP</div>
          </EarningMethod>
        </div>
      </HowToEarnSection>
    </RankingSystemSection>
  );
};

// Helper function to get Discord avatar URL
const getDiscordAvatarUrl = (player) => {
  if (!player.discordId || !player.discordAvatar) return null;
  return `https://cdn.discordapp.com/avatars/${player.discordId}/${player.discordAvatar}.png`;
};

const CombinedLeaderboard = () => {
  // State variables
  const [activeTab, setActiveTab] = useState('tokens'); // 'tokens' or 'xp'
  const [tokensLeaderboard, setTokensLeaderboard] = useState([]);
  const [xpLeaderboard, setXpLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('Earnings');
  const { currentUser } = useAuth();

  // Fetch token leaderboard data
  useEffect(() => {
    if (activeTab !== 'tokens') return;

    setLoading(true);
    setError(null);
    
    const fetchLeaderboard = async () => {
      try {
        console.log('[COMBINED LEADERBOARD] Fetching data for filter:', filter);
        const db = getFirestore();
        
        // Get user stats based on filter
        let orderField = 'totalEarnings';
        switch(filter) {
          case 'Earnings':
            orderField = 'totalEarnings';
            break;
          case 'Wins':
            orderField = 'matchesWon';
            break;
          case 'Win Rate':
            orderField = 'winRate';
            break;
          case 'Matches':
            orderField = 'matchesPlayed';
            break;
          default:
            orderField = 'totalEarnings';
        }
        
        // Query userStats collection directly
        const statsQuery = query(
          collection(db, 'userStats'),
          orderBy(orderField, 'desc'),
          limit(20)
        );
        
        const statsSnapshot = await getDocs(statsQuery);
        console.log('[COMBINED LEADERBOARD] Found', statsSnapshot.size, 'user stats');
        
        const leaderboardData = [];
        
        // Process each user stat document
        for (const statDoc of statsSnapshot.docs) {
          try {
            const stats = statDoc.data();
            const userId = statDoc.id;
            
            // Get user profile data
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (!userDoc.exists()) continue;
            
            const userData = userDoc.data();
            
            // Create user object with combined data
            const user = {
              uid: userId,
              username: userData.displayName || 'Unknown Player',
              photoURL: userData.photoURL || '',
              tokenBalance: userData.tokenBalance || 0,
              discordId: userData.discordId,
              discordAvatar: userData.discordAvatar,
              matches: stats.matchesPlayed || 0,
              wins: stats.matchesWon || 0,
              earnings: stats.totalEarnings || 0,
              winRate: stats.winRate || 0
            };
            
            leaderboardData.push(user);
          } catch (playerError) {
            console.error('[COMBINED LEADERBOARD] Error processing player:', playerError);
          }
        }
        
        console.log('[COMBINED LEADERBOARD] Successfully loaded', leaderboardData.length, 'players');
        setTokensLeaderboard(leaderboardData);
        setError(null);
        
      } catch (fetchError) {
        console.error('[COMBINED LEADERBOARD] Fetch error:', fetchError);
        setError('Failed to load leaderboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [activeTab, filter]);

  // Fetch XP leaderboard data
  useEffect(() => {
    if (activeTab !== 'xp') return;

    setLoading(true);
    setError(null);
    
    const fetchXpLeaderboard = async () => {
      try {
        // Try using the imported function first
        const data = await getXpLeaderboard(20); // Get top 20 players
        setXpLeaderboard(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching XP leaderboard:', err);
        
        // Fallback to manual query if the function fails
        try {
          const db = getFirestore();
          const usersRef = collection(db, 'users');
          
          // Try direct Firestore query without index requirement
          const querySnapshot = await getDocs(query(usersRef, limit(50)));
          
          const allUsers = [];
          querySnapshot.forEach(doc => {
            const userData = doc.data();
            allUsers.push({
              id: doc.id,
              displayName: userData.displayName || 'Unknown Player',
              photoURL: userData.photoURL || '',
              xpTotal: userData.xpTotal || 0,
              currentLevel: userData.currentLevel || 1,
              currentTier: userData.currentTier || 'Bronze'
            });
          });
          
          // Sort manually
          allUsers.sort((a, b) => b.xpTotal - a.xpTotal);
          
          // Take top 20
          setXpLeaderboard(allUsers.slice(0, 20));
          setError(null);
        } catch (fallbackErr) {
          console.error('Fallback error fetching XP leaderboard:', fallbackErr);
          setError("Failed to load XP leaderboard data. Please try again later.");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchXpLeaderboard();
  }, [activeTab]);

  // Render token leaderboard
  const renderTokenLeaderboard = (currentUser) => {
    const currentUserIndex = tokensLeaderboard.findIndex(p => currentUser && p.uid === currentUser.uid);
    const visibleRows = tokensLeaderboard.map((player, index) => {
      const rank = index + 1;
      let icon = null;
      if (rank === 1) icon = <FaCrown style={{ color: '#FFD700', marginRight: 4, verticalAlign: 'middle' }} title="#1" />;
      else if (rank === 2) icon = <FaMedal style={{ color: '#C0C0C0', marginRight: 4, verticalAlign: 'middle' }} title="#2" />;
      else if (rank === 3) icon = <FaMedal style={{ color: '#CD7F32', marginRight: 4, verticalAlign: 'middle' }} title="#3" />;
      const isCurrentUser = currentUser && player.uid === currentUser.uid;
      return (
        <TokenTableRow key={player.uid} data-label={player.username} $index={index} $isCurrentUser={isCurrentUser}>
          <RankCell $rank={rank}>{icon}#{rank}</RankCell>
          <PlayerCell>
            <UserAvatar 
              userId={player.uid}
              fallbackUrl={player.photoURL || getDiscordAvatarUrl(player)}
              size={44}
              initial={player.username?.charAt(0)}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Username>{player.username}</Username>
              <RankBadge userId={player.uid} size={22} marginLeft="0.25rem" />
            </div>
          </PlayerCell>
          <StatCell $highlight>{player.tokenBalance?.toLocaleString() || 0}</StatCell>
          <StatCell>{player.matches?.toLocaleString() || 0}</StatCell>
          <StatCell>{player.wins?.toLocaleString() || 0}</StatCell>
          <StatCell>
            {player.winRate ? `${(player.winRate * 100).toFixed(1)}%` : '0%'}
          </StatCell>
          <StatCell>${player.earnings?.toLocaleString() || 0}</StatCell>
        </TokenTableRow>
      );
    });
    let spotlightRow = null;
    if (currentUser && currentUserIndex === -1) {
      spotlightRow = (
        <TokenTableRow $index={-1} $isCurrentUser={true} style={{ marginTop: 8 }}>
          <RankCell $rank={null}>You</RankCell>
          <PlayerCell>
            <UserAvatar userId={currentUser.uid} fallbackUrl={currentUser.photoURL} size={44} initial={currentUser.displayName?.charAt(0)} />
            <Username>{currentUser.displayName || 'You'}</Username>
          </PlayerCell>
          <StatCell>-</StatCell>
          <StatCell>-</StatCell>
          <StatCell>-</StatCell>
          <StatCell>-</StatCell>
          <StatCell $highlight={filter === 'Earnings'}>-</StatCell>
        </TokenTableRow>
      );
    }
    return (
      <>
        <FiltersContainer>
          <FilterButton 
            active={filter === 'Earnings'} 
            onClick={() => setFilter('Earnings')}
          >
            Earnings
          </FilterButton>
          <FilterButton 
            active={filter === 'Wins'} 
            onClick={() => setFilter('Wins')}
          >
            Wins
          </FilterButton>
          <FilterButton 
            active={filter === 'Win Rate'} 
            onClick={() => setFilter('Win Rate')}
          >
            Win Rate
          </FilterButton>
          <FilterButton 
            active={filter === 'Matches'} 
            onClick={() => setFilter('Matches')}
          >
            Matches
          </FilterButton>
        </FiltersContainer>
        <TokenLeaderboardTable>
          <TokenTableHeader>
            <div>Rank</div>
            <div>Player</div>
            <div>Tokens</div>
            <div>Matches</div>
            <div>Wins</div>
            <div>Win Rate</div>
            <div>Earnings</div>
          </TokenTableHeader>
          {loading ? (
            <LoadingMessage>Loading leaderboard data...</LoadingMessage>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#ff6b6b' }}>
              <p>{error}</p>
            </div>
          ) : tokensLeaderboard.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#b8c1ec' }}>
              <p>No leaderboard data available. Be the first to join!</p>
            </div>
          ) : (
            <>
              {visibleRows}
              {spotlightRow}
            </>
          )}
        </TokenLeaderboardTable>
      </>
    );
  };

  // Render XP leaderboard
  const renderXpLeaderboard = () => {
    return (
      <XpLeaderboardLayout>
        <XpLeaderboardMain>
          <XpLeaderboardTable>
            <XpTableHeader>
              <div>Rank</div>
              <div>Player</div>
              <div>Level</div>
              <div>XP</div>
            </XpTableHeader>
            
            {loading ? (
              <LoadingMessage>Loading leaderboard data...</LoadingMessage>
            ) : error ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#ff6b6b' }}>
                <p>{error}</p>
              </div>
            ) : xpLeaderboard.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#b8c1ec' }}>
                <p>No XP leaderboard data available. Be the first to earn XP!</p>
              </div>
            ) : (
              xpLeaderboard.map((player, index) => (
                <XpPlayerRow 
                  key={player.id} 
                  $isCurrentUser={currentUser && player.id === currentUser.uid}
                >
                  <RankCell $rank={index + 1}>#{index + 1}</RankCell>
                  <PlayerInfo>
                    <div style={{ marginRight: '1rem' }}>
                      <UserAvatar 
                        userId={player.id}
                        fallbackUrl={player.photoURL}
                        size={40}
                        initial={player.displayName?.charAt(0)}
                      />
                    </div>
                    <PlayerName>
                      {player.displayName}
                      <RankBadge 
                        userData={player}
                        tier={player.currentTier}
                        level={player.currentLevel}
                        size={22}
                        marginLeft="0.5rem"
                      />
                      <TierBadge $color={getTierColor(player.currentTier)}>
                        {player.currentTier}
                      </TierBadge>
                    </PlayerName>
                  </PlayerInfo>
                  <LevelCell>Level {player.currentLevel}</LevelCell>
                  <XpCell>{player.xpTotal.toLocaleString()} XP</XpCell>
                </XpPlayerRow>
              ))
            )}
          </XpLeaderboardTable>
        </XpLeaderboardMain>
        
        <RankingSystemSidebar>
          <RankingSystemExplanation />
        </RankingSystemSidebar>
      </XpLeaderboardLayout>
    );
  };

  return (
    <LeaderboardContainer>
      <LeaderboardHeader>
        <h1>Leaderboard</h1>
        <p>
          {activeTab === 'tokens' 
            ? "Compete with the best Fortnite players and climb the ranks! Top players earn bonus tokens and exclusive rewards."
            : "Climb the XP ranks by participating in matches, winning matches, and maintaining your login streak. Top players earn exclusive rewards and bragging rights!"}
        </p>
      </LeaderboardHeader>

      <TabsContainer>
        <TabButton 
          active={activeTab === 'tokens'} 
          onClick={() => setActiveTab('tokens')}
        >
          Token Rankings
        </TabButton>
        <TabButton 
          active={activeTab === 'xp'} 
          onClick={() => setActiveTab('xp')}
        >
          XP Rankings
        </TabButton>
      </TabsContainer>

      {activeTab === 'tokens' ? renderTokenLeaderboard(currentUser) : renderXpLeaderboard()}
    </LeaderboardContainer>
  );
};

export default CombinedLeaderboard;
