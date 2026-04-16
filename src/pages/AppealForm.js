import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { checkUserBanStatus, submitAppeal, getUserAppealStatus } from '../firebase/banUtils';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const AppealCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 2rem;
  max-width: 800px;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
`;

const Header = styled.h1`
  font-size: 2rem;
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 1rem;
  text-align: center;
`;

const Subtitle = styled.p`
  text-align: center;
  color: #b8c1ec;
  margin-bottom: 2rem;
  line-height: 1.6;
`;

const BanInfo = styled.div`
  background: rgba(255, 71, 87, 0.1);
  border-radius: 10px;
  padding: 1.5rem;
  margin: 1.5rem 0;
  border-left: 4px solid #ff4757;
  
  h3 {
    margin: 0 0 1rem 0;
    color: #ff4757;
  }
  
  p {
    margin: 0.5rem 0;
    color: #b8c1ec;
  }
  
  .label {
    color: #4facfe;
    font-weight: bold;
  }
`;

const AppealForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FormLabel = styled.label`
  color: #4facfe;
  font-weight: bold;
  font-size: 1.1rem;
`;

const FormTextarea = styled.textarea`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  color: white;
  padding: 15px 20px;
  font-size: 1rem;
  min-height: 150px;
  resize: vertical;
  font-family: inherit;
  line-height: 1.6;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: #4facfe;
    box-shadow: 0 0 15px rgba(79, 172, 254, 0.3);
  }
`;

const CharacterCount = styled.div`
  text-align: right;
  font-size: 0.9rem;
  color: ${props => props.isOver ? '#ff4757' : '#b8c1ec'};
  margin-top: 0.5rem;
`;

const EvidenceSection = styled.div`
  background: rgba(79, 172, 254, 0.1);
  border-radius: 10px;
  padding: 1.5rem;
  border-left: 4px solid #4facfe;
`;

const EvidenceInput = styled.input`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  padding: 12px 16px;
  font-size: 1rem;
  width: 100%;
  margin-bottom: 0.5rem;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: #4facfe;
  }
`;

const AddEvidenceButton = styled.button`
  background: rgba(79, 172, 254, 0.2);
  color: #4facfe;
  border: 1px solid #4facfe;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(79, 172, 254, 0.3);
  }
`;

const EvidenceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const EvidenceItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.8rem;
  border-radius: 8px;
  
  span {
    color: #b8c1ec;
    font-size: 0.9rem;
  }
  
  button {
    background: none;
    border: none;
    color: #ff4757;
    cursor: pointer;
    font-size: 0.9rem;
    
    &:hover {
      color: #ff3742;
    }
  }
`;

const Guidelines = styled.div`
  background: rgba(255, 165, 2, 0.1);
  border-radius: 10px;
  padding: 1.5rem;
  margin: 1.5rem 0;
  border-left: 4px solid #ffa502;
  
  h3 {
    margin: 0 0 1rem 0;
    color: #ffa502;
  }
  
  ul {
    margin: 0;
    padding-left: 1.5rem;
    color: #b8c1ec;
    
    li {
      margin: 0.5rem 0;
      line-height: 1.5;
    }
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin: 1rem 0;
  
  input[type="checkbox"] {
    width: 20px;
    height: 20px;
    margin-top: 2px;
  }
  
  label {
    color: #b8c1ec;
    line-height: 1.5;
    cursor: pointer;
  }
`;

const SubmitButton = styled.button`
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 25px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(79, 172, 254, 0.4);
  }
  
  &:disabled {
    background: #666;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const StatusMessage = styled.div`
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
  border-radius: 10px;
  padding: 1rem;
  margin: 1rem 0;
  text-align: center;
