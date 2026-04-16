import React from 'react';
import styled from 'styled-components';
import { useXp } from '../contexts/XpContext';

const ProgressContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  margin: 0.5rem 0;
`;

const ProgressBarOuter = styled.div`
  width: 100%;
  height: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 5px;
  overflow: hidden;
  position: relative;
`;

const ProgressBarInner = styled.div`
  height: 100%;
  width: ${props => props.$progress}%;
  background: linear-gradient(90deg, #00FFD0 0%, #A259F7 100%);
  border-radius: 5px;
  transition: width 0.5s ease-out;
`;

const LevelInfo = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 0.3rem;
  font-size: 0.8rem;
`;

const LevelText = styled.div`
  color: #b8c1ec;
`;

const XpText = styled.div`
  color: #4facfe;
  font-weight: bold;
`;

const TierBadge = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.5rem;
  background: ${props => props.$color || '#cd7f32'};
  background: linear-gradient(135deg, ${props => props.$color || '#cd7f32'} 0%, rgba(0,0,0,0.2) 100%);
  color: white;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: bold;
  margin-left: 0.5rem;
  text-transform: uppercase;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
`;

const XpProgressBar = () => {
  const { xpTotal, currentLevel, nextLevelXp, progress, currentTier, tierColor } = useXp();
  
  return (
    <ProgressContainer>
      <LevelInfo>
        <LevelText>
          Level {currentLevel}
          <TierBadge $color={tierColor}>{currentTier}</TierBadge>
        </LevelText>
        <XpText>{xpTotal} / {nextLevelXp} XP</XpText>
      </LevelInfo>
      
      <ProgressBarOuter>
        <ProgressBarInner $progress={progress} $color={tierColor} />
      </ProgressBarOuter>
    </ProgressContainer>
  );
};

export default XpProgressBar;
