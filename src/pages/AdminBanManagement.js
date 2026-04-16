import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { banUser, unbanUser, getActiveBans, updateUserIP, debugGetAllBans, cleanupExpiredBans } from '../firebase/banUtils';

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

const TabContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const Tab = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== 'active'
})`
  background: ${props => props.active ? 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)' : 'rgba(255, 255, 255, 0.1)'};
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(79, 172, 254, 0.4);
  }
`;

const Section = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 2rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const SearchContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
`;

const SearchInput = styled.input`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  color: white;
  padding: 12px 16px;
  font-size: 1rem;
  flex: 1;
  min-width: 250px;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: #4facfe;
    box-shadow: 0 0 10px rgba(79, 172, 254, 0.3);
  }
`;

const SearchButton = styled.button`
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(79, 172, 254, 0.4);
  }
`;

const UserCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
`;

const UserInfo = styled.div`
  flex: 1;
  
  h3 {
    margin: 0 0 0.5rem 0;
    color: #4facfe;
  }
  
  p {
    margin: 0.25rem 0;
    color: #b8c1ec;
    font-size: 0.9rem;
  }
`;

const BanForm = styled.form`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FormLabel = styled.label`
  color: #4facfe;
  font-weight: bold;
`;

const FormInput = styled.input`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  padding: 10px 12px;
  font-size: 1rem;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: #4facfe;
  }
`;

const FormSelect = styled.select`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  padding: 10px 12px;
  font-size: 1rem;
  
  option {
    background: #1a1a2e;
    color: white;
  }
  
  &:focus {
    outline: none;
    border-color: #4facfe;
  }
`;

const FormTextarea = styled.textarea`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  padding: 10px 12px;
  font-size: 1rem;
  min-height: 80px;
  resize: vertical;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: #4facfe;
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  input[type="checkbox"] {
    width: 18px;
    height: 18px;
  }
