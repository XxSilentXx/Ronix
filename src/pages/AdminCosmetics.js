import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useCosmetics } from '../contexts/CosmeticContext';
import CosmeticNameplate from '../components/CosmeticNameplate';
import CosmeticProfile from '../components/CosmeticProfile';
import CosmeticFlair from '../components/CosmeticFlair';
import CosmeticCallingCard from '../components/CosmeticCallingCard';
import CosmeticSettings from '../components/CosmeticSettings';
import cosmeticData from '../data/cosmeticData';

const Container = styled.div`
  min-height: 100vh;
  background: #131124;
  color: #fff;
  padding: 2rem;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
  
  h1 {
    font-size: 3rem;
    background: linear-gradient(90deg, #4facfe 0%, #ff61e6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-family: 'Inter', Arial, sans-serif;
    margin-bottom: 1rem;
  }
  
  p {
    font-size: 1.2rem;
    color: #b8c1ec;
    margin-bottom: 2rem;
  }
`;

const BackButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  margin-bottom: 2rem;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }
`;

const AdminControls = styled.div`
  background: rgba(255, 193, 7, 0.1);
  border: 2px solid rgba(255, 193, 7, 0.3);
  border-radius: 15px;
  padding: 2rem;
  margin-bottom: 3rem;
  
  h2 {
    color: #ffc107;
    font-size: 1.8rem;
    margin-bottom: 1.5rem;
    font-family: 'Inter', Arial, sans-serif;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .admin-warning {
    background: rgba(255, 71, 87, 0.2);
    border: 1px solid rgba(255, 71, 87, 0.5);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
    color: #ff4757;
    font-weight: 600;
  }
`;

const ControlPanel = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 3rem;
  flex-wrap: wrap;
`;

const ControlButton = styled.button`
  background: ${props => {
    if (props.disabled) return 'rgba(255, 255, 255, 0.05)';
    if (props.$danger) return 'linear-gradient(90deg, #ff4757 0%, #ff6b7a 100%)';
    if (props.$success) return 'linear-gradient(90deg, #2ed573 0%, #7bed9f 100%)';
    if (props.$active) return 'linear-gradient(90deg, #4facfe 0%, #ff61e6 100%)';
    return 'rgba(255, 255, 255, 0.1)';
  }};
  color: ${props => props.disabled ? '#666' : '#fff'};
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  font-weight: 600;
  transition: all 0.3s ease;
  opacity: ${props => props.disabled ? 0.5 : 1};
  
  &:hover {
    transform: ${props => props.disabled ? 'none' : 'translateY(-2px)'};
    box-shadow: ${props => props.disabled ? 'none' : '0 5px 15px rgba(0, 0, 0, 0.2)'};
  }
`;

const TestSection = styled.div`
  background: rgba(44, 62, 80, 0.95);
  border-radius: 15px;
  padding: 2rem;
  margin-bottom: 2rem;
  border: 2px solid #4facfe;
  box-shadow: 0 8px 32px 0 #4facfe33;
  
  h2 {
    color: #4facfe;
    font-size: 1.8rem;
    margin-bottom: 1.5rem;
    font-family: 'Inter', Arial, sans-serif;
  }
`;

const TestGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const TestCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
  
  h3 {
    color: #fff;
    margin-bottom: 1rem;
    font-size: 1.2rem;
  }
  
  .cosmetic-preview {
    margin: 1rem 0;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    min-height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .cosmetic-info {
    font-size: 0.9rem;
    color: #b8c1ec;
    margin-top: 0.5rem;
  }
  
  .cosmetic-id {
    font-size: 0.8rem;
    color: #666;
    font-family: monospace;
    margin-top: 0.5rem;
    padding: 0.25rem 0.5rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 4px;
  }
`;

const StatusDisplay = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  
  h3 {
    color: #4facfe;
    margin-bottom: 1rem;
  }
  
  .status-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }
  
  .status-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 1rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
  }
  
  .status-label {
    color: #b8c1ec;
  }
  
  .status-value {
    color: ${props => props.$enabled ? '#2ed573' : '#ff4757'};
    font-weight: 600;
  }
`;

const AdminCosmetics = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { currentUser } = useAuth();
  const { cosmeticSettings, updateCosmeticSettings, userCosmetics, awardCosmetic, equipCosmetic, unequipCosmetic, refreshUserCosmetics } = useCosmetics();
  const [showSettings, setShowSettings] = useState(false);
  const [grantingCosmetics, setGrantingCosmetics] = useState(false);
  const [testingMode, setTestingMode] = useState(false);
  const [targetUid, setTargetUid] = useState('');
  const [grantingForUser, setGrantingForUser] = useState(false);
  const navigate = useNavigate();

  // Get sample cosmetics for testing
  const sampleNameplates = cosmeticData.cosmetics.nameplates || [];
  const sampleProfiles = cosmeticData.cosmetics.profiles || [];
  const sampleCallingCards = cosmeticData.cosmetics.callingCards || [];
  const sampleFlair = cosmeticData.cosmetics.flair || [];

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

  const toggleSetting = (setting) => {
    updateCosmeticSettings({ [setting]: !cosmeticSettings[setting] });
  };

  const enableAll = () => {
    updateCosmeticSettings({
      showNameplates: true,
      showProfiles: true,
      showFlair: true,
      showAnimations: true,
      globalDisable: false
    });
  };

  const disableAll = () => {
    updateCosmeticSettings({
      showNameplates: false,
      showProfiles: false,
      showFlair: false,
      showAnimations: false,
      globalDisable: true
    });
  };

  const resetToDefaults = () => {
    updateCosmeticSettings({
      showNameplates: true,
      showProfiles: true,
      showFlair: true,
      showAnimations: true,
      globalDisable: false
    });
  };

  // Grant all cosmetics to current user for testing
  const grantAllCosmetics = async () => {
    if (!currentUser) return;
    
    setGrantingCosmetics(true);
    try {
      // Get all cosmetic IDs
      const allCosmetics = [
        ...cosmeticData.cosmetics.nameplates.map(c => c.id),
        ...cosmeticData.cosmetics.profiles.map(c => c.id),
        ...cosmeticData.cosmetics.callingCards.map(c => c.id),
        ...cosmeticData.cosmetics.flair.map(c => c.id)
      ];
      
      // Award each cosmetic
      for (const cosmeticId of allCosmetics) {
        try {
          await awardCosmetic(cosmeticId, 'admin-testing');
        } catch (error) {
          // Continue if cosmetic already owned
          if (!error.message.includes('Already owned')) {
            console.error(`Error awarding cosmetic ${cosmeticId}:`, error);
          }
        }
      }
      
      // Refresh the cosmetics data to update the UI
      await refreshUserCosmetics();
      

    } catch (error) {
      console.error('Error granting cosmetics:', error);
    } finally {
      setGrantingCosmetics(false);
    }
  };

  // Remove all cosmetics from current user
  const removeAllCosmetics = async () => {
    if (!currentUser) return;
    
    setGrantingCosmetics(true);
    try {
      // Update user cosmetics to empty
      const userRef = doc(db, 'userCosmetics', currentUser.uid);
      await updateDoc(userRef, {
        owned: [],
        equipped: {
          nameplate: null,
          profile: null,
          callingCard: null,
          flair: null
        },
        updatedAt: new Date()
      });
      
      // Refresh the cosmetics data to update the UI
      await refreshUserCosmetics();
      

    } catch (error) {
      console.error('Error removing cosmetics:', error);
    } finally {
      setGrantingCosmetics(false);
    }
  };

  // Toggle testing mode (enables all cosmetics temporarily)
  const toggleTestingMode = () => {
    const newTestingMode = !testingMode;
    setTestingMode(newTestingMode);
    
    if (newTestingMode) {
      // Enable all cosmetics for testing
      updateCosmeticSettings({
        showNameplates: true,
        showProfiles: true,
        showFlair: true,
        showAnimations: true,
        globalDisable: false,
        testingMode: true
      });
    } else {
      // Reset to normal mode
      updateCosmeticSettings({
        testingMode: false
      });
    }
  };

  const grantAllCosmeticsToUser = async () => {
    if (!targetUid) return;
    setGrantingForUser(true);
    try {
      const allCosmetics = [
        ...cosmeticData.cosmetics.nameplates.map(c => c.id),
        ...cosmeticData.cosmetics.profiles.map(c => c.id),
        ...cosmeticData.cosmetics.callingCards.map(c => c.id),
        ...cosmeticData.cosmetics.flair.map(c => c.id)
      ];
      const userRef = doc(db, 'userCosmetics', targetUid);
      await updateDoc(userRef, { owned: allCosmetics });
      alert(`Granted all cosmetics to user ${targetUid}`);
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setGrantingForUser(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <Header>
          <h1> Admin Cosmetic Management</h1>
          <p>Loading...</p>
        </Header>
      </Container>
    );
  }

  if (!isAdmin) {
    return (
      <Container>
        <Header>
          <h1>Access Denied</h1>
          <p>You do not have permission to access this page.</p>
        </Header>
      </Container>
    );
  }

  return (
    <Container>
      <BackButton onClick={() => navigate('/admin')}>
        ← Back to Admin Dashboard
      </BackButton>

      <Header>
        <h1> Admin Cosmetic Management</h1>
        <p>Test, control, and manage all cosmetic effects across the application</p>
      </Header>

      <AdminControls>
        <h2>
           Admin Controls
        </h2>
        <div className="admin-warning">
          <strong>Warning:</strong> These settings affect the cosmetic display for all users globally. 
          Changes are saved to localStorage and will persist across sessions.
        </div>
        
        <ControlPanel>
          <ControlButton $success onClick={enableAll}>
             Enable All Cosmetics
          </ControlButton>
          <ControlButton $danger onClick={disableAll}>
             Disable All Cosmetics
          </ControlButton>
          <ControlButton onClick={resetToDefaults}>
             Reset to Defaults
          </ControlButton>
          <ControlButton 
            $active={testingMode}
            onClick={toggleTestingMode}
            style={{ background: testingMode ? 'linear-gradient(90deg, #ffc107 0%, #ffed4e 100%)' : undefined }}
          >
             {testingMode ? 'Exit Testing Mode' : 'Enter Testing Mode'}
          </ControlButton>
          <ControlButton 
            $active={showSettings}
            onClick={() => setShowSettings(!showSettings)}
          >
             {showSettings ? 'Hide Settings Panel' : 'Show Settings Panel'}
          </ControlButton>
        </ControlPanel>
        
        <div style={{ marginTop: '1rem' }}>
          <h3 style={{ color: '#ffc107', marginBottom: '1rem' }}> Cosmetic Testing Tools</h3>
          <ControlPanel>
            <ControlButton 
              $success 
              onClick={grantAllCosmetics}
              disabled={grantingCosmetics}
            >
              {grantingCosmetics ? ' Granting...' : ' Grant All Cosmetics to Me'}
            </ControlButton>
            <ControlButton 
              $danger 
              onClick={removeAllCosmetics}
              disabled={grantingCosmetics}
            >
              {grantingCosmetics ? ' Removing...' : ' Remove All My Cosmetics'}
            </ControlButton>
          </ControlPanel>
          <div style={{ 
            fontSize: '0.9rem', 
            color: '#b8c1ec', 
            textAlign: 'center', 
            marginTop: '0.5rem',
            fontStyle: 'italic'
          }}>
            Use these tools to test cosmetic functionality with your admin account
          </div>
        </div>

        {/* Grant all cosmetics to any user by UID */}
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <input
            type="text"
            placeholder="Enter user UID"
            value={targetUid}
            onChange={e => setTargetUid(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '1px solid #4facfe',
              marginRight: '1rem',
              width: '260px'
            }}
          />
          <ControlButton
            $success
            onClick={grantAllCosmeticsToUser}
            disabled={grantingForUser || !targetUid}
          >
            {grantingForUser ? 'Granting...' : 'Grant All Cosmetics to User'}
          </ControlButton>
        </div>
      </AdminControls>

      <StatusDisplay>
        <h3> Current Cosmetic Settings Status</h3>
        <div className="status-grid">
          <div className="status-item">
            <span className="status-label">Nameplate Effects:</span>
            <span className="status-value">
              {cosmeticSettings?.showNameplates && !cosmeticSettings?.globalDisable ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">Profile Backgrounds:</span>
            <span className="status-value">
              {cosmeticSettings?.showProfiles && !cosmeticSettings?.globalDisable ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">Leaderboard Flair:</span>
            <span className="status-value">
              {cosmeticSettings?.showFlair && !cosmeticSettings?.globalDisable ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">Animations:</span>
            <span className="status-value">
              {cosmeticSettings?.showAnimations && !cosmeticSettings?.globalDisable ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">Global Override:</span>
            <span className="status-value">
              {cosmeticSettings?.globalDisable ? 'All Disabled' : 'Normal Operation'}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">Total Cosmetics:</span>
            <span className="status-value" style={{ color: '#4facfe' }}>
              {sampleNameplates.length + sampleProfiles.length + sampleCallingCards.length + sampleFlair.length}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">Testing Mode:</span>
            <span className="status-value" style={{ color: testingMode ? '#ffc107' : '#b8c1ec' }}>
              {testingMode ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">My Owned Cosmetics:</span>
            <span className="status-value" style={{ color: '#4facfe' }}>
              {userCosmetics?.owned?.length || 0}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">My Equipped:</span>
            <span className="status-value" style={{ color: '#2ed573' }}>
              {Object.values(userCosmetics?.equipped || {}).filter(Boolean).length}/4
            </span>
          </div>
        </div>
      </StatusDisplay>

      <TestSection>
        <h2> My Admin Cosmetic Inventory</h2>
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ color: '#4facfe', marginBottom: '1rem' }}>Currently Equipped:</h3>
          <TestGrid>
            <TestCard>
              <h3> Nameplate</h3>
              <div className="cosmetic-preview">
                {userCosmetics?.equipped?.nameplate ? (
                  <CosmeticNameplate cosmetic={cosmeticData.cosmetics.nameplates?.find(c => c.id === userCosmetics.equipped.nameplate)}>
                    {currentUser?.displayName || 'Admin'}
                  </CosmeticNameplate>
                ) : (
                  <span style={{ color: '#666' }}>No nameplate equipped</span>
                )}
              </div>
              <div className="cosmetic-info">
                {userCosmetics?.equipped?.nameplate ? 
                  `Equipped: ${cosmeticData.cosmetics.nameplates?.find(c => c.id === userCosmetics.equipped.nameplate)?.name || 'Unknown'}` : 
                  'None equipped'
                }
              </div>
            </TestCard>
            
            <TestCard>
              <h3> Profile Background</h3>
              <div className="cosmetic-preview" style={{ minHeight: '80px' }}>
                {userCosmetics?.equipped?.profile ? (
                  <CosmeticProfile 
                    cosmetic={cosmeticData.cosmetics.profiles?.find(c => c.id === userCosmetics.equipped.profile)}
                    style={{ width: '100%', minHeight: '60px' }}
                  >
                    <span style={{ fontSize: '0.8rem' }}>Background Preview</span>
                  </CosmeticProfile>
                ) : (
                  <span style={{ color: '#666' }}>No background equipped</span>
                )}
              </div>
              <div className="cosmetic-info">
                {userCosmetics?.equipped?.profile ? 
                  `Equipped: ${cosmeticData.cosmetics.profiles?.find(c => c.id === userCosmetics.equipped.profile)?.name || 'Unknown'}` : 
                  'None equipped'
                }
              </div>
            </TestCard>
            
            <TestCard>
              <h3> Flair</h3>
              <div className="cosmetic-preview">
                {userCosmetics?.equipped?.flair ? (
                  <CosmeticFlair 
                    cosmetic={cosmeticData.cosmetics.flair?.find(c => c.id === userCosmetics.equipped.flair)}
                    size="2rem"
                  />
                ) : (
                  <span style={{ color: '#666' }}>No flair equipped</span>
                )}
              </div>
              <div className="cosmetic-info">
                {userCosmetics?.equipped?.flair ? 
                  `Equipped: ${cosmeticData.cosmetics.flair?.find(c => c.id === userCosmetics.equipped.flair)?.name || 'Unknown'}` : 
                  'None equipped'
                }
              </div>
            </TestCard>
            
            <TestCard>
              <h3> Calling Card</h3>
              <div className="cosmetic-preview" style={{ minHeight: '120px' }}>
                {userCosmetics?.equipped?.callingCard ? (
                  <CosmeticCallingCard 
                    cosmetic={cosmeticData.cosmetics.callingCards?.find(c => c.id === userCosmetics.equipped.callingCard)}
                    title="Admin Test"
                    content="Calling card preview"
                    style={{ maxWidth: '200px' }}
                  />
                ) : (
                  <span style={{ color: '#666' }}>No calling card equipped</span>
                )}
              </div>
              <div className="cosmetic-info">
                {userCosmetics?.equipped?.callingCard ? 
                  `Equipped: ${cosmeticData.cosmetics.callingCards?.find(c => c.id === userCosmetics.equipped.callingCard)?.name || 'Unknown'}` : 
                  'None equipped'
                }
              </div>
            </TestCard>
          </TestGrid>
        </div>
        
        <div>
          <h3 style={{ color: '#4facfe', marginBottom: '1rem' }}>
            Owned Cosmetics ({userCosmetics?.owned?.length || 0} total)
          </h3>
          {userCosmetics?.owned?.length > 0 ? (
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '0.5rem',
              padding: '1rem',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '8px'
            }}>
              {userCosmetics.owned.map(cosmeticId => {
                const cosmetic = cosmeticData.cosmetics.nameplates?.find(c => c.id === cosmeticId) ||
                               cosmeticData.cosmetics.profiles?.find(c => c.id === cosmeticId) ||
                               cosmeticData.cosmetics.callingCards?.find(c => c.id === cosmeticId) ||
                               cosmeticData.cosmetics.flair?.find(c => c.id === cosmeticId);
                return cosmetic ? (
                  <span 
                    key={cosmeticId}
                    style={{
                      background: 'rgba(79, 172, 254, 0.2)',
                      color: '#4facfe',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      border: '1px solid rgba(79, 172, 254, 0.3)'
                    }}
                  >
                    {cosmetic.icon} {cosmetic.name}
                  </span>
                ) : (
                  <span 
                    key={cosmeticId}
                    style={{
                      background: 'rgba(255, 71, 87, 0.2)',
                      color: '#ff4757',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem'
                    }}
                  >
                    Unknown: {cosmeticId}
                  </span>
                );
              })}
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              color: '#666', 
              padding: '2rem',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '8px'
            }}>
              No cosmetics owned. Use "Grant All Cosmetics to Me" to get all cosmetics for testing.
            </div>
          )}
        </div>
      </TestSection>

      <TestSection>
        <h2> Nameplate Effects ({sampleNameplates.length} items)</h2>
        <TestGrid>
          {sampleNameplates.map((cosmetic) => (
            <TestCard key={cosmetic.id}>
              <h3>{cosmetic.icon} {cosmetic.name}</h3>
              <div className="cosmetic-preview">
                <CosmeticNameplate cosmetic={cosmetic}>
                  Admin Test
                </CosmeticNameplate>
              </div>
              <div className="cosmetic-info">
                Animation: {cosmetic.effects?.animation || 'None'}<br/>
                Border: {cosmetic.effects?.borderColor || 'Default'}<br/>
                Rarity: {cosmetic.rarity || 'Common'}
              </div>
              <div className="cosmetic-id">ID: {cosmetic.id}</div>
              {userCosmetics?.owned?.includes(cosmetic.id) && (
                <ControlButton
                  $active={userCosmetics?.equipped?.nameplate === cosmetic.id}
                  onClick={() => {
                    if (userCosmetics?.equipped?.nameplate === cosmetic.id) {
                      unequipCosmetic('nameplate');
                    } else {
                      equipCosmetic(cosmetic.id, 'nameplate');
                    }
                  }}
                  style={{ marginTop: '0.5rem', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                >
                  {userCosmetics?.equipped?.nameplate === cosmetic.id ? ' Equipped' : ' Equip'}
                </ControlButton>
              )}
            </TestCard>
          ))}
        </TestGrid>
      </TestSection>

      <TestSection>
        <h2> Profile Backgrounds ({sampleProfiles.length} items)</h2>
        <TestGrid>
          {sampleProfiles.map((cosmetic) => (
            <TestCard key={cosmetic.id}>
              <h3>{cosmetic.icon} {cosmetic.name}</h3>
              <div className="cosmetic-preview" style={{ minHeight: '120px' }}>
                <CosmeticProfile 
                  cosmetic={cosmetic}
                  showDetails={true}
                  style={{ width: '100%', minHeight: '100px' }}
                />
              </div>
              <div className="cosmetic-info">
                Animation: {cosmetic.effects?.animation || 'None'}<br/>
                Pattern: {cosmetic.effects?.overlayPattern || 'None'}<br/>
                Rarity: {cosmetic.rarity || 'Common'}
              </div>
              <div className="cosmetic-id">ID: {cosmetic.id}</div>
              {userCosmetics?.owned?.includes(cosmetic.id) && (
                <ControlButton
                  $active={userCosmetics?.equipped?.profile === cosmetic.id}
                  onClick={() => {
                    if (userCosmetics?.equipped?.profile === cosmetic.id) {
                      unequipCosmetic('profile');
                    } else {
                      equipCosmetic(cosmetic.id, 'profile');
                    }
                  }}
                  style={{ marginTop: '0.5rem', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                >
                  {userCosmetics?.equipped?.profile === cosmetic.id ? ' Equipped' : ' Equip'}
                </ControlButton>
              )}
            </TestCard>
          ))}
        </TestGrid>
      </TestSection>

      <TestSection>
        <h2> Leaderboard Flair ({sampleFlair.length} items)</h2>
        <TestGrid>
          {sampleFlair.map((cosmetic) => (
            <TestCard key={cosmetic.id}>
              <h3>{cosmetic.icon} {cosmetic.name}</h3>
              <div className="cosmetic-preview">
                <CosmeticFlair 
                  cosmetic={cosmetic}
                  size="2rem"
                  showTooltip={true}
                />
              </div>
              <div className="cosmetic-info">
                Animation: {cosmetic.effects?.animation || 'None'}<br/>
                Color: {cosmetic.effects?.color || 'Default'}<br/>
                Rarity: {cosmetic.rarity || 'Common'}
              </div>
              <div className="cosmetic-id">ID: {cosmetic.id}</div>
              {userCosmetics?.owned?.includes(cosmetic.id) && (
                <ControlButton
                  $active={userCosmetics?.equipped?.flair === cosmetic.id}
                  onClick={() => {
                    if (userCosmetics?.equipped?.flair === cosmetic.id) {
                      unequipCosmetic('flair');
                    } else {
                      equipCosmetic(cosmetic.id, 'flair');
                    }
                  }}
                  style={{ marginTop: '0.5rem', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                >
                  {userCosmetics?.equipped?.flair === cosmetic.id ? ' Equipped' : ' Equip'}
                </ControlButton>
              )}
            </TestCard>
          ))}
        </TestGrid>
      </TestSection>

      <TestSection>
        <h2> Calling Cards ({sampleCallingCards.length} items)</h2>
        <TestGrid>
          {sampleCallingCards.map((cosmetic) => (
            <TestCard key={cosmetic.id}>
              <h3>{cosmetic.icon} {cosmetic.name}</h3>
              <div className="cosmetic-preview" style={{ minHeight: '140px' }}>
                <CosmeticCallingCard 
                  cosmetic={cosmetic}
                  title="Admin Test"
                  content="Calling card preview"
                  style={{ maxWidth: '200px' }}
                />
              </div>
              <div className="cosmetic-info">
                Animation: {cosmetic.effects?.animation || 'None'}<br/>
                Theme: {cosmetic.effects?.theme || 'Default'}<br/>
                Rarity: {cosmetic.rarity || 'Common'}
              </div>
              <div className="cosmetic-id">ID: {cosmetic.id}</div>
              {userCosmetics?.owned?.includes(cosmetic.id) && (
                <ControlButton
                  $active={userCosmetics?.equipped?.callingCard === cosmetic.id}
                  onClick={() => {
                    if (userCosmetics?.equipped?.callingCard === cosmetic.id) {
                      unequipCosmetic('callingCard');
                    } else {
                      equipCosmetic(cosmetic.id, 'callingCard');
                    }
                  }}
                  style={{ marginTop: '0.5rem', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                >
                  {userCosmetics?.equipped?.callingCard === cosmetic.id ? ' Equipped' : ' Equip'}
                </ControlButton>
              )}
            </TestCard>
          ))}
        </TestGrid>
      </TestSection>

      <TestSection>
        <h2> Interactive Testing Controls</h2>
        <TestGrid>
          <TestCard>
            <h3>Individual Setting Toggles</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <ControlButton 
                $active={cosmeticSettings?.showNameplates}
                onClick={() => toggleSetting('showNameplates')}
              >
                {cosmeticSettings?.showNameplates ? '' : ''} Toggle Nameplates
              </ControlButton>
              <ControlButton 
                $active={cosmeticSettings?.showProfiles}
                onClick={() => toggleSetting('showProfiles')}
              >
                {cosmeticSettings?.showProfiles ? '' : ''} Toggle Profiles
              </ControlButton>
              <ControlButton 
                $active={cosmeticSettings?.showFlair}
                onClick={() => toggleSetting('showFlair')}
              >
                {cosmeticSettings?.showFlair ? '' : ''} Toggle Flair
              </ControlButton>
              <ControlButton 
                $active={cosmeticSettings?.showAnimations}
                onClick={() => toggleSetting('showAnimations')}
              >
                {cosmeticSettings?.showAnimations ? '' : ''} Toggle Animations
              </ControlButton>
              <ControlButton 
                $danger={cosmeticSettings?.globalDisable}
                onClick={() => toggleSetting('globalDisable')}
              >
                {cosmeticSettings?.globalDisable ? '' : ''} Global Override
              </ControlButton>
            </div>
          </TestCard>
          
          <TestCard>
            <h3>Combined Effects Preview</h3>
            <div className="cosmetic-preview" style={{ minHeight: '100px' }}>
              {sampleProfiles[0] && sampleNameplates[0] && sampleFlair[0] ? (
                <CosmeticProfile 
                  cosmetic={sampleProfiles[0]}
                  style={{ width: '100%', minHeight: '80px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center' }}>
                    <CosmeticNameplate cosmetic={sampleNameplates[0]}>
                      Admin User
                    </CosmeticNameplate>
                    <CosmeticFlair cosmetic={sampleFlair[0]} />
                  </div>
                </CosmeticProfile>
              ) : (
                <div style={{ color: '#ff4757' }}>
                  No cosmetics available for preview
                </div>
              )}
            </div>
            <div className="cosmetic-info">
              All cosmetic types combined in one preview
            </div>
          </TestCard>

          <TestCard>
            <h3>System Information</h3>
            <div style={{ textAlign: 'left', fontSize: '0.9rem', color: '#b8c1ec' }}>
              <div><strong>Settings Storage:</strong> localStorage</div>
              <div><strong>Persistence:</strong> Cross-session</div>
              <div><strong>Scope:</strong> Per-browser</div>
              <div><strong>Components Updated:</strong> Real-time</div>
              <div><strong>Performance Impact:</strong> Minimal</div>
            </div>
          </TestCard>
        </TestGrid>
      </TestSection>

      <CosmeticSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </Container>
  );
};

export default AdminCosmetics; 