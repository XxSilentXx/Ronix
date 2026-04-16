import React from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useCosmetics } from '../contexts/CosmeticContext';

// Keyframe animations for different profile effects
const cosmicDrift = keyframes`
  0% { 
    background-position: 0% 0%;
    transform: scale(1);
  }
  50% { 
    background-position: 100% 100%;
    transform: scale(1.01);
  }
  100% { 
    background-position: 0% 0%;
    transform: scale(1);
  }
`;

const cyberPulse = keyframes`
  0%, 100% { 
    box-shadow: inset 0 0 15px rgba(15, 52, 96, 0.25);
    border-color: rgba(15, 52, 96, 0.8);
  }
  50% { 
    box-shadow: inset 0 0 25px rgba(233, 69, 96, 0.4);
    border-color: rgba(233, 69, 96, 0.8);
  }
`;

const candyFloat = keyframes`
  0%, 100% { 
    transform: translateY(0px);
    filter: hue-rotate(0deg);
  }
  50% { 
    transform: translateY(-3px);
    filter: hue-rotate(5deg);
  }
`;

const championGlow = keyframes`
  0%, 100% { 
    box-shadow: 
      0 0 15px rgba(255, 215, 0, 0.4),
      inset 0 0 15px rgba(255, 215, 0, 0.15);
  }
  50% { 
    box-shadow: 
      0 0 30px rgba(255, 237, 78, 0.6),
      inset 0 0 25px rgba(255, 237, 78, 0.3);
  }
`;

const natureSway = keyframes`
  0%, 100% { 
    background-position: 0% 0%;
    filter: hue-rotate(0deg) brightness(1);
  }
  25% { 
    background-position: 5% 10%;
    filter: hue-rotate(2deg) brightness(1.02);
  }
  50% { 
    background-position: 10% 5%;
    filter: hue-rotate(0deg) brightness(1.05);
  }
  75% { 
    background-position: 5% -5%;
    filter: hue-rotate(-2deg) brightness(1.02);
  }
`;

const oceanFlow = keyframes`
  0% { 
    background-position: 0% 0%;
    transform: scale(1);
  }
  25% { 
    background-position: 20% 10%;
    transform: scale(1.02);
  }
  50% { 
    background-position: 40% 0%;
    transform: scale(1);
  }
  75% { 
    background-position: 60% -10%;
    transform: scale(1.02);
  }
  100% { 
    background-position: 80% 0%;
    transform: scale(1);
  }
`;

const volcanicEruption = keyframes`
  0%, 100% { 
    background-position: 0% 0%;
    filter: brightness(1) saturate(1);
    box-shadow: inset 0 0 20px rgba(255, 69, 0, 0.2);
  }
  25% { 
    background-position: 10% 5%;
    filter: brightness(1.1) saturate(1.1);
    box-shadow: inset 0 0 30px rgba(255, 140, 0, 0.3);
  }
  50% { 
    background-position: 20% 10%;
    filter: brightness(1.2) saturate(1.2);
    box-shadow: inset 0 0 40px rgba(255, 215, 0, 0.4);
  }
  75% { 
    background-position: 15% 8%;
    filter: brightness(1.1) saturate(1.1);
    box-shadow: inset 0 0 30px rgba(255, 140, 0, 0.3);
  }
`;

const auroraDance = keyframes`
  0% { 
    background-position: 0% 0%;
    filter: hue-rotate(0deg) brightness(1);
  }
  20% { 
    background-position: 10% 20%;
    filter: hue-rotate(30deg) brightness(1.1);
  }
  40% { 
    background-position: 30% 10%;
    filter: hue-rotate(60deg) brightness(1.05);
  }
  60% { 
    background-position: 50% 30%;
    filter: hue-rotate(90deg) brightness(1.1);
  }
  80% { 
    background-position: 70% 5%;
    filter: hue-rotate(120deg) brightness(1.05);
  }
  100% { 
    background-position: 100% 0%;
    filter: hue-rotate(0deg) brightness(1);
  }
`;

