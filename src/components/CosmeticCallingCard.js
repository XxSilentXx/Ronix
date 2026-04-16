import React from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useCosmetics } from '../contexts/CosmeticContext';
import NinjaSVG from '../assets/icons/ninja-svgrepo-com.svg';

// Animation keyframes for calling cards
const battleGlow = keyframes`
  0% { 
    box-shadow: 0 0 8px rgba(255, 215, 0, 0.4);
    filter: brightness(1);
  }
  50% { 
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.6), 0 0 25px rgba(220, 20, 60, 0.3);
    filter: brightness(1.05);
  }
  100% { 
    box-shadow: 0 0 8px rgba(255, 215, 0, 0.4);
    filter: brightness(1);
  }
`;

const championShine = keyframes`
  0% { 
    box-shadow: 0 0 12px rgba(255, 215, 0, 0.5);
    transform: scale(1);
  }
  50% { 
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.7), 0 0 30px rgba(255, 165, 0, 0.4);
    transform: scale(1.01);
  }
  100% { 
    box-shadow: 0 0 12px rgba(255, 215, 0, 0.5);
    transform: scale(1);
  }
`;

const cyberPulse = keyframes`
  0% { 
    box-shadow: 0 0 8px rgba(0, 255, 255, 0.4);
    border-color: rgba(0, 255, 255, 0.8);
  }
  50% { 
    box-shadow: 0 0 15px rgba(0, 255, 255, 0.6), 0 0 25px rgba(255, 20, 147, 0.3);
    border-color: rgba(255, 20, 147, 0.8);
  }
  100% { 
    box-shadow: 0 0 8px rgba(0, 255, 255, 0.4);
    border-color: rgba(0, 255, 255, 0.8);
  }
`;

const royalMajesty = keyframes`
  0% { 
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.6);
    filter: brightness(1) hue-rotate(0deg);
  }
  33% { 
    box-shadow: 0 0 25px rgba(255, 97, 230, 0.6), 0 0 35px rgba(255, 215, 0, 0.4);
    filter: brightness(1.05) hue-rotate(5deg);
  }
  66% { 
    box-shadow: 0 0 20px rgba(138, 43, 226, 0.6), 0 0 30px rgba(255, 97, 230, 0.5);
    filter: brightness(1.03) hue-rotate(-3deg);
  }
  100% { 
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.6);
    filter: brightness(1) hue-rotate(0deg);
  }
`;

const iceCrystal = keyframes`
  0% { 
    box-shadow: 0 0 8px rgba(176, 224, 230, 0.4);
    filter: brightness(1);
  }
  50% { 
    box-shadow: 0 0 15px rgba(176, 224, 230, 0.6), 0 0 25px rgba(135, 206, 235, 0.3);
    filter: brightness(1.05);
  }
  100% { 
    box-shadow: 0 0 8px rgba(176, 224, 230, 0.4);
    filter: brightness(1);
  }
`;

const neonPulse = keyframes`
  0% { 
    box-shadow: 0 0 12px rgba(255, 190, 11, 0.5);
    filter: brightness(1) saturate(1);
  }
  50% { 
    box-shadow: 0 0 20px rgba(255, 190, 11, 0.7), 0 0 30px rgba(255, 0, 110, 0.4);
    filter: brightness(1.1) saturate(1.1);
  }
  100% { 
    box-shadow: 0 0 12px rgba(255, 190, 11, 0.5);
    filter: brightness(1) saturate(1);
  }
`;

const cosmicDrift = keyframes`
  0% { 
    box-shadow: 0 0 15px rgba(102, 252, 241, 0.3);
    filter: brightness(1) hue-rotate(0deg);
  }
  33% { 
    box-shadow: 0 0 25px rgba(102, 252, 241, 0.5), 0 0 35px rgba(69, 162, 158, 0.4);
    filter: brightness(1.05) hue-rotate(10deg);
  }
  66% { 
    box-shadow: 0 0 20px rgba(69, 162, 158, 0.5), 0 0 30px rgba(102, 252, 241, 0.3);
    filter: brightness(1.03) hue-rotate(-5deg);
  }
  100% { 
    box-shadow: 0 0 15px rgba(102, 252, 241, 0.3);
    filter: brightness(1) hue-rotate(0deg);
  }
`;

