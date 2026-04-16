import React from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useCosmetics } from '../contexts/CosmeticContext';

// Keyframe animations for different nameplate effects
const flamePulse = keyframes`
  0%, 100% { 
    box-shadow: 0 0 2px #ff4500, 0 0 4px #ff4500, 0 0 6px #ff4500;
    border-color: #ff4500;
  }
  50% { 
    box-shadow: 0 0 4px #ff6b35, 0 0 8px #ff6b35, 0 0 12px #ff6b35;
    border-color: #ff6b35;
  }
`;

const neonPulse = keyframes`
  0%, 100% { 
    box-shadow: 0 0 3px #00bfff, 0 0 6px #00bfff, 0 0 9px #00bfff;
    border-color: #00bfff;
  }
  50% { 
    box-shadow: 0 0 6px #4facfe, 0 0 12px #4facfe, 0 0 18px #4facfe;
    border-color: #4facfe;
  }
`;

const goldShimmer = keyframes`
  0% { 
    box-shadow: 0 0 4px #ffd700, 0 0 8px #ffd700, 0 0 12px #ffd700;
    border-color: #ffd700;
  }
  25% { 
    box-shadow: 0 0 6px #ffed4e, 0 0 10px #ffed4e, 0 0 14px #ffed4e;
    border-color: #ffed4e;
  }
  50% { 
    box-shadow: 0 0 8px #ffd700, 0 0 12px #ffd700, 0 0 16px #ffd700;
    border-color: #ffd700;
  }
  75% { 
    box-shadow: 0 0 6px #ffed4e, 0 0 10px #ffed4e, 0 0 14px #ffed4e;
    border-color: #ffed4e;
  }
  100% { 
    box-shadow: 0 0 4px #ffd700, 0 0 8px #ffd700, 0 0 12px #ffd700;
    border-color: #ffd700;
  }
`;

const iceCrystal = keyframes`
  0%, 100% { 
    box-shadow: 0 0 3px #87ceeb, 0 0 6px #87ceeb, 0 0 9px #87ceeb;
    border-color: #87ceeb;
    transform: scale(1);
  }
  50% { 
    box-shadow: 0 0 6px #b0e0e6, 0 0 12px #b0e0e6, 0 0 18px #b0e0e6;
    border-color: #b0e0e6;
    transform: scale(1.02);
  }
`;

const rainbowCycle = keyframes`
  0% { 
    border-color: #ff0000;
    box-shadow: 0 0 6px #ff0000, 0 0 12px #ff0000, 0 0 18px #ff0000;
  }
  16.67% { 
    border-color: #ff8000;
    box-shadow: 0 0 6px #ff8000, 0 0 12px #ff8000, 0 0 18px #ff8000;
  }
  33.33% { 
    border-color: #ffff00;
    box-shadow: 0 0 6px #ffff00, 0 0 12px #ffff00, 0 0 18px #ffff00;
  }
  50% { 
    border-color: #00ff00;
    box-shadow: 0 0 6px #00ff00, 0 0 12px #00ff00, 0 0 18px #00ff00;
  }
  66.67% { 
    border-color: #0080ff;
    box-shadow: 0 0 6px #0080ff, 0 0 12px #0080ff, 0 0 18px #0080ff;
  }
  83.33% { 
    border-color: #8000ff;
    box-shadow: 0 0 6px #8000ff, 0 0 12px #8000ff, 0 0 18px #8000ff;
  }
  100% { 
    border-color: #ff0000;
    box-shadow: 0 0 6px #ff0000, 0 0 12px #ff0000, 0 0 18px #ff0000;
  }
`;

const shadowPulse = keyframes`
  0%, 100% { 
    box-shadow: 0 0 4px #4b0082, 0 0 8px #4b0082, 0 0 12px #2e1065;
    border-color: #4b0082;
    opacity: 0.9;
  }
  50% { 
    box-shadow: 0 0 8px #2e1065, 0 0 16px #2e1065, 0 0 24px #1a0b3d;
    border-color: #2e1065;
    opacity: 1;
  }
`;

