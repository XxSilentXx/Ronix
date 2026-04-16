import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { checkIfUserIsStreaming } from '../utils/twitchUtils';

const StreamStatusContainer = styled.div`
  display: flex;
  align-items: center;
  background: rgba(145, 70, 255, 0.2);
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(145, 70, 255, 0.3);
    transform: translateY(-2px);
  }
`;

const LiveIndicator = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #f04747;
  margin-right: 10px;
  position: relative;
  
  &:before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    border-radius: 50%;
    background-color: rgba(240, 71, 71, 0.4);
    animation: pulse 1.5s infinite;
  }
  
  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 0.8;
    }
    70% {
      transform: scale(1.5);
      opacity: 0;
    }
    100% {
      transform: scale(1);
      opacity: 0;
    }
  }
`;

const StreamInfo = styled.div`
  flex: 1;
`;

const StreamTitle = styled.div`
  font-weight: 600;
  color: white;
  margin-bottom: 4px;
`;

const ViewerCount = styled.div`
  font-size: 0.8rem;
  color: #b8c1ec;
`;

const ThumbnailContainer = styled.div`
  width: 80px;
  height: 45px;
  overflow: hidden;
  border-radius: 4px;
  margin-left: 10px;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const TwitchStreamStatus = ({ twitchUsername }) => {
  const [streamData, setStreamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const checkStreamStatus = async () => {
      if (!twitchUsername) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const data = await checkIfUserIsStreaming(twitchUsername);
        setStreamData(data);
        setError(null);
      } catch (err) {
        console.error('Error checking stream status:', err);
        setError('Failed to check stream status');
      } finally {
        setLoading(false);
      }
    };
    
    checkStreamStatus();
    
    // Check every 60 seconds if the user is still streaming
    const interval = setInterval(checkStreamStatus, 60000);
    
    return () => clearInterval(interval);
  }, [twitchUsername]);
  
  const handleClick = () => {
    if (streamData?.isLive && twitchUsername) {
      window.open(`https://twitch.tv/${twitchUsername}`, '_blank');
    }
  };
  
  if (loading) {
    return <div>Checking stream status...</div>;
  }
  
  if (error) {
    return <div>Error: {error}</div>;
  }
  
  if (!streamData || !streamData.isLive) {
    return null; // Don't show anything if not streaming
  }
  
  return (
    <StreamStatusContainer onClick={handleClick}>
      <LiveIndicator />
      <StreamInfo>
        <StreamTitle>{streamData.streamTitle || 'Live on Twitch'}</StreamTitle>
        <ViewerCount>{streamData.viewerCount} viewers</ViewerCount>
      </StreamInfo>
      {streamData.thumbnailUrl && (
        <ThumbnailContainer>
          <img src={streamData.thumbnailUrl} alt="Stream thumbnail" />
        </ThumbnailContainer>
      )}
    </StreamStatusContainer>
  );
};

export default TwitchStreamStatus; 