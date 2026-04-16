import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useShop } from '../contexts/ShopContext';

const glow = keyframes`
  0% { box-shadow: 0 0 5px rgba(79, 172, 254, 0.5); }
  50% { box-shadow: 0 0 20px rgba(79, 172, 254, 0.8); }
  100% { box-shadow: 0 0 5px rgba(79, 172, 254, 0.5); }
`;

const BoostContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  background: linear-gradient(135deg, rgba(79, 172, 254, 0.9) 0%, rgba(0, 212, 255, 0.9) 100%);
  border-radius: 12px;
  padding: 12px 16px;
  color: white;
  font-weight: bold;
  font-size: 0.9rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: ${glow} 2s ease-in-out infinite;
  min-width: 200px;
  display: flex;
  align-items: center;
  gap: 10px;
  
  @media (max-width: 768px) {
    top: 10px;
    right: 10px;
    font-size: 0.8rem;
    padding: 10px 12px;
    min-width: 150px;
  }
`;

const BoostIcon = styled.div`
  font-size: 1.2rem;
  animation: ${glow} 1.5s ease-in-out infinite;
`;

const BoostContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const BoostTitle = styled.div`
  font-size: 0.85rem;
  opacity: 0.9;
`;

const BoostTime = styled.div`
  font-size: 1rem;
  font-weight: bold;
  font-family: 'Courier New', monospace;
`;

const BoostMultiplier = styled.div`
  background: rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 0.8rem;
  text-align: center;
  margin-left: auto;
`;

const formatTime = (milliseconds) => {
  if (milliseconds <= 0) return '00:00';
  
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const XpBoostTimer = () => {
  const { getActiveXpBoost } = useShop();
  const [boostData, setBoostData] = useState({ active: false });
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update boost data and current time every second
  useEffect(() => {
    const updateData = () => {
      setBoostData(getActiveXpBoost());
      setCurrentTime(Date.now());
    };
    
    // Initial update
    updateData();
    
    // Set up interval to update every second
    const interval = setInterval(updateData, 1000);
    
    return () => clearInterval(interval);
  }, [getActiveXpBoost]);

  // Don't render if no active boost
  if (!boostData.active) {
    return null;
  }

  // Render for time-based boost (1 hour)
  if (boostData.type === '1hr') {
    const timeRemaining = boostData.timeRemaining;
    const timeDisplay = formatTime(timeRemaining);
    
    return (
      <BoostContainer>
        <BoostIcon></BoostIcon>
        <BoostContent>
          <BoostTitle>2x XP Active</BoostTitle>
          <BoostTime>{timeDisplay}</BoostTime>
        </BoostContent>
        <BoostMultiplier>2x</BoostMultiplier>
      </BoostContainer>
    );
  }
  
  // Render for match-based boost (3 matches)
  if (boostData.type === '3matches') {
    return (
      <BoostContainer>
        <BoostIcon></BoostIcon>
        <BoostContent>
          <BoostTitle>2x XP Active</BoostTitle>
          <BoostTime>{boostData.matchesRemaining} matches</BoostTime>
        </BoostContent>
        <BoostMultiplier>2x</BoostMultiplier>
      </BoostContainer>
    );
  }

  return null;
};

export default XpBoostTimer; 