const lightningCrackle = keyframes`
  0%, 90%, 100% { 
    box-shadow: 0 0 3px #ffff00, 0 0 6px #ffff00, 0 0 9px #ffff00;
    border-color: #ffff00;
  }
  5%, 15%, 25% { 
    box-shadow: 0 0 6px #ffffff, 0 0 12px #ffffff, 0 0 18px #ffffff, 0 0 24px #ffff00;
    border-color: #ffffff;
    transform: scale(1.05);
  }
  10%, 20% { 
    box-shadow: 0 0 2px #ffff00, 0 0 4px #ffff00;
    border-color: #ffff00;
    transform: scale(1);
  }
`;

const cosmicSparkle = keyframes`
  0%, 100% { 
    box-shadow: 0 0 4px #9932cc, 0 0 8px #9932cc, 0 0 12px #ffd700;
    border-color: #9932cc;
  }
  25% { 
    box-shadow: 0 0 6px #ffd700, 0 0 12px #ffd700, 0 0 18px #9932cc, 0 0 24px #ffd700;
    border-color: #ffd700;
  }
  50% { 
    box-shadow: 0 0 8px #9932cc, 0 0 16px #9932cc, 0 0 24px #ffd700;
    border-color: #9932cc;
  }
  75% { 
    box-shadow: 0 0 6px #ffd700, 0 0 12px #ffd700, 0 0 18px #9932cc;
    border-color: #ffd700;
  }
`;

const lavaBubble = keyframes`
  0%, 100% { 
    box-shadow: 0 0 5px #ff4500, 0 0 10px #ff4500, 0 0 15px #ff8c00;
    border-color: #ff4500;
    transform: scale(1);
  }
  33% { 
    box-shadow: 0 0 8px #ff8c00, 0 0 16px #ff8c00, 0 0 24px #ff4500;
    border-color: #ff8c00;
    transform: scale(1.03);
  }
  66% { 
    box-shadow: 0 0 6px #ff4500, 0 0 12px #ff4500, 0 0 18px #ff8c00;
    border-color: #ff4500;
    transform: scale(0.98);
  }
`;

const toxicPulse = keyframes`
  0%, 100% { 
    box-shadow: 0 0 4px #00ff00, 0 0 8px #00ff00, 0 0 12px #32cd32;
    border-color: #00ff00;
  }
  50% { 
    box-shadow: 0 0 8px #32cd32, 0 0 16px #32cd32, 0 0 24px #00ff00, 0 0 32px #32cd32;
    border-color: #32cd32;
  }
`;

const crystalRefract = keyframes`
  0% { 
    box-shadow: 0 0 4px #add8e6, 0 0 8px #add8e6, 0 0 12px #87ceeb;
    border-color: #add8e6;
    filter: hue-rotate(0deg);
  }
  25% { 
    box-shadow: 0 0 6px #87ceeb, 0 0 12px #87ceeb, 0 0 18px #add8e6;
    border-color: #87ceeb;
    filter: hue-rotate(90deg);
  }
  50% { 
    box-shadow: 0 0 8px #add8e6, 0 0 16px #add8e6, 0 0 24px #87ceeb;
    border-color: #add8e6;
    filter: hue-rotate(180deg);
  }
  75% { 
    box-shadow: 0 0 6px #87ceeb, 0 0 12px #87ceeb, 0 0 18px #add8e6;
    border-color: #87ceeb;
    filter: hue-rotate(270deg);
  }
  100% { 
    box-shadow: 0 0 4px #add8e6, 0 0 8px #add8e6, 0 0 12px #87ceeb;
    border-color: #add8e6;
    filter: hue-rotate(360deg);
  }
`;

