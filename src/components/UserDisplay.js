import React from 'react';
import styled from 'styled-components';
import UserAvatar from './UserAvatar';
import RankBadge from './RankBadge';

const UserDisplayContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.$gap || '0.75rem'};
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
  transition: all 0.2s ease;
  
  ${props => props.$clickable && `
    &:hover {
      transform: translateY(-1px);
    }
  `}
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0; // Allows text truncation
`;

const UserNameContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  line-height: 1.2;
`;

const UserName = styled.span`
  font-weight: ${props => props.$fontWeight || '600'};
  font-size: ${props => props.$fontSize || '1rem'};
  color: ${props => props.$color || '#fff'};
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  
  ${props => props.$truncate && `
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: ${props.$maxWidth || '150px'};
  `}
`;

const UserSubtext = styled.span`
  font-size: ${props => props.$subtextSize || '0.8rem'};
  color: ${props => props.$subtextColor || 'rgba(255, 255, 255, 0.7)'};
  font-weight: 400;
  
  ${props => props.$truncate && `
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: ${props.$maxWidth || '150px'};
  `}
`;

const VerifiedBadge = styled.span`
  color: #4facfe;
  margin-left: 0.25rem;
  
  svg {
    width: 14px;
    height: 14px;
    vertical-align: middle;
  }
`;

const VipBadge = styled.span`
  margin-left: 0.25rem;
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
  svg {
    width: 18px;
    height: 18px;
    color: #ffd700;
    filter: drop-shadow(0 1px 4px #ffd70088);
  }
`;

/**
 * UserDisplay component that shows user avatar, name, and rank badge together
 * 
 * @param {Object} props - Component props
 * @param {string} props.userId - User ID
 * @param {Object} props.userData - User data object (if already available)
 * @param {number} props.avatarSize - Avatar size in pixels (default: 40)
 * @param {number} props.rankSize - Rank badge size in pixels (default: 18)
 * @param {string} props.layout - Layout direction: 'horizontal' or 'vertical' (default: 'horizontal')
 * @param {boolean} props.showRank - Whether to show rank badge (default: true)
 * @param {boolean} props.showSubtext - Whether to show subtext (default: false)
 * @param {string} props.subtext - Custom subtext to display
 * @param {string} props.gap - Gap between avatar and text (default: 0.75rem)
 * @param {boolean} props.clickable - Make the component clickable (default: false)
 * @param {function} props.onClick - Click handler
 * @param {boolean} props.truncate - Truncate long names (default: false)
 * @param {string} props.maxWidth - Max width for truncation (default: 150px)
 * @param {boolean} props.showVerified - Show verified badge for linked accounts (default: false)
 * @param {string} props.fontWeight - Font weight for username (default: 600)
 * @param {string} props.fontSize - Font size for username (default: 1rem)
 * @param {string} props.color - Text color for username (default: #fff)
 * @param {boolean} props.isVip - Whether the user is a VIP (default: false)
 * @returns {JSX.Element} UserDisplay component
 */
