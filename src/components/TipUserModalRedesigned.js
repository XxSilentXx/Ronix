import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { useTokens } from '../contexts/TokenContext';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, getDoc, doc, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import Confetti from 'react-confetti';
import { getTipFee } from '../utils/feeUtils';
import { useShop } from '../contexts/ShopContext';
import { getAvatarUrl } from '../utils/avatarUtils';

const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.98) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
`;

const ModalBackdrop = styled.div`
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(10, 14, 30, 0.75);
  z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  animation: ${fadeIn} 0.3s;
`;

const ModalCard = styled.div`
  background: #181c2f;
  border-radius: 18px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.25);
  width: 95vw; max-width: 420px;
  padding: 2.2rem 1.5rem 1.5rem 1.5rem;
  position: relative;
  animation: ${fadeIn} 0.4s;
  color: #fff;
`;

const CloseBtn = styled.button`
  position: absolute; top: 1.2rem; right: 1.2rem;
  background: none; border: none; color: #b8c1ec;
  font-size: 1.7rem; cursor: pointer;
  transition: color 0.2s;
  &:hover { color: #4facfe; }
`;

const Title = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.7rem;
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Balance = styled.div`
  font-size: 1.05rem;
  margin-bottom: 0.7rem;
  color: #b8c1ec;
  span { color: #fff; font-weight: 600; }
`;

const VipBanner = styled.div`
  background: linear-gradient(90deg, #ffd70033 0%, #fffbe6 100%);
  color: #bfa100;
  font-weight: 600;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  margin-bottom: 1.1rem;
  display: flex; align-items: center; gap: 0.6rem;
  font-size: 1.08rem;
  svg { width: 22px; height: 22px; color: #ffd700; }
`;

const Form = styled.form`
  display: flex; flex-direction: column; gap: 1.2rem;
`;

const Label = styled.label`
  font-size: 1rem;
  color: #b8c1ec;
  margin-bottom: 0.3rem;
`;

const InputGroup = styled.div`
  display: flex; flex-direction: column; gap: 0.3rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.85rem 1rem;
  background: rgba(255,255,255,0.07);
  border: 1.5px solid rgba(255,255,255,0.13);
  border-radius: 8px;
  color: #fff;
  font-size: 1.08rem;
  transition: border 0.2s;
  &:focus { outline: none; border-color: #4facfe; }
  &::placeholder { color: #b8c1ec99; }
`;

const Dropdown = styled.div`
  position: absolute;
  left: 0;
  top: 100%;
  width: 100%;
  background: #23284a;
  border-radius: 8px;
  box-shadow: 0 4px 16px #0002;
  margin-top: 0.2rem;
  margin-bottom: 1.2rem;
  z-index: 10;
  max-height: 220px;
  overflow-y: auto;
`;

const UserRow = styled.div`
  display: flex; align-items: center; gap: 0.7rem;
  padding: 0.7rem 1rem;
  cursor: pointer;
  border-bottom: 1px solid #23284a;
  &:hover { background: #2a2f4d; }
  &:last-child { border-bottom: none; }
`;

const Avatar = styled.div`
  width: 36px; height: 36px; border-radius: 50%;
  background: #4facfe;
  background-image: ${props => props.$photoURL ? `url(${props.$photoURL})` : 'none'};
  background-size: cover; background-position: center;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-weight: 700; font-size: 1.1rem;
`;

const UserInfo = styled.div`
  display: flex; flex-direction: column;
  .name { font-weight: 600; color: #fff; }
`;

const ErrorMsg = styled.div`
  color: #ff6b6b;
  font-size: 0.97rem;
  margin-top: 0.2rem;
`;

const FeeBox = styled.div`
  background: #20244a;
  border-radius: 8px;
  padding: 0.8rem 1rem;
  font-size: 1.01rem;
  margin-bottom: 0.2rem;
`;

const FeeRow = styled.div`
  display: flex; justify-content: space-between; margin-bottom: 0.3rem;
  &:last-child { margin-bottom: 0; font-weight: 600; }
`;

const VipFeeRow = styled(FeeRow)`
  color: #ffd700;
  font-weight: 700;
`;

const ButtonRow = styled.div`
  display: flex; gap: 1rem; margin-top: 1.2rem;
`;

const Button = styled.button`
  flex: 1;
  background: ${props => props.$secondary ? 'rgba(255,255,255,0.09)' : 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)'};
  color: #fff;
  border: none;
  padding: 1rem 0;
  border-radius: 10px;
  font-weight: 700;
  font-size: 1.08rem;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.$disabled ? 0.7 : 1};
  transition: all 0.18s;
  box-shadow: 0 0 12px #4facfe33;
  &:hover { background: ${props => props.$secondary ? 'rgba(255,255,255,0.13)' : 'linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)'}; }
`;

const Spinner = styled.div`
  border: 3px solid #4facfe33;
  border-top: 3px solid #4facfe;
  border-radius: 50%;
  width: 28px; height: 28px;
  animation: spin 0.8s linear infinite;
  margin: 0.5rem auto;
  @keyframes spin { to { transform: rotate(360deg); } }
`;

const SuccessMsg = styled.div`
  text-align: center;
  color: #2ed573;
  font-size: 1.2rem;
  font-weight: 600;
  margin: 1.2rem 0 0.5rem 0;
`;

const TipUserModalRedesigned = ({ isOpen, onClose, preSelectedUserId }) => {
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
  const [success, setSuccess] = useState(false);
  const { hasVipSubscription, loading, userInventory, activeBenefits } = useShop();
  const isVip = hasVipSubscription();
  const inputRef = useRef();
  const prevIsOpen = useRef(isOpen);

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
    if (isOpen && !prevIsOpen.current) {
      setAmount(10);
      setSearchTerm('');
      setSearchResults([]);
      setSelectedUser(null);
      setErrors({});
      setSuccess(false);
      setShowConfetti(false);
      setTimeout(() => { inputRef.current && inputRef.current.focus(); }, 200);
    }
    prevIsOpen.current = isOpen;
  }, [isOpen]);

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
              photoURL: getAvatarUrl(userData),
              email: userData.email || null
            });
          }
        } catch {}
        setIsSearching(false);
      }
    };
    loadPreSelectedUser();
  }, [isOpen, preSelectedUserId, selectedUser]);

  useEffect(() => {
    console.log('[TipUserModalRedesigned] useEffect triggered. searchTerm:', searchTerm, 'isOpen:', isOpen, 'currentUser:', currentUser);
    const searchUsers = async () => {
      if (searchTerm.length < 2) { 
        setSearchResults([]); 
        console.log('[TipUserModalRedesigned] searchTerm too short, skipping search.');
        return; 
      }
      setIsSearching(true);
      // Use displayNameLower for case-insensitive search
      const lowerTerm = searchTerm.toLowerCase();
      console.log('[TipUserModalRedesigned] Starting Firestore query. lowerTerm:', lowerTerm);
      try {
        const usersRef = collection(db, 'users');
        const q = query(
          usersRef,
          orderBy('displayNameLower'),
          where('displayNameLower', '>=', lowerTerm),
          where('displayNameLower', '<=', lowerTerm + '\uf8ff'),
          limit(8)
        );
        console.log('[TipUserModalRedesigned] Firestore query constructed:', q);
        const querySnapshot = await getDocs(q);
        const results = [];
        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          if (doc.id === currentUser.uid) return;
          results.push({
            id: doc.id,
            displayName: userData.displayName || 'Unknown User',
            photoURL: getAvatarUrl(userData),
            email: userData.email || null
          });
        });
        console.log('[TipUserModalRedesigned] Found', results.length, 'users:', results);
        setSearchResults(results);
      } catch (error) {
        console.error('[TipUserModalRedesigned] Error searching users:', error);
        setErrors(prev => ({ ...prev, search: 'Failed to search for users' }));
      } finally {
        setIsSearching(false);
        console.log('[TipUserModalRedesigned] Search finished for term:', lowerTerm);
      }
    };
    const timeoutId = setTimeout(() => {
      if (searchTerm.length >= 2) searchUsers();
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, currentUser, isOpen]);

  useEffect(() => {
    if (isOpen) {
      console.log('[TipUserModalRedesigned] Modal opened');
      console.log('[TipUserModalRedesigned] isVip:', isVip);
      console.log('[TipUserModalRedesigned] hasVipSubscription():', hasVipSubscription());
      console.log('[TipUserModalRedesigned] loading:', loading);
      if (userInventory) console.log('[TipUserModalRedesigned] userInventory:', userInventory);
      if (activeBenefits) console.log('[TipUserModalRedesigned] activeBenefits:', activeBenefits);
    }
  }, [isOpen, isVip, loading, hasVipSubscription, userInventory, activeBenefits]);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSearchTerm('');
    setSearchResults([]);
    setErrors(e => ({ ...e, user: undefined }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!amount || amount <= 0) newErrors.amount = 'Enter a valid amount';
    if (amount > balance) newErrors.amount = 'Amount exceeds your balance';
    if (!selectedUser) newErrors.user = 'Select a user to tip';
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
        setSuccess(true);
        setTimeout(() => {
          setShowConfetti(false);
          setSuccess(false);
          onClose();
        }, 2200);
      } else {
        setErrors({ submit: result.error || 'Failed to send tip' });
      }
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to send tip' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to check only form errors (not search/submit)
  const hasFormErrors = !!(errors.user || errors.amount);

  if (!isOpen) return null;

  return (
    <ModalBackdrop onClick={onClose}>
      <ModalCard onClick={e => e.stopPropagation()}>
        <CloseBtn onClick={onClose} aria-label="Close">&times;</CloseBtn>
        <Title>Send Tip</Title>
        <Balance>Your Balance: <span>{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</span> tokens</Balance>
        {isVip && (
          <VipBanner>
            <svg viewBox="0 0 24 24" fill="#ffd700"><path d="M12 2l2.09 6.26L20 9.27l-5 3.64L16.18 20 12 16.77 7.82 20 9 12.91l-5-3.64 5.91-.01z"/></svg>
            No tip fee for VIPs!
          </VipBanner>
        )}
        <Form onSubmit={handleSubmit} autoComplete="off">
          <InputGroup style={{ position: 'relative' }}>
            <Label htmlFor="recipient">Recipient</Label>
            {selectedUser ? (
              <UserRow style={{ background: '#23284a', borderRadius: 8, marginBottom: 2 }} onClick={() => setSelectedUser(null)}>
                <Avatar $photoURL={selectedUser.photoURL}>
                  {!selectedUser.photoURL && selectedUser.displayName.charAt(0)}
                </Avatar>
                <UserInfo>
                  <div className="name">{selectedUser.displayName}</div>
                </UserInfo>
              </UserRow>
            ) : (
              <>
                <Input
                  ref={inputRef}
                  id="recipient"
                  type="text"
                  placeholder="Search for a user..."
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setErrors(er => ({ ...er, user: undefined })); }}
                  autoComplete="off"
                  aria-autocomplete="list"
                  aria-controls="recipient-list"
                  aria-activedescendant={searchResults.length > 0 ? 'recipient-list' : undefined}
                />
                {isSearching && <Spinner />}
                {errors.search && <ErrorMsg>{errors.search}</ErrorMsg>}
                {searchTerm.length >= 2 && searchResults.length > 0 && (
                  <Dropdown id="recipient-list">
                    {searchResults.map(user => (
                      <UserRow key={user.id} onClick={() => handleSelectUser(user)}>
                        <Avatar $photoURL={user.photoURL}>
                          {!user.photoURL && user.displayName.charAt(0)}
                        </Avatar>
                        <UserInfo>
                          <div className="name">{user.displayName}</div>
                        </UserInfo>
                      </UserRow>
                    ))}
                  </Dropdown>
                )}
              </>
            )}
            {errors.user && <ErrorMsg>{errors.user}</ErrorMsg>}
          </InputGroup>
          <InputGroup>
            <Label htmlFor="amount">Tip Amount (tokens)</Label>
            <Input
              id="amount"
              type="number"
              min="0.01"
              step="0.01"
              max={balance}
              value={amount}
              onChange={e => { setAmount(e.target.value); setErrors(er => ({ ...er, amount: undefined })); }}
              autoComplete="off"
            />
            {errors.amount && <ErrorMsg>{errors.amount}</ErrorMsg>}
          </InputGroup>
          <FeeBox>
            <FeeRow>
              <span>Tip Amount:</span>
              <span>{amount} tokens</span>
            </FeeRow>
            {isVip ? (
              <VipFeeRow>
                <span>Service Fee (0%):</span>
                <span>0 tokens (VIP - No Fee)</span>
              </VipFeeRow>
            ) : (
              <FeeRow>
                <span>Service Fee ({(feePercent * 100).toFixed(0)}%):</span>
                <span>-{fee} tokens</span>
              </FeeRow>
            )}
            <FeeRow>
              <span>Recipient Gets:</span>
              <span>{amountAfterFee} tokens</span>
            </FeeRow>
          </FeeBox>
          <ButtonRow>
            <Button type="submit" $disabled={isSubmitting || hasFormErrors} disabled={isSubmitting}>
              {isSubmitting ? <Spinner /> : 'Send Tip'}
            </Button>
            <Button type="button" $secondary onClick={onClose}>Cancel</Button>
          </ButtonRow>
          {errors.submit && <ErrorMsg>{errors.submit}</ErrorMsg>}
          {success && <SuccessMsg>Tip sent successfully!</SuccessMsg>}
        </Form>
        {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} numberOfPieces={100} recycle={false} />}
      </ModalCard>
    </ModalBackdrop>
  );
};

export default TipUserModalRedesigned; 