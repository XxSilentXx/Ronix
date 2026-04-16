import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getCurrentTier, getCurrentLevel } from '../firebase/xpSystem';

const RankBadgeContainer = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-left: ${props => props.$marginLeft || '0.5rem'};
  vertical-align: middle;
`;

const RankIcon = styled.img`
  width: ${props => props.$size || '20'}px;
  height: ${props => props.$size || '20'}px;
  object-fit: contain;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
  transition: all 0.2s ease;
  
  &:hover {
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4)) brightness(1.1);
    transform: scale(1.05);
  }
`;

const RankIconFallback = styled.div`
  width: ${props => props.$size || '20'}px;
  height: ${props => props.$size || '20'}px;
  border-radius: 50%;
  background: ${props => props.$color || '#cd7f32'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${props => Math.max((props.$size || 20) / 2.5, 8)}px;
  font-weight: bold;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
  }
`;

const RankTooltip = styled.div`
  position: absolute;
  top: -35px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  white-space: nowrap;
  z-index: 1000;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
  
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 4px solid transparent;
    border-top-color: rgba(0, 0, 0, 0.9);
  }
`;

const RankWrapper = styled.div`
  position: relative;
  display: inline-flex;
  cursor: ${props => props.$showTooltip ? 'help' : 'default'};
  
  &:hover ${RankTooltip} {
    opacity: ${props => props.$showTooltip ? '1' : '0'};
  }
`;

// Default rank configurations with fallback styling
const RANK_CONFIG = {
  'Bronze': { 
    color: '#cd7f32', 
    shortName: 'BR',
    imagePath: '/assets/ranks/bronze.png'
  },
  'Silver': { 
    color: '#c0c0c0', 
    shortName: 'SI',
    imagePath: '/assets/ranks/silver.png'
  },
  'Gold': { 
    color: '#ffd700', 
    shortName: 'GO',
    imagePath: '/assets/ranks/gold.png'
  },
  'Platinum': { 
    color: '#e5e4e2', 
    shortName: 'PL',
    imagePath: '/assets/ranks/platinum.png'
  },
  'Diamond': { 
    color: '#b9f2ff', 
    shortName: 'DI',
    imagePath: '/assets/ranks/diamond.png'
  },
  'Master': { 
    color: '#ff4500', 
    shortName: 'MA',
    imagePath: '/assets/ranks/master.png'
  }
};

/**
 * RankBadge component that displays a user's rank as an icon or badge
 * 
 * @param {Object} props - Component props
 * @param {string} props.userId - User ID to get rank for
 * @param {Object} props.userData - User data object (if already available)
 * @param {string} props.tier - Tier name (if known)
 * @param {number} props.level - User level (if known)
 * @param {number} props.size - Size in pixels (default: 20)
 * @param {boolean} props.showTooltip - Show tooltip on hover (default: true)
 * @param {string} props.marginLeft - Left margin (default: 0.5rem)
 * @param {boolean} props.useCustomImages - Use custom rank images instead of fallback (default: true)
 * @param {string} props.customImagePath - Custom path for rank images (default: /assets/ranks/)
 * @returns {JSX.Element} RankBadge component
 */
const RankBadge = ({
  userId,
  userData: propUserData,
  tier: propTier,
  level: propLevel,
  size = 20,
  showTooltip = true,
  marginLeft = '0.5rem',
  useCustomImages = true,
  customImagePath = '/assets/ranks/'
}) => {
  const [userData, setUserData] = useState(propUserData);
  const [tier, setTier] = useState(propTier);
  const [level, setLevel] = useState(propLevel);
  const [imageError, setImageError] = useState(false);
  
  // Set up real-time listener for user data changes
  useEffect(() => {
    if (!userId) {
      // If no userId, use provided props or defaults
      setTier(propTier || 'Bronze');
      setLevel(propLevel || 1);
      return;
    }

    // If we have provided tier and level props, use them and don't set up listener
    if (propTier && propLevel) {
      setTier(propTier);
      setLevel(propLevel);
      return;
    }

    // Set up real-time listener for user document
    const userRef = doc(db, 'users', userId);
    
    const unsubscribe = onSnapshot(userRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const user = docSnapshot.data();
        setUserData(user);
        
        // Calculate tier and level from XP if not provided as props
        if (!propTier || !propLevel) {
          const userXp = user.xpTotal || 0;
          const calculatedLevel = getCurrentLevel(userXp);
          const tierInfo = getCurrentTier(calculatedLevel);
          
          // Use calculated values or stored values from document
          const finalTier = propTier || user.currentTier || tierInfo.name;
          const finalLevel = propLevel || user.currentLevel || calculatedLevel;
          
          setTier(finalTier);
          setLevel(finalLevel);
        }
      } else {
        // Default to Bronze tier for users without data
        setTier(propTier || 'Bronze');
        setLevel(propLevel || 1);
      }
    }, (error) => {
      console.error('RankBadge: Error listening to user data:', error);
      // Default to Bronze tier on error
      setTier(propTier || 'Bronze');
      setLevel(propLevel || 1);
    });
    
    // Clean up listener
    return () => unsubscribe();
  }, [userId, propTier, propLevel]);
  
  // Always show at least Bronze rank if no tier is found
  const displayTier = tier || 'Bronze';
  const displayLevel = level || 1;
  
  const rankConfig = RANK_CONFIG[displayTier] || RANK_CONFIG['Bronze'];
  const imagePath = customImagePath + displayTier.toLowerCase() + '.png';
  
  const handleImageError = () => {
    setImageError(true);
  };
  
  return (
    <RankBadgeContainer $marginLeft={marginLeft}>
      <RankWrapper $showTooltip={showTooltip}>
        {useCustomImages && !imageError ? (
          <RankIcon
            src={imagePath}
            alt={`${displayTier} Rank`}
            $size={size}
            onError={handleImageError}
          />
        ) : (
          <RankIconFallback
            $size={size}
            $color={rankConfig.color}
          >
            {rankConfig.shortName}
          </RankIconFallback>
        )}
        
        {showTooltip && (
          <RankTooltip>
            {displayTier} - Level {displayLevel}
          </RankTooltip>
        )}
      </RankWrapper>
    </RankBadgeContainer>
  );
};

export default RankBadge; 