import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, getDoc, doc, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useNavigate } from 'react-router-dom';
import RankBadge from '../components/RankBadge';
import { getAvatarUrl } from '../utils/avatarUtils';

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

const SearchContainer = styled.form`
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 2rem;
  max-width: 600px;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 0.8rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  color: #fff;
  font-size: 1rem;
  &:focus {
    outline: none;
    border-color: #4facfe;
    box-shadow: 0 0 0 2px rgba(79, 172, 254, 0.3);
  }
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const SearchButton = styled.button`
  padding: 0.8rem 1.5rem;
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  border: none;
  border-radius: 10px;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(79, 172, 254, 0.4);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const UserCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 2rem;
  margin-top: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  max-width: 600px;
`;

const Avatar = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-image: ${(props) => (props.src ? `url(${props.src})` : 'none')};
  background-color: ${(props) => (props.src ? 'transparent' : '#4facfe')};
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 1rem;
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 1rem;
  text-align: center;
`;

const LinkedAccounts = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const AccountBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50px;
  padding: 0.5rem 1rem;
  font-size: 0.95rem;
`;

const NoResults = styled.div`
  color: #b8c1ec;
  margin-top: 2rem;
`;

const AdminUserLookup = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    const checkAdmin = async () => {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (!userDoc.exists() || !userDoc.data().isAdmin) {
        navigate('/');
      }
    };
    checkAdmin();
  }, [currentUser, navigate]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setUser(null);
    setUserStats(null);
    setLoading(true);
    
    try {
      let foundUser = null;
      
      // If input looks like a Firebase UID (24-36 characters), try direct lookup
      if (search.length >= 24 && search.length <= 36 && !search.includes(' ')) {
        const userDoc = await getDoc(doc(db, 'users', search));
        if (userDoc.exists()) {
          foundUser = { id: userDoc.id, ...userDoc.data() };
        }
      }
      
      // If not found by UID, search by displayName (case-insensitive, partial match)
      if (!foundUser) {
        const searchTerm = search.toLowerCase().trim();
        const usersRef = collection(db, 'users');
        
        // Get all users and filter client-side for flexible matching
        const querySnapshot = await getDocs(query(usersRef, limit(100)));
        
        const matchingUsers = [];
        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          const displayNameLower = userData.displayNameLower || (userData.displayName ? userData.displayName.toLowerCase() : '');
          
          // Check if displayName contains the search query
          if (displayNameLower.includes(searchTerm)) {
            matchingUsers.push({
              id: doc.id,
              ...userData
            });
          }
        });
        
        // If we found matches, take the first one (could be enhanced to show multiple results)
        if (matchingUsers.length > 0) {
          foundUser = matchingUsers[0];
        }
      }
      
      if (!foundUser) {
        setError('No user found. Try searching by display name or Firebase UID.');
        setLoading(false);
        return;
      }
      
      setUser(foundUser);
      
      // Get user stats
      const statsDoc = await getDoc(doc(db, 'userStats', foundUser.id));
      setUserStats(statsDoc.exists() ? statsDoc.data() : null);
      
    } catch (err) {
      console.error('Error searching for user:', err);
      setError('Error searching for user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Header>Admin User Lookup</Header>
      <SearchContainer onSubmit={handleSearch} autoComplete="off">
        <SearchInput
          type="text"
          placeholder="Search by display name (e.g., 'silent17') or Firebase UID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <SearchButton type="submit" disabled={loading || !search.trim()}>
          {loading ? 'Searching...' : 'Search'}
        </SearchButton>
      </SearchContainer>
      {error && <NoResults>{error}</NoResults>}
      {user && (
        <UserCard>
          <Avatar src={getAvatarUrl(user)}>
            {!getAvatarUrl(user) && user.displayName?.charAt(0).toUpperCase()}
          </Avatar>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {user.displayName || user.email || 'User'}
            <RankBadge userId={user.id} size={24} marginLeft="0.5rem" />
          </h2>
          <div style={{ color: '#b8c1ec', marginBottom: 8 }}>
            <strong>Firebase UID:</strong> {user.id}
          </div>
          <div style={{ color: '#b8c1ec', marginBottom: 8 }}>
            <strong>Email:</strong> {user.email || 'N/A'}
          </div>
          <div style={{ color: '#b8c1ec', marginBottom: 8 }}>
            <strong>Display Name:</strong> {user.displayName || 'N/A'}
          </div>
          <div style={{ color: '#b8c1ec', marginBottom: 8 }}>
            <strong>Account Created:</strong> {user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
          </div>
          <div style={{ color: '#b8c1ec', marginBottom: 8 }}>
            <strong>Token Balance:</strong> {user.tokens || 0} tokens
          </div>
          <div style={{ color: '#b8c1ec', marginBottom: 8 }}>
            <strong>Admin:</strong> {user.isAdmin ? 'Yes' : 'No'}
          </div>
          <div style={{ color: '#b8c1ec', marginBottom: 16 }}>
            <strong>Banned:</strong> {user.isBanned ? 'Yes' : 'No'}
          </div>
          
          <h3 style={{ color: '#4facfe', marginBottom: '1rem' }}>User Statistics</h3>
          <StatGrid>
            <StatCard>
              <h3>{userStats?.matchesPlayed || 0}</h3>
              <p>Matches Played</p>
            </StatCard>
            <StatCard>
              <h3>{userStats?.matchesWon || 0}</h3>
              <p>Matches Won</p>
            </StatCard>
            <StatCard>
              <h3>{userStats?.winRate ? (userStats.winRate * 100).toFixed(1) : '0.0'}%</h3>
              <p>Win Rate</p>
            </StatCard>
            <StatCard>
              <h3>${userStats?.totalEarnings?.toFixed(2) || '0.00'}</h3>
              <p>Total Earnings</p>
            </StatCard>
          </StatGrid>
          <h3 style={{ color: '#4facfe', marginBottom: '1rem', marginTop: '2rem' }}>Linked Accounts</h3>
          <LinkedAccounts>
            {user.discordLinked && (
              <AccountBadge>
                <svg width="20" height="15" viewBox="0 0 71 55" fill="#5865F2" xmlns="http://www.w3.org/2000/svg">
                  <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z"/>
                </svg>
                Discord: {user.discordUsername || user.discordId || 'Connected'}
              </AccountBadge>
            )}
            {user.epicLinked && (
              <AccountBadge>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#00BFFF" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 0C5.383 0 0 5.383 0 12C0 18.617 5.383 24 12 24C18.617 24 24 18.617 24 12C24 5.383 18.617 0 12 0ZM13.121 17.896H10.879V12.76H8.637V10.76H15.363V12.76H13.121V17.896ZM12 9.12C11.275 9.12 10.69 8.534 10.69 7.81C10.69 7.086 11.275 6.5 12 6.5C12.725 6.5 13.31 7.086 13.31 7.81C13.31 8.534 12.725 9.12 12 9.12Z"/>
                </svg>
                Epic: {user.epicUsername || 'Connected'}
              </AccountBadge>
            )}
            {user.twitchLinked && (
              <AccountBadge>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#9146FF" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                </svg>
                Twitch: {user.twitchUsername || 'Connected'}
              </AccountBadge>
            )}
            {!user.discordLinked && !user.epicLinked && !user.twitchLinked && (
              <div style={{ color: '#b8c1ec', fontStyle: 'italic' }}>No linked accounts</div>
            )}
          </LinkedAccounts>
        </UserCard>
      )}
    </Container>
  );
};

export default AdminUserLookup; 