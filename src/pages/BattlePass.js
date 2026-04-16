import React, { useEffect, useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { db, functions } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useAuth } from '../contexts/AuthContext';
import { useShop } from '../contexts/ShopContext';
import cosmeticData, { findCosmeticById, getRarityInfo } from '../data/cosmeticData';

// Animations MUST be defined before any styled-components that use them
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(30px) scale(0.98); }
  to { opacity: 1; transform: none; }
`;
const glowPulse = keyframes`
  0% { box-shadow: 0 0 16px 4px #FFD70055; }
  50% { box-shadow: 0 0 32px 8px #ff61e655; }
  100% { box-shadow: 0 0 16px 4px #FFD70055; }
`;
const animatedGradient = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const PageContainer = styled.div`
  min-height: 100vh;
  color: #fff;
  padding: 0;
  position: relative;
  background: #131124;
  width: 100%;
  display: flex;
  flex-direction: column;
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; height: 180px;
    background: none;
    z-index: 1;
    pointer-events: none;
  }
  &::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0; height: 160px;
    background: none;
    z-index: 1;
    pointer-events: none;
  }
`;
const Header = styled.div`
  text-align: center;
  padding: 3rem 2rem 1.5rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;
const Title = styled.h1`
  font-size: 2.8rem;
  font-weight: 900;
  background: linear-gradient(90deg, #4facfe 0%, #ff61e6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 0.5rem;
`;
const SubTitle = styled.div`
  color: #b8c1ec;
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
`;
const Price = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #FFD700;
  margin-bottom: 1.5rem;
`;
const TrackContainer = styled.div`
  display: flex;
  overflow-x: auto;
  gap: 2rem;
  padding: 2rem;
  margin: 0 auto;
  width: 100%;
  max-width: calc(100vw - 40px);
  scrollbar-width: thin;
  scrollbar-color: #4facfe #23234a;
  justify-content: flex-start;
  
  &::-webkit-scrollbar {
    height: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #23234a;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: linear-gradient(90deg, #4facfe 0%, #ff61e6 100%);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(90deg, #ff61e6 0%, #4facfe 100%);
  }
`;
const TierCard = styled.div`
  min-width: 200px;
  flex-shrink: 0;
  background: #23234a;
  border-radius: 18px;
  box-shadow: 0 4px 24px rgba(79, 172, 254, 0.12);
  border: 3px solid ${p => p.claimed ? '#51cf66' : p.claimable ? '#FFD700' : 'transparent'};
  opacity: ${p => p.locked ? 0.5 : 1};
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.2rem 1rem 1.5rem 1rem;
  position: relative;
  transition: box-shadow 0.2s, border 0.2s, opacity 0.2s;
  cursor: pointer;
  animation: ${fadeIn} 0.7s cubic-bezier(.4,2,.3,1);
  ${p => p.claimable && css`
    animation: ${glowPulse} 1.5s infinite alternate, ${fadeIn} 0.7s;
  `}
  &:hover {
    box-shadow: 0 8px 32px #4facfe55;
    border-color: #ff61e6;
    z-index: 2;
  }
`;
const TierNumber = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  color: #4facfe;
  margin-bottom: 0.3rem;
  align-self: flex-start;
  z-index: 2;
`;
const TierXp = styled.div`
  font-size: 1rem;
  color: #b8c1ec;
  margin-bottom: 0.7rem;
`;
const RewardIcon = styled.div`
  font-size: 2.2rem;
  margin-bottom: 0.5rem;
`;
const RewardTitle = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 0.3rem;
`;
const RewardDesc = styled.div`
  font-size: 0.95rem;
  color: #b8c1ec;
  text-align: center;
  margin: 0.5rem 0 0.5rem 0;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
`;
const StatusBadge = styled.div`
  position: absolute;
  top: 0.7rem;
  right: 0.7rem;
  background: ${p => p.claimed ? '#51cf66' : p.claimable ? 'linear-gradient(90deg, #FFD700 0%, #ff61e6 100%)' : '#444'};
  color: #fff;
  font-size: 0.9rem;
  font-weight: 700;
  border-radius: 6px;
  padding: 0.2rem 0.7rem;
  box-shadow: 0 2px 8px #0002;
  z-index: 3;
`;
const ProgressBarWrapper = styled.div`
  width: 100%;
  margin: 1.5rem 0 1rem 0;
  padding: 0 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
`;
const ProgressBarLabel = styled.div`
  color: #b8c1ec;
  font-size: 1.08rem;
  font-weight: 700;
  margin-bottom: 0.3rem;
`;
const ProgressBar = styled.div`
  width: 90vw;
  max-width: 1100px;
  height: 22px;
  background: #23234a;
  border-radius: 12px;
  margin: 0 auto;
  overflow: visible;
  position: relative;
  box-shadow: 0 0 16px #4facfe22;
  border: 2px solid #4facfe55;
`;
const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #4facfe 0%, #ff61e6 100%);
  width: ${p => p.percent || 0}%;
  border-radius: 12px;
  transition: width 0.7s cubic-bezier(.4,2,.3,1);
  position: absolute;
  left: 0; top: 0;
`;
const TierMarker = styled.div`
  position: absolute;
  top: -7px;
  width: 14px;
  height: 14px;
  background: ${p => p.claimed ? '#51cf66' : p.claimable ? '#FFD700' : '#4facfe'};
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 8px #4facfe55;
  cursor: pointer;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover > span {
    opacity: 1;
    pointer-events: auto;
  }
`;
const TierTooltip = styled.span`
  position: absolute;
  top: -38px;
  left: 50%;
  transform: translateX(-50%);
  background: #181a2b;
  color: #fff;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 0.98rem;
  font-weight: 700;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
  border: 2px solid #4facfe;
  box-shadow: 0 2px 12px 0 #4facfe55;
  z-index: 10;
`;
const NextTierLabel = styled.div`
  color: #FFD700;
  font-size: 1.05rem;
  font-weight: 700;
  margin-top: 0.2rem;
  text-align: right;
  width: 100%;
  max-width: 1100px;
`;
const PurchaseButton = styled.button`
  background: linear-gradient(90deg, #4facfe 0%, #ff61e6 100%);
  color: #fff;
  border: none;
  padding: 1.1rem 2.5rem;
  border-radius: 10px;
  font-size: 1.3rem;
  font-weight: 900;
  cursor: pointer;
  margin: 2rem auto 0 auto;
  display: block;
  box-shadow: 0 4px 16px #4facfe33;
  transition: all 0.2s;
  &:hover {
    transform: translateY(-2px) scale(1.03);
    box-shadow: 0 8px 32px #ff61e655;
  }
  &:disabled {
    background: #444;
    color: #aaa;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }
`;
const ErrorMsg = styled.div`
  color: #ff6b6b;
  margin-top: 1rem;
  font-weight: 600;
  text-align: center;
`;

// Modal styles
const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(24,26,43,0.85);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
`;
const ModalContent = styled.div`
  background: #23234a;
  border-radius: 18px;
  padding: 2.5rem 2rem 2rem 2rem;
  min-width: 320px;
  max-width: 95vw;
  box-shadow: 0 8px 48px #4facfe55;
  position: relative;
  text-align: center;
  animation: ${fadeIn} 0.5s;
  border: 3px solid ${p => p.rarityColor || '#4facfe'};
`;
const ModalIcon = styled.div`
  font-size: 3.5rem;
  margin-bottom: 1.2rem;
  filter: drop-shadow(0 0 16px ${p => p.rarityColor || '#4facfe'}55);
`;
const ModalTitle = styled.div`
  font-size: 1.5rem;
  font-weight: 900;
  color: #fff;
  margin-bottom: 0.5rem;
`;
const ModalRarity = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  color: ${p => p.rarityColor || '#fff'};
  margin-bottom: 0.7rem;
`;
const ModalDesc = styled.div`
  font-size: 1.08rem;
  color: #b8c1ec;
  margin-bottom: 1.2rem;
`;
const ModalClose = styled.button`
  position: absolute;
  top: 1rem; right: 1rem;
  background: none;
  border: none;
  color: #fff;
  font-size: 1.5rem;
  cursor: pointer;
`;

const TestButton = styled.button`
  background: #FFD700;
  color: #23234a;
  border: none;
  padding: 0.5rem 1.2rem;
  border-radius: 6px;
  font-weight: 700;
  margin-bottom: 1rem;
  margin-top: 0.5rem;
  cursor: pointer;
  transition: background 0.2s;
  &:hover { background: #ffe066; }
`;

const BattlePass = () => {
  const { currentUser } = useAuth();
  const [passConfig, setPassConfig] = useState(null);
  const [userPass, setUserPass] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [claiming, setClaiming] = useState(null);
  const { refreshUserInventory } = useShop();
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseError, setPurchaseError] = useState(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(null);
  const [preview, setPreview] = useState(null);
  const [testMsg, setTestMsg] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setFetching(true);
      setFetchError(null);
      try {
        const passSnap = await getDoc(doc(db, 'battlepass', 'current'));
        if (!passSnap.exists()) throw new Error('Battle Pass config not found');
        setPassConfig(passSnap.data());
        if (currentUser) {
          const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
          setUserPass(userSnap.exists() ? userSnap.data().battlepass || null : null);
        } else {
          setUserPass(null);
        }
      } catch (e) {
        setFetchError(e.message || 'Failed to load battle pass');
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, [currentUser]);

  const handlePurchase = async () => {
    setPurchaseLoading(true);
    setPurchaseError(null);
    setPurchaseSuccess(null);
    try {
      const purchaseBattlePass = httpsCallable(functions, 'purchaseBattlePass');
      await purchaseBattlePass();
      // Refresh user pass after purchase
      if (currentUser) {
        const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
        setUserPass(userSnap.exists() ? userSnap.data().battlepass || null : null);
      }
      setPurchaseSuccess('Battle Pass purchased and activated!');
    } catch (e) {
      setPurchaseError(e.message || 'Failed to purchase Battle Pass');
    } finally {
      setPurchaseLoading(false);
    }
  };

  const handleTestXp = async () => {
    setTestMsg(null);
    try {
      const addBattlePassXp = httpsCallable(functions, 'addBattlePassXp');
      await addBattlePassXp({ xp: 1000 });
      // Refresh user pass after XP add
      if (currentUser) {
        const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
        setUserPass(userSnap.exists() ? userSnap.data().battlepass || null : null);
      }
      setTestMsg('Added 100 XP!');
      setTimeout(() => setTestMsg(null), 2000);
    } catch (e) {
      setTestMsg('Failed to add XP');
      setTimeout(() => setTestMsg(null), 2000);
    }
  };

  // Helper to get reward details
  const getRewardDetails = (reward) => {
    if (reward.type === 'cosmetic') {
      const cosmetic = findCosmeticById(reward.id);
      return cosmetic ? {
        icon: cosmetic.icon || '',
        title: cosmetic.name,
        desc: cosmetic.description,
        rarity: cosmetic.rarity
      } : {
        icon: '',
        title: reward.title || reward.id,
        desc: '',
        rarity: 'common'
      };
    }
    // For coins, boosts, crates, etc.
    return {
      icon: reward.icon || '',
      title: reward.title,
      desc: reward.desc || '',
      rarity: reward.rarity || 'common'
    };
  };

  // Helper to get tier status
  const getTierStatus = (tierIndex) => {
    if (!userPass || !userPass.isActive) return 'locked';
    if (userPass.claimedTiers && userPass.claimedTiers.includes(tierIndex)) return 'claimed';
    if ((userPass.xp || 0) >= (passConfig.tiers[tierIndex].xp || 0)) return 'claimable';
    return 'locked';
  };

  // Claim logic
  const handleClaim = async (tierIndex) => {
    setClaiming(tierIndex);
    try {
      const claimBattlePassTier = httpsCallable(functions, 'claimBattlePassTier');
      await claimBattlePassTier({ tierIndex });
      // Refresh user pass after claim
      if (currentUser) {
        const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
        setUserPass(userSnap.exists() ? userSnap.data().battlepass || null : null);
      }
      // Refresh inventory after claim
      if (refreshUserInventory) await refreshUserInventory();
    } catch (e) {
      // Optionally show error
    } finally {
      setClaiming(null);
    }
  };

  // Progress bar percent
  const getXpPercent = () => {
    if (!userPass || !passConfig) return 0;
    const maxXp = passConfig.tiers[passConfig.tiers.length - 1].xp;
    return Math.min(100, Math.round(((userPass.xp || 0) / maxXp) * 100));
  };

  return (
    <PageContainer>
      <Header>
        <Title>Ronix Pass</Title>
        <SubTitle>Unlock 14 tiers of rewards for 30 days. Earn XP to claim exclusive items!</SubTitle>
        <Price>4.99 <span style={{ fontSize: '1rem', color: '#b8c1ec' }}>Coins / 30 Days</span></Price>
        {userPass && userPass.isActive && userPass.expiresAt && new Date(userPass.expiresAt.toDate ? userPass.expiresAt.toDate() : userPass.expiresAt) > new Date() ? (
          <PurchaseButton disabled>Active</PurchaseButton>
        ) : (
          <PurchaseButton onClick={handlePurchase} disabled={purchaseLoading}>
            {purchaseLoading ? 'Purchasing...' : 'Purchase Battle Pass'}
          </PurchaseButton>
        )}
        {purchaseError && <ErrorMsg>{purchaseError}</ErrorMsg>}
        {purchaseSuccess && <div style={{ color: '#51cf66', fontWeight: 700, marginTop: 8 }}>{purchaseSuccess}</div>}
      </Header>
      {currentUser && (
        <></>
      )}
      {fetching ? (
        <div style={{ textAlign: 'center', marginTop: 40 }}>Loading Battle Pass...</div>
      ) : fetchError ? (
        <ErrorMsg>{fetchError}</ErrorMsg>
      ) : passConfig && (
        <>
          {userPass && userPass.isActive && passConfig && (
            <ProgressBarWrapper>
              <ProgressBarLabel>
                Your Progress: <span style={{ color: '#FFD700' }}>{userPass.xp || 0}</span> / {passConfig.tiers[passConfig.tiers.length - 1].xp} XP
              </ProgressBarLabel>
              <ProgressBar>
                <ProgressFill percent={getXpPercent()} />
                {passConfig.tiers.map((tier, idx) => {
                  const percent = Math.min(100, (tier.xp / passConfig.tiers[passConfig.tiers.length - 1].xp) * 100);
                  const status = getTierStatus(idx);
                  return (
                    <TierMarker
                      key={idx}
                      style={{ left: `calc(${percent}% - 7px)` }}
                      claimed={status === 'claimed'}
                      claimable={status === 'claimable'}
                    >
                      <TierTooltip>
                        Tier {idx + 1}: {tier.xp} XP
                      </TierTooltip>
                    </TierMarker>
                  );
                })}
              </ProgressBar>
              {(() => {
                // Find next unclaimed tier
                const nextTier = passConfig.tiers.find((tier, idx) => (userPass.xp || 0) < tier.xp);
                if (nextTier) {
                  const xpNeeded = nextTier.xp - (userPass.xp || 0);
                  return (
                    <NextTierLabel>
                      Next Tier: <span style={{ color: '#4facfe', fontWeight: 900 }}>Tier {passConfig.tiers.findIndex(t => t === nextTier) + 1}</span> &mdash; Need <span style={{ color: '#FFD700' }}>{xpNeeded}</span> more XP
                    </NextTierLabel>
                  );
                } else {
                  return (
                    <NextTierLabel>All tiers unlocked!</NextTierLabel>
                  );
                }
              })()}
            </ProgressBarWrapper>
          )}
          <TrackContainer>
            {passConfig.tiers.map((tier, idx) => {
              const status = getTierStatus(idx);
              const reward = getRewardDetails(tier.reward);
              const rarityInfo = getRarityInfo(reward.rarity);
              return (
                <TierCard key={idx} claimed={status === 'claimed'} claimable={status === 'claimable'} locked={status === 'locked'}
                  onClick={() => setPreview({ ...reward, tier: idx + 1, xp: tier.xp })}>
                  <TierNumber>Tier {idx + 1}</TierNumber>
                  <StatusBadge claimed={status === 'claimed'} claimable={status === 'claimable'}>{
                    status === 'claimed' ? 'Claimed' : status === 'claimable' ? 'Claim' : 'Locked'
                  }</StatusBadge>
                  <TierXp>{tier.xp} XP</TierXp>
                  <RewardIcon>{reward.icon === 'coin_svg' ? (
                    <img src="/assets/token-logo.png" alt="Coin" style={{ width: 36, height: 36, verticalAlign: 'middle' }} onError={e => { e.target.onerror = null; e.target.style.display = 'none'; e.target.parentNode.append(''); }} />
                  ) : (
                    reward.icon
                  )}</RewardIcon>
                  <RewardTitle>{reward.title}</RewardTitle>
                  <RewardDesc>{reward.desc}</RewardDesc>
                  <div style={{ flex: 1 }} />
                  {status === 'claimable' && (
                    <PurchaseButton style={{marginTop:'auto',padding:'0.5rem 1.2rem',fontSize:'1rem',width:'100%'}} onClick={e => { e.stopPropagation(); handleClaim(idx); }} disabled={claiming === idx}>
                      {claiming === idx ? 'Claiming...' : 'Claim'}
                    </PurchaseButton>
                  )}
                </TierCard>
              );
            })}
          </TrackContainer>
          {preview && (
            <ModalOverlay onClick={() => setPreview(null)}>
              <ModalContent rarityColor={getRarityInfo(preview.rarity).color} onClick={e => e.stopPropagation()}>
                <ModalClose onClick={() => setPreview(null)}>&times;</ModalClose>
                <ModalIcon rarityColor={getRarityInfo(preview.rarity).color}>{preview.icon === 'coin_svg' ? (
                  <img src="/assets/token-logo.png" alt="Coin" style={{ width: 56, height: 56, verticalAlign: 'middle' }} onError={e => { e.target.onerror = null; e.target.style.display = 'none'; e.target.parentNode.append(''); }} />
                ) : (
                  preview.icon
                )}</ModalIcon>
                <ModalTitle>{preview.title}</ModalTitle>
                <ModalRarity rarityColor={getRarityInfo(preview.rarity).color}>{preview.rarity ? preview.rarity.charAt(0).toUpperCase() + preview.rarity.slice(1) : ''}</ModalRarity>
                <ModalDesc>{preview.desc}</ModalDesc>
                <div style={{ color: '#4facfe', fontWeight: 700, marginTop: 8 }}>Tier {preview.tier} &bull; {preview.xp} XP</div>
              </ModalContent>
            </ModalOverlay>
          )}
        </>
      )}
    </PageContainer>
  );
};

export default BattlePass; 