import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { functions, auth } from '../firebase/config';

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

const Card = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const CardTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: #4facfe;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: #b8c1ec;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 5px;
  color: #fff;
  margin-bottom: 0.5rem;
  
  &:focus {
    outline: none;
    border-color: #4facfe;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 5px;
  color: #fff;
  margin-bottom: 0.5rem;
  font-family: monospace;
  
  &:focus {
    outline: none;
    border-color: #4facfe;
  }
`;

const Button = styled.button`
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 5px;
  font-weight: 600;
  cursor: pointer;
  margin-right: 1rem;
  
  &:hover {
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const BackButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 5px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const UserGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
`;

const UserCard = styled.div`
  background: rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  }
`;

const UserAvatar = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  margin-bottom: 0.75rem;
  background: ${props => props.$photoURL ? `url(${props.$photoURL}) no-repeat center/cover` : 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)'};
`;

const UserName = styled.div`
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

const UserInfo = styled.div`
  font-size: 0.8rem;
  color: #b8c1ec;
  margin-bottom: 0.5rem;
`;

const StatusMessage = styled.div`
  padding: 1rem;
  border-radius: 5px;
  margin-top: 1rem;
  font-weight: 500;
  background: ${props => props.type === 'success' ? 'rgba(46, 213, 115, 0.1)' : props.type === 'error' ? 'rgba(255, 71, 87, 0.1)' : 'rgba(55, 125, 255, 0.1)'};
  color: ${props => props.type === 'success' ? '#2ed573' : props.type === 'error' ? '#ff4757' : '#377dff'};
  display: ${props => props.visible ? 'block' : 'none'};
`;

const Tabs = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 1rem;
`;

const Tab = styled.button`
  background: ${props => props.active ? 'rgba(79, 172, 254, 0.1)' : 'transparent'};
  color: ${props => props.active ? '#4facfe' : '#b8c1ec'};
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  font-weight: 600;
  cursor: pointer;
  
  &:hover {
    background: rgba(79, 172, 254, 0.1);
  }
`;

const SelectedUsers = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
`;

const SelectedUser = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  margin-bottom: 0.5rem;
  
  button {
    background: none;
    border: none;
    color: #ff4757;
    cursor: pointer;
    padding: 0;
    margin-left: auto;
  }
`;

const DiscordAvatarExample = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  font-size: 0.9rem;
  color: #b8c1ec;
  
  code {
    background: rgba(0, 0, 0, 0.2);
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    color: #4facfe;
  }
  
  a {
    color: #4facfe;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
`;

const AvatarPreview = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 1rem;
  padding: 1rem;
  
  img {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    margin-bottom: 0.5rem;
    border: 2px solid #4facfe;
  }
`;

const DiscordAvatarManager = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('single');
  const [formData, setFormData] = useState({
    userId: '',
    discordId: '',
    discordAvatar: '',
    batchInput: ''
  });
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });
  const [previewUrl, setPreviewUrl] = useState('');
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }
      
      try {
        const db = getFirestore();
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists() && userDoc.data().isAdmin) {
          setIsAdmin(true);
          fetchUsers();
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
  
  useEffect(() => {
    if (formData.discordId && formData.discordAvatar) {
      updatePreview();
    } else {
      setPreviewUrl('');
    }
  }, [formData.discordId, formData.discordAvatar]);
  
  const fetchUsers = async () => {
    try {
      const db = getFirestore();
      
      // Create a fresh query to avoid caching issues
      const usersSnapshot = await getDocs(collection(db, 'users'));
      
      const usersList = [];
      
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        usersList.push({
          id: doc.id,
          displayName: userData.displayName || 'Unknown User',
          photoURL: userData.photoURL || null,
          discordUsername: userData.discordUsername || null,
          discordId: userData.discordId || null,
          discordAvatar: userData.discordAvatar || null,
          discordLinked: userData.discordLinked || false,
          email: userData.email || null,
          // Add a timestamp to ensure the UI refreshes when this changes
          timestamp: Date.now()
        });
      });
      
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
      setStatusMessage({
        text: `Error fetching users: ${error.message}`,
        type: 'error'
      });
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const updatePreview = () => {
    if (formData.discordAvatar) {
      // Check if the avatar value is already a full URL
      if (formData.discordAvatar.includes('http')) {
        setPreviewUrl(`${formData.discordAvatar}?t=${Date.now()}`);
      } else if (formData.discordId) {
        // If it's just a hash, construct the proper URL
        setPreviewUrl(`https://cdn.discordapp.com/avatars/${formData.discordId}/${formData.discordAvatar}.png?t=${Date.now()}`);
      }
    } else {
      setPreviewUrl('');
    }
  };
  
  const selectUser = (user) => {
    // Process avatar value - extract hash if it's a full URL
    let avatarHash = user.discordAvatar || '';
    if (avatarHash.includes('http')) {
      const urlParts = avatarHash.split('/');
      avatarHash = urlParts[urlParts.length - 1].split('.')[0];
    }
    
    setFormData({
      ...formData,
      userId: user.id,
      discordId: user.discordId || '',
      discordAvatar: avatarHash
    });
    
    if (activeTab === 'batch') {
      if (!selectedUsers.some(u => u.id === user.id)) {
        // Clean the avatar hash for batch updates too
        const updatedUser = {
          ...user,
          discordAvatar: avatarHash
        };
        setSelectedUsers([...selectedUsers, updatedUser]);
      }
    }
  };
  
  const removeSelectedUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(user => user.id !== userId));
  };
  
  const handleSingleUpdate = async () => {
    if (!formData.userId || !formData.discordAvatar) {
      setStatusMessage({
        text: 'User ID and Discord Avatar are required',
        type: 'error'
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Process avatar value - extract hash if it's a full URL
      let avatarHash = formData.discordAvatar;
      if (avatarHash.includes('http')) {
        // Extract just the hash from the URL
        const urlParts = avatarHash.split('/');
        avatarHash = urlParts[urlParts.length - 1].split('.')[0];
      }
      
      const updates = [{
        userId: formData.userId,
        discordAvatar: avatarHash,
        discordId: formData.discordId || undefined
      }];

      // Check if user is logged in
      if (!auth.currentUser) {
        throw new Error('You must be logged in to perform this action');
      }

      // Get auth token for the request
      const idToken = await auth.currentUser.getIdToken();
      
      const functionUrl = 'https://us-central1-tokensite-6eef3.cloudfunctions.net/updateDiscordAvatars';
      const result = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ updates })
      });
      
      if (!result.ok) {
        const errorText = await result.text().catch(() => 'Unknown error');
        throw new Error(`HTTP error ${result.status}: ${errorText}`);
      }
      
      const data = await result.json();
      
      if (data.success) {
        setStatusMessage({
          text: `Successfully updated Discord avatar for user`,
          type: 'success'
        });
        
        // Wait a moment for Firestore to update and then refresh user list
        setTimeout(async () => {
          await fetchUsers();
          
          // If we're in single update mode, also refresh the preview
          if (formData.discordId && formData.discordAvatar) {
            updatePreview();
          }
        }, 1000);
      } else {
        setStatusMessage({
          text: `Error: ${data.errors?.join(', ') || 'Unknown error'}`,
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error updating Discord avatar:', error);
      setStatusMessage({
        text: `Error: ${error.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleBatchUpdate = async () => {
    if (selectedUsers.length === 0 && !formData.batchInput) {
      setStatusMessage({
        text: 'No users selected or batch input provided',
        type: 'error'
      });
      return;
    }
    
    try {
      setLoading(true);
      
      let updates = [];
      
      if (formData.batchInput) {
        // Parse batch input format: userId,discordId,discordAvatar
        const lines = formData.batchInput.split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          
          const parts = line.trim().split(',');
          if (parts.length < 2) {
            setStatusMessage({
              text: `Invalid format in line: ${line}. Format should be userId,discordAvatar or userId,discordId,discordAvatar`,
              type: 'error'
            });
            setLoading(false);
            return;
          }
          
          updates.push({
            userId: parts[0].trim(),
            discordAvatar: parts[1].trim(),
            ...(parts.length > 2 ? { discordId: parts[2].trim() } : {})
          });
        }
      } else {
        // Use selected users
        updates = selectedUsers.map(user => ({
          userId: user.id,
          discordAvatar: user.discordAvatar || '',
          discordId: user.discordId || undefined
        }));
      }
      
      // Remove any entries without avatar hash
      updates = updates.filter(update => update.discordAvatar);
      
      // Process avatar values for each update
      updates = updates.map(update => {
        let avatarHash = update.discordAvatar;
        if (avatarHash && avatarHash.includes('http')) {
          // Extract just the hash from the URL
          const urlParts = avatarHash.split('/');
          avatarHash = urlParts[urlParts.length - 1].split('.')[0];
        }
        return {
          ...update,
          discordAvatar: avatarHash
        };
      });
      
      if (updates.length === 0) {
        setStatusMessage({
          text: 'No valid updates found',
          type: 'error'
        });
        setLoading(false);
        return;
      }

      
      // Check if user is logged in
      if (!auth.currentUser) {
        throw new Error('You must be logged in to perform this action');
      }
      
      // Get auth token for the request
      const idToken = await auth.currentUser.getIdToken();
      
      const functionUrl = 'https://us-central1-tokensite-6eef3.cloudfunctions.net/updateDiscordAvatars';
      const result = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ updates })
      });
      
      if (!result.ok) {
        const errorText = await result.text().catch(() => 'Unknown error');
        throw new Error(`HTTP error ${result.status}: ${errorText}`);
      }
      
      const data = await result.json();
      
      if (data.success) {
        setStatusMessage({
          text: `Successfully updated Discord avatars for ${data.updatedUsers.length} users`,
          type: 'success'
        });
        
        // Clear form after successful update
        setSelectedUsers([]);
        setFormData(prev => ({
          ...prev,
          batchInput: ''
        }));
        
        // Wait a moment for Firestore to update and then refresh user list
        setTimeout(async () => {
          await fetchUsers();
        }, 1000);
      } else {
        setStatusMessage({
          text: `Error: ${data.errors?.join(', ') || 'Unknown error'}`,
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error updating Discord avatars:', error);
      setStatusMessage({
        text: `Error: ${error.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const filteredUsers = users.filter(user => 
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.discordUsername?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (loading && !isAdmin) {
    return (
      <Container>
        <Header>Discord Avatar Manager</Header>
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
      <BackButton onClick={() => navigate('/admin')}>
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
        </svg>
        Back to Admin Dashboard
      </BackButton>
      
      <Header>Discord Avatar Manager</Header>
      
      <Tabs>
        <Tab active={activeTab === 'single'} onClick={() => setActiveTab('single')}>
          Single User Update
        </Tab>
        <Tab active={activeTab === 'batch'} onClick={() => setActiveTab('batch')}>
          Batch Update
        </Tab>
      </Tabs>
      
      <Card>
        <CardTitle>
          {activeTab === 'single' ? 'Update Discord Avatar' : 'Batch Update Discord Avatars'}
        </CardTitle>
        
        {activeTab === 'single' ? (
          <>
            <FormGroup>
              <Label htmlFor="userId">User ID (click a user below to select)</Label>
              <Input
                type="text"
                id="userId"
                name="userId"
                value={formData.userId}
                onChange={handleChange}
                readOnly
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="discordId">Discord ID (optional if user already has one)</Label>
              <Input
                type="text"
                id="discordId"
                name="discordId"
                value={formData.discordId}
                onChange={handleChange}
                placeholder="e.g. 107611496304881664"
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="discordAvatar">Discord Avatar Hash</Label>
              <Input
                type="text"
                id="discordAvatar"
                name="discordAvatar"
                value={formData.discordAvatar}
                onChange={handleChange}
                placeholder="e.g. a_1234567890abcdef"
              />
            </FormGroup>
            
            {previewUrl && (
              <AvatarPreview>
                <img src={previewUrl} alt="Avatar Preview" onError={() => setPreviewUrl('')} />
                <div>Preview (if image doesn't appear, check the hash and ID)</div>
              </AvatarPreview>
            )}
            
            <Button onClick={handleSingleUpdate} disabled={loading || !formData.userId || !formData.discordAvatar}>
              {loading ? 'Updating...' : 'Update Avatar'}
            </Button>
          </>
        ) : (
          <>
            <FormGroup>
              <Label>Selected Users ({selectedUsers.length})</Label>
              {selectedUsers.length > 0 && (
                <SelectedUsers>
                  {selectedUsers.map(user => (
                    <SelectedUser key={user.id}>
                      <span>{user.displayName}</span>
                      <button onClick={() => removeSelectedUser(user.id)}>×</button>
                    </SelectedUser>
                  ))}
                </SelectedUsers>
              )}
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="batchInput">Batch Input (one per line: userId,discordAvatar or userId,discordId,discordAvatar)</Label>
              <TextArea
                id="batchInput"
                name="batchInput"
                value={formData.batchInput}
                onChange={handleChange}
                placeholder="userId1,avatarHash1
userId2,avatarHash2
userId3,discordId3,avatarHash3"
              />
            </FormGroup>
            
            <Button 
              onClick={handleBatchUpdate} 
              disabled={loading || (selectedUsers.length === 0 && !formData.batchInput)}
            >
              {loading ? 'Updating...' : 'Update Avatars'}
            </Button>
          </>
        )}
        
        <StatusMessage visible={statusMessage.text} type={statusMessage.type}>
          {statusMessage.text}
        </StatusMessage>
        
        <DiscordAvatarExample>
          <p><strong>Discord Avatar Help:</strong></p>
          <p>1. View the Discord profile of the user</p>
          <p>2. Right-click their avatar and select "Copy Image Link"</p>
          <p>3. The URL will look like: <code>https://cdn.discordapp.com/avatars/107611496304881664/229de2427d9ab21c5357ca399ea4efb9.png</code></p>
          <p>4. The parts you need are:</p>
          <p>   - Discord ID: <code>107611496304881664</code> (the first number)</p>
          <p>   - Avatar Hash: <code>229de2427d9ab21c5357ca399ea4efb9</code> (the second part)</p>
        </DiscordAvatarExample>
      </Card>
      
      <Card>
        <CardTitle>Find User</CardTitle>
        
        <FormGroup>
          <Label htmlFor="search">Search Users</Label>
          <Input
            type="text"
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or Discord username"
          />
        </FormGroup>
        
        <UserGrid>
          {filteredUsers.map(user => (
            <UserCard key={user.id} onClick={() => selectUser(user)}>
              <UserAvatar 
                $photoURL={
                  user.discordAvatar 
                    ? user.discordAvatar.includes('http') 
                      // If discordAvatar is already a full URL, use it directly
                      ? `${user.discordAvatar}?t=${Date.now()}`
                      // Otherwise construct the proper URL from ID and hash
                      : `https://cdn.discordapp.com/avatars/${user.discordId}/${user.discordAvatar}.png?t=${Date.now()}`
                    : user.photoURL
                } 
              />
              <UserName>{user.displayName}</UserName>
              {user.email && <UserInfo>Email: {user.email}</UserInfo>}
              {user.discordUsername && (
                <UserInfo>Discord: {user.discordUsername}</UserInfo>
              )}
              {user.discordLinked && (
                <UserInfo style={{ color: '#4facfe' }}>
                  Discord Linked: Yes
                </UserInfo>
              )}
              {user.discordAvatar && (
                <UserInfo style={{ color: '#2ed573' }}>
                  Avatar: {user.discordAvatar.substring(0, 10)}...
                </UserInfo>
              )}
            </UserCard>
          ))}
          
          {filteredUsers.length === 0 && (
            <div>No users found matching your search criteria.</div>
          )}
        </UserGrid>
      </Card>
    </Container>
  );
};

export default DiscordAvatarManager; 