import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { checkIfUserIsStreaming } from '../utils/twitchUtils';

const SectionContainer = styled.section`
  margin: 3rem auto 2rem auto;
  max-width: 1200px;
  padding: 2rem 1rem;
  background: rgba(44, 62, 80, 0.65);
  backdrop-filter: blur(18px);
  border-radius: 22px;
  box-shadow: 0 8px 32px 0 #A259F799, 0 0 24px #00FFD044;
  border: 2.5px solid #A259F7;
`;

const Title = styled.h2`
  font-size: 2.2rem;
  color: #fff;
  margin-bottom: 1.5rem;
  font-family: 'Inter', Arial, sans-serif;
  letter-spacing: 0.04em;
`;

const StreamsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
`;

const StreamCard = styled.div`
  background: rgba(162, 89, 247, 0.18);
  border-radius: 14px;
  padding: 1.4rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(.25,1.7,.45,.87);
  border: 2.5px solid #A259F7;
  box-shadow: 0 4px 16px #A259F744, 0 0 16px #00FFD044;
  &:hover {
    background: rgba(162, 89, 247, 0.28);
    transform: translateY(-6px) scale(1.03);
    box-shadow: 0 8px 32px #A259F799, 0 0 32px #00FFD044;
    border-color: #ff61e6;
  }
`;

const Thumbnail = styled.img`
  width: 100%;
  max-width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 1rem;
`;

const StreamTitle = styled.div`
  font-weight: 700;
  color: #fff;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
`;

const StreamMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 1.2rem;
  font-size: 1rem;
  color: #b8c1ec;
  margin-bottom: 0.5rem;
`;

const ViewerCount = styled.span`
  color: #f9d923;
  font-weight: 700;
`;

const Username = styled.span`
  color: #9146FF;
  font-weight: 600;
`;

const LiveBadge = styled.span`
  background: #f04747;
  color: #fff;
  font-size: 0.85rem;
  font-weight: 700;
  border-radius: 6px;
  padding: 2px 10px;
  margin-right: 0.7rem;
`;

const Loading = styled.div`
  color: #b8c1ec;
  text-align: center;
  padding: 2rem 0;
`;

const ErrorMsg = styled.div`
  color: #ff4757;
  text-align: center;
  padding: 2rem 0;
`;

const LiveStreamsContainer = styled.div`
  background: rgba(24, 28, 40, 0.45);
  backdrop-filter: blur(14px);
  border-radius: 18px;
  border: 1.5px solid rgba(255,255,255,0.13);
  box-shadow: 0 8px 32px 0 rgba(31,38,135,0.18);
`;

const getAllPublicStreamers = async () => {
  const db = getFirestore();
  const streamersRef = collection(db, 'public_streamers');
  const querySnapshot = await getDocs(streamersRef);
  const streamers = [];
  querySnapshot.forEach(docSnap => {
    const data = docSnap.data();
    if (data.twitchUsername) {
      streamers.push({
        id: docSnap.id,
        displayName: data.displayName,
        twitchUsername: data.twitchUsername,
        avatarUrl: data.avatarUrl,
        isLive: data.isLive,
      });
    }
  });
  return streamers;
};

const LiveStreamsSection = () => {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchLiveStreams = async () => {
      setLoading(true);
      setError(null);
      try {
        const users = await getAllPublicStreamers();
        // Check live status for each user in parallel
        const results = await Promise.all(
          users.map(async (user) => {
            const stream = await checkIfUserIsStreaming(user.twitchUsername);
            return stream.isLive
              ? {
                  ...user,
                  ...stream,
                }
              : null;
          })
        );
        // Filter only live streams and sort by viewer count
        const liveStreams = results.filter(Boolean).sort((a, b) => b.viewerCount - a.viewerCount);
        if (isMounted) setStreams(liveStreams);
      } catch (err) {
        if (isMounted) setError('Failed to load live streams.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchLiveStreams();
    // Optionally, refresh every 60 seconds
    const interval = setInterval(fetchLiveStreams, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (loading) return <Loading>Loading live streams...</Loading>;
  if (error) return <ErrorMsg>{error}</ErrorMsg>;

  return (
    <SectionContainer>
      <Title>Live Streams</Title>
      {streams.length === 0 ? (
        <Loading>No users are currently live. Check back soon!</Loading>
      ) : (
        <StreamsGrid>
          {streams.map((stream) => (
            <StreamCard key={stream.twitchUsername} onClick={() => window.open(`https://twitch.tv/${stream.twitchUsername}`, '_blank')}>
              {stream.thumbnailUrl && <Thumbnail src={stream.thumbnailUrl} alt="Stream thumbnail" />}
              <StreamMeta>
                <LiveBadge>LIVE</LiveBadge>
                <ViewerCount>{stream.viewerCount} viewers</ViewerCount>
                <Username>@{stream.twitchUsername}</Username>
              </StreamMeta>
              <StreamTitle>{stream.streamTitle || 'Live on Twitch'}</StreamTitle>
            </StreamCard>
          ))}
        </StreamsGrid>
      )}
    </SectionContainer>
  );
};

export default LiveStreamsSection; 