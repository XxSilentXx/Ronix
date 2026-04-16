import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { db, functions } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useAuth } from '../contexts/AuthContext';
import { useShop } from '../contexts/ShopContext';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.6);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalContent = styled.div`
  background: #1a1a2e;
  border-radius: 18px;
  padding: 2.5rem 2rem 2rem 2rem;
  min-width: 350px;
  max-width: 95vw;
  box-shadow: 0 8px 32px rgba(79, 172, 254, 0.25);
  color: #fff;
  position: relative;
`;

const Title = styled.h2`
  font-size: 2rem;
  margin-bottom: 1rem;
  background: linear-gradient(90deg, #4facfe 0%, #ff61e6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Description = styled.p`
  color: #b8c1ec;
  margin-bottom: 1.5rem;
`;

const Price = styled.div`
  font-size: 1.3rem;
  font-weight: 700;
  color: #4facfe;
  margin-bottom: 1.5rem;
`;

const PurchaseButton = styled.button`
  background: linear-gradient(90deg, #4facfe 0%, #ff61e6 100%);
  color: #fff;
  border: none;
  padding: 0.9rem 2rem;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 1.5rem;
  width: 100%;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(79, 172, 254, 0.4);
  }
  &:disabled {
    background: rgba(255,255,255,0.1);
    color: #aaa;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: #fff;
  font-size: 2rem;
  cursor: pointer;
  opacity: 0.7;
  &:hover { opacity: 1; }
`;

const ErrorMsg = styled.div`
  color: #ff6b6b;
  margin-top: 1rem;
  font-weight: 600;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 18px;
  background: #23234a;
  border-radius: 8px;
  margin: 1.5rem 0 1rem 0;
  overflow: hidden;
`;
const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #4facfe 0%, #ff61e6 100%);
  width: ${props => props.percent || 0}%;
  transition: width 0.4s cubic-bezier(.4,2,.3,1);
`;
const TierRow = styled.div`
  display: flex;
  align-items: center;
  background: #23234a;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  padding: 0.7rem 1rem;
  gap: 1.2rem;
  opacity: ${props => props.locked ? 0.5 : 1};
  border: 2px solid ${props => props.claimed ? '#51cf66' : props.claimable ? '#FFD700' : 'transparent'};
`;
const TierXp = styled.div`
  font-weight: 700;
  color: #4facfe;
  min-width: 70px;
`;
const TierReward = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.7rem;
`;
const ClaimButton = styled.button`
  background: ${props => props.claimed ? '#51cf66' : props.claimable ? 'linear-gradient(90deg, #FFD700 0%, #ff61e6 100%)' : '#444'};
  color: #fff;
  border: none;
  padding: 0.5rem 1.2rem;
  border-radius: 6px;
  font-weight: 700;
  cursor: ${props => props.claimable ? 'pointer' : 'not-allowed'};
  opacity: ${props => props.claimed ? 0.7 : 1};
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

const BattlePassModal = ({ isOpen, onClose, onPurchase, loading, error }) => {
  const { currentUser } = useAuth();
  const [passConfig, setPassConfig] = useState(null);
  const [userPass, setUserPass] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [claiming, setClaiming] = useState(null);
  const [testMsg, setTestMsg] = useState(null);
  const { refreshUserInventory } = useShop();

  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen, currentUser]);

  // Claim reward handler (calls backend function)
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
      if (refreshUserInventory) {
        await refreshUserInventory();
      }
    } catch (e) {
      setFetchError(e.message || 'Failed to claim reward');
    } finally {
      setClaiming(null);
    }
  };

  const handleTestXp = async () => {
    setTestMsg(null);
    try {
      const addBattlePassXp = httpsCallable(functions, 'addBattlePassXp');
      await addBattlePassXp({ xp: 1000 });
      setTestMsg(' Added 100 XP for testing!');
      // Refresh user pass after XP add
      if (currentUser) {
        const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
        setUserPass(userSnap.exists() ? userSnap.data().battlepass || null : null);
      }
    } catch (e) {
      setTestMsg(' Failed to add XP: ' + (e.message || 'Unknown error'));
    }
    setTimeout(() => setTestMsg(null), 2500);
  };

  if (!isOpen) return null;
  return (
    <ModalOverlay>
      <ModalContent>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        <Title>Ronix Pass</Title>
        <Description>
          Unlock 14 tiers of rewards for 30 days. Earn XP to claim exclusive items!<br/>
          <span style={{ color: '#FFD700', fontWeight: 600 }}>Total Value: $38+</span>
        </Description>
        <Price>4.99 <span style={{ fontSize: '1rem', color: '#b8c1ec' }}>Coins / 30 Days</span></Price>
        {/* TEST XP BUTTON - only show if logged in and has battle pass */}
        {currentUser && userPass && userPass.isActive && (
          <TestButton onClick={handleTestXp}>+100 XP (Test)</TestButton>
        )}
        {testMsg && <div style={{ color: '#FFD700', fontWeight: 600, marginBottom: 8 }}>{testMsg}</div>}
        {fetching ? (
          <div style={{ margin: '2rem 0', textAlign: 'center', color: '#b8c1ec' }}>Loading battle pass...</div>
        ) : fetchError ? (
          <ErrorMsg>{fetchError}</ErrorMsg>
        ) : passConfig && userPass ? (
          <>
            <div style={{ marginBottom: 8, color: '#b8c1ec', fontWeight: 600 }}>
              Progress: <span style={{ color: '#FFD700' }}>{userPass.xp || 0}</span> / {passConfig.xpCap} XP
            </div>
            <ProgressBar>
              <ProgressFill percent={Math.min(100, Math.round(((userPass.xp || 0) / (passConfig.xpCap || 1)) * 100))} />
            </ProgressBar>
            <div style={{ maxHeight: 320, overflowY: 'auto', marginBottom: 12 }}>
              {passConfig.tiers && passConfig.tiers.map((tier, idx) => {
                const claimed = userPass.claimedTiers && userPass.claimedTiers.includes(idx);
                const claimable = !claimed && (userPass.xp || 0) >= tier.xp;
                const locked = (userPass.xp || 0) < tier.xp;
                return (
                  <TierRow key={idx} claimed={claimed} claimable={claimable} locked={locked}>
                    <TierXp>{tier.xp} XP</TierXp>
                    <TierReward>
                      {tier.reward.icon && <span style={{ fontSize: 22 }}>{tier.reward.icon}</span>}
                      <span>{tier.reward.title || tier.reward.id}</span>
                      {tier.reward.amount && tier.reward.amount > 1 && (
                        <span style={{ color: '#FFD700', fontWeight: 700 }}>x{tier.reward.amount}</span>
                      )}
                    </TierReward>
                    {claimed ? (
                      <ClaimButton claimed disabled>Claimed</ClaimButton>
                    ) : claimable ? (
                      <ClaimButton claimable onClick={() => handleClaim(idx)} disabled={claiming === idx}>{claiming === idx ? 'Claiming...' : 'Claim'}</ClaimButton>
                    ) : (
                      <ClaimButton disabled>Locked</ClaimButton>
                    )}
                  </TierRow>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ margin: '2rem 0', textAlign: 'center', color: '#b8c1ec' }}>
            {currentUser ? 'You have not purchased the Battle Pass yet.' : 'Log in to view your Battle Pass progress.'}
          </div>
        )}
        <PurchaseButton 
          onClick={onPurchase} 
          disabled={
            loading || 
            (userPass && userPass.isActive && userPass.expiresAt && new Date(userPass.expiresAt.toDate ? userPass.expiresAt.toDate() : userPass.expiresAt) > new Date())
          }
        >
          {loading
            ? 'Purchasing...'
            : (userPass && userPass.isActive && userPass.expiresAt && new Date(userPass.expiresAt.toDate ? userPass.expiresAt.toDate() : userPass.expiresAt) > new Date())
              ? 'Active'
              : 'Purchase Pass'}
        </PurchaseButton>
        {error && <ErrorMsg>{error}</ErrorMsg>}
      </ModalContent>
    </ModalOverlay>
  );
};

export default BattlePassModal; 