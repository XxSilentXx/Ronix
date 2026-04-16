import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { FEE_CONFIG } from '../utils/feeUtils';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
  padding: 2rem;
`;

const PageTitle = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: #fff;
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const StatLabel = styled.div`
  color: #ccc;
  font-size: 1rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 2rem;
`;

const Th = styled.th`
  background: #4facfe;
  color: #fff;
  padding: 1rem;
  text-align: left;
`;

const Td = styled.td`
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem;
`;

const Section = styled.div`
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #4facfe;
`;

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Tab = styled.div`
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  color: ${props => props.active ? '#4facfe' : '#ccc'};
  border-bottom: 2px solid ${props => props.active ? '#4facfe' : 'transparent'};
  font-weight: ${props => props.active ? 'bold' : 'normal'};
`;

const DonutChart = styled.div`
  position: relative;
  width: 200px;
  height: 200px;
  margin: 0 auto;
  border-radius: 50%;
  background: conic-gradient(
    ${props => props.segments}
  );
`;

const ChartLegend = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 1.5rem;
  gap: 1rem;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  margin-right: 1rem;
`;

const LegendColor = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 3px;
  background-color: ${props => props.color};
  margin-right: 8px;
`;

function AdminEarnings() {
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    wagerFees: 0,
    withdrawalFees: 0,
    tipFees: 0,
    otherFees: 0
  });
  const [activeTab, setActiveTab] = useState('all');
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      
      // Get site earnings from the siteEarnings collection
      const earningsCollection = collection(db, 'siteEarnings');
      const earningsQuery = query(earningsCollection, orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(earningsQuery);
      
      let earningsData = [];
      let totalEarnings = 0;
      let wagerFees = 0;
      let withdrawalFees = 0;
      let tipFees = 0;
      let otherFees = 0;
      
      snapshot.forEach(doc => {
        const data = {
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        };
        
        earningsData.push(data);
        
        // Update totals based on fee type
        const amount = data.amount || 0;
        totalEarnings += amount;
        
        if (data.type === 'wager_fee') {
          wagerFees += amount;
        } else if (data.type === 'withdrawal_fee') {
          withdrawalFees += amount;
        } else if (data.type === 'tip_fee') {
          tipFees += amount;
        } else {
          otherFees += amount;
        }
      });
      
      setEarnings(earningsData);
      setStats({
        total: totalEarnings,
        wagerFees,
        withdrawalFees,
        tipFees,
        otherFees
      });
      
    } catch (error) {
      console.error('Error fetching site earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEarnings = activeTab === 'all'
    ? earnings
    : earnings.filter(item => item.type === `${activeTab}_fee`);

  // Prepare chart data
  const chartData = [
    { label: 'Wager Fees', value: stats.wagerFees, color: '#4facfe' },
    { label: 'Withdrawal Fees', value: stats.withdrawalFees, color: '#51cf66' },
    { label: 'Tip Fees', value: stats.tipFees, color: '#fd7e14' },
    { label: 'Other Fees', value: stats.otherFees, color: '#868e96' }
  ].filter(item => item.value > 0);

  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);
  
  let currentAngle = 0;
  const chartSegments = chartData.map(item => {
    const startAngle = currentAngle;
    const angle = (item.value / totalValue) * 360;
    currentAngle += angle;
    return {
      ...item,
      startAngle,
      endAngle: currentAngle,
      percentage: (item.value / totalValue) * 100
    };
  });
  
  const segmentsCSS = chartSegments.map(segment => 
    `${segment.color} ${segment.startAngle}deg ${segment.endAngle}deg`
  ).join(', ');

  return (
    <Container>
      <PageTitle>Site Earnings</PageTitle>
      
      <StatsContainer>
        <StatCard>
          <StatValue>{stats.total.toLocaleString()}</StatValue>
          <StatLabel>Total Tokens Earned</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.wagerFees.toLocaleString()}</StatValue>
          <StatLabel>Wager Fees ({FEE_CONFIG.wager * 100}%)</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.withdrawalFees.toLocaleString()}</StatValue>
          <StatLabel>Withdrawal Fees ({FEE_CONFIG.withdrawal * 100}%)</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.tipFees.toLocaleString()}</StatValue>
          <StatLabel>Tip Fees ({FEE_CONFIG.tip * 100}%)</StatLabel>
        </StatCard>
      </StatsContainer>
      
      <Section>
        <SectionTitle>Earnings Breakdown</SectionTitle>
        {totalValue > 0 ? (
          <>
            <DonutChart segments={segmentsCSS} />
            <ChartLegend>
              {chartSegments.map(segment => (
                <LegendItem key={segment.label}>
                  <LegendColor color={segment.color} />
                  <span>{segment.label}: {segment.percentage.toFixed(1)}% ({segment.value.toLocaleString()} tokens)</span>
                </LegendItem>
              ))}
            </ChartLegend>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem' }}>No earnings data available</div>
        )}
      </Section>
      
      <Section>
        <SectionTitle>Fee Transactions</SectionTitle>
        
        <TabContainer>
          <Tab active={activeTab === 'all'} onClick={() => setActiveTab('all')}>
            All Fees
          </Tab>
          <Tab active={activeTab === 'wager'} onClick={() => setActiveTab('wager')}>
            Wager Fees
          </Tab>
          <Tab active={activeTab === 'withdrawal'} onClick={() => setActiveTab('withdrawal')}>
            Withdrawal Fees
          </Tab>
          <Tab active={activeTab === 'tip'} onClick={() => setActiveTab('tip')}>
            Tip Fees
          </Tab>
        </TabContainer>
        
        <Table>
          <thead>
            <tr>
              <Th>Date</Th>
              <Th>Type</Th>
              <Th>Amount</Th>
              <Th>User ID</Th>
              <Th>Source ID</Th>
              <Th>Fee %</Th>
            </tr>
          </thead>
          <tbody>
            {filteredEarnings.map(earning => (
              <tr key={earning.id}>
                <Td>{earning.timestamp.toLocaleString()}</Td>
                <Td>{earning.type ? earning.type.replace('_fee', '').toUpperCase() : ''}</Td>
                <Td>{earning.amount} tokens</Td>
                <Td>{earning.sourceUserId?.substring(0, 8)}...</Td>
                <Td>
                  {earning.sourceRequestId || earning.sourceWagerId || earning.sourceTipId || '-'}
                </Td>
                <Td>{earning.feePercent ? `${(earning.feePercent * 100).toFixed(1)}%` : '-'}</Td>
              </tr>
            ))}
            {filteredEarnings.length === 0 && !loading && (
              <tr>
                <Td colSpan={6} style={{ textAlign: 'center' }}>No transactions found</Td>
              </tr>
            )}
            {loading && (
              <tr>
                <Td colSpan={6} style={{ textAlign: 'center' }}>Loading...</Td>
              </tr>
            )}
          </tbody>
        </Table>
      </Section>
    </Container>
  );
}

export default AdminEarnings; 