const heatShimmer = keyframes`
  0%, 100% { 
    background-position: 0% 0%;
    filter: blur(0px) brightness(1);
    transform: scale(1);
  }
  25% { 
    background-position: 5% 10%;
    filter: blur(0.5px) brightness(1.05);
    transform: scale(1.005);
  }
  50% { 
    background-position: 10% 0%;
    filter: blur(1px) brightness(1.1);
    transform: scale(1.01);
  }
  75% { 
    background-position: 5% -10%;
    filter: blur(0.5px) brightness(1.05);
    transform: scale(1.005);
  }
`;

const nebulaSwirls = keyframes`
  0% { 
    background-position: 0% 0%;
    transform: rotate(0deg) scale(1);
    filter: hue-rotate(0deg);
  }
  25% { 
    background-position: 25% 25%;
    transform: rotate(2deg) scale(1.02);
    filter: hue-rotate(15deg);
  }
  50% { 
    background-position: 50% 50%;
    transform: rotate(0deg) scale(1.05);
    filter: hue-rotate(30deg);
  }
  75% { 
    background-position: 75% 25%;
    transform: rotate(-2deg) scale(1.02);
    filter: hue-rotate(15deg);
  }
  100% { 
    background-position: 100% 0%;
    transform: rotate(0deg) scale(1);
    filter: hue-rotate(0deg);
  }
`;

const matrixCascade = keyframes`
  0% { 
    background-position: 0% 0%;
    filter: brightness(1);
  }
  25% { 
    background-position: 0% 25%;
    filter: brightness(1.1);
  }
  50% { 
    background-position: 0% 50%;
    filter: brightness(1.2);
  }
  75% { 
    background-position: 0% 75%;
    filter: brightness(1.1);
  }
  100% { 
    background-position: 0% 100%;
    filter: brightness(1);
  }
`;

const rainbowCycle = keyframes`
  0% { filter: hue-rotate(0deg) brightness(1); }
  16.66% { filter: hue-rotate(60deg) brightness(1.05); }
  33.33% { filter: hue-rotate(120deg) brightness(1.1); }
  50% { filter: hue-rotate(180deg) brightness(1.15); }
  66.66% { filter: hue-rotate(240deg) brightness(1.1); }
  83.33% { filter: hue-rotate(300deg) brightness(1.05); }
  100% { filter: hue-rotate(360deg) brightness(1); }
`;

const petalFall = keyframes`
  0% { 
    background-position: 0% 0%;
    transform: rotate(0deg);
    filter: brightness(1);
  }
  25% { 
    background-position: 10% 25%;
    transform: rotate(1deg);
    filter: brightness(1.05);
  }
  50% { 
    background-position: 5% 50%;
    transform: rotate(0deg);
    filter: brightness(1.1);
  }
  75% { 
    background-position: 15% 75%;
    transform: rotate(-1deg);
    filter: brightness(1.05);
  }
  100% { 
    background-position: 0% 100%;
    transform: rotate(0deg);
    filter: brightness(1);
  }
`;

const clockworkTick = keyframes`
  0%, 100% { 
    transform: rotate(0deg);
    filter: sepia(0.3) brightness(1);
  }
  25% { 
    transform: rotate(1deg);
    filter: sepia(0.4) brightness(1.05);
  }
  50% { 
    transform: rotate(0deg);
    filter: sepia(0.5) brightness(1.1);
  }
  75% { 
    transform: rotate(-1deg);
    filter: sepia(0.4) brightness(1.05);
  }
`;

const thunderFlash = keyframes`
  0%, 90%, 100% { 
    background-position: 0% 0%;
    filter: brightness(1);
    box-shadow: inset 0 0 20px rgba(25, 25, 112, 0.2);
  }
  5%, 15% { 
    background-position: 10% 10%;
    filter: brightness(2);
    box-shadow: inset 0 0 40px rgba(255, 255, 255, 0.5);
  }
  10% { 
    background-position: 5% 5%;
    filter: brightness(1.5);
    box-shadow: inset 0 0 30px rgba(255, 255, 255, 0.3);
  }
`;

