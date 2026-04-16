import React, { useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.7s cubic-bezier(.25,1.7,.45,.87);
`;

const ModalContainer = styled.div`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 15px;
  width: 90%;
  max-width: 500px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  color: #fff;
  background-image: url('https://fortnite-api.com/images/cosmetics/br/character_default.png');
  background-repeat: no-repeat;
  background-position: right bottom;
  background-size: 120px auto;
  animation: bounce 0.8s cubic-bezier(.25,1.7,.45,.87);
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: #fff;
  font-size: 1.5rem;
  cursor: pointer;
  
  &:hover {
    color: #4facfe;
  }
`;

const ModalTitle = styled.h2`
  font-size: 1.8rem;
  background: linear-gradient(90deg, #ff4242 0%, #ff6b6b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 1.5rem;
`;

const WagerDetails = styled.div`
  margin-bottom: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 1rem;
  border-radius: 10px;
  
  p {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    
    span:first-child {
      color: #b8c1ec;
    }
    
    span:last-child {
      color: #fff;
      font-weight: 500;
    }
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: #b8c1ec;
`;

const TextArea = styled.textarea`
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 1rem;
  color: #fff;
  min-height: 120px;
  resize: vertical;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: #4facfe;
  }
`;

const Button = styled.button`
  background: ${props => props.$secondary ? 'rgba(255, 255, 255, 0.1)' : 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)'};
  color: #fff;
  border: none;
  padding: 1rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.$disabled ? 0.7 : 1};
  transition: all 0.2s cubic-bezier(.25,1.7,.45,.87), box-shadow 0.2s cubic-bezier(.25,1.7,.45,.87);
  box-shadow: 0 0 12px #4facfe55;
  border: 2px solid transparent;
  &:hover {
    transform: ${props => props.$disabled ? 'none' : 'translateY(-2px) scale(1.04)'};
    box-shadow: 0 0 32px #ff61e6cc, 0 0 64px #00f2fe99;
    border: 2px solid #ff61e6;
    background: linear-gradient(90deg, #ff61e6 0%, #4facfe 100%);
  }
  &:active {
    transform: scale(0.97);
    box-shadow: 0 0 8px #4facfe99;
  }
`;

const AdminRequestModal = ({ isOpen, wager, onClose, onSubmit }) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentUser } = useAuth();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(reason);
    } catch (error) {
      console.error('Error submitting admin request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen || !wager || !currentUser) return null;
  
  // Format date to a readable string
  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <ModalOverlay>
      <ModalContainer className="fade-in bounce">
        <CloseButton onClick={onClose}>&times;</CloseButton>
        <ModalTitle>Request Admin Help</ModalTitle>
        
        <WagerDetails>
          <p>
            <span>Wager ID:</span>
            <span>{wager.id.slice(0, 8)}...</span>
          </p>
          <p>
            <span>Amount:</span>
            <span>{wager.amount} Tokens</span>
          </p>
          <p>
            <span>Type:</span>
            <span>{wager.partySize} {wager.gameMode}</span>
          </p>
          <p>
            <span>Created:</span>
            <span>{formatDate(wager.createdAt)}</span>
          </p>
        </WagerDetails>
        
        <Form onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="reason">Please describe the issue with this wager:</Label>
            <TextArea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe why you need admin assistance..."
              required
            />
          </div>
          
          <Button type="submit" disabled={isSubmitting || !reason.trim()} $secondary>
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </Form>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default AdminRequestModal; 