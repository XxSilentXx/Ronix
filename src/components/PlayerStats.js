import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getPlayerStatsByUsername } from '../firebase/fortniteApi';

const StatsContainer = styled.div`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 1.5rem;
  margin-top: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const StatsTabs = styled.div`
  display: flex;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 1.5rem;
`;

const StatsTab = styled.div`
  padding: 0.5rem 1rem;
  cursor: pointer;
  color: ${props => props.active ? '#4facfe' : '#b8c1ec'};
  border-bottom: 2px solid ${props => props.active ? '#4facfe' : 'transparent'};
  font-weight: ${props => props.active ? '600' : '400'};
  transition: all 0.3s ease;
  
  &:hover {
    color: ${props => props.active ? '#4facfe' : '#fff'};
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
`;

const StatItem = styled.div`
  text-align: center;
  
  h4 {
    font-size: 1.8rem;
    margin-bottom: 0.3rem;
    background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 700;
  }
  
  p {
    color: #b8c1ec;
    font-size: 0.9rem;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #b8c1ec;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #ff4757;
`;

const PlayerStats = ({ initialUsername, onPlayerFound }) => {
  const [username, setUsername] = useState(initialUsername || '');
  const [playerStats, setPlayerStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overall');
  
  const fetchStats = async (usernameToFetch) => {
    if (!usernameToFetch) return;
    
    setLoading(true);
    setError('');
    
    try {
      // This is where you'd make an API call to get Fortnite stats
      // For now, we'll use mock data
      console.log(`Fetching stats for ${usernameToFetch}...`);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock data - in a real app, replace this with actual API call
      const mockStats = {
        overall: {
          wins: Math.floor(Math.random() * 500),
          matches: Math.floor(Math.random() * 2000) + 500,
          winRate: (Math.random() * 30).toFixed(1),
          kills: Math.floor(Math.random() * 10000) + 1000,
          kd: (Math.random() * 5 + 1).toFixed(2)
        },
        solo: {
          wins: Math.floor(Math.random() * 200),
          matches: Math.floor(Math.random() * 800) + 200,
          winRate: (Math.random() * 25).toFixed(1),
          kills: Math.floor(Math.random() * 4000) + 500,
          kd: (Math.random() * 4 + 0.5).toFixed(2)
        },
        duo: {
          wins: Math.floor(Math.random() * 150),
          matches: Math.floor(Math.random() * 600) + 150,
          winRate: (Math.random() * 20).toFixed(1),
          kills: Math.floor(Math.random() * 3000) + 400,
          kd: (Math.random() * 3.5 + 0.5).toFixed(2)
        },
        squad: {
          wins: Math.floor(Math.random() * 250),
          matches: Math.floor(Math.random() * 900) + 250,
          winRate: (Math.random() * 35).toFixed(1),
          kills: Math.floor(Math.random() * 5000) + 600,
          kd: (Math.random() * 4.5 + 0.5).toFixed(2)
        }
      };
      
      setPlayerStats(mockStats);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load stats. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Add refresh function that can be called from outside
  useEffect(() => {
    // Make the refresh function available globally
    if (typeof window !== 'undefined') {
      window.refreshPlayerStats = (newUsername) => {
        console.log('Refreshing player stats for:', newUsername);
        setUsername(newUsername);
        fetchStats(newUsername);
      };
    }
    
    // Cleanup
    return () => {
      if (typeof window !== 'undefined') {
        delete window.refreshPlayerStats;
      }
    };
  }, []);

  // Fetch stats when username changes or component mounts
  useEffect(() => {
    if (username) {
      fetchStats(username);
    }
  }, [username]);
  
  if (loading) {
    return (
      <StatsContainer>
        <LoadingMessage>Loading stats for {username}...</LoadingMessage>
      </StatsContainer>
    );
  }
  
  if (error) {
    return (
      <StatsContainer>
        <ErrorMessage>{error}</ErrorMessage>
      </StatsContainer>
    );
  }
  
  if (!playerStats) {
    return null;
  }
  
  const stats = playerStats[activeTab];
  
  return (
    <StatsContainer>
      <StatsTabs>
        <StatsTab 
          active={activeTab === 'overall'} 
          onClick={() => setActiveTab('overall')}
        >
          Overall
        </StatsTab>
        <StatsTab 
          active={activeTab === 'solo'} 
          onClick={() => setActiveTab('solo')}
        >
          Solo
        </StatsTab>
        <StatsTab 
          active={activeTab === 'duo'} 
          onClick={() => setActiveTab('duo')}
        >
          Duo
        </StatsTab>
        <StatsTab 
          active={activeTab === 'squad'} 
          onClick={() => setActiveTab('squad')}
        >
          Squad
        </StatsTab>
      </StatsTabs>
      
      <StatsGrid>
        <StatItem>
          <h4>{stats.wins}</h4>
          <p>Wins</p>
        </StatItem>
        <StatItem>
          <h4>{stats.matches}</h4>
          <p>Matches</p>
        </StatItem>
        <StatItem>
          <h4>{stats.winRate}%</h4>
          <p>Win Rate</p>
        </StatItem>
        <StatItem>
          <h4>{stats.kills}</h4>
          <p>Kills</p>
        </StatItem>
        <StatItem>
          <h4>{stats.kd}</h4>
          <p>K/D Ratio</p>
        </StatItem>
      </StatsGrid>
    </StatsContainer>
  );
};

export default PlayerStats; 