const phoenixRise = keyframes`
  0%, 100% { 
    box-shadow: 0 0 6px #ff6347, 0 0 12px #ff6347, 0 0 18px #ffd700;
    border-color: #ff6347;
    transform: translateY(0px);
  }
  25% { 
    box-shadow: 0 0 8px #ffd700, 0 0 16px #ffd700, 0 0 24px #ff6347, 0 0 32px #ffd700;
    border-color: #ffd700;
    transform: translateY(-2px);
  }
  50% { 
    box-shadow: 0 0 12px #ff6347, 0 0 24px #ff6347, 0 0 36px #ffd700;
    border-color: #ff6347;
    transform: translateY(-1px);
  }
  75% { 
    box-shadow: 0 0 10px #ffd700, 0 0 20px #ffd700, 0 0 30px #ff6347;
    border-color: #ffd700;
    transform: translateY(-3px);
  }
`;

const voidSwirl = keyframes`
  0%, 100% { 
    box-shadow: 0 0 6px #191970, 0 0 12px #191970, 0 0 18px #4b0082;
    border-color: #191970;
    transform: rotate(0deg);
  }
  25% { 
    box-shadow: 0 0 8px #4b0082, 0 0 16px #4b0082, 0 0 24px #191970;
    border-color: #4b0082;
    transform: rotate(90deg);
  }
  50% { 
    box-shadow: 0 0 10px #191970, 0 0 20px #191970, 0 0 30px #4b0082;
    border-color: #191970;
    transform: rotate(180deg);
  }
  75% { 
    box-shadow: 0 0 8px #4b0082, 0 0 16px #4b0082, 0 0 24px #191970;
    border-color: #4b0082;
    transform: rotate(270deg);
  }
`;

const plasmaFlow = keyframes`
  0%, 100% { 
    box-shadow: 0 0 4px #8a2be2, 0 0 8px #8a2be2, 0 0 12px #00bfff;
    border-color: #8a2be2;
  }
  33% { 
    box-shadow: 0 0 6px #00bfff, 0 0 12px #00bfff, 0 0 18px #8a2be2;
    border-color: #00bfff;
  }
  66% { 
    box-shadow: 0 0 8px #8a2be2, 0 0 16px #8a2be2, 0 0 24px #00bfff;
    border-color: #8a2be2;
  }
`;

const petalDrift = keyframes`
  0%, 100% { 
    box-shadow: 0 0 3px #ffb6c1, 0 0 6px #ffb6c1, 0 0 9px #ffc0cb;
    border-color: #ffb6c1;
    transform: translateX(0px);
  }
  25% { 
    box-shadow: 0 0 4px #ffc0cb, 0 0 8px #ffc0cb, 0 0 12px #ffb6c1;
    border-color: #ffc0cb;
    transform: translateX(2px);
  }
  50% { 
    box-shadow: 0 0 5px #ffb6c1, 0 0 10px #ffb6c1, 0 0 15px #ffc0cb;
    border-color: #ffb6c1;
    transform: translateX(-1px);
  }
  75% { 
    box-shadow: 0 0 4px #ffc0cb, 0 0 8px #ffc0cb, 0 0 12px #ffb6c1;
    border-color: #ffc0cb;
    transform: translateX(-2px);
  }
`;

const matrixRain = keyframes`
  0%, 100% { 
    box-shadow: 0 0 4px #00ff41, 0 0 8px #00ff41, 0 0 12px #00cc33;
    border-color: #00ff41;
    opacity: 1;
  }
  25% { 
    box-shadow: 0 0 2px #00cc33, 0 0 4px #00cc33, 0 0 6px #00ff41;
    border-color: #00cc33;
    opacity: 0.8;
  }
  50% { 
    box-shadow: 0 0 6px #00ff41, 0 0 12px #00ff41, 0 0 18px #00cc33;
    border-color: #00ff41;
    opacity: 1;
  }
  75% { 
    box-shadow: 0 0 3px #00cc33, 0 0 6px #00cc33, 0 0 9px #00ff41;
    border-color: #00cc33;
    opacity: 0.9;
  }
`;