`;

const ActionButton = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== 'danger'
})`
  background: ${props => props.danger ? 'linear-gradient(90deg, #ff4757 0%, #ff3742 100%)' : 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)'};
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px ${props => props.danger ? 'rgba(255, 71, 87, 0.4)' : 'rgba(79, 172, 254, 0.4)'};
  }
  
  &:disabled {
    background: #666;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const BanList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const BanCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 0, 0, 0.2);
`;

const ConfirmDialog = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ConfirmCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  text-align: center;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
`;

const SearchInfo = styled.div`
  background: rgba(79, 172, 254, 0.1);
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1rem;
  border-left: 4px solid #4facfe;
  
  h4 {
    margin: 0 0 0.5rem 0;
    color: #4facfe;
  }
  
  p {
    margin: 0;
    color: #b8c1ec;
    font-size: 0.9rem;
  }
`;

const RefreshIPButton = styled.button`
  background: linear-gradient(90deg, #ffa502 0%, #ff6348 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-left: 1rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(255, 165, 2, 0.4);
  }
  
  &:disabled {
    background: #666;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const AdminBanManagement = () => {
  const [activeTab, setActiveTab] = useState('search');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeBans, setActiveBans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Ban form state
  const [banForm, setBanForm] = useState({
    reason: '',
    publicReason: '',
    adminNotes: '',
    duration: '24', // hours
    ipBan: false,
    epicIdBan: false
  });

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
          if (activeTab === 'bans') {
            loadActiveBans();
          }
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        navigate('/');
      }
    };
    
    checkAdminStatus();
  }, [currentUser, navigate, activeTab]);

  const refreshUserIP = async (userId) => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // Get current IP address
      let currentIP = null;
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        currentIP = data.ip;
      } catch (error) {
        // Try alternative IP service
        try {
          const response = await fetch('https://ipapi.co/ip/');
          currentIP = await response.text();
          currentIP = currentIP.trim();
        } catch (altError) {
          console.error('Error with both IP services:', error, altError);
          alert('Failed to get IP address from both services');
          return;
        }
      }

      if (currentIP) {
        // Update user's IP in their profile
        await updateUserIP(userId, currentIP);
        alert(`IP updated successfully: ${currentIP}`);
        
        // Refresh search results if this user is in the current results
        if (searchResults.some(user => user.id === userId)) {
          searchUsers();
        }
      }
    } catch (error) {
      console.error('Error refreshing user IP:', error);
      alert('Error refreshing IP: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    if (!searchTerm.trim()) {
      alert('Please enter a search term');
      return;
    }
    
    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const searchTermLower = searchTerm.toLowerCase();
      const results = [];

      // Search by email (exact match and prefix)
      try {
        const emailQuery = query(
          usersRef, 
          where('email', '>=', searchTerm), 
          where('email', '<=', searchTerm + '\uf8ff'), 
          limit(10)
        );
        const emailSnapshot = await getDocs(emailQuery);
        emailSnapshot.forEach(doc => {
          const userData = { id: doc.id, ...doc.data() };
          if (!results.find(u => u.id === userData.id)) {
            results.push(userData);
          }
        });
      } catch (error) {

      }

      // Search by displayNameLower (prefix search)
      try {
        const displayNameQuery = query(
          usersRef, 
          where('displayNameLower', '>=', searchTermLower), 
          where('displayNameLower', '<=', searchTermLower + '\uf8ff'), 
          limit(10)
        );
        const displayNameSnapshot = await getDocs(displayNameQuery);
        displayNameSnapshot.forEach(doc => {
          const userData = { id: doc.id, ...doc.data() };
          if (!results.find(u => u.id === userData.id)) {
            results.push(userData);
          }
        });
      } catch (error) {

      }

      // If no results and search term looks like a UID, try direct lookup
      if (results.length === 0 && searchTerm.length >= 20) {
        try {
          const userRef = doc(db, 'users', searchTerm);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            results.push({ id: userDoc.id, ...userDoc.data() });
          }
        } catch (error) {
  
        }
      }

      setSearchResults(results);
      if (results.length === 0) {
        alert('No users found matching your search criteria. Try searching by email, username, or user ID.');
      }
    } catch (error) {
      console.error('Error searching users:', error);
      alert('Search failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveBans = async () => {
    setLoading(true);
    try {
      const bans = await getActiveBans();
      setActiveBans(bans);

    } catch (error) {
      console.error('Error loading active bans:', error);
      // Show user-friendly error message
      if (error.message.includes('index')) {
        alert('Database index error. Please contact your developer to deploy the required Firestore indexes.');
      } else {
        alert('Failed to load active bans: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBanSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    const confirmData = {
      type: 'ban',
      user: selectedUser,
      banData: banForm
    };
    setConfirmDialog(confirmData);
  };

  const handleUnban = async (userId, username) => {
    const confirmData = {
      type: 'unban',
      userId: userId,
      username: username
    };
    setConfirmDialog(confirmData);
  };

  const executeAction = async () => {
    if (!confirmDialog) return;

    setLoading(true);
    try {
      if (confirmDialog.type === 'ban') {
        await banUser(confirmDialog.user.id, confirmDialog.banData, currentUser.uid);
        alert('User banned successfully');
        setSelectedUser(null);
        setBanForm({
          reason: '',
          publicReason: '',
          adminNotes: '',
          duration: '24',
          ipBan: false,
          epicIdBan: false
        });
        // Clear search results to show updated status
        setSearchResults([]);
      } else if (confirmDialog.type === 'unban') {
        await unbanUser(confirmDialog.userId, currentUser.uid);
        alert('User unbanned successfully');
        loadActiveBans();
      }
    } catch (error) {
      console.error('Error executing action:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
      setConfirmDialog(null);
    }
  };

  const debugAllBans = async () => {
    try {
      await debugGetAllBans();
    } catch (error) {
      console.error('Debug failed:', error);
      alert('Debug failed: ' + error.message);
    }
  };

  const cleanupExpired = async () => {
    setLoading(true);
    try {
      const result = await cleanupExpiredBans();
      alert(`Cleanup complete! ${result.cleanedUp} expired bans were cleaned up.`);
      // Refresh the active bans list
      loadActiveBans();
    } catch (error) {
      console.error('Cleanup failed:', error);
      alert('Cleanup failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

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
      <Header>Ban Management</Header>
      
      <TabContainer>
        <Tab active={activeTab === 'search'} onClick={() => setActiveTab('search')}>
          User Search & Ban
        </Tab>
        <Tab active={activeTab === 'bans'} onClick={() => { setActiveTab('bans'); loadActiveBans(); }}>
          Active Bans
        </Tab>
      </TabContainer>

      {activeTab === 'search' && (
        <>
          <Section>
            <h2>Search Users</h2>
            <SearchInfo>
              <h4>Search Tips</h4>
              <p>You can search by email address, username, or user ID. The search is case-insensitive for usernames.</p>
            </SearchInfo>
            <SearchContainer>
              <SearchInput
                type="text"
                placeholder="Search by username, email, or user ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
              />
              <SearchButton onClick={searchUsers} disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </SearchButton>
            </SearchContainer>

            {searchResults.map(user => (
              <UserCard key={user.id}>
                <UserInfo>
                  <h3>{user.displayName || 'No Display Name'}</h3>
                  <p><strong>Email:</strong> {user.email}</p>
                                    <p><strong>User ID:</strong> {user.id}</p>                  <p><strong>Epic ID:</strong> {user.epicId || 'Not linked'}</p>                  <p><strong>Current IP:</strong> {user.currentIp || 'Unknown'}</p>                  <p><strong>Status:</strong> {user.isBanned ? 'BANNED' : 'Active'}</p>                </UserInfo>                <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>                  <RefreshIPButton                     onClick={() => refreshUserIP(user.id)}                    disabled={loading}                    title="Refresh IP Address"                  >                     Refresh IP                  </RefreshIPButton>                  <ActionButton                     onClick={() => setSelectedUser(user)}                    disabled={user.isAdmin}                  >                    {user.isAdmin ? 'Cannot Ban Admin' : user.isBanned ? 'Modify Ban' : 'Ban User'}                  </ActionButton>                </div>
              </UserCard>
            ))}
            
            {searchResults.length === 0 && !loading && (
              <p style={{textAlign: 'center', color: '#b8c1ec', marginTop: '2rem'}}>
                No search results. Enter a search term and click "Search" to find users.
              </p>
            )}
          </Section>

          {selectedUser && (
            <Section>
              <h2>Ban User: {selectedUser.displayName || selectedUser.email}</h2>
              <BanForm onSubmit={handleBanSubmit}>
                <FormGroup>
                  <FormLabel>Ban Reason (Internal)</FormLabel>
                  <FormSelect
                    value={banForm.reason}
                    onChange={(e) => setBanForm({...banForm, reason: e.target.value})}
                    required
                  >
                    <option value="">Select reason...</option>
                    <option value="cheating">Cheating/Hacking</option>
                    <option value="abusive_behavior">Abusive Behavior</option>
                    <option value="payment_fraud">Payment Fraud</option>
                    <option value="spam">Spam/Advertising</option>
                    <option value="ban_evasion">Ban Evasion</option>
                    <option value="multiple_accounts">Multiple Accounts</option>
                    <option value="other">Other</option>
                  </FormSelect>
                </FormGroup>

                <FormGroup>
                  <FormLabel>Public Reason (Shown to User)</FormLabel>
                  <FormInput
                    type="text"
                    placeholder="Reason visible to the user..."
                    value={banForm.publicReason}
                    onChange={(e) => setBanForm({...banForm, publicReason: e.target.value})}
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <FormLabel>Duration</FormLabel>
                  <FormSelect
                    value={banForm.duration}
                    onChange={(e) => setBanForm({...banForm, duration: e.target.value})}
                    required
                  >
                    <option value="1">1 Hour</option>
                    <option value="6">6 Hours</option>
                    <option value="24">24 Hours</option>
                    <option value="72">3 Days</option>
                    <option value="168">1 Week</option>
                    <option value="720">1 Month</option>
                    <option value="permanent">Permanent</option>
                  </FormSelect>
                </FormGroup>

                <FormGroup>
                  <FormLabel>Admin Notes (Internal Only)</FormLabel>
                  <FormTextarea
                    placeholder="Internal notes about this ban..."
                    value={banForm.adminNotes}
                    onChange={(e) => setBanForm({...banForm, adminNotes: e.target.value})}
                  />
                </FormGroup>

                <FormGroup>
                  <CheckboxGroup>
                    <input
                      type="checkbox"
                      id="ipBan"
                      checked={banForm.ipBan}
                      onChange={(e) => setBanForm({...banForm, ipBan: e.target.checked})}
                    />
                    <FormLabel htmlFor="ipBan">Ban IP Address</FormLabel>
                  </CheckboxGroup>
                  <p style={{fontSize: '0.8rem', color: '#ffa502', margin: '0.5rem 0'}}>
                     Warning: IP bans affect shared networks (universities, cafes, etc.)
                  </p>
                </FormGroup>

                <FormGroup>
                  <CheckboxGroup>
                    <input
                      type="checkbox"
                      id="epicIdBan"
                      checked={banForm.epicIdBan}
                      onChange={(e) => setBanForm({...banForm, epicIdBan: e.target.checked})}
                    />
                    <FormLabel htmlFor="epicIdBan">Ban Epic Games Account</FormLabel>
                  </CheckboxGroup>
                </FormGroup>

                <FormGroup style={{gridColumn: '1 / -1'}}>
                  <ActionButton type="submit" danger disabled={loading}>
                    {loading ? 'Processing...' : 'Ban User'}
                  </ActionButton>
                </FormGroup>
              </BanForm>
            </Section>
          )}
        </>
      )}

      {activeTab === 'bans' && (
        <Section>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
            <h2>Active Bans ({activeBans.length})</h2>
            <div style={{display: 'flex', gap: '0.5rem'}}>
              <ActionButton onClick={cleanupExpired} disabled={loading}>
                {loading ? 'Cleaning...' : ' Cleanup Expired'}
              </ActionButton>
              <ActionButton onClick={debugAllBans} disabled={loading}>
                {loading ? 'Debugging...' : 'Debug All Bans'}
              </ActionButton>
              <ActionButton onClick={loadActiveBans} disabled={loading}>
                {loading ? 'Loading...' : ' Refresh'}
              </ActionButton>
            </div>
          </div>
          <BanList>
            {activeBans.map(ban => (
              <BanCard key={ban.id}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem'}}>
                  <div style={{flex: 1}}>
                    <h3 style={{color: '#ff4757', margin: '0 0 1rem 0'}}>{ban.username}</h3>
                    <p><strong>Reason:</strong> {ban.publicReason}</p>
                    <p><strong>Admin:</strong> {ban.adminName}</p>
                    <p><strong>Ban Date:</strong> {ban.banDate ? new Date(ban.banDate.toDate()).toLocaleDateString() : 'Unknown'}</p>
                    <p><strong>Expires:</strong> {ban.expirationDate ? new Date(ban.expirationDate.toDate()).toLocaleDateString() : 'Permanent'}</p>
                    {ban.ipBanned && <p style={{color: '#ffa502'}}> IP Banned</p>}
                    {ban.epicIdBanned && <p style={{color: '#ffa502'}}> Epic ID Banned</p>}
                    {ban.appealId && <p style={{color: '#4facfe'}}> Appeal Submitted</p>}
                  </div>
                  <ActionButton 
                    onClick={() => handleUnban(ban.userId, ban.username)}
                    disabled={loading}
                  >
                    Unban
                  </ActionButton>
                </div>
              </BanCard>
            ))}
            {activeBans.length === 0 && !loading && (
              <p style={{textAlign: 'center', color: '#b8c1ec'}}>No active bans found.</p>
            )}
            {loading && (
              <p style={{textAlign: 'center', color: '#4facfe'}}>Loading active bans...</p>
            )}
          </BanList>
        </Section>
      )}

      {confirmDialog && (
        <ConfirmDialog>
          <ConfirmCard>
            <h2>Confirm Action</h2>
            {confirmDialog.type === 'ban' ? (
              <div>
                <p>Are you sure you want to ban <strong>{confirmDialog.user.displayName || confirmDialog.user.email}</strong>?</p>
                <p><strong>Reason:</strong> {confirmDialog.banData.publicReason}</p>
                <p><strong>Duration:</strong> {confirmDialog.banData.duration === 'permanent' ? 'Permanent' : `${confirmDialog.banData.duration} hours`}</p>
                {confirmDialog.banData.ipBan && <p style={{color: '#ffa502'}}> This will also ban their IP address</p>}
                {confirmDialog.banData.epicIdBan && <p style={{color: '#ffa502'}}> This will also ban their Epic Games account</p>}
              </div>
            ) : (
              <p>Are you sure you want to unban <strong>{confirmDialog.username}</strong>?</p>
            )}
            <ButtonGroup>
              <ActionButton onClick={() => setConfirmDialog(null)}>Cancel</ActionButton>
              <ActionButton danger onClick={executeAction} disabled={loading}>
                {loading ? 'Processing...' : 'Confirm'}
              </ActionButton>
            </ButtonGroup>
          </ConfirmCard>
        </ConfirmDialog>
      )}
    </Container>
  );
};

export default AdminBanManagement; 