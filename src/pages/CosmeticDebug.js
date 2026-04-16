import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { useCosmetics } from '../contexts/CosmeticContext';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { findCosmeticById } from '../data/cosmeticData';
import CosmeticNameplate from '../components/CosmeticNameplate';
import CosmeticProfile from '../components/CosmeticProfile';
import CosmeticFlair from '../components/CosmeticFlair';

const DebugContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #2b1055 0%, #7597de 100%);
  color: #fff;
  padding: 2rem;
`;

const DebugSection = styled.div`
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  
  h2 {
    margin-bottom: 1rem;
    color: #4facfe;
    font-size: 1.5rem;
  }
  
  h3 {
    margin-bottom: 0.5rem;
    color: #ff61e6;
    font-size: 1.2rem;
  }
`;

const DebugGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const DebugCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const CodeBlock = styled.pre`
  background: rgba(0, 0, 0, 0.3);
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.8rem;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0.5rem 0;
`;

const StatusIndicator = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
  margin-left: 0.5rem;
  
  ${props => props.$status === 'success' && `
    background: rgba(46, 213, 115, 0.2);
    color: #2ed573;
    border: 1px solid #2ed573;
  `}
  
  ${props => props.$status === 'error' && `
    background: rgba(255, 71, 87, 0.2);
    color: #ff4757;
    border: 1px solid #ff4757;
  `}
  
  ${props => props.$status === 'warning' && `
    background: rgba(255, 193, 7, 0.2);
    color: #ffc107;
    border: 1px solid #ffc107;
  `}
`;