const voidSwirl = keyframes`
  0% { 
    background-position: 0% 0%;
    transform: rotate(0deg) scale(1);
    filter: brightness(0.8);
  }
  25% { 
    background-position: 25% 25%;
    transform: rotate(90deg) scale(1.05);
    filter: brightness(0.6);
  }
  50% { 
    background-position: 50% 50%;
    transform: rotate(180deg) scale(1.1);
    filter: brightness(0.4);
  }
  75% { 
    background-position: 75% 75%;
    transform: rotate(270deg) scale(1.05);
    filter: brightness(0.6);
  }
  100% { 
    background-position: 100% 100%;
    transform: rotate(360deg) scale(1);
    filter: brightness(0.8);
  }
`;

const crystalGleam = keyframes`
  0%, 100% { 
    background-position: 0% 0%;
    filter: brightness(1) contrast(1);
    box-shadow: inset 0 0 20px rgba(138, 43, 226, 0.2);
  }
  25% { 
    background-position: 25% 25%;
    filter: brightness(1.2) contrast(1.1);
    box-shadow: inset 0 0 30px rgba(186, 85, 211, 0.3);
  }
  50% { 
    background-position: 50% 50%;
    filter: brightness(1.4) contrast(1.2);
    box-shadow: inset 0 0 40px rgba(221, 160, 221, 0.4);
  }
  75% { 
    background-position: 75% 25%;
    filter: brightness(1.2) contrast(1.1);
    box-shadow: inset 0 0 30px rgba(186, 85, 211, 0.3);
  }
`;

const sunsetGlow = keyframes`
  0%, 100% { 
    background-position: 0% 0%;
    filter: hue-rotate(0deg) brightness(1);
  }
  25% { 
    background-position: 25% 10%;
    filter: hue-rotate(10deg) brightness(1.1);
  }
  50% { 
    background-position: 50% 20%;
    filter: hue-rotate(20deg) brightness(1.2);
  }
  75% { 
    background-position: 75% 10%;
    filter: hue-rotate(10deg) brightness(1.1);
  }
`;

const toxicPulse = keyframes`
  0%, 100% { 
    background-position: 0% 0%;
    filter: brightness(1) saturate(1);
    box-shadow: inset 0 0 20px rgba(0, 255, 0, 0.2);
  }
  50% { 
    background-position: 10% 10%;
    filter: brightness(1.3) saturate(1.3);
    box-shadow: inset 0 0 40px rgba(50, 205, 50, 0.4);
  }
`;

const phoenixRebirth = keyframes`
  0% { 
    background-position: 0% 0%;
    transform: scale(0.95);
    filter: brightness(0.8) hue-rotate(0deg);
  }
  25% { 
    background-position: 25% 25%;
    transform: scale(1);
    filter: brightness(1.2) hue-rotate(15deg);
  }
  50% { 
    background-position: 50% 50%;
    transform: scale(1.05);
    filter: brightness(1.5) hue-rotate(30deg);
  }
  75% { 
    background-position: 75% 25%;
    transform: scale(1.02);
    filter: brightness(1.3) hue-rotate(15deg);
  }
  100% { 
    background-position: 100% 0%;
    transform: scale(1);
    filter: brightness(1) hue-rotate(0deg);
  }
`;

const galacticRotation = keyframes`
  0% { 
    background-position: 0% 0%;
    transform: rotate(0deg) scale(1);
  }
  25% { 
    background-position: 25% 25%;
    transform: rotate(90deg) scale(1.02);
  }
  50% { 
    background-position: 50% 50%;
    transform: rotate(180deg) scale(1.05);
  }
  75% { 
    background-position: 75% 75%;
    transform: rotate(270deg) scale(1.02);
  }
  100% { 
    background-position: 100% 100%;
    transform: rotate(360deg) scale(1);
  }
`;

