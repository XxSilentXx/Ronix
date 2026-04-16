import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { checkUserBanStatus, getUserAppealStatus, cleanupExpiredBans, submitAppeal } from '../firebase/banUtils';

const BanNotificationContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const BanCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 2rem;
  max-width: 600px;
  width: 100%;
  border: 1px solid rgba(255, 0, 0, 0.3);
  box-shadow: 0 10px 30px rgba(255, 0, 0, 0.1);
`;

const BanTitle = styled.h1`
  font-size: 2rem;
  margin-bottom: 1rem;
  color: #ff4757;
  text-align: center;
`;

const BanReason = styled.div`
  background: rgba(255, 71, 87, 0.1);
  border-radius: 10px;
  padding: 1rem;
  margin: 1rem 0;
  border-left: 4px solid #ff4757;
`;

const BanDetails = styled.div`
  margin: 1rem 0;
  
  p {
    margin: 0.5rem 0;
    color: #b8c1ec;
  }
  
  .label {
    color: #4facfe;
    font-weight: bold;
  }
`;

const AppealButton = styled.button`
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;
  width: 100%;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(79, 172, 254, 0.4);
  }
  
  &:disabled {
    background: #666;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const AppealStatus = styled.div`
  background: rgba(79, 172, 254, 0.1);
  border-radius: 10px;
  padding: 1rem;
  margin: 1rem 0;
  border-left: 4px solid #4facfe;
  
  .status {
    font-weight: bold;
    color: ${props => {
      switch (props.status) {
        case 'pending': return '#ffa502';
        case 'approved': return '#2ed573';
        case 'denied': return '#ff4757';
        default: return '#4facfe';
      }
    }};
  }
`;

const CountdownTimer = styled.div`
  text-align: center;
  font-size: 1.2rem;
  color: #4facfe;
  margin: 1rem 0;
  
  .time {
    font-weight: bold;
    color: #00f2fe;
  }
`;

// Modal Components
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
`;

const ModalCard = styled.div`
  background: rgba(26, 26, 46, 0.95);
  border-radius: 15px;
  padding: 2rem;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  border: 1px solid rgba(79, 172, 254, 0.3);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  
  h2 {
    color: #4facfe;
    margin: 0;
    font-size: 1.5rem;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #ff4757;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 71, 87, 0.1);
    transform: scale(1.1);
  }
`;

const AppealForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FormLabel = styled.label`
  color: #4facfe;
  font-weight: bold;
  font-size: 1rem;
`;

const FormTextarea = styled.textarea`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  padding: 12px 16px;
  font-size: 1rem;
  min-height: 120px;
  resize: vertical;
  font-family: inherit;
  line-height: 1.5;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: #4facfe;
    box-shadow: 0 0 10px rgba(79, 172, 254, 0.3);
  }
`;

const CharacterCount = styled.div`
  text-align: right;
  font-size: 0.9rem;
  color: ${props => props.isOver ? '#ff4757' : '#b8c1ec'};
`;

const CheckboxGroup = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin: 1rem 0;
  
  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    margin-top: 2px;
  }
  
  label {
    color: #b8c1ec;
    line-height: 1.4;
    cursor: pointer;
    font-size: 0.9rem;
  }