const TestButton = styled.button`
  background: linear-gradient(90deg, #4facfe 0%, #ff61e6 100%);
  color: #fff;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  margin: 0.5rem 0.5rem 0.5rem 0;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(79, 172, 254, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const CosmeticDebug = () => {
  const { currentUser } = useAuth();
  const { userCosmetics, loading, getEquippedCosmetic } = useCosmetics();
  const [debugData, setDebugData] = useState({});
  const [rawFirestoreData, setRawFirestoreData] = useState(null);
  const [testResults, setTestResults] = useState({});

  // Fetch raw Firestore data
  const fetchRawData = async () => {
    if (!currentUser) return;
    
    try {
      const db = getFirestore();
      const cosmeticDoc = await getDoc(doc(db, 'userCosmetics', currentUser.uid));
      
      if (cosmeticDoc.exists()) {
        setRawFirestoreData(cosmeticDoc.data());
      } else {
        setRawFirestoreData(null);
      }
    } catch (error) {
      console.error('Error fetching raw Firestore data:', error);
      setRawFirestoreData({ error: error.message });
    }
  };

  // Test cosmetic resolution
  const testCosmeticResolution = () => {
    const results = {};
    
    if (rawFirestoreData?.equipped) {
      Object.entries(rawFirestoreData.equipped).forEach(([type, cosmeticId]) => {
        if (cosmeticId) {
          const resolved = findCosmeticById(cosmeticId);
          results[type] = {
            id: cosmeticId,
            resolved: !!resolved,
            cosmetic: resolved,
            error: !resolved ? 'Cosmetic not found in data' : null
          };
        }
      });
    }
    
    setTestResults(results);
  };

  // Test context data
  const testContextData = () => {
    const contextResults = {};
    
    ['nameplate', 'profile', 'flair'].forEach(type => {
      const equipped = getEquippedCosmetic(type);
      contextResults[type] = {
        equipped: !!equipped,
        cosmetic: equipped,
        error: !equipped ? 'No cosmetic equipped via context' : null
      };
    });
    
    setTestResults(prev => ({ ...prev, context: contextResults }));
  };

  useEffect(() => {
    if (currentUser) {
      fetchRawData();
    }
  }, [currentUser]);

  useEffect(() => {
    setDebugData({
      currentUser: currentUser ? {
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        email: currentUser.email
      } : null,
      userCosmetics,
      loading,
      contextLoaded: !loading
    });
  }, [currentUser, userCosmetics, loading]);

  if (!currentUser) {
    return (
      <DebugContainer>
        <h1> Cosmetic Debug Center</h1>
        <DebugSection>
          <h2> Authentication Required</h2>
          <p>Please log in to debug your cosmetics.</p>
        </DebugSection>
      </DebugContainer>
    );
  }

  return (
    <DebugContainer>
      <h1> Cosmetic Debug Center</h1>
      <p>Comprehensive debugging for the cosmetic system</p>
      
      <DebugSection>
        <h2> Quick Status</h2>
        <div>
          <strong>User:</strong> {currentUser.displayName || currentUser.email}
          <StatusIndicator $status="success">LOGGED IN</StatusIndicator>
        </div>
        <div>
          <strong>Context Loading:</strong> {loading ? 'Loading...' : 'Complete'}
          <StatusIndicator $status={loading ? 'warning' : 'success'}>
            {loading ? 'LOADING' : 'READY'}
          </StatusIndicator>
        </div>
        <div>
          <strong>Firestore Data:</strong> {rawFirestoreData ? 'Found' : 'Not Found'}
          <StatusIndicator $status={rawFirestoreData ? 'success' : 'error'}>
            {rawFirestoreData ? 'EXISTS' : 'MISSING'}
          </StatusIndicator>
        </div>
      </DebugSection>

      <DebugSection>
        <h2> Raw Firestore Data</h2>
        <TestButton onClick={fetchRawData}>Refresh Firestore Data</TestButton>
        <CodeBlock>
          {rawFirestoreData ? JSON.stringify(rawFirestoreData, null, 2) : 'No data found'}
        </CodeBlock>
      </DebugSection>

      <DebugSection>
        <h2> Context Data</h2>
        <CodeBlock>
          {JSON.stringify(debugData, null, 2)}
        </CodeBlock>
      </DebugSection>

      <DebugSection>
        <h2> Cosmetic Resolution Tests</h2>
        <TestButton onClick={testCosmeticResolution}>Test Cosmetic Resolution</TestButton>
        <TestButton onClick={testContextData}>Test Context Data</TestButton>
        
        {Object.keys(testResults).length > 0 && (
          <DebugGrid>
            {Object.entries(testResults).map(([key, value]) => (
              <DebugCard key={key}>
                <h3>{key.charAt(0).toUpperCase() + key.slice(1)}</h3>
                <CodeBlock>{JSON.stringify(value, null, 2)}</CodeBlock>
              </DebugCard>
            ))}
          </DebugGrid>
        )}
      </DebugSection>

      <DebugSection>
        <h2> Live Cosmetic Tests</h2>
        <DebugGrid>
          <DebugCard>
            <h3>Nameplate Test</h3>
            {userCosmetics.equipped?.nameplate ? (
              <div>
                <CosmeticNameplate cosmetic={getEquippedCosmetic('nameplate')}>
                  {currentUser.displayName || 'Test User'}
                </CosmeticNameplate>
                <StatusIndicator $status="success">WORKING</StatusIndicator>
              </div>
            ) : (
              <div>
                No nameplate equipped
                <StatusIndicator $status="warning">NONE</StatusIndicator>
              </div>
            )}
          </DebugCard>

          <DebugCard>
            <h3>Profile Test</h3>
            {userCosmetics.equipped?.profile ? (
              <div>
                <CosmeticProfile 
                  cosmetic={getEquippedCosmetic('profile')} 
                  showDetails={true}
                  style={{ minHeight: '150px' }}
                />
                <StatusIndicator $status="success">WORKING</StatusIndicator>
              </div>
            ) : (
              <div>
                No profile theme equipped
                <StatusIndicator $status="warning">NONE</StatusIndicator>
              </div>
            )}
          </DebugCard>

          <DebugCard>
            <h3>Flair Test</h3>
            {userCosmetics.equipped?.flair ? (
              <div>
                <span style={{ fontSize: '1.2rem' }}>
                  {currentUser.displayName || 'Test User'} 
                  <CosmeticFlair cosmetic={getEquippedCosmetic('flair')} />
                </span>
                <StatusIndicator $status="success">WORKING</StatusIndicator>
              </div>
            ) : (
              <div>
                No flair equipped
                <StatusIndicator $status="warning">NONE</StatusIndicator>
              </div>
            )}
          </DebugCard>
        </DebugGrid>
      </DebugSection>

      <DebugSection>
        <h2> Troubleshooting Guide</h2>
        <div>
          <h3>Common Issues:</h3>
          <ul>
            <li><strong>Profile background not showing:</strong> Check if the cosmetic ID exists in cosmeticData.js</li>
            <li><strong>Animations not working:</strong> Verify CSS keyframes are properly defined</li>
            <li><strong>Context not loading:</strong> Ensure CosmeticProvider wraps the component</li>
            <li><strong>Firestore errors:</strong> Check Firebase rules and user permissions</li>
          </ul>
          
          <h3>Debug Steps:</h3>
          <ol>
            <li>Check if raw Firestore data exists</li>
            <li>Verify cosmetic IDs resolve to actual cosmetic objects</li>
            <li>Test if context provides the correct data</li>
            <li>Inspect browser console for errors</li>
            <li>Check if CSS animations are being applied</li>
          </ol>
        </div>
      </DebugSection>
    </DebugContainer>
  );
};

export default CosmeticDebug; 