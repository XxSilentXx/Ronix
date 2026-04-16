import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Link, useNavigate } from 'react-router-dom';
import SocialLogin from './SocialLogin';
import Confetti from 'react-confetti';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.7s cubic-bezier(.25,1.7,.45,.87);
`;

const ModalContainer = styled.div`
  background: linear-gradient(135deg, #23243a 0%, #1a1a2e 50%, #4facfe 100%);
  border-radius: 24px;
  width: 90%;
  max-width: 420px;
  padding: 2.5rem 2rem 2rem 2rem;
  border: 1.5px solid rgba(79, 172, 254, 0.15);
  box-shadow: 0 25px 60px rgba(0,0,0,0.55), 0 0 0 1.5px rgba(79,172,254,0.08);
  position: relative;
  max-height: 85vh;
  overflow-y: auto;
  margin: auto;
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    border-radius: 24px;
    z-index: 0;
    background: linear-gradient(120deg, rgba(79,172,254,0.12) 0%, rgba(255,97,230,0.10) 100%);
    pointer-events: none;
    animation: gradientMove 6s ease-in-out infinite alternate;
  }
  @keyframes gradientMove {
    0% { background-position: 0% 50%; }
    100% { background-position: 100% 50%; }
  }
  backdrop-filter: blur(8px);
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1.2rem;
  right: 1.2rem;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 50%;
  color: #fff;
  font-size: 1.7rem;
  width: 40px;
  height: 40px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s cubic-bezier(.25,1.7,.45,.87);
  z-index: 2;
  box-shadow: 0 2px 8px rgba(79,172,254,0.08);

  &:hover {
    background: rgba(79,172,254,0.18);
    color: #4facfe;
    transform: rotate(90deg) scale(1.08);
    box-shadow: 0 0 16px rgba(79,172,254,0.18);
  }
`;

const ModalHeader = styled.div`
  margin-bottom: 2.2rem;
  text-align: center;

  h2 {
    font-size: 2.1rem;
    font-weight: 800;
    margin-bottom: 0.5rem;
    background: linear-gradient(90deg, #4facfe 0%, #00f2fe 50%, #ff61e6 100%);
    background-size: 200% 200%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: titleGlow 2s ease-in-out infinite alternate;
    letter-spacing: 0.5px;
    text-shadow: 0 2px 12px rgba(79,172,254,0.10);
  }

  @keyframes titleGlow {
    0% { background-position: 0% 50%; filter: brightness(1); }
    100% { background-position: 100% 50%; filter: brightness(1.2); }
  }

  p {
    color: #b8c1ec;
    font-size: 1.08rem;
    margin-bottom: 0;
    font-weight: 500;
    letter-spacing: 0.01em;
  }
`;

const Terms = styled.div`
  font-size: 0.92rem;
  color: #b8c1ec;
  margin-top: 2.2rem;
  text-align: center;
  opacity: 0.85;
  line-height: 1.5;
  a {
    color: #4facfe;
    text-decoration: underline;
    &:hover { color: #00f2fe; }
  }
`;

const GetStartedModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save the current scroll position
      const scrollY = window.scrollY;
      
      // Prevent background scrolling
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restore scrolling when component unmounts
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.top = '';
        document.body.style.overflow = '';
        
        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);
  
  // Handle direct navigation to register page
  const handleRegisterRedirect = () => {
    onClose();
    navigate('/register');
  };
  
  // Listen for SocialLogin success (simulate with a callback)
  const handleSocialLoginSuccess = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2500);
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={e => e.stopPropagation()} className="fade-in bounce">
        {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} numberOfPieces={120} recycle={false} />}
        <CloseButton onClick={onClose} aria-label="Close"></CloseButton>
        <ModalHeader>
          <h2>Get Started</h2>
          <p>Start competing in one click.</p>
        </ModalHeader>
        <SocialLogin onClose={onClose} redirectPath="/wagers" onSuccess={handleSocialLoginSuccess} />
        <Terms>
          By accessing this site, I confirm that I am at least 18 years old and have read the <Link to="/terms">Terms of Service</Link>.
        </Terms>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default GetStartedModal;
