import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { collection, query, orderBy, limit, onSnapshot, getFirestore, where, getDoc, doc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/config';
import { useNavigate } from 'react-router-dom';

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

const Section = styled.div`
  margin-bottom: 2.5rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  color: #4facfe;
  margin-bottom: 1rem;
`;

const Table = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  overflow-x: auto;
  margin-bottom: 2rem;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  font-weight: 600;
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  align-items: center;
  font-size: 0.98rem;
`;

const Small = styled.span`
  color: #b8c1ec;
  font-size: 0.9em;
`;

const ErrorMsg = styled.div`
  color: #ff4757;
  margin-bottom: 1rem;
`;

const LoadingMsg = styled.div`
  color: #4facfe;
  margin-bottom: 1rem;
`;

const AdminWagerDebug = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Wager feed
  const [wagers, setWagers] = useState([]);
  const [loadingWagers, setLoadingWagers] = useState(true);
  const [wagersError, setWagersError] = useState('');

  // User stats
  const [userStats, setUserStats] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    const checkAdmin = async () => {
      try {
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists() && userDoc.data().isAdmin) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
        setLoading(false);
      } catch (err) {
        setError('Failed to check admin status.');
        setIsAdmin(false);
        setLoading(false);
      }
    };
    checkAdmin();
  }, [currentUser]);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/');
    }
  }, [loading, isAdmin, navigate]);

  // Real-time wagers feed (recently completed)
  useEffect(() => {
    if (!isAdmin) return;
    setLoadingWagers(true);
    setWagersError('');
    const db = getFirestore();
    const q = query(
      collection(db, 'wagers'),
      where('status', 'in', ['completed', 'concluded', 'finished']),
      orderBy('updatedAt', 'desc'),
      limit(20)
    );
    const unsub = onSnapshot(q, (snap) => {
      setWagers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingWagers(false);
    }, (err) => {
      setWagersError('Failed to load wagers: ' + err.message);
      setLoadingWagers(false);
    });
    return () => unsub();
  }, [isAdmin]);

  // Real-time userStats feed
  useEffect(() => {
    if (!isAdmin) return;
    setLoadingStats(true);
    setStatsError('');
    const db = getFirestore();
    const q = query(collection(db, 'userStats'));
    const unsub = onSnapshot(q, (snap) => {
      setUserStats(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingStats(false);
    }, (err) => {
      setStatsError('Failed to load user stats: ' + err.message);
      setLoadingStats(false);
    });
    return () => unsub();
  }, [isAdmin]);

  if (loading) return <Container><Header>Wager Debug</Header><LoadingMsg>Checking admin status...</LoadingMsg></Container>;
  if (!isAdmin) return <Container><Header>Wager Debug</Header><ErrorMsg>Access denied.</ErrorMsg></Container>;

  return (
    <Container>
      <Header>Wager Debug</Header>
      <Section>
        <SectionTitle>Recent Concluded Wagers</SectionTitle>
        {loadingWagers && <LoadingMsg>Loading wagers...</LoadingMsg>}
        {wagersError && <ErrorMsg>{wagersError}</ErrorMsg>}
        <Table>
          <TableHeader>
            <div>Wager ID</div>
            <div>Participants</div>
            <div>Winner</div>
            <div>Status</div>
            <div>Amount</div>
            <div>Updated At</div>
            <div>Rewarded?</div>
          </TableHeader>
          {wagers.map(wager => (
            <TableRow key={wager.id}>
              <div><Small>{wager.id}</Small></div>
              <div>{Array.isArray(wager.participants) ? wager.participants.join(', ') : (wager.participants || '-')}</div>
              <div>{wager.winner || '-'}</div>
              <div>{wager.status}</div>
              <div>{wager.amount || '-'}</div>
              <div>{wager.updatedAt && wager.updatedAt.seconds ? new Date(wager.updatedAt.seconds * 1000).toLocaleString() : '-'}</div>
              <div>{wager.rewardsProcessed ? 'Yes' : 'No'}</div>
            </TableRow>
          ))}
          {(!loadingWagers && wagers.length === 0) && (
            <TableRow><div colSpan={7}>No recent concluded wagers found.</div></TableRow>
          )}
        </Table>
      </Section>
      <Section>
        <SectionTitle>User Stats (Live)</SectionTitle>
        {loadingStats && <LoadingMsg>Loading user stats...</LoadingMsg>}
        {statsError && <ErrorMsg>{statsError}</ErrorMsg>}
        <Table>
          <TableHeader>
            <div>User ID</div>
            <div>Matches Played</div>
            <div>Wins</div>
            <div>Losses</div>
            <div>Win Rate</div>
            <div>Total Earnings</div>
            <div>Last Updated</div>
          </TableHeader>
          {userStats.map(stat => (
            <TableRow key={stat.id}>
              <div><Small>{stat.id}</Small></div>
              <div>{stat.matchesPlayed ?? '-'}</div>
              <div>{stat.matchesWon ?? '-'}</div>
              <div>{stat.matchesLost ?? '-'}</div>
              <div>{stat.winRate !== undefined ? ((stat.winRate * 100).toFixed(1) + '%') : '-'}</div>
              <div>{stat.totalEarnings ?? '-'}</div>
              <div>{stat.updatedAt && stat.updatedAt.seconds ? new Date(stat.updatedAt.seconds * 1000).toLocaleString() : '-'}</div>
            </TableRow>
          ))}
          {(!loadingStats && userStats.length === 0) && (
            <TableRow><div colSpan={7}>No user stats found.</div></TableRow>
          )}
        </Table>
      </Section>
    </Container>
  );
};

export default AdminWagerDebug; 