import React from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useCosmetics } from '../contexts/CosmeticContext';

// Animation keyframes for different flair effects
const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-8px);
  }
  60% {
    transform: translateY(-4px);
  }
`;

const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const glow = keyframes`
  0% {
    filter: drop-shadow(0 0 4px currentColor);
  }
  50% {
    filter: drop-shadow(0 0 12px currentColor) brightness(1.2);
  }
  100% {
    filter: drop-shadow(0 0 4px currentColor);
  }
`;

const royalGlow = keyframes`
  0% {
    filter: drop-shadow(0 0 8px #ff61e6) drop-shadow(0 0 16px #ff61e6);
    transform: scale(1);
  }
  50% {
    filter: drop-shadow(0 0 16px #ff61e6) drop-shadow(0 0 24px #ff61e6) brightness(1.3);
    transform: scale(1.15);
  }
  100% {
    filter: drop-shadow(0 0 8px #ff61e6) drop-shadow(0 0 16px #ff61e6);
    transform: scale(1);
  }
`;

const sparkle = keyframes`
  0% {
    filter: drop-shadow(0 0 4px currentColor);
    transform: rotate(0deg);
  }
  25% {
    filter: drop-shadow(0 0 8px currentColor) brightness(1.2);
    transform: rotate(90deg);
  }
  50% {
    filter: drop-shadow(0 0 12px currentColor) brightness(1.4);
    transform: rotate(180deg);
  }
  75% {
    filter: drop-shadow(0 0 8px currentColor) brightness(1.2);
    transform: rotate(270deg);
  }
  100% {
    filter: drop-shadow(0 0 4px currentColor);
    transform: rotate(360deg);
  }
`;

// Get animation based on effect type
const getAnimation = (animationType) => {
  switch (animationType) {
    case 'bounce':
      return bounce;
    case 'pulse':
      return pulse;
    case 'glow':
      return glow;
    case 'royal-glow':
      return royalGlow;
    case 'sparkle':
      return sparkle;
    default:
      return null;
  }
};

const FlairContainer = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: ${props => props.$size || '1.2rem'};
  color: ${props => props.$color || '#4facfe'};
  margin: ${props => props.$margin || '0 0.25rem'};
  position: relative;
  transition: all 0.3s ease;
  
  ${props => props.$effects && css`
    color: ${props.$effects.color || '#4facfe'};
    
    ${!props.$disableAnimations && props.$effects.animation && css`
      animation: ${getAnimation(props.$effects.animation)} ${
        props.$effects.animation === 'bounce' ? '2s' :
        props.$effects.animation === 'pulse' ? '1.5s' :
        props.$effects.animation === 'glow' ? '2s' :
        props.$effects.animation === 'royal-glow' ? '3s' :
        props.$effects.animation === 'sparkle' ? '4s' : '2s'
      } infinite ease-in-out;
    `}
  `}
  
  &:hover {
    transform: scale(1.1);
    ${props => props.$effects && css`
      filter: brightness(1.2) drop-shadow(0 0 8px ${props.$effects.color || '#4facfe'});
    `}
  }
`;

const FlairTooltip = styled.div`
  position: absolute;
  bottom: 120%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.9);
  color: #fff;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
  z-index: 1000;
  
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 4px solid transparent;
    border-top-color: rgba(0, 0, 0, 0.9);
  }
  
  ${FlairContainer}:hover & {
    opacity: 1;
  }
`;

const CosmeticFlair = ({ 
  userId, 
  cosmetic,
  size,
  margin,
  showTooltip = true,
  className,
  style
}) => {
  const { getEquippedCosmetic, getCosmeticEffects, cosmeticSettings } = useCosmetics();
  
  // Use provided cosmetic or get equipped flair for the user
  let activeFlair = cosmetic;
  
  if (!cosmetic) {
    activeFlair = getEquippedCosmetic('flair');
  }
  
  // If no flair is available, don't render
  if (!activeFlair) {
    // No active flair
    return null;
  }
  
  // Only check cosmetic settings if no explicit cosmetic was provided
  // This allows external components (like leaderboard) to always show flair when explicitly provided
  if (!cosmetic && (!cosmeticSettings?.showFlair || cosmeticSettings?.globalDisable)) {
    return null;
  }
  
  // Get effects from the cosmetic object directly
  const effects = activeFlair.effects;
  
  // Debug logging removed for production

  return (
    <FlairContainer
      className={className}
      style={style}
      $effects={effects}
      $size={size}
      $margin={margin}
      $color={effects?.color}
      $disableAnimations={!cosmeticSettings?.showAnimations}
    >
      {effects?.emoji || activeFlair.icon}
      {showTooltip && (
        <FlairTooltip>
          {activeFlair.name}
        </FlairTooltip>
      )}
    </FlairContainer>
  );
};

export default CosmeticFlair; 