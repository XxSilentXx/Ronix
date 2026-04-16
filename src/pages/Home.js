import React, { useState } from 'react';
import styled from 'styled-components';
import GetStartedModal from '../components/GetStartedModal';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import LiveStreamsSection from '../components/LiveStreamsSection';

const HomeContainer = styled.div`
  min-height: 100vh;
  background: #131124;
  color: #fff;
  padding: 2rem 0;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: url('https://fortnite-api.com/images/cosmetics/br/character_default.png') no-repeat right bottom/auto 60vh, url('https://fortnite-api.com/images/cosmetics/br/backpack_default.png') no-repeat left 40%/auto 40vh;
    opacity: 0.12;
    z-index: 0;
    pointer-events: none;
  }
`;

const HeroSection = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 5rem 1rem 3rem 1rem;
  position: relative;
  z-index: 1;
  
  h1 {
    font-size: 4.2rem;
    margin-bottom: 1.2rem;
    background: linear-gradient(90deg, #4facfe 0%, #ff61e6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-family: 'Inter', Arial, sans-serif;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-shadow: 0 4px 24px #4facfe88;
    animation: bounce 1.2s cubic-bezier(.25,1.7,.45,.87);
  }
  
  p {
    font-size: 1.4rem;
    max-width: 800px;
    margin-bottom: 2.5rem;
    color: #b8c1ec;
    font-weight: 600;
    text-shadow: 0 2px 8px #2b105555;
  }
`;

const CTAButton = styled.button`
  background: linear-gradient(90deg, #4facfe 0%, #ff61e6 100%);
  color: #fff;
  border: none;
  padding: 1.2rem 3rem;
  font-size: 1.5rem;
  font-family: 'Inter', Arial, sans-serif;
  font-weight: 900;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(.25,1.7,.45,.87);
  box-shadow: 0 0 32px #4facfe99;
  letter-spacing: 0.04em;
  text-shadow: 0 2px 8px #00f2fe55;
  animation: bounce 1.2s cubic-bezier(.25,1.7,.45,.87) 0.2s;
  
  &:hover {
    transform: translateY(-6px) scale(1.05) rotate(-2deg);
    box-shadow: 0 0 48px #ff61e6cc, 0 0 64px #00f2fe99;
    background: linear-gradient(90deg, #ff61e6 0%, #4facfe 100%);
  }
`;

const FeaturesSection = styled.section`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2.5rem;
  padding: 3rem 1rem 2rem 1rem;
  position: relative;
  z-index: 1;
`;

const FloatingTokens = styled.div`
  pointer-events: none;
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;

  .token {
    position: absolute;
    width: 32px;
    height: 32px;
    background: radial-gradient(circle, #A259F7 60%, #18122B 100%);
    border-radius: 50%;
    opacity: 0.18;
    animation: floatToken 12s linear infinite;
  }
  .token2 {
    background: radial-gradient(circle, #00FFD0 60%, #18122B 100%);
    opacity: 0.13;
    animation-duration: 16s;
  }
  .token3 {
    background: radial-gradient(circle, #FF61E6 60%, #18122B 100%);
    opacity: 0.15;
    animation-duration: 20s;
  }
  @keyframes floatToken {
    0% { transform: translateY(100vh) scale(0.8) rotate(0deg); }
    100% { transform: translateY(-10vh) scale(1.1) rotate(360deg); }
  }
`;

const TrustBadge = styled.div`
  margin: 2.5rem auto 0 auto;
  background: rgba(162, 89, 247, 0.18);
  color: #fff;
  border-radius: 2rem;
  padding: 1.1rem 2.5rem;
  font-size: 1.25rem;
  font-family: 'Inter', Arial, sans-serif;
  font-weight: 700;
  letter-spacing: 0.04em;
  box-shadow: 0 0 24px #A259F744, 0 0 8px #00FFD044;
  border: 2px solid #A259F7;
  text-align: center;
  width: fit-content;
`;

const FeatureCard = styled.div`
  background: rgba(44, 62, 80, 0.65);
  backdrop-filter: blur(18px);
  border-radius: 22px;
  padding: 2.5rem 1.7rem 2rem 1.7rem;
  transition: all 0.3s cubic-bezier(.25,1.7,.45,.87);
  border: 2.5px solid #A259F7;
  box-shadow: 0 8px 32px 0 #A259F799, 0 0 24px #00FFD044;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.7rem;
  &:hover {
    transform: translateY(-12px) scale(1.04) rotate(-1deg);
    box-shadow: 0 16px 40px 0 #ff61e6cc, 0 0 32px #00FFD099;
    border-color: #ff61e6;
    background: rgba(44, 62, 80, 0.98);
  }
  h3 {
    font-size: 2.1rem;
    margin-bottom: 0.5rem;
    color: #A259F7;
    font-family: 'Inter', Arial, sans-serif;
    letter-spacing: 0.04em;
    text-shadow: 0 2px 8px #000, 0 0 8px #A259F7;
    display: flex;
    align-items: center;
    gap: 0.7rem;
  }
  p {
    color: #fff;
    font-size: 1.18rem;
    font-weight: 600;
    text-shadow: 0 1px 8px #18122B88;
  }
`;

const Home = () => {
  const [showModal, setShowModal] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const handleStartWagering = () => {
    if (currentUser) {
      // User is authenticated, redirect to wagers page
      navigate('/wagers');
    } else {
      // User is not authenticated, show login modal
      setShowModal(true);
    }
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
  };
  
  // --- PayPal Test Button for CORS Debugging ---
  const handleTestPay = async () => {
    console.log('Attempting to fetch createPaypalOrder...');
    try {
      const response = await fetch('http://localhost:8080/https://us-central1-tokensite-6eef3.cloudfunctions.net/createPaypalOrder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-requested-with': 'XMLHttpRequest',
        },
        // credentials: 'include', // Uncomment if you want to test with credentials
        body: JSON.stringify({ test: true })
      });
      console.log('Response status:', response.status);
      for (const [key, value] of response.headers.entries()) {
        console.log('Response header:', key, value);
      }
      const data = await response.text();
      console.log('PayPal test response:', data);
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };
  // ---------------------------------------------

  return (
    <HomeContainer>
      <FloatingTokens>
        <div className="token" style={{ left: '10%', animationDelay: '0s' }} />
        <div className="token2" style={{ left: '30%', animationDelay: '3s' }} />
        <div className="token3" style={{ left: '60%', animationDelay: '6s' }} />
        <div className="token" style={{ left: '80%', animationDelay: '1.5s' }} />
        <div className="token2" style={{ left: '50%', animationDelay: '7s' }} />
        <div className="token3" style={{ left: '20%', animationDelay: '10s' }} />
      </FloatingTokens>
      <GetStartedModal isOpen={showModal} onClose={handleCloseModal} />
      <HeroSection>
        <h1>RONIX</h1>
        <p>
          Compete in head-to-head Fortnite matches, win tokens, and climb the leaderboards.
          Our secure platform ensures fair play and instant payouts.
        </p>
        <CTAButton onClick={handleStartWagering}>PLAY NOW</CTAButton>
      </HeroSection>
      <LiveStreamsSection />
      <FeaturesSection>
        <FeatureCard>
          <h3> Head-to-Head Matches</h3>
          <p>Challenge other players to 1v1, 2v2, or squad matches with customizable rules and token amounts.</p>
        </FeatureCard>
        <FeatureCard>
          <h3> Secure Token System</h3>
          <p>Our token-based system ensures secure transactions and instant withdrawals when you win.</p>
        </FeatureCard>
        <FeatureCard>
          <h3> Leaderboards & Stats</h3>
          <p>Track your performance, climb the ranks, and establish yourself as a top Fortnite competitor.</p>
        </FeatureCard>
      </FeaturesSection>
      <TrustBadge>Trusted by 1,000+ players</TrustBadge>
    </HomeContainer>
  );
};

export default Home;
