import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_PUBLISHABLE_KEY } from '../stripe/config';
import CoinStore from '../components/CoinStore';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';

// Initialize Stripe
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
  padding: 2rem;
`;

const PageHeader = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 1rem;
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: #ccc;
  max-width: 600px;
  margin: 0 auto;
`;

const ContentSection = styled.div`
  max-width: 900px;
  margin: 0 auto;
`;

const InfoCard = styled.div`
  background: rgba(0, 0, 0, 0.2);
  border-radius: 16px;
  padding: 2rem;
  margin-top: 2rem;
`;

const InfoTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #4facfe;
`;

const InfoItem = styled.div`
  margin-bottom: 1.5rem;
`;

const PricingTable = styled.div`
  margin-top: 2rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 16px;
  padding: 2rem;
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: #4facfe;
`;

const Td = styled.td`
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const BonusHighlight = styled.span`
  color: #ff6b6b;
  font-weight: bold;
`;

const SavingsNote = styled.div`
  background: rgba(255, 153, 0, 0.1);
  border-left: 3px solid #ff9900;
  padding: 1rem;
  margin-top: 1.5rem;
  border-radius: 6px;
`;

const LoginPrompt = styled.div`
  text-align: center;
  padding: 3rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  margin: 2rem auto;
  max-width: 600px;
`;

const LoginButton = styled.button`
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(79, 172, 254, 0.4);
  }
`;

// Add styled components for tabs and tooltip
const Tabs = styled.div`
  display: flex;
  gap: 1.2rem;
  margin: 2.5rem 0 1.5rem 0;
  justify-content: center;
`;
const TabButton = styled.button`
  background: ${props => props.active ? 'linear-gradient(90deg, #A259F7 0%, #00FFD0 100%)' : 'rgba(255,255,255,0.08)'};
  color: ${props => props.active ? '#18122B' : '#fff'};
  border: none;
  border-radius: 1.5rem;
  padding: 0.7rem 2.2rem;
  font-size: 1.1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  box-shadow: ${props => props.active ? '0 0 16px #A259F7, 0 0 8px #00FFD0' : 'none'};
  cursor: pointer;
  transition: all 0.2s;
`;
const TabPanel = styled.div`
  margin-bottom: 2.5rem;
`;
const Tooltip = styled.span`
  position: relative;
  display: inline-block;
  cursor: pointer;
  color: #00FFD0;
  font-weight: 700;
  margin-left: 0.3rem;
  &:hover .tooltiptext {
    visibility: visible;
    opacity: 1;
  }
`;
const TooltipText = styled.span`
  visibility: hidden;
  width: 220px;
  background: #18122B;
  color: #fff;
  text-align: left;
  border-radius: 8px;
  padding: 0.7rem 1rem;
  position: absolute;
  z-index: 10;
  bottom: 125%;
  left: 50%;
  margin-left: -110px;
  opacity: 0;
  transition: opacity 0.2s;
  font-size: 0.95rem;
  box-shadow: 0 0 16px #A259F7;
`;

const CoinPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const notification = useNotification();
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [activeTab, setActiveTab] = useState('how');
  
  // Handle PayPal redirect return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const canceled = params.get('canceled');
    
    if (success === 'true') {
      setPaymentStatus('success');
      setPaymentMessage('Payment successful! Your coins have been added to your account.');
      notification.addNotification('Payment successful! Your coins have been added to your account.', 'success');
      
      // Clean up URL parameters
      window.history.replaceState({}, document.title, '/coins');
    } else if (canceled === 'true') {
      setPaymentStatus('canceled');
      setPaymentMessage('Payment was canceled.');
      notification.addNotification('Payment was canceled.', 'info');
      
      // Clean up URL parameters
      window.history.replaceState({}, document.title, '/coins');
    }
  }, []);
  
  return (
    <Container>
      <PageHeader>
        <Title>Coin Economy</Title>
        <Subtitle>Purchase virtual coins to enter matches and compete for real money prizes</Subtitle>
      </PageHeader>
      
      <ContentSection>
        {paymentStatus === 'success' && (
          <InfoCard style={{ background: 'rgba(81, 207, 102, 0.1)', borderLeft: '3px solid #51cf66' }}>
            <InfoTitle style={{ color: '#51cf66' }}>Payment Successful</InfoTitle>
            <InfoItem>
              <p>{paymentMessage}</p>
            </InfoItem>
          </InfoCard>
        )}
        
        {paymentStatus === 'canceled' && (
          <InfoCard style={{ background: 'rgba(255, 107, 107, 0.1)', borderLeft: '3px solid #ff6b6b' }}>
            <InfoTitle style={{ color: '#ff6b6b' }}>Payment Canceled</InfoTitle>
            <InfoItem>
              <p>{paymentMessage}</p>
            </InfoItem>
          </InfoCard>
        )}
        
        {!currentUser ? (
          <LoginPrompt>
            <h2>Please log in to purchase coins</h2>
            <p>You need to be logged in to buy coins and participate in matches.</p>
            <LoginButton onClick={() => navigate('/login')}>Log In</LoginButton>
          </LoginPrompt>
        ) : (
          <Elements stripe={stripePromise}>
            <CoinStore />
          </Elements>
        )}
        
        {/* Tabs for info blocks */}
        <Tabs>
          <TabButton active={activeTab === 'how'} onClick={() => setActiveTab('how')}>
            <span role="img" aria-label="info"></span> How it Works
          </TabButton>
          <TabButton active={activeTab === 'pricing'} onClick={() => setActiveTab('pricing')}>
            <span role="img" aria-label="coins"></span> Pricing Table
          </TabButton>
          <TabButton active={activeTab === 'withdrawal'} onClick={() => setActiveTab('withdrawal')}>
            <span role="img" aria-label="withdraw"></span> Withdrawal System
          </TabButton>
        </Tabs>
        <TabPanel style={{ display: activeTab === 'how' ? 'block' : 'none' }}>
          <InfoCard>
            <InfoTitle>How Our Coin System Works</InfoTitle>
            <InfoItem>
              <p>• Coins are the virtual currency used on our platform.</p>
              <p>• Purchase coins with real money and use them to enter matches.</p>
              <p>• Win more coins by winning your matches.</p>
              <p>• Only coins won through matches can be withdrawn for real money.</p>
              <p>• Purchased coins can only be used for matches and tips, not for withdrawal.</p>
            </InfoItem>
          </InfoCard>
        </TabPanel>
        <TabPanel style={{ display: activeTab === 'pricing' ? 'block' : 'none' }}>
          <PricingTable>
            <InfoTitle>Coin Pricing Table</InfoTitle>
            <Table>
              <thead>
                <tr>
                  <Th>Package</Th>
                  <Th>Price (USD)</Th>
                  <Th>Bonus Coins</Th>
                  <Th>Total Coins</Th>
                  <Th>Effective Price/Coin</Th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <Td>5 Coins</Td>
                  <Td>$4.75</Td>
                  <Td>0</Td>
                  <Td>5 Coins</Td>
                  <Td>$0.95</Td>
                </tr>
                <tr>
                  <Td>10 Coins</Td>
                  <Td>$9.00</Td>
                  <Td><BonusHighlight>+1</BonusHighlight></Td>
                  <Td>11 Coins</Td>
                  <Td>$0.82</Td>
                </tr>
                <tr>
                  <Td>25 Coins</Td>
                  <Td>$22.00</Td>
                  <Td><BonusHighlight>+3</BonusHighlight></Td>
                  <Td>28 Coins</Td>
                  <Td>$0.78</Td>
                </tr>
                <tr>
                  <Td>50 Coins</Td>
                  <Td>$42.00</Td>
                  <Td><BonusHighlight>+7</BonusHighlight></Td>
                  <Td>57 Coins</Td>
                  <Td>$0.74</Td>
                </tr>
                <tr>
                  <Td>100 Coins</Td>
                  <Td>$80.00</Td>
                  <Td><BonusHighlight>+15</BonusHighlight></Td>
                  <Td>115 Coins</Td>
                  <Td>$0.70</Td>
                </tr>
              </tbody>
            </Table>
            
            <SavingsNote>
              <span role="img" aria-label="fire"></span> This pricing structure incentivizes bulk purchases through bonus coins, offering up to 30% more value compared to competitors.
            </SavingsNote>
          </PricingTable>
        </TabPanel>
        <TabPanel style={{ display: activeTab === 'withdrawal' ? 'block' : 'none' }}>
          <InfoCard>
            <InfoTitle>Withdrawal System</InfoTitle>
            <InfoItem>
              <p>• Only coins won through matches can be withdrawn.</p>
              <p>• Minimum withdrawal amount: $5.00 in match-earned coins (5 coins).</p>
              <p>• Fee structure: 5% of total withdrawal amount
                <Tooltip>
                  ⓘ<TooltipText>5% fee is applied to all withdrawals. There is a minimum fee of $0.25 per withdrawal.</TooltipText>
                </Tooltip>
              </p>
              <p>• Minimum fee: $0.25 per withdrawal.</p>
            </InfoItem>
            
            <Table>
              <thead>
                <tr>
                  <Th>Withdrawal</Th>
                  <Th>5% Fee</Th>
                  <Th>Applied Fee</Th>
                  <Th>User Gets</Th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <Td>$3.00</Td>
                  <Td>$0.09</Td>
                  <Td>$0.25</Td>
                  <Td>$2.75</Td>
                </tr>
                <tr>
                  <Td>$10.00</Td>
                  <Td>$0.30</Td>
                  <Td>$0.30</Td>
                  <Td>$9.70</Td>
                </tr>
                <tr>
                  <Td>$50.00</Td>
                  <Td>$1.50</Td>
                  <Td>$1.50</Td>
                  <Td>$48.50</Td>
                </tr>
              </tbody>
            </Table>
          </InfoCard>
        </TabPanel>
      </ContentSection>
    </Container>
  );
};

export default CoinPage; 