const flameBurst = keyframes`
  0% { 
    box-shadow: 0 0 12px rgba(255, 69, 0, 0.6);
    transform: scale(1);
  }
  25% { 
    box-shadow: 0 0 20px rgba(255, 140, 0, 0.6), 0 0 30px rgba(255, 215, 0, 0.4);
    transform: scale(1.02);
  }
  50% { 
    box-shadow: 0 0 25px rgba(255, 215, 0, 0.7), 0 0 35px rgba(255, 69, 0, 0.5);
    transform: scale(1.03);
  }
  75% { 
    box-shadow: 0 0 20px rgba(255, 140, 0, 0.6), 0 0 30px rgba(255, 215, 0, 0.4);
    transform: scale(1.02);
  }
  100% { 
    box-shadow: 0 0 12px rgba(255, 69, 0, 0.6);
    transform: scale(1);
  }
`;

const petalFall = keyframes`
  0% { 
    box-shadow: 0 0 10px rgba(255, 105, 180, 0.4);
    filter: brightness(1);
  }
  50% { 
    box-shadow: 0 0 18px rgba(255, 105, 180, 0.6), 0 0 25px rgba(255, 182, 193, 0.5);
    filter: brightness(1.05);
  }
  100% { 
    box-shadow: 0 0 10px rgba(255, 105, 180, 0.4);
    filter: brightness(1);
  }
`;

const matrixRain = keyframes`
  0% { 
    box-shadow: 0 0 8px rgba(0, 255, 0, 0.5);
    filter: brightness(1);
  }
  50% { 
    box-shadow: 0 0 15px rgba(0, 255, 0, 0.7), 0 0 25px rgba(0, 255, 65, 0.5);
    filter: brightness(1.1);
  }
  100% { 
    box-shadow: 0 0 8px rgba(0, 255, 0, 0.5);
    filter: brightness(1);
  }
`;

const phoenixFlame = keyframes`
  0% { 
    box-shadow: 0 0 15px rgba(255, 0, 0, 0.6);
    filter: brightness(1) hue-rotate(0deg);
    transform: scale(1);
  }
  25% { 
    box-shadow: 0 0 25px rgba(255, 69, 0, 0.7), 0 0 35px rgba(255, 140, 0, 0.5);
    filter: brightness(1.1) hue-rotate(5deg);
    transform: scale(1.01);
  }
  50% { 
    box-shadow: 0 0 30px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 165, 0, 0.6);
    filter: brightness(1.15) hue-rotate(10deg);
    transform: scale(1.02);
  }
  75% { 
    box-shadow: 0 0 25px rgba(255, 69, 0, 0.7), 0 0 35px rgba(255, 140, 0, 0.5);
    filter: brightness(1.1) hue-rotate(5deg);
    transform: scale(1.01);
  }
  100% { 
    box-shadow: 0 0 15px rgba(255, 0, 0, 0.6);
    filter: brightness(1) hue-rotate(0deg);
    transform: scale(1);
  }
`;

const waveFlow = keyframes`
  0% { 
    box-shadow: 0 0 15px rgba(57, 204, 204, 0.6);
    filter: brightness(1);
  }
  50% { 
    box-shadow: 0 0 25px rgba(57, 204, 204, 0.9), 0 0 35px rgba(127, 219, 255, 0.7);
    filter: brightness(1.15);
  }
  100% { 
    box-shadow: 0 0 15px rgba(57, 204, 204, 0.6);
    filter: brightness(1);
  }
`;

const lightningStrike = keyframes`
  0% { 
    box-shadow: 0 0 12px rgba(241, 196, 15, 0.7);
    filter: brightness(1);
  }
  10% { 
    box-shadow: 0 0 30px rgba(241, 196, 15, 1), 0 0 40px rgba(243, 156, 18, 0.8);
    filter: brightness(1.5);
  }
  20% { 
    box-shadow: 0 0 12px rgba(241, 196, 15, 0.7);
    filter: brightness(1);
  }
  100% { 
    box-shadow: 0 0 12px rgba(241, 196, 15, 0.7);
    filter: brightness(1);
  }
`;

