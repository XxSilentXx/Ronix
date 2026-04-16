import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useTokens } from '../contexts/TokenContext';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, getDoc, doc, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import Confetti from 'react-confetti';
import { getTipFee } from '../utils/feeUtils';
import { useShop } from '../contexts/ShopContext';

const ModalBackdrop = styled.div`
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

const ModalContent = styled.div`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 15px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  background-image: url('https://fortnite-api.com/images/cosmetics/br/backpack_default.png');
  background-repeat: no-repeat;
  background-position: right bottom;
  background-size: 120px auto;
  animation: bounce 0.8s cubic-bezier(.25,1.7,.45,.87);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  
  h2 {
    color: #fff;
    font-size: 1.8rem;
    background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
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

const TokenInfo = styled.div`
  margin-bottom: 1rem;
  padding: 0.75rem;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  
  .balance {
    display: flex;
    justify-content: space-between;
    font-size: 0.9rem;
    color: #b8c1ec;
    
    span {
      font-weight: 500;
      color: #fff;
    }
  }
`;

const FeeDetails = styled.div`
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  font-size: 0.9rem;
`;

const FeeRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const Divider = styled.hr`
  border: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin: 0.5rem 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: #b8c1ec;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.8rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #fff;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #4facfe;
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.8rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #fff;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #4facfe;
  }
`;

const UserOption = styled.div`
  display: flex;
  align-items: center;
  padding: 0.5rem;
  
  img {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    margin-right: 8px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const Button = styled.button`
  flex: 1;
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

const ErrorMessage = styled.div`
  color: #ff6b6b;
  margin-top: 0.5rem;
  font-size: 0.9rem;
`;

const SearchResults = styled.div`
  max-height: 200px;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  margin-top: 0.5rem;
`;

const UserItem = styled.div`
  display: flex;
  align-items: center;
  padding: 0.8rem;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const UserAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-right: 10px;
  background-image: ${props => props.$photoURL ? `url(${props.$photoURL})` : 'none'};
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.$photoURL ? 'transparent' : '#4facfe'};
  color: #fff;
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  
  .name {
    font-weight: 500;
    color: #fff;
  }
  
  .username {
    font-size: 0.8rem;
    color: #b8c1ec;
  }
`;

const VipIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(90deg, #ffd70033 0%, #fffbe6 100%);
  color: #bfa100;
  font-weight: 600;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  margin-bottom: 0.75rem;
  font-size: 1rem;
  svg {
    width: 22px;
    height: 22px;
    color: #ffd700;
    filter: drop-shadow(0 1px 4px #ffd70088);
  }
`;

const TipUserModal = ({ isOpen, onClose, preSelectedUserId }) => {
  const { balance, tipUser } = useTokens();
  const { currentUser } = useAuth();
  const [amount, setAmount] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSearching, setIsSearching] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const { hasVipSubscription } = useShop();
  const isVip = hasVipSubscription && hasVipSubscription();

  // Calculate fee based on amount, but override for VIP
  let fee, amountAfterFee, feePercent;
  if (isVip) {
    fee = 0;
    amountAfterFee = Number(amount) || 0;
    feePercent = 0;
  } else {
    ({ fee, amountAfterFee, feePercent } = getTipFee(Number(amount) || 0));
  }

  useEffect(() => {
    // Reset form when modal opens
    if (isOpen) {
      setAmount(10);
      setSearchTerm('');
      setSearchResults([]);
      setSelectedUser(null);
      setErrors({});
    }
  }, [isOpen]);

  // Load pre-selected user if provided
  useEffect(() => {
    const loadPreSelectedUser = async () => {
      if (isOpen && preSelectedUserId && !selectedUser) {
        try {
          setIsSearching(true);
          const userDoc = await getDoc(doc(db, 'users', preSelectedUserId));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setSelectedUser({
              id: preSelectedUserId,
              displayName: userData.displayName || userData.email || 'Unknown User',
              photoURL: userData.photoURL || null,
              email: userData.email || null
            });
          }
        } catch (error) {
          console.error('Error loading pre-selected user:', error);
        } finally {
          setIsSearching(false);
        }
      }
    };
    
    loadPreSelectedUser();
  }, [isOpen, preSelectedUserId, selectedUser]);

  // Search for users when searchTerm changes
  useEffect(() => {
    const searchUsers = async () => {
      if (searchTerm.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        // Query users by displayName prefix only
        const usersRef = collection(db, 'users');
        const q = query(
          usersRef,
          orderBy('displayName'),
          where('displayName', '>=', searchTerm),
          where('displayName', '<=', searchTerm + '\uf8ff'),
          limit(10)
        );
        const querySnapshot = await getDocs(q);

        const results = [];
        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          // Skip current user
          if (doc.id === currentUser.uid) return;
          results.push({
            id: doc.id,
            displayName: userData.displayName || 'Unknown User',
            photoURL: userData.photoURL || null,
            email: userData.email || null
          });
        });
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching users:', error);
        setErrors(prev => ({ ...prev, search: 'Failed to search for users' }));
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(() => {
      if (searchTerm.length >= 2) {
        searchUsers();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, currentUser]);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSearchTerm('');
    setSearchResults([]);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!amount || amount <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }
    
    if (amount > balance) {
      newErrors.amount = 'Amount exceeds your balance';
    }
    
    if (!selectedUser) {
      newErrors.user = 'Please select a user to tip';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const result = await tipUser(selectedUser.id, Number(amount));
      if (result.success) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2500);
        onClose();
      } else {
        setErrors({ submit: result.error || 'Failed to send tip' });
      }
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to send tip' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalBackdrop onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()} className="fade-in bounce">
        {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} numberOfPieces={100} recycle={false} />}
        <ModalHeader>
          <h2>Send Tip</h2>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </ModalHeader>
        
        <TokenInfo>
          <div className="balance">Your Balance: <span>{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</span> tokens</div>
        </TokenInfo>
        
        {hasVipSubscription && (
          <VipIndicator>
            <svg viewBox="0 0 24 24" fill="#ffd700"><path d="M12 2l2.09 6.26L20 9.27l-5 3.64L16.18 20 12 16.77 7.82 20 9 12.91l-5-3.64 5.91-.01z"/></svg>
            No tip fee for VIPs!
          </VipIndicator>
        )}
        
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="user">Recipient</Label>
            {selectedUser ? (
              <UserItem onClick={() => setSelectedUser(null)}>
                <UserAvatar $photoURL={selectedUser.photoURL}>
                  {!selectedUser.photoURL && selectedUser.displayName.charAt(0)}
                </UserAvatar>
                <UserInfo>
                  <div className="name">{selectedUser.displayName}</div>
                  {selectedUser.email && <div className="username">{selectedUser.email}</div>}
                </UserInfo>
              </UserItem>
            ) : (
              <>
                <Input
                  type="text"
                  id="user"
                  placeholder="Search for a user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {isSearching && <div style={{ color: '#b8c1ec', marginTop: '0.5rem' }}>Searching...</div>}
                {errors.search && <ErrorMessage>{errors.search}</ErrorMessage>}
                {searchResults.length > 0 && (
                  <SearchResults>
                    {searchResults.map(user => (
                      <UserItem key={user.id} onClick={() => handleSelectUser(user)}>
                        <UserAvatar $photoURL={user.photoURL}>
                          {!user.photoURL && user.displayName.charAt(0)}
                        </UserAvatar>
                        <UserInfo>
                          <div className="name">{user.displayName}</div>
                          {user.email && <div className="username">{user.email}</div>}
                        </UserInfo>
                      </UserItem>
                    ))}
                  </SearchResults>
                )}
              </>
            )}
            {errors.user && <ErrorMessage>{errors.user}</ErrorMessage>}
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="amount">Tip Amount (tokens)</Label>
            <Input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0.01"
              step="0.01"
              max={balance}
            />
            {errors.amount && <ErrorMessage>{errors.amount}</ErrorMessage>}
            
            <FeeDetails>
              <FeeRow>
                <span>Tip Amount:</span>
                <span>{amount} tokens</span>
              </FeeRow>
              {!hasVipSubscription && (
                <FeeRow>
                  <span>Service Fee ({(feePercent * 100).toFixed(0)}%):</span>
                  <span>-{fee} tokens</span>
                </FeeRow>
              )}
              <Divider />
              <FeeRow style={{ fontWeight: 'bold' }}>
                <span>Recipient Gets:</span>
                <span>{amountAfterFee} tokens</span>
              </FeeRow>
            </FeeDetails>
          </FormGroup>
          
          <ButtonGroup>
            <Button 
              type="submit" 
              $disabled={isSubmitting || Object.keys(errors).length > 0}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Tip'}
            </Button>
            <Button 
              type="button" 
              $secondary 
              onClick={onClose}
            >
              Cancel
            </Button>
          </ButtonGroup>
          
          {errors.submit && <ErrorMessage>{errors.submit}</ErrorMessage>}
        </Form>
      </ModalContent>
    </ModalBackdrop>
  );
};

export default TipUserModal; 