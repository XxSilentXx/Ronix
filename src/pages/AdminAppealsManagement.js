import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getPendingAppeals, reviewAppeal, getBanDetails } from '../firebase/banUtils';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
  padding: 2rem;
`;

const Header = styled.h1`
  font-size: 2.5rem;
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 2rem;
`;

const AppealsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const AppealCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  }
`;

const AppealHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const UserInfo = styled.div`
  h3 {
    margin: 0 0 0.5rem 0;
    color: #4facfe;
    font-size: 1.5rem;
  }
  
  p {
    margin: 0.25rem 0;
    color: #b8c1ec;
    font-size: 0.9rem;
  }
`;

const AppealStatus = styled.div`
  background: ${props => {
    switch (props.status) {
      case 'pending': return 'rgba(255, 165, 2, 0.2)';
      case 'approved': return 'rgba(46, 213, 115, 0.2)';
      case 'denied': return 'rgba(255, 71, 87, 0.2)';
      default: return 'rgba(79, 172, 254, 0.2)';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'pending': return '#ffa502';
      case 'approved': return '#2ed573';
      case 'denied': return '#ff4757';
      default: return '#4facfe';
    }
  }};
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: bold;
  text-transform: uppercase;
  font-size: 0.8rem;
`;

const BanDetails = styled.div`
  background: rgba(255, 71, 87, 0.1);
  border-radius: 10px;
  padding: 1rem;
  margin: 1rem 0;
  border-left: 4px solid #ff4757;
  
  h4 {
    margin: 0 0 0.5rem 0;
    color: #ff4757;
  }
  
  p {
    margin: 0.25rem 0;
    color: #b8c1ec;
  }
`;

const AppealContent = styled.div`
  background: rgba(79, 172, 254, 0.1);
  border-radius: 10px;
  padding: 1rem;
  margin: 1rem 0;
  border-left: 4px solid #4facfe;
  
  h4 {
    margin: 0 0 0.5rem 0;
    color: #4facfe;
  }
  
  p {
    margin: 0.5rem 0;
    color: #fff;
    line-height: 1.6;
  }
`;

const EvidenceSection = styled.div`
  margin: 1rem 0;
  
  h4 {
    margin: 0 0 0.5rem 0;
    color: #4facfe;
  }
  
  .evidence-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .evidence-item {
    background: rgba(255, 255, 255, 0.1);
    padding: 0.5rem 1rem;
    border-radius: 8px;
    color: #b8c1ec;
    font-size: 0.9rem;
  }
`;

const ReviewSection = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 1.5rem;
  margin-top: 1.5rem;
  border-top: 2px solid #4facfe;