`;

const SubmitButton = styled.button`
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(79, 172, 254, 0.4);
  }
  
  &:disabled {
    background: #666;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const ModalMessage = styled.div`
  background: ${props => {
    switch (props.type) {
      case 'success': return 'rgba(46, 213, 115, 0.1)';
      case 'error': return 'rgba(255, 71, 87, 0.1)';
      case 'info': return 'rgba(79, 172, 254, 0.1)';
      default: return 'rgba(255, 255, 255, 0.05)';
    }
  }};
  color: ${props => {
    switch (props.type) {
      case 'success': return '#2ed573';
      case 'error': return '#ff4757';
      case 'info': return '#4facfe';
      default: return '#fff';
    }
  }};
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
  font-size: 0.9rem;
  text-align: center;
`;

const BanGuard = ({ children }) => {
  const { currentUser } = useAuth();
  const [banStatus, setBanStatus] = useState(null);
  const [appealStatus, setAppealStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(null);
  
  // Appeal modal state
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalMessage, setModalMessage] = useState(null);
  
  const maxReasonLength = 1500;

  useEffect(() => {
    const checkBanStatus = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const banResult = await checkUserBanStatus(currentUser.uid);
        setBanStatus(banResult);

        if (banResult.isBanned) {
          // Check appeal status
          const appeal = await getUserAppealStatus(currentUser.uid);
          setAppealStatus(appeal);

          // Set up countdown timer for temporary bans
          if (banResult.banDetails?.expirationDate) {
            const updateTimer = () => {
              const now = new Date();
              const expiration = banResult.banDetails.expirationDate.toDate();
              const diff = expiration - now;

              if (diff > 0) {
                setTimeRemaining(diff);
              } else {
                setTimeRemaining(null);
                // Recheck ban status as it may have expired
                checkBanStatus();
              }
            };

            updateTimer();
            const timer = setInterval(updateTimer, 1000);
            return () => clearInterval(timer);
          }
        }
      } catch (error) {
        console.error('BanGuard: Error checking ban status:', error);
      } finally {
        setLoading(false);
      }
    };

    // Run cleanup of expired bans periodically (every 5 minutes)
    const cleanupTimer = setInterval(async () => {
      try {
        await cleanupExpiredBans();
      } catch (error) {
        console.error('BanGuard: Error during periodic cleanup:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    checkBanStatus();

    // Cleanup timer on unmount
    return () => {
      clearInterval(cleanupTimer);
    };
  }, [currentUser]);

  const formatTimeRemaining = (ms) => {
    if (!ms) return null;

    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);

    if (days > 0) {
      return `${days} days, ${hours} hours`;
    } else if (hours > 0) {
      return `${hours} hours, ${minutes} minutes`;
    } else if (minutes > 0) {
      return `${minutes} minutes, ${seconds} seconds`;
    } else {
      return `${seconds} seconds`;
    }
  };

  const handleAppealClick = () => {
    setShowAppealModal(true);
    setModalMessage(null);
    setAppealReason('');
    setRulesAccepted(false);
  };

  const closeAppealModal = async () => {
    setShowAppealModal(false);
    setModalMessage(null);
    setAppealReason('');
    setRulesAccepted(false);
    setSubmitting(false);
    // Refresh ban status and appeal status after modal is closed
    if (currentUser) {
      const banResult = await checkUserBanStatus(currentUser.uid);
      setBanStatus(banResult);
      const appeal = await getUserAppealStatus(currentUser.uid);
      setAppealStatus(appeal);
    }
  };

  const handleAppealSubmit = async (e) => {
    e.preventDefault();
    
    if (!appealReason.trim()) {
      setModalMessage({
        type: 'error',
        message: 'Please provide a reason for your appeal.'
      });
      return;
    }

    if (appealReason.length > maxReasonLength) {
      setModalMessage({
        type: 'error',
        message: `Appeal reason must be ${maxReasonLength} characters or less.`
      });
      return;
    }

    if (!rulesAccepted) {
      setModalMessage({
        type: 'error',
        message: 'Please acknowledge that you understand the platform rules.'
      });
      return;
    }

    setSubmitting(true);
    setModalMessage({
      type: 'info',
      message: 'Submitting your appeal... Please wait.'
    });

    try {
      const result = await submitAppeal(currentUser.uid, {
        reason: appealReason,
        evidence: [] // No evidence in modal for simplicity
      });

      setModalMessage({
        type: 'success',
        message: 'Your appeal has been submitted successfully!'
      });

      // Clear form but don't close modal so user can see success message
      setAppealReason('');
      setRulesAccepted(false);
      
      // Do not update banStatus and appealStatus here to avoid closing the modal
      // Instead, update them when the modal is closed
      // const banResult = await checkUserBanStatus(currentUser.uid);
      // setBanStatus(banResult);
      // const appeal = await getUserAppealStatus(currentUser.uid);
      // setAppealStatus(appeal);

    } catch (error) {
      console.error('BanGuard: Error submitting appeal:', error);
      setModalMessage({
        type: 'error',
        message: 'Error submitting appeal: ' + error.message + '. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <BanNotificationContainer>
        <p>Checking account status...</p>
      </BanNotificationContainer>
    );
  }

  if (!currentUser) {
    return children;
  }

  if (banStatus?.isBanned) {
    const banDetails = banStatus.banDetails;
    const isPermanent = !banDetails?.expirationDate;

    return (
      <BanNotificationContainer>
        <BanCard>
          <BanTitle>Account Suspended</BanTitle>
          
          <BanReason>
            <h3>Reason for suspension:</h3>
            <p>{banDetails?.publicReason || banDetails?.reason || 'Violation of platform rules'}</p>
          </BanReason>

          <BanDetails>
            <p><span className="label">Ban Date:</span> {banDetails?.banDate ? new Date(banDetails.banDate.toDate()).toLocaleDateString() : 'Unknown'}</p>
            <p><span className="label">Ban Duration:</span> {isPermanent ? 'Permanent Ban' : 'Temporary Ban'}</p>
            {!isPermanent && banDetails?.expirationDate && (
              <>
                <p><span className="label">Ban Expires:</span> {new Date(banDetails.expirationDate.toDate()).toLocaleDateString()} at {new Date(banDetails.expirationDate.toDate()).toLocaleTimeString()}</p>
                {timeRemaining && (
                  <p><span className="label">Time Remaining:</span> <span style={{color: '#4facfe', fontWeight: 'bold'}}>{formatTimeRemaining(timeRemaining)}</span></p>
                )}
              </>
            )}
            {banDetails?.ipBanned && (
              <p style={{color: '#ffa502'}}><span className="label">Additional:</span> Your IP address has been banned</p>
            )}
            {banDetails?.epicIdBanned && (
              <p style={{color: '#ffa502'}}><span className="label">Additional:</span> Your Epic Games account has been banned</p>
            )}
          </BanDetails>

          {timeRemaining && (
            <CountdownTimer>
              <p>Your suspension will be automatically lifted in: <span className="time">{formatTimeRemaining(timeRemaining)}</span></p>
            </CountdownTimer>
          )}

          {appealStatus && (
            <AppealStatus status={appealStatus.status}>
              <h3>Appeal Status</h3>
              <p className="status">Status: {appealStatus.status.toUpperCase()}</p>
              {appealStatus.adminResponse && (
                <p><strong>Admin Response:</strong> {appealStatus.adminResponse}</p>
              )}
              {appealStatus.status === 'pending' && (
                <p>Your appeal is being reviewed. Please be patient.</p>
              )}
              {appealStatus.status === 'denied' && (
                <p>Your appeal has been denied. You may submit a new appeal if you have additional evidence.</p>
              )}
            </AppealStatus>
          )}

          {banStatus.appealStatus === 'none' && (
            <AppealButton onClick={handleAppealClick}>
              Submit Appeal
            </AppealButton>
          )}

          {banStatus.appealStatus === 'denied' && (
            <AppealButton onClick={handleAppealClick}>
              Submit New Appeal
            </AppealButton>
          )}

          {banStatus.appealStatus === 'pending' && (
            <AppealButton disabled>
              Appeal Pending Review
            </AppealButton>
          )}
          
          <div style={{marginTop: '2rem', padding: '1rem', background: 'rgba(79, 172, 254, 0.1)', borderRadius: '8px', fontSize: '0.9rem', color: '#b8c1ec'}}>
            <p><strong>What can I do?</strong></p>
            <ul style={{margin: '0.5rem 0', paddingLeft: '1.5rem'}}>
              <li>If you believe this ban was issued in error, you can submit an appeal</li>
              <li>Appeals are reviewed by our admin team within 24-48 hours</li>
              <li>Temporary bans will be automatically lifted when they expire</li>
              <li>Creating additional accounts to evade bans will result in permanent suspension</li>
            </ul>
          </div>
        </BanCard>
        {showAppealModal && (
          <ModalOverlay onClick={(e) => e.target === e.currentTarget && closeAppealModal()}>
            <ModalCard>
              <ModalHeader>
                <h2>Submit Ban Appeal</h2>
                <CloseButton onClick={closeAppealModal}>&times;</CloseButton>
              </ModalHeader>
              {modalMessage && (
                <ModalMessage type={modalMessage.type}>
                  {modalMessage.message}
                </ModalMessage>
              )}
              <AppealForm onSubmit={handleAppealSubmit}>
                <FormGroup>
                  <FormLabel>Reason for Appeal *</FormLabel>
                  <FormTextarea
                    placeholder="Please explain why you believe the ban should be lifted. Be specific about what happened, why you think the ban was incorrect, or what you've learned if you made a mistake..."
                    value={appealReason}
                    onChange={(e) => setAppealReason(e.target.value)}
                    maxLength={maxReasonLength}
                    disabled={submitting}
                    required
                  />
                  <CharacterCount isOver={appealReason.length > maxReasonLength}>
                    {appealReason.length}/{maxReasonLength} characters
                  </CharacterCount>
                </FormGroup>
                <CheckboxGroup>
                  <input
                    type="checkbox"
                    id="modalRulesAccepted"
                    checked={rulesAccepted}
                    onChange={(e) => setRulesAccepted(e.target.checked)}
                    disabled={submitting}
                    required
                  />
                  <label htmlFor="modalRulesAccepted">
                    I acknowledge that I have read and understand the platform rules, and I will follow them if my appeal is approved. 
                    I understand that providing false information may result in a permanent ban.
                  </label>
                </CheckboxGroup>
                <SubmitButton
                  type="submit"
                  disabled={submitting || !appealReason.trim() || !rulesAccepted || appealReason.length > maxReasonLength}
                >
                  {submitting ? 'Submitting Appeal...' : 'Submit Appeal'}
                </SubmitButton>
              </AppealForm>
            </ModalCard>
          </ModalOverlay>
        )}
      </BanNotificationContainer>
    );
  }

  return (
    <>
      {children}
      
      {/* Appeal Modal */}
      {showAppealModal && (
        <ModalOverlay onClick={(e) => e.target === e.currentTarget && closeAppealModal()}>
          <ModalCard>
            <ModalHeader>
              <h2>Submit Ban Appeal</h2>
              <CloseButton onClick={closeAppealModal}>&times;</CloseButton>
            </ModalHeader>
            
            {modalMessage && (
              <ModalMessage type={modalMessage.type}>
                {modalMessage.message}
              </ModalMessage>
            )}
            
            <AppealForm onSubmit={handleAppealSubmit}>
              <FormGroup>
                <FormLabel>Reason for Appeal *</FormLabel>
                <FormTextarea
                  placeholder="Please explain why you believe the ban should be lifted. Be specific about what happened, why you think the ban was incorrect, or what you've learned if you made a mistake..."
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  maxLength={maxReasonLength}
                  disabled={submitting}
                  required
                />
                <CharacterCount isOver={appealReason.length > maxReasonLength}>
                  {appealReason.length}/{maxReasonLength} characters
                </CharacterCount>
              </FormGroup>

              <CheckboxGroup>
                <input
                  type="checkbox"
                  id="modalRulesAccepted"
                  checked={rulesAccepted}
                  onChange={(e) => setRulesAccepted(e.target.checked)}
                  disabled={submitting}
                  required
                />
                <label htmlFor="modalRulesAccepted">
                  I acknowledge that I have read and understand the platform rules, and I will follow them if my appeal is approved. 
                  I understand that providing false information may result in a permanent ban.
                </label>
              </CheckboxGroup>

              <SubmitButton
                type="submit"
                disabled={submitting || !appealReason.trim() || !rulesAccepted || appealReason.length > maxReasonLength}
              >
                {submitting ? 'Submitting Appeal...' : 'Submit Appeal'}
              </SubmitButton>
            </AppealForm>
          </ModalCard>
        </ModalOverlay>
      )}
    </>
  );
};

export default BanGuard; 