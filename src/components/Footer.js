import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const FooterContainer = styled.footer`
  background: linear-gradient(90deg, #2b1055 0%, #4facfe 100%);
  backdrop-filter: blur(10px);
  padding: 4rem 2rem 2rem;
  border-top: 2px solid #ff61e6;
  box-shadow: 0 -8px 32px #4facfe55;
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 3rem;
`;

const FooterColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FooterLogo = styled(Link)`
  font-size: 2.2rem;
  font-family: 'Luckiest Guy', 'Barlow', sans-serif;
  font-weight: 900;
  text-decoration: none;
  background: linear-gradient(90deg, #4facfe 0%, #ff61e6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 1rem;
  filter: drop-shadow(0 0 8px #4facfe88) drop-shadow(0 0 16px #00f2fe88);
  letter-spacing: 0.06em;
  animation: logoGlow 2.5s infinite alternate cubic-bezier(.25,1.7,.45,.87);

  @keyframes logoGlow {
    from { filter: drop-shadow(0 0 8px #4facfe88) drop-shadow(0 0 16px #00f2fe88); }
    to { filter: drop-shadow(0 0 24px #ff61e6cc) drop-shadow(0 0 32px #00f2fecc); }
  }
`;

const FooterDescription = styled.p`
  color: #b8c1ec;
  line-height: 1.6;
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const SocialLink = styled.a`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4facfe 0%, #ff61e6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  text-decoration: none;
  font-size: 1.5rem;
  box-shadow: 0 0 12px #4facfe88;
  transition: all 0.3s cubic-bezier(.25,1.7,.45,.87);
  &:hover {
    background: linear-gradient(135deg, #ff61e6 0%, #4facfe 100%);
    transform: translateY(-4px) scale(1.08) rotate(-2deg);
    box-shadow: 0 0 24px #ff61e6cc, 0 0 32px #00f2fecc;
  }
`;

const FooterTitle = styled.h3`
  color: #fff;
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 1rem;
`;

const FooterLinks = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

const FooterLink = styled(Link)`
  color: #fff;
  text-decoration: none;
  font-weight: 700;
  letter-spacing: 0.02em;
  transition: all 0.3s cubic-bezier(.25,1.7,.45,.87);
  &:hover {
    color: #ff61e6;
    transform: translateX(8px) scale(1.05);
    text-shadow: 0 2px 8px #ff61e6aa;
  }
`;

const ExternalLink = styled.a`
  color: #b8c1ec;
  text-decoration: none;
  transition: all 0.3s ease;
  
  &:hover {
    color: #4facfe;
    transform: translateX(5px);
  }
`;

const BottomBar = styled.div`
  max-width: 1200px;
  margin: 3rem auto 0;
  padding-top: 2rem;
  border-top: 2px solid #4facfe;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }
`;

const Copyright = styled.p`
  color: #b8c1ec;
`;

const BottomLinks = styled.div`
  display: flex;
  gap: 1.5rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.5rem;
  }
`;

const BottomLink = styled(Link)`
  color: #b8c1ec;
  text-decoration: none;
  font-size: 0.9rem;
  
  &:hover {
    color: #4facfe;
  }
`;

const LogoImage = styled.img`
  width: 80px;
  height: 80px;
  margin: 0 auto 1rem auto;
  display: block;
  border-radius: 50%;
  box-shadow: 0 0 24px #a259f7cc, 0 0 32px #000a;
`;

const SupportEmail = styled.a`
  color: #fff;
  font-weight: 700;
  font-size: 1.1rem;
  text-align: center;
  display: block;
  margin-top: 0.5rem;
  text-decoration: underline;
  letter-spacing: 0.01em;
`;

const Footer = () => {
  return (
    <FooterContainer>
      <FooterContent>
        <FooterColumn>
          <FooterLogo to="/">RONIX</FooterLogo>
          <FooterDescription>
            The premier platform for Fortnite players to compete in head-to-head matches, 
            win tokens, and establish themselves in the competitive scene.
          </FooterDescription>
          <SocialLinks>
            <SocialLink href="https://x.com/Ronixgg" target="_blank" rel="noopener noreferrer">
              <i className="fab fa-twitter"></i>
            </SocialLink>
            <SocialLink href="https://discord.gg/JqXwnb6rSq" target="_blank" rel="noopener noreferrer">
              <i className="fab fa-discord"></i>
            </SocialLink>
          </SocialLinks>
        </FooterColumn>
        
        <FooterColumn>
          <FooterTitle>Quick Links</FooterTitle>
          <FooterLinks>
            <FooterLink to="/">Home</FooterLink>
            <FooterLink to="/wagers">Matches</FooterLink>
            <FooterLink to="/leaderboard">Leaderboard</FooterLink>
            <FooterLink to="/how-it-works">How It Works</FooterLink>
            <FooterLink to="/faq">FAQ</FooterLink>
            <FooterLink to="/rules">Rules</FooterLink>
          </FooterLinks>
        </FooterColumn>
        
        <FooterColumn>
          <FooterTitle>Account</FooterTitle>
          <FooterLinks>
            <FooterLink to="/login">Login</FooterLink>
            <FooterLink to="/register">Register</FooterLink>
            <FooterLink to="/profile">My Profile</FooterLink>
            <FooterLink to="/wallet">Transaction History</FooterLink>
      
          </FooterLinks>
        </FooterColumn>
        
        <FooterColumn>
          <FooterTitle>Support</FooterTitle>
          <FooterLinks>
            <ExternalLink href="https://discord.gg/JqXwnb6rSq" target="_blank" rel="noopener noreferrer">
              Discord Community
            </ExternalLink>
          </FooterLinks>
        </FooterColumn>
      </FooterContent>
      
      <BottomBar style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <LogoImage src="/assets/ronix-footer.png" alt="Ronix Logo" />
        <Copyright style={{ margin: '0.5rem 0 0.2rem 0', fontWeight: 600 }}>
          &copy; {new Date().getFullYear()} Ronix. All content on this site is copyrighted by Ronix. All Rights Reserved.
        </Copyright>
        <div style={{ color: '#b8c1ec', fontSize: '0.95rem', marginBottom: '0.2rem' }}>
          Ronix Entertainment Inc
        </div>
        <SupportEmail href="mailto:support@ronix.gg">support@ronix.gg</SupportEmail>
        <BottomLinks style={{ marginTop: '1.2rem' }}>
          <BottomLink to="/terms">Terms of Service</BottomLink>
          <BottomLink to="/privacy">Privacy Policy</BottomLink>
          <BottomLink to="/rules">Rules</BottomLink>
          <BottomLink to="/faq">FAQ</BottomLink>
        </BottomLinks>
      </BottomBar>
    </FooterContainer>
  );
};

export default Footer;
