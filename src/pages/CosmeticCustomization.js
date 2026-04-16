import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useCosmetics } from '../contexts/CosmeticContext';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { getRarityInfo } from '../data/cosmeticData';
import CosmeticNameplate from '../components/CosmeticNameplate';
import CosmeticFlair from '../components/CosmeticFlair';
import CosmeticProfile from '../components/CosmeticProfile';
import CosmeticCallingCard from '../components/CosmeticCallingCard';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';

const rarityColors = {
  common: '#b8c1ec',
  uncommon: '#4caf50',
  rare: '#2196f3',
  epic: '#A259F7',
  legendary: '#FFD700',
  mythic: '#FF61E6',
  special: '#00FFD0',
};

const shimmer = keyframes`
  0% { filter: brightness(1) drop-shadow(0 0 8px #4facfe88); }
  50% { filter: brightness(1.3) drop-shadow(0 0 16px #ff61e6cc); }
  100% { filter: brightness(1) drop-shadow(0 0 8px #4facfe88); }
`;

const CustomizationContainer = styled.div`
  min-height: 100vh;
  background: #131124;
  color: #fff;
  padding: 2rem 0;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: url('https://fortnite-api.com/images/cosmetics/br/character_default.png') no-repeat right bottom/auto 60vh;
    opacity: 0.05;
    z-index: 0;
    pointer-events: none;
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
  position: relative;
  z-index: 1;
  
  h1 {
    font-size: 3.5rem;
    background: linear-gradient(90deg, #4facfe 0%, #ff61e6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-family: 'Inter', Arial, sans-serif;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-shadow: 0 4px 24px #4facfe88;
    margin-bottom: 0.5rem;
  }
  
  p {
    color: #b8c1ec;
    font-size: 1.2rem;
    font-weight: 500;
  }
`;

const CategoryTabs = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 3rem;
  position: relative;
  z-index: 1;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
`;

const CategoryTab = styled.button`
  background: ${props => props.$active ? 'linear-gradient(90deg, #A259F7 0%, #00FFD0 100%)' : 'rgba(255, 255, 255, 0.13)'};
  color: ${props => props.$active ? '#18122B' : '#fff'};
  border: none;
  padding: 1rem 2rem;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 150px;
  justify-content: center;
  box-shadow: ${props => props.$active ? '0 0 16px #A259F7, 0 0 8px #00FFD0' : 'none'};
  border: ${props => props.$active ? '2.5px solid #A259F7' : '2px solid transparent'};
  position: relative;
  &:hover {
    background: ${props => props.$active ? 'linear-gradient(90deg, #A259F7 0%, #00FFD0 100%)' : 'rgba(255, 255, 255, 0.18)'};
    transform: translateY(-2px) scale(1.04);
    box-shadow: 0 0 16px #A259F7, 0 0 8px #00FFD0;
  }
  .icon {
    font-size: 1.3rem;
  }
`;

const ContentContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
  position: relative;
  z-index: 1;
`;

const PreviewSection = styled.div`
  background: rgba(22, 33, 62, 0.8);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 3rem;
  border: 1px solid rgba(79, 172, 254, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  
  h3 {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
    color: #4facfe;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

const SettingsSection = styled.div`
  background: rgba(22, 33, 62, 0.8);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 3rem;
  border: 1px solid rgba(79, 172, 254, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  
  h3 {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
    color: #4facfe;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

const SettingRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
  }
  
  .setting-info {
    flex: 1;
    
    .setting-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #fff;
      margin-bottom: 0.25rem;
    }
    
    .setting-description {
      font-size: 0.9rem;
      color: #b8c1ec;
    }
  }
  
  .setting-control {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
`;

const BrightnessSlider = styled.input`
  width: 150px;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.2);
  outline: none;
  -webkit-appearance: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: linear-gradient(90deg, #4facfe 0%, #ff61e6 100%);
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(79, 172, 254, 0.5);
  }
  
  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: linear-gradient(90deg, #4facfe 0%, #ff61e6 100%);
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 8px rgba(79, 172, 254, 0.5);
  }
`;

const BrightnessValue = styled.span`
  color: #4facfe;
  font-weight: 600;
  min-width: 40px;
  text-align: center;
