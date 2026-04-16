import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const SocialLoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  width: 100%;
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
  position: relative;
  overflow: hidden;
  z-index: 1;
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
  }
  
  &.google {
    background: linear-gradient(90deg, #00f2fe 0%, #4facfe 100%);
    color: #fff;
    border: none;
    box-shadow: 0 4px 24px 0 rgba(66,133,244,0.12);
    font-size: 1.08rem;
    font-weight: 700;
    letter-spacing: 0.01em;
    
    &:hover, &:focus {
      background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
      box-shadow: 0 8px 24px 0 rgba(66,133,244,0.18);
      transform: scale(1.04) translateY(-3px);
    }
    &:active {
      transform: scale(0.98);
      box-shadow: 0 2px 8px 0 rgba(66,133,244,0.10);
    }
  }
  
  &.discord {
    background: rgba(88, 101, 242, 0.3);
    border: none;
    
    &:hover {
      background: rgba(88, 101, 242, 0.4);
    }
  }
  
  &.twitch {
    background: rgba(145, 70, 255, 0.3);
    border: none;
    
    &:hover {
      background: rgba(145, 70, 255, 0.4);
    }
  }
  
  img {
    width: 24px;
    height: 24px;
  }
`;

const TermsText = styled.p`
  text-align: center;
  margin-top: 1rem;
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

const ErrorMessage = styled.div`
  background: rgba(255, 71, 87, 0.2);
  color: #ff4757;
  padding: 0.8rem;
  border-radius: 10px;
  text-align: center;
  margin-bottom: 1rem;
  font-size: 0.9rem;
`;

const DebugContainer = styled.div`
  margin-top: 1rem;
  padding: 0.5rem;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  
  pre {
    white-space: pre-wrap;
    word-break: break-all;
    font-family: monospace;
    margin: 0.5rem 0;
    padding: 0.5rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 4px;
    max-height: 150px;
    overflow-y: auto;
  }
`;

const SocialLogin = ({ onClose, redirectPath = '/wagers' }) => {
  const [isLoading, setIsLoading] = useState({
    google: false,
    discord: false,
    twitch: false
  });
  const [error, setError] = useState('');
  const [showDebug, setShowDebug] = useState(process.env.NODE_ENV === 'development');
  const { signInWithGoogle, signInWithDiscord, signInWithTwitch, checkRedirectResult, authError } = useAuth();
  const navigate = useNavigate();
  
  // Check for redirect results on mount
  useEffect(() => {
    const checkForRedirects = async () => {
      try {
        setError(''); // Clear previous errors
        const user = await checkRedirectResult();
        if (user) {
          if (onClose) onClose();
          navigate(redirectPath);
        }
      } catch (error) {
        console.error('Error processing redirect result:', error);
        let errorMessage = `Authentication error: ${error.message}`;
        
        if (error.code === 'auth/account-exists-with-different-credential') {
          errorMessage = 'An account already exists with the same email address but different sign-in credentials. Try signing in using a provider associated with this email address.';
        } else if (error.code === 'auth/redirect-cancelled-by-user') {
          errorMessage = 'The redirect operation was cancelled by the user.';
        } else if (error.code === 'auth/redirect-operation-pending') {
          errorMessage = 'A redirect sign-in operation is already pending.';
        } else if (error.code === 'auth/popup-blocked') {
          errorMessage = 'The popup was blocked by your browser. Please allow popups for this site.';
        } else if (error.code === 'auth/popup-closed-by-user') {
          errorMessage = 'The popup was closed by the user before finalizing the operation.';
        } else if (error.code === 'auth/invalid-credential') {
          errorMessage = 'The authentication credential is invalid. Please try again.';
        } else if (error.code === 'auth/operation-not-allowed') {
          errorMessage = 'This sign-in method is not enabled for this Firebase project. Please contact the administrator.';
        } else if (error.code === 'auth/unauthorized-domain') {
          errorMessage = `The current domain (${window.location.hostname}) is not authorized to perform authentication operations. Please contact the administrator.`;
        } else if (error.code === 'auth/missing-oauth-client-secret') {
          errorMessage = 'The OAuth configuration is missing its client secret. Please contact the administrator.';
        }
        
        setError(errorMessage);
      }
    };
    
    checkForRedirects();
  }, [checkRedirectResult, navigate, onClose, redirectPath]);
  
  // Also update error when authError changes
  useEffect(() => {
    if (authError) {
      setError(`Auth error: ${authError.message} (Code: ${authError.code})`);
    }
  }, [authError]);
  
  const handleGoogleLogin = async () => {
    try {
      setIsLoading(prev => ({ ...prev, google: true }));
      setError('');
      const user = await signInWithGoogle();
      if (onClose) onClose();
      navigate(redirectPath);
    } catch (error) {
      console.error('Google login error:', error);
      // More detailed error message based on error code
      let errorMessage = 'Failed to sign in with Google. Please try again.';
      
      if (error.code) {
        switch(error.code) {
          case 'auth/popup-closed-by-user':
            errorMessage = 'Sign-in popup was closed before completing. Please try again.';
            break;
          case 'auth/popup-blocked':
            errorMessage = 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
            break;
          case 'auth/cancelled-popup-request':
            errorMessage = 'Multiple popup requests were made. Please try again.';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network error occurred. Please check your internet connection.';
            break;
          case 'auth/unauthorized-domain':
            errorMessage = `This domain (${window.location.hostname}) is not authorized for OAuth operations. Please contact support.`;
            break;
          default:
            errorMessage = `Google sign-in failed: ${error.message}`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(prev => ({ ...prev, google: false }));
    }
  };
  
  const handleDiscordLogin = async () => {
    try {
      setIsLoading(prev => ({ ...prev, discord: true }));
      setError('');
      // Initiating Discord sign-in redirect
      
      // Just call the function - it will redirect, so we won't get past this point
      await signInWithDiscord();
      
      // The following won't execute due to redirect
    } catch (error) {
      console.error('Discord login error:', error);
      let errorMessage = 'Failed to initiate Discord sign-in. Please try again.';
      
      if (error.code) {
        switch(error.code) {
          case 'auth/network-request-failed':
            errorMessage = 'Network error occurred. Please check your internet connection.';
            break;
          case 'auth/unauthorized-domain':
            errorMessage = `This domain (${window.location.hostname}) is not authorized for OAuth operations. Please check Firebase Authentication configuration.`;
            break;
          case 'auth/internal-error':
            errorMessage = 'Discord authentication error. Make sure Discord authentication is set up correctly in Firebase.';
            break;
          case 'auth/missing-oauth-client-secret':
            errorMessage = 'Discord authentication is not properly configured in Firebase. Please add client secret.';
            break;
          default:
            errorMessage = `Discord sign-in failed: ${error.message}`;
        }
      }
      
      setError(errorMessage);
      setIsLoading(prev => ({ ...prev, discord: false }));
    }
  };
  
  const handleTwitchLogin = async () => {
    try {
      setIsLoading(prev => ({ ...prev, twitch: true }));
      setError('');
      await signInWithTwitch();
      // The following code won't execute as the page will redirect
    } catch (error) {
      console.error('Twitch login error:', error);
      let errorMessage = 'Failed to sign in with Twitch. Please try again.';
      
      if (error.code) {
        switch(error.code) {
          case 'auth/popup-closed-by-user':
            errorMessage = 'Sign-in popup was closed before completing. Please try again.';
            break;
          case 'auth/popup-blocked':
            errorMessage = 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network error occurred. Please check your internet connection.';
            break;
          default:
            errorMessage = `Twitch sign-in failed: ${error.message}`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(prev => ({ ...prev, twitch: false }));
    }
  };
  
  // Toggle debug info visibility (only in development)
  const toggleDebug = () => {
    if (process.env.NODE_ENV === 'development') {
      setShowDebug(!showDebug);
    }
  };

  return (
    <SocialLoginContainer>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      <SocialButton 
        className="google"
        onClick={handleGoogleLogin}
        disabled={isLoading.google}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24Z" fill="white"/>
          <path d="M12 4.8C13.6547 4.8 15.1054 5.3945 16.2992 6.39234L19.3961 3.29539C17.3695 1.39828 14.8359 0.3 12 0.3C7.77188 0.3 4.09219 2.70469 2.14922 6.22266L5.68359 8.95781C6.61641 6.47109 9.07031 4.8 12 4.8Z" fill="#EA4335"/>
          <path d="M12 19.2C9.07031 19.2 6.61641 17.5289 5.68359 15.0422L2.14922 17.7773C4.09219 21.2953 7.77188 23.7 12 23.7C14.7516 23.7 17.3695 22.65 19.3523 20.6297L16.0055 18.0094C14.8664 18.7711 13.5 19.2 12 19.2Z" fill="#34A853"/>
          <path d="M5.68359 15.0422C5.43047 14.3859 5.3 13.7297 5.3 13.05C5.3 12.3703 5.45859 11.7141 5.68359 11.0578L2.14922 8.32265C1.40859 9.71485 1 11.3391 1 13.05C1 14.7609 1.40859 16.3852 2.14922 17.7773L5.68359 15.0422Z" fill="#FBBC05"/>
          <path d="M17.85 13.05C17.85 12.2812 17.7656 11.5125 17.6109 10.8H12V14.4H15.3867C15.1781 15.5016 14.5242 16.3406 13.5758 16.9031L16.9227 19.5234C18.4969 18.0797 19.5 15.7641 19.5 13.05H17.85Z" fill="#4285F4"/>
        </svg>
        {isLoading.google ? 'CONNECTING...' : 'PLAY WITH GOOGLE'}
      </SocialButton>
      
      <TermsText>
        By accessing this site, I confirm that I am at least 18 years old and have read the <a href="/terms">Terms of Service</a>
      </TermsText>
    </SocialLoginContainer>
  );
};

export default SocialLogin;