const sunsetGlow = keyframes`
  0% { 
    box-shadow: 0 0 18px rgba(255, 69, 0, 0.6);
    filter: brightness(1);
  }
  50% { 
    box-shadow: 0 0 28px rgba(255, 215, 0, 0.8), 0 0 38px rgba(255, 165, 0, 0.6);
    filter: brightness(1.2);
  }
  100% { 
    box-shadow: 0 0 18px rgba(255, 69, 0, 0.6);
    filter: brightness(1);
  }
`;

const shadowFade = keyframes`
  0% { 
    box-shadow: 0 0 8px rgba(105, 105, 105, 0.4);
    filter: brightness(1);
  }
  50% { 
    box-shadow: 0 0 16px rgba(105, 105, 105, 0.7), 0 0 24px rgba(128, 128, 128, 0.5);
    filter: brightness(1.1);
  }
  100% { 
    box-shadow: 0 0 8px rgba(105, 105, 105, 0.4);
    filter: brightness(1);
  }
`;

const CallingCardContainer = styled.div`
  position: relative;
  padding: 16px;
  border-radius: 12px;
  border: 2px solid ${props => props.cosmetic?.effects?.borderColor || '#4facfe'};
  background: ${props =>
    props.cosmetic?.effects?.image
      ? `url(${props.cosmetic.effects.image}) center/cover, ${props.cosmetic?.effects?.backgroundColor || 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'}`
      : props.cosmetic?.effects?.backgroundColor || 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
  };
  color: ${props => props.cosmetic?.effects?.textColor || '#ffffff'};
  min-height: 80px;
  transition: all 0.3s ease;
  overflow: hidden;
  
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
    background: rgba(0, 0, 0, 0.15);
    pointer-events: none;
    z-index: 1;
  }
  
  /* Ensure content appears above the overlay */
  > * {
    position: relative;
    z-index: 2;
  }

  ${props => !props.$disableAnimations && css`
    ${props.cosmetic?.effects?.animation === 'battle-glow' && css`
      animation: ${battleGlow} 2s ease-in-out infinite;
    `}
    
    ${props.cosmetic?.effects?.animation === 'champion-shine' && css`
      animation: ${championShine} 2.5s ease-in-out infinite;
    `}
    
    ${props.cosmetic?.effects?.animation === 'cyber-pulse' && css`
      animation: ${cyberPulse} 2s ease-in-out infinite;
    `}
    
    ${props.cosmetic?.effects?.animation === 'royal-majesty' && css`
      animation: ${royalMajesty} 3s ease-in-out infinite;
    `}
    
    ${props.cosmetic?.effects?.animation === 'ice-crystal' && css`
      animation: ${iceCrystal} 2.8s ease-in-out infinite;
    `}
    
    ${props.cosmetic?.effects?.animation === 'neon-pulse' && css`
      animation: ${neonPulse} 2.2s ease-in-out infinite;
    `}
    
    ${props.cosmetic?.effects?.animation === 'cosmic-drift' && css`
      animation: ${cosmicDrift} 4s ease-in-out infinite;
    `}
    
    ${props.cosmetic?.effects?.animation === 'flame-burst' && css`
      animation: ${flameBurst} 1.8s ease-in-out infinite;
    `}
    
    ${props.cosmetic?.effects?.animation === 'petal-fall' && css`
      animation: ${petalFall} 3s ease-in-out infinite;
    `}
    
    ${props.cosmetic?.effects?.animation === 'matrix-rain' && css`
      animation: ${matrixRain} 2s ease-in-out infinite;
    `}
    
    ${props.cosmetic?.effects?.animation === 'phoenix-flame' && css`
      animation: ${phoenixFlame} 2.5s ease-in-out infinite;
    `}
    
    ${props.cosmetic?.effects?.animation === 'wave-flow' && css`
      animation: ${waveFlow} 3s ease-in-out infinite;
    `}
    
    ${props.cosmetic?.effects?.animation === 'lightning-strike' && css`
      animation: ${lightningStrike} 3s ease-in-out infinite;
    `}
    
    ${props.cosmetic?.effects?.animation === 'sunset-glow' && css`
      animation: ${sunsetGlow} 2.8s ease-in-out infinite;
    `}
    
    ${props.cosmetic?.effects?.animation === 'shadow-fade' && css`
      animation: ${shadowFade} 2.2s ease-in-out infinite;
    `}
  `}
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    opacity: 0.1;
    background-size: cover;
    background-position: center;
    z-index: 0;
    
    ${props => props.cosmetic?.effects?.pattern === 'crossed-swords' && css`
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M20 20 L80 80 M80 20 L20 80' stroke='%23FFD700' stroke-width='2' fill='none'/%3E%3C/svg%3E");
    `}
    
    ${props => props.cosmetic?.effects?.pattern === 'trophy-crown' && css`
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M30 70 L70 70 L65 50 L35 50 Z M50 40 L45 50 L55 50 Z' fill='%238B4513' opacity='0.3'/%3E%3C/svg%3E");
    `}
    
    ${props => props.cosmetic?.effects?.pattern === 'circuit-lines' && css`
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M0 20 L100 20 M0 50 L100 50 M0 80 L100 80 M20 0 L20 100 M50 0 L50 100 M80 0 L80 100' stroke='%2300FFFF' stroke-width='1' opacity='0.3'/%3E%3C/svg%3E");
    `}
    
    ${props => props.cosmetic?.effects?.pattern === 'royal-crest' && css`
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 20 L60 40 L40 40 Z M30 60 L70 60 L65 80 L35 80 Z' fill='%23FFD700' opacity='0.2'/%3E%3C/svg%3E");
    `}
    
    ${props => props.cosmetic?.effects?.pattern === 'snowflakes' && css`
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cg fill='%2387CEEB' opacity='0.3'%3E%3Cpath d='M25 25 L35 35 M35 25 L25 35 M30 20 L30 40 M20 30 L40 30'/%3E%3Cpath d='M65 65 L75 75 M75 65 L65 75 M70 60 L70 80 M60 70 L80 70'/%3E%3C/g%3E%3C/svg%3E");
    `}
    
    ${props => props.cosmetic?.effects?.pattern === 'retro-grid' && css`
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3Cpattern id='grid' width='20' height='20' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 20 0 L 0 0 0 20' fill='none' stroke='%23FFBE0B' stroke-width='1' opacity='0.3'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23grid)'/%3E%3C/svg%3E");
    `}
    
    ${props => props.cosmetic?.effects?.pattern === 'stars-nebula' && css`
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cg fill='%2366FCF1' opacity='0.2'%3E%3Ccircle cx='20' cy='20' r='1'/%3E%3Ccircle cx='80' cy='30' r='1.5'/%3E%3Ccircle cx='40' cy='60' r='1'/%3E%3Ccircle cx='70' cy='80' r='1.2'/%3E%3Ccircle cx='30' cy='80' r='0.8'/%3E%3C/g%3E%3C/svg%3E");
    `}
    
    ${props => props.cosmetic?.effects?.pattern === 'dragon-scales' && css`
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cg fill='%23FFD700' opacity='0.2'%3E%3Cpath d='M10 10 Q20 5 30 10 Q20 15 10 10 M30 10 Q40 5 50 10 Q40 15 30 10 M50 10 Q60 5 70 10 Q60 15 50 10'/%3E%3Cpath d='M20 25 Q30 20 40 25 Q30 30 20 25 M40 25 Q50 20 60 25 Q50 30 40 25'/%3E%3C/g%3E%3C/svg%3E");
    `}
    
    ${props => props.cosmetic?.effects?.pattern === 'cherry-blossoms' && css`
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cg fill='%23FF1493' opacity='0.3'%3E%3Cpath d='M20 20 Q25 15 30 20 Q25 25 20 20 M25 17 Q30 12 35 17 Q30 22 25 17'/%3E%3Cpath d='M60 60 Q65 55 70 60 Q65 65 60 60 M65 57 Q70 52 75 57 Q70 62 65 57'/%3E%3C/g%3E%3C/svg%3E");
    `}
    
    ${props => props.cosmetic?.effects?.pattern === 'digital-code' && css`
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cg fill='%2300FF41' opacity='0.2' font-family='monospace' font-size='8'%3E%3Ctext x='10' y='20'%3E01%3C/text%3E%3Ctext x='30' y='40'%3E10%3C/text%3E%3Ctext x='50' y='60'%3E11%3C/text%3E%3Ctext x='70' y='80'%3E00%3C/text%3E%3C/g%3E%3C/svg%3E");
    `}
    
    ${props => props.cosmetic?.effects?.pattern === 'flame-wings' && css`
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cg fill='%23FFD700' opacity='0.2'%3E%3Cpath d='M30 50 Q20 30 10 50 Q20 40 30 50 M70 50 Q80 30 90 50 Q80 40 70 50'/%3E%3C/g%3E%3C/svg%3E");
    `}
    
    ${props => props.cosmetic?.effects?.pattern === 'water-ripples' && css`
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cg fill='none' stroke='%237FDBFF' stroke-width='1' opacity='0.3'%3E%3Ccircle cx='50' cy='50' r='10'/%3E%3Ccircle cx='50' cy='50' r='20'/%3E%3Ccircle cx='50' cy='50' r='30'/%3E%3C/g%3E%3C/svg%3E");
    `}
    
    ${props => props.cosmetic?.effects?.pattern === 'electric-bolts' && css`
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cg fill='%23F39C12' opacity='0.3'%3E%3Cpath d='M20 10 L25 30 L15 30 L30 50 L20 50 L35 70'/%3E%3Cpath d='M70 20 L75 40 L65 40 L80 60 L70 60 L85 80'/%3E%3C/g%3E%3C/svg%3E");
    `}
    
    ${props => props.cosmetic?.effects?.pattern === 'sun-rays' && css`
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cg fill='%23FF6347' opacity='0.2'%3E%3Cpath d='M50 10 L52 30 L48 30 Z M50 90 L52 70 L48 70 Z M10 50 L30 52 L30 48 Z M90 50 L70 52 L70 48 Z'/%3E%3C/g%3E%3C/svg%3E");
    `}
    
    ${props => props.cosmetic?.effects?.pattern === 'camo-digital' && css`
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cg fill='%23808080' opacity='0.2'%3E%3Crect x='10' y='10' width='15' height='15'/%3E%3Crect x='30' y='30' width='20' height='10'/%3E%3Crect x='60' y='20' width='10' height='20'/%3E%3Crect x='20' y='60' width='25' height='8'/%3E%3C/g%3E%3C/svg%3E");
    `}
    
    ${props => props.cosmetic?.effects?.pattern === 'quantum-rifts' && css`
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cg fill='none' stroke='%23FF00FF' stroke-width='2' opacity='0.4'%3E%3Cpath d='M20 30 Q40 10 60 30 Q80 50 60 70 Q40 90 20 70 Q0 50 20 30' /%3E%3Cpath d='M50 20 Q70 0 90 20 Q70 40 50 20' /%3E%3Cpath d='M10 80 Q30 60 50 80 Q30 100 10 80' /%3E%3C/g%3E%3C/svg%3E");
    `}
    
    ${props => props.cosmetic?.effects?.pattern === 'hellfire-spirals' && css`
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cg fill='%23FF4500' opacity='0.3'%3E%3Cpath d='M50 10 Q70 30 50 50 Q30 70 50 90 Q70 70 50 50 Q30 30 50 10' /%3E%3Cpath d='M20 20 Q35 35 20 50 Q5 35 20 20' /%3E%3Cpath d='M80 50 Q95 65 80 80 Q65 65 80 50' /%3E%3C/g%3E%3C/svg%3E");
    `}
    
    ${props => props.cosmetic?.effects?.pattern === 'galactic-swirls' && css`
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cg fill='none' stroke='%239370DB' stroke-width='1.5' opacity='0.3'%3E%3Cpath d='M50 50 Q30 30 10 50 Q30 70 50 50 Q70 30 90 50 Q70 70 50 50' /%3E%3Ccircle cx='20' cy='20' r='2' fill='%23DDA0DD' /%3E%3Ccircle cx='80' cy='80' r='1.5' fill='%23DDA0DD' /%3E%3Ccircle cx='30' cy='70' r='1' fill='%23DDA0DD' /%3E%3C/g%3E%3C/svg%3E");
    `}
    
    ${props => props.cosmetic?.effects?.pattern === 'cyber-grid' && css`
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cg fill='none' stroke='%23FF1493' stroke-width='1' opacity='0.4'%3E%3Cpath d='M0 25 L100 25 M0 50 L100 50 M0 75 L100 75 M25 0 L25 100 M50 0 L50 100 M75 0 L75 100' /%3E%3Ccircle cx='25' cy='25' r='3' fill='%2300FFFF' /%3E%3Ccircle cx='75' cy='75' r='3' fill='%2300FFFF' /%3E%3C/g%3E%3C/svg%3E");
    `}
    
    ${props => props.cosmetic?.effects?.pattern === 'storm-bolts' && css`
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cg fill='%23FFFF00' opacity='0.4'%3E%3Cpath d='M15 10 L25 30 L20 30 L30 50 L25 50 L35 70 M65 15 L75 35 L70 35 L80 55 L75 55 L85 75' /%3E%3Cpath d='M40 20 L45 35 L42 35 L50 50' /%3E%3C/g%3E%3C/svg%3E");
    `}
    
    ${props => props.cosmetic?.effects?.pattern === 'void-rifts' && css`
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cg fill='none' stroke='%234B0082' stroke-width='3' opacity='0.5'%3E%3Cpath d='M10 30 Q50 10 90 30 Q50 50 10 30' /%3E%3Cpath d='M20 70 Q50 90 80 70 Q50 50 20 70' /%3E%3Cpath d='M30 20 Q60 40 30 60' /%3E%3C/g%3E%3C/svg%3E");
    `}
    
    ${props => props.cosmetic?.effects?.pattern === 'prismatic-shards' && css`
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cg fill='%23B0E0E6' opacity='0.3'%3E%3Cpath d='M20 20 L40 10 L30 30 Z M60 30 L80 20 L70 40 Z M30 60 L50 70 L40 80 Z M70 70 L90 80 L80 90 Z' /%3E%3Cpath d='M10 50 L30 40 L20 60 Z M50 10 L70 20 L60 0 Z' /%3E%3C/g%3E%3C/svg%3E");
    `}
    
    ${props => props.cosmetic?.effects?.pattern === 'plasma-spirals' && css`
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cg fill='none' stroke='%23FFD700' stroke-width='2' opacity='0.4'%3E%3Cpath d='M50 50 Q20 20 50 10 Q80 20 50 50 Q20 80 50 90 Q80 80 50 50' /%3E%3Cpath d='M25 25 Q50 0 75 25 Q50 50 25 25' /%3E%3C/g%3E%3C/svg%3E");
    `}
    
    ${props => props.cosmetic?.effects?.pattern === 'ghost-trails' && css`
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cg fill='%23A9A9A9' opacity='0.2'%3E%3Cpath d='M10 20 Q30 10 50 20 Q70 30 90 20 Q70 40 50 50 Q30 60 10 50 Q30 40 50 30 Q70 20 90 30' /%3E%3Ccircle cx='20' cy='30' r='2' /%3E%3Ccircle cx='80' cy='70' r='1.5' /%3E%3C/g%3E%3C/svg%3E");
    `}
    
    ${props => props.cosmetic?.effects?.pattern === 'lunar-phases' && css`
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cg fill='%23FF6347' opacity='0.3'%3E%3Ccircle cx='20' cy='30' r='8' /%3E%3Cpath d='M50 25 Q55 20 60 25 Q55 30 50 25' /%3E%3Cpath d='M75 35 Q85 30 90 40 Q80 45 75 35' /%3E%3Ccircle cx='30' cy='70' r='6' /%3E%3C/g%3E%3C/svg%3E");
    `}
    
    ${props => props.cosmetic?.effects?.pattern === 'omega-symbols' && css`
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cg fill='%2300FFFF' opacity='0.4' font-family='serif' font-size='20'%3E%3Ctext x='20' y='30'%3EΩ%3C/text%3E%3Ctext x='60' y='70'%3EΩ%3C/text%3E%3Ctext x='70' y='30'%3EΩ%3C/text%3E%3Ctext x='30' y='80'%3EΩ%3C/text%3E%3C/g%3E%3C/svg%3E");
    `}
    
    ${props => props.cosmetic?.effects?.pattern === 'dimension-portals' && css`
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cg fill='none' stroke='%23FF69B4' stroke-width='2' opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='15' /%3E%3Ccircle cx='70' cy='70' r='12' /%3E%3Cpath d='M45 30 Q50 50 55 30' /%3E%3Cpath d='M55 70 Q60 50 65 70' /%3E%3C/g%3E%3C/svg%3E");
    `}
  }
  
  &:hover {
    transform: translateY(-2px);
    filter: brightness(1.1);
  }