`;

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
  
  input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.2);
    transition: 0.4s;
    border-radius: 34px;
    
    &:before {
      position: absolute;
      content: "";
      height: 26px;
      width: 26px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      transition: 0.4s;
      border-radius: 50%;
    }
  }
  
  input:checked + .slider {
    background: linear-gradient(90deg, #4facfe 0%, #ff61e6 100%);
  }
  
  input:checked + .slider:before {
    transform: translateX(26px);
  }
`;

const PreviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const PreviewCard = styled.div`
  background: rgba(255, 255, 255, 0.07);
  border-radius: 14px;
  padding: 1.5rem;
  border: 2.5px solid ${props => props.$color || 'rgba(255,255,255,0.13)'};
  box-shadow: 0 4px 24px ${props => props.$shadow || '#A259F744'};
  position: relative;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  h4 {
    font-size: 1.1rem;
    margin-bottom: 1rem;
    color: ${props => props.$color || '#b8c1ec'};
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 800;
    letter-spacing: 0.02em;
  }
`;

const MockNameplate = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  display: inline-block;
  position: relative;
  border: 2px solid ${props => props.$borderColor || '#4facfe'};
  box-shadow: 0 0 16px ${props => props.$glowColor || '#4facfe88'};
  animation: ${props => props.$animation === 'flame-pulse' ? shimmer : 'none'} 2s infinite;
  
  .username {
    font-weight: 600;
    color: #fff;
  }
`;

const MockProfile = styled.div`
  background: ${props => props.$background || '#181825'};
  border-radius: 12px;
  padding: 1.5rem;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: ${props => props.$overlay || 'none'};
    opacity: 0.3;
    z-index: 1;
  }
  .content {
    position: relative;
    z-index: 2;
    text-align: center;
    color: #fff;
    font-weight: 600;
  }
`;

const MockLeaderboard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1rem;
  
  .leaderboard-entry {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.05);
    
    .rank {
      font-weight: 700;
      color: #4facfe;
      min-width: 30px;
    }
    
    .username {
      flex: 1;
      font-weight: 600;
    }
    
    .flair {
      font-size: 1.2rem;
      animation: ${props => props.$flairAnimation === 'bounce' ? shimmer : 'none'} 1.5s infinite;
    }
    
    .stats {
      color: #b8c1ec;
      font-size: 0.9rem;
    }
  }
`;

const CosmeticsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
`;

const CosmeticCard = styled(motion.div)`
  background: rgba(22, 33, 62, 0.85);
  border-radius: 16px;
  overflow: hidden;
  border: 2.5px solid ${props => props.$rarity ? rarityColors[props.$rarity] || '#fff' : '#fff'};
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  position: relative;
  &:hover {
    transform: translateY(-7px) scale(1.03);
    box-shadow: 0 0 32px ${props => props.$rarity ? rarityColors[props.$rarity] : '#A259F7'}, 0 0 16px #00FFD044;
    z-index: 2;
  }
  
  ${props => props.$equipped && `
    &::before {
      content: 'EQUIPPED';
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: linear-gradient(90deg, #4facfe 0%, #ff61e6 100%);
      color: #fff;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 700;
      z-index: 2;
    }
  `}
`;

const CosmeticHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  .cosmetic-icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    display: block;
  }
  
  h4 {
    font-size: 1.2rem;
    margin-bottom: 0.5rem;
    color: #fff;
  }
  
  .rarity {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    background: ${props => props.$rarityColor || '#9e9e9e'};
    color: #fff;
  }
`;

const CosmeticBody = styled.div`
  padding: 1.5rem;
  
  .description {
    color: #b8c1ec;
    margin-bottom: 1.5rem;
    line-height: 1.4;
    font-size: 0.9rem;
  }
  
  .unlock-method {
    color: #4facfe;
    font-size: 0.8rem;
    margin-bottom: 1rem;
    font-weight: 500;
  }
`;

