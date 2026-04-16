import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const fadeOut = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
`;

const NotificationContainer = styled.div`
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  pointer-events: none;
`;

const NotificationCard = styled.div`
  background: rgba(0, 0, 0, 0.8);
  border-radius: 8px;
  padding: 15px;
  color: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  gap: 15px;
  max-width: 350px;
  animation: ${fadeInUp} 0.3s ease forwards, ${fadeOut} 0.5s ease forwards ${props => props.$duration - 0.5}s;
  border-left: 4px solid ${props => props.$color || '#4facfe'};
  backdrop-filter: blur(5px);
  pointer-events: auto;
`;

const XpIcon = styled.div`
  width: 40px;
  height: 40px;
  background: ${props => props.$color || '#4facfe'};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
`;

const NotificationContent = styled.div`
  flex: 1;
`;

const NotificationTitle = styled.div`
  font-weight: bold;
  font-size: 1rem;
  margin-bottom: 5px;
`;

const NotificationDescription = styled.div`
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.8);
`;

const XpAmount = styled.span`
  color: ${props => props.$color || '#4facfe'};
  font-weight: bold;
`;

const getTierColor = (tier) => {
  const tierColors = {
    'Bronze': '#cd7f32',
    'Silver': '#c0c0c0',
    'Gold': '#ffd700',
    'Platinum': '#e5e4e2',
    'Diamond': '#b9f2ff',
    'Master': '#ff4500'
  };
  
  return tierColors[tier] || '#4facfe';
};

const XpNotification = ({ xpResult, onClose, duration = 5 }) => {
  const [showNotification, setShowNotification] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowNotification(false);
      if (onClose) onClose();
    }, duration * 1000);
    
    return () => clearTimeout(timer);
  }, [xpResult, duration, onClose]);
  
  if (!showNotification || !xpResult) {
    return null;
  }
  
  const tierColor = xpResult.tierChanged ? getTierColor(xpResult.newTier) : '#4facfe';
  
  return (
    <NotificationContainer>
      <NotificationCard $color={tierColor} $duration={duration}>
        <XpIcon $color={tierColor}>XP</XpIcon>
        <NotificationContent>
          {xpResult.leveledUp ? (
            <>
              <NotificationTitle>Level Up!</NotificationTitle>
              <NotificationDescription>
                You've reached Level <XpAmount $color={tierColor}>{xpResult.newLevel}</XpAmount>!
                {xpResult.tierChanged && ` New Rank: ${xpResult.newTier}`}
              </NotificationDescription>
            </>
          ) : (
            <>
              <NotificationTitle>XP Earned{xpResult.boosted ? ' (Boosted!)' : ''}</NotificationTitle>
              <NotificationDescription>
                {xpResult.boosted ? (
                  <>
                    <XpAmount $color={tierColor}>+{xpResult.xpAmount} XP</XpAmount> 
                    ({xpResult.multiplier}x boost from {xpResult.baseXpAmount} base) - {xpResult.reason || 'Game activity'}
                  </>
                ) : (
                  <>
                    <XpAmount $color={tierColor}>+{xpResult.xpAmount} XP</XpAmount> - {xpResult.reason || 'Game activity'}
                  </>
                )}
              </NotificationDescription>
            </>
          )}
        </NotificationContent>
      </NotificationCard>
    </NotificationContainer>
  );
};

export default XpNotification;
