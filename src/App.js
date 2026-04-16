import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import './App.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { XpProvider } from './contexts/XpContext';
import { TokenProvider } from './contexts/TokenContext';
import { PartyProvider } from './contexts/PartyContext';
import { FriendsProvider } from './contexts/FriendsContext';
import { ShopProvider } from './contexts/ShopContext';
import { InsuranceProvider } from './contexts/InsuranceContext';
import { CosmeticProvider } from './contexts/CosmeticContext';
import { NotificationProvider, useNotification as useNewNotification } from './contexts/NotificationContext';
import { ReferralProvider } from './contexts/ReferralContext';
import StripeProvider from './stripe/StripeProvider';
import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_PUBLISHABLE_KEY } from './stripe/config';
import { functions, auth } from './firebase/config';
import { httpsCallable } from 'firebase/functions';
import { onAuthStateChanged } from 'firebase/auth';

// Temporary component for battle pass updates
import BattlePassUpdater from './components/BattlePassUpdater';
import GlobalChatWrapper from './components/GlobalChatWrapper';

// Components
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import PartyPopup from './components/PartyPopup';
import NotificationCenter from './components/NotificationCenter';
import XpBoostTimer from './components/XpBoostTimer';
import TopNavbar from './components/TopNavbar';
import ReferralBanner from './components/ReferralBanner';
import ReferralDashboard from './components/ReferralDashboard';
import CreatorReferralDashboard from './components/CreatorReferralDashboard';

// Pages
import Home from './pages/Home';
import Wagers from './pages/Wagers';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import Login from './pages/Login';
import Register from './pages/Register';
import CombinedLeaderboard from './pages/CombinedLeaderboard';
import HowItWorks from './pages/HowItWorks';
import Wallet from './pages/Wallet';
import CoinPage from './pages/CoinPage';
import Shop from './pages/Shop';
import ShopTester from './pages/ShopTester';
import Friends from './pages/Friends';
// import FriendsTest from './pages/FriendsTest';
import ConfigChecker from './pages/ConfigChecker';
import EpicAuthTest from './pages/EpicAuthTest';
import DiscordAuthTest from './pages/DiscordAuthTest';
import SetupGuide from './pages/SetupGuide';
import AuthCallback from './pages/AuthCallback';
import WagerMatch from './pages/WagerMatch';
import MakeAdmin from './pages/MakeAdmin';
import AdminDashboard from './pages/AdminDashboard';
import AdminCosmetics from './pages/AdminCosmetics';
import AdminWagerDebug from './pages/AdminWagerDebug';
import DiscordAvatarManager from './pages/DiscordAvatarManager';
import Rules from './pages/Rules';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import FAQ from './pages/FAQ';
import AdminRequests from './pages/AdminRequests';
import AdminWithdrawals from './pages/AdminWithdrawals';
import AdminEarnings from './pages/AdminEarnings';
import AdminBanManagement from './pages/AdminBanManagement';
import AdminAppealsManagement from './pages/AdminAppealsManagement';
import AppealForm from './pages/AppealForm';
import BanGuard from './components/BanGuard';
import AdminInventory from './pages/AdminInventory';
import CosmeticCustomization from './pages/CosmeticCustomization';
import CosmeticTest from './pages/CosmeticTest';
import CosmeticDebug from './pages/CosmeticDebug';
import AnimationTest from './pages/AnimationTest';
import BattlePass from './pages/BattlePass';
import Achievements from './pages/Achievements';
import AdminReferrals from './pages/AdminReferrals';
import CreatorDashboard from './pages/CreatorDashboard';
import BecomeCreator from './pages/BecomeCreator';
import AdminCreatorApplications from './pages/AdminCreatorApplications';
import Tournaments from './pages/Tournaments';
import CallingCardsTest from './pages/CallingCardsTest';
import AdminUserLookup from './pages/AdminUserLookup';

// Import modal components
import NewUserLinkingModal from './components/NewUserLinkingModal';

// Custom notification component
const Notification = ({ message, type, onClose }) => {
  return (
    <div className={`notification ${type}`}>
      <p>{message}</p>
      <button onClick={onClose}>&times;</button>
    </div>
  );
};