const ActionButton = styled.button`
  width: 100%;
  background: ${props => {
    if (props.$equipped) return 'linear-gradient(90deg, #ff4757 0%, #ff6b7a 100%)';
    if (props.$owned) return 'linear-gradient(90deg, #4facfe 0%, #ff61e6 100%)';
    return 'rgba(255, 255, 255, 0.1)';
  }};
  color: #fff;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: ${props => props.$owned ? 'pointer' : 'not-allowed'};
  transition: all 0.2s ease;
  
  &:hover {
    ${props => props.$owned && `
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(79, 172, 254, 0.4);
    `}
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(79, 172, 254, 0.3);
    border-top: 4px solid #4facfe;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const CosmeticCustomization = () => {
  const { currentUser } = useAuth();
  const {
    loading,
    userCosmetics,
    ownsCosmetic,
    ownsOrQualifiesForCosmetic,
    getEquippedCosmetic,
    equipCosmetic,
    unequipCosmetic,
    getAvailableCosmeticsByType,
    isCosmeticEquipped,
    cosmeticSettings,
    updateCosmeticSettings,
    awardCosmetic
  } = useCosmetics();
  
  const [activeCategory, setActiveCategory] = useState('nameplates');
  const [actionLoading, setActionLoading] = useState(null);
  const [leaderboardDebug, setLeaderboardDebug] = useState(null);

  const categories = [
    { id: 'nameplates', name: 'Nameplate Effects', icon: '' },
    { id: 'profiles', name: 'Profile Themes', icon: '' },
    { id: 'flair', name: 'Leaderboard Flair', icon: '' },
    { id: 'callingcards', name: 'Calling Cards', icon: '' }
  ];

  const handleCosmeticAction = async (cosmetic) => {
    if (!currentUser) return;
    
    setActionLoading(cosmetic.id);
    
    try {
      const isEquipped = isCosmeticEquipped(cosmetic.id);
      
      if (isEquipped) {
        await unequipCosmetic(cosmetic.type);
      } else {
        await equipCosmetic(cosmetic.id, cosmetic.type);
      }
    } catch (error) {
      console.error('Error with cosmetic action:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getUnlockMethodText = (unlockMethod) => {
    const methods = {
      'shop': 'Available in Shop',
      'crate_rare': 'Rare Crate Reward',
      'crate_legendary': 'Legendary Crate Reward',
      'leaderboard_top1': 'Rank #1 Reward',
      'leaderboard_top3': 'Top 3 Reward',
      'leaderboard_top10': 'Top 10 Exclusive (Earnings Leaderboard)',
      'leaderboard_top100': 'Top 100 Reward',
      'wagerpass_tier15': 'WagerPass Tier 15',
      'achievement_rank_1': 'Rank #1 Achievement',
      'achievement_top_10': 'Top 10 Achievement',
      'achievement_top_1_percent': 'Top 1% Achievement',
      'achievement_10_wins': '10 Total Wins Achievement',
      'achievement_phoenix_rising': '25 Total Wins Achievement',
      'achievement_50_coins': '50 Coins Achievement',
      'achievement_200_coins': '200 Coins Achievement',
      'achievement_high_roller': 'High Roller Achievement',
      'achievement_100_wagers': '100 Wagers Achievement',
      'achievement_25_snipes': '25 Snipes Achievement',
      'achievement_unbreakable': 'Unbreakable Achievement'
    };
    return methods[unlockMethod] || 'Special Unlock';
  };

  // Map category IDs to data keys
  const getCategoryDataKey = (categoryId) => {
    const mapping = {
      'nameplates': 'nameplates',
      'profiles': 'profiles',
      'flair': 'flair',
      'callingcards': 'callingCards'
    };
    return mapping[categoryId] || categoryId;
  };

  const renderPreview = () => {
    const equippedNameplate = getEquippedCosmetic('nameplate');
    const equippedProfile = getEquippedCosmetic('profile');
    const equippedCallingCard = getEquippedCosmetic('callingCard');
    const equippedFlair = getEquippedCosmetic('flair');

    return (
      <PreviewSection>
        <h3> Live Preview</h3>
        <PreviewGrid>
          <PreviewCard>
            <h4>Match Lobby</h4>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
              <CosmeticNameplate cosmetic={equippedNameplate}>
                {currentUser?.displayName || 'Your Name'}
              </CosmeticNameplate>
            </div>
          </PreviewCard>
          
          <PreviewCard>
            <h4>Profile Page</h4>
            <CosmeticProfile 
              cosmetic={equippedProfile} 
              showDetails={false}
              style={{ minHeight: '150px' }}
            >
              <div style={{ textAlign: 'center', color: '#fff' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: '600' }}>Your Profile</div>
                <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '0.5rem' }}>
                  {equippedProfile ? equippedProfile.name : 'Default Theme'}
                </div>
              </div>
            </CosmeticProfile>
          </PreviewCard>
          
          <PreviewCard>
            <h4>Calling Card</h4>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
              <CosmeticCallingCard 
                cosmetic={equippedCallingCard}
                title={currentUser?.displayName || 'Your Name'}
                content="Your personalized calling card"
                style={{ maxWidth: '250px' }}
              />
            </div>
          </PreviewCard>
          
          <PreviewCard>
            <h4>Leaderboard</h4>
            <MockLeaderboard>
              <div className="leaderboard-entry">
                <span className="rank" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  5
                  {equippedFlair && (
                    <CosmeticFlair 
                      cosmetic={equippedFlair}
                      size="1rem"
                      style={{ marginLeft: '4px' }}
                    />
                  )}
                </span>
                <span className="username">{currentUser?.displayName || 'Your Name'}</span>
                <span className="stats">1,250 pts</span>
              </div>
            </MockLeaderboard>
          </PreviewCard>
        </PreviewGrid>
      </PreviewSection>
    );
  };

  // Debug function to check Golden Crown qualification
  const debugGoldenCrownOwnership = async () => {
    if (!currentUser) return;
    
    setActionLoading('debug_golden_crown');
    try {
      const qualification = await ownsOrQualifiesForCosmetic('nameplate_gold');
      console.log('[DEBUG] Golden Crown qualification result:', qualification);
      
      setLeaderboardDebug({
        owns: qualification.owns,
        source: qualification.source,
        position: qualification.position,
        userId: currentUser.uid,
        timestamp: Date.now()
      });
      
      // If user qualifies but doesn't own it, offer to fix it
      if (qualification.owns && qualification.source === 'leaderboard_qualified' && !ownsCosmetic('nameplate_gold')) {
        const shouldFix = window.confirm(
          ` GOLDEN CROWN NAMEPLATE DEBUG RESULT:\n\n` +
          ` You qualify for the Golden Crown nameplate!\n` +
          ` Your position: #${qualification.position} on the leaderboard\n` +
          ` But you don't have it in your owned cosmetics\n\n` +
          `Would you like to trigger a manual fix? This will call the server to update your nameplate ownership.`
        );
        
        if (shouldFix) {
          await triggerManualNameplateUpdate();
        }
      } else if (qualification.owns && qualification.source === 'owned') {
        alert(` Golden Crown nameplate ownership is working correctly!\n\n` +
              `You own the nameplate and it should be available to equip.`);
      } else {
        alert(` You don't currently qualify for the Golden Crown nameplate.\n\n` +
              `Reason: ${qualification.source}\n` +
              `You need to be in the top 10 players by total earnings to unlock this exclusive nameplate.`);
      }
    } catch (error) {
      console.error('[DEBUG] Error checking Golden Crown ownership:', error);
      alert(` Error checking nameplate ownership: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Function to manually trigger nameplate update
  const triggerManualNameplateUpdate = async () => {
    try {
      setActionLoading('manual_update');
      console.log('[MANUAL UPDATE] Starting manual nameplate update...');
      
      // Call the Firebase function to update nameplates
      const updateLeaderboardNameplates = httpsCallable(functions, 'updateLeaderboardNameplates');
      console.log('[MANUAL UPDATE] Calling Firebase function...');
      
      const response = await updateLeaderboardNameplates({});
      console.log('[MANUAL UPDATE] Firebase function response:', response);
      
      if (response.data && response.data.success) {
        const result = response.data;
        console.log('[MANUAL UPDATE] Success:', result);
        alert(` Manual nameplate update completed successfully!\n\n` +
              ` Top 10 players: ${result.top10Players?.length || 0}\n` +
              ` Users gained nameplate: ${result.usersGainedNameplate?.length || 0}\n` +
              ` Users lost nameplate: ${result.usersLostNameplate?.length || 0}\n\n` +
              `Please refresh the page to see the updated ownership.`);
        // Refresh the page after a short delay
        setTimeout(() => window.location.reload(), 2000);
      } else {
        console.error('[MANUAL UPDATE] Function returned no success:', response);
        throw new Error(response.data?.message || 'Update failed - no success response');
      }
    } catch (error) {
      console.error('[MANUAL UPDATE] Full error details:', error);
      console.error('[MANUAL UPDATE] Error name:', error.name);
      console.error('[MANUAL UPDATE] Error code:', error.code);
      console.error('[MANUAL UPDATE] Error message:', error.message);
      
      let errorMessage = error.message;
      
      // Handle specific Firebase errors
      if (error.code === 'functions/not-found') {
        errorMessage = 'The updateLeaderboardNameplates function was not found. It may not be deployed yet.';
      } else if (error.code === 'functions/permission-denied') {
        errorMessage = 'Permission denied. You may not have access to call this function.';
      } else if (error.code === 'functions/unauthenticated') {
        errorMessage = 'Authentication required. Please make sure you are logged in.';
      } else if (error.code === 'functions/internal') {
        errorMessage = 'Internal server error. The function may have encountered an issue.';
      } else if (error.code === 'functions/deadline-exceeded') {
        errorMessage = 'Function timed out. The nameplate update may be taking too long.';
      }
      
      alert(` Failed to trigger manual update: ${errorMessage}\n\nTechnical details: ${error.code || 'unknown'}\n\nPlease try using the Admin Dashboard to manually update Golden Crown nameplates, or contact support if the issue persists.`);
    } finally {
      setActionLoading(null);
    }
  };

  // Verification function to check nameplate system health
  const verifyNameplateSystem = async () => {
    try {
      setActionLoading('verify_system');
      console.log('[VERIFY SYSTEM] Starting nameplate system verification...');
      
      const verifyNameplateSystemFunction = httpsCallable(functions, 'verifyNameplateSystem');
      const response = await verifyNameplateSystemFunction({ autoFix: true });
      
      console.log('[VERIFY SYSTEM] Verification results:', response.data);
      
      if (response.data && response.data.success) {
        const results = response.data;
        let message = ` Nameplate System Verification Results:\n\n`;
        message += ` Top 10 Players: ${results.top10Players?.length || 0}\n`;
        message += ` Users with Golden Crown: ${results.usersWithGoldenCrown}\n`;
        message += ` Users with Crown Equipped: ${results.usersWithGoldenCrownEquipped}\n`;
        message += ` Violations Found: ${results.violationsFound}\n`;
        message += ` Missing Nameplates: ${results.missingNameplates}\n\n`;
        
        if (results.systemHealthy) {
          message += ` SYSTEM HEALTHY - All nameplates are correctly assigned!`;
        } else {
          message += ` ISSUES DETECTED - Auto-fix was applied.`;
          if (results.autoFixApplied) {
            message += `\n\n Auto-fix result: ${results.updateResult?.success ? 'SUCCESS' : 'FAILED'}`;
          }
        }
        
        message += `\n\nVerified at: ${new Date(results.timestamp).toLocaleTimeString()}`;
        
        alert(message);
      } else {
        throw new Error('Verification failed - no success response');
      }
    } catch (error) {
      console.error('[VERIFY SYSTEM] Error:', error);
      alert(` Nameplate system verification failed: ${error.message}\n\nError code: ${error.code || 'unknown'}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Test function to diagnose nameplate system issues
  const testNameplateSystem = async () => {
    try {
      setActionLoading('test_system');
      console.log('[TEST SYSTEM] Starting nameplate system test...');
      
      const testNameplateSystemFunction = httpsCallable(functions, 'testNameplateSystem');
      const response = await testNameplateSystemFunction({});
      
      console.log('[TEST SYSTEM] Test results:', response.data);
      
      if (response.data && response.data.success) {
        const results = response.data;
        alert(` Nameplate System Test Results:\n\n` +
              ` UserStats: ${results.userStatsCount} users\n` +
              ` Top 10 Players: ${results.top10Count}\n` +
              ` Users with Cosmetics: ${results.userCosmeticsCount}\n` +
              ` Golden Crown Owners: ${results.goldenCrownOwners?.length || 0}\n\n` +
              `Test completed at: ${new Date(results.timestamp).toLocaleTimeString()}`);
      } else {
        throw new Error('Test failed - no success response');
      }
    } catch (error) {
      console.error('[TEST SYSTEM] Error:', error);
      alert(` Nameplate system test failed: ${error.message}\n\nError code: ${error.code || 'unknown'}`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <CustomizationContainer>
        <LoadingSpinner>
          <div className="spinner"></div>
        </LoadingSpinner>
      </CustomizationContainer>
    );
  }

  const availableCosmetics = getAvailableCosmeticsByType(getCategoryDataKey(activeCategory));

  return (
    <CustomizationContainer>
      <Header>
        <h1> COSMETIC CUSTOMIZATION</h1>
        <p>Customize your appearance and show off your style</p>
      </Header>

      <ContentContainer>
        <CategoryTabs>
          {categories.map(category => (
            <CategoryTab
              key={category.id}
              $active={activeCategory === category.id}
              onClick={() => setActiveCategory(category.id)}
            >
              <span className="icon">{category.icon}</span>
              {category.name}
            </CategoryTab>
          ))}
        </CategoryTabs>

        {renderPreview()}

        <SettingsSection>
          <h3> Display Settings</h3>
          <SettingRow>
            <div className="setting-info">
              <div className="setting-title">Cosmetic Brightness</div>
              <div className="setting-description">
                Adjust the brightness of cosmetic effects to reduce eye strain
              </div>
            </div>
            <div className="setting-control">
              <BrightnessSlider
                type="range"
                min="30"
                max="100"
                value={cosmeticSettings.brightness}
                onChange={(e) => updateCosmeticSettings({ brightness: parseInt(e.target.value) })}
              />
              <BrightnessValue>{cosmeticSettings.brightness}%</BrightnessValue>
            </div>
          </SettingRow>
          
          <SettingRow>
            <div className="setting-info">
              <div className="setting-title">Animations</div>
              <div className="setting-description">
                Enable or disable cosmetic animations for better performance
              </div>
            </div>
            <div className="setting-control">
              <ToggleSwitch>
                <input
                  type="checkbox"
                  checked={cosmeticSettings.showAnimations}
                  onChange={(e) => updateCosmeticSettings({ showAnimations: e.target.checked })}
                />
                <span className="slider"></span>
              </ToggleSwitch>
            </div>
          </SettingRow>
          
          <SettingRow>
            <div className="setting-info">
              <div className="setting-title">Disable All Cosmetics</div>
              <div className="setting-description">
                Turn off all cosmetic effects for minimal visual distraction
              </div>
            </div>
            <div className="setting-control">
              <ToggleSwitch>
                <input
                  type="checkbox"
                  checked={cosmeticSettings.globalDisable}
                  onChange={(e) => updateCosmeticSettings({ globalDisable: e.target.checked })}
                />
                <span className="slider"></span>
              </ToggleSwitch>
            </div>
          </SettingRow>
        </SettingsSection>

        <CosmeticsGrid>
          {availableCosmetics.map(cosmetic => {
            const owned = ownsCosmetic(cosmetic.id);
            const equipped = isCosmeticEquipped(cosmetic.id);
            const rarity = getRarityInfo(cosmetic.rarity);
            const isLoading = actionLoading === cosmetic.id;
            const isGoldenCrown = cosmetic.id === 'nameplate_gold';

            return (
              <CosmeticCard
                key={cosmetic.id}
                $owned={owned}
                $equipped={equipped}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CosmeticHeader $rarityColor={rarity.color}>
                  <span className="cosmetic-icon">{cosmetic.icon}</span>
                  <h4>{cosmetic.name}</h4>
                  <span className="rarity">{rarity.name}</span>
                </CosmeticHeader>
                
                <CosmeticBody>
                  <div className="description">{cosmetic.description}</div>
                  <div className="unlock-method">
                    {getUnlockMethodText(cosmetic.unlockMethod)}
                  </div>
                  
                  <ActionButton
                    $owned={owned}
                    $equipped={equipped}
                    disabled={!owned || isLoading}
                    onClick={() => owned && handleCosmeticAction(cosmetic)}
                  >
                    {isLoading ? 'Loading...' : 
                     !owned ? (isGoldenCrown ? 'Not Qualified / Not Owned' : 'Not Owned') :
                     equipped ? 'Unequip' : 'Equip'}
                  </ActionButton>
                </CosmeticBody>
              </CosmeticCard>
            );
          })}
        </CosmeticsGrid>
      </ContentContainer>
    </CustomizationContainer>
  );
};

export default CosmeticCustomization; 