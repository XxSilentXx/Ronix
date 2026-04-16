import React, { useState } from 'react';
import styled from 'styled-components';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

const Button = styled.button`
  background: ${props => props.$isReady 
    ? 'linear-gradient(90deg, #51cf66 0%, #37b24d 100%)' 
    : 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)'};
  color: #fff;
  border: none;
  padding: 12px 25px;
  border-radius: 8px;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  font-weight: 600;
  opacity: ${props => props.$disabled ? 0.5 : 1};
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  &:hover {
    transform: ${props => props.$disabled ? 'none' : 'translateY(-2px)'};
    box-shadow: ${props => props.$disabled ? 'none' : '0 5px 15px rgba(0, 242, 254, 0.3)'};
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const ReadyUpButton = ({ matchId, isReady, isHost, userId, onReadyChange }) => {
  const { currentUser } = useAuth();
  const [updating, setUpdating] = useState(false);
  
  const handleReadyClick = async () => {
    if (!currentUser || !matchId || updating) return;
    
    try {
      setUpdating(true);
      
      const matchRef = doc(db, 'wagers', matchId);
      
      if (userId) {
        // Party wager: toggle readyStatus for this user
        await updateDoc(matchRef, {
          [`readyStatus.${userId}`]: !isReady,
          updatedAt: new Date()
        });
      } else if (isHost) {
        await updateDoc(matchRef, {
          hostReady: !isReady,
          updatedAt: new Date()
        });
      } else {
        await updateDoc(matchRef, {
          guestReady: !isReady,
          updatedAt: new Date()
        });
      }
      
      if (onReadyChange) {
        onReadyChange(!isReady);
      }
      
    } catch (error) {
      console.error('Error updating ready status:', error);
    } finally {
      setUpdating(false);
    }
  };
  
  return (
    <Button 
      onClick={handleReadyClick} 
      $isReady={isReady} 
      $disabled={updating}
      disabled={updating}
    >
      {isReady ? (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
          Ready
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
          </svg>
          Ready Up
        </>
      )}
    </Button>
  );
};

export default ReadyUpButton; 