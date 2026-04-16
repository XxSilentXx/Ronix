import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { findCosmeticById } from '../data/cosmeticData';
import CosmeticFlair from './CosmeticFlair';
import { useAuth } from '../contexts/AuthContext';

const DebugContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.9);
  color: #fff;
  padding: 1rem;
  border-radius: 8px;
  max-width: 300px;
  max-height: 400px;
  overflow-y: auto;
  z-index: 1000;
  font-size: 0.8rem;
  border: 2px solid #4facfe;
`;

const DebugTitle = styled.h3`
  margin: 0 0 1rem 0;
  color: #4facfe;
  font-size: 1rem;
`;

const DebugSection = styled.div`
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #333;
`;

const TestFlair = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.5rem 0;
  padding: 0.25rem;
  background: rgba(79, 172, 254, 0.1);
  border-radius: 4px;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 5px;
  right: 8px;
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  font-size: 1.2rem;
`;

const LeaderboardFlairDebug = ({ isVisible, onClose }) => {
  const [debugData, setDebugData] = useState({
    usersWithCosmetics: [],
    totalUsers: 0,
    loading: true,
    error: null
  });
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!isVisible) return;

    const fetchDebugData = async () => {
      try {
        const db = getFirestore();
        
        // Get all users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const totalUsers = usersSnapshot.size;
        
        // Check cosmetics for each user
        const usersWithCosmetics = [];
        
        for (const userDoc of usersSnapshot.docs) {
          const userData = userDoc.data();
          try {
            const cosmeticDoc = await getDoc(doc(db, 'userCosmetics', userDoc.id));
            if (cosmeticDoc.exists()) {
              const cosmeticData = cosmeticDoc.data();
              if (cosmeticData.equipped?.flair) {
                const flairCosmetic = findCosmeticById(cosmeticData.equipped.flair);
                usersWithCosmetics.push({
                  id: userDoc.id,
                  displayName: userData.displayName || 'Unknown',
                  flairId: cosmeticData.equipped.flair,
                  flair: flairCosmetic
                });
              }
            }
          } catch (error) {
            console.error(`Error fetching cosmetics for user ${userDoc.id}:`, error);
          }
        }
        
        setDebugData({
          usersWithCosmetics,
          totalUsers,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error fetching debug data:', error);
        setDebugData(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }));
      }
    };

    fetchDebugData();
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <DebugContainer>
      <CloseButton onClick={onClose}>×</CloseButton>
      <DebugTitle> Flair Debug Panel</DebugTitle>
      
      {debugData.loading ? (
        <div>Loading debug data...</div>
      ) : debugData.error ? (
        <div style={{ color: '#ff4757' }}>Error: {debugData.error}</div>
      ) : (
        <>
          <DebugSection>
            <strong>Statistics:</strong><br/>
            Total Users: {debugData.totalUsers}<br/>
            Users with Flair: {debugData.usersWithCosmetics.length}<br/>
            Coverage: {((debugData.usersWithCosmetics.length / debugData.totalUsers) * 100).toFixed(1)}%
          </DebugSection>
          
          <DebugSection>
            <strong>Current User:</strong><br/>
            {currentUser ? (
              <>
                ID: {currentUser.uid}<br/>
                Name: {currentUser.displayName}<br/>
                Has Flair: {debugData.usersWithCosmetics.some(u => u.id === currentUser.uid) ? 'Yes' : 'No'}
              </>
            ) : (
              'Not logged in'
            )}
          </DebugSection>
          
          <DebugSection>
            <strong>Users with Flair:</strong>
            {debugData.usersWithCosmetics.length === 0 ? (
              <div>No users have flair equipped</div>
            ) : (
              debugData.usersWithCosmetics.map(user => (
                <TestFlair key={user.id}>
                  <span style={{ fontSize: '0.7rem' }}>#{1}</span>
                  {user.flair ? (
                    <CosmeticFlair 
                      cosmetic={user.flair}
                      size="1rem"
                      showTooltip={false}
                    />
                  ) : (
                    <span style={{ color: '#ff4757' }}></span>
                  )}
                  <span>{user.displayName}</span>
                </TestFlair>
              ))
            )}
          </DebugSection>
          
          <DebugSection>
            <strong>Test Flairs:</strong>
            <TestFlair>
              <span style={{ fontSize: '0.7rem' }}>#1</span>
              <CosmeticFlair 
                cosmetic={{
                  id: 'flair_fire',
                  name: ' Fire Badge',
                  type: 'flair',
                  rarity: 'epic',
                  icon: '',
                  effects: {
                    emoji: '',
                    color: '#ff4500',
                    animation: 'bounce'
                  }
                }}
                size="1rem"
                showTooltip={false}
              />
              Test Fire
            </TestFlair>
            <TestFlair>
              <span style={{ fontSize: '0.7rem' }}>#2</span>
              <CosmeticFlair 
                cosmetic={{
                  id: 'flair_crown',
                  name: ' Royalty',
                  type: 'flair',
                  rarity: 'mythic',
                  icon: '',
                  effects: {
                    emoji: '',
                    color: '#ff61e6',
                    animation: 'royal-glow'
                  }
                }}
                size="1rem"
                showTooltip={false}
              />
              Test Crown
            </TestFlair>
          </DebugSection>
        </>
      )}
    </DebugContainer>
  );
};

export default LeaderboardFlairDebug; 