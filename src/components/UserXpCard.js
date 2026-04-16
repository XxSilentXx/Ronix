import React from 'react';
import styled from 'styled-components';
import { useXp } from '../contexts/XpContext';
import XpProgressBar from './XpProgressBar';

const XpCardContainer = styled.div`
  background: rgba(24, 28, 40, 0.45);
  backdrop-filter: blur(14px);
  border-radius: 10px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1.5px solid rgba(255,255,255,0.13);
  box-shadow: 0 8px 32px 0 rgba(31,38,135,0.18);
`;

const XpCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const XpCardTitle = styled.h3`
  margin: 0;
  font-size: 1.2rem;
  color: #fff;
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 0.5rem;
    color: #4facfe;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const StatCard = styled.div`
  background: rgba(24, 28, 40, 0.35);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 0.8rem;
  text-align: center;
  border: 1px solid rgba(255,255,255,0.10);
  box-shadow: 0 4px 24px 0 rgba(31,38,135,0.10);
`;

const StatLabel = styled.div`
  color: #b8c1ec;
  font-size: 0.8rem;
  margin-bottom: 0.3rem;
`;

const StatValue = styled.div`
  color: #fff;
  font-size: 1.1rem;
  font-weight: bold;
  
  span {
    color: ${props => props.$color || '#4facfe'};
  }
`;

const UserXpCard = () => {
  const { 
    xpTotal, 
    currentLevel, 
    currentTier, 
    tierColor, 
    loginStreak,
    ranking
  } = useXp();
  
  return (
    <XpCardContainer>
      <XpCardHeader>
        <XpCardTitle>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
          </svg>
          Player Progress
        </XpCardTitle>
      </XpCardHeader>
      
      <XpProgressBar />
      
      <StatsGrid>
        <StatCard>
          <StatLabel>Total XP</StatLabel>
          <StatValue><span>{xpTotal.toLocaleString()}</span> XP</StatValue>
        </StatCard>
        
        <StatCard>
          <StatLabel>Current Level</StatLabel>
          <StatValue>Level <span>{currentLevel}</span></StatValue>
        </StatCard>
        
        <StatCard>
          <StatLabel>Rank Tier</StatLabel>
          <StatValue style={{ color: tierColor }}>{currentTier}</StatValue>
        </StatCard>
        
        <StatCard>
          <StatLabel>Login Streak</StatLabel>
          <StatValue><span>{loginStreak}</span> days</StatValue>
        </StatCard>
        
        <StatCard>
          <StatLabel>XP Rank</StatLabel>
          <StatValue>
            <span>#{ranking.rank}</span> / {ranking.total}
          </StatValue>
        </StatCard>
      </StatsGrid>
    </XpCardContainer>
  );
};

export default UserXpCard;
