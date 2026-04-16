import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { useTokens } from '../contexts/TokenContext';
import PurchaseTokensModal from '../components/PurchaseTokensModal';
import TipUserModalRedesigned from '../components/TipUserModalRedesigned';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import WithdrawTokensModal from '../components/WithdrawTokensModal';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { STRIPE_PUBLISHABLE_KEY } from '../stripe/config';
import CoinStore from '../components/CoinStore';

// Initialize Stripe
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

const WalletContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
  padding: 2rem;
`;

const WalletHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem 1rem;
  margin-bottom: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  
  h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 800;
  }
`;

const BalanceCard = styled.div`
  background: linear-gradient(135deg, rgba(79, 172, 254, 0.1) 0%, rgba(0, 242, 254, 0.1) 100%);
  border-radius: 15px;
  padding: 2rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(79, 172, 254, 0.3);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
`;

const BalanceTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #fff;
`;

const BalanceAmount = styled.div`
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  color: #4facfe;
`;

const BalanceUSD = styled.div`
  font-size: 1.35rem;
  color: #00FFD0;
  font-weight: 700;
  margin-bottom: 1.1rem;
  letter-spacing: 0.01em;
  text-shadow: 0 2px 12px #00FFD055;
  display: flex;
  align-items: center;
  gap: 0.4em;
`;

const PurchaseButton = styled.button`
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(79, 172, 254, 0.4);
  }
`;

const TransactionsSection = styled.div`
  margin-bottom: 2rem;
`;

const TransactionsTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #fff;
`;

const TransactionsList = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  overflow: hidden;
`;

const TransactionItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const TransactionInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const TransactionType = styled.span`
  font-weight: bold;
  margin-bottom: 0.3rem;
`;

const TransactionDate = styled.span`
  font-size: 0.9rem;
  color: #ccc;
`;

const TransactionAmount = styled.span`
  font-weight: bold;
  color: ${props => props.$positive ? '#51cf66' : '#ff6b6b'};
