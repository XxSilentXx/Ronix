import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import PlayerStats from '../components/PlayerStats';
import { useAuth } from '../contexts/AuthContext';
import { useTokens } from '../contexts/TokenContext';
import { useXp } from '../contexts/XpContext';
import { useCosmetics } from '../contexts/CosmeticContext';
import UserXpCard from '../components/UserXpCard';
import CosmeticProfile from '../components/CosmeticProfile';
import CosmeticFlair from '../components/CosmeticFlair';

import { findCosmeticById } from '../data/cosmeticData';
import { OAuthProvider, linkWithPopup, getAuth, updateProfile, signOut, TwitterAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, query, collection, where, getDocs, onSnapshot, orderBy, limit, startAfter } from 'firebase/firestore';
import { syncUserDisplayName, isDisplayNameAvailable } from '../firebase/userUtils';
import TwitchStreamStatus from '../components/TwitchStreamStatus';
import TipUserModalRedesigned from '../components/TipUserModalRedesigned';
import UpdateDisplayName from '../components/UpdateDisplayName';
import { useNotification } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import RankBadge from '../components/RankBadge';
import { getCurrentLevel, getCurrentTier, XP_LEVELS, TIERS, awardXp } from '../firebase/xpSystem';
import { FEE_CONFIG } from '../utils/feeUtils';
import { useShop } from '../contexts/ShopContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import CreatorReferralDashboard from '../components/CreatorReferralDashboard';

const ProfileContainer = styled.div`
  min-height: 100vh;
  background: ${props => {
    if (props.$hasProfileCosmetic && props.$cosmeticBackground) {
      return props.$cosmeticBackground;
    }
    return '#131124';
  }};
  color: #fff;
  padding: 2rem 0;
  position: relative;
  overflow: hidden;
  
  /* Apply cosmetic background when available */
  ${props => props.$hasProfileCosmetic && props.$cosmeticBackground && css`
    background: ${props.$cosmeticBackground} !important;
  `}
  
  /* Default background for when no cosmetic is equipped */
  ${props => !props.$hasProfileCosmetic && css`
    &::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: url('https://fortnite-api.com/images/cosmetics/br/character_default.png') no-repeat right bottom/auto 60vh, url('https://fortnite-api.com/images/cosmetics/br/backpack_default.png') no-repeat left 40%/auto 40vh;
      opacity: 0.10;
      z-index: 0;
      pointer-events: none;
    }
  `}
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 2.5rem;
  margin-bottom: 3rem;
  position: relative;
  z-index: 10;
  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    gap: 1.5rem;
  }
`;

const Avatar = styled.div`
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: url('https://placehold.co/160x160') no-repeat center/cover;
  border: 5px solid #4facfe;
  box-shadow: 0 10px 32px #4facfe55, 0 0 32px #ff61e655;
  position: relative;
  z-index: 1;
`;

const ProfileInfo = styled.div`
  h1 {
    font-size: 2.8rem;
    margin-bottom: 0.5rem;
    background: linear-gradient(90deg, #4facfe 0%, #ff61e6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-family: 'Luckiest Guy', 'Barlow', sans-serif;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-shadow: 0 4px 24px #4facfe88;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  p {
    color: #b8c1ec;
    margin-bottom: 1rem;
    font-weight: 600;
    text-shadow: 0 2px 8px #2b105555;
  }
`;

const TokenBalance = styled.div`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  background: rgba(255, 255, 255, 0.12);
  padding: 0.7rem 1.5rem;
  border-radius: 50px;
  width: fit-content;
  font-size: 1.1rem;
  font-weight: 800;
  color: #FFD700;
  box-shadow: 0 0 12px #4facfe88;
  @media (max-width: 768px) {
    margin: 0 auto;
  }
`;

const XpSectionTitle = styled.h2`
  font-size: 2rem;
  margin-bottom: 1.5rem;
  margin-top: 2.5rem;
  color: #fff;
  font-family: 'Luckiest Guy', 'Barlow', sans-serif;
  letter-spacing: 0.04em;
  text-shadow: 0 2px 8px #4facfe55;
  position: relative;
  z-index: 10;
  
  &::before {
    content: 'XP';
    position: absolute;
    font-size: 6rem;
    opacity: 0.1;
    top: -2.5rem;
    left: -1rem;
    z-index: -1;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
  position: relative;
  z-index: 10;
`;

const StatCard = styled.div`
  background: rgba(24, 28, 40, 0.45);
  backdrop-filter: blur(14px);
  border-radius: 18px;
  padding: 2.2rem 1.5rem;
  text-align: center;
  border: 1.5px solid rgba(255,255,255,0.13);
  box-shadow: 0 8px 32px 0 rgba(31,38,135,0.18);
  font-family: 'Barlow', sans-serif;
  font-weight: 900;
  font-size: 1.5rem;
  color: #fff;
  transition: all 0.3s cubic-bezier(.25,1.7,.45,.87);
  position: relative;
  overflow: hidden;
  &:hover {
    transform: translateY(-12px) scale(1.04) rotate(-1deg);
    box-shadow: 0 16px 40px 0 #ff61e6aa;
    border-color: #ff61e6;
    background: rgba(44, 62, 80, 0.98);
  }
  h3 {
    font-size: 2.2rem;
    margin-bottom: 0.5rem;
    background: linear-gradient(90deg, #4facfe 0%, #ff61e6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-family: 'Luckiest Guy', 'Barlow', sans-serif;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-shadow: 0 2px 8px #4facfe55;
  }
  p {
    color: #b8c1ec;
    font-size: 1.1rem;
    font-weight: 700;
  }
`;

const SectionTitle = styled.h2`
  font-size: 2rem;
  margin-bottom: 1.5rem;
  color: #fff;
  font-family: 'Luckiest Guy', 'Barlow', sans-serif;
  letter-spacing: 0.04em;
  text-shadow: 0 2px 8px #4facfe55;
`;

const FortniteSection = styled.div`
  margin-bottom: 3rem;
  position: relative;
  z-index: 10;
`;

const FortniteUsernameForm = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  
  label {
    color: #b8c1ec;
    font-weight: 500;
  }
  
  input {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    padding: 0.8rem 1rem;
    color: #fff;
    font-size: 1rem;
    flex: 1;
    max-width: 300px;
    
    &:focus {
      outline: none;
      border-color: #4facfe;
    }
  }
  
  button {
    background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
    color: #fff;
    border: none;
    padding: 0.8rem 1.5rem;
    border-radius: 10px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 20px rgba(0, 242, 254, 0.3);
    }
  }
`;

const MatchHistory = styled.div`
  background: rgba(44, 62, 80, 0.92);
  border-radius: 18px;
  overflow: hidden;
  border: 2px solid #4facfe;
  box-shadow: 0 8px 32px 0 #4facfe33;
  margin-bottom: 2rem;
  position: relative;
  z-index: 10;
`;

const MatchHistoryHeader = styled.div`
  display: grid;
  grid-template-columns: 0.5fr 1fr 1fr 1fr 1fr;
  padding: 1.2rem;
  background: linear-gradient(90deg, #4facfe 0%, #ff61e6 100%);
  font-weight: 800;
  color: #fff;
  font-size: 1.1rem;
  letter-spacing: 0.03em;
  box-shadow: 0 2px 8px #4facfe55;
  @media (max-width: 768px) {
    display: none;
  }
`;

const MatchRow = styled.div`
  display: grid;
  grid-template-columns: 0.5fr 1fr 1fr 1fr 1fr;
  padding: 1.2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  align-items: center;
  transition: all 0.3s cubic-bezier(.25,1.7,.45,.87);
  &:last-child { border-bottom: none; }
  &:hover {
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 4px 16px #ff61e655;
    transform: scale(1.01) rotate(-1deg);
  }
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 0.5rem;
    padding: 1.5rem 1rem;
    &::before {
      content: attr(data-label);
      font-weight: 600;
      color: #4facfe;
    }
  }
`;

const MatchResult = styled.span`
  padding: 0.3rem 0.8rem;
  border-radius: 50px;
  font-weight: 800;
  font-size: 1.1rem;
  background: ${props => props.win ? 'rgba(46, 213, 115, 0.2)' : 'rgba(255, 71, 87, 0.2)'};
  color: ${props => props.win ? '#2ed573' : '#ff4757'};
  width: fit-content;
  letter-spacing: 0.03em;
`;

const LinkEpicButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 20px rgba(0, 242, 254, 0.3);
  }
`;

const LinkTwitchButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #9146FF;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  opacity: ${props => props.disabled ? 0.7 : 1};
  
  &:hover {
    transform: ${props => props.disabled ? 'none' : 'translateY(-3px)'};
    box-shadow: ${props => props.disabled ? 'none' : '0 10px 20px rgba(145, 70, 255, 0.3)'};
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const TwitchAccountDisplay = styled.div`
  display: flex;
  align-items: center;
  background: rgba(145, 70, 255, 0.2);
  padding: 0.8rem 1.5rem;
  border-radius: 10px;
  
  svg {
    width: 20px;
    height: 20px;
    margin-right: 10px;
    fill: #9146FF;
  }
  
  div {
    flex: 1;
  }
`;

const GameLinkButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(90deg, #0095ff 0%, #00BFFF 100%);
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  opacity: ${props => props.disabled ? 0.7 : 1};
  
  img {
    width: 20px;
    height: 20px;
  }
  
  &:hover {
    transform: ${props => props.disabled ? 'none' : 'translateY(-3px)'};
    box-shadow: ${props => props.disabled ? 'none' : '0 10px 20px rgba(0, 191, 255, 0.3)'};
  }
`;

const EpicAccountDisplay = styled.div`
  display: flex;
  align-items: center;
  background: rgba(0, 191, 255, 0.2);
  padding: 0.8rem 1.5rem;
  border-radius: 10px;
  margin-bottom: 1rem;
  
  img {
    width: 20px;
    height: 20px;
    margin-right: 10px;
  }
  
  div {
    flex: 1;
  }
`;

const NameChangeForm = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  
  label {
    color: #b8c1ec;
    font-weight: 500;
  }
  
  input {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    padding: 0.8rem 1rem;
    color: #fff;
    font-size: 1rem;
    flex: 1;
    max-width: 300px;
    
    &:focus {
      outline: none;
      border-color: #4facfe;
    }
  }
  
  button {
    background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
    color: #fff;
    border: none;
    padding: 0.8rem 1.5rem;
    border-radius: 10px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 20px rgba(0, 242, 254, 0.3);
    }
  }
`;

const SuccessMessage = styled.div`
  background: rgba(46, 213, 115, 0.2);
  color: #2ed573;
  padding: 0.8rem;
  border-radius: 10px;
  text-align: center;
  margin-bottom: 1rem;
  font-size: 0.9rem;
`;

const ErrorMessage = styled.div`
  background: rgba(255, 71, 87, 0.2);
  color: #ff4757;
  padding: 0.8rem;
  border-radius: 10px;
  text-align: center;
  margin-bottom: 1rem;
  font-size: 0.9rem;
`;

const EditIcon = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  margin-left: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
  }
  
  svg {
    width: 14px;
    height: 14px;
    fill: #4facfe;
  }
`;

const NameEditContainer = styled.div`
  margin-top: 1rem;
  margin-bottom: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const DISCORD_INVITE_LINK = 'https://discord.gg/JqXwnb6rSq';

const LinkDiscordButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #5865F2;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  opacity: ${props => props.disabled ? 0.7 : 1};
  
  svg {
    width: 20px;
    height: 15px;
  }
  
  &:hover {
    transform: ${props => props.disabled ? 'none' : 'translateY(-3px)'};
    background: ${props => props.disabled ? '#5865F2' : '#4752C4'};
    box-shadow: ${props => props.disabled ? 'none' : '0 10px 20px rgba(88, 101, 242, 0.3)'};
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const OrDivider = styled.div`
  display: flex;
  align-items: center;
  margin: 1rem 0;
  color: #b8c1ec;
  
  &::before, &::after {
    content: "";
    flex: 1;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  &::before {
    margin-right: 0.5rem;
  }
  
  &::after {
    margin-left: 0.5rem;
  }
`;

const DiscordInviteButton = styled.a`
  display: inline-block;
  background: #5865F2;
  color: white;
  text-decoration: none;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 20px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 20px rgba(88, 101, 242, 0.3);
    background: #4752C4;
  }
`;

const UnlinkButton = styled.button`
  background: none;
  color: #ff4757;
  border: 1px solid #ff4757;
  border-radius: 5px;
  padding: 3px 8px;
  font-size: 0.7rem;
  cursor: pointer;
  margin-left: 10px;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 71, 87, 0.1);
  }
`;

const TipButton = styled.button`
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(79, 172, 254, 0.4);
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

// Add debug styles
const DebugSection = styled.div`
  margin-top: 2rem;
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  border: 1px solid rgba(79, 172, 254, 0.3);
  max-width: 1000px;
  margin-left: auto;
  margin-right: auto;
`;

const DebugTitle = styled.h3`
  font-size: 1.2rem;
  color: #4facfe;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const DebugContent = styled.div`
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  font-family: monospace;
  white-space: pre-wrap;
  max-height: 300px;
  overflow-y: auto;
  color: #b8c1ec;
  font-size: 0.85rem;
`;

const DebugButton = styled.button`
  background: rgba(79, 172, 254, 0.2);
  color: #4facfe;
  border: 1px solid rgba(79, 172, 254, 0.5);
  border-radius: 4px;
  padding: 0.3rem 0.8rem;
  cursor: pointer;
  font-size: 0.8rem;
  margin-left: 0.5rem;
  
  &:hover {
    background: rgba(79, 172, 254, 0.3);
  }
`;

// Add shimmer keyframes and tooltip styles
const shimmer = keyframes`
  0% { filter: brightness(1) drop-shadow(0 0 8px #4facfe88); }
  50% { filter: brightness(1.3) drop-shadow(0 0 16px #ff61e6cc); }
  100% { filter: brightness(1) drop-shadow(0 0 8px #4facfe88); }
`;

const Tooltip = styled.div`
  position: absolute;
  left: 50%;
  bottom: 110%;
  transform: translateX(-50%);
  background: rgba(44,62,80,0.95);
  color: #fff;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 1rem;
  font-family: 'Barlow', sans-serif;
  white-space: nowrap;
  box-shadow: 0 2px 8px #4facfe55;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.18s;
  z-index: 10;
`;

// Enhance StatIcon with shimmer and tooltip
const StatIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.5rem;
  font-size: 1.7rem;
  transition: transform 0.18s cubic-bezier(.25,1.7,.45,.87), filter 0.18s cubic-bezier(.25,1.7,.45,.87);
  filter: drop-shadow(0 0 8px #4facfe88);
  animation: ${shimmer} 2.2s infinite;
  position: relative;
  &:hover {
    filter: drop-shadow(0 0 24px #ff61e6cc) brightness(1.2);
    transform: scale(1.15) rotate(-3deg);
  }
  &.pop {
    animation: iconPop 0.4s cubic-bezier(.25,1.7,.45,.87), ${shimmer} 2.2s infinite;
  }
  &.bounce {
    animation: iconBounce 1.2s infinite alternate cubic-bezier(.25,1.7,.45,.87), ${shimmer} 2.2s infinite;
    filter: drop-shadow(0 0 12px #FFD70088);
  }
  @keyframes iconPop {
    0% { transform: scale(1); }
    50% { transform: scale(1.25); }
    100% { transform: scale(1); }
  }
  @keyframes iconBounce {
    from { transform: translateY(0) scale(1); }
    to { transform: translateY(-8px) scale(1.12); }
  }
`;

// Add this styled component with the others
const RankTestingPanel = styled.div`
  background: rgba(255, 215, 0, 0.1);
  border: 2px solid #ffd700;
  border-radius: 15px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  position: relative;
  z-index: 10;
  
  h3 {
    color: #ffd700;
    margin-bottom: 1rem;
    font-size: 1.2rem;
  }
  
  .warning {
    color: #ff6b6b;
    font-size: 0.9rem;
    margin-bottom: 1rem;
    font-style: italic;
  }
  
  .tier-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .quick-xp {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .current-stats {
    background: rgba(0, 0, 0, 0.2);
    padding: 1rem;
    border-radius: 10px;
    margin-bottom: 1rem;
    
    .stat-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
  }
`;

const TierButton = styled.button`
  background: ${props => props.$active ? `linear-gradient(90deg, ${props.$color}, ${props.$color}aa)` : 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.$active ? '#000' : '#fff'};
  border: 2px solid ${props => props.$color};
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => `linear-gradient(90deg, ${props.$color}, ${props.$color}aa)`};
    color: #000;
    transform: translateY(-2px);
  }
`;

const QuickXpButton = styled.button`
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 242, 254, 0.3);
  }
`;

const MainContentWrapper = styled.div`
  position: relative;
  z-index: 5;
  
  /* Ensure all child elements maintain proper layering */
  & > * {
    position: relative;
    z-index: inherit;
  }
`;

// Add/replace styled-components for new visual hierarchy and effects
const StatsCardModule = styled.div`
  background: rgba(36, 38, 58, 0.92);
  border-radius: 22px;
  box-shadow: 0 8px 32px #4facfe33, 0 0 0 3px #23234a;
  border: 2.5px solid #23234a;
  padding: 2.5rem 2rem 2rem 2rem;
  margin-bottom: 2.5rem;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  @media (max-width: 900px) {
    padding: 1.5rem 0.5rem;
  }
`;

const StatsGridRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 2rem;
  width: 100%;
`;

const AvatarGlow = styled(Avatar)`
  border: 5px solid #A259F7;
  box-shadow: 0 0 0 6px #23234a, 0 0 32px 8px #A259F7cc, 0 0 64px 0 #00FFD0aa;
  animation: avatarGlowPulse 2.2s infinite alternate;
  @keyframes avatarGlowPulse {
    0% { box-shadow: 0 0 0 6px #23234a, 0 0 32px 8px #A259F7cc, 0 0 64px 0 #00FFD0aa; }
    100% { box-shadow: 0 0 0 6px #23234a, 0 0 48px 16px #FF61E6cc, 0 0 96px 0 #00FFD0; }
  }
`;

const NameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const NeonTipButton = styled.button`
  background: linear-gradient(90deg, #A259F7 0%, #00FFD0 100%);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  padding: 0.45rem 1.2rem;
  margin-top: 0.7rem;
  margin-bottom: 0.2rem;
  box-shadow: 0 0 16px #A259F7, 0 0 32px #00FFD0;
  cursor: pointer;
  letter-spacing: 0.04em;
  transition: box-shadow 0.18s, transform 0.18s, background 0.18s;
  position: relative;
  z-index: 2;
  &:hover, &:focus {
    background: linear-gradient(90deg, #FF61E6 0%, #00FFD0 100%);
    box-shadow: 0 0 32px #FF61E6, 0 0 64px #00FFD0;
    transform: scale(1.04) translateY(-2px);
  }
`;

const SectionDivider = styled.div`
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, #23234a 0%, #A259F7 100%);
  border-radius: 2px;
  margin: 2.5rem 0 2.5rem 0;
`;

const Profile = () => {
  const { currentUser, signInWithDiscord, signInWithTwitch, setCurrentUser, logout, updateUserAvatar } = useAuth();
  const { xpTotal, currentLevel, currentTier, tierColor } = useXp();
  const { balance, transactions } = useTokens();
  const { userCosmetics } = useCosmetics();
  const [epicUsername, setEpicUsername] = useState('');
  const [savedUsername, setSavedUsername] = useState('');
  const [linkingError, setLinkingError] = useState('');
  const [linkingSuccess, setLinkingSuccess] = useState('');
  const [isDiscordLinked, setIsDiscordLinked] = useState(false);
  const [discordUsername, setDiscordUsername] = useState('');
  const [isLinkingDiscord, setIsLinkingDiscord] = useState(false);
  const [unlinkingDiscord, setUnlinkingDiscord] = useState(false);
  const [discordLinkInProgress, setDiscordLinkInProgress] = useState(false);
  const [isGameLinked, setIsGameLinked] = useState(false);
  const [gameLinkInProgress, setGameLinkInProgress] = useState(false);
  const [verifiedEpicUsername, setVerifiedEpicUsername] = useState('');
  const [unlinkingEpic, setUnlinkingEpic] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [nameChangeSuccess, setNameChangeSuccess] = useState('');
  const [nameChangeError, setNameChangeError] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  
  // Twitch linking state
  const [isTwitchLinked, setIsTwitchLinked] = useState(false);
  const [twitchUsername, setTwitchUsername] = useState('');
  const [isLinkingTwitch, setIsLinkingTwitch] = useState(false);
  const [unlinkingTwitch, setUnlinkingTwitch] = useState(false);
  const [twitchLinkInProgress, setTwitchLinkInProgress] = useState(false);
  
  // Discord application credentials
  // const clientId = '1371296059518615593'; // Your Discord client ID
  const clientId = process.env.REACT_APP_DISCORD_CLIENT_ID;
  const redirectUri = encodeURIComponent(window.location.origin + '/auth-callback');
  
  // Yunite API credentials (DO NOT EXPOSE SECRETS IN FRONTEND)
  // const YUNITE_API_URL = 'https://api.yunite.xyz';
  // const YUNITE_API_KEY = '21713048-f175-4115-ad6f-9115aeef35cd';
  const YUNITE_API_URL = process.env.REACT_APP_YUNITE_API_URL;
  // Never expose YUNITE_API_KEY in frontend
  
  // Discord guild ID for Yunite integration
  // const DISCORD_GUILD_ID = '1371309711982596118'; // Replace with your actual Discord guild ID
  const DISCORD_GUILD_ID = process.env.REACT_APP_DISCORD_GUILD_ID;
  
  // Fetch user stats
  const [userStats, setUserStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  
  // Calculate stats from transactions as a fallback
  const matchesPlayed = userStats ? userStats.matchesPlayed : (transactions ? transactions.filter(t => t.reason && t.reason.includes('wager')).length : 0);
  const wagersWon = userStats ? userStats.matchesWon : (transactions ? transactions.filter(t => t.type === 'reward' && t.reason && t.reason.includes('won')).length : 0);
  const winRate = userStats ? userStats.winRate * 100 : (matchesPlayed > 0 ? ((wagersWon / matchesPlayed) * 100).toFixed(1) : '0.0');
  const totalEarnings = userStats ? userStats.totalEarnings : (transactions ? transactions.filter(t => t.type === 'reward').reduce((sum, t) => sum + t.amount, 0) : 0);
  
  // Inside the Profile component, add notification context
  const notification = useNotification();
  const navigate = useNavigate();
  
  // Check for return from Discord OAuth
  useEffect(() => {
    const discordAuthStarted = localStorage.getItem('discord_link_started');
    const needsRefresh = localStorage.getItem('discord_needs_refresh');
    const twitchNeedsRefresh = localStorage.getItem('twitch_needs_refresh');
    
    if (needsRefresh) {
      // Clear the refresh flag
      localStorage.removeItem('discord_needs_refresh');
      
      // Instead of refreshing, poll for Discord status changes
      setDiscordLinkInProgress(true);
      
      // Set up polling to check status every second for up to 10 seconds
      let attempts = 0;
      const maxAttempts = 10;
      
      const pollForDiscordLink = async () => {
        if (attempts >= maxAttempts) {
          setDiscordLinkInProgress(false);
          return;
        }
        
        attempts++;
        
        try {
          const db = getFirestore();
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          
          if (userDoc.exists() && userDoc.data().discordLinked) {
            setIsDiscordLinked(true);
            setDiscordUsername(
              `${userDoc.data().discordUsername}#${userDoc.data().discordDiscriminator || '0000'}`
            );
            setLinkingSuccess(`Discord account linked successfully! Connected as ${userDoc.data().discordUsername}`);
            
            // Refresh the user avatar in AuthContext so the navbar updates
            if (typeof updateUserAvatar === 'function' && currentUser) {
              updateUserAvatar(currentUser);
            }
            // Clear success message after 5 seconds
            setTimeout(() => {
              setLinkingSuccess("");
            }, 5000);
            
            // Stop polling as we found the link
            setDiscordLinkInProgress(false);
            return;
          }
          
          // If not found yet and we have more attempts, try again
          if (attempts < maxAttempts) {
            setTimeout(pollForDiscordLink, 1000);
          } else {
            setDiscordLinkInProgress(false);
          }
        } catch (error) {
          console.error('Error polling for Discord link:', error);
          setDiscordLinkInProgress(false);
        }
      };
      
      // Start polling
      pollForDiscordLink();
    }
    
    if (twitchNeedsRefresh) {
      // Clear the refresh flag
      localStorage.removeItem('twitch_needs_refresh');
      
      // Poll for Twitch status changes
      setTwitchLinkInProgress(true);
      
      // Set up polling to check status every second for up to 10 seconds
      let attempts = 0;
      const maxAttempts = 10;
      
      const pollForTwitchLink = async () => {
        if (attempts >= maxAttempts) {
          setTwitchLinkInProgress(false);
          return;
        }
        
        attempts++;
        
        try {
          const db = getFirestore();
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          
          if (userDoc.exists() && userDoc.data().twitchLinked) {
            setIsTwitchLinked(true);
            setTwitchUsername(userDoc.data().twitchUsername || 'Twitch User');
            setLinkingSuccess('Twitch account linked successfully!');
            
            // Clear success message after 5 seconds
            setTimeout(() => {
              setLinkingSuccess("");
            }, 5000);
            
            // Stop polling as we found the link
            setTwitchLinkInProgress(false);
            return;
          }
          
          // If not found yet and we have more attempts, try again
          if (attempts < maxAttempts) {
            setTimeout(pollForTwitchLink, 1000);
          } else {
            setTwitchLinkInProgress(false);
          }
        } catch (error) {
          console.error('Error polling for Twitch link:', error);
          setTwitchLinkInProgress(false);
        }
      };
      
      // Start polling
      pollForTwitchLink();
    }
    
    // Check for Discord link status
    const checkFirestoreDiscordLink = async () => {
      if (currentUser) {
        try {
          const db = getFirestore();
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          
          if (userDoc.exists() && userDoc.data().discordLinked) {
            setIsDiscordLinked(true);
            setDiscordUsername(
              `${userDoc.data().discordUsername}#${userDoc.data().discordDiscriminator || '0000'}`
            );
            return true;
          }
        } catch (error) {
          console.error('Error checking Discord link in Firestore:', error);
        }
        return false;
      }
      return false;
    };
    
    // Only check if we're not already polling for a link
    if (!discordLinkInProgress && !discordAuthStarted && !needsRefresh) {
      checkFirestoreDiscordLink();
    }
  }, [currentUser, discordLinkInProgress]);
  
  // Check if user has Epic Games account linked
  useEffect(() => {
    const checkEpicLink = async () => {
      if (currentUser) {
        try {
          // Check Firestore for Epic account link
          const db = getFirestore();
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          
          if (userDoc.exists() && userDoc.data().epicLinked) {
            setIsGameLinked(true);
            setVerifiedEpicUsername(userDoc.data().epicUsername || 'Epic User');
            
            // Also set the Epic username in the input field
            if (userDoc.data().epicUsername) {
              setEpicUsername(userDoc.data().epicUsername);
              setSavedUsername(userDoc.data().epicUsername);
            }
            
            return;
          }
          
          // No Epic link found
          setIsGameLinked(false);
          setVerifiedEpicUsername('');
        } catch (error) {
          console.error('Error checking Epic Games link:', error);
          setIsGameLinked(false);
          setVerifiedEpicUsername('');
        }
      }
    };
    
    checkEpicLink();
  }, [currentUser]);
  
  // Check if user has Twitch linked
  useEffect(() => {
    const checkTwitchLink = async () => {
      if (currentUser) {
        try {
          // Check Firestore first
          const db = getFirestore();
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          
          if (userDoc.exists() && userDoc.data().twitchLinked) {
            setIsTwitchLinked(true);
            setTwitchUsername(userDoc.data().twitchUsername || 'Twitch User');
            return;
          }
          
          // Fallback to checking Firebase Auth providers
          const twitchProvider = currentUser.providerData.find(
            provider => provider.providerId === 'oidc.twitch'
          );
          
          if (twitchProvider) {
            setIsTwitchLinked(true);
            setTwitchUsername(twitchProvider.displayName || 'Twitch User');
            return;
          }
          
          // No Twitch link found
          setIsTwitchLinked(false);
          setTwitchUsername('');
        } catch (error) {
          console.error('Error checking Twitch link:', error);
          setIsTwitchLinked(false);
          setTwitchUsername('');
        }
      }
    };
    
    checkTwitchLink();
  }, [currentUser]);
  
  // Add a useEffect to update the display name when the currentUser changes
  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || currentUser.email || 'User');
    }
  }, [currentUser]);
  
  // Add isSaving state
  const [isSaving, setIsSaving] = useState(false);
  
  const auth = getAuth(); // Initialize auth variable
  
  const handleSaveUsername = async () => {
    if (!displayName.trim()) {
      setNameChangeError("Please enter a display name");
      return;
    }
    
    setIsSaving(true);
    
    try {
      await updateProfile(currentUser, {
        displayName: displayName
      });
      
      // Update user document in Firestore
      const db = getFirestore();
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        displayName: displayName
      });
      
      notification.addNotification('Username updated successfully!', 'success');
      setIsEditingName(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setNameChangeError(error.message);
      notification.addNotification(`Failed to update username: ${error.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleLinkEpicAccount = async () => {
    notification.addNotification('Redirecting to Epic Games for account linking...', 'info');
    try {
      setLinkingError('');
      setLinkingSuccess('');
      
      if (!currentUser) {
        setLinkingError('You must be logged in to link your Epic Games account');
        return;
      }
      
      // Create the Epic Games provider
      const epicProvider = new OAuthProvider('oidc.epicgames');
      
      // Set essential custom parameters for Epic Games
      epicProvider.setCustomParameters({
        provider_id: 'epicgames.com',
        scope: 'basic_profile', // Make sure this scope matches what's configured in Epic Games Developer Portal
        response_type: 'code', // Explicitly set response type
        client_id: 'YOUR_EPIC_CLIENT_ID' // This should be configured in Firebase console, this is just for debugging
      });
      
      // Try to link the Epic Games account with more detailed error handling
      const result = await linkWithPopup(currentUser, epicProvider);
      
      // Extract Epic username if available
      const epicProviderData = result.user.providerData.find(
        provider => provider.providerId === 'oidc.epicgames'
      );
      const epicDisplayName = epicProviderData?.displayName;
      const epicUid = epicProviderData?.uid;
      
      if (!epicUid) {
        throw new Error('Could not find Epic Games ID from authentication result');
      }
      
      // Check if this Epic account is already linked to another user
      const db = getFirestore();
      
      // Get Epic account details
      const epicData = {
        epicId: epicUid,
        epicUsername: epicDisplayName || 'Epic User',
        epicLinked: true,
        epicVerifiedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Update Firestore with Epic account details
      await setDoc(doc(db, 'users', currentUser.uid), epicData, { merge: true });
      
      // Update the epicAccountLinks collection using our helper function
      try {
        // Import the helper function from firebase/config
        const { createEpicAccountLink } = await import('../firebase/config');
        await createEpicAccountLink(currentUser.uid, epicUid, epicDisplayName);
      } catch (linkError) {
        // If it's already linked to another account, undo our changes
        if (linkError.message.includes('already linked to another user')) {
          // Remove the link from the user's document
          await setDoc(doc(db, 'users', currentUser.uid), {
            epicLinked: false,
            epicId: null,
            epicUsername: null,
            updatedAt: new Date().toISOString()
          }, { merge: true });
          
          throw linkError; // Re-throw to be caught by outer catch block
        }
        
        console.error('Error creating Epic account link record:', linkError);
        // Continue without failing since the user document was already updated
      }
      
      if (epicDisplayName) {
        setEpicUsername(epicDisplayName);
        setSavedUsername(epicDisplayName);
      }
      
      setLinkingSuccess('Epic Games account linked successfully!');
      
      // Update UI state
      setIsGameLinked(true);
      setVerifiedEpicUsername(epicDisplayName || 'Epic User');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setLinkingSuccess("");
      }, 3000);
    } catch (error) {
      console.error('Error linking Epic Games account:', error);
      
      let errorMessage = 'Failed to link Epic Games account. Please try again.';
      
      // More comprehensive error handling
      if (error.code === 'auth/credential-already-in-use') {
        errorMessage = 'This Epic Games account is already linked to another user.';
      } else if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in popup was blocked or closed. Please try again and allow popups.';
      } else if (error.code === 'auth/internal-error') {
        errorMessage = 'Authentication error. Please ensure Epic Games provider is correctly configured in Firebase and your OIDC settings in Epic Developer Portal are valid.';
      } else if (error.code === 'auth/invalid-oauth-provider') {
        errorMessage = 'Invalid OAuth provider. Make sure Epic Games provider is enabled in Firebase Authentication.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Epic Games sign-in is not enabled. Please enable it in the Firebase Console.';
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = 'This domain is not authorized for OAuth operations. Add it to your Firebase Authentication settings.';
      } else if (error.message && error.message.includes('already linked to another user')) {
        errorMessage = 'This Epic Games account is already linked to another user. Please use a different Epic account.';
      }
      
      setLinkingError(errorMessage);
    }
  };
  
  const handleLinkDiscord = () => {
    notification.addNotification('Redirecting to Discord for account linking...', 'info');
    try {
      setLinkingError('');
      setLinkingSuccess('');
      setIsLinkingDiscord(true);
      setDiscordLinkInProgress(true);
      
      if (!currentUser) {
        setLinkingError('You must be logged in to link your Discord account');
        setIsLinkingDiscord(false);
        setDiscordLinkInProgress(false);
        return;
      }
      
      // Ensure we have a valid UID
      if (!currentUser.uid) {
        setLinkingError('Your user account is not properly initialized. Please log out and log in again.');
        setIsLinkingDiscord(false);
        setDiscordLinkInProgress(false);
        return;
      }
      
      // Generate Discord OAuth URL with necessary scopes - simplified to only what's required
      const discordUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify%20email`;
      
      // Store a flag to detect when we return
      localStorage.setItem('discord_link_started', Date.now().toString());
      
      // Also store the user's UID to verify on return
      localStorage.setItem('discord_link_user', currentUser.uid);
      
      // Redirect to Discord
      window.location.href = discordUrl;
    } catch (error) {
      console.error('Error initiating Discord link:', error);
      setLinkingError('Failed to start Discord authentication. Please try again.');
      setIsLinkingDiscord(false);
      setDiscordLinkInProgress(false);
    }
  };
  
  const handleUnlinkDiscord = async () => {
    if (!currentUser) {
      setLinkingError('You must be logged in to unlink your Discord account');
      return;
    }
    
    try {
      setUnlinkingDiscord(true);
      
      // Update Firestore to remove Discord connection
      const db = getFirestore();
      const userRef = doc(db, 'users', currentUser.uid);
      
      await setDoc(userRef, {
        discordLinked: false,
        discordUnlinkedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      // Update UI state
      setIsDiscordLinked(false);
      setDiscordUsername('');
      setLinkingSuccess('Discord account unlinked successfully!');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setLinkingSuccess("");
      }, 5000);
      
      notification.addNotification('Discord account unlinked successfully', 'success');
    } catch (error) {
      console.error('Error unlinking Discord account:', error);
      setLinkingError(`Failed to unlink Discord account: ${error.message}`);
      notification.addNotification(`Failed to unlink Discord: ${error.message}`, 'error');
    } finally {
      setUnlinkingDiscord(false);
    }
  };
  
  // Handle Game Link through Yunite
  const handleGameLink = async () => {
    try {
      setLinkingError('');
      setLinkingSuccess('');
      setGameLinkInProgress(true);
      
      if (!currentUser) {
        setLinkingError('You must be logged in to verify your Epic Games account');
        setGameLinkInProgress(false);
        return;
      }
      
      if (!isDiscordLinked) {
        setLinkingError('You must link your Discord account first');
        setGameLinkInProgress(false);
        return;
      }
      
      // Get the user's Discord ID from Firestore
      const db = getFirestore();
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      
      if (!userDoc.exists() || !userDoc.data().discordId) {
        setLinkingError('Could not find your Discord ID. Please try relinking your Discord account.');
        setGameLinkInProgress(false);
        return;
      }
      
      const discordId = userDoc.data().discordId || userDoc.data().discordUserId;
      
      if (!discordId) {
        setLinkingError('Discord ID not found. Please try relinking your Discord account.');
        setGameLinkInProgress(false);
        return;
      }
      
      try {
        // Call our server-side proxy function

        // The URL for Firebase Cloud Functions
        const functionUrl = 'https://us-central1-tokensite-6eef3.cloudfunctions.net/yuniteApiProxy';
        
        // For local development, you might need to use a different URL
        // const functionUrl = 'http://localhost:3000/tokensite-6eef3/us-central1/yuniteApiProxy';
        
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'DISCORD',
            userIds: [discordId]
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API error: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        
        // Process the API response
        if (data.users && data.users.length > 0) {
          // User is linked to an Epic account
          const epicUser = data.users[0];
          
          // Update state to reflect the linked account
          setIsGameLinked(true);
          setVerifiedEpicUsername(epicUser.epic.epicName);
          
          // Set Epic username in the input field as well
          setEpicUsername(epicUser.epic.epicName);
          setSavedUsername(epicUser.epic.epicName);
          
          // Show success message with Epic username
          setLinkingSuccess(`Epic Games account verified! Linked to ${epicUser.epic.epicName}`);
          
          // Prepare Epic account details
          const epicData = {
            epicLinked: true,
            epicId: epicUser.epic.epicID,
            epicUsername: epicUser.epic.epicName,
            epicVerifiedAt: new Date().toISOString(),
            epicPlatform: epicUser.chosenPlatform || 'Unknown',
            epicPeripheral: epicUser.chosenPeripheral || 'Unknown',
            updatedAt: new Date().toISOString()
          };
          
          // Store the verification info in Firestore with additional Epic account details
          await setDoc(doc(db, 'users', currentUser.uid), epicData, { merge: true });
          
          // Also create entry in epicAccountLinks collection
          try {
            // Import the helper function from firebase/config
            const { createEpicAccountLink } = await import('../firebase/config');
            await createEpicAccountLink(
              currentUser.uid, 
              epicUser.epic.epicID, 
              epicUser.epic.epicName
            );
          } catch (linkError) {
            // If already linked to another user
            if (linkError.message.includes('already linked to another user')) {
              // Undo our changes to user document
              await setDoc(doc(db, 'users', currentUser.uid), {
                epicLinked: false,
                epicId: null,
                epicUsername: null,
                updatedAt: new Date().toISOString()
              }, { merge: true });
              
              // Update UI state
              setIsGameLinked(false);
              setVerifiedEpicUsername('');
              
              // Show error
              setLinkingError('This Epic Games account is already linked to another user. Please use a different Epic account.');
              setLinkingSuccess('');
              return;
            }
            
            console.error('Error creating Epic account link record:', linkError);
            // Continue without failing since the user document was already updated
          }
          
          // Refresh user stats if we have a PlayerStats component
          // This will trigger the PlayerStats component to load data for the verified username
          if (typeof window !== 'undefined' && window.refreshPlayerStats) {
            window.refreshPlayerStats(epicUser.epic.epicName);
          }
        } else if (data.notLinked && data.notLinked.includes(discordId)) {
          // User is in the guild but not linked
          setLinkingError('Your Discord account is not linked to an Epic Games account in our system. Please join our Discord server and follow the verification process.');
        } else if (data.notFound && data.notFound.includes(discordId)) {
          // User is not in the guild
          setLinkingError('You are not a member of our Discord server. Please join our server first.');
        } else {
          // Unexpected response
          setLinkingError('Could not verify your Epic Games account. Please try again later.');
        }
      } catch (apiError) {
        console.error('Error with Yunite verification:', apiError);
        setLinkingError('Failed to verify Epic Games account. Please try again later.');
      }
      
      setGameLinkInProgress(false);
    } catch (error) {
      console.error('Error initiating Yunite verification:', error);
      setLinkingError('Failed to start Epic Games verification. Please try again.');
      setGameLinkInProgress(false);
    }
  };
  
  const handleUnlinkEpic = async () => {
    if (!currentUser) {
      setLinkingError('You must be logged in to unlink your Epic Games account');
      return;
    }
    
    try {
      setUnlinkingEpic(true);
      
      // Get the user's Epic ID before unlinking
      const db = getFirestore();
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      // Store Epic ID for removing from epicAccountLinks collection
      let epicId = null;
      if (userDoc.exists() && userDoc.data().epicId) {
        epicId = userDoc.data().epicId;
      }
      
      // Update Firestore to remove Epic connection from user document
      await setDoc(userRef, {
        epicLinked: false,
        epicId: null, // Set to null instead of just removing
        epicUsername: null, // Set to null instead of just removing
        epicUnlinkedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      // Also remove from epicAccountLinks collection if we have an Epic ID
      if (epicId) {
        try {
          // Import the helper function from firebase/config
          const { removeEpicAccountLink } = await import('../firebase/config');
          await removeEpicAccountLink(epicId);
        } catch (unlinkError) {
          console.error('Error removing Epic account link record:', unlinkError);
          // Continue without failing since we've already updated the user document
        }
      }
      
      // Update UI state
      setIsGameLinked(false);
      setVerifiedEpicUsername('');
      setLinkingSuccess('Epic Games account unlinked successfully!');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setLinkingSuccess("");
      }, 5000);
      
      notification.addNotification('Epic Games account unlinked successfully', 'success');
    } catch (error) {
      console.error('Error unlinking Epic Games account:', error);
      setLinkingError(`Failed to unlink Epic Games account: ${error.message}`);
      notification.addNotification(`Failed to unlink Epic account: ${error.message}`, 'error');
    } finally {
      setUnlinkingEpic(false);
    }
  };
  
  // Add a function to toggle the name edit form
  const toggleNameEdit = () => {
    setIsEditingName(!isEditingName);
    if (!isEditingName) {
      // When opening the form, pre-fill with current display name
      setNewDisplayName(displayName);
    } else {
      // When closing the form, clear any error/success messages
      setNameChangeError('');
      setNameChangeSuccess('');
    }
  };
  
  const handleLinkTwitch = async () => {
    notification.addNotification('Redirecting to Twitch for account linking...', 'info');
    try {
      setLinkingError('');
      setLinkingSuccess('');
      setIsLinkingTwitch(true);
      setTwitchLinkInProgress(true);
      
      if (!currentUser) {
        setLinkingError('You must be logged in to link your Twitch account');
        setIsLinkingTwitch(false);
        setTwitchLinkInProgress(false);
        return;
      }
      
      // Store a flag to detect when we return
      localStorage.setItem('twitch_link_started', Date.now().toString());
      localStorage.setItem('twitch_link_user', currentUser.uid);
      
      // Use the signInWithTwitch function from AuthContext
      await signInWithTwitch();
      
      // The page will redirect, so the following code won't execute
    } catch (error) {
      console.error('Error initiating Twitch link:', error);
      setLinkingError('Failed to start Twitch authentication. Please try again.');
      setIsLinkingTwitch(false);
      setTwitchLinkInProgress(false);
    }
  };
  
  const handleUnlinkTwitch = async () => {
    if (!currentUser) {
      setLinkingError('You must be logged in to unlink your Twitch account');
      return;
    }
    
    try {
      setUnlinkingTwitch(true);
      
      // Update Firestore to remove Twitch connection
      const db = getFirestore();
      const userRef = doc(db, 'users', currentUser.uid);
      
      await setDoc(userRef, {
        twitchLinked: false,
        twitchUnlinkedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      // Update UI state
      setIsTwitchLinked(false);
      setTwitchUsername('');
      setLinkingSuccess('Twitch account unlinked successfully!');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setLinkingSuccess("");
      }, 5000);
      
      notification.addNotification('Twitch account unlinked successfully', 'success');
    } catch (error) {
      console.error('Error unlinking Twitch account:', error);
      setLinkingError(`Failed to unlink Twitch: ${error.message}`);
      notification.addNotification(`Failed to unlink Twitch: ${error.message}`, 'error');
    } finally {
      setUnlinkingTwitch(false);
    }
  };
  
  // Function to handle sign out
  const handleSignOut = () => {
    logout();
    notification.addNotification('You have been signed out successfully', 'info');
    navigate('/');
  };
  
  // Fetch user stats
  useEffect(() => {
    if (!currentUser) return;
    
    setLoadingStats(true);
    
    // Set up real-time listener for userStats
    const db = getFirestore();
    const statsRef = doc(db, 'userStats', currentUser.uid);
    
    const unsubscribe = onSnapshot(statsRef, (snapshot) => {
      if (snapshot.exists()) {
        setUserStats(snapshot.data());
      } else {
        // If no stats document exists, use default values
        setUserStats({
          matchesPlayed: 0,
          matchesWon: 0,
          winRate: 0,
          totalEarnings: 0
        });
      }
      setLoadingStats(false);
    }, (error) => {
      console.error('Error fetching user stats:', error);
      setLoadingStats(false);
    });
    
    // Clean up listener on unmount
    return () => unsubscribe();
  }, [currentUser]);
  
  // Add debug state
  const [showDebug, setShowDebug] = useState(false);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [userStatsHistory, setUserStatsHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [wagersHistory, setWagersHistory] = useState([]);

  // Function to load and watch user transactions for debugging
  const loadDebugData = async () => {
    if (!currentUser) return;
    
    setIsLoadingHistory(true);
    const db = getFirestore();
    
    // Get transactions in real-time
    const transactionsQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', currentUser.uid),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
    
    const unsubscribe1 = onSnapshot(transactionsQuery, (snapshot) => {
      const transactions = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate().toLocaleString() || 'Unknown time'
        };
      });
      setTransactionHistory(transactions);
    });
    
    // Get user's wagers
    const wagersQuery = query(
      collection(db, 'wagers'),
      where('participants', 'array-contains', currentUser.uid),
      orderBy('updatedAt', 'desc'),
      limit(10)
    );
    
    const unsubscribe2 = onSnapshot(wagersQuery, (snapshot) => {
      const wagers = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate().toLocaleString() || 'Unknown',
          updatedAt: data.updatedAt?.toDate().toLocaleString() || 'Unknown'
        };
      });
      setWagersHistory(wagers);
    });
    
    // Track userStats changes
    const userStatsRef = doc(db, 'userStats', currentUser.uid);
    const unsubscribe3 = onSnapshot(userStatsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setUserStatsHistory(prev => [
          {
            timestamp: new Date().toLocaleString(),
            ...data,
            createdAt: data.createdAt?.toDate().toLocaleString() || 'Unknown',
            updatedAt: data.updatedAt?.toDate().toLocaleString() || 'Unknown'
          },
          ...prev.slice(0, 9) // Keep last 10 updates
        ]);
      }
    });
    
    setIsLoadingHistory(false);
    
    return () => {
      unsubscribe1();
      unsubscribe2();
      unsubscribe3();
    };
  };
  
  // Toggle debug view
  const toggleDebug = () => {
    const newState = !showDebug;
    setShowDebug(newState);
    
    if (newState && transactionHistory.length === 0) {
      loadDebugData();
    }
  };

  // Add isAdmin state for admin debug panel
  const [isAdmin, setIsAdmin] = useState(false);
  


  useEffect(() => {
    if (!currentUser) return;
    const checkAdmin = async () => {
      try {
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists() && userDoc.data().isAdmin) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, [currentUser]);
  
  // Add these imports and styled components

  // Add this to the existing state variables in the Profile component
  const [matchHistory, setMatchHistory] = useState([]);
  const [loadingMatchHistory, setLoadingMatchHistory] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [lastVisibleDoc, setLastVisibleDoc] = useState(null);
  const [firstVisibleDoc, setFirstVisibleDoc] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [pageStack, setPageStack] = useState([]); // Stack of lastVisibleDocs for going back

  // Add this function inside the Profile component
  const fetchMatchHistory = async (direction = 'next') => {
    if (!currentUser) return;
    try {
      setLoadingMatchHistory(true);
      const db = getFirestore();
      let wagersQuery;
      if (direction === 'next') {
        wagersQuery = lastVisibleDoc
          ? query(
              collection(db, 'wagers'),
              where('participants', 'array-contains', currentUser.uid),
              where('status', '==', 'completed'),
              orderBy('updatedAt', 'desc'),
              startAfter(lastVisibleDoc),
              limit(pageSize)
            )
          : query(
              collection(db, 'wagers'),
              where('participants', 'array-contains', currentUser.uid),
              where('status', '==', 'completed'),
              orderBy('updatedAt', 'desc'),
              limit(pageSize)
            );
      } else if (direction === 'prev' && pageStack.length > 1) {
        // Go back to previous page
        const prevDoc = pageStack[pageStack.length - 2];
        wagersQuery = prevDoc
          ? query(
              collection(db, 'wagers'),
              where('participants', 'array-contains', currentUser.uid),
              where('status', '==', 'completed'),
              orderBy('updatedAt', 'desc'),
              startAfter(prevDoc),
              limit(pageSize)
            )
          : query(
              collection(db, 'wagers'),
              where('participants', 'array-contains', currentUser.uid),
              where('status', '==', 'completed'),
              orderBy('updatedAt', 'desc'),
              limit(pageSize)
            );
      } else {
        // Default to first page
        wagersQuery = query(
          collection(db, 'wagers'),
          where('participants', 'array-contains', currentUser.uid),
          where('status', '==', 'completed'),
          orderBy('updatedAt', 'desc'),
          limit(pageSize)
        );
      }
      const snapshot = await getDocs(wagersQuery);
      const matches = [];
      snapshot.forEach((doc) => {
        const match = doc.data();
        match.id = doc.id;
        const isWinner =
          (match.winner === 'host' && match.hostId === currentUser.uid) ||
          (match.winner === 'guest' && match.guestId === currentUser.uid);
        let opponentId, opponentName;
        if (match.hostId === currentUser.uid) {
          opponentId = match.guestId;
          opponentName = match.guestName || 'Opponent';
        } else {
          opponentId = match.hostId;
          opponentName = match.hostName || 'Opponent';
        }
        const feePercent = FEE_CONFIG.wager;
        const amount = match.amount || 0;
        const feePerPlayer = Math.round(amount * feePercent);
        const prizePerPlayer = amount - feePerPlayer;
        const totalPrize = prizePerPlayer * 2;
        matches.push({
          id: match.id,
          date: match.updatedAt ? match.updatedAt.toDate() : new Date(),
          opponent: opponentName,
          opponentId: opponentId,
          amount: match.amount || 0,
          gameMode: match.gameMode || 'Unknown',
          isWinner: isWinner,
          reward: isWinner ? totalPrize : 0,
          earnings: isWinner ? totalPrize - match.amount : -match.amount,
          platform: match.platform || 'All',
          region: match.region || 'Unknown',
        });
      });
      setMatchHistory(matches);
      if (!snapshot.empty) {
        setFirstVisibleDoc(snapshot.docs[0]);
        setLastVisibleDoc(snapshot.docs[snapshot.docs.length - 1]);
        // For next/prev logic
        if (direction === 'next') {
          setPageStack((prev) => [...prev, snapshot.docs[0]]);
          setCurrentPage((prev) => prev + 1);
        } else if (direction === 'prev' && currentPage > 1) {
          setPageStack((prev) => prev.slice(0, -1));
          setCurrentPage((prev) => prev - 1);
        }
      }
      // Check if there is a next page
      const nextQuery = query(
        collection(db, 'wagers'),
        where('participants', 'array-contains', currentUser.uid),
        where('status', '==', 'completed'),
        orderBy('updatedAt', 'desc'),
        startAfter(snapshot.docs[snapshot.docs.length - 1]),
        limit(1)
      );
      const nextSnap = await getDocs(nextQuery);
      setHasNextPage(!nextSnap.empty);
      setHasPrevPage(currentPage > 1);
    } catch (error) {
      console.error('Error fetching match history:', error);
      setMatchHistory([]);
    } finally {
      setLoadingMatchHistory(false);
    }
  };

  // Update useEffect to load first page
  useEffect(() => {
    if (currentUser) {
      setCurrentPage(1);
      setPageStack([]);
      setLastVisibleDoc(null);
      fetchMatchHistory('next');
    }
  }, [currentUser]);

  // Add this state near the other useState calls
  const [discordAvatar, setDiscordAvatar] = useState('');

  // Add this effect to fetch and set the Discord avatar
  useEffect(() => {
    if (currentUser) {
      const db = getFirestore();
      getDoc(doc(db, 'users', currentUser.uid)).then(userDoc => {
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.discordLinked && userData.discordId && userData.discordAvatar) {
            // Check if discordAvatar is already a full URL
            if (userData.discordAvatar.includes('http')) {
              const discordUrl = `${userData.discordAvatar}?t=${Date.now()}`;
              setDiscordAvatar(discordUrl);
            } else {
              // Otherwise construct the URL from the avatar hash
              const discordUrl = `https://cdn.discordapp.com/avatars/${userData.discordId}/${userData.discordAvatar}.png?t=${Date.now()}`;
              setDiscordAvatar(discordUrl);
            }
          }
        }
      });
    }
  }, [currentUser]);
  
  // Add these new state variables for rank testing
  const [isRankTesting, setIsRankTesting] = useState(false);
  const [testingXp, setTestingXp] = useState(0);
  const [testingLevel, setTestingLevel] = useState(1);
  const [testingTier, setTestingTier] = useState('Bronze');

  // Add these new functions for rank testing
  const setTestRank = async (tierName) => {
    if (!currentUser) return;
    
    const tier = TIERS[tierName];
    if (!tier) return;
    
    // Set to the middle of the tier's level range
    const targetLevel = Math.floor((tier.minLevel + tier.maxLevel) / 2);
    const targetXp = XP_LEVELS[targetLevel] || 0;
    
    try {
      const db = getFirestore();
      const userRef = doc(db, 'users', currentUser.uid);
      
      await updateDoc(userRef, {
        xpTotal: targetXp,
        currentLevel: targetLevel,
        currentTier: tierName,
        seasonHighestTier: tierName
      });

      // Real-time listeners will handle the UI updates automatically
    } catch (error) {
      console.error('Error setting test rank:', error);
    }
  };
  
  const addTestXp = async (amount) => {
    if (!currentUser) return;
    
    try {
      // Use the proper awardXp function which updates all fields correctly
      const result = await awardXp(currentUser.uid, amount, `Manual test XP (${amount})`);
      
      if (!result) {
        console.error('Failed to award test XP');
      }
    } catch (error) {
      console.error('Error adding test XP:', error);
    }
  };
  
  const testRealTimeUpdates = async () => {
    if (!currentUser) return;
    
    try {
      // Award small amounts of XP repeatedly to test real-time updates
      const testAmounts = [50, 100, 200, 500];
      
      for (let i = 0; i < testAmounts.length; i++) {
        setTimeout(async () => {
          const amount = testAmounts[i];
          await awardXp(currentUser.uid, amount, `Real-time test ${i + 1} (+${amount} XP)`);
        }, i * 2000); // Award every 2 seconds
      }
    } catch (error) {
      console.error('Error testing real-time updates:', error);
    }
  };
  
  const resetToBasic = async () => {
    if (!currentUser) return;
    
    try {
      const db = getFirestore();
      const userRef = doc(db, 'users', currentUser.uid);
      
      await updateDoc(userRef, {
        xpTotal: 0,
        currentLevel: 1,
        currentTier: 'Bronze',
        seasonHighestTier: 'Bronze'
      });

      // Real-time listeners will handle the UI updates automatically
    } catch (error) {
      console.error('Error resetting rank:', error);
    }
  };

  // Update the current testing stats when user data changes
  useEffect(() => {
    if (currentUser) {
      setTestingXp(xpTotal || 0);
      setTestingLevel(currentLevel || 1);
      setTestingTier(currentTier || 'Bronze');
    }
  }, [currentUser, xpTotal, currentLevel, currentTier]);

  const [isVip, setIsVip] = useState(false);
  useEffect(() => {
    if (!currentUser) return;
    const db = getFirestore();
    const invRef = doc(db, 'userInventory', currentUser.uid);
    const userRef = doc(db, 'users', currentUser.uid);
    let unsubInv, unsubUser;
    unsubInv = onSnapshot(invRef, (docSnap) => {
      let isVip = false;
      if (docSnap.exists()) {
        const items = docSnap.data().items || [];
        const now = new Date();
        const vip = items.find(i => i.id === 'vip_subscription' && i.isActive && i.expiresAt && (i.expiresAt.toDate ? i.expiresAt.toDate() : new Date(i.expiresAt)) > now);
        isVip = !!vip;
      }
      setIsVip(isVip);
    });
    unsubUser = onSnapshot(userRef, (docSnap) => {
      if (!docSnap.exists()) return;
      const vipStatus = docSnap.data().vipStatus;
      if (vipStatus && vipStatus.isActive && vipStatus.expiresAt) {
        const now = new Date();
        const expiresAt = vipStatus.expiresAt.toDate ? vipStatus.expiresAt.toDate() : new Date(vipStatus.expiresAt);
        if (expiresAt > now) setIsVip(true);
      }
    });
    return () => { unsubInv && unsubInv(); unsubUser && unsubUser(); };
  }, [currentUser]);

  return (
    <ProfileContainer 
      $hasProfileCosmetic={!!(userCosmetics?.equipped?.profile)} 
      $cosmeticBackground={userCosmetics?.equipped?.profile ? findCosmeticById(userCosmetics.equipped.profile)?.effects?.backgroundColor : null}
          >
        {/* Cosmetic Profile Background Overlay */}
        {userCosmetics?.equipped?.profile && (
          <CosmeticProfile 
            cosmetic={findCosmeticById(userCosmetics.equipped.profile)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: -1,
              borderRadius: '0px',
              border: 'none',
              minHeight: '100vh'
            }}
          />
        )}
        
        {/* Main Content Wrapper - ensures all content is above cosmetic background */}
        <MainContentWrapper>
        <StatsCardModule>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem', marginBottom: '2.2rem', flexWrap: 'wrap' }}>
            <AvatarGlow style={{
              backgroundImage: discordAvatar 
                ? `url(${discordAvatar})` 
                : "url('https://placehold.co/160x160')",
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }} />
            <ProfileInfo style={{ flex: 1, minWidth: 0 }}>
              <NameRow>
                <span style={{ fontSize: '2.2rem', fontWeight: 900, background: 'linear-gradient(90deg, #4facfe 0%, #ff61e6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '0.08em', textShadow: '0 4px 24px #4facfe88' }}>{displayName || currentUser.displayName}</span>
                <EditIcon onClick={toggleNameEdit} title="Edit display name">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                </EditIcon>
                {isVip && (
                  <span title="VIP Member" style={{marginLeft:'0.15rem',display:'inline-flex',alignItems:'center'}}>
                    <svg viewBox="0 0 24 24" fill="#ffd700" width="28" height="28"><path d="M12 2l2.09 6.26L20 9.27l-5 3.64L16.18 20 12 16.77 7.82 20 9 12.91l-5-3.64 5.91-.01z"/></svg>
                  </span>
                )}
                <RankBadge userId={currentUser?.uid} size={32} marginLeft="0" />
                {userCosmetics?.equipped?.flair && (
                  <CosmeticFlair 
                    cosmetic={findCosmeticById(userCosmetics.equipped.flair)}
                    style={{ marginLeft: '8px' }}
                  />
                )}
              </NameRow>
              {isEditingName && (
                <UpdateDisplayName 
                  currentName={displayName}
                  onSuccess={async (newName) => {
                    const auth = getAuth();
                    if (currentUser && typeof currentUser.reload === 'function') {
                      await currentUser.reload();
                      // Use the latest user object from Firebase Auth
                      const updatedUser = auth.currentUser;
                      if (typeof setCurrentUser === 'function') {
                        setCurrentUser(updatedUser);
                      }
                    }
                    setDisplayName(newName);
                    setIsEditingName(false);
                    notification.addNotification('Display name updated successfully!', 'success');
                  }}
                  onCancel={() => setIsEditingName(false)}
                  showCancelButton={true}
                />
              )}
              <p style={{ margin: '0.5rem 0 1.1rem 0' }}>Member since {currentUser?.metadata?.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Joined recently'}</p>
              <TokenBalance>
                Balance: <span>{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })} Tokens</span>
              </TokenBalance>
              <NeonTipButton onClick={() => setIsTipModalOpen(true)}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '0.5rem', verticalAlign: 'middle' }}>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
                </svg>
                Send Tip
              </NeonTipButton>
            </ProfileInfo>
          </div>
          <StatsGridRow>
            <StatCard>
              <h3><StatIcon className="bounce"><svg width="24" height="24" viewBox="0 0 24 24" fill="#4facfe"><path d="M21.71 20.29l-7.39-7.39 1.42-1.42 7.39 7.39a1 1 0 0 1-1.42 1.42zM2.29 20.29a1 1 0 0 1 0-1.42l7.39-7.39 1.42 1.42-7.39 7.39a1 1 0 0 1-1.42 0z"/><path d="M14.85 10.85l-1.7-1.7 6.3-6.3a1 1 0 0 1 1.42 1.42zM9.15 10.85l1.7-1.7-6.3-6.3A1 1 0 0 0 3.13 5.27z"/></svg></StatIcon>{matchesPlayed}</h3>
              <p>Matches Played</p>
            </StatCard>
            <StatCard>
              <h3><StatIcon className="bounce"><svg width="24" height="24" viewBox="0 0 24 24" fill="#ffd700"><path d="M17 3V2a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v1H2v2a5 5 0 0 0 5 5h1v2a5 5 0 0 0 4 4.9V20H9v2h6v-2h-3v-3.1A5 5 0 0 0 17 12V10h1a5 5 0 0 0 5-5V3zM4 5V5.01A3 3 0 0 1 7 8h1V5zm16 0v.01A3 3 0 0 1 17 8h-1V5z"/></svg></StatIcon>{wagersWon}</h3>
              <p>Matches Won</p>
            </StatCard>
            <StatCard>
              <h3><StatIcon className="bounce"><svg width="24" height="24" viewBox="0 0 24 24" fill="#00e676"><circle cx="12" cy="12" r="10" stroke="#00e676" strokeWidth="2" fill="none"/><circle cx="12" cy="12" r="6" stroke="#00e676" strokeWidth="2" fill="none"/><circle cx="12" cy="12" r="2" fill="#00e676"/></svg></StatIcon>{parseFloat(winRate).toFixed(2)}%</h3>
              <p>Win Rate</p>
            </StatCard>
            <StatCard>
              <h3><StatIcon className="bounce"><svg width="24" height="24" viewBox="0 0 24 24" fill="#ffb347"><circle cx="12" cy="12" r="10" stroke="#ffb347" strokeWidth="2" fill="#fff3e0"/><text x="12" y="16" textAnchor="middle" fontSize="12" fill="#ffb347" fontWeight="bold">⦿</text></svg></StatIcon>{parseFloat(totalEarnings).toFixed(2)}</h3>
              <p>Total Earnings</p>
            </StatCard>
          </StatsGridRow>
        </StatsCardModule>
        <SectionDivider />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <XpSectionTitle>Player Progression</XpSectionTitle>
          <UserXpCard />
        </div>
        
        <FortniteSection>
            <SectionTitle>Fortnite Settings</SectionTitle>
        
        <ButtonContainer>
          {!isDiscordLinked ? (
            <LinkDiscordButton 
              onClick={handleLinkDiscord} 
              disabled={isLinkingDiscord || discordLinkInProgress}
            >
              <svg width="20" height="15" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z" fill="currentColor"/>
              </svg>
              {isLinkingDiscord || discordLinkInProgress ? 'Linking Discord...' : 'Link Discord Account'}
            </LinkDiscordButton>
          ) : (
            <>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                background: 'rgba(88, 101, 242, 0.2)',
                padding: '0.8rem 1.5rem',
                borderRadius: '10px',
                marginLeft: '1rem'
              }}>
                <svg width="20" height="15" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '10px' }}>
                  <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z" fill="currentColor"/>
                </svg>
                <div>
                  <div style={{ color: '#5865F2', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
                    Discord Linked
                    <UnlinkButton 
                      onClick={handleUnlinkDiscord}
                      disabled={unlinkingDiscord}
                    >
                      {unlinkingDiscord ? 'Unlinking...' : 'Unlink'}
                    </UnlinkButton>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#b8c1ec' }}>{discordUsername}</div>
                </div>
              </div>
              
              {/* Add Twitch button after Discord is linked */}
              {!isTwitchLinked ? (
                <LinkTwitchButton
                  onClick={handleLinkTwitch}
                  disabled={isLinkingTwitch || twitchLinkInProgress}
                  style={{ marginLeft: '1rem' }}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
                  </svg>
                  {isLinkingTwitch || twitchLinkInProgress ? 'Linking Twitch...' : 'Link Twitch Account'}
                </LinkTwitchButton>
              ) : (
                <TwitchAccountDisplay style={{ marginLeft: '1rem' }}>
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
                  </svg>
                  <div>
                    <div style={{ color: '#9146FF', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
                      Twitch Linked
                      <UnlinkButton 
                        onClick={handleUnlinkTwitch}
                        disabled={unlinkingTwitch}
                      >
                        {unlinkingTwitch ? 'Unlinking...' : 'Unlink'}
                      </UnlinkButton>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#b8c1ec' }}>{twitchUsername}</div>
                  </div>
                </TwitchAccountDisplay>
              )}
              
              {!isGameLinked ? (
                <GameLinkButton 
                  onClick={handleGameLink}
                  disabled={!isDiscordLinked || gameLinkInProgress}
                  style={{ marginLeft: '1rem' }}
                >
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="#FFFFFF" 
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ marginRight: '8px' }}
                  >
                    <path d="M20.84 15.57c-0.92-0.13-1.76-0.39-2.59-0.79l1.08-1.99c0.18-0.3 0.09-0.63-0.13-0.83-0.39-0.33-0.97-0.33-1.36 0l-1.37 1.02c-0.92-1.08-1.29-2.48-1.33-3.86h1.75c0.22 0 0.43-0.15 0.5-0.37 0.14-0.68-0.64-1.25-1.25-0.86l-1.46 0.97c-0.29-0.57-0.63-1.12-1.05-1.63V5c0-0.55-0.45-1-1-1H9.5C8.95 4 8.5 4.45 8.5 5v2.61c-0.55 0.55-1.02 1.18-1.39 1.89l-1.56-1.04c-0.47-0.32-1.11 0.05-1.11 0.66 0 0.24 0.13 0.45 0.32 0.57l1.24 0.83v0.27c0 1.38-0.28 2.75-0.95 3.91L3.5 13.59c-0.43-0.43-1.14-0.39-1.53 0.14-0.29 0.38-0.27 0.91 0.08 1.25l1.59 1.5c-0.2 0.17-0.38 0.39-0.5 0.67C2.38 18.38 3.12 19.5 4.5 19.5c1.21 0 2.85-0.13 3.84-0.35 2.78-0.62 5.07-2.05 6.79-4.25l3.91 2.28c0.46 0.23 1.03 0.04 1.25-0.44 0.25-0.57-0.16-1.32-0.83-1.32-0.22 0-0.42 0.1-0.55 0.26l-2.61-1.57L16.8 13c1.04 0.44 2.16 0.65 3.29 0.65 0.92 0 1.41-1.09 0.75-1.75l-0.1-0.93zM9.75 12.75c-0.55 0-1-0.45-1-1s0.45-1 1-1 1 0.45 1 1-0.45 1-1 1zm4.5 0c-0.55 0-1-0.45-1-1s0.45-1 1-1 1 0.45 1 1-0.45 1-1 1z"/>
                  </svg>
                  {gameLinkInProgress ? 'Verifying...' : 'Game Link'}
                </GameLinkButton>
              ) : (
                <div style={{ marginLeft: '1rem' }}>
                  <EpicAccountDisplay>
                    <svg 
                      width="24" 
                      height="24" 
                      viewBox="0 0 24 24" 
                      fill="#00BFFF" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M20.84 15.57c-0.92-0.13-1.76-0.39-2.59-0.79l1.08-1.99c0.18-0.3 0.09-0.63-0.13-0.83-0.39-0.33-0.97-0.33-1.36 0l-1.37 1.02c-0.92-1.08-1.29-2.48-1.33-3.86h1.75c0.22 0 0.43-0.15 0.5-0.37 0.14-0.68-0.64-1.25-1.25-0.86l-1.46 0.97c-0.29-0.57-0.63-1.12-1.05-1.63V5c0-0.55-0.45-1-1-1H9.5C8.95 4 8.5 4.45 8.5 5v2.61c-0.55 0.55-1.02 1.18-1.39 1.89l-1.56-1.04c-0.47-0.32-1.11 0.05-1.11 0.66 0 0.24 0.13 0.45 0.32 0.57l1.24 0.83v0.27c0 1.38-0.28 2.75-0.95 3.91L3.5 13.59c-0.43-0.43-1.14-0.39-1.53 0.14-0.29 0.38-0.27 0.91 0.08 1.25l1.59 1.5c-0.2 0.17-0.38 0.39-0.5 0.67C2.38 18.38 3.12 19.5 4.5 19.5c1.21 0 2.85-0.13 3.84-0.35 2.78-0.62 5.07-2.05 6.79-4.25l3.91 2.28c0.46 0.23 1.03 0.04 1.25-0.44 0.25-0.57-0.16-1.32-0.83-1.32-0.22 0-0.42 0.1-0.55 0.26l-2.61-1.57L16.8 13c1.04 0.44 2.16 0.65 3.29 0.65 0.92 0 1.41-1.09 0.75-1.75l-0.1-0.93zM9.75 12.75c-0.55 0-1-0.45-1-1s0.45-1 1-1 1 0.45 1 1-0.45 1-1 1zm4.5 0c-0.55 0-1-0.45-1-1s0.45-1 1-1 1 0.45 1 1-0.45 1-1 1z"/>
                    </svg>
                    <div>
                      <div style={{ color: '#00BFFF', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
                        Epic Games Linked
                        <UnlinkButton 
                          onClick={handleUnlinkEpic}
                          disabled={unlinkingEpic}
                        >
                          {unlinkingEpic ? 'Unlinking...' : 'Unlink'}
                        </UnlinkButton>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#b8c1ec' }}>{verifiedEpicUsername}</div>
                    </div>
                  </EpicAccountDisplay>
                </div>
              )}
            </>
          )}
        </ButtonContainer>
        
        {/* Show loading indicator when Discord linking is in progress */}
        {discordLinkInProgress && (
          <div style={{ 
            color: '#5865F2', 
            marginBottom: '1rem', 
            display: 'flex', 
            alignItems: 'center' 
          }}>
            <div style={{ 
              width: '16px', 
              height: '16px', 
              borderRadius: '50%', 
              border: '2px solid #5865F2', 
              borderTopColor: 'transparent', 
              marginRight: '8px',
              animation: 'spin 1s linear infinite' 
            }}></div>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
            Linking your Discord account...
          </div>
        )}
        
        {/* Show loading indicator when Twitch linking is in progress */}
        {twitchLinkInProgress && (
          <div style={{ 
            color: '#9146FF', 
            marginBottom: '1rem', 
            display: 'flex', 
            alignItems: 'center' 
          }}>
            <div style={{ 
              width: '16px', 
              height: '16px', 
              borderRadius: '50%', 
              border: '2px solid #9146FF', 
              borderTopColor: 'transparent', 
              marginRight: '8px',
              animation: 'spin 1s linear infinite' 
            }}></div>
            Linking your Twitch account...
          </div>
        )}
        
        {/* Show loading indicator when Game linking is in progress */}
        {gameLinkInProgress && (
          <div style={{ 
            color: '#00BFFF', 
            marginBottom: '1rem', 
            display: 'flex', 
            alignItems: 'center' 
          }}>
            <div style={{ 
              width: '16px', 
              height: '16px', 
              borderRadius: '50%', 
              border: '2px solid #00BFFF', 
              borderTopColor: 'transparent', 
              marginRight: '8px',
              animation: 'spin 1s linear infinite' 
            }}></div>
            Verifying your Epic Games account...
          </div>
        )}
        
        {linkingError && (
          <div style={{ color: '#ff4757', marginBottom: '1rem' }}>{linkingError}</div>
        )}
        {linkingSuccess && <div style={{ color: '#2ed573', marginBottom: '1rem' }}>{linkingSuccess}</div>}
        
        {/* Show Discord invite button only if Discord is linked */}
        {isDiscordLinked && (
          <div style={{ marginTop: '1rem' }}>
            <p style={{ color: '#b8c1ec' }}>
              Join our Discord server to participate in matches and tournaments:
            </p>
            <DiscordInviteButton href={DISCORD_INVITE_LINK} target="_blank" rel="noopener noreferrer">
              Join Discord Server
            </DiscordInviteButton>
          </div>
        )}
      </FortniteSection>
      
      <SectionTitle>Match History</SectionTitle>
      {loadingMatchHistory ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ 
            width: '30px', 
            height: '30px', 
            borderRadius: '50%', 
            border: '3px solid #4facfe', 
            borderTopColor: 'transparent', 
            margin: '0 auto',
            animation: 'spin 1s linear infinite' 
          }}></div>
        </div>
      ) : (
        <>
          <MatchHistory>
            <MatchHistoryHeader>
              <div>Date</div>
              <div>Game Mode</div>
              <div>Opponent</div>
              <div>Token Amount</div>
              <div>Result</div>
              <div>Earnings</div>
            </MatchHistoryHeader>
            {matchHistory.length > 0 ? (
              matchHistory.map((match) => (
                <MatchRow key={match.id} onClick={() => navigate(`/wager/${match.id}`)}>
                  <div>{match.date.toLocaleDateString()}</div>
                  <div>
                    {match.gameMode}
                    {match.mode === 'fun' && (
                      <span style={{ marginLeft: 8, color: '#51cf66', fontWeight: 700, fontSize: '1rem' }}> Fun Play</span>
                    )}
                  </div>
                  <div>{match.opponent}</div>
                  <div>{match.amount} tokens</div>
                  <div>
                    <MatchResult win={match.isWinner}>{match.isWinner ? 'Win' : 'Loss'}</MatchResult>
                  </div>
                  <div style={{color: match.earnings > 0 ? '#51cf66' : '#ff6b6b'}}>
                    {match.earnings > 0 ? `+${match.earnings}` : match.earnings} tokens
                  </div>
                </MatchRow>
              ))
            ) : (
              <MatchRow>
                <div colSpan="6" style={{ textAlign: 'center', gridColumn: '1 / -1' }}>No match history available</div>
              </MatchRow>
            )}
          </MatchHistory>
          {/* Pagination Controls */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
            <button onClick={() => fetchMatchHistory('prev')} disabled={!hasPrevPage} style={{ marginRight: 8 }}>
              Previous
            </button>
            <span style={{ color: '#b8c1ec', fontWeight: 600, margin: '0 12px' }}>Page {currentPage}</span>
            <button onClick={() => fetchMatchHistory('next')} disabled={!hasNextPage}>
              Next
            </button>
          </div>
        </>
      )}
      
      <TipUserModalRedesigned
        isOpen={isTipModalOpen}
        onClose={() => setIsTipModalOpen(false)}
      />
        </MainContentWrapper>
        {/* End Main Content Wrapper */}
      
    </ProfileContainer>
  );
};

export default Profile;
