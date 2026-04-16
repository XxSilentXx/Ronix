import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import CosmeticCallingCard from '../components/CosmeticCallingCard';
import { findCosmeticById } from '../data/cosmeticData';
import { doc, getDoc, onSnapshot, collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getFunctions, httpsCallable } from 'firebase/functions';

const shimmer = keyframes`
  0% { filter: brightness(1) drop-shadow(0 0 8px #4facfe88); }
  50% { filter: brightness(1.3) drop-shadow(0 0 16px #ff61e6cc); }
  100% { filter: brightness(1) drop-shadow(0 0 8px #4facfe88); }
`;

const neonGlow = `0 0 12px #A259F7, 0 0 24px #00FFD0, 0 0 32px #FF61E6`;

const ClaimedBadge = styled.div`
  display: inline-block;
  background: linear-gradient(90deg, #4facfe 0%, #ff61e6 100%);
  color: #fff;
  font-weight: 700;
  font-size: 0.9rem;
  border-radius: 10px;
  padding: 0.3rem 1.1rem;
  margin-top: 0.5rem;
  box-shadow: 0 0 12px #4facfe88;
  letter-spacing: 0.04em;
`;

const Tooltip = styled.div`
  position: absolute;
  left: 50%;
  bottom: 110%;
  transform: translateX(-50%);
  background: #23234a;
  color: #fff;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  white-space: nowrap;
  box-shadow: 0 4px 24px #4facfe55;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
  z-index: 10;
`;

const AchievementsContainer = styled.div`
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
    max-width: 600px;
    margin: 0 auto;
  }
`;

const ContentContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  position: relative;
  z-index: 1;
`;

const AchievementsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

const AchievementCard = styled(motion.div)`
  background: rgba(22, 33, 62, 0.85);
  border-radius: 16px;
  overflow: hidden;
  border: 2px solid
    ${({ $unlocked, $claimable, $claimed }) =>
      $claimed
        ? '#00FFD0'
        : $claimable
        ? '#A259F7'
        : $unlocked
        ? '#4facfe'
        : 'rgba(255,255,255,0.08)'};
  box-shadow: 0 8px 24px rgba(0,0,0,0.22), ${({ $unlocked, $claimable }) =>
    $claimable
      ? neonGlow
      : $unlocked
      ? '0 0 16px #4facfe88'
      : 'none'};
  transition: all 0.3s cubic-bezier(.4,2,.3,1);
  position: relative;
  filter: ${({ $locked }) =>
    $locked ? 'grayscale(0.7) brightness(0.7)' : 'none'};
  opacity: ${({ $locked }) => ($locked ? 0.6 : 1)};
  pointer-events: ${({ $locked }) => ($locked ? 'auto' : 'auto')};
  &:hover {
    transform: translateY(-5px) scale(1.01);
    box-shadow: 0 12px 32px #4facfe55, ${({ $claimable }) =>
      $claimable ? neonGlow : ''};
      z-index: 2;
    }
`;

const AchievementHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  .achievement-icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    display: block;
  }
  
  h3 {
    font-size: 1.3rem;
    margin-bottom: 0.5rem;
    color: #fff;
  }
  
  .description {
    color: #b8c1ec;
    font-size: 0.9rem;
    line-height: 1.4;
  }
`;

const AchievementBody = styled.div`
  padding: 1.5rem;
`;

const ProgressSection = styled.div`
  margin-bottom: 1.5rem;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #4facfe 0%, #ff61e6 100%);
  width: ${props => props.$percentage}%;
  transition: width 0.3s ease;
`;

const ProgressText = styled.div`
  font-size: 0.8rem;
  color: #b8c1ec;
  text-align: center;
`;

