import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';
import AdminReferralDashboard from '../components/AdminReferralDashboard';
import AdminEpicUsernameUpdater from '../components/AdminEpicUsernameUpdater';
import EpicUsernameTest from '../components/EpicUsernameTest';

const functions = getFunctions();

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
  padding: 2rem;
`;

const Header = styled.h1`
  font-size: 2.5rem;
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 2rem;
`;

const AdminCard = styled(Link)`
  display: block;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-decoration: none;
  color: #fff;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
    background: rgba(255, 255, 255, 0.08);
  }
`;

const CardTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: #4facfe;
`;

const CardDescription = styled.p`
  color: #b8c1ec;
  margin-bottom: 1rem;
`;

const AdminGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
`;

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [achievementCheckLoading, setAchievementCheckLoading] = useState(false);
  const [achievementCheckResult, setAchievementCheckResult] = useState(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [fixStatsLoading, setFixStatsLoading] = useState(false);
  const [fixStatsResult, setFixStatsResult] = useState(null);
  
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }
      
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists() && userDoc.data().isAdmin) {
          setIsAdmin(true);
        } else {
          navigate('/');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error checking admin status:', error);
        navigate('/');
      }
    };
    
    checkAdminStatus();
  }, [currentUser, navigate]);

  const handleTriggerAchievementCheck = async () => {
    setAchievementCheckLoading(true);
    setAchievementCheckResult(null);
    
    try {
      const triggerAchievementCheck = httpsCallable(functions, 'triggerAchievementCheckForAllUsers');
      const result = await triggerAchievementCheck();
      
      setAchievementCheckResult(result.data);
    } catch (error) {
      console.error('Error triggering achievement check:', error);
      setAchievementCheckResult({
        success: false,
        error: error.message
      });
    } finally {
      setAchievementCheckLoading(false);
    }
  };

  const handleDebugUserData = async () => {
    try {
      const debugUserAchievements = httpsCallable(functions, 'debugUserAchievements');
      const result = await debugUserAchievements({});

      alert('Debug request completed successfully.');
    } catch (error) {
      console.error('Error debugging user data:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleForceGrantCards = async () => {
    try {
      // First, let's see what cards the user currently has
      const debugUserAchievements = httpsCallable(functions, 'debugUserAchievements');
      await debugUserAchievements({});
      
      const cardIds = [
        'card_royal_decree',
        'card_tycoon', 
        'card_champions_honor',
        'card_coin_collector',
        'card_phoenix_rising',
        'card_snipers_mark',
        'card_high_roller',
        'card_unbreakable',
        'card_veterans_edge',
        'card_one_percent'
      ];
      
      const forceGrantCallingCards = httpsCallable(functions, 'forceGrantCallingCards');
      const result = await forceGrantCallingCards({ cardIds });
      
      if (result.data.addedCards.length > 0) {
        alert(` Granted ${result.data.addedCards.length} new calling cards: ${result.data.addedCards.join(', ')}`);
      } else {
        alert(` No new cards granted. You may already own all the cards being granted.\nTotal owned: ${result.data.totalOwnedCards}`);
      }
    } catch (error) {
      console.error('Error forcing grant:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleInitializeAchievements = async () => {
    try {
      const checkUserAchievements = httpsCallable(functions, 'checkUserAchievements');
      const result = await checkUserAchievements({});

      alert('Achievement document initialized! Check the achievements page.');
    } catch (error) {
      console.error('Error initializing achievements:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleTestAchievementSystem = async () => {
    try {
      // First try to get debug data
      const debugUserAchievements = httpsCallable(functions, 'debugUserAchievements');
      const debugResult = await debugUserAchievements({});
      
      // Then try to check achievements
      const checkUserAchievements = httpsCallable(functions, 'checkUserAchievements');
      const checkResult = await checkUserAchievements({});
      
      // Show summary in alert
      const summary = `
        Debug Data Retrieved: ${debugResult.data.success ? 'Yes' : 'No'}
        User Stats: ${debugResult.data.userStats ? 'Found' : 'Not Found'}
        User Achievements: ${debugResult.data.userAchievements ? 'Found' : 'Not Found'}
        User Cosmetics: ${debugResult.data.userCosmetics ? 'Found' : 'Not Found'}
        
        Achievement Check: ${checkResult.data.success ? 'Success' : 'Failed'}
        Unlocked: ${checkResult.data.unlocked?.length || 0} achievements
        Errors: ${checkResult.data.errors?.length || 0}
      `;
      
      alert(summary);
    } catch (error) {
      console.error('Error testing achievement system:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleTestAchievementUnlocking = async () => {
    try {
      // Step 1: Check current achievements and cosmetics
      const debugUserAchievements = httpsCallable(functions, 'debugUserAchievements');
      const beforeResult = await debugUserAchievements({});
      
      const beforeAchievements = beforeResult.data.userAchievements?.unlockedAchievements || [];
      const beforeCosmetics = beforeResult.data.userCosmetics?.owned || [];
      
      // Step 2: Artificially set user to have 10+ wins (for testing)
      if (beforeResult.data.userStats?.matchesWon < 10) {
        // Update user stats to trigger achievement
        const updateUserStats = httpsCallable(functions, 'updateUserStatsForTesting');
        await updateUserStats({
          updates: {
            matchesWon: 10,
            matchesPlayed: 15,
            totalEarnings: 50,
            winRate: 0.67
          }
        });
      }
      
      // Step 3: Trigger achievement check
      const checkUserAchievements = httpsCallable(functions, 'checkUserAchievements');
      const checkResult = await checkUserAchievements({});
      
      // Step 4: Verify the results
      const afterResult = await debugUserAchievements({});
      const afterAchievements = afterResult.data.userAchievements?.unlockedAchievements || [];
      const afterCosmetics = afterResult.data.userCosmetics?.owned || [];
      
      // Check specific achievement
      const hasFireBadgeAchievement = afterAchievements.includes('achievement_10_wins');
      const hasFireBadgeCosmetic = afterCosmetics.includes('flair_fire');
      
      const summary = `
 Achievement -> Cosmetic Test Results:

 BEFORE:
  - Achievements: ${beforeAchievements.length}
  - Cosmetics: ${beforeCosmetics.length}
  - Had 10 Wins Achievement: ${beforeAchievements.includes('achievement_10_wins') ? 'Yes' : 'No'}
  - Had Fire Badge: ${beforeCosmetics.includes('flair_fire') ? 'Yes' : 'No'}

 AFTER:
  - Achievements: ${afterAchievements.length}
  - Cosmetics: ${afterCosmetics.length}
  - Has 10 Wins Achievement: ${hasFireBadgeAchievement ? 'Yes ' : 'No '}
  - Has Fire Badge: ${hasFireBadgeCosmetic ? 'Yes ' : 'No '}

 NEW UNLOCKS:
  - Newly Unlocked: ${checkResult.data.unlocked?.length || 0} achievements
  - Unlocked Items: ${checkResult.data.unlocked?.map(u => u.achievementName).join(', ') || 'None'}
  
 SYSTEM STATUS: ${hasFireBadgeAchievement && hasFireBadgeCosmetic ? 'WORKING CORRECTLY!' : 'NEEDS ATTENTION'}
      `;
      
      alert(summary);
      
    } catch (error) {
      console.error('Error testing achievement unlocking:', error);
      alert('Test Failed: ' + error.message);
    }
  };

  const handleFixUserStats = async () => {
    setFixStatsLoading(true);
    setFixStatsResult(null);
    try {
      const fixUserStats = httpsCallable(functions, 'fixUserStats');
      const result = await fixUserStats();
      setFixStatsResult(result.data);
      alert(' User stats migration complete!\n' + JSON.stringify(result.data, null, 2));
    } catch (error) {
      setFixStatsResult({ success: false, error: error.message });
      alert(' Migration failed: ' + error.message);
    } finally {
      setFixStatsLoading(false);
    }
  };
  
  if (loading) {
    return (
      <Container>
        <Header>Admin Dashboard</Header>
        <p>Loading...</p>
      </Container>
    );
  }
  
  if (!isAdmin) {
    return (
      <Container>
        <Header>Access Denied</Header>
        <p>You do not have permission to access this page.</p>
      </Container>
    );
  }
  
  return (
    <Container>
      <Header>Admin Dashboard</Header>
      <AdminGrid>
        <AdminCard to="/admin/referrals">
          <CardTitle>Referral System</CardTitle>
          <CardDescription>
            Manage referral codes, view usage logs, and process creator payouts.
          </CardDescription>
        </AdminCard>
        <AdminCard to="/admin/creator-applications">
          <CardTitle>Creator Applications</CardTitle>
          <CardDescription>
            Review and manage applications from users wanting to become creators.
          </CardDescription>
        </AdminCard>
        <AdminCard to="/admin/requests">
          <CardTitle>Wager Requests</CardTitle>
          <CardDescription>
            Manage user requests for assistance with wagers that have issues.
          </CardDescription>
        </AdminCard>
        <AdminCard to="/admin/withdrawals">
          <CardTitle>Withdrawal Requests</CardTitle>
          <CardDescription>
            Review and process user withdrawal requests to PayPal.
          </CardDescription>
        </AdminCard>
        <AdminCard to="/admin/earnings">
          <CardTitle>Site Earnings</CardTitle>
          <CardDescription>
            Track all site earnings from fees including wagers, withdrawals, and tips.
          </CardDescription>
        </AdminCard>
        <AdminCard to="/admin/ban-management">
          <CardTitle>Ban Management</CardTitle>
          <CardDescription>
            Search for users and manage bans including IP and Epic ID bans.
          </CardDescription>
        </AdminCard>
        <AdminCard to="/admin/appeals">
          <CardTitle>Appeals Management</CardTitle>
          <CardDescription>
            Review and respond to user ban appeals.
          </CardDescription>
        </AdminCard>
        <AdminCard to="/admin/inventory">
          <CardTitle>Inventory Management</CardTitle>
          <CardDescription>
            Add or remove items from user inventories. Manage subscriptions, boosts, and other items.
          </CardDescription>
        </AdminCard>
        <AdminCard to="/admin/user-lookup">
          <CardTitle>User Lookup</CardTitle>
          <CardDescription>
            Quickly find users by display name or Firebase ID.
          </CardDescription>
        </AdminCard>
      </AdminGrid>
    </Container>
  );
};

export default AdminDashboard; 