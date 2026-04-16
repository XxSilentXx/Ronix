import React from 'react';
import styled from 'styled-components';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const RegisterContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
`;

const RegisterCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 2.5rem;
  width: 100%;
  max-width: 450px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const RegisterHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  
  h1 {
    font-size: 2.5rem;
    background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }
  
  p {
    color: #b8c1ec;
  }
`;

const SocialButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  width: 100%;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 1rem;
  color: #fff;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 0.8rem;
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
  }
  
  &.google {
    background: rgba(255, 255, 255, 0.15);
    border: none;
    
    &:hover {
      background: rgba(255, 255, 255, 0.25);
    }
  }
  
  img {
    width: 24px;
    height: 24px;
  }
`;

const BottomText = styled.p`
  text-align: center;
  margin-top: 1.5rem;
  color: #b8c1ec;
  font-size: 0.9rem;
  
  a {
    color: #4facfe;
    text-decoration: none;
    font-weight: 500;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const TermsText = styled.p`
  text-align: center;
  margin-top: 1.5rem;
  color: #b8c1ec;
  font-size: 0.8rem;
  opacity: 0.8;
  
  a {
    color: #4facfe;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const Register = () => {
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  
  const handleGoogleLogin = async () => {
    try {
      const user = await signInWithGoogle();
      navigate('/wagers');
    } catch (error) {
      // console.error('Google login error:', error);
    }
  };
  
  return (
    <RegisterContainer>
      <RegisterCard>
        <RegisterHeader>
          <h1>Create Account</h1>
          <p>Join the Ronix community</p>
        </RegisterHeader>
        
        <SocialButton className="google" onClick={handleGoogleLogin}>
          <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24Z" fill="white"/>
            <path d="M12 4.8C13.6547 4.8 15.1054 5.3945 16.2992 6.39234L19.3961 3.29539C17.3695 1.39828 14.8359 0.3 12 0.3C7.77188 0.3 4.09219 2.70469 2.14922 6.22266L5.68359 8.95781C6.61641 6.47109 9.07031 4.8 12 4.8Z" fill="#EA4335"/>
            <path d="M12 19.2C9.07031 19.2 6.61641 17.5289 5.68359 15.0422L2.14922 17.7773C4.09219 21.2953 7.77188 23.7 12 23.7C14.7516 23.7 17.3695 22.65 19.3523 20.6297L16.0055 18.0094C14.8664 18.7711 13.5 19.2 12 19.2Z" fill="#34A853"/>
            <path d="M5.68359 15.0422C5.43047 14.3859 5.3 13.7297 5.3 13.05C5.3 12.3703 5.45859 11.7141 5.68359 11.0578L2.14922 8.32265C1.40859 9.71485 1 11.3391 1 13.05C1 14.7609 1.40859 16.3852 2.14922 17.7773L5.68359 15.0422Z" fill="#FBBC05"/>
            <path d="M17.85 13.05C17.85 12.2812 17.7656 11.5125 17.6109 10.8H12V14.4H15.3867C15.1781 15.5016 14.5242 16.3406 13.5758 16.9031L16.9227 19.5234C18.4969 18.0797 19.5 15.7641 19.5 13.05H17.85Z" fill="#4285F4"/>
          </svg>
          PLAY WITH GOOGLE
        </SocialButton>
        
        <BottomText>
          Already have an account? <Link to="/login">Sign in</Link>
        </BottomText>
        
        <TermsText>
          By accessing this site, I confirm that I am at least 18 years old and have read the <Link to="/terms">Terms of Service</Link>
        </TermsText>
      </RegisterCard>
    </RegisterContainer>
  );
};

export default Register;