const UserDisplay = ({
  userId,
  userData,
  avatarSize = 40,
  rankSize = 18,
  layout = 'horizontal',
  showRank = true,
  showSubtext = false,
  subtext,
  gap = '0.75rem',
  clickable = false,
  onClick,
  truncate = false,
  maxWidth = '150px',
  showVerified = false,
  fontWeight = '600',
  fontSize = '1rem',
  color = '#fff',
  subtextSize = '0.8rem',
  subtextColor = 'rgba(255, 255, 255, 0.7)',
  isVip: propIsVip,
  ...otherProps
}) => {
  // Determine subtext content
  const displaySubtext = subtext || 
    (userData?.email && `Member since ${userData?.createdAt ? 
      new Date(userData.createdAt.toDate ? userData.createdAt.toDate() : userData.createdAt)
        .toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Unknown'}`);
  
  // Check if user has verified accounts
  const isVerified = showVerified && userData && 
    (userData.discordLinked || userData.twitchLinked || userData.epicLinked);
  
  const userDisplayName = userData?.displayName || 'Unknown User';
  
  // VIP logic: check prop, then userData.vipStatus, then userData.userInventory
  let isVip = typeof propIsVip === 'boolean' ? propIsVip : false;
  if (!isVip && userData) {
    // Check userData.vipStatus
    if (userData.vipStatus && userData.vipStatus.isActive && userData.vipStatus.expiresAt) {
      const now = new Date();
      const expiresAt = userData.vipStatus.expiresAt.toDate ? userData.vipStatus.expiresAt.toDate() : new Date(userData.vipStatus.expiresAt);
      if (expiresAt > now) isVip = true;
    }
    // Check userData.userInventory
    if (!isVip && userData.userInventory && Array.isArray(userData.userInventory)) {
      const now = new Date();
      const vip = userData.userInventory.find(i => i.id === 'vip_subscription' && i.isActive && i.expiresAt && (i.expiresAt.toDate ? i.expiresAt.toDate() : new Date(i.expiresAt)) > now);
      if (vip) isVip = true;
    }
  }
  
  if (layout === 'vertical') {
    return (
      <UserDisplayContainer 
        $gap={gap} 
        $clickable={clickable} 
        onClick={onClick}
        {...otherProps}
        style={{ flexDirection: 'column', textAlign: 'center' }}
      >
        <UserAvatar 
          userId={userId}
          userData={userData}
          size={avatarSize}
          initial={userDisplayName.charAt(0)}
        />
        <UserInfo>
          <UserNameContainer>
            <UserName 
              $fontWeight={fontWeight}
              $fontSize={fontSize}
              $color={color}
              $truncate={truncate}
              $maxWidth={maxWidth}
            >
              {userDisplayName}
              {isVip && (
                <VipBadge title="VIP Member">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.09 6.26L20 9.27l-5 3.64L16.18 20 12 16.77 7.82 20 9 12.91l-5-3.64 5.91-.01z"/></svg>
                </VipBadge>
              )}
            </UserName>
            {isVerified && (
              <VerifiedBadge>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </VerifiedBadge>
            )}
            {showRank && (
              <RankBadge 
                userId={userId}
                userData={userData}
                size={rankSize}
                marginLeft="0.25rem"
              />
            )}
          </UserNameContainer>
          {showSubtext && displaySubtext && (
            <UserSubtext 
              $subtextSize={subtextSize}
              $subtextColor={subtextColor}
              $truncate={truncate}
              $maxWidth={maxWidth}
            >
              {displaySubtext}
            </UserSubtext>
          )}
        </UserInfo>
      </UserDisplayContainer>
    );
  }
  
  return (
    <UserDisplayContainer 
      $gap={gap} 
      $clickable={clickable} 
      onClick={onClick}
      {...otherProps}
    >
      <UserAvatar 
        userId={userId}
        userData={userData}
        size={avatarSize}
        initial={userDisplayName.charAt(0)}
      />
      <UserInfo>
        <UserNameContainer>
          <UserName 
            $fontWeight={fontWeight}
            $fontSize={fontSize}
            $color={color}
            $truncate={truncate}
            $maxWidth={maxWidth}
          >
            {userDisplayName}
            {isVip && (
              <VipBadge title="VIP Member">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.09 6.26L20 9.27l-5 3.64L16.18 20 12 16.77 7.82 20 9 12.91l-5-3.64 5.91-.01z"/></svg>
              </VipBadge>
            )}
          </UserName>
          {isVerified && (
            <VerifiedBadge>
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </VerifiedBadge>
          )}
          {showRank && (
            <RankBadge 
              userId={userId}
              userData={userData}
              size={rankSize}
              marginLeft="0.25rem"
            />
          )}
        </UserNameContainer>
        {showSubtext && displaySubtext && (
          <UserSubtext 
            $subtextSize={subtextSize}
            $subtextColor={subtextColor}
            $truncate={truncate}
            $maxWidth={maxWidth}
          >
            {displaySubtext}
          </UserSubtext>
        )}
      </UserInfo>
    </UserDisplayContainer>
  );
};

export default UserDisplay; 