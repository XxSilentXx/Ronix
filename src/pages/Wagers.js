import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import CreateWagerModal from '../components/CreateWagerModal';
import { collection, query, orderBy, getDocs, where, Timestamp, addDoc, getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import PlayerStats from '../components/PlayerStats';
import JoinWagerModal from '../components/JoinWagerModal';
import AdminRequestModal from '../components/AdminRequestModal';
import { useShop } from '../contexts/ShopContext';
import { useInsurance } from '../contexts/InsuranceContext';
import InsuranceIndicator from '../components/InsuranceIndicator';
import Select from 'react-select';
import { trackAchievementProgress } from '../firebase/achievementSystem';

const WagersContainer = styled.div`
  min-height: 100vh;
  background: #131124;
  color: #fff;
  padding: 2rem 0;
  position: relative;
  /* overflow: hidden; */
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: url('https://fortnite-api.com/images/cosmetics/br/character_default.png') no-repeat right bottom/auto 60vh, url('https://fortnite-api.com/images/cosmetics/br/backpack_default.png') no-repeat left 40%/auto 40vh;
    opacity: 0.10;
    z-index: 0;
    pointer-events: none;
  }
`;

const WagersHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-right: 20px;
  position: relative;
  z-index: 1;
  h1 {
    font-size: 3rem;
    background: linear-gradient(90deg, #4facfe 0%, #ff61e6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-family: 'Inter', Arial, sans-serif;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-shadow: 0 4px 24px #4facfe88;
  }
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    h1 { font-size: 2rem; }
  }
`;

const CreateWagerButton = styled.button`
  background: linear-gradient(90deg, #4facfe 0%, #ff61e6 100%);
  color: #fff;
  border: none;
  padding: 1.1rem 2.5rem;
  font-size: 1.2rem;
  font-family: 'Inter', Arial, sans-serif;
  font-weight: 900;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(.25,1.7,.45,.87);
  box-shadow: 0 0 32px #4facfe99;
  letter-spacing: 0.04em;
  text-shadow: 0 2px 8px #00f2fe55;
  margin-right: 20px;
  &:hover {
    transform: translateY(-6px) scale(1.05) rotate(-2deg);
    box-shadow: 0 0 48px #ff61e6cc, 0 0 64px #00f2fe99;
    background: linear-gradient(90deg, #ff61e6 0%, #4facfe 100%);
  }
`;

const FiltersContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
`;

const WagersList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 2rem;
  position: relative;
  z-index: 1;
`;

const WagerCard = styled.div`
  background: rgba(44, 62, 80, 0.92);
  backdrop-filter: blur(10px);
  border-radius: 18px;
  padding: 2.2rem 1.5rem;
  transition: all 0.3s cubic-bezier(.25,1.7,.45,.87);
  border: 2px solid #4facfe;
  box-shadow: 0 8px 32px 0 #4facfe33;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  &:hover {
    transform: translateY(-12px) scale(1.04) rotate(-1deg);
    box-shadow: 0 16px 40px 0 #ff61e6aa;
    border-color: #ff61e6;
    background: rgba(44, 62, 80, 0.98);
  }
`;

const WagerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  h3 {
    font-size: 1.5rem;
    color: #4facfe;
    font-family: 'Inter', Arial, sans-serif;
    letter-spacing: 0.04em;
    text-shadow: 0 2px 8px #4facfe55;
  }
  span {
    background: linear-gradient(90deg, #4facfe 0%, #ff61e6 100%);
    padding: 0.3rem 0.8rem;
    border-radius: 50px;
    font-weight: 700;
    font-size: 1.1rem;
    color: #fff;
    box-shadow: 0 2px 8px #4facfe55;
  }
`;

const WagerInfo = styled.div`
  margin-bottom: 1rem;
  p {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    color: #b8c1ec;
    font-weight: 600;
    span:last-child {
      color: #fff;
      font-weight: 700;
    }
  }
`;

const JoinButton = styled.button`
  width: 100%;
  background: ${props => props.$disabled ? 'rgba(255, 255, 255, 0.1)' : 'linear-gradient(90deg, #4facfe 0%, #ff61e6 100%)'};
  color: ${props => props.$disabled ? '#8a8a9a' : '#fff'};
  border: none;
  padding: 1.1rem;
  border-radius: 12px;
  font-weight: 800;
  font-size: 1.1rem;
  font-family: 'Inter', Arial, sans-serif;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s cubic-bezier(.25,1.7,.45,.87);
  box-shadow: 0 0 16px #4facfe99;
  letter-spacing: 0.03em;
  text-shadow: 0 2px 8px #00f2fe55;
  &:hover {
    transform: ${props => props.$disabled ? 'none' : 'translateY(-4px) scale(1.03) rotate(-1deg)'};
    box-shadow: ${props => props.$disabled ? 'none' : '0 0 32px #ff61e6cc, 0 0 64px #00f2fe99'};
    background: ${props => props.$disabled ? 'rgba(255, 255, 255, 0.1)' : 'linear-gradient(90deg, #ff61e6 0%, #4facfe 100%)'};
  }
`;

const ButtonsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-direction: column;
`;

const AdminRequestButton = styled.button`
  width: 100%;
  background: rgba(255, 66, 66, 0.1);
  color: #ff4242;
  border: 1px solid rgba(255, 66, 66, 0.3);
  padding: 0.6rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 0.5rem;
  
  &:hover {
    background: rgba(255, 66, 66, 0.2);
    transform: translateY(-2px);
  }
`;

const StatsModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const StatsContainer = styled.div`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 15px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
`;

const CloseStatsButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: #fff;
  font-size: 1.5rem;
  cursor: pointer;
  
  &:hover {
    color: #4facfe;
  }
`;

const NoWagersMessage = styled.div`
  text-align: center;
  padding: 3rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  grid-column: 1 / -1;
  
  h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: #4facfe;
  }
  
  p {
    color: #b8c1ec;
    margin-bottom: 1.5rem;
  }
  
  button {
    margin-top: 1rem;
    margin-left: auto;
    margin-right: auto;
    display: inline-block;
  }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  grid-column: 1 / -1;
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    border-top-color: #4facfe;
    animation: ${spin} 1s ease-in-out infinite;
  }
`;

const ErrorContainer = styled.div`
  text-align: center;
  padding: 2rem;
  background: rgba(255, 71, 87, 0.1);
  border-radius: 15px;
  grid-column: 1 / -1;
  
  h3 {
    color: #ff4757;
    margin-bottom: 1rem;
  }
  
  p {
    color: #b8c1ec;
  }
  
  button {
    margin-top: 1rem;
    background: rgba(255, 71, 87, 0.8);
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 10px;
    cursor: pointer;
    
    &:hover {
      background: rgba(255, 71, 87, 1);
    }
  }
`;

const ActiveWagersTitle = styled.h2`
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  color: #fff;
`;

const RefreshButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: none;
  padding: 0.8rem;
  font-size: 1rem;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: rotate(180deg);
  }
`;

const StatBox = styled.div`
  background: rgba(24, 28, 40, 0.45);
  backdrop-filter: blur(14px);
  border-radius: 18px;
  border: 1.5px solid rgba(255,255,255,0.13);
  box-shadow: 0 8px 32px 0 rgba(31,38,135,0.18);
  padding: 1rem;
  margin-bottom: 1rem;
`;

const FilterButton = styled.button`
  background: ${props => props.$active ? 'linear-gradient(90deg, #4facfe 0%, #ff61e6 100%)' : 'rgba(255, 255, 255, 0.12)'};
  color: #fff;
  border: none;
  padding: 0.7rem 1.7rem;
  border-radius: 50px;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  transition: all 0.3s cubic-bezier(.25,1.7,.45,.87);
  box-shadow: ${props => props.$active ? '0 0 16px #ff61e6cc' : 'none'};
  &:hover {
    background: linear-gradient(90deg, #ff61e6 0%, #4facfe 100%);
    color: #fff;
    box-shadow: 0 0 24px #4facfe99;
  }
`;

// Timer component for wager expiry
function WagerTimer({ createdAt, status }) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  function getTimeLeft() {
    if (!createdAt) return 0;
    const expiry = new Date(createdAt.toDate ? createdAt.toDate() : createdAt);
    expiry.setMinutes(expiry.getMinutes() + 30); // 30 minutes
    const diff = expiry - new Date();
    return diff > 0 ? diff : 0;
  }

  useEffect(() => {
    if (status !== 'open' && status !== 'waiting') return;
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);
    return () => clearInterval(interval);
  }, [createdAt, status]);

  if (status !== 'open' && status !== 'waiting') return null;
  if (timeLeft <= 0) return <span style={{ color: '#ff4757', fontWeight: 600 }}>Expired</span>;

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  return (
    <span style={{ color: '#4facfe', fontWeight: 600, fontSize: '1rem' }}>
      Expires in {minutes}:{seconds.toString().padStart(2, '0')}
    </span>
  );
}

const Wagers = () => {
  const { currentUser } = useAuth();
  const notification = useNotification();
  
  const [wagers, setWagers] = useState([]);
  const [filteredWagers, setFilteredWagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [partySizeFilter, setPartySizeFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [gameModeFilter, setGameModeFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('open'); // 'open' or 'ongoing'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedWager, setSelectedWager] = useState(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [statsUsername, setStatsUsername] = useState('');
  const [showAdminRequestModal, setShowAdminRequestModal] = useState(false);
  const [adminRequestWager, setAdminRequestWager] = useState(null);
  const [snipedWagers, setSnipedWagers] = useState({});
  const [snipeLoading, setSnipeLoading] = useState({});
  const { getRemainingSnipes, useSnipe: consumeSnipe } = useShop();
  const { insuranceStatus } = useInsurance();
  const [activeWagerMode, setActiveWagerMode] = useState('real'); // 'real' or 'fun'
  
  // Clear sniped wagers data when component initializes
  useEffect(() => {
    setSnipedWagers({});
  }, []);
  
  // Fetch wagers from Firestore
  const fetchWagers = async () => {
    if (activeTab === 'ongoing') {
      await fetchOngoingWagers();
      return;
    }
    try {
      setLoading(true);
      setError(null);
      
      // Create a base query for active wagers
      let wagerQuery;
      
      // Apply filters
      if (partySizeFilter === 'All') {
        wagerQuery = query(
          collection(db, 'wagers'),
          where('status', '==', 'open'),
          orderBy('createdAt', 'desc')
        );
      } else if (partySizeFilter === '1v1') {
        wagerQuery = query(
          collection(db, 'wagers'),
          where('status', '==', 'open'),
          where('partySize', '==', '1v1'),
          orderBy('createdAt', 'desc')
        );
      } else if (partySizeFilter === '2v2') {
        wagerQuery = query(
          collection(db, 'wagers'),
          where('status', '==', 'open'),
          where('partySize', '==', '2v2'),
          orderBy('createdAt', 'desc')
        );
      } else if (partySizeFilter === '3v3') {
        wagerQuery = query(
          collection(db, 'wagers'),
          where('status', '==', 'open'),
          where('partySize', '==', '3v3'),
          orderBy('createdAt', 'desc')
        );
      } else if (partySizeFilter === '4v4') {
        wagerQuery = query(
          collection(db, 'wagers'),
          where('status', '==', 'open'),
          where('partySize', '==', '4v4'),
          orderBy('createdAt', 'desc')
        );
      } else if (partySizeFilter === 'NA-Central') {
        wagerQuery = query(
          collection(db, 'wagers'),
          where('status', '==', 'open'),
          where('region', '==', 'NA-Central'),
          orderBy('createdAt', 'desc')
        );
      } else if (partySizeFilter === 'NA-East') {
        wagerQuery = query(
          collection(db, 'wagers'),
          where('status', '==', 'open'),
          where('region', '==', 'NA-East'),
          orderBy('createdAt', 'desc')
        );
      } else if (partySizeFilter === 'NA-West') {
        wagerQuery = query(
          collection(db, 'wagers'),
          where('status', '==', 'open'),
          where('region', '==', 'NA-West'),
          orderBy('createdAt', 'desc')
        );
      } else if (partySizeFilter === 'EU') {
        wagerQuery = query(
          collection(db, 'wagers'),
          where('status', '==', 'open'),
          where('region', '==', 'EU'),
          orderBy('createdAt', 'desc')
        );
      }
      
      try {
        const wagersSnapshot = await getDocs(wagerQuery);
        
        // Process wagers data
        const wagersData = wagersSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt ? data.createdAt.toDate() : new Date()
          };
        });
        
        // Filter by mode
        const filteredByMode = wagersData.filter(w => (activeWagerMode === 'fun' ? w.mode === 'fun' : w.mode !== 'fun'));
        
        // Filter out visually expired wagers, even if they haven't been cancelled by the cloud function yet
        const filteredWagers = filteredByMode.filter(wager => {
          const createdAt = wager.createdAt;
          const expiryTime = new Date(createdAt);
          expiryTime.setMinutes(expiryTime.getMinutes() + 30); // 30 minutes for expiry
          
          const now = new Date();
          return now <= expiryTime; // Only show wagers that haven't expired yet
        });
        
        setWagers(filteredWagers);
      } catch (queryError) {
        // Check if this is a missing index error
        if (queryError.code === 'failed-precondition' && queryError.message.includes('index')) {
          setError({
            type: 'missing-index',
            message: 'This query requires a Firestore index that does not exist yet.',
            details: queryError.message
          });
        } else {
          setError({
            type: 'query-error',
            message: 'Failed to fetch wagers.',
            details: queryError.message
          });
        }
      }
    } catch (err) {
      setError({
        type: 'general-error',
        message: 'Failed to fetch wagers.',
        details: err.message
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch ongoing wagers that are in progress
  const fetchOngoingWagers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Create a query for ongoing wagers - those with status 'ready', 'playing', or 'submitting'
      let wagerQuery;
      
      // Base query that gets all in-progress matches
      const statusList = ['ready', 'playing', 'submitting'];
      
      if (partySizeFilter === 'All') {
        wagerQuery = query(
          collection(db, 'wagers'),
          where('status', 'in', statusList),
          orderBy('createdAt', 'desc')
        );
      } else if (['1v1', '2v2', '3v3', '4v4'].includes(partySizeFilter)) {
        wagerQuery = query(
          collection(db, 'wagers'),
          where('status', 'in', statusList),
          where('partySize', '==', partySizeFilter),
          orderBy('createdAt', 'desc')
        );
      } else if (partySizeFilter === 'Squad') {
        wagerQuery = query(
          collection(db, 'wagers'),
          where('status', 'in', statusList),
          where('gameMode', '==', 'Squad'),
          orderBy('createdAt', 'desc')
        );
      } else if (['NA-East', 'NA-West', 'EU'].includes(partySizeFilter)) {
        wagerQuery = query(
          collection(db, 'wagers'),
          where('status', 'in', statusList),
          where('region', '==', partySizeFilter),
          orderBy('createdAt', 'desc')
        );
      }
      
      try {
        const wagersSnapshot = await getDocs(wagerQuery);
        
        // Process wagers data
        const wagersData = wagersSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt ? data.createdAt.toDate() : new Date()
          };
        });
        
        setWagers(wagersData);
      } catch (queryError) {
        if (queryError.code === 'failed-precondition' && queryError.message.includes('index')) {
          setError({
            type: 'missing-index',
            message: 'This query requires a Firestore index that does not exist yet.',
            details: queryError.message
          });
        } else {
          setError({
            type: 'query-error',
            message: 'Failed to fetch ongoing wagers.',
            details: queryError.message
          });
        }
      }
    } catch (err) {
      setError({
        type: 'general-error',
        message: 'Failed to fetch ongoing wagers.',
        details: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch wagers on component mount and when filter or tab changes
  useEffect(() => {
    fetchWagers();
    // Clear sniped wagers when filter changes
    setSnipedWagers({});
  }, [partySizeFilter]);
  
  // Clear sniped wagers when tab changes
  useEffect(() => {
    setSnipedWagers({});
    fetchWagers();
  }, [activeTab]);
  
  // Initial fetch and refresh interval
  useEffect(() => {
    // Set up automatic refresh interval (every 10 seconds)
    const refreshInterval = setInterval(() => {
      fetchWagers();
    }, 10000); // 10 seconds
    
    // Clean up interval when component unmounts
    return () => clearInterval(refreshInterval);
  }, [partySizeFilter, activeTab]);
  
  // Add this useEffect after the others for filter and tab
  useEffect(() => {
    fetchWagers();
    setSnipedWagers({});
  }, [activeWagerMode]);
  
  // Helper function to open the index creation URL
  const openIndexCreationUrl = () => {
    if (error && error.type === 'missing-index' && error.details) {
      // Extract the URL from the error message
      const urlMatch = error.details.match(/https:\/\/console\.firebase\.google\.com\/[^\s"]*/);
      if (urlMatch && urlMatch[0]) {
        window.open(urlMatch[0], '_blank');
      } else {
        notification.addNotification('Could not find index creation URL in error message.', 'error');
      }
    }
  };
  
  // Format date to a readable string
  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Handle opening the create wager modal
  const handleOpenCreateModal = () => {
    if (!currentUser) {
      notification.addNotification('You need to be logged in to create a Match.', 'error');
      return;
    }
    setShowCreateModal(true);
  };
  
  // Handle closing the create wager modal
  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
  };
  
  // Handle wager created event
  const handleWagerCreated = () => {
    fetchWagers();
    handleCloseCreateModal();
  };
  
  // Handle join wager button click
  const handleJoinWager = (wager) => {
    setSelectedWager(wager);
    setShowJoinModal(true);
  };
  
  // Handle closing the join wager modal
  const handleCloseJoinModal = () => {
    setShowJoinModal(false);
    setSelectedWager(null);
  };
  
  // Handle wager joined event
  const handleWagerJoined = () => {
    fetchWagers();
    handleCloseJoinModal();
  };
  
  // Handle view stats button click
  const handleViewStats = (epicUsername) => {
    setStatsUsername(epicUsername);
    setShowStatsModal(true);
  };
  
  // Close stats modal
  const closeStatsModal = () => {
    setShowStatsModal(false);
    setStatsUsername('');
  };
  
  // Handle admin request button click
  const handleAdminRequest = (wager) => {
    if (!currentUser) {
      notification.addNotification('You need to be logged in to request admin assistance.', 'error');
      return;
    }
    
    setAdminRequestWager(wager);
    setShowAdminRequestModal(true);
  };
  
  // Handle viewing an ongoing match as a spectator
  const handleViewMatch = (wager) => {
    // Navigate to the wager match page in spectator mode
    window.location.href = `/wager/${wager.id}?spectator=true`;
  };
  
  // Handle admin request submission
  const handleSubmitAdminRequest = async (reason) => {
    try {
      if (!adminRequestWager || !currentUser) return;
      
      // Create a new admin request document in Firestore
      const requestRef = collection(db, 'adminRequests');
      const newRequest = {
        wagerId: adminRequestWager.id,
        userId: currentUser.uid,
        userDisplayName: currentUser.displayName || 'Anonymous User',
        wagerAmount: adminRequestWager.amount,
        wagerPartySize: adminRequestWager.partySize,
        reason: reason,
        status: 'pending',
        createdAt: Timestamp.now(),
        resolved: false,
        resolvedAt: null,
        resolvedBy: null
      };
      
      await addDoc(requestRef, newRequest);
      
      // Close the modal and show success message
      setShowAdminRequestModal(false);
      setAdminRequestWager(null);
      notification.addNotification('Admin request submitted successfully. An admin will review your request.', 'success');
    } catch (error) {
      notification.addNotification(`Failed to submit admin request: ${error.message}`, 'error');
    }
  };
  
  // Handle closing the admin request modal
  const handleCloseAdminRequestModal = () => {
    setShowAdminRequestModal(false);
    setAdminRequestWager(null);
  };
  
  // Handle match snipe to view opponent before joining
  const handleSnipeWager = async (wagerId) => {
    if (!currentUser) {
      notification.addNotification('You need to be logged in to use Match Snipes.', 'error');
      return;
    }
    
    const remainingSnipes = getRemainingSnipes();
    if (remainingSnipes <= 0) {
      notification.addNotification('You have no Match Snipes remaining. Purchase some from the Shop.', 'error');
      return;
    }
    
    setSnipeLoading(prev => ({ ...prev, [wagerId]: true }));
    
    try {
      // Use a snipe from inventory
      const snipeResult = await consumeSnipe();
      
      if (!snipeResult.success) {
        notification.addNotification(snipeResult.error || 'Failed to use Match Snipe', 'error');
        setSnipeLoading(prev => ({ ...prev, [wagerId]: false }));
        return;
      }
      
      // === INCREMENT SNIPES HIT ACHIEVEMENT ===
      try {
        await trackAchievementProgress(currentUser.uid, 'snipe_hit');
      } catch (err) {
        console.error('[SNIPES ACHIEVEMENT] Error incrementing snipesHit:', err);
      }
      
      // Get fresh wager details to ensure we have current data
      const wagerRef = doc(db, 'wagers', wagerId);
      const wagerDoc = await getDoc(wagerRef);
      
      if (!wagerDoc.exists()) {
        notification.addNotification('Wager not found', 'error');
        setSnipeLoading(prev => ({ ...prev, [wagerId]: false }));
        return;
      }
      
      const wagerData = wagerDoc.data();
      const hostId = wagerData.hostId;
      
      // Get host user data
      const hostRef = doc(db, 'users', hostId);
      const hostDoc = await getDoc(hostRef);
      
      if (!hostDoc.exists()) {
        notification.addNotification('Host information not available', 'error');
        setSnipeLoading(prev => ({ ...prev, [wagerId]: false }));
        return;
      }
      
      const hostData = hostDoc.data();
      const hostName = hostData.displayName || 'Unknown Player';
      const hostEpicUsername = hostData.epicUsername || 'Unknown Epic';
      
      // Create a unique key that combines wager ID and host ID
      // This ensures we're specifically tracking this exact wager
      const snipeKey = `${wagerId}_${hostId}`;
      
      setSnipedWagers(prev => ({
        ...prev,
        [snipeKey]: {
          wagerId,
          hostId,
          hostName,
          hostEpicUsername,
          timestamp: Date.now()
        }
      }));
      
      notification.addNotification(`Successfully revealed opponent: ${hostName}`, 'success');
    } catch (error) {
      notification.addNotification('An error occurred while using Match Snipe', 'error');
    } finally {
      setSnipeLoading(prev => ({ ...prev, [wagerId]: false }));
    }
  };
  
  // Render the wagers list
  const renderWagersList = () => {
    if (loading) {
      return (
        <LoadingContainer>
          <div className="spinner"></div>
        </LoadingContainer>
      );
    }
    
    if (error) {
      return (
        <ErrorContainer>
          <h3>Error Loading Wagers</h3>
          <p>{error.message}</p>
          {error.type === 'missing-index' && (
            <button onClick={openIndexCreationUrl}>Create Required Index</button>
          )}
        </ErrorContainer>
      );
    }
    
    if (wagers.length === 0) {
      return (
        <NoWagersMessage>
          <h3>{activeTab === 'open' ? 'No Active Matches Found' : 'No Ongoing Matches Found'}</h3>
          <p>
            {activeTab === 'open' 
              ? 'Be the first to create a match and start competing!'
              : 'Check back later to see matches in progress.'}
          </p>
          {activeTab === 'open' && (
            <CreateWagerButton onClick={handleOpenCreateModal}>
              {currentUser ? 'Create Match' : 'Login to Create Match'}
            </CreateWagerButton>
          )}
        </NoWagersMessage>
      );
    }
    
    return wagers.map(wager => (
      <WagerCard key={wager.id}>
        <WagerHeader>
          <h3>
            {wager.mode === 'fun' && <span style={{ color: '#51cf66', marginRight: '8px' }}> Fun Play</span>}
            {wager.isPrivateMatch && <span style={{ color: '#ff9500', marginRight: '8px' }}></span>}
            {wager.partySize} {wager.gameMode}
          </h3>
          <span>{wager.mode === 'fun' ? 'Fun Play' : `${wager.amount} Tokens`}</span>
        </WagerHeader>
        <WagerInfo>
          <p>
            <span>Host:</span>
            <span>
              {/* Force anonymity unless specifically sniped */}
              {currentUser && currentUser.uid === wager.hostId ? 'You' : 
               snipedWagers[`${wager.id}_${wager.hostId}`] ? 
               snipedWagers[`${wager.id}_${wager.hostId}`].hostName : 'Anonymous'}
            </span>
          </p>
          <p>
            <span>Region:</span>
            <span>{wager.region}</span>
          </p>
          {activeTab === 'ongoing' ? (
            <p>
              <span>Status:</span>
              <span style={{
                color: wager.status === 'ready' ? '#ffc107' :
                       wager.status === 'playing' ? '#4facfe' :
                       wager.status === 'submitting' ? '#ff61e6' : '#fff'
              }}>
                {wager.status === 'ready' ? 'Getting Ready' :
                 wager.status === 'playing' ? 'In Progress' :
                 wager.status === 'submitting' ? 'Submitting Results' : wager.status}
              </span>
            </p>
          ) : (
            <p>
              <span>Created:</span>
              <span>{formatDate(wager.createdAt)}</span>
            </p>
          )}
          {activeTab === 'open' && (
            <p>
              <span></span>
              <WagerTimer createdAt={wager.createdAt} status={wager.status} />
            </p>
          )}
          {activeTab === 'ongoing' && wager.firstTo && (
            <p>
              <span>First To:</span>
              <span>{wager.firstTo}</span>
            </p>
          )}
        </WagerInfo>
        {activeTab === 'open' ? (
          <>
            <JoinButton 
              onClick={() => handleJoinWager(wager)}
              $disabled={!currentUser || (currentUser && currentUser.uid === wager.hostId)}
            >
              {!currentUser ? 'Login to Join' : 
               currentUser.uid === wager.hostId ? 'Your Wager' : 'Join Wager'}
            </JoinButton>
            
            {currentUser && currentUser.uid !== wager.hostId && (
              <div style={{ marginTop: '0.5rem' }}>
                {/* Create the same key format we used when storing the data */}
                {snipedWagers[`${wager.id}_${wager.hostId}`] ? (
                  <div style={{ 
                    padding: '0.5rem', 
                    background: 'rgba(79, 172, 254, 0.1)', 
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    border: '1px solid rgba(79, 172, 254, 0.3)'
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.2rem' }}> Opponent Revealed:</div>
                    <div>Name: <span style={{ color: '#ff61e6' }}>{snipedWagers[`${wager.id}_${wager.hostId}`].hostName}</span></div>
                    <div>Epic ID: <span style={{ color: '#4facfe' }}>{snipedWagers[`${wager.id}_${wager.hostId}`].hostEpicUsername}</span></div>
                  </div>
                ) : (
                  <JoinButton 
                    onClick={() => handleSnipeWager(wager.id)}
                    $disabled={getRemainingSnipes() <= 0 || snipeLoading[wager.id]}
                    style={{ 
                      background: 'rgba(255, 97, 230, 0.2)', 
                      fontSize: '0.9rem',
                      padding: '0.5rem'
                    }}
                  >
                    {snipeLoading[wager.id] ? 'Loading...' : ` View Opponent (${getRemainingSnipes()} Snipes Left)`}
                  </JoinButton>
                )}
              </div>
            )}
          </>
        ) : (
          <JoinButton 
            onClick={() => handleViewMatch(wager)}
          >
            View Match
          </JoinButton>
        )}
      </WagerCard>
    ));
  };
  
  return (
    <WagersContainer>
      <WagersHeader>
        <h1>Active Matches</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <FilterButton $active={activeWagerMode === 'real'} onClick={() => setActiveWagerMode('real')}>
            Token Matches
          </FilterButton>
          <FilterButton $active={activeWagerMode === 'fun'} onClick={() => setActiveWagerMode('fun')}>
             Fun Play
          </FilterButton>
          <CreateWagerButton onClick={handleOpenCreateModal}>
            {currentUser ? 'Create Match' : 'Login to Create Match'}
          </CreateWagerButton>
        </div>
      </WagersHeader>
      
      {/* Tab Switcher */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '2rem',
        position: 'relative',
        zIndex: '1'
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50px',
          padding: '0.5rem',
          display: 'flex',
          gap: '0.5rem'
        }}>
          <FilterButton 
            $active={activeTab === 'open'}
            onClick={() => setActiveTab('open')}
            style={{ fontSize: '1.1rem', padding: '0.8rem 2rem' }}
          >
            Current Matches
          </FilterButton>
          <FilterButton 
            $active={activeTab === 'ongoing'}
            onClick={() => setActiveTab('ongoing')}
            style={{ fontSize: '1.1rem', padding: '0.8rem 2rem' }}
          >
            Ongoing Matches
          </FilterButton>
        </div>
      </div>
      
      <FiltersContainer>
        <div style={{ minWidth: 180 }}>
          <Select
            options={[
              { value: 'All', label: 'All' },
              { value: '1v1', label: '1v1' },
              { value: '2v2', label: '2v2' },
              { value: '3v3', label: '3v3' },
              { value: '4v4', label: '4v4' },
            ]}
            value={{ value: partySizeFilter, label: partySizeFilter }}
            onChange={opt => setPartySizeFilter(opt.value)}
            styles={{
              control: (base, state) => ({
                ...base,
                background: '#23213a',
                borderColor: state.isFocused ? '#A259F7' : '#23213a',
                boxShadow: state.isFocused ? '0 0 0 2px #A259F7' : 'none',
                borderRadius: 16,
                minHeight: 48,
                color: '#fff',
                fontFamily: 'Inter',
                fontWeight: 700,
              }),
              menu: base => ({
                ...base,
                background: '#23213a',
                borderRadius: 16,
                color: '#fff',
                boxShadow: '0 8px 32px #A259F799',
              }),
              option: (base, state) => ({
                ...base,
                background: state.isSelected
                  ? 'linear-gradient(90deg, #A259F7 0%, #FF61E6 100%)'
                  : state.isFocused
                  ? 'rgba(162,89,247,0.2)'
                  : 'transparent',
                color: '#fff',
                fontWeight: state.isSelected ? 900 : 700,
                fontFamily: 'Inter',
                borderRadius: 12,
                cursor: 'pointer',
              }),
              singleValue: base => ({ ...base, color: '#fff', fontWeight: 700 }),
              dropdownIndicator: base => ({ ...base, color: '#A259F7' }),
              indicatorSeparator: base => ({ ...base, background: '#A259F7' }),
              input: base => ({ ...base, color: '#fff' }),
            }}
            theme={theme => ({
              ...theme,
              borderRadius: 16,
              colors: {
                ...theme.colors,
                primary: '#A259F7',
                primary25: '#FF61E6',
                neutral0: '#23213a',
                neutral80: '#fff',
              },
            })}
            placeholder="Team Size"
            isSearchable={false}
            menuPortalTarget={typeof window !== 'undefined' ? window.document.body : null}
            menuPosition="fixed"
          />
        </div>
        <div style={{ minWidth: 180 }}>
          <Select
            options={[
              { value: 'All', label: 'All Regions' },
              { value: 'NA-Central', label: 'NA-Central' },
              { value: 'NA-East', label: 'NA-East' },
              { value: 'NA-West', label: 'NA-West' },
              { value: 'EU', label: 'EU' },
            ]}
            value={{ value: regionFilter, label: regionFilter === 'All' ? 'All Regions' : regionFilter }}
            onChange={opt => setRegionFilter(opt.value)}
            styles={{
              control: (base, state) => ({
                ...base,
                background: '#23213a',
                borderColor: state.isFocused ? '#A259F7' : '#23213a',
                boxShadow: state.isFocused ? '0 0 0 2px #A259F7' : 'none',
                borderRadius: 16,
                minHeight: 48,
                color: '#fff',
                fontFamily: 'Inter',
                fontWeight: 700,
              }),
              menu: base => ({
                ...base,
                background: '#23213a',
                borderRadius: 16,
                color: '#fff',
                boxShadow: '0 8px 32px #A259F799',
              }),
              option: (base, state) => ({
                ...base,
                background: state.isSelected
                  ? 'linear-gradient(90deg, #A259F7 0%, #FF61E6 100%)'
                  : state.isFocused
                  ? 'rgba(162,89,247,0.2)'
                  : 'transparent',
                color: '#fff',
                fontWeight: state.isSelected ? 900 : 700,
                fontFamily: 'Inter',
                borderRadius: 12,
                cursor: 'pointer',
              }),
              singleValue: base => ({ ...base, color: '#fff', fontWeight: 700 }),
              dropdownIndicator: base => ({ ...base, color: '#A259F7' }),
              indicatorSeparator: base => ({ ...base, background: '#A259F7' }),
              input: base => ({ ...base, color: '#fff' }),
            }}
            theme={theme => ({
              ...theme,
              borderRadius: 16,
              colors: {
                ...theme.colors,
                primary: '#A259F7',
                primary25: '#FF61E6',
                neutral0: '#23213a',
                neutral80: '#fff',
              },
            })}
            placeholder="Region"
            isSearchable={false}
            menuPortalTarget={typeof window !== 'undefined' ? window.document.body : null}
            menuPosition="fixed"
          />
        </div>
        <div style={{ minWidth: 180 }}>
          <Select
            options={[
              { value: 'All', label: 'All Platforms' },
              { value: 'Console', label: 'Console' },
              { value: 'PC', label: 'PC' },
            ]}
            value={{ value: platformFilter, label: platformFilter === 'All' ? 'All Platforms' : platformFilter }}
            onChange={opt => setPlatformFilter(opt.value)}
            styles={{
              control: (base, state) => ({
                ...base,
                background: '#23213a',
                borderColor: state.isFocused ? '#A259F7' : '#23213a',
                boxShadow: state.isFocused ? '0 0 0 2px #A259F7' : 'none',
                borderRadius: 16,
                minHeight: 48,
                color: '#fff',
                fontFamily: 'Inter',
                fontWeight: 700,
              }),
              menu: base => ({
                ...base,
                background: '#23213a',
                borderRadius: 16,
                color: '#fff',
                boxShadow: '0 8px 32px #A259F799',
              }),
              option: (base, state) => ({
                ...base,
                background: state.isSelected
                  ? 'linear-gradient(90deg, #A259F7 0%, #FF61E6 100%)'
                  : state.isFocused
                  ? 'rgba(162,89,247,0.2)'
                  : 'transparent',
                color: '#fff',
                fontWeight: state.isSelected ? 900 : 700,
                fontFamily: 'Inter',
                borderRadius: 12,
                cursor: 'pointer',
              }),
              singleValue: base => ({ ...base, color: '#fff', fontWeight: 700 }),
              dropdownIndicator: base => ({ ...base, color: '#A259F7' }),
              indicatorSeparator: base => ({ ...base, background: '#A259F7' }),
              input: base => ({ ...base, color: '#fff' }),
            }}
            theme={theme => ({
              ...theme,
              borderRadius: 16,
              colors: {
                ...theme.colors,
                primary: '#A259F7',
                primary25: '#FF61E6',
                neutral0: '#23213a',
                neutral80: '#fff',
              },
            })}
            placeholder="Platform"
            isSearchable={false}
            menuPortalTarget={typeof window !== 'undefined' ? window.document.body : null}
            menuPosition="fixed"
          />
        </div>
        <div style={{ minWidth: 180 }}>
          <Select
            options={[
              { value: 'All', label: 'All Modes' },
              { value: 'Box Fight', label: 'Box Fight' },
              { value: 'Zone Wars', label: 'Zone Wars' },
              { value: 'Realistic', label: 'Realistic' },
              // Add more game modes as needed
            ]}
            value={{ value: gameModeFilter, label: gameModeFilter === 'All' ? 'All Modes' : gameModeFilter }}
            onChange={opt => setGameModeFilter(opt.value)}
            styles={{
              control: (base, state) => ({
                ...base,
                background: '#23213a',
                borderColor: state.isFocused ? '#A259F7' : '#23213a',
                boxShadow: state.isFocused ? '0 0 0 2px #A259F7' : 'none',
                borderRadius: 16,
                minHeight: 48,
                color: '#fff',
                fontFamily: 'Inter',
                fontWeight: 700,
              }),
              menu: base => ({
                ...base,
                background: '#23213a',
                borderRadius: 16,
                color: '#fff',
                boxShadow: '0 8px 32px #A259F799',
              }),
              option: (base, state) => ({
                ...base,
                background: state.isSelected
                  ? 'linear-gradient(90deg, #A259F7 0%, #FF61E6 100%)'
                  : state.isFocused
                  ? 'rgba(162,89,247,0.2)'
                  : 'transparent',
                color: '#fff',
                fontWeight: state.isSelected ? 900 : 700,
                fontFamily: 'Inter',
                borderRadius: 12,
                cursor: 'pointer',
              }),
              singleValue: base => ({ ...base, color: '#fff', fontWeight: 700 }),
              dropdownIndicator: base => ({ ...base, color: '#A259F7' }),
              indicatorSeparator: base => ({ ...base, background: '#A259F7' }),
              input: base => ({ ...base, color: '#fff' }),
            }}
            theme={theme => ({
              ...theme,
              borderRadius: 16,
              colors: {
                ...theme.colors,
                primary: '#A259F7',
                primary25: '#FF61E6',
                neutral0: '#23213a',
                neutral80: '#fff',
              },
            })}
            placeholder="Game Mode"
            isSearchable={false}
            menuPortalTarget={typeof window !== 'undefined' ? window.document.body : null}
            menuPosition="fixed"
          />
        </div>
      </FiltersContainer>
      
      <WagersList>
        {renderWagersList()}
      </WagersList>
      
      {showCreateModal && (
        <CreateWagerModal 
          isOpen={showCreateModal}
          onClose={handleCloseCreateModal}
          onWagerCreated={handleWagerCreated}
        />
      )}
      
      {showJoinModal && selectedWager && (
        <JoinWagerModal 
          isOpen={showJoinModal}
          wager={selectedWager}
          onClose={handleCloseJoinModal}
          onWagerJoined={handleWagerJoined}
        />
      )}
      
      {showStatsModal && (
        <StatsModal>
          <StatsContainer>
            <CloseStatsButton onClick={closeStatsModal}>&times;</CloseStatsButton>
            <h2>Player Stats: {statsUsername}</h2>
            <PlayerStats username={statsUsername} />
          </StatsContainer>
        </StatsModal>
      )}
      
      {showAdminRequestModal && adminRequestWager && (
        <AdminRequestModal 
          isOpen={showAdminRequestModal}
          wager={adminRequestWager}
          onClose={handleCloseAdminRequestModal}
          onSubmit={handleSubmitAdminRequest}
        />
      )}
    </WagersContainer>
  );
};

export default Wagers;
