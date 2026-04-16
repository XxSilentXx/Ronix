import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getAvatarUrl } from '../utils/avatarUtils';

const AvatarContainer = styled.div`
  width: ${props => props.$size || '40'}px;
  height: ${props => props.$size || '40'}px;
  border-radius: 50%;
  background: ${props => props.$imageUrl ? `url(${props.$imageUrl}) no-repeat center/cover` : 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)'};
  border: ${props => props.$borderWidth || 2}px solid ${props => props.$borderColor || '#4facfe'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  box-shadow: 0 2px 10px rgba(79, 172, 254, 0.2);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &:hover {
    transform: ${props => props.$noHoverEffect ? 'none' : 'scale(1.05)'};
    border-color: ${props => props.$hoverBorderColor || '#ff61e6'};
    box-shadow: 0 4px 15px rgba(79, 172, 254, 0.4);
  }
`;

const InitialText = styled.span`
  font-size: ${props => Math.max(props.$size / 2.5, 12)}px;
  font-weight: bold;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
`;

const StatusIndicator = styled.div`
  width: ${props => props.$size / 4}px;
  height: ${props => props.$size / 4}px;
  border-radius: 50%;
  background-color: ${props => props.$online ? '#4cd137' : '#718093'};
  position: absolute;
  bottom: 0;
  right: 0;
  border: 2px solid white;
`;

const DEFAULT_AVATAR_URL = '/assets/avatar/default-avatar.png';

/**
 * Consistent user avatar component that prioritizes Discord avatar
 * 
 * @param {Object} props - Component props
 * @param {string} props.userId - User ID to get avatar for
 * @param {Object} props.userData - User data object (if already available)
 * @param {string} props.fallbackUrl - Fallback URL if no avatar found
 * @param {number} props.size - Size in pixels (default: 40)
 * @param {string} props.initial - Initial to show if no avatar
 * @param {boolean} props.showStatus - Whether to show online status
 * @param {boolean} props.isOnline - Online status
 * @param {string} props.borderColor - Border color
 * @param {boolean} props.noHoverEffect - Disable hover effect
 * @returns {JSX.Element} UserAvatar component
 */
const UserAvatar = ({
  userId,
  userData: propUserData,
  fallbackUrl,
  size = 40,
  initial,
  showStatus = false,
  isOnline = false,
  borderColor = '#4facfe',
  hoverBorderColor = '#ff61e6',
  borderWidth = 2,
  noHoverEffect = false,
  onClick
}) => {
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [userInitial, setUserInitial] = useState(initial);
  const [userData, setUserData] = useState(propUserData);
  
  // If userId is provided, fetch user data
  useEffect(() => {
    if (!userId || propUserData) return;
    
    const fetchUserData = async () => {
      try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const fetchedUserData = userDoc.data();
          setUserData(fetchedUserData);
          
          // Get avatar URL using the centralized utility
          const url = getAvatarUrl(fetchedUserData);
          setAvatarUrl(url);
          
          // Set initial if not provided
          if (!initial && fetchedUserData.displayName) {
            setUserInitial(fetchedUserData.displayName.charAt(0).toUpperCase());
          }
        }
      } catch (error) {
        console.error('Error fetching user data for avatar:', error);
      }
    };
    
    fetchUserData();
  }, [userId, propUserData, initial]);
  
  // If userData is provided directly, use it
  useEffect(() => {
    if (propUserData) {
      setUserData(propUserData);
      
      // Get avatar URL using the centralized utility
      const url = getAvatarUrl(propUserData);
      setAvatarUrl(url);
      
      // Set initial if not provided
      if (!initial && propUserData.displayName) {
        setUserInitial(propUserData.displayName.charAt(0).toUpperCase());
      }
    }
  }, [propUserData, initial]);
  
  // Fall back to provided URL, then default avatar if no avatar found
  const displayUrl = avatarUrl || fallbackUrl || DEFAULT_AVATAR_URL;
  
  return (
    <AvatarContainer 
      $imageUrl={displayUrl}
      $size={size}
      $borderColor={borderColor}
      $hoverBorderColor={hoverBorderColor}
      $borderWidth={borderWidth}
      $noHoverEffect={noHoverEffect}
      onClick={onClick}
    >
      {!displayUrl && userInitial && (
        <InitialText $size={size}>
          {userInitial}
        </InitialText>
      )}
      
      {showStatus && (
        <StatusIndicator 
          $online={isOnline} 
          $size={size}
        />
      )}
    </AvatarContainer>
  );
};

export default UserAvatar;
