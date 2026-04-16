import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  updateDoc, 
  getDoc,
  Timestamp,
  addDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

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

const StatsBar = styled.div`
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
`;

const StatItem = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 1.5rem;
  flex: 1;
  min-width: 200px;
  
  h3 {
    font-size: 2rem;
    background: ${props => 
    props.$type === 'pending' 
      ? 'linear-gradient(90deg, #ff9a9e 0%, #fad0c4 100%)' 
      : props.$type === 'inProgress' 
        ? 'linear-gradient(90deg, #a18cd1 0%, #fbc2eb 100%)'
        : 'linear-gradient(90deg, #84fab0 0%, #8fd3f4 100%)'};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 0.5rem;
  }
  
  p {
    color: #b8c1ec;
    font-size: 0.9rem;
  }
`;

const FilterBar = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
`;

const FilterButton = styled.button`
  background: ${props => props.$active ? 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)' : 'rgba(255, 255, 255, 0.1)'};
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.$active ? 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)' : 'rgba(255, 255, 255, 0.2)'};
  }
`;

const RequestsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
`;

const RequestCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  }
`;

const RequestHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.5rem;
  }
`;

const RequestTitle = styled.h2`
  font-size: 1.3rem;
  color: #fff;
`;

const StatusBadge = styled.span`
  padding: 0.3rem 0.8rem;
  border-radius: 50px;
  font-size: 0.8rem;
  font-weight: 600;
  background: ${props => 
    props.$status === 'pending' 
      ? 'rgba(255, 154, 158, 0.2)' 
      : props.$status === 'in-progress' 
        ? 'rgba(161, 140, 209, 0.2)'
        : 'rgba(132, 250, 176, 0.2)'};
  color: ${props => 
    props.$status === 'pending' 
      ? '#ff9a9e' 
      : props.$status === 'in-progress' 
        ? '#a18cd1'
        : '#84fab0'};
`;

const RequestInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`;

const InfoItem = styled.div`
  p:first-child {
    color: #b8c1ec;
    font-size: 0.9rem;
    margin-bottom: 0.3rem;
  }
  
  p:last-child {
    color: #fff;
    font-weight: 500;
  }
`;

const RequestContent = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1rem;
  
  h3 {
    color: #b8c1ec;
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }
  
  p {
    color: #fff;
    line-height: 1.5;
  }