`;

const ResponseForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ResponseTextarea = styled.textarea`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  padding: 12px 16px;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  font-family: inherit;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: #4facfe;
    box-shadow: 0 0 10px rgba(79, 172, 254, 0.3);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
  background: ${props => {
    if (props.approve) return 'linear-gradient(90deg, #2ed573 0%, #17c0eb 100%)';
    if (props.deny) return 'linear-gradient(90deg, #ff4757 0%, #ff3742 100%)';
    return 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)';
  }};
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
  min-width: 120px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px ${props => {
      if (props.approve) return 'rgba(46, 213, 115, 0.4)';
      if (props.deny) return 'rgba(255, 71, 87, 0.4)';
      return 'rgba(79, 172, 254, 0.4)';
    }};
  }
  
  &:disabled {
    background: #666;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #b8c1ec;
  
  h3 {
    color: #4facfe;
    margin-bottom: 1rem;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #4facfe;
`;

const AdminAppealsManagement = () => {
  const [appeals, setAppeals] = useState([]);
  const [banDetails, setBanDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [processingAppeal, setProcessingAppeal] = useState(null);
  const [responseTexts, setResponseTexts] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }
      
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists() && userDoc.data().isAdmin) {
          setIsAdmin(true);
          loadAppeals();
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        navigate('/');
      }
    };
    
    checkAdminStatus();
  }, [currentUser, navigate]);

  const loadAppeals = async () => {
    setLoading(true);
    try {
      const pendingAppeals = await getPendingAppeals();
      setAppeals(pendingAppeals);
      
      const banDetailsMap = {};
      for (const appeal of pendingAppeals) {
        if (appeal.banId) {
          try {
            const banDetail = await getBanDetails(appeal.banId);
            if (banDetail) {
              banDetailsMap[appeal.banId] = banDetail;
            }
          } catch (error) {
            console.error(`Error loading ban details for banId ${appeal.banId}:`, error);
          }
        }
      }
      setBanDetails(banDetailsMap);
    } catch (error) {
      console.error('Error loading appeals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (appealId, value) => {
    setResponseTexts(prev => ({
      ...prev,
      [appealId]: value
    }));
  };

  const handleAppealReview = async (appealId, decision) => {
    const responseText = responseTexts[appealId] || '';
    
    if (!responseText.trim()) {
      alert('Please provide a response message.');
      return;
    }

    setProcessingAppeal(appealId);
    try {
      await reviewAppeal(appealId, decision, responseText, currentUser.uid);
      alert(`Appeal ${decision} successfully.`);
      
      // Remove the reviewed appeal from the list
      setAppeals(prev => prev.filter(appeal => appeal.id !== appealId));
      
      // Clear the response text
      setResponseTexts(prev => {
        const newTexts = { ...prev };
        delete newTexts[appealId];
        return newTexts;
      });
    } catch (error) {
      console.error('Error reviewing appeal:', error);
      alert('Error processing appeal: ' + error.message);
    } finally {
      setProcessingAppeal(null);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp.toDate()).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAdmin) {
    return (
      <Container>
        <Header>Access Denied</Header>
        <p>You do not have permission to access this page.</p>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container>
        <Header>Appeals Management</Header>
        <LoadingSpinner>
          <p>Loading appeals...</p>
        </LoadingSpinner>
      </Container>
    );
  }

  return (
    <Container>
      <Header>Appeals Management</Header>
      <p style={{ color: '#b8c1ec', marginBottom: '2rem' }}>
        Review and respond to user ban appeals. Total pending appeals: {appeals.length}
      </p>

      {appeals.length === 0 ? (
        <EmptyState>
          <h3>No Pending Appeals</h3>
          <p>All appeals have been reviewed. Check back later for new submissions.</p>
        </EmptyState>
      ) : (
        <AppealsList>
          {appeals.map(appeal => (
            <AppealCard key={appeal.id}>
              <AppealHeader>
                <UserInfo>
                  <h3>{appeal.username}</h3>
                  <p><strong>Appeal ID:</strong> {appeal.appealId}</p>
                  <p><strong>Submitted:</strong> {formatDate(appeal.appealDate)}</p>
                  <p><strong>User ID:</strong> {appeal.userId}</p>
                </UserInfo>
                <AppealStatus status={appeal.status}>
                  {appeal.status}
                </AppealStatus>
              </AppealHeader>

              <BanDetails>
                <h4>Original Ban Information</h4>
                <p><strong>Ban ID:</strong> {appeal.banId}</p>
                {banDetails[appeal.banId] ? (
                  <>
                    <p><strong>Reason:</strong> {banDetails[appeal.banId].reason}</p>
                    <p><strong>Public Reason:</strong> {banDetails[appeal.banId].publicReason}</p>
                    <p><strong>Ban Date:</strong> {banDetails[appeal.banId].banDate ? 
                      new Date(banDetails[appeal.banId].banDate.toDate()).toLocaleDateString() : 'Unknown'}</p>
                    <p><strong>Expires:</strong> {banDetails[appeal.banId].expirationDate ? 
                      new Date(banDetails[appeal.banId].expirationDate.toDate()).toLocaleDateString() : 'Permanent'}</p>
                    <p><strong>Banned By:</strong> {banDetails[appeal.banId].adminName || 'Unknown Admin'}</p>
                    {banDetails[appeal.banId].adminNotes && (
                      <p><strong>Admin Notes:</strong> {banDetails[appeal.banId].adminNotes}</p>
                    )}
                    {banDetails[appeal.banId].ipBanned && <p style={{color: '#ffa502'}}> IP Banned</p>}
                    {banDetails[appeal.banId].epicIdBanned && <p style={{color: '#ffa502'}}> Epic ID Banned</p>}
                  </>
                ) : (
                  <p style={{color: '#ffa502'}}>Loading ban information...</p>
                )}
              </BanDetails>

              <AppealContent>
                <h4>User's Appeal</h4>
                <p>{appeal.reason}</p>
              </AppealContent>

              {appeal.evidence && appeal.evidence.length > 0 && (
                <EvidenceSection>
                  <h4>Evidence Provided</h4>
                  <div className="evidence-list">
                    {appeal.evidence.map((evidence, index) => (
                      <div key={index} className="evidence-item">
                        Evidence {index + 1}
                      </div>
                    ))}
                  </div>
                </EvidenceSection>
              )}

              <ReviewSection>
                <h4 style={{ color: '#4facfe', marginBottom: '1rem' }}>Admin Review</h4>
                <ResponseForm onSubmit={(e) => e.preventDefault()}>
                  <ResponseTextarea
                    placeholder="Enter your response to the user's appeal. Explain your decision clearly and professionally."
                    value={responseTexts[appeal.id] || ''}
                    onChange={(e) => handleResponseChange(appeal.id, e.target.value)}
                    disabled={processingAppeal === appeal.id}
                  />
                  
                  <ButtonGroup>
                    <ActionButton
                      approve
                      onClick={() => handleAppealReview(appeal.id, 'approved')}
                      disabled={processingAppeal === appeal.id || !responseTexts[appeal.id]?.trim()}
                    >
                      {processingAppeal === appeal.id ? 'Processing...' : 'Approve Appeal'}
                    </ActionButton>
                    
                    <ActionButton
                      deny
                      onClick={() => handleAppealReview(appeal.id, 'denied')}
                      disabled={processingAppeal === appeal.id || !responseTexts[appeal.id]?.trim()}
                    >
                      {processingAppeal === appeal.id ? 'Processing...' : 'Deny Appeal'}
                    </ActionButton>
                  </ButtonGroup>
                </ResponseForm>
              </ReviewSection>
            </AppealCard>
          ))}
        </AppealsList>
      )}
    </Container>
  );
};

export default AdminAppealsManagement; 