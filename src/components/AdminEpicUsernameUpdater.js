import React, { useState } from 'react';
import styled from 'styled-components';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '../contexts/AuthContext';

const Container = styled.div`
  background: rgba(20, 25, 40, 0.95);
  border-radius: 15px;
  padding: 2rem;
  margin: 1rem 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const Title = styled.h2`
  color: #00BFFF;
  margin-bottom: 1rem;
  font-size: 1.5rem;
`;

const Description = styled.p`
  color: #b8c1ec;
  margin-bottom: 1.5rem;
  line-height: 1.6;
`;

const InfoBox = styled.div`
  background: rgba(0, 191, 255, 0.1);
  border: 1px solid rgba(0, 191, 255, 0.3);
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  
  h4 {
    color: #00BFFF;
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
  }
  
  p {
    color: #b8c1ec;
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.4;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
  background: linear-gradient(90deg, #0095ff 0%, #00BFFF 100%);
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.3s ease;
  opacity: ${props => props.disabled ? 0.7 : 1};
  
  &:hover {
    transform: ${props => props.disabled ? 'none' : 'translateY(-2px)'};
    box-shadow: ${props => props.disabled ? 'none' : '0 8px 20px rgba(0, 191, 255, 0.3)'};
  }
`;

const StatusContainer = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1rem;
`;

const StatusText = styled.div`
  color: ${props => {
    if (props.type === 'success') return '#2ed573';
    if (props.type === 'error') return '#ff4757';
    if (props.type === 'warning') return '#ffa502';
    return '#b8c1ec';
  }};
  margin: 0.5rem 0;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
`;

const ResultsContainer = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  padding: 1rem;
  margin-top: 1rem;
  max-height: 400px;
  overflow-y: auto;
`;

const ResultItem = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 0.8rem;
  margin: 0.5rem 0;
  border-left: 4px solid ${props => {
    if (props.updated) return '#2ed573';
    if (props.error) return '#ff4757';
    if (props.needsAttention) return '#ffa502';
    return '#00BFFF';
  }};
`;

const UserIdInput = styled.input`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 0.8rem;
  color: white;
  width: 300px;
  margin-right: 1rem;
  
  &::placeholder {
    color: #b8c1ec;
  }
  
  &:focus {
    outline: none;
    border-color: #00BFFF;
  }
`;

const AdminEpicUsernameUpdater = () => {
  const { currentUser } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [status, setStatus] = useState([]);
  const [results, setResults] = useState(null);
  const [targetUserId, setTargetUserId] = useState('');

  const functions = getFunctions();

  const addStatus = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setStatus(prev => [...prev, { message: `[${timestamp}] ${message}`, type }]);
  };

  const handleUpdateAllUsers = async () => {
    if (!currentUser) {
      addStatus('You must be logged in to perform this action', 'error');
      return;
    }

    setIsUpdating(true);
    setStatus([]);
    setResults(null);

    try {
      addStatus('Starting Epic username update for all users...', 'info');
      
      const updateEpicUsernames = httpsCallable(functions, 'updateEpicUsernames');
      const result = await updateEpicUsernames();

      addStatus('Update completed successfully!', 'success');
      setResults(result.data);

      if (result.data.updated > 0) {
        addStatus(` Updated ${result.data.updated} usernames`, 'success');
      }
      
      if (result.data.errors > 0) {
        addStatus(` ${result.data.errors} errors occurred`, 'warning');
      }

      addStatus(` Total processed: ${result.data.processed}/${result.data.totalUsers}`, 'info');

    } catch (error) {
      console.error('Error updating Epic usernames:', error);
      addStatus(`Error: ${error.message}`, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCheckSpecificUser = async () => {
    if (!currentUser) {
      addStatus('You must be logged in to perform this action', 'error');
      return;
    }

    if (!targetUserId.trim()) {
      addStatus('Please enter a user ID to check', 'error');
      return;
    }

    setIsCheckingUser(true);
    setStatus([]);
    setResults(null);

    try {
      addStatus(`Checking Epic username for user: ${targetUserId}`, 'info');
      
      const checkUserEpicUsername = httpsCallable(functions, 'checkUserEpicUsername');
      const result = await checkUserEpicUsername({ userId: targetUserId });

      addStatus('Check completed!', 'success');
      
      // Create a results object similar to the bulk update
      setResults({
        totalUsers: 1,
        processed: 1,
        updated: result.data.updated ? 1 : 0,
        errors: result.data.error ? 1 : 0,
        results: [result.data]
      });

      if (result.data.updated) {
        addStatus(` Username updated: ${result.data.oldUsername} → ${result.data.newUsername}`, 'success');
      } else if (result.data.error) {
        addStatus(` Error: ${result.data.error}`, 'error');
      } else {
        addStatus(` No update needed: ${result.data.reason}`, 'info');
      }

    } catch (error) {
      console.error('Error checking user Epic username:', error);
      addStatus(`Error: ${error.message}`, 'error');
    } finally {
      setIsCheckingUser(false);
    }
  };

  return (
    <Container>
      <Title>Epic Username Verification & Sync</Title>
      <Description>
        This tool verifies and syncs Epic usernames with Yunite's auto-updated data. 
        Since Yunite automatically updates usernames daily, this primarily ensures our database stays in sync.
      </Description>

      <InfoBox>
        <h4> Important Information</h4>
        <p>
          <strong>Yunite Auto-Updates:</strong> According to Yunite documentation, Epic usernames are automatically updated daily for verified Discord users. 
          Most checks will show "unchanged" results, which is expected and indicates Yunite is keeping usernames current.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          <strong>Use Cases:</strong> Manual verification after user reports, audit checks, or syncing users who may not be properly verified in Discord.
        </p>
      </InfoBox>

      <ButtonContainer>
        <ActionButton 
          onClick={handleUpdateAllUsers} 
          disabled={isUpdating}
        >
          {isUpdating ? 'Syncing All Users...' : 'Sync All Epic Usernames'}
        </ActionButton>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <UserIdInput
            type="text"
            placeholder="Enter User ID to check"
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            disabled={isCheckingUser}
          />
          <ActionButton 
            onClick={handleCheckSpecificUser} 
            disabled={isCheckingUser || !targetUserId.trim()}
          >
            {isCheckingUser ? 'Checking...' : 'Check User'}
          </ActionButton>
        </div>
      </ButtonContainer>

      {status.length > 0 && (
        <StatusContainer>
          <h3 style={{ color: '#00BFFF', marginBottom: '1rem' }}>Status Log</h3>
          {status.map((item, index) => (
            <StatusText key={index} type={item.type}>
              {item.message}
            </StatusText>
          ))}
        </StatusContainer>
      )}

      {results && (
        <ResultsContainer>
          <h3 style={{ color: '#00BFFF', marginBottom: '1rem' }}>
            Results Summary
          </h3>
          
          <div style={{ marginBottom: '1rem', color: '#b8c1ec' }}>
            <strong>Total Users Processed:</strong> {results.processed}/{results.totalUsers}<br/>
            <strong>Usernames Updated:</strong> {results.updated}<br/>
            <strong>Errors:</strong> {results.errors}<br/>
            {results.timestamp && (
              <>
                <strong>Completed At:</strong> {new Date(results.timestamp).toLocaleString()}
              </>
            )}
          </div>

          <h4 style={{ color: '#00BFFF', marginBottom: '0.5rem' }}>Individual Results:</h4>
          
          {results.results?.map((result, index) => (
            <ResultItem 
              key={index}
              updated={result.updated}
              error={result.error}
              needsAttention={result.needsAttention}
            >
              <div style={{ color: '#b8c1ec', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                User ID: {result.userId}
              </div>
              
              {result.updated && (
                <div style={{ color: '#2ed573' }}>
                   Updated: {result.oldUsername} → {result.newUsername}
                  <div style={{ fontSize: '0.8rem', color: '#b8c1ec' }}>
                    Method: {result.updateMethod}
                  </div>
                </div>
              )}
              
              {result.error && (
                <div style={{ color: '#ff4757' }}>
                   Error: {result.error}
                </div>
              )}
              
              {result.needsAttention && (
                <div style={{ color: '#ffa502' }}>
                   Needs Attention: {result.reason}
                  {result.currentUsername && (
                    <div style={{ fontSize: '0.8rem', color: '#b8c1ec' }}>
                      Current username: {result.currentUsername}
                    </div>
                  )}
                </div>
              )}
              
              {!result.updated && !result.error && !result.needsAttention && (
                <div style={{ color: '#b8c1ec' }}>
                   {result.reason}
                  {result.currentUsername && (
                    <div style={{ fontSize: '0.8rem' }}>
                      Username: {result.currentUsername}
                    </div>
                  )}
                </div>
              )}
            </ResultItem>
          ))}
        </ResultsContainer>
      )}
    </Container>
  );
};

export default AdminEpicUsernameUpdater; 