const frostSpread = keyframes`
  0%, 100% { 
    box-shadow: 0 0 4px #b0e0e6, 0 0 8px #b0e0e6, 0 0 12px #e0ffff;
    border-color: #b0e0e6;
    transform: scale(1);
  }
  50% { 
    box-shadow: 0 0 6px #e0ffff, 0 0 12px #e0ffff, 0 0 18px #b0e0e6, 0 0 24px #e0ffff;
    border-color: #e0ffff;
    transform: scale(1.01);
  }
`;

// Get animation based on effect type
const getAnimation = (animationType) => {
  switch (animationType) {
    case 'flame-pulse':
      return flamePulse;
    case 'neon-pulse':
      return neonPulse;
    case 'gold-shimmer':
      return goldShimmer;
    case 'ice-crystal':
      return iceCrystal;
    case 'rainbow-cycle':
      return rainbowCycle;
    case 'shadow-pulse':
      return shadowPulse;
    case 'lightning-crackle':
      return lightningCrackle;
    case 'cosmic-sparkle':
      return cosmicSparkle;
    case 'lava-bubble':
      return lavaBubble;
    case 'toxic-pulse':
      return toxicPulse;
    case 'crystal-refract':
      return crystalRefract;
    case 'phoenix-rise':
      return phoenixRise;
    case 'void-swirl':
      return voidSwirl;
    case 'plasma-flow':
      return plasmaFlow;
    case 'petal-drift':
      return petalDrift;
    case 'matrix-rain':
      return matrixRain;
    case 'frost-spread':
      return frostSpread;
    default:
      return null;
  }
};

const NameplateContainer = styled.div`
  display: inline-block;
  position: relative;
  padding: 8px 16px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  z-index: 1;

  ${props => props.cosmetic && css`
    border: ${props.cosmetic.effects.borderWidth || '2px'} ${props.cosmetic.effects.borderStyle || 'solid'} ${props.cosmetic.effects.borderColor};
    
    ${!props.$disableAnimations && props.cosmetic.effects.animation === 'flame-pulse' && css`
      animation: ${flamePulse} 2s ease-in-out infinite;
    `}
    
    ${!props.$disableAnimations && props.cosmetic.effects.animation === 'neon-pulse' && css`
      animation: ${neonPulse} 1.5s ease-in-out infinite;
    `}
    
    ${!props.$disableAnimations && props.cosmetic.effects.animation === 'gold-shimmer' && css`
      animation: ${goldShimmer} 3s ease-in-out infinite;
    `}
    
    ${!props.$disableAnimations && props.cosmetic.effects.animation === 'ice-crystal' && css`
      animation: ${iceCrystal} 2.5s ease-in-out infinite;
    `}
    
    ${!props.$disableAnimations && props.cosmetic.effects.animation === 'rainbow-cycle' && css`
      animation: ${rainbowCycle} 4s linear infinite;
    `}
    
    ${!props.$disableAnimations && props.cosmetic.effects.animation === 'shadow-pulse' && css`
      animation: ${shadowPulse} 2s ease-in-out infinite;
    `}
    
    ${!props.$disableAnimations && props.cosmetic.effects.animation === 'lightning-crackle' && css`
      animation: ${lightningCrackle} 3s ease-in-out infinite;
    `}
    
    ${!props.$disableAnimations && props.cosmetic.effects.animation === 'cosmic-sparkle' && css`
      animation: ${cosmicSparkle} 3.5s ease-in-out infinite;
    `}
    
    ${!props.$disableAnimations && props.cosmetic.effects.animation === 'lava-bubble' && css`
      animation: ${lavaBubble} 2.8s ease-in-out infinite;
    `}
    
    ${!props.$disableAnimations && props.cosmetic.effects.animation === 'toxic-pulse' && css`
      animation: ${toxicPulse} 2.2s ease-in-out infinite;
    `}
    
    ${!props.$disableAnimations && props.cosmetic.effects.animation === 'crystal-refract' && css`
      animation: ${crystalRefract} 4s linear infinite;
    `}
    
    ${!props.$disableAnimations && props.cosmetic.effects.animation === 'phoenix-rise' && css`
      animation: ${phoenixRise} 3s ease-in-out infinite;
    `}
    
    ${!props.$disableAnimations && props.cosmetic.effects.animation === 'void-swirl' && css`
      animation: ${voidSwirl} 4s linear infinite;
    `}
    
    ${!props.$disableAnimations && props.cosmetic.effects.animation === 'plasma-flow' && css`
      animation: ${plasmaFlow} 2.5s ease-in-out infinite;
    `}
    
    ${!props.$disableAnimations && props.cosmetic.effects.animation === 'petal-drift' && css`
      animation: ${petalDrift} 3.5s ease-in-out infinite;
    `}
    
    ${!props.$disableAnimations && props.cosmetic.effects.animation === 'matrix-rain' && css`
      animation: ${matrixRain} 2s ease-in-out infinite;
    `}
    
    ${!props.$disableAnimations && props.cosmetic.effects.animation === 'frost-spread' && css`
      animation: ${frostSpread} 3s ease-in-out infinite;
    `}
  `}

  &:hover {
    transform: translateY(-2px);
  }
`;

