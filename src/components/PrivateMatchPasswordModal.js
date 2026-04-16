import React, { useState } from 'react';
import styled from 'styled-components';

const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  animation: fadeIn 0.3s ease;
`;

const ModalContent = styled.div`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  padding: 30px;
  border-radius: 15px;
  width: 90%;
  max-width: 400px;
  color: white;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
  animation: slideIn 0.3s ease;
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideIn {
    from { transform: translateY(-20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  
  h2 {
    font-size: 1.5rem;
    background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #fff;
  font-size: 1.5rem;
  cursor: pointer;
  
  &:hover {
    color: #4facfe;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 1rem;
  color: #b8c1ec;
`;

const Input = styled.input`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 12px 15px;
  color: white;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #4facfe;
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 10px;
`;

const Button = styled.button`
  background: ${props => props.$secondary ? 'rgba(255, 255, 255, 0.1)' : 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)'};
  color: #fff;
  border: none;
  padding: 12px 25px;
  border-radius: 8px;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  font-weight: 600;
  flex: 1;
  opacity: ${props => props.$disabled ? 0.5 : 1};
  transition: all 0.2s ease;
  
  &:hover {
    transform: ${props => props.$disabled ? 'none' : 'translateY(-2px)'};
    box-shadow: ${props => props.$disabled ? 'none' : '0 5px 15px rgba(79, 172, 254, 0.4)'};
  }
`;

const ErrorMessage = styled.div`
  color: #ff4757;
  font-size: 0.85rem;
  margin-top: 5px;
`;

const InfoText = styled.div`
  color: #b8c1ec;
  font-size: 0.9rem;
  margin-bottom: 15px;
  text-align: center;
`;

const PrivateMatchPasswordModal = ({ isOpen, onClose, onPasswordSubmit, wagerInfo }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('Please enter the match password');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onPasswordSubmit(password.trim());
    } catch (err) {
      setError(err.message || 'Invalid password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <ModalBackdrop onClick={handleClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <h2> Private Match</h2>
          <CloseButton onClick={handleClose}>&times;</CloseButton>
        </ModalHeader>
        
        <InfoText>
          This is a private match. Enter the password to join.
        </InfoText>
        
        {wagerInfo && (
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.05)', 
            padding: '15px', 
            borderRadius: '8px', 
            marginBottom: '20px' 
          }}>
            <div style={{ fontSize: '0.9rem', color: '#b8c1ec' }}>
              <div><strong>Host:</strong> {wagerInfo.hostName}</div>
              <div><strong>Amount:</strong> {wagerInfo.amount} tokens</div>
              <div><strong>Mode:</strong> {wagerInfo.gameMode} ({wagerInfo.partySize})</div>
            </div>
          </div>
        )}
        
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="password">Match Password</Label>
            <Input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter the match password"
              autoFocus
              disabled={isSubmitting}
            />
            {error && <ErrorMessage>{error}</ErrorMessage>}
          </FormGroup>
          
          <ButtonGroup>
            <Button 
              type="submit" 
              $disabled={isSubmitting || !password.trim()}
              disabled={isSubmitting || !password.trim()}
            >
              {isSubmitting ? 'Verifying...' : 'Join Match'}
            </Button>
            <Button 
              type="button" 
              $secondary 
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </ButtonGroup>
        </Form>
      </ModalContent>
    </ModalBackdrop>
  );
};

export default PrivateMatchPasswordModal; 