`;

const CallingCardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  position: relative;
  z-index: 2;
`;

const CallingCardIcon = styled.span`
  font-size: 1.5rem;
  color: ${props => props.cosmetic?.effects?.iconColor || '#4facfe'};
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
`;

const CallingCardTitle = styled.div`
  font-weight: 700;
  font-size: 1rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
  flex: 1;
`;

const CallingCardContent = styled.div`
  position: relative;
  z-index: 2;
  font-size: 0.9rem;
  line-height: 1.4;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
`;

const CosmeticCallingCard = ({ 
  userId, 
  cosmetic,
  title,
  content,
  showTooltip = true,
  className,
  style,
  children
}) => {
  const { getEquippedCosmetic, cosmeticSettings } = useCosmetics();
  
  // Use provided cosmetic or get equipped calling card for the user
  let activeCard = cosmetic;
  
  if (!cosmetic) {
    activeCard = getEquippedCosmetic('callingCard');
  }
  
  // Check cosmetic settings (only if no explicit cosmetic was provided)
  if (!cosmetic && (!cosmeticSettings?.showCallingCards || cosmeticSettings?.globalDisable)) {
    // If cosmetics are disabled, show a basic card
    return (
      <CallingCardContainer style={style} className={className}>
        <CallingCardHeader>
          <CallingCardIcon></CallingCardIcon>
          <CallingCardTitle>{title || 'Player Card'}</CallingCardTitle>
        </CallingCardHeader>
        <CallingCardContent>
          {content || children || 'Default calling card'}
        </CallingCardContent>
      </CallingCardContainer>
    );
  }
  
  // Debug logging removed for production
  
  return (
    <CallingCardContainer 
      cosmetic={activeCard}
      $disableAnimations={!cosmeticSettings?.showAnimations}
      $brightness={cosmeticSettings?.brightness}
      style={style}
      className={className}
      title={showTooltip && activeCard ? `${activeCard.name} - ${activeCard.description}` : undefined}
    >
      <CallingCardHeader>
        <CallingCardIcon cosmetic={activeCard}>
          {activeCard?.asset === 'token-logo.png' ? (
            <img src="/assets/token-logo.png" alt="Token" style={{ width: 32, height: 32, verticalAlign: 'middle' }} />
          ) : activeCard?.asset === 'ninja-svgrepo-com.svg' ? (
            <img src={NinjaSVG} alt="Shadow Operative" style={{ width: 32, height: 32, verticalAlign: 'middle' }} />
          ) : (
            activeCard?.icon || ''
          )}
        </CallingCardIcon>
        <CallingCardTitle>
          {title || activeCard?.name || 'Player Card'}
        </CallingCardTitle>
      </CallingCardHeader>
      <CallingCardContent>
        {content || children || (activeCard ? `${activeCard.name} calling card` : 'Default calling card')}
      </CallingCardContent>
    </CallingCardContainer>
  );
};

export default CosmeticCallingCard; 