const NameplateText = styled.span`
  color: #ffffff;
  font-weight: 900;
  font-size: 16px;
  text-shadow: 
    0 2px 4px rgba(0, 0, 0, 1),
    0 0 8px rgba(0, 0, 0, 1),
    0 0 16px rgba(0, 0, 0, 0.9);
  position: relative;
  z-index: 10;
  letter-spacing: 0.8px;
  text-transform: uppercase;

  ${props => props.cosmetic && css`
    /* Strong black outline for maximum contrast */
    text-shadow: 
      -2px -2px 0 #000,
      2px -2px 0 #000,
      -2px 2px 0 #000,
      2px 2px 0 #000,
      0 0 8px rgba(0, 0, 0, 1),
      0 0 16px rgba(0, 0, 0, 0.9);
    
    /* Strong background to ensure readability */
    background: rgba(0, 0, 0, 0.8);
    padding: 4px 8px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.2);
  `}
`;

const CosmeticIcon = styled.span`
  margin-right: 6px;
  font-size: 16px;
  filter: drop-shadow(0 0 3px rgba(0, 0, 0, 0.5));
`;

const CosmeticNameplate = ({ 
  userId, 
  children, 
  className,
  style,
  cosmetic
}) => {
  const { getEquippedCosmetic, getCosmeticEffects, cosmeticSettings } = useCosmetics();
  
  // Use provided cosmetic or get equipped nameplate for the user
  let activeCosmetic = cosmetic;
  
  if (!cosmetic) {
    activeCosmetic = getEquippedCosmetic('nameplate');
  }
  
  // Check if nameplates are disabled globally
  if (!cosmeticSettings?.showNameplates || cosmeticSettings?.globalDisable) {
    return <span className={className} style={style}>{children}</span>;
  }
  
  // If activeCosmetic is missing but should be present, show a warning and fallback
  if (!activeCosmetic) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[CosmeticNameplate] No active nameplate cosmetic found! Rendering fallback.', {
        cosmetic,
        children
      });
    }
    // Fallback: show a simple border and icon
    return (
      <NameplateContainer
        style={{ border: '2px dashed #888', background: 'rgba(0,0,0,0.3)', ...style }}
        className={className}
        cosmetic={null}
      >
        <CosmeticIcon role="img" aria-label="No nameplate"></CosmeticIcon>
        <NameplateText style={{ color: '#bbb' }}>
          {children}
        </NameplateText>
      </NameplateContainer>
    );
  }
  
  // Debug logging removed for production
  
  return (
    <NameplateContainer 
      cosmetic={activeCosmetic} 
      className={className}
      style={style}
      $disableAnimations={!cosmeticSettings?.showAnimations}
    >
      {activeCosmetic && activeCosmetic.icon && (
        <CosmeticIcon>{activeCosmetic.icon}</CosmeticIcon>
      )}
      <NameplateText cosmetic={activeCosmetic}>
        {children}
      </NameplateText>
    </NameplateContainer>
  );
};

export default CosmeticNameplate;