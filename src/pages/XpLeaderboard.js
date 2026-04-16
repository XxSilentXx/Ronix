import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getXpLeaderboard } from '../firebase/xpSystem';
import { useAuth } from '../contexts/AuthContext';
import UserAvatar from '../components/UserAvatar';
import { getAvatarUrl } from '../utils/avatarUtils';
import RankBadge from '../components/RankBadge';

const LeaderboardContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
  padding: 2rem;
`;

const LeaderboardHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const LeaderboardTitle = styled.h1`
  font-size: 2.5rem;
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 0.5rem;
`;

const LeaderboardSubtitle = styled.p`
  color: #b8c1ec;
  font-size: 1rem;
  max-width: 600px;
  margin: 0 auto;
`;

const LeaderboardTable = styled.div`
  max-width: 900px;
  margin: 0 auto;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 80px 1fr 150px 150px;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  @media (max-width: 768px) {
    grid-template-columns: 60px 1fr 80px 80px;
  }
`;

const HeaderCell = styled.div`
  color: #b8c1ec;
  font-weight: bold;
  font-size: 0.9rem;
`;

const PlayerRow = styled.div`
  display: grid;
  grid-template-columns: 80px 1fr 150px 150px;
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  align-items: center;
  background: ${props => props.$isCurrentUser ? 'rgba(79, 172, 254, 0.1)' : 'transparent'};
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 60px 1fr 80px 80px;
  }
`;

const RankCell = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
  color: ${props => {
    if (props.$rank === 1) return '#ffd700'; // Gold
    if (props.$rank === 2) return '#c0c0c0'; // Silver
    if (props.$rank === 3) return '#cd7f32'; // Bronze
    return '#fff';
  }};
`;

const PlayerInfo = styled.div`
  display: flex;
  align-items: center;
`;

const PlayerAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 1rem;
  background: rgba(255, 255, 255, 0.1);
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const PlayerName = styled.div`
  font-weight: bold;
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

const LevelCell = styled.div`
  font-weight: bold;
`;

const XpCell = styled.div`
  font-weight: bold;
  color: #4facfe;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #b8c1ec;
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

const XpLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const data = await getXpLeaderboard(20); // Get top 20 players
        setLeaderboard(data);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, []);
  
  return (
    <LeaderboardContainer>
      <LeaderboardHeader>
        <LeaderboardTitle>XP Leaderboard</LeaderboardTitle>
        <LeaderboardSubtitle>
          Climb the ranks by participating in wagers, winning matches, and maintaining your login streak.
          Top players earn exclusive rewards and bragging rights!
        </LeaderboardSubtitle>
      </LeaderboardHeader>
      
      <LeaderboardTable>
        <TableHeader>
          <HeaderCell>Rank</HeaderCell>
          <HeaderCell>Player</HeaderCell>
          <HeaderCell>Level</HeaderCell>
          <HeaderCell>XP</HeaderCell>
        </TableHeader>
        
        {loading ? (
          <LoadingMessage>Loading leaderboard data...</LoadingMessage>
        ) : (
          leaderboard.map((player, index) => (
            <PlayerRow 
              key={player.id} 
              $isCurrentUser={currentUser && player.id === currentUser.uid}
            >
              <RankCell $rank={index + 1}>#{index + 1}</RankCell>
              <PlayerInfo>
                {/* Use the centralized UserAvatar component for Discord avatars */}
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
                    size={16}
                    marginLeft="0.5rem"
                  />
                  <TierBadge $color={getTierColor(player.currentTier)}>
                    {player.currentTier}
                  </TierBadge>
                </PlayerName>
              </PlayerInfo>
              <LevelCell>Level {player.currentLevel}</LevelCell>
              <XpCell>{player.xpTotal.toLocaleString()} XP</XpCell>
            </PlayerRow>
          ))
        )}
      </LeaderboardTable>
    </LeaderboardContainer>
  );
};

export default XpLeaderboard;