// Notification container
const NotificationContainer = ({ notifications, removeNotification }) => {
  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

// AppContent component that wraps everything inside the auth providers
const AppContent = () => {
  const [notifications, setNotifications] = useState([]);
  const { checkRedirectResult, showNewUserModal, setShowNewUserModal } = useAuth();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showReferralBanner, setShowReferralBanner] = useState(false);
  
  // Check for redirect results when the app first loads
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const user = await checkRedirectResult();
        if (user) {
          addNotification('Successfully signed in!', 'success');
        }
        
        // Check if user returned from modal-initiated Discord linking
        const modalLinkingFlag = localStorage.getItem('discord_linking_from_modal');
        if (modalLinkingFlag) {
          // Only clear the modal flag, let the auth context handle the rest
          setTimeout(() => {
            setShowNewUserModal(true);
          }, 1500);
        }
      } catch (error) {
        console.error('App: Error processing redirect result:', error);
        addNotification('Authentication error: ' + error.message, 'error');
      }
    };
    
    handleRedirectResult();
  }, [checkRedirectResult, setShowNewUserModal]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setUser(user);
        
        // Initialize nameplate system automatically (one-time setup)
        try {
          const autoInit = httpsCallable(functions, 'initializeNameplateSystem');
          await autoInit({});
        } catch (error) {
          // Initialization may have already been completed
        }
        
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Add a notification (memoized with useCallback)
  const addNotification = useCallback((message, type = 'info') => {
    const id = Date.now();
    setNotifications(prevNotifications => [...prevNotifications, { id, message, type }]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
    
    return id;
  }, []);

  // Remove a notification (memoized with useCallback)
  const removeNotification = useCallback((id) => {
    setNotifications(prevNotifications => 
      prevNotifications.filter(notification => notification.id !== id)
    );
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const notificationContextValue = React.useMemo(() => ({
    addNotification,
    removeNotification
  }), [addNotification, removeNotification]);

  return (
    <ReferralProvider>
      <TokenProvider>
        <FriendsProvider>
          <NotificationProvider>
            <PartyProvider>
              <NotificationProvider>
                <XpProvider>
                  <ShopProvider>
                  <InsuranceProvider>
                  <CosmeticProvider>
                  <StripeProvider>
                <Router>
                  <ScrollToTop />
                  <div className="App">
                    <div style={{ display: 'flex', minHeight: '100vh' }}>
                      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
                      <div style={{ flex: 1 }}>
                        <TopNavbar />
                        <ReferralBanner sidebarCollapsed={sidebarCollapsed} />
                        <main
                          style={{
                            minHeight: '100vh',
                            marginLeft: sidebarCollapsed ? 70 : 260,
                            marginTop: 60,
                            transition: 'margin-left 0.25s cubic-bezier(.25,1.7,.45,.87)',
                            background: 'none',
                          }}
                          className="main-content"
                        >
                          <BanGuard>
                            <Routes>
                              <Route path="/" element={<Home />} />
                              <Route path="/wagers" element={<Wagers />} />
                              <Route path="/profile" element={<Profile />} />
                              <Route path="/user/:userId" element={<UserProfile />} />
                              <Route path="/friends" element={<Friends />} />
                              <Route path="/login" element={<Login />} />
                              <Route path="/register" element={<Register />} />
                              <Route path="/leaderboard" element={<CombinedLeaderboard />} />
                              <Route path="/xp-leaderboard" element={<CombinedLeaderboard />} />
                              <Route path="/how-it-works" element={<HowItWorks />} />
                              <Route path="/wallet" element={<Wallet />} />
                              <Route path="/coins" element={<CoinPage />} />
                              <Route path="/shop" element={<Shop />} />
                              <Route path="/shop-tester" element={<ShopTester />} />
                              <Route path="/config-checker" element={<ConfigChecker />} />
                              <Route path="/epic-auth-test" element={<EpicAuthTest />} />
                              <Route path="/discord-auth-test" element={<DiscordAuthTest />} />
                              <Route path="/setup-guide" element={<SetupGuide />} />
                              <Route path="/auth-callback" element={<AuthCallback />} />
                              <Route path="/wager/:matchId" element={<WagerMatch />} />
                              <Route path="/admin" element={<AdminDashboard />} />
                              <Route path="/admin/cosmetics" element={<AdminCosmetics />} />
                              <Route path="/admin/make-admin" element={<MakeAdmin />} />
                              <Route path="/admin/wager-debug" element={<AdminWagerDebug />} />
                              <Route path="/admin/discord-avatars" element={<DiscordAvatarManager />} />
                              <Route path="/rules" element={<Rules />} />
                              <Route path="/terms" element={<TermsOfService />} />
                              <Route path="/privacy" element={<PrivacyPolicy />} />
                              <Route path="/faq" element={<FAQ />} />
                              <Route path="/admin/requests" element={<AdminRequests />} />
                              <Route path="/admin/withdrawals" element={<AdminWithdrawals />} />
                              <Route path="/admin/earnings" element={<AdminEarnings />} />
                              <Route path="/admin/ban-management" element={<AdminBanManagement />} />
                              <Route path="/admin/appeals" element={<AdminAppealsManagement />} />
                              <Route path="/appeal" element={<AppealForm />} />
                              <Route path="/admin/inventory" element={<AdminInventory />} />
                              <Route path="/cosmetics" element={<CosmeticCustomization />} />
                              <Route path="/achievements" element={<Achievements />} />
                              <Route path="/cosmetic-test" element={<CosmeticTest />} />
                              <Route path="/cosmetic-debug" element={<CosmeticDebug />} />
                              <Route path="/animation-test" element={<AnimationTest />} />
                              <Route path="/battlepass" element={<BattlePass />} />
                              <Route path="/admin/referrals" element={<AdminReferrals />} />
                              <Route path="/creator-dashboard" element={<CreatorDashboard />} />
                              <Route path="/become-creator" element={<BecomeCreator />} />
                              <Route path="/admin/creator-applications" element={<AdminCreatorApplications />} />
                              <Route path="/tournaments" element={<Tournaments />} />
                              <Route path="/calling-cards-test" element={<CallingCardsTest />} />
                              <Route path="/admin/user-lookup" element={<AdminUserLookup />} />
                              <Route path="/referrals" element={<ReferralDashboard />} />
                              <Route path="/creator-referrals" element={<CreatorReferralDashboard />} />
                            </Routes>
                          </BanGuard>
                        </main>
                      </div>
                    </div>
                    <Footer />
                    <PartyPopup />
                    <NotificationContainer 
                      notifications={notifications} 
                      removeNotification={removeNotification} 
                    />
                    <XpBoostTimer />
                    <BattlePassUpdater />
                    <GlobalChatWrapper />
                    
                    {/* New User Linking Modal */}
                    <NewUserLinkingModal 
                      isOpen={showNewUserModal} 
                      onClose={() => setShowNewUserModal(false)} 
                    />
                  </div>
                </Router>
                  </StripeProvider>
                  </CosmeticProvider>
                  </InsuranceProvider>
                  </ShopProvider>
                </XpProvider>
              </NotificationProvider>
            </PartyProvider>
          </NotificationProvider>
        </FriendsProvider>
      </TokenProvider>
    </ReferralProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
