import React, { useEffect, useState, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const jiggle = keyframes`
  0% { transform: rotate(0deg); }
  10% { transform: rotate(-8deg); }
  20% { transform: rotate(8deg); }
  30% { transform: rotate(-6deg); }
  40% { transform: rotate(6deg); }
  50% { transform: rotate(-4deg); }
  60% { transform: rotate(4deg); }
  70% { transform: rotate(-2deg); }
  80% { transform: rotate(2deg); }
  90% { transform: rotate(-1deg); }
  100% { transform: rotate(0deg); }
`;

const pop = keyframes`
  0% { transform: scale(0.7); opacity: 0; }
  60% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.7);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${fadeIn} 0.3s;
`;

const ModalBox = styled.div`
  background: #181c2a;
  border-radius: 18px;
  padding: 36px 32px 32px 32px;
  min-width: 340px;
  min-height: 320px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
`;

const CrateBox = styled.div`
  font-size: 5rem;
  margin-bottom: 32px;
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
  transition: transform 0.2s ease;
  
  ${props => props.$isAnimating && css`
    animation: ${jiggle} 1.2s cubic-bezier(.36,.07,.19,.97) 1;
  `}
  
  &:hover {
    transform: ${props => props.$clickable ? 'scale(1.1)' : 'none'};
  }
`;

const RewardReveal = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 12px;
  animation: ${pop} 0.7s cubic-bezier(.36,.07,.19,.97) 1;
`;

const RewardIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 10px;
`;

const RewardTitle = styled.div`
  font-size: 1.3rem;
  font-weight: bold;
  color: #4facfe;
  margin-bottom: 6px;
`;

const RewardType = styled.div`
  font-size: 1rem;
  color: #fff;
  opacity: 0.7;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: #4facfe;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
  &:hover { background: #357abd; }
`;

const OpeningText = styled.div`
  color: #fff;
  font-size: 1.1rem;
  margin-bottom: 18px;
  text-align: center;
`;

const OpenButton = styled.button`
  background: linear-gradient(90deg, #4facfe 0%, #ff61e6 100%);
  color: #fff;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 16px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(79, 172, 254, 0.4);
  }
  
  &:disabled {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.5);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const CrateOpeningModal = ({ isOpen, onClose, onOpenCrate, reward, crateType = 'common' }) => {
  const [showReward, setShowReward] = useState(false);
  const [localReward, setLocalReward] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const hasOpenedRef = useRef(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setShowReward(false);
      setLocalReward(null);
      setIsAnimating(false);
      setIsOpening(false);
      hasOpenedRef.current = false;
    }
  }, [isOpen]);

  // Get crate icon and text based on type
  const getCrateDisplay = () => {
    if (crateType === 'rare') {
      return {
        icon: '',
        text: 'Click the rare crate to open it!'
      };
    }
    return {
      icon: '',
      text: 'Click the crate to open it!'
    };
  };

  const crateDisplay = getCrateDisplay();

  // Handle the crate opening process
  const handleOpenCrate = async () => {
    if (hasOpenedRef.current || isOpening) {
      return;
    }
    hasOpenedRef.current = true;
    setIsOpening(true);
    setIsAnimating(true);
    
    try {
      // Start animation first
              setTimeout(async () => {
          if (!hasOpenedRef.current) {
            return;
          }
          
          try {
            // Call the actual crate opening function
            const rewardResult = await onOpenCrate();
            
            if (rewardResult) {
              setLocalReward(rewardResult);
              setShowReward(true);
            }
          } catch (error) {
            console.error('Error during crate opening:', error);
          } finally {
            setIsAnimating(false);
            setIsOpening(false);
          }
        }, 1200); // Animation duration
    } catch (error) {
      console.error('Error starting crate opening:', error);
      setIsAnimating(false);
      setIsOpening(false);
      hasOpenedRef.current = false;
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay>
      <ModalBox>
        <CloseButton onClick={onClose}>×</CloseButton>
        
        {!showReward && !isAnimating && (
          <>
            <OpeningText>{crateDisplay.text}</OpeningText>
            <CrateBox 
              role="img" 
              aria-label="crate"
              $clickable={!isOpening && !hasOpenedRef.current}
              onClick={(!isOpening && !hasOpenedRef.current) ? handleOpenCrate : undefined}
            >
              {crateDisplay.icon}
            </CrateBox>
            <OpenButton 
              onClick={handleOpenCrate}
              disabled={isOpening || hasOpenedRef.current}
            >
              {isOpening ? 'Opening...' : hasOpenedRef.current ? 'Opened' : 'Open Crate'}
            </OpenButton>
          </>
        )}
        
        {isAnimating && !showReward && (
          <>
            <OpeningText>Opening your crate...</OpeningText>
            <CrateBox 
              role="img" 
              aria-label="crate"
              $isAnimating={true}
            >
              {crateDisplay.icon}
            </CrateBox>
          </>
        )}
        
        {showReward && localReward && (
          <RewardReveal>
            <RewardIcon>{localReward.icon === 'coin_svg' ? (
              <img src="/assets/token-logo.png" alt="Coin" style={{ width: 36, height: 36, verticalAlign: 'middle' }} onError={e => { e.target.onerror = null; e.target.style.display = 'none'; e.target.parentNode.append(''); }} />
            ) : (
              localReward.icon || ''
            )}</RewardIcon>
            <RewardTitle>{localReward.title}</RewardTitle>
            <RewardType>{localReward.type && localReward.type.charAt(0).toUpperCase() + localReward.type.slice(1)}</RewardType>
          </RewardReveal>
        )}
      </ModalBox>
    </ModalOverlay>
  );
};

export default CrateOpeningModal; 