`;

const EmptyTransactions = styled.div`
  padding: 2rem;
  text-align: center;
  color: #ccc;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  
  &:after {
    content: " ";
    display: block;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 6px solid #4facfe;
    border-color: #4facfe transparent #4facfe transparent;
    animation: spinner 1.2s linear infinite;
  }
  
  @keyframes spinner {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const LoginPrompt = styled.div`
  text-align: center;
  padding: 3rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  margin: 2rem 0;
`;

const LoginButton = styled.button`
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(79, 172, 254, 0.4);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const InfoCard = styled.div`
  background: rgba(0, 0, 0, 0.2);
  border-radius: 16px;
  padding: 2rem;
  margin-top: 2rem;
`;

const InfoTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #4facfe;
`;

const InfoItem = styled.div`
  margin-bottom: 1rem;
`;

const TOKEN_TO_USD = 1.0; // 1 token = $0.001

const Wallet = () => {
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const { balance, transactions, loading, refreshBalance } = useTokens();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const notification = useNotification();
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(true);
  
  // Helper function to determine withdrawal type for backward compatibility
  const getWithdrawalType = (request) => {
    if (request.withdrawalType) return request.withdrawalType;
    // For older requests without withdrawalType, check fromReferrals flag
    if (request.fromReferrals) return 'referral';
    return 'regular';
  };
  
  // Filter transactions to hide entry fees for wagers that have been refunded
  const filteredTransactions = useMemo(() => {
    // If there are no transactions, return empty array
    if (!transactions || transactions.length === 0) return [];
    
    // Create a set of wagerId's that have refunds
    const refundedWagerIds = new Set(
      transactions
        .filter(tx => tx.type === 'refund')
        .map(tx => tx.wagerId)
        .filter(Boolean)
    );
    
    // Filter out entry fee transactions for refunded wagers
    return transactions.filter(transaction => {
      // If this is a wager entry transaction and the wagerId has a refund, hide it
      if (
        (transaction.type === 'wager_entry' || 
         (transaction.type === 'spend' && transaction.reason === 'wager')) && 
        transaction.wagerId && 
        refundedWagerIds.has(transaction.wagerId)
      ) {
        return false;
      }
      return true;
    });
  }, [transactions]);
  
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getTransactionTitle = (transaction) => {
    if (transaction.type === 'purchase') {
      return 'Token Purchase';
    } else if (transaction.type === 'spend') {
      if (transaction.reason === 'wager') {
        return 'Wager Entry';
      } else if (transaction.reason === 'withdrawal') {
        return 'Token Withdrawal';
      }
      return 'Token Spent';
    } else if (transaction.type === 'win') {
      return 'Wager Won';
    } else if (transaction.type === 'tip_sent') {
      return `Tip Sent to ${transaction.recipientName || 'User'}`;
    } else if (transaction.type === 'tip_received') {
      return `Tip Received from ${transaction.senderName || 'User'}`;
    }
    return 'Transaction';
  };
  
  const handleRefreshBalance = async () => {
    try {
      notification.addNotification('Refreshing balance...', 'info');
      await refreshBalance();
      notification.addNotification('Balance updated!', 'success');
    } catch (error) {
      notification.addNotification(`Failed to refresh balance: ${error.message}`, 'error');
    }
  };

  const handleOpenPurchase = () => {
    setIsPurchaseModalOpen(true);
    notification.addNotification('Opening token purchase form...', 'info');
  };

  const handleClosePurchase = () => {
    setIsPurchaseModalOpen(false);
  };

  const handleOpenTip = () => {
    setIsTipModalOpen(true);
    notification.addNotification('Opening tip form...', 'info');
  };

  const handleCloseTip = () => {
    setIsTipModalOpen(false);
  };

  const handleOpenWithdraw = () => {
    setIsWithdrawModalOpen(true);
    notification.addNotification('Opening withdrawal form...', 'info');
  };

  const handleCloseWithdraw = () => {
    setIsWithdrawModalOpen(false);
  };
  
  // Fetch withdrawal history
  const fetchWithdrawals = async () => {
    if (!currentUser) return;
    setWithdrawalsLoading(true);
    const q = query(collection(db, 'withdrawalRequests'), where('userId', '==', currentUser.uid));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setWithdrawals(data);
    setWithdrawalsLoading(false);
  };
  React.useEffect(() => {
    fetchWithdrawals();
    // Also refetch when modal closes
  }, [currentUser, isWithdrawModalOpen === false]);
  
  // Helper to determine if a transaction is positive (receiving tokens)
  const isPositiveTransaction = (transaction) => {
    return (
      transaction.type === 'purchase' ||
      transaction.type === 'win' ||
      transaction.type === 'tip_received'
    );
  };
  
  if (!currentUser) {
    return (
      <WalletContainer>
        <WalletHeader>
          <h1>Wallet</h1>
        </WalletHeader>
        
        <LoginPrompt>
          <h2>Please login to access your wallet</h2>
          <p>You need to be logged in to view your token balance and transaction history.</p>
          <LoginButton onClick={() => {
            notification.addNotification('Redirecting to login page...', 'info');
            navigate('/login');
          }}>
            Login Now
          </LoginButton>
        </LoginPrompt>
      </WalletContainer>
    );
  }
  
  return (
    <WalletContainer>
      <WalletHeader>
        <h1>Wallet</h1>
      </WalletHeader>
      
      <BalanceCard>
        <BalanceTitle>Your Token Balance</BalanceTitle>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            <BalanceAmount>{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })} Tokens</BalanceAmount>
            <BalanceUSD>
              <span style={{fontSize:'1.25em',marginRight:'0.15em'}}>≈</span>
              ${Number(balance * TOKEN_TO_USD).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </BalanceUSD>
            <ButtonGroup>
              <PurchaseButton onClick={() => navigate('/coins')}>
                <span role="img" aria-label="Buy" style={{marginRight:'0.5em'}}></span>Buy Tokens
              </PurchaseButton>
              <PurchaseButton onClick={handleOpenTip} style={{ background: 'linear-gradient(90deg, #fd7e14 0%, #fa5252 100%)' }}>
                <span role="img" aria-label="Tip" style={{marginRight:'0.5em'}}></span>Tip User
              </PurchaseButton>
              <PurchaseButton onClick={handleOpenWithdraw} style={{ background: 'linear-gradient(90deg, #20c997 0%, #38d9a9 100%)' }}>
                <span role="img" aria-label="Withdraw" style={{marginRight:'0.5em'}}></span>Withdraw Tokens
              </PurchaseButton>
            </ButtonGroup>
          </>
        )}
      </BalanceCard>
      
      <TransactionsSection>
        <TransactionsTitle>Transaction History</TransactionsTitle>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <TransactionsList>
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction, index) => (
                <TransactionItem key={transaction.id || index}>
                  <TransactionInfo>
                    <TransactionType>{getTransactionTitle(transaction)}</TransactionType>
                    <TransactionDate>{formatDate(transaction.timestamp)}</TransactionDate>
                  </TransactionInfo>
                  <TransactionAmount $positive={isPositiveTransaction(transaction)}>
                    {isPositiveTransaction(transaction) ? '+' : '-'}{transaction.amount} Tokens
                  </TransactionAmount>
                </TransactionItem>
              ))
            ) : (
              <EmptyTransactions>
                No transactions found.
              </EmptyTransactions>
            )}
          </TransactionsList>
        )}
      </TransactionsSection>
      
      <TransactionsSection>
        <TransactionsTitle>Withdrawal History</TransactionsTitle>
        {withdrawalsLoading ? (
          <LoadingSpinner />
        ) : withdrawals.length === 0 ? (
          <EmptyTransactions>No withdrawal requests found.</EmptyTransactions>
        ) : (
          <TransactionsList as="table" style={{ width: '100%', color: '#fff', background: 'rgba(255,255,255,0.03)' }}>
            <thead>
              <tr style={{ color: '#4facfe', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem' }}>Amount</th>
                <th style={{ padding: '0.5rem' }}>Type</th>
                <th style={{ padding: '0.5rem' }}>Method</th>
                <th style={{ padding: '0.5rem' }}>Identifier</th>
                <th style={{ padding: '0.5rem' }}>Status</th>
                <th style={{ padding: '0.5rem' }}>Requested</th>
                <th style={{ padding: '0.5rem' }}>Processed</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map(w => (
                <tr key={w.id}>
                  <td style={{ padding: '0.5rem' }}>{w.amountTokens} tokens (${w.amountUSD})</td>
                  <td style={{ padding: '0.5rem', color: getWithdrawalType(w) === 'referral' ? '#A259F7' : '#4facfe' }}>
                    {getWithdrawalType(w) === 'referral' ? 'Referral' : 'Regular'}
                  </td>
                  <td style={{ padding: '0.5rem' }}>{w.withdrawalMethod === 'paypal' ? 'PayPal' : w.withdrawalMethod === 'cashapp' ? 'CashApp' : 'Unknown'}</td>
                  <td style={{ padding: '0.5rem' }}>{w.identifier}</td>
                  <td style={{ padding: '0.5rem', color: w.status === 'paid' ? '#51cf66' : w.status === 'pending' ? '#ffb700' : '#ff6b6b' }}>{w.status}</td>
                  <td style={{ padding: '0.5rem' }}>{w.createdAt?.toDate ? w.createdAt.toDate().toLocaleString() : ''}</td>
                  <td style={{ padding: '0.5rem' }}>{w.processedAt?.toDate ? w.processedAt.toDate().toLocaleString() : ''}</td>
                </tr>
              ))}
            </tbody>
          </TransactionsList>
        )}
      </TransactionsSection>
      
      <InfoCard>
        <InfoTitle>About Our Token System</InfoTitle>
        <InfoItem>
          <p>• Buy tokens with real money and use them to enter matches.</p>
          <p>• Tokens are valued at $0.001 USD each (1,000 tokens = $1).</p>
          <p>• Only match-won tokens are eligible for withdrawal.</p>
          <p>• Purchased tokens can only be used for matches and tips, not withdrawals.</p>
        </InfoItem>
      </InfoCard>
      
      <div id="buy-tokens">
        <Elements stripe={stripePromise}>
          <CoinStore />
        </Elements>
      </div>
      
      <PurchaseTokensModal 
        isOpen={isPurchaseModalOpen} 
        onClose={handleClosePurchase} 
      />
      
      <TipUserModalRedesigned 
        isOpen={isTipModalOpen} 
        onClose={handleCloseTip} 
      />
      
      <WithdrawTokensModal 
        isOpen={isWithdrawModalOpen} 
        onClose={handleCloseWithdraw} 
        balance={balance}
      />
    </WalletContainer>
  );
};

export default Wallet;