// Styled component for the profile container
const ProfileContainer = styled.div`
  position: relative;
  width: 100%;
  min-height: ${props => props.$fullScreen ? '100vh' : '200px'};
  border-radius: ${props => props.$fullScreen ? '0px' : '12px'};
  border: ${props => props.$fullScreen ? 'none' : '2px solid rgba(255, 255, 255, 0.1)'};
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: all 0.3s ease;

  /* Apply brightness filter based on user settings */
  filter: brightness(${props => (props.$brightness || 100) / 100});

  /* Add a subtle dark overlay to reduce brightness and eye strain */
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.12);
    pointer-events: none;
    z-index: 1;
  }

  ${props => props.cosmetic && css`
    background: ${props.cosmetic.effects.backgroundColor} !important;
    
    ${!props.$disableAnimations && props.cosmetic.effects.animation === 'cosmic-drift' && css`
      animation: ${cosmicDrift} 8s ease-in-out infinite;
      background-size: 200% 200%;
    `}
    
    ${!props.$disableAnimations && props.cosmetic.effects.animation === 'cyber-pulse' && css`
      animation: ${cyberPulse} 3s ease-in-out infinite;
      border: 2px solid rgba(15, 52, 96, 0.8);
    `}
    
    ${!props.$disableAnimations && props.cosmetic.effects.animation === 'candy-float' && css`
      animation: ${candyFloat} 4s ease-in-out infinite;
    `}
    
    ${!props.$disableAnimations && props.cosmetic.effects.animation === 'champion-glow' && css`
      animation: ${championGlow} 2s ease-in-out infinite;
      border: 2px solid rgba(255, 215, 0, 0.8);
    `}
    
    ${!props.$disableAnimations && props.cosmetic.effects.animation === 'nature-sway' && css`
      animation: ${natureSway} 6s ease-in-out infinite;
      background-size: 200% 200%;
    `}
    
    ${!props.$disableAnimations && props.cosmetic.effects.animation === 'ocean-flow' && css`
      animation: ${oceanFlow} 7s ease-in-out infinite;
      background-size: 200% 200%;
    `}
    
    ${!props.$disableAnimations && props.cosmetic.effects.animation === 'volcanic-eruption' && css`
      animation: ${volcanicEruption} 4s ease-in-out infinite;
      background-size: 200% 200%;
    `}
    
    ${!props.$disableAnimations && props.cosmetic.effects.animation === 'aurora-dance' && css`
      animation: ${auroraDance} 8s ease-in-out infinite;
      background-size: 200% 200%;
    `}
    
    ${!props.$disableAnimations && props.cosmetic.effects.animation === 'heat-shimmer' && css`
      animation: ${heatShimmer} 3s ease-in-out infinite;
      background-size: 150% 150%;
    `}
    
    ${!props.$disableAnimations && props.cosmetic.effects.animation === 'nebula-swirls' && css`
      animation: ${nebulaSwirls} 10s ease-in-out infinite;
      background-size: 200% 200%;
    `}
    
    ${!props.$disableAnimations && props.cosmetic.effects.animation === 'matrix-cascade' && css`
      animation: ${matrixCascade} 4s linear infinite;
      background-size: 100% 200%;
    `}
    
    ${!props.$disableAnimations && props.cosmetic.effects.animation === 'rainbow-cycle' && css`
      animation: ${rainbowCycle} 6s linear infinite;
    `}
    
    ${!props.$disableAnimations && props.cosmetic.effects.animation === 'petal-fall' && css`
      animation: ${petalFall} 8s ease-in-out infinite;
      background-size: 200% 200%;
    `}
    
    ${!props.$disableAnimations && props.cosmetic.effects.animation === 'clockwork-tick' && css`
      animation: ${clockworkTick} 2s ease-in-out infinite;
    `}
    
    ${!props.$disableAnimations && props.cosmetic.effects.animation === 'thunder-flash' && css`
      animation: ${thunderFlash} 6s ease-in-out infinite;
      background-size: 200% 200%;
    `}
    
    ${!props.$disableAnimations && props.cosmetic.effects.animation === 'void-swirl' && css`
      animation: ${voidSwirl} 12s linear infinite;
      background-size: 200% 200%;
    `}
    
    ${!props.$disableAnimations && props.cosmetic.effects.animation === 'crystal-gleam' && css`
      animation: ${crystalGleam} 5s ease-in-out infinite;
      background-size: 200% 200%;
    `}
    
    ${!props.$disableAnimations && props.cosmetic.effects.animation === 'sunset-glow' && css`
      animation: ${sunsetGlow} 7s ease-in-out infinite;
      background-size: 200% 200%;
    `}
    
    ${!props.$disableAnimations && props.cosmetic.effects.animation === 'toxic-pulse' && css`
      animation: ${toxicPulse} 3s ease-in-out infinite;
      background-size: 150% 150%;
    `}
    
    ${!props.$disableAnimations && props.cosmetic.effects.animation === 'phoenix-rebirth' && css`
      animation: ${phoenixRebirth} 6s ease-in-out infinite;
      background-size: 200% 200%;
    `}
    
    ${!props.$disableAnimations && props.cosmetic.effects.animation === 'galactic-rotation' && css`
      animation: ${galacticRotation} 15s linear infinite;
      background-size: 200% 200%;
    `}
  `}

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    opacity: 0.08;
    pointer-events: none;
    z-index: 0;
    
    ${props => props.cosmetic?.effects.overlayPattern === 'stars' && css`
      background-image: 
        radial-gradient(2px 2px at 20px 30px, #fff, transparent),
        radial-gradient(2px 2px at 40px 70px, #fff, transparent),
        radial-gradient(1px 1px at 90px 40px, #fff, transparent),
        radial-gradient(1px 1px at 130px 80px, #fff, transparent),
        radial-gradient(2px 2px at 160px 30px, #fff, transparent);
      background-repeat: repeat;
      background-size: 200px 100px;
    `}
    
    ${props => props.cosmetic?.effects.overlayPattern === 'grid-lines' && css`
      background-image: 
        linear-gradient(rgba(233, 69, 96, 0.3) 1px, transparent 1px),
        linear-gradient(90deg, rgba(233, 69, 96, 0.3) 1px, transparent 1px);
      background-size: 20px 20px;
    `}
    
    ${props => props.cosmetic?.effects.overlayPattern === 'soft-clouds' && css`
      background-image: 
        radial-gradient(ellipse at top, rgba(255, 255, 255, 0.1), transparent),
        radial-gradient(ellipse at bottom, rgba(255, 255, 255, 0.05), transparent);
    `}
    
    ${props => props.cosmetic?.effects.overlayPattern === 'trophy-silhouettes' && css`
      background-image: 
        radial-gradient(ellipse at 20% 80%, rgba(255, 215, 0, 0.2), transparent),
        radial-gradient(ellipse at 80% 20%, rgba(255, 215, 0, 0.15), transparent),
        radial-gradient(ellipse at 40% 40%, rgba(255, 215, 0, 0.1), transparent);
    `}
    
    ${props => props.cosmetic?.effects.overlayPattern === 'tree-shadows' && css`
      background-image: 
        radial-gradient(ellipse at 30% 100%, rgba(0, 0, 0, 0.3), transparent),
        radial-gradient(ellipse at 70% 100%, rgba(0, 0, 0, 0.2), transparent),
        radial-gradient(ellipse at 50% 90%, rgba(0, 0, 0, 0.1), transparent);
    `}
    
    ${props => props.cosmetic?.effects.overlayPattern === 'wave-ripples' && css`
      background-image: 
        repeating-linear-gradient(
          0deg,
          transparent 0px,
          rgba(255, 255, 255, 0.1) 2px,
          transparent 4px,
          transparent 20px
        );
    `}
    
    ${props => props.cosmetic?.effects.overlayPattern === 'volcano-silhouette' && css`
      background-image: 
        radial-gradient(ellipse at 50% 100%, rgba(0, 0, 0, 0.4), transparent 60%),
        linear-gradient(to top, rgba(255, 69, 0, 0.2) 0%, transparent 50%);
    `}
    
    ${props => props.cosmetic?.effects.overlayPattern === 'mountain-range' && css`
      background-image: 
        linear-gradient(
          to top,
          rgba(0, 0, 0, 0.3) 0%,
          rgba(0, 0, 0, 0.2) 20%,
          transparent 40%
        );
    `}
    
    ${props => props.cosmetic?.effects.overlayPattern === 'dune-silhouettes' && css`
      background-image: 
        radial-gradient(ellipse at 0% 80%, rgba(139, 69, 19, 0.3), transparent),
        radial-gradient(ellipse at 100% 70%, rgba(139, 69, 19, 0.2), transparent),
        radial-gradient(ellipse at 50% 90%, rgba(139, 69, 19, 0.1), transparent);
    `}
    
    ${props => props.cosmetic?.effects.overlayPattern === 'nebula-swirls' && css`
      background-image: 
        radial-gradient(circle at 20% 30%, rgba(138, 43, 226, 0.3), transparent 50%),
        radial-gradient(circle at 80% 70%, rgba(25, 25, 112, 0.2), transparent 50%),
        radial-gradient(circle at 50% 50%, rgba(255, 20, 147, 0.1), transparent 50%);
    `}
    
    ${props => props.cosmetic?.effects.overlayPattern === 'code-streams' && css`
      background-image: 
        repeating-linear-gradient(
          90deg,
          transparent 0px,
          rgba(0, 255, 65, 0.1) 1px,
          transparent 2px,
          transparent 15px
        ),
        repeating-linear-gradient(
          0deg,
          transparent 0px,
          rgba(0, 255, 65, 0.05) 1px,
          transparent 2px,
          transparent 25px
        );
    `}
    
    ${props => props.cosmetic?.effects.overlayPattern === 'prism-light' && css`
      background-image: 
        linear-gradient(45deg, rgba(255, 0, 0, 0.1) 0%, rgba(255, 127, 0, 0.1) 16%, rgba(255, 255, 0, 0.1) 33%, rgba(0, 255, 0, 0.1) 50%, rgba(0, 0, 255, 0.1) 66%, rgba(139, 0, 255, 0.1) 83%, rgba(255, 0, 255, 0.1) 100%);
    `}
    
    ${props => props.cosmetic?.effects.overlayPattern === 'branch-silhouettes' && css`
      background-image: 
        radial-gradient(ellipse at 10% 0%, rgba(0, 0, 0, 0.2), transparent 30%),
        radial-gradient(ellipse at 90% 0%, rgba(0, 0, 0, 0.15), transparent 25%),
        radial-gradient(ellipse at 50% 0%, rgba(0, 0, 0, 0.1), transparent 20%);
    `}
    
    ${props => props.cosmetic?.effects.overlayPattern === 'gear-mechanisms' && css`
      background-image: 
        radial-gradient(circle at 25% 25%, rgba(139, 69, 19, 0.2), transparent 20%),
        radial-gradient(circle at 75% 75%, rgba(139, 69, 19, 0.15), transparent 15%),
        radial-gradient(circle at 75% 25%, rgba(139, 69, 19, 0.1), transparent 10%);
    `}
    
    ${props => props.cosmetic?.effects.overlayPattern === 'storm-clouds' && css`
      background-image: 
        radial-gradient(ellipse at 30% 20%, rgba(0, 0, 0, 0.4), transparent 60%),
        radial-gradient(ellipse at 70% 30%, rgba(0, 0, 0, 0.3), transparent 50%),
        radial-gradient(ellipse at 50% 10%, rgba(0, 0, 0, 0.2), transparent 40%);
    `}
    
    ${props => props.cosmetic?.effects.overlayPattern === 'portal-rings' && css`
      background-image: 
        radial-gradient(circle at 50% 50%, transparent 30%, rgba(75, 0, 130, 0.3) 35%, transparent 40%),
        radial-gradient(circle at 50% 50%, transparent 50%, rgba(139, 0, 139, 0.2) 55%, transparent 60%);
    `}
    
    ${props => props.cosmetic?.effects.overlayPattern === 'cave-formations' && css`
      background-image: 
        radial-gradient(ellipse at 0% 0%, rgba(75, 0, 130, 0.3), transparent 40%),
        radial-gradient(ellipse at 100% 0%, rgba(138, 43, 226, 0.2), transparent 30%),
        radial-gradient(ellipse at 50% 100%, rgba(186, 85, 211, 0.1), transparent 50%);
    `}
    
    ${props => props.cosmetic?.effects.overlayPattern === 'hill-silhouettes' && css`
      background-image: 
        linear-gradient(
          to top,
          rgba(0, 0, 0, 0.2) 0%,
          rgba(0, 0, 0, 0.1) 30%,
          transparent 50%
        );
    `}
    
    ${props => props.cosmetic?.effects.overlayPattern === 'industrial-ruins' && css`
      background-image: 
        linear-gradient(to top, rgba(0, 0, 0, 0.4) 0%, transparent 60%),
        radial-gradient(ellipse at 20% 80%, rgba(0, 100, 0, 0.2), transparent 50%),
        radial-gradient(ellipse at 80% 90%, rgba(0, 100, 0, 0.1), transparent 40%);
    `}
    
    ${props => props.cosmetic?.effects.overlayPattern === 'phoenix-silhouette' && css`
      background-image: 
        radial-gradient(ellipse at 50% 60%, rgba(255, 69, 0, 0.3), transparent 50%),
        radial-gradient(ellipse at 30% 40%, rgba(255, 140, 0, 0.2), transparent 30%),
        radial-gradient(ellipse at 70% 40%, rgba(255, 140, 0, 0.2), transparent 30%);
    `}
    
    ${props => props.cosmetic?.effects.overlayPattern === 'spiral-arms' && css`
      background-image: 
        conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(147, 0, 211, 0.3) 45deg, transparent 90deg, rgba(75, 0, 130, 0.2) 135deg, transparent 180deg, rgba(147, 0, 211, 0.3) 225deg, transparent 270deg, rgba(75, 0, 130, 0.2) 315deg, transparent 360deg);
    `}
  }
`;

const ProfileContent = styled.div`
  position: relative;
  z-index: 2;
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const ProfileIcon = styled.div`
  font-size: 48px;
  margin-bottom: 12px;
  filter: drop-shadow(0 0 10px rgba(0, 0, 0, 0.5));
  
  ${props => props.cosmetic && css`
    filter: drop-shadow(0 0 15px ${props.cosmetic.effects.backgroundColor?.includes('gradient') ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'});
  `}
`;

const ProfileTitle = styled.h3`
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.7);
  margin: 0;
`;

const ProfileDescription = styled.p`
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  text-align: center;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  margin: 8px 0 0 0;
  max-width: 300px;
`;

const CosmeticProfile = ({ 
  cosmetic,
  children,
  className,
  style,
  showDetails = false,
  fullScreen = false
}) => {
  const { cosmeticSettings } = useCosmetics();
  
  // Check if profiles are disabled globally
  if (!cosmeticSettings?.showProfiles || cosmeticSettings?.globalDisable || !cosmetic) {
    return children || null;
  }
  
  // Debug logging removed for production
  
  return (
    <ProfileContainer 
      cosmetic={cosmetic} 
      className={className}
      style={{
        ...style,
        // Force override for full-screen backgrounds
        ...(style?.position === 'absolute' && {
          borderRadius: '0px !important',
          border: 'none !important',
          minHeight: '100vh !important'
        })
      }}
      $fullScreen={fullScreen}
      $disableAnimations={!cosmeticSettings?.showAnimations}
      $brightness={cosmeticSettings?.brightness}
    >
      <ProfileContent>
        {cosmetic && cosmetic.icon && (
          <ProfileIcon cosmetic={cosmetic}>
            {cosmetic.icon}
          </ProfileIcon>
        )}
        
        {showDetails && cosmetic && (
          <>
            <ProfileTitle>{cosmetic.name}</ProfileTitle>
            <ProfileDescription>{cosmetic.description}</ProfileDescription>
          </>
        )}
        
        {children}
      </ProfileContent>
    </ProfileContainer>
  );
};

export default CosmeticProfile;