`;

const AppealFormPage = () => {
  const [banStatus, setBanStatus] = useState(null);
  const [existingAppeal, setExistingAppeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [evidence, setEvidence] = useState([]);
  const [newEvidence, setNewEvidence] = useState('');
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const maxReasonLength = 2000;

  useEffect(() => {
    const checkEligibility = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      try {
        // Check ban status
        const banResult = await checkUserBanStatus(currentUser.uid);
        setBanStatus(banResult);

        if (!banResult.isBanned) {
          setStatusMessage({
            type: 'info',
            message: 'Your account is not currently banned. You can return to the platform.'
          });
          setLoading(false);
          return;
        }

        // Check existing appeal
        const appeal = await getUserAppealStatus(currentUser.uid);
        setExistingAppeal(appeal);

        if (appeal && appeal.status === 'pending') {
          setStatusMessage({
            type: 'info',
            message: 'You already have a pending appeal. Please wait for admin review.'
          });
        }

      } catch (error) {
        console.error('AppealForm: Error checking eligibility:', error);
        setStatusMessage({
          type: 'error',
          message: 'Error loading appeal information. Please try again later.'
        });
      } finally {
        setLoading(false);
      }
    };

    checkEligibility();
  }, [currentUser, navigate]);

  const addEvidence = () => {
    if (newEvidence.trim() && evidence.length < 5) {
      setEvidence([...evidence, newEvidence.trim()]);
      setNewEvidence('');
    }
  };

  const removeEvidence = (index) => {
    setEvidence(evidence.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!appealReason.trim()) {
      setStatusMessage({
        type: 'error',
        message: 'Please provide a reason for your appeal.'
      });
      return;
    }

    if (appealReason.length > maxReasonLength) {
      setStatusMessage({
        type: 'error',
        message: `Appeal reason must be ${maxReasonLength} characters or less.`
      });
      return;
    }

    if (!rulesAccepted) {
      setStatusMessage({
        type: 'error',
        message: 'Please acknowledge that you understand the platform rules.'
      });
      return;
    }

    setSubmitting(true);
    setStatusMessage({
      type: 'info',
      message: 'Submitting your appeal... Please wait.'
    });

    try {
      const result = await submitAppeal(currentUser.uid, {
        reason: appealReason,
        evidence: evidence
      });

      setStatusMessage({
        type: 'success',
        message: 'Your appeal has been submitted successfully.'
      });

      // Clear form
      setAppealReason('');
      setEvidence([]);
      setRulesAccepted(false);

      // Refresh appeal status
      const appeal = await getUserAppealStatus(currentUser.uid);
      setExistingAppeal(appeal);

    } catch (error) {
      console.error('AppealForm: Error submitting appeal:', error);
      setStatusMessage({
        type: 'error',
        message: 'Error submitting appeal: ' + error.message + '. Please try again or contact support if the issue persists.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp.toDate()).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Container>
        <AppealCard>
          <Header>Loading...</Header>
          <p style={{ textAlign: 'center' }}>Checking your ban status...</p>
        </AppealCard>
      </Container>
    );
  }

  if (!banStatus?.isBanned) {
    return (
      <Container>
        <AppealCard>
          <Header>Account Status</Header>
          <StatusMessage type="info">
            Your account is not currently banned. You can return to the platform.
          </StatusMessage>
          <SubmitButton onClick={() => navigate('/')}>
            Return to Home
          </SubmitButton>
        </AppealCard>
      </Container>
    );
  }

  return (
    <Container>
      <AppealCard>
        <Header>Submit Ban Appeal</Header>
        <Subtitle>
          If you believe your ban was issued in error or you'd like to appeal the decision, 
          please fill out the form below with a detailed explanation.
        </Subtitle>

        {banStatus && (
          <BanInfo>
            <h3>Current Ban Information</h3>
            <p><span className="label">Reason:</span> {banStatus.banDetails?.publicReason || banStatus.banDetails?.reason || 'No reason provided'}</p>
            <p><span className="label">Ban Date:</span> {formatDate(banStatus.banDetails?.banDate)}</p>
            <p><span className="label">Duration:</span> {
              banStatus.banDetails?.expirationDate ? 
                `Until ${formatDate(banStatus.banDetails.expirationDate)}` : 
                'Permanent'
            }</p>
          </BanInfo>
        )}

        {existingAppeal && existingAppeal.status === 'pending' && (
          <StatusMessage type="info">
            <strong>Pending Appeal:</strong> You submitted an appeal on {formatDate(existingAppeal.appealDate)}. 
            Please wait for admin review. Submitting multiple appeals may delay the process.
          </StatusMessage>
        )}

        {existingAppeal && existingAppeal.status === 'denied' && (
          <StatusMessage type="error">
            <strong>Previous Appeal Denied:</strong> Your appeal was reviewed and denied on {formatDate(existingAppeal.reviewDate)}.
            <br />
            <strong>Admin Response:</strong> {existingAppeal.adminResponse}
            <br />
            You may submit a new appeal if you have additional information.
          </StatusMessage>
        )}

        {statusMessage && (
          <StatusMessage type={statusMessage.type}>
            {statusMessage.message}
          </StatusMessage>
        )}

        <Guidelines>
          <h3>Appeal Guidelines</h3>
          <ul>
            <li>Be honest and specific about what happened</li>
            <li>Provide any evidence that supports your case</li>
            <li>Acknowledge if you made a mistake and explain how you've learned</li>
            <li>Be respectful and professional in your language</li>
            <li>False information in appeals may result in permanent bans</li>
            <li>Appeals are typically reviewed within 3-5 business days</li>
          </ul>
        </Guidelines>

        {/* Debug info for development */}
        {process.env.NODE_ENV === 'development' && (
          <StatusMessage type="info">
            <strong>Debug Info:</strong><br/>
            Ban Status: {banStatus?.isBanned ? 'Banned' : 'Not Banned'}<br/>
            Existing Appeal: {existingAppeal ? existingAppeal.status : 'None'}<br/>
            Form Available: {(!existingAppeal || existingAppeal.status !== 'pending') ? 'Yes' : 'No'}
          </StatusMessage>
        )}

        {(!existingAppeal || existingAppeal.status !== 'pending') && (
          <AppealForm onSubmit={handleSubmit}>
            <FormGroup>
              <FormLabel>Reason for Appeal *</FormLabel>
              <FormTextarea
                placeholder="Please explain why you believe the ban should be lifted. Be specific about what happened, why you think the ban was incorrect, or what you've learned if you made a mistake..."
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                maxLength={maxReasonLength}
                required
              />
              <CharacterCount isOver={appealReason.length > maxReasonLength}>
                {appealReason.length}/{maxReasonLength} characters
              </CharacterCount>
            </FormGroup>

            <EvidenceSection>
              <h3 style={{ margin: '0 0 1rem 0', color: '#4facfe' }}>Supporting Evidence (Optional)</h3>
              <p style={{ margin: '0 0 1rem 0', color: '#b8c1ec', fontSize: '0.9rem' }}>
                Add links to screenshots, videos, or other evidence that supports your appeal. Maximum 5 items.
              </p>
              
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <EvidenceInput
                  type="url"
                  placeholder="Enter a link to evidence (e.g., screenshot, video, etc.)"
                  value={newEvidence}
                  onChange={(e) => setNewEvidence(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEvidence())}
                />
                <AddEvidenceButton
                  type="button"
                  onClick={addEvidence}
                  disabled={!newEvidence.trim() || evidence.length >= 5}
                >
                  Add
                </AddEvidenceButton>
              </div>

              {evidence.length > 0 && (
                <EvidenceList>
                  {evidence.map((item, index) => (
                    <EvidenceItem key={index}>
                      <span>{item}</span>
                      <button type="button" onClick={() => removeEvidence(index)}>
                        Remove
                      </button>
                    </EvidenceItem>
                  ))}
                </EvidenceList>
              )}
            </EvidenceSection>

            <CheckboxGroup>
              <input
                type="checkbox"
                id="rulesAccepted"
                checked={rulesAccepted}
                onChange={(e) => setRulesAccepted(e.target.checked)}
                required
              />
              <label htmlFor="rulesAccepted">
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
        )}

        {existingAppeal && existingAppeal.status === 'pending' && (
          <StatusMessage type="info">
            <strong>Form Not Available:</strong> You already have a pending appeal. 
            Please wait for the admin team to review your current appeal before submitting a new one.
          </StatusMessage>
        )}
      </AppealCard>
    </Container>
  );
};

export default AppealFormPage; 