`;

const ActionBar = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const ActionButton = styled.button`
  background: ${props => props.$primary ? 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)' : 'rgba(255, 255, 255, 0.05)'};
  color: #fff;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.$primary ? '0 5px 15px rgba(0, 242, 254, 0.3)' : 'none'};
    background: ${props => props.$primary ? 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)' : 'rgba(255, 255, 255, 0.1)'};
  }
  
  &:disabled {
    background: rgba(255, 255, 255, 0.05);
    color: #8a8a9a;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  
  .spinner {
    border: 4px solid rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    border-top: 4px solid #4facfe;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const NoRequestsMessage = styled.div`
  text-align: center;
  padding: 3rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  
  h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: #4facfe;
  }
  
  p {
    color: #b8c1ec;
  }
`;

const AdminRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    resolved: 0
  });
  const { currentUser } = useAuth();
  const notification = useNotification();
  const navigate = useNavigate();
  
  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }
      
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists() || !userDoc.data().isAdmin) {
          notification.addNotification('Access denied. Admin privileges required.', 'error');
          navigate('/');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        notification.addNotification('Error checking admin status.', 'error');
        navigate('/');
      }
    };
    
    checkAdminStatus();
  }, [currentUser, navigate, notification]);
  
  // Fetch admin requests
  useEffect(() => {
    const fetchRequests = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        
        // Create base query
        let requestsQuery;
        
        if (activeFilter === 'all') {
          requestsQuery = query(
            collection(db, 'adminRequests'),
            orderBy('createdAt', 'desc')
          );
        } else if (activeFilter === 'pending') {
          requestsQuery = query(
            collection(db, 'adminRequests'),
            where('status', '==', 'pending'),
            orderBy('createdAt', 'desc')
          );
        } else if (activeFilter === 'in-progress') {
          requestsQuery = query(
            collection(db, 'adminRequests'),
            where('status', '==', 'in-progress'),
            orderBy('createdAt', 'desc')
          );
        } else if (activeFilter === 'resolved') {
          requestsQuery = query(
            collection(db, 'adminRequests'),
            where('status', '==', 'resolved'),
            orderBy('createdAt', 'desc')
          );
        }
        
        // Execute query
        const querySnapshot = await getDocs(requestsQuery);
        
        // Process requests data
        const requestsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          resolvedAt: doc.data().resolvedAt?.toDate() || null
        }));
        
        setRequests(requestsData);
        
        // Update stats
        const pendingCount = requestsData.filter(req => req.status === 'pending').length;
        const inProgressCount = requestsData.filter(req => req.status === 'in-progress').length;
        const resolvedCount = requestsData.filter(req => req.status === 'resolved').length;
        
        setStats({
          pending: pendingCount,
          inProgress: inProgressCount,
          resolved: resolvedCount
        });
      } catch (error) {
        console.error('Error fetching admin requests:', error);
        notification.addNotification('Error fetching admin requests.', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRequests();
  }, [currentUser, activeFilter, notification]);
  
  // Handle taking request
  const handleTakeRequest = async (requestId) => {
    if (!currentUser) return;
    
    try {
      // Get the request data first to access the wagerId
      const requestRef = doc(db, 'adminRequests', requestId);
      const requestDoc = await getDoc(requestRef);
      
      if (!requestDoc.exists()) {
        notification.addNotification('Request not found.', 'error');
        return;
      }
      
      const requestData = requestDoc.data();
      const wagerId = requestData.wagerId;
      
      // Update the request status
      await updateDoc(requestRef, {
        status: 'in-progress',
        adminId: currentUser.uid,
        adminDisplayName: currentUser.displayName || 'Admin',
        updatedAt: Timestamp.now()
      });
      
      // Send a system message to the wager chat
      const chatRef = collection(db, 'wager_chats');
      await addDoc(chatRef, {
        wagerId: wagerId,
        senderId: 'system',
        senderName: 'System',
        content: `Admin ${currentUser.displayName || 'Admin'} has taken this request and will assist with this wager.`,
        isSystem: true,
        timestamp: Timestamp.now()
      });
      
      // Update local state
      setRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === requestId 
            ? {
                ...req, 
                status: 'in-progress',
                adminId: currentUser.uid,
                adminDisplayName: currentUser.displayName || 'Admin',
                updatedAt: new Date()
              } 
            : req
        )
      );
      
      // Update stats
      setStats(prevStats => ({
        ...prevStats,
        pending: prevStats.pending - 1,
        inProgress: prevStats.inProgress + 1
      }));
      
      notification.addNotification('Request assigned to you.', 'success');
    } catch (error) {
      console.error('Error taking request:', error);
      notification.addNotification('Failed to take request.', 'error');
    }
  };
  
  // Handle resolving request
  const handleResolveRequest = async (requestId) => {
    if (!currentUser) return;
    
    try {
      // Get the request data first to access the wagerId
      const requestRef = doc(db, 'adminRequests', requestId);
      const requestDoc = await getDoc(requestRef);
      
      if (!requestDoc.exists()) {
        notification.addNotification('Request not found.', 'error');
        return;
      }
      
      const requestData = requestDoc.data();
      const wagerId = requestData.wagerId;
      
      // Update the request status
      await updateDoc(requestRef, {
        status: 'resolved',
        resolvedBy: currentUser.uid,
        resolvedAt: Timestamp.now(),
        resolved: true
      });
      
      // Send a system message to the wager chat
      const chatRef = collection(db, 'wager_chats');
      await addDoc(chatRef, {
        wagerId: wagerId,
        senderId: 'system',
        senderName: 'System',
        content: `Admin ${currentUser.displayName || 'Admin'} has resolved this request. If you need further assistance, please submit a new request.`,
        isSystem: true,
        timestamp: Timestamp.now()
      });
      
      // Update local state
      setRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === requestId 
            ? {
                ...req, 
                status: 'resolved',
                resolvedBy: currentUser.uid,
                resolvedAt: new Date(),
                resolved: true
              } 
            : req
        )
      );
      
      // Update stats
      setStats(prevStats => ({
        ...prevStats,
        inProgress: prevStats.inProgress - 1,
        resolved: prevStats.resolved + 1
      }));
      
      notification.addNotification('Request marked as resolved.', 'success');
    } catch (error) {
      console.error('Error resolving request:', error);
      notification.addNotification('Failed to resolve request.', 'error');
    }
  };
  
  // Format date to a readable string
  const formatDate = (date) => {
    if (!date) return 'N/A';
    
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Navigate to wager details
  const navigateToWager = (wagerId) => {
    navigate(`/wager/${wagerId}`);
  };
  
  return (
    <Container>
      <Header>Admin Requests</Header>
      
      <StatsBar>
        <StatItem $type="pending">
          <h3>{stats.pending}</h3>
          <p>Pending Requests</p>
        </StatItem>
        
        <StatItem $type="inProgress">
          <h3>{stats.inProgress}</h3>
          <p>In Progress</p>
        </StatItem>
        
        <StatItem $type="resolved">
          <h3>{stats.resolved}</h3>
          <p>Resolved</p>
        </StatItem>
      </StatsBar>
      
      <FilterBar>
        <FilterButton 
          $active={activeFilter === 'all'}
          onClick={() => setActiveFilter('all')}
        >
          All Requests
        </FilterButton>
        
        <FilterButton 
          $active={activeFilter === 'pending'}
          onClick={() => setActiveFilter('pending')}
        >
          Pending
        </FilterButton>
        
        <FilterButton 
          $active={activeFilter === 'in-progress'}
          onClick={() => setActiveFilter('in-progress')}
        >
          In Progress
        </FilterButton>
        
        <FilterButton 
          $active={activeFilter === 'resolved'}
          onClick={() => setActiveFilter('resolved')}
        >
          Resolved
        </FilterButton>
      </FilterBar>
      
      {loading ? (
        <LoadingContainer>
          <div className="spinner"></div>
        </LoadingContainer>
      ) : requests.length === 0 ? (
        <NoRequestsMessage>
          <h3>No Requests Found</h3>
          <p>There are no admin requests matching your filter criteria.</p>
        </NoRequestsMessage>
      ) : (
        <RequestsContainer>
          {requests.map(request => (
            <RequestCard key={request.id}>
              <RequestHeader>
                <RequestTitle>Wager Issue: {request.wagerPartySize}</RequestTitle>
                <StatusBadge $status={request.status}>{request.status}</StatusBadge>
              </RequestHeader>
              
              <RequestInfo>
                <InfoItem>
                  <p>Requested By</p>
                  <p>{request.userDisplayName}</p>
                </InfoItem>
                
                <InfoItem>
                  <p>Wager Amount</p>
                  <p>{request.wagerAmount} Tokens</p>
                </InfoItem>
                
                <InfoItem>
                  <p>Submitted</p>
                  <p>{formatDate(request.createdAt)}</p>
                </InfoItem>
                
                {request.status === 'in-progress' && (
                  <InfoItem>
                    <p>Assigned To</p>
                    <p>{request.adminDisplayName || 'Unknown Admin'}</p>
                  </InfoItem>
                )}
                
                {request.status === 'resolved' && (
                  <InfoItem>
                    <p>Resolved</p>
                    <p>{formatDate(request.resolvedAt)}</p>
                  </InfoItem>
                )}
              </RequestInfo>
              
              <RequestContent>
                <h3>Issue Description</h3>
                <p>{request.reason}</p>
              </RequestContent>
              
              <ActionBar>
                <ActionButton onClick={() => navigateToWager(request.wagerId)}>
                  View Wager
                </ActionButton>
                
                {request.status === 'pending' && (
                  <ActionButton 
                    $primary 
                    onClick={() => handleTakeRequest(request.id)}
                  >
                    Take Request
                  </ActionButton>
                )}
                
                {request.status === 'in-progress' && request.adminId === currentUser?.uid && (
                  <ActionButton 
                    $primary 
                    onClick={() => handleResolveRequest(request.id)}
                  >
                    Mark as Resolved
                  </ActionButton>
                )}
              </ActionBar>
            </RequestCard>
          ))}
        </RequestsContainer>
      )}
    </Container>
  );
};

export default AdminRequests; 