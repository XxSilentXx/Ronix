import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '../contexts/AuthContext';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
  padding: 2rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 2rem;
`;

const Th = styled.th`
  background: #4facfe;
  color: #fff;
  padding: 1rem;
  text-align: left;
`;

const Td = styled.td`
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const Button = styled.button`
  background: ${props => props.approve ? '#4facfe' : props.reject ? '#ff6b6b' : '#ccc'};
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PageTitle = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: #fff;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  background: ${props => 
    props.status === 'completed' ? '#51cf66' : 
    props.status === 'rejected' ? '#ff6b6b' : 
    props.status === 'processing' ? '#fd7e14' : '#4facfe'};
  color: #fff;
  font-size: 0.8rem;
`;

const NoteInput = styled.textarea`
  width: 100%;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  color: #fff;
  margin-top: 0.5rem;
`;

const Section = styled.div`
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #4facfe;
`;

const RequestDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
`;

const DetailItem = styled.div`
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 1rem;
`;

const DetailLabel = styled.div`
  color: #4facfe;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
`;

const DetailValue = styled.div`
  font-size: 1.1rem;
  font-weight: ${props => props.highlight ? 'bold' : 'normal'};
  color: ${props => props.highlight ? '#51cf66' : '#fff'};
`;

function AdminWithdrawals() {
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [processing, setProcessing] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'regular', 'referral'
  const { currentUser } = useAuth();
  const functions = getFunctions();
  
  // Helper function to determine withdrawal type for backward compatibility
  const getWithdrawalType = (request) => {
    if (request.withdrawalType) return request.withdrawalType;
    // For older requests without withdrawalType, check fromReferrals flag
    if (request.fromReferrals) return 'referral';
    return 'regular';
  };

  useEffect(() => {
    fetchWithdrawalRequests();
  }, []);

  const fetchWithdrawalRequests = async () => {
    try {
      setLoading(true);
      const requestsCollection = collection(db, 'withdrawalRequests');
      const snapshot = await getDocs(requestsCollection);
      
      const requests = [];
      snapshot.forEach(doc => {
        requests.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          processedAt: doc.data().processedAt?.toDate() || null
        });
      });
      
      // Sort by status (pending first) and then by createdAt (newest first)
      requests.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return b.createdAt - a.createdAt;
      });
      
      setWithdrawalRequests(requests);
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRequest = (request) => {
    setSelectedRequest(request);
    setAdminNote('');
  };

  const handleApproveRequest = async () => {
    if (!selectedRequest) return;
    try {
      setProcessing(true);
      
      const processWithdrawal = httpsCallable(functions, 'processWithdrawalRequest');
      const result = await processWithdrawal({
        requestId: selectedRequest.id,
        status: 'approved',
        adminNote
      });
      
      if (result.data.success) {
        fetchWithdrawalRequests();
        setSelectedRequest(null);
      }
    } catch (error) {
      console.error('Error approving withdrawal request:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest) return;
    try {
      setProcessing(true);
      
      const processWithdrawal = httpsCallable(functions, 'processWithdrawalRequest');
      const result = await processWithdrawal({
        requestId: selectedRequest.id,
        status: 'rejected',
        adminNote
      });
      
      if (result.data.success) {
        fetchWithdrawalRequests();
        setSelectedRequest(null);
      }
    } catch (error) {
      console.error('Error rejecting withdrawal request:', error);
    } finally {
      setProcessing(false);
    }
  };

  // Filter withdrawal requests based on type
  const filteredRequests = withdrawalRequests.filter(request => {
    if (typeFilter === 'all') return true;
    const withdrawalType = getWithdrawalType(request);
    if (typeFilter === 'regular') return withdrawalType !== 'referral';
    if (typeFilter === 'referral') return withdrawalType === 'referral';
    return true;
  });

  return (
    <Container>
      <PageTitle>Withdrawal Requests</PageTitle>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1rem',
        padding: '1rem',
        backgroundColor: 'rgba(79, 172, 254, 0.1)',
        borderRadius: '8px'
      }}>
        <div style={{ color: '#4facfe' }}>
          <strong>Total: {withdrawalRequests.length}</strong> | 
          <span style={{ color: '#A259F7', marginLeft: '0.5rem' }}>
            Referral: {withdrawalRequests.filter(r => getWithdrawalType(r) === 'referral').length}
          </span> | 
          <span style={{ color: '#4facfe', marginLeft: '0.5rem' }}>
            Regular: {withdrawalRequests.filter(r => getWithdrawalType(r) !== 'referral').length}
          </span>
        </div>
        <div>
          <label style={{ color: '#4facfe', marginRight: '0.5rem' }}>Filter by Type:</label>
          <select 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ 
              padding: '0.5rem', 
              borderRadius: '4px', 
              border: '1px solid #4facfe',
              backgroundColor: '#1a1a1a',
              color: '#fff'
            }}
          >
            <option value="all">All Withdrawals</option>
            <option value="regular">Regular Tokens</option>
            <option value="referral">Referral Earnings</option>
          </select>
        </div>
      </div>
      
      {selectedRequest && (
        <Section>
          <SectionTitle>Request Details</SectionTitle>
          <RequestDetails>
            <DetailItem>
              <DetailLabel>User ID</DetailLabel>
              <DetailValue>{selectedRequest.userId}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>Withdrawal Method</DetailLabel>
              <DetailValue>{selectedRequest.withdrawalMethod === 'paypal' ? 'PayPal' : selectedRequest.withdrawalMethod === 'cashapp' ? 'CashApp' : 'Unknown'}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>{selectedRequest.withdrawalMethod === 'paypal' ? 'PayPal Email' : 'CashApp $Cashtag'}</DetailLabel>
              <DetailValue>{selectedRequest.identifier}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>Request Amount</DetailLabel>
              <DetailValue>{selectedRequest.amountTokens} tokens (${selectedRequest.amountUSD?.toFixed(2)})</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>Service Fee</DetailLabel>
              <DetailValue>{selectedRequest.fee} tokens (${(selectedRequest.fee * 0.001).toFixed(2)})</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>User Will Receive</DetailLabel>
              <DetailValue highlight>{selectedRequest.amountAfterFee} tokens (${(selectedRequest.amountAfterFee * 0.001).toFixed(2)})</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>Request Date</DetailLabel>
              <DetailValue>{selectedRequest.createdAt.toLocaleString()}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>Status</DetailLabel>
              <StatusBadge status={selectedRequest.status}>{selectedRequest.status}</StatusBadge>
            </DetailItem>
            <DetailItem>
              <DetailLabel>Withdrawal Type</DetailLabel>
              <DetailValue style={{ color: getWithdrawalType(selectedRequest) === 'referral' ? '#A259F7' : '#4facfe' }}>
                {getWithdrawalType(selectedRequest) === 'referral' ? 'Referral Earnings' : 'Regular Tokens'}
              </DetailValue>
            </DetailItem>
          </RequestDetails>
          
          {selectedRequest.status === 'pending' && (
            <>
              <NoteInput 
                rows={3} 
                placeholder="Admin note (optional)" 
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
              />
              <ButtonContainer style={{ marginTop: '1rem' }}>
                <Button 
                  approve 
                  onClick={handleApproveRequest}
                  disabled={processing}
                >
                  {processing ? 'Processing...' : 'Approve & Pay'}
                </Button>
                <Button 
                  reject 
                  onClick={handleRejectRequest}
                  disabled={processing}
                >
                  {processing ? 'Processing...' : 'Reject Request'}
                </Button>
              </ButtonContainer>
            </>
          )}
        </Section>
      )}
      
      <Table>
        <thead>
          <tr>
            <Th>User</Th>
            <Th>Amount</Th>
            <Th>After Fee</Th>
            <Th>Type</Th>
            <Th>Method</Th>
            <Th>Identifier</Th>
            <Th>Date</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {filteredRequests.map(request => (
            <tr key={request.id}>
              <Td>{request.userId.substring(0, 8)}...</Td>
              <Td>{request.amountTokens} tokens</Td>
              <Td>{request.amountAfterFee} tokens</Td>
              <Td style={{ color: getWithdrawalType(request) === 'referral' ? '#A259F7' : '#4facfe' }}>
                {getWithdrawalType(request) === 'referral' ? 'Referral' : 'Regular'}
              </Td>
              <Td>{request.withdrawalMethod === 'paypal' ? 'PayPal' : request.withdrawalMethod === 'cashapp' ? 'CashApp' : 'Unknown'}</Td>
              <Td>{request.identifier}</Td>
              <Td>{request.createdAt.toLocaleDateString()}</Td>
              <Td>
                <StatusBadge status={request.status}>
                  {request.status}
                </StatusBadge>
              </Td>
              <Td>
                <Button 
                  onClick={() => handleSelectRequest(request)}
                  disabled={processing}
                >
                  View Details
                </Button>
              </Td>
            </tr>
          ))}
          {filteredRequests.length === 0 && !loading && (
            <tr>
              <Td colSpan={9} style={{ textAlign: 'center' }}>
                {typeFilter === 'all' ? 'No withdrawal requests found' : 
                 typeFilter === 'regular' ? 'No regular token withdrawal requests found' :
                 'No referral earnings withdrawal requests found'}
              </Td>
            </tr>
          )}
          {loading && (
            <tr>
              <Td colSpan={9} style={{ textAlign: 'center' }}>Loading...</Td>
            </tr>
          )}
        </tbody>
      </Table>
    </Container>
  );
}

export default AdminWithdrawals;

// This is a new file for the admin withdrawals page. Make sure to add a route in your router (e.g., App.js):
// <Route path="/admin/withdrawals" element={<AdminWithdrawals />} /> 