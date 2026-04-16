import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { getFirestore, collection, query, orderBy, limit, getDocs, doc, getDoc, startAfter } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { FaCrown, FaMedal } from 'react-icons/fa';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
  0% { filter: brightness(1) drop-shadow(0 0 8px #4facfe88); }
  50% { filter: brightness(1.3) drop-shadow(0 0 16px #ff61e6cc); }
  100% { filter: brightness(1) drop-shadow(0 0 8px #4facfe88); }
`;

// Styled Components
const LeaderboardContainer = styled.div`
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
    background: url('https://fortnite-api.com/images/cosmetics/br/character_default.png') no-repeat right bottom/auto 60vh, url('https://fortnite-api.com/images/cosmetics/br/backpack_default.png') no-repeat left 40%/auto 40vh;
    opacity: 0.10;
    z-index: 0;
    pointer-events: none;
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
  position: relative;
  z-index: 1;
  animation: ${fadeIn} 0.6s ease-out;
  
  h1 {
    font-size: 3.5rem;
    background: linear-gradient(90deg, #4facfe 0%, #ff61e6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-family: 'Inter', Arial, sans-serif;
    font-weight: 900;
    letter-spacing: 0.08em;
    margin-bottom: 1rem;
    text-shadow: 0 4px 24px #4facfe88;
  }
  
  p {
    color: #b8c1ec;
    font-size: 1.2rem;
    margin-bottom: 1rem;
  }
`;

const StatusIndicator = styled.div`
  background: rgba(79, 172, 254, 0.2);
  border: 1px solid #4facfe;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  display: inline-block;
  font-size: 0.9rem;
  margin-top: 1rem;
  
  .emoji {
    margin-left: 0.5rem;
    animation: ${shimmer} 2s infinite;
  }
`;

const Filters = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
`;

const FilterButton = styled.button`
  background: ${props => props.$active ? 'linear-gradient(90deg, #4facfe 0%, #ff61e6 100%)' : 'rgba(255, 255, 255, 0.12)'};
  color: #fff;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: ${props => props.$active ? '0 0 16px #ff61e6cc' : 'none'};
  
  &:hover {
    background: linear-gradient(90deg, #ff61e6 0%, #4facfe 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(79, 172, 254, 0.4);
  }
`;

const Table = styled.div`
  background: rgba(44, 62, 80, 0.9);
  backdrop-filter: blur(15px);
  border-radius: 20px;
  overflow: hidden;
  border: 2px solid #4facfe;
  max-width: 1200px;
  margin: 0 auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
  animation: ${fadeIn} 0.8s ease-out 0.2s both;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 80px 1fr 100px 100px 100px 120px 120px;
  padding: 1.5rem;
  background: linear-gradient(90deg, #4facfe 0%, #ff61e6 100%);
  font-weight: 800;
  color: #fff;
  font-size: 1rem;
  letter-spacing: 0.05em;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 80px 1fr 100px 100px 100px 120px 120px;
  padding: 1.2rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  align-items: center;
  transition: all 0.3s ease;
  animation: ${fadeIn} 0.6s ease-out ${props => props.$index * 0.1}s both;
  background: ${({ $index, $isCurrentUser }) =>
    $isCurrentUser
      ? 'rgba(162, 89, 247, 0.18)'
      : $index % 2 === 0
      ? 'rgba(44, 62, 80, 0.92)'
      : 'rgba(36, 40, 56, 0.92)'};
  box-shadow: ${({ $isCurrentUser }) =>
    $isCurrentUser ? '0 0 0 3px #A259F7, 0 0 24px #A259F799' : 'none'};
  position: relative;
  &:last-child {
    border-bottom: none;
  }
  &:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateX(5px);
    box-shadow: 0 4px 20px rgba(79, 172, 254, 0.2);
  }
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 0.5rem;
    padding: 1.5rem;
    text-align: center;
  }
`;

const RankCell = styled.div`
  font-weight: 900;
  font-size: 1.5rem;
  color: ${props => {
    if (props.$rank === 1) return '#FFD700';
    if (props.$rank === 2) return '#C0C0C0';
    if (props.$rank === 3) return '#CD7F32';
    return '#fff';
  }};
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  text-align: center;
  
  @media (max-width: 768px) {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }
`;

const PlayerCell = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  
  @media (max-width: 768px) {
    justify-content: center;
    flex-direction: column;
    gap: 0.5rem;
  }
`;

const Avatar = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: url(${props => props.$src || 'https://placehold.co/44x44/4facfe/fff?text=?'}) no-repeat center/cover;
  border: 2.5px solid ${props => {
    if (props.$rank === 1) return '#FFD700';
    if (props.$rank === 2) return '#C0C0C0';
    if (props.$rank === 3) return '#CD7F32';
    return '#4facfe';
  }};
  box-shadow: 0 0 10px rgba(79, 172, 254, 0.3);
  margin-right: 0.7rem;
`;

const Username = styled.div`
  font-weight: 800;
  font-size: 1.13rem;
  color: #fff;
  letter-spacing: 0.02em;
`;

const StatCell = styled.div`
  font-weight: ${props => props.$highlight ? '900' : '600'};
  color: ${props => props.$highlight ? '#ff61e6' : '#b8c1ec'};
  font-size: 1.08rem;
  text-align: center;
  @media (max-width: 768px) {
    font-size: 1.1rem;
    margin: 0.25rem 0;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  
  .spinner {
    width: 50px;
    height: 50px;
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

const ErrorDisplay = styled.div`
  text-align: center;
  padding: 3rem;
  
  h3 {
    color: #ff4757;
    margin-bottom: 1rem;
  }
  
  p {
    color: #b8c1ec;
  }
`;

const BATCH_SIZE = 10;

// Main Component
const Leaderboard = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('Earnings');
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreRef = useRef();
  
  const { currentUser } = useAuth();

  // Helper functions
  const getOrderField = (filter) => {
    switch (filter) {
      case 'Earnings': return 'totalEarnings';
      case 'Wins': return 'matchesWon';
      case 'Win Rate': return 'winRate';
      case 'Matches': return 'matchesPlayed';
      default: return 'totalEarnings';
    }
  };

  const sortPlayers = (playersArray, filter) => {
    return [...playersArray].sort((a, b) => {
      switch (filter) {
        case 'Earnings': return b.totalEarnings - a.totalEarnings;
        case 'Wins': return b.matchesWon - a.matchesWon;
        case 'Win Rate': return b.winRate - a.winRate;
        case 'Matches': return b.matchesPlayed - a.matchesPlayed;
        default: return b.totalEarnings - a.totalEarnings;
      }
    });
  };

  const getAvatarUrl = (userData) => {
    if (userData.discordId && userData.discordAvatar) {
      return `https://cdn.discordapp.com/avatars/${userData.discordId}/${userData.discordAvatar}.png`;
    }
    return userData.photoURL || null;
  };

  // Fetch leaderboard data (initial and on filter change)
  useEffect(() => {
    let isMounted = true;
    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);
      setLastDoc(null);
      setHasMore(true);
      try {
        const db = getFirestore();
        const statsQuery = query(
          collection(db, 'userStats'),
          orderBy(getOrderField(activeFilter), 'desc'),
          limit(BATCH_SIZE)
        );
        const statsSnapshot = await getDocs(statsQuery);
        const playersData = [];
        for (const statDoc of statsSnapshot.docs) {
          try {
            const stats = statDoc.data();
            const userId = statDoc.id;
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (!userDoc.exists()) continue;
            const userData = userDoc.data();
            playersData.push({
              id: userId,
              displayName: userData.displayName || 'Unknown Player',
              avatarUrl: getAvatarUrl(userData),
              matchesPlayed: stats.matchesPlayed || 0,
              matchesWon: stats.matchesWon || 0,
              matchesLost: stats.matchesLost || 0,
              winRate: stats.winRate || 0,
              totalEarnings: stats.totalEarnings || 0
            });
          } catch (playerError) {
            // Ignore individual player errors
          }
        }
        if (isMounted) {
          setPlayers(sortPlayers(playersData, activeFilter));
          setLastDoc(statsSnapshot.docs[statsSnapshot.docs.length - 1] || null);
          setHasMore(statsSnapshot.size === BATCH_SIZE);
        }
      } catch (fetchError) {
        if (isMounted) setError(fetchError.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchLeaderboard();
    return () => { isMounted = false; };
  }, [activeFilter]);

  // Fetch more users (pagination)
  const fetchMore = useCallback(async () => {
    if (!hasMore || loadingMore || loading || !lastDoc) return;
    setLoadingMore(true);
    try {
      const db = getFirestore();
      const statsQuery = query(
        collection(db, 'userStats'),
        orderBy(getOrderField(activeFilter), 'desc'),
        startAfter(lastDoc),
        limit(BATCH_SIZE)
      );
      const statsSnapshot = await getDocs(statsQuery);
      const playersData = [];
      for (const statDoc of statsSnapshot.docs) {
        try {
          const stats = statDoc.data();
          const userId = statDoc.id;
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (!userDoc.exists()) continue;
          const userData = userDoc.data();
          playersData.push({
            id: userId,
            displayName: userData.displayName || 'Unknown Player',
            avatarUrl: getAvatarUrl(userData),
            matchesPlayed: stats.matchesPlayed || 0,
            matchesWon: stats.matchesWon || 0,
            matchesLost: stats.matchesLost || 0,
            winRate: stats.winRate || 0,
            totalEarnings: stats.totalEarnings || 0
          });
        } catch (playerError) {
          // Ignore individual player errors
        }
      }
      setPlayers(prev => sortPlayers([...prev, ...playersData], activeFilter));
      setLastDoc(statsSnapshot.docs[statsSnapshot.docs.length - 1] || lastDoc);
      setHasMore(statsSnapshot.size === BATCH_SIZE);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoadingMore(false);
    }
  }, [activeFilter, hasMore, lastDoc, loadingMore, loading]);

  // Infinite scroll observer
  useEffect(() => {
    if (!hasMore || loading || loadingMore) return;
    const observer = new window.IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          fetchMore();
        }
      },
      { threshold: 1 }
    );
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    return () => {
      if (loadMoreRef.current) observer.unobserve(loadMoreRef.current);
    };
  }, [fetchMore, hasMore, loading, loadingMore]);

  // Render player row
  const renderPlayer = (player, index, isCurrentUser) => {
    const rank = index + 1;
    let icon = null;
    if (rank === 1) icon = <FaCrown style={{ color: '#FFD700', marginRight: 4, verticalAlign: 'middle' }} title="#1" />;
    else if (rank === 2) icon = <FaMedal style={{ color: '#C0C0C0', marginRight: 4, verticalAlign: 'middle' }} title="#2" />;
    else if (rank === 3) icon = <FaMedal style={{ color: '#CD7F32', marginRight: 4, verticalAlign: 'middle' }} title="#3" />;
    return (
      <TableRow key={player.id} $index={index} $isCurrentUser={isCurrentUser}>
        <RankCell $rank={rank}>
          {icon}#{rank}
        </RankCell>
        <PlayerCell>
          <Avatar $src={player.avatarUrl} $rank={rank} />
          <Username>{player.displayName}</Username>
        </PlayerCell>
        <StatCell>{player.matchesPlayed}</StatCell>
        <StatCell>{player.matchesWon}</StatCell>
        <StatCell>{player.matchesLost}</StatCell>
        <StatCell>{(player.winRate * 100).toFixed(1)}%</StatCell>
        <StatCell $highlight={activeFilter === 'Earnings'}>
          {player.totalEarnings} tokens
        </StatCell>
      </TableRow>
    );
  };

  // Main render
  const currentUserIndex = players.findIndex(p => currentUser && p.id === currentUser.uid);
  const visibleRows = players.map((player, index) => renderPlayer(player, index, currentUser && player.id === currentUser.uid));
  let spotlightRow = null;
  if (currentUser && currentUserIndex === -1) {
    // Optionally fetch and render the user's row if not in the top list (requires backend support)
    // For now, just show a placeholder
    spotlightRow = (
      <TableRow $index={-1} $isCurrentUser={true} style={{ marginTop: 8 }}>
        <RankCell $rank={null}>You</RankCell>
        <PlayerCell>
          <Avatar $src={currentUser.photoURL} />
          <Username>{currentUser.displayName || 'You'}</Username>
        </PlayerCell>
        <StatCell>-</StatCell>
        <StatCell>-</StatCell>
        <StatCell>-</StatCell>
        <StatCell>-</StatCell>
        <StatCell $highlight={activeFilter === 'Earnings'}>-</StatCell>
      </TableRow>
    );
  }
  return (
    <LeaderboardContainer>
      <Header>
        <h1>LEADERBOARD</h1>
        <p>Compete with the best Fortnite players and climb the ranks!</p>
        
        {players.length > 0 && (
          <StatusIndicator>
            <strong>Status:</strong> {players.length} players competing
            <span className="emoji"></span>
          </StatusIndicator>
        )}
      </Header>
      
      <Filters>
        {['Earnings', 'Wins', 'Win Rate', 'Matches'].map(filter => (
          <FilterButton
            key={filter}
            $active={activeFilter === filter}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </FilterButton>
        ))}
      </Filters>
      
      {loading ? (
        <LoadingSpinner>
          <div className="spinner"></div>
        </LoadingSpinner>
      ) : error ? (
        <ErrorDisplay>
          <h3>Error Loading Leaderboard</h3>
          <p>{error}</p>
        </ErrorDisplay>
      ) : players.length === 0 ? (
        <ErrorDisplay>
          <h3>No Players Found</h3>
          <p>Be the first to join the leaderboard!</p>
        </ErrorDisplay>
      ) : (
        <Table>
          <TableHeader>
            <div>Rank</div>
            <div>Player</div>
            <div>Matches</div>
            <div>Wins</div>
            <div>Losses</div>
            <div>Win Rate</div>
            <div>Earnings</div>
          </TableHeader>
          
          {visibleRows}
          {spotlightRow}
          {hasMore && (
            <div ref={loadMoreRef} style={{ height: 60, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {loadingMore && <div className="spinner" style={{ width: 30, height: 30, border: '4px solid #4facfe', borderTop: '4px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />}
            </div>
          )}
        </Table>
      )}
    </LeaderboardContainer>
  );
};

export default Leaderboard;