const RewardSection = styled.div`
  .reward-label {
    font-size: 0.8rem;
    color: #4facfe;
    margin-bottom: 0.5rem;
    font-weight: 600;
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

const StatsOverview = styled.div`
  background: rgba(22, 33, 62, 0.8);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 3rem;
  border: 2px solid rgba(79, 172, 254, 0.3);
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
`;

const StatCard = styled.div`
  text-align: center;
  
  .stat-value {
    font-size: 2rem;
    font-weight: 900;
    background: linear-gradient(90deg, #4facfe 0%, #ff61e6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 0.5rem;
  }
  
  .stat-label {
    color: #b8c1ec;
    font-size: 0.9rem;
  }
`;

const Achievements = () => {
  const { currentUser } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [userAchievements, setUserAchievements] = useState(null);
  const [userCosmetics, setUserCosmetics] = useState(null);
  const [claiming, setClaiming] = useState({});
  const [claimMessage, setClaimMessage] = useState({});
  const [showTooltip, setShowTooltip] = useState(null);

  // Define achievement definitions (matching backend)
  const ACHIEVEMENT_DEFINITIONS = {
    achievement_rank_1: {
      id: 'achievement_rank_1',
      name: 'Rank #1 Player',
      description: 'Reach #1 on the leaderboard',
      cosmeticReward: 'card_royal_decree'
    },
    achievement_top_10: {
      id: 'achievement_top_10',
      name: 'Top 10 Player',
      description: 'Reach top 10 on the leaderboard',
      cosmeticReward: 'card_champions_honor'
    },
    achievement_top_1_percent: {
      id: 'achievement_top_1_percent',
      name: 'Top 1% Player',
      description: 'Be in the top 1% of earners',
      cosmeticReward: 'card_one_percent'
    },
    achievement_fire_badge: {
      id: 'achievement_fire_badge',
      name: '10 Total Wins',
      description: 'Win 10 total token matches',
      cosmeticReward: 'flair_fire'
    },
    achievement_phoenix_rising: {
      id: 'achievement_phoenix_rising',
      name: 'Phoenix Rising',
      description: 'Win 25 total token matches',
      cosmeticReward: 'card_phoenix_rising'
    },
    achievement_coin_collector: {
      id: 'achievement_coin_collector',
      name: '50 Coins Earned',
      description: 'Earn 50 total coins from matches',
      cosmeticReward: 'card_coin_collector'
    },
    achievement_tycoon: {
      id: 'achievement_tycoon',
      name: '200 Coins Earned',
      description: 'Earn 200+ total coins from matches',
      cosmeticReward: 'card_tycoon'
    },
    achievement_high_roller: {
      id: 'achievement_high_roller',
      name: 'High Roller',
      description: 'Win 10 matches of 5+ coins',
      cosmeticReward: 'card_high_roller'
    },
    achievement_veterans_edge: {
      id: 'achievement_veterans_edge',
      name: '100 matches Played',
      description: 'Play at least 100 total matches',
      cosmeticReward: 'card_veterans_edge'
    },
    achievement_snipers_mark: {
      id: 'achievement_snipers_mark',
      name: '25 Snipes Hit',
      description: 'Successfully hit 25 snipes',
      cosmeticReward: 'card_snipers_mark'
    },
    achievement_unbreakable: {
      id: 'achievement_unbreakable',
      name: 'Unbreakable',
      description: 'Go 5-0 in 1v1 matches without Wager Insurance',
      cosmeticReward: 'card_unbreakable'
    }
  };

  // Calculate achievement status when data changes
  const calculateAchievementStatus = async () => {
    try {
      const achievementList = [];
      // Use default values if data doesn't exist
      const stats = userStats || { matchesWon: 0, totalEarnings: 0, matchesPlayed: 0 };
      const achievements = userAchievements || { 
        unlockedAchievements: [], 
        highRollerWins: 0, 
        snipesHit: 0, 
        unbreakableWins: 0, 
        unbreakableAchieved: false 
      };
      const cosmetics = userCosmetics || { owned: [] };
      for (const [achievementId, achievement] of Object.entries(ACHIEVEMENT_DEFINITIONS)) {
        let isUnlocked = achievements.unlockedAchievements?.includes(achievementId) || false;
        let progress = 0;
        let maxProgress = 1;
        

        
        // Calculate progress regardless of unlock status to check if it should be unlocked
        switch (achievementId) {
          case 'achievement_fire_badge':
            progress = Math.min(stats.matchesWon || 0, 10);
            maxProgress = 10;
            break;
          case 'achievement_phoenix_rising':
            progress = Math.min(stats.matchesWon || 0, 25);
            maxProgress = 25;
            break;
          case 'achievement_coin_collector':
            progress = Math.min(stats.totalEarnings || 0, 50);
            maxProgress = 50;
            break;
          case 'achievement_tycoon':
            progress = Math.min(stats.totalEarnings || 0, 200);
            maxProgress = 200;
            break;
          case 'achievement_veterans_edge':
            progress = Math.min(stats.matchesPlayed || 0, 100);
            maxProgress = 100;
            break;
          case 'achievement_high_roller':
            progress = Math.min(achievements.highRollerWins || 0, 10);
            maxProgress = 10;
            break;
          case 'achievement_snipers_mark':
            progress = Math.min(achievements.snipesHit || 0, 25);
            maxProgress = 25;
            break;
          case 'achievement_unbreakable':
            progress = Math.min(achievements.unbreakableWins || 0, 5);
            maxProgress = 5;
            // Special case: if unbreakableAchieved is true, it's unlocked
            if (achievements.unbreakableAchieved) {
              isUnlocked = true;
              progress = maxProgress;
            }
            break;
          case 'achievement_rank_1':
            // Check if user is rank 1
            try {
              const leaderboardQuery = query(
                collection(db, 'userStats'),
                orderBy('totalEarnings', 'desc'),
                limit(1)
              );
              const snapshot = await getDocs(leaderboardQuery);
              if (!snapshot.empty && snapshot.docs[0].id === currentUser.uid) {
                progress = 1;
              }
            } catch (error) {
              console.error('Error checking rank 1:', error);
            }
            maxProgress = 1;
            break;
          case 'achievement_top_10':
            // Check if user is in top 10
            try {
              const leaderboardQuery = query(
                collection(db, 'userStats'),
                orderBy('totalEarnings', 'desc'),
                limit(10)
              );
              const snapshot = await getDocs(leaderboardQuery);
              const topPlayerIds = snapshot.docs.map(doc => doc.id);
              if (topPlayerIds.includes(currentUser.uid)) {
                progress = 1;
              }
            } catch (error) {
              console.error('Error checking top 10:', error);
            }
            maxProgress = 1;
            break;
          case 'achievement_top_1_percent':
            // Check if user is in top 1%
            try {
              const allPlayersQuery = query(
                collection(db, 'userStats'),
                where('totalEarnings', '>', 0)
              );
              const allPlayersSnapshot = await getDocs(allPlayersQuery);
              const totalPlayers = allPlayersSnapshot.size;
              
              if (totalPlayers >= 100) {
                const top1PercentCount = Math.max(1, Math.floor(totalPlayers * 0.01));
                const topPlayersQuery = query(
                  collection(db, 'userStats'),
                  orderBy('totalEarnings', 'desc'),
                  limit(top1PercentCount)
                );
                const topPlayersSnapshot = await getDocs(topPlayersQuery);
                const topPlayerIds = topPlayersSnapshot.docs.map(doc => doc.id);
                if (topPlayerIds.includes(currentUser.uid)) {
                  progress = 1;
                }
              }
            } catch (error) {
              console.error('Error checking top 1%:', error);
            }
            maxProgress = 1;
            break;
          default:
            progress = 0;
            maxProgress = 1;
        }
        
        // Auto-unlock achievement if progress is complete but not marked as unlocked
        if (!isUnlocked && progress >= maxProgress && maxProgress > 0) {
          isUnlocked = true;

        }
        

        
        achievementList.push({
          ...achievement,
          isUnlocked,
          progress,
          maxProgress,
          progressPercentage: maxProgress > 0 ? Math.round((progress / maxProgress) * 100) : 0
        });
      }
      

      setAchievements(achievementList);
      setError(null);
    } catch (err) {
      console.error('[ACHIEVEMENTS] Error calculating achievement status:', err);
      setError('Failed to load achievements. Please try again later.');
    }
  };

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }



    // Set up real-time listeners
    const unsubscribers = [];

    // Listen to user stats
    const userStatsRef = doc(db, 'userStats', currentUser.uid);
    const unsubscribeStats = onSnapshot(userStatsRef, (doc) => {
      if (doc.exists()) {

        setUserStats(doc.data());
      } else {

        setUserStats(null);
      }
    }, (error) => {
      console.error('[ACHIEVEMENTS] Error listening to user stats:', error);
    });
    unsubscribers.push(unsubscribeStats);

    // Listen to user achievements
    const userAchievementsRef = doc(db, 'userAchievements', currentUser.uid);
    const unsubscribeAchievements = onSnapshot(userAchievementsRef, (doc) => {
      if (doc.exists()) {

        setUserAchievements(doc.data());
      } else {

        setUserAchievements({
          userId: currentUser.uid,
          unlockedAchievements: [],
          highRollerWins: 0,
          snipesHit: 0,
          unbreakableWins: 0,
          unbreakableAchieved: false
        });
      }
    }, (error) => {
      console.error('[ACHIEVEMENTS] Error listening to user achievements:', error);
    });
    unsubscribers.push(unsubscribeAchievements);

    // Listen to user cosmetics
    const userCosmeticsRef = doc(db, 'userCosmetics', currentUser.uid);
    const unsubscribeCosmetics = onSnapshot(userCosmeticsRef, (doc) => {
      if (doc.exists()) {

        setUserCosmetics(doc.data());
      } else {

        setUserCosmetics({ owned: [] });
      }
    }, (error) => {
      console.error('[ACHIEVEMENTS] Error listening to user cosmetics:', error);
    });
    unsubscribers.push(unsubscribeCosmetics);

    setLoading(false);

    // Cleanup function
    return () => {

      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [currentUser]);

  useEffect(() => {
    // Don't wait for all data - calculate as soon as we have the user
    if (!currentUser) {
      return;
    }
    calculateAchievementStatus();
  }, [userStats, userAchievements, userCosmetics, currentUser]);

  const getAchievementIcon = (achievementId) => {
    const icons = {
      achievement_rank_1: '',
      achievement_top_10: '',
      achievement_top_1_percent: '',
      achievement_fire_badge: '',
      achievement_phoenix_rising: '',
      achievement_coin_collector: '',
      achievement_tycoon: '',
      achievement_high_roller: '',
      achievement_veterans_edge: '',
      achievement_snipers_mark: '',
      achievement_unbreakable: ''
    };
    return icons[achievementId] || '';
  };

  const unlockedCount = achievements.filter(a => a.isUnlocked).length;
  const totalCount = achievements.length;

  const handleClaim = async (achievement) => {
    setClaiming((prev) => ({ ...prev, [achievement.id]: true }));
    setClaimMessage((prev) => ({ ...prev, [achievement.id]: '' }));
    try {
      const functions = getFunctions();
      const claimAchievementReward = httpsCallable(functions, 'claimAchievementReward');
      const result = await claimAchievementReward({ achievementId: achievement.id });
      if (result.data.success) {
        setClaimMessage((prev) => ({ ...prev, [achievement.id]: 'Reward claimed!' }));
        await calculateAchievementStatus(); // Refresh data after claim
      } else {
        setClaimMessage((prev) => ({ ...prev, [achievement.id]: result.data.message || 'Already claimed.' }));
      }
    } catch (error) {
      setClaimMessage((prev) => ({ ...prev, [achievement.id]: error.message || 'Error claiming reward.' }));
    }
    setClaiming((prev) => ({ ...prev, [achievement.id]: false }));
  };

  if (!currentUser) {
    return (
      <AchievementsContainer>
        <Header>
          <h1>ACHIEVEMENTS</h1>
          <p>Please log in to view your achievements and calling card progress.</p>
        </Header>
      </AchievementsContainer>
    );
  }

  return (
    <AchievementsContainer>
      <Header>
        <h1>ACHIEVEMENTS</h1>
        <p>Unlock exclusive calling cards by completing challenges and reaching milestones!</p>
      </Header>

      <ContentContainer>
        <StatsOverview>
          <h2 style={{ textAlign: 'center', marginBottom: '1rem', color: '#fff' }}>
            Achievement Progress
          </h2>
          <StatsGrid>
            <StatCard>
              <div className="stat-value">{unlockedCount}/{totalCount}</div>
              <div className="stat-label">Achievements Unlocked</div>
            </StatCard>
            <StatCard>
              <div className="stat-value">
                {totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0}%
              </div>
              <div className="stat-label">Completion Rate</div>
            </StatCard>
            <StatCard>
              <div className="stat-value">
                {achievements.filter(a => a.cosmeticReward && a.isUnlocked).length}
              </div>
              <div className="stat-label">Calling Cards Earned</div>
            </StatCard>
          </StatsGrid>
        </StatsOverview>

        {loading ? (
          <LoadingSpinner>
            <div className="spinner"></div>
          </LoadingSpinner>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#ff6b6b' }}>
            <h3>Error Loading Achievements</h3>
            <p>{error}</p>
          </div>
        ) : achievements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#b8c1ec' }}>
            <h3>No Achievements Available</h3>
            <p>Start playing matches to unlock achievements!</p>
          </div>
        ) : (
          <AchievementsGrid>
            {achievements.map((achievement, index) => {
              const cosmetic = achievement.cosmeticReward ? findCosmeticById(achievement.cosmeticReward) : null;
              const isClaimed = cosmetic && userCosmetics && userCosmetics.owned.includes(cosmetic.id);
              const isClaimable = achievement.isUnlocked && !isClaimed;
              const isLocked = !achievement.isUnlocked;
              
              return (
                <AchievementCard
                  key={achievement.id}
                  $unlocked={achievement.isUnlocked}
                  $claimable={isClaimable}
                  $claimed={isClaimed}
                  $locked={isLocked}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  tabIndex={0}
                  aria-label={
                    isClaimed
                      ? `${achievement.name} (Claimed)`
                      : isClaimable
                      ? `${achievement.name} (Claimable)`
                      : isLocked
                      ? `${achievement.name} (Locked)`
                      : achievement.name
                  }
                  onMouseEnter={() => setShowTooltip(achievement.id)}
                  onMouseLeave={() => setShowTooltip(null)}
                  onFocus={() => setShowTooltip(achievement.id)}
                  onBlur={() => setShowTooltip(null)}
                  style={{ outline: isClaimable ? '2px solid #A259F7' : undefined }}
                >
                  <AchievementHeader>
                    <span className="achievement-icon">{getAchievementIcon(achievement.id)}</span>
                    <h3>{achievement.name}</h3>
                    <div className="description">{achievement.description}</div>
                  </AchievementHeader>
                  
                  <AchievementBody>
                    {isLocked && (
                        <ProgressSection>
                          <ProgressBar>
                          <ProgressFill $percentage={achievement.progressPercentage} style={{ background: '#23234a' }} />
                          </ProgressBar>
                        <ProgressText style={{ color: '#b8c1ec' }}>
                          {achievement.progress}/{achievement.maxProgress} ({achievement.progressPercentage}%)
                          </ProgressText>
                        </ProgressSection>
                    )}
                    
                    {cosmetic && userCosmetics && (
                      <div style={{ marginTop: '1rem', textAlign: 'center', position: 'relative' }}>
                        {isClaimed ? (
                          <ClaimedBadge role="status">CLAIMED</ClaimedBadge>
                        ) : (
                        <button
                          onClick={() => handleClaim(achievement)}
                            disabled={!isClaimable || claiming[achievement.id]}
                          style={{
                              background: isClaimable
                                ? 'linear-gradient(90deg, #A259F7 0%, #00FFD0 100%)'
                                : 'linear-gradient(90deg, #23234a 0%, #23234a 100%)',
                              color: isClaimable ? '#fff' : '#b8c1ec',
                            border: 'none',
                              padding: '0.6rem 2rem',
                              borderRadius: '10px',
                              fontWeight: 700,
                              fontSize: '1.1rem',
                              boxShadow: isClaimable ? neonGlow : 'none',
                              cursor: isClaimable && !claiming[achievement.id] ? 'pointer' : 'not-allowed',
                              outline: 'none',
                              position: 'relative',
                              marginBottom: '0.5rem',
                              marginTop: '0.2rem',
                              transition: 'all 0.2s',
                            }}
                            aria-label={
                              isClaimable
                                ? 'Click to claim your calling card'
                                : isLocked
                                ? 'Achievement locked'
                                : 'Already claimed'
                            }
                            onMouseEnter={() => setShowTooltip(achievement.id + '-btn')}
                            onMouseLeave={() => setShowTooltip(null)}
                            onFocus={() => setShowTooltip(achievement.id + '-btn')}
                            onBlur={() => setShowTooltip(null)}
                        >
                            {claiming[achievement.id]
                              ? 'Claiming...'
                              : isLocked
                            ? 'Incomplete'
                              : isClaimable
                              ? 'Claim Reward'
                              : 'CLAIMED'}
                            {/* Tooltip for button */}
                            {showTooltip === achievement.id + '-btn' && (
                              <Tooltip role="tooltip">Click to claim your calling card</Tooltip>
                            )}
                        </button>
                        )}
                        {/* Tooltip for card (if not claimable) */}
                        {showTooltip === achievement.id && !isClaimable && !isClaimed && (
                          <Tooltip role="tooltip">
                            {isLocked
                              ? 'Complete requirements to unlock this achievement.'
                              : 'You have already claimed this reward.'}
                          </Tooltip>
                        )}
                        {claimMessage[achievement.id] && !isClaimed && (
                          <div style={{ color: '#4facfe', marginTop: '0.5rem' }}>{claimMessage[achievement.id]}</div>
                        )}
                      </div>
                    )}
                    
                    {cosmetic && (
                      <RewardSection>
                        <div className="reward-label">Calling Card Reward:</div>
                        <CosmeticCallingCard 
                          cosmetic={cosmetic}
                          title={cosmetic.name}
                          content={achievement.isUnlocked ? 'Unlocked!' : 'Complete achievement to unlock'}
                          style={{ 
                            maxWidth: '100%',
                            opacity: achievement.isUnlocked ? 1 : 0.6,
                            filter: achievement.isUnlocked ? 'none' : 'grayscale(0.7) brightness(0.7)',
                            border: isClaimed ? '2px solid #00FFD0' : isClaimable ? '2px solid #A259F7' : '2px solid #23234a',
                            boxShadow: isClaimable ? neonGlow : 'none',
                            transition: 'all 0.2s',
                          }}
                        />
                      </RewardSection>
                    )}
                  </AchievementBody>
                </AchievementCard>
              );
            })}
          </AchievementsGrid>
        )}
      </ContentContainer>
    </AchievementsContainer>
  );
};

export default Achievements; 