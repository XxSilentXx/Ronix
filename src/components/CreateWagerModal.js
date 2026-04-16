import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useTokens } from '../contexts/TokenContext';
import { useAuth } from '../contexts/AuthContext';
import { useParty } from '../contexts/PartyContext';
import { collection, addDoc, getDocs, serverTimestamp, updateDoc, runTransaction, doc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useNotification } from '../contexts/NotificationContext';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { getAuth } from 'firebase/auth';
import { getWagerPrizeAndFee, FEE_CONFIG, isValidWagerAmount } from '../utils/feeUtils';
import { getFirestore } from 'firebase/firestore';
import { useInsurance } from '../contexts/InsuranceContext';
import InsuranceIndicator from './InsuranceIndicator';
import SponsorshipModal from './SponsorshipModal';
import { app } from '../firebase/config';

// Simplified modal for testing
const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(ellipse at center, rgba(79, 172, 254, 0.15) 0%, rgba(0, 0, 0, 0.85) 70%);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  animation: fadeIn 0.7s cubic-bezier(.25,1.7,.45,.87);
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      backdrop-filter: blur(0px);
    }
    to {
      opacity: 1;
      backdrop-filter: blur(8px);
    }
  }
`;

const ModalContent = styled.div`
  background: #181825;
  border: 2px solid var(--color-accent1, #A259F7);
  border-radius: 20px;
  width: 90%;
  max-width: 540px;
  color: #fff;
  box-shadow: 0 8px 48px 0 #A259F755, 0 0 0 2px #00FFD055;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  font-family: 'Poppins', Arial, sans-serif;
  padding: 38px 32px 32px 32px;
  z-index: 10;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  position: relative;
  z-index: 1;
  h2 {
    font-size: 2.2rem;
    font-family: 'Poppins', Arial, sans-serif;
    font-weight: 900;
    color: var(--color-accent1, #A259F7);
    letter-spacing: 0.04em;
    margin: 0;
    text-shadow: 0 0 16px #A259F7, 0 0 4px #00FFD0;
  }
`;

const CloseButton = styled.button`
  background: var(--color-accent3, #FF61E6);
  border: none;
  border-radius: 50%;
  color: #fff;
  font-size: 1.3rem;
  width: 40px;
  height: 40px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, box-shadow 0.2s, color 0.2s;
  box-shadow: 0 0 12px #A259F7;
  font-family: 'Poppins', Arial, sans-serif;
  &:hover {
    background: var(--color-accent2, #00FFD0);
    color: #181825;
    box-shadow: 0 0 24px #00FFD0;
    transform: scale(1.08);
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: relative;
  z-index: 1;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative;
`;
  
const Label = styled.label`
  font-size: 1rem;
  font-weight: 600;
  color: #e8efff;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-size: 0.85rem;
  margin-bottom: 2px;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 0;
    height: 2px;
    background: linear-gradient(90deg, #4facfe, #ff61e6);
    transition: width 0.3s ease;
  }
  
  ${FormGroup}:focus-within &::after {
    width: 30px;
  }
`;

const Input = styled.input`
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 14px 18px;
  color: white;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(.25,1.7,.45,.87);
  position: relative;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: rgba(79, 172, 254, 0.8);
    background: rgba(79, 172, 254, 0.1);
    box-shadow: 
      0 0 0 4px rgba(79, 172, 254, 0.1),
      0 8px 25px rgba(79, 172, 254, 0.2);
    transform: translateY(-2px);
  }
  
  &:hover:not(:focus) {
    border-color: rgba(255, 255, 255, 0.3);
    background: rgba(255, 255, 255, 0.12);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Select = styled.select`
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 14px 18px;
  color: white;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(.25,1.7,.45,.87);
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  padding-right: 40px;
  
  &:focus {
    outline: none;
    border-color: rgba(79, 172, 254, 0.8);
    background-color: rgba(79, 172, 254, 0.1);
    box-shadow: 
      0 0 0 4px rgba(79, 172, 254, 0.1),
      0 8px 25px rgba(79, 172, 254, 0.2);
    transform: translateY(-2px);
  }
  
  &:hover:not(:focus) {
    border-color: rgba(255, 255, 255, 0.3);
    background-color: rgba(255, 255, 255, 0.12);
  }
  
  option {
    background: #1a1a2e;
    color: white;
    padding: 10px;
  }
`;

const TextArea = styled.textarea`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 12px 15px;
  color: white;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #4facfe;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 20px;
  position: relative;
  z-index: 1;
`;

const Button = styled.button`
  background: ${props => props.$secondary ? 
    'rgba(255, 255, 255, 0.08)' : 
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 50%, #ff61e6 100%)'
  };
  background-size: 200% 200%;
  color: #fff;
  border: 2px solid ${props => props.$secondary ? 'rgba(255, 255, 255, 0.2)' : 'transparent'};
  padding: 16px 30px;
  border-radius: 12px;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  font-weight: 700;
  font-size: 1rem;
  flex: 1;
  opacity: ${props => props.$disabled ? 0.5 : 1};
  transition: all 0.3s cubic-bezier(.25,1.7,.45,.87);
  position: relative;
  overflow: hidden;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  backdrop-filter: blur(10px);
  
  ${props => !props.$secondary && `
    box-shadow: 
      0 8px 25px rgba(79, 172, 254, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
    animation: buttonGlow 2s ease-in-out infinite alternate;
  `}
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }
  
  &:hover:not(:disabled) {
    transform: translateY(-3px) scale(1.02);
    ${props => props.$secondary ? `
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(79, 172, 254, 0.5);
      box-shadow: 0 8px 25px rgba(79, 172, 254, 0.2);
    ` : `
      background-position: 100% 50%;
      box-shadow: 
        0 15px 35px rgba(255, 97, 230, 0.4),
        0 5px 15px rgba(79, 172, 254, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.3);
    `}
  }
  
  &:hover:not(:disabled)::before {
    left: 100%;
  }
  
  &:active {
    transform: translateY(-1px) scale(0.98);
  }
  
  @keyframes buttonGlow {
    0% { 
      box-shadow: 
        0 8px 25px rgba(79, 172, 254, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }
    100% { 
      box-shadow: 
        0 12px 35px rgba(255, 97, 230, 0.4),
        inset 0 1px 0 rgba(255, 255, 255, 0.3);
    }
  }
`;

const ErrorMessage = styled.span`
  color: #ff6b85;
  font-size: 0.85rem;
  font-weight: 600;
  background: rgba(255, 107, 133, 0.1);
  padding: 8px 12px;
  border-radius: 8px;
  border-left: 3px solid #ff6b85;
  margin-top: 4px;
  display: block;
  animation: errorPulse 2s ease-in-out infinite alternate;
  
  @keyframes errorPulse {
    0% { background: rgba(255, 107, 133, 0.1); }
    100% { background: rgba(255, 107, 133, 0.2); }
  }
`;

const TokenInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, rgba(79, 172, 254, 0.1) 0%, rgba(255, 97, 230, 0.1) 100%);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 18px 24px;
  border-radius: 16px;
  margin-bottom: 25px;
  position: relative;
  z-index: 1;
  box-shadow: 
    0 8px 25px rgba(79, 172, 254, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, 
      rgba(79, 172, 254, 0.05) 0%, 
      transparent 50%, 
      rgba(255, 97, 230, 0.05) 100%
    );
    border-radius: 16px;
    pointer-events: none;
  }
  
  .balance {
    font-size: 1.2rem;
    font-weight: 600;
    color: #fff;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    position: relative;
    z-index: 1;
    
    span {
      color: #00f2fe;
      font-weight: 700;
      text-shadow: 0 0 10px rgba(0, 242, 254, 0.5);
      animation: tokenGlow 2s ease-in-out infinite alternate;
    }
  }
  
  @keyframes tokenGlow {
    0% { 
      color: #00f2fe;
      text-shadow: 0 0 10px rgba(0, 242, 254, 0.5);
    }
    100% { 
      color: #4facfe;
      text-shadow: 0 0 15px rgba(79, 172, 254, 0.7);
    }
  }
`;

const PartyOption = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(.25,1.7,.45,.87);
  cursor: pointer;
  position: relative;
  z-index: 1;
  
  &:hover {
    background: rgba(79, 172, 254, 0.1);
    border-color: rgba(79, 172, 254, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(79, 172, 254, 0.15);
  }
  
  input[type="checkbox"] {
    width: 20px;
    height: 20px;
    accent-color: #4facfe;
    cursor: pointer;
    border-radius: 4px;
  }
  
  label {
    cursor: pointer;
    margin: 0;
    font-weight: 600;
    color: #e8efff;
  }
`;

const FunPlayOption = styled(PartyOption)`
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 152, 0, 0.1) 100%);
  border: 2px solid rgba(255, 193, 7, 0.3);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    animation: shimmer 2s infinite;
  }
  
  &:hover {
    background: linear-gradient(135deg, rgba(255, 193, 7, 0.2) 0%, rgba(255, 152, 0, 0.2) 100%);
    border-color: rgba(255, 193, 7, 0.6);
    box-shadow: 0 8px 25px rgba(255, 193, 7, 0.3);
    transform: translateY(-3px) scale(1.02);
  }
  
  input[type="checkbox"] {
    accent-color: #ffc107;
  }
  
  label {
    color: #fff3cd;
    font-weight: 700;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
  
  @keyframes shimmer {
    0% { left: -100%; }
    100% { left: 100%; }
  }
`;

const ErrorBox = styled.div`
  background: linear-gradient(135deg, rgba(255, 107, 133, 0.1) 0%, rgba(255, 71, 87, 0.1) 100%);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 107, 133, 0.3);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 25px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  z-index: 1;
  box-shadow: 0 8px 25px rgba(255, 107, 133, 0.15);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, 
      rgba(255, 107, 133, 0.05) 0%, 
      transparent 50%, 
      rgba(255, 71, 87, 0.05) 100%
    );
    border-radius: 12px;
    pointer-events: none;
  }
  
  p {
    margin: 0;
    color: #ff6b85;
    font-weight: 600;
    position: relative;
    z-index: 1;
  }
`;

const FeeInfo = styled.div`
  background-color: rgba(255, 255, 255, 0.05);
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
`;

const ErrorText = styled.span`
  color: #ff4757;
  font-size: 0.85rem;
`;

// Add a simple PartyConfirmationModal component
const PartyConfirmationModalBackdrop = styled(ModalBackdrop)`
  z-index: 10001;
`;
const PartyConfirmationModalContent = styled(ModalContent)`
  max-width: 420px;
  padding: 32px 24px;
  text-align: center;
`;

function PartyConfirmationModal({ isOpen, onClose, onConfirm, partyMembers }) {
  if (!isOpen) return null;
  return (
    <PartyConfirmationModalBackdrop onClick={onClose}>
      <PartyConfirmationModalContent onClick={e => e.stopPropagation()}>
        <h3 style={{ color: '#4facfe', marginBottom: 16 }}>Confirm Party</h3>
        <p style={{ marginBottom: 16 }}>
          Are you sure you want to create a match with this party?
        </p>
        <div style={{ marginBottom: 20, textAlign: 'left' }}>
          <strong>Party Members:</strong>
          <ul style={{ margin: '10px 0 0 0', padding: 0, listStyle: 'none' }}>
            {partyMembers.map(member => (
              <li key={member.id || member.userId} style={{
                padding: '6px 0',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                color: '#fff',
                fontWeight: member.isLeader ? 700 : 400
              }}>
                {member.displayName || member.epicUsername || 'Unknown'}
                {member.isLeader && <span style={{ color: '#4facfe', marginLeft: 8 }}>(Leader)</span>}
              </li>
            ))}
          </ul>
        </div>
        <ButtonGroup>
          <Button type="button" onClick={onConfirm}>Confirm</Button>
          <Button type="button" $secondary onClick={onClose}>Deny</Button>
        </ButtonGroup>
      </PartyConfirmationModalContent>
    </PartyConfirmationModalBackdrop>
  );
}

const CreateWagerModal = ({ isOpen, onClose, onWagerCreated }) => {
  const { balance, deductTokens } = useTokens();
  const { currentUser } = useAuth();
  const { currentParty, isPartyLeader, partyMembers } = useParty();
  const notification = useNotification();
  const navigate = useNavigate();
  const { insuranceStatus, applyInsuranceToWager } = useInsurance();
  
  const [formData, setFormData] = useState({
    amount: 100,
    gameMode: 'Zone Wars',
    partySize: '1v1',
    platform: 'All',
    region: 'NA-East',
    firstTo: 'First to: 5',
    roundLead: 'None',
    isPartyWager: false,
    isPrivateMatch: false,
    privateMatchPassword: '',
    lootPool: 'Default',
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDiscordLinked, setIsDiscordLinked] = useState(false);
  const [isGameLinked, setIsGameLinked] = useState(false);
  const [accountLinkError, setAccountLinkError] = useState('');
  
  // Sponsorship state
  const [showSponsorshipModal, setShowSponsorshipModal] = useState(false);
  const [sponsorships, setSponsorships] = useState([]);
  const [partyMembersWithBalance, setPartyMembersWithBalance] = useState([]);
  
  const gameModes = ['Zone Wars','Box Fight', 'Realistics', 'Build Fight'];
  const partySizes = ['1v1', '2v2', '3v3', '4v4'];
  const platforms = ['All', 'PC', 'Console', 'Mobile'];
  const regions = ['NA-East', 'NA-West','NA-Central', 'EU', 'Asia', 'OCE', 'Brazil', 'Middle East'];
  const firstToOptions = ['First to: 1', 'First to: 3', 'First to: 5'];
  const roundLeadOptions = ['None', '1', '2', '3', '4'];
  const lootPoolOptions = ['Default', 'Mythic Havoc', 'Gold Pump'];
  
  // Check if user has linked accounts
  useEffect(() => {
    const checkLinkedAccounts = async () => {
      if (currentUser) {
        try {
          const db = getFirestore();
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setIsDiscordLinked(userData.discordLinked || false);
            setIsGameLinked(userData.epicLinked || false);
            
            // Set error message if accounts aren't linked
            if (!userData.discordLinked && !userData.epicLinked) {
              setAccountLinkError('You must link both your Discord and Epic Games accounts to create a match.');
            } else if (!userData.discordLinked) {
              setAccountLinkError('You must link your Discord account to create a match.');
            } else if (!userData.epicLinked) {
              setAccountLinkError('You must link your Epic Games account to create a match.');
            } else {
              setAccountLinkError('');
            }
          }
        } catch (error) {
          console.error('Error checking linked accounts:', error);
          setAccountLinkError('Error checking account links. Please try again.');
        }
      }
    };
    
    if (isOpen) {
      checkLinkedAccounts();
    }
  }, [isOpen, currentUser]);
  
  // Check if user has any active wagers
  const [hasActiveWager, setHasActiveWager] = useState(false);
  const [checkingActiveWagers, setCheckingActiveWagers] = useState(false);
  
  // Function to check party members' balances for sponsorship
  const checkPartyMembersBalances = async () => {
    if (!currentParty || !currentParty.members || !formData.isPartyWager) {
      setPartyMembersWithBalance([]);
      return;
    }

    try {
      const membersWithBalance = [];
      
      for (const member of currentParty.members) {
        const memberId = member.id || member;
        if (memberId === currentUser.uid) continue; // Skip current user
        
        try {
          const memberDoc = await getDoc(doc(db, 'users', memberId));
          if (memberDoc.exists()) {
            const memberData = memberDoc.data();
            membersWithBalance.push({
              userId: memberId,
              displayName: memberData.displayName || member.displayName || 'Unknown',
              photoURL: memberData.photoURL || member.photoURL || null,
              tokenBalance: memberData.tokenBalance || 0
            });
          }
        } catch (error) {
          console.error(`Error fetching balance for member ${memberId}:`, error);
          // Add member with 0 balance if we can't fetch their data
          membersWithBalance.push({
            userId: memberId,
            displayName: member.displayName || 'Unknown',
            photoURL: member.photoURL || null,
            tokenBalance: 0
          });
        }
      }
      
      setPartyMembersWithBalance(membersWithBalance);
    } catch (error) {
      console.error('Error checking party members balances:', error);
      setPartyMembersWithBalance([]);
    }
  };

  // Check party members' balances when amount or party changes
  useEffect(() => {
    if (formData.isPartyWager && currentParty && formData.amount) {
      checkPartyMembersBalances();
    }
  }, [formData.isPartyWager, formData.amount, currentParty]);

  useEffect(() => {
    const checkActiveWagers = async () => {
      if (!currentUser) return;
      setCheckingActiveWagers(true);
      try {
        // Query all wagers where user is a participant
        const wagerQuery = query(
          collection(db, 'wagers'),
          where('participants', 'array-contains', currentUser.uid)
        );
        const wagerSnapshot = await getDocs(wagerQuery);
        // Filter out completed/cancelled wagers
        const activeWagers = wagerSnapshot.docs.filter(doc => {
          const status = doc.data().status;
          return status !== 'completed' && status !== 'cancelled';
        });
        setHasActiveWager(activeWagers.length > 0);
      } catch (error) {
        console.error('Error checking active wagers:', error);
      } finally {
        setCheckingActiveWagers(false);
      }
    };
    if (isOpen) {
      checkActiveWagers();
    }
  }, [isOpen, currentUser]);

  const [isFunPlay, setIsFunPlay] = useState(false);
  const [showPartyConfirmModal, setShowPartyConfirmModal] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'isFunPlay') {
      setIsFunPlay(checked);
      setFormData(prev => ({ ...prev, amount: checked ? 0 : prev.amount }));
      return;
    }
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    if (!isFunPlay) {
      // Check if accounts are linked first
      if (!isDiscordLinked || !isGameLinked) {
        newErrors.accounts = 'You must link both your Discord and Epic Games accounts to create a match.';
        setErrors(newErrors);
        return false;
      }
      
      // Validate amount
      const amountNum = Number(formData.amount);
      if (!formData.amount || isNaN(amountNum)) {
        newErrors.amount = 'Amount must be a number';
      } else if (!isValidWagerAmount(amountNum)) {
        newErrors.amount = `Amount must be at least ${FEE_CONFIG.minWagerAmount} tokens`;
      } else if (amountNum > balance) {
        newErrors.amount = 'Insufficient tokens';
      }
    }
    
    // Validate other required fields
    if (!formData.gameMode) newErrors.gameMode = 'Game mode is required';
    if (!formData.partySize) newErrors.partySize = 'Party size is required';
    if (!formData.platform) newErrors.platform = 'Platform is required';
    if (!formData.region) newErrors.region = 'Region is required';
    
    // Validate private match password
    if (formData.isPrivateMatch) {
      if (!formData.privateMatchPassword || formData.privateMatchPassword.trim().length < 3) {
        newErrors.privateMatchPassword = 'Private match password must be at least 3 characters';
      } else if (formData.privateMatchPassword.length > 20) {
        newErrors.privateMatchPassword = 'Private match password must be 20 characters or less';
      }
    }
    
    // Validate loot pool if visible
    if ((formData.gameMode === 'Realistics' || formData.gameMode === 'Build Fight') && !formData.lootPool) {
      newErrors.lootPool = 'Loot Pool is required';
    }
    
    // Enforce party size matches actual party size for party wagers
    if (formData.isPartyWager && currentParty) {
      const actualPartySize = `${currentParty.members.length}v${currentParty.members.length}`;
      if (formData.partySize !== actualPartySize) {
        newErrors.partySize = `Your party size is ${actualPartySize}. You can only create a ${actualPartySize} wager.`;
      }
      // Only allow 2v2, 3v3, or 4v4 for party wagers
      if (!["2v2", "3v3", "4v4"].includes(actualPartySize)) {
        newErrors.partySize = `Party wagers are only allowed for 2v2, 3v3, or 4v4. Your party size is ${actualPartySize}.`;
      }
    }
    // If NOT in a party, prevent creating 2v2, 3v3, or 4v4 wagers
    if (!currentParty && ["2v2", "3v3", "4v4"].includes(formData.partySize)) {
      newErrors.partySize = `You must be in a party of ${formData.partySize.replace('v', ' players on each team')} to create this wager.`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if user has active wagers first
    if (hasActiveWager) {
      notification.addNotification(
        'You have an active match. Please complete or cancel your existing match before creating a new one.',
        'error'
      );
      return;
    }
    
    // Check if accounts are linked first
    if (!isDiscordLinked || !isGameLinked) {
      notification.addNotification(
        !isDiscordLinked && !isGameLinked 
          ? 'You must link both your Discord and Epic Games accounts to create a match.' 
          : !isDiscordLinked 
            ? 'You must link your Discord account to create a match.' 
            : 'You must link your Epic Games account to create a match.',
        'error'
      );
      
      // Redirect to profile page to link accounts
      navigate('/profile');
      onClose();
      return;
    }
    
    // Prevent non-leaders from submitting if in a party
    if (currentParty && !isPartyLeader) {
      notification.addNotification('Only the party leader can create a match.', 'error');
      return;
    }
    
    if (!validateForm()) {
      return;
    }

    // Check if sponsorship is needed for party wagers
    if (formData.isPartyWager && currentParty) {
      // Show party confirmation modal before proceeding
      setShowPartyConfirmModal(true);
      setPendingSubmit(true);
      return;
    }

    // Proceed with wager creation
    await createWager();
  };

  // Handler for confirming party in the confirmation modal
  const handlePartyConfirm = async () => {
    setShowPartyConfirmModal(false);
    setPendingSubmit(false);
    // After confirmation, check for sponsorship as before
    if (formData.isPartyWager && currentParty) {
      const membersNeedingSponsorship = partyMembersWithBalance.filter(
        member => member.tokenBalance < Number(formData.amount)
      );
      if (membersNeedingSponsorship.length > 0) {
        setShowSponsorshipModal(true);
        return;
      }
    }
    await createWager();
  };

  // Handler for denying party confirmation
  const handlePartyDeny = () => {
    setShowPartyConfirmModal(false);
    setPendingSubmit(false);
  };

  // Separate function for actual wager creation
  const createWager = async (confirmedSponsorships = []) => {
    try {
      setIsSubmitting(true);
    
      // Use passed sponsorships or fall back to state
      const activeSponsorship = confirmedSponsorships.length > 0 ? confirmedSponsorships : sponsorships;
      
      // Calculate total sponsorship cost
      const totalSponsorshipCost = activeSponsorship.reduce((sum, sponsorship) => 
        sum + Number(formData.amount), 0
      );
      
      // Check if user has enough balance for their entry + sponsorships
      const totalCost = Number(formData.amount) + totalSponsorshipCost;
      if (totalCost > balance) {
        notification.addNotification(
          `Insufficient balance. You need ${totalCost} tokens but only have ${balance}.`,
          'error'
        );
        setIsSubmitting(false);
        return;
      }

      // Create wager data
      const wagerData = {
        amount: isFunPlay ? 0 : Number(formData.amount),
        gameMode: formData.gameMode,
        partySize: formData.partySize,
        platform: formData.platform,
        region: formData.region,
        firstTo: formData.firstTo,
        roundLead: formData.roundLead,
        createdAt: serverTimestamp(),
        hostId: currentUser.uid,
        hostName: currentUser.displayName || 'Anonymous',
        hostPhoto: currentUser.photoURL || null,
        hostEpicName: currentUser.epicUsername || 'Unknown',
        status: 'open',
        participants: [currentUser.uid],
        updatedAt: serverTimestamp(),
        entryFeesDeducted: false, // Start with false until we confirm deduction
        partyMemberEntryFeesDeducted: {}, // Track token deduction for each party member
        sponsorshipTotal: totalSponsorshipCost,
        isPrivateMatch: formData.isPrivateMatch,
        privateMatchPassword: formData.isPrivateMatch ? formData.privateMatchPassword.trim() : null,
        mode: isFunPlay ? 'fun' : 'real',
        lootPool: formData.lootPool,
      };
      // Add sponsorship data for compatibility
      if (activeSponsorship.length > 0) {
        wagerData.sponsorships = activeSponsorship.map(sponsorship => ({
          sponsorId: currentUser.uid,
          sponsoredUserId: sponsorship.memberId,
          amount: Number(formData.amount),
          sponsorShare: sponsorship.sponsorShare,
          sponsoredShare: sponsorship.sponsoredShare
        }));
        wagerData.guestSponsorships = wagerData.sponsorships;
        wagerData.guestSponsorshipTotal = totalSponsorshipCost;
      }
      
      // Add party data if it's a party wager
      if (formData.isPartyWager && currentParty) {
        wagerData.isPartyWager = true;
        wagerData.partyId = currentParty.id;
        // Make sure partySize matches the actual party size
        const partyMemberCount = currentParty.members ? currentParty.members.length : 0;
        wagerData.partySize = `${partyMemberCount}v${partyMemberCount}`;
        // Get safe participants list
        const partyMembers = Array.isArray(currentParty.members) ? currentParty.members : [];
        // Always use array of objects with id field
        wagerData.participants = partyMembers
          .filter(member => member && (member.id || typeof member === 'string'))
          .map(member => member.id || member);
        wagerData.partyMembers = partyMembers
          .filter(member => member && (member.id || typeof member === 'string'))
          .map(member => ({
            id: member.id || member,
            displayName: member.displayName || (member.id === currentUser.uid ? currentUser.displayName : 'Unknown'),
            photoURL: member.photoURL || null,
            isLeader: (member.id || member) === currentParty.leader
          }));
        
        // Initialize entry fee tracking for all party members - safely
        wagerData.partyMemberEntryFeesDeducted = {};
        wagerData.participants.forEach(memberId => {
          if (memberId) { // Only add if memberId is valid
            wagerData.partyMemberEntryFeesDeducted[memberId] = false;
          }
        });
        
        // Initialize readyStatus for all party members (set to false initially)
        wagerData.readyStatus = {};
        wagerData.participants.forEach(memberId => {
          if (memberId) { // Only add if memberId is valid
            wagerData.readyStatus[memberId] = false;
          }
        });
      }
      
      // Add wager to Firestore
      const wagerRef = await addDoc(collection(db, 'wagers'), wagerData);
      const wagerId = wagerRef.id;
      
      // If Fun Play, skip all token deduction logic
      if (isFunPlay) {
        notification.addNotification('Fun Play wager created successfully!', 'success');
        if (onWagerCreated) {
          onWagerCreated();
        }
        onClose();
        navigate(`/wager/${wagerId}`);
        setIsSubmitting(false);
        return;
      }
      
      let deductionSuccess = false;
      let errorMessage = '';
      
      if (formData.isPartyWager && currentParty) {
        // For party wagers, if there are NO sponsorships, each member pays their own entry fee
        const partyMemberIds = wagerData.participants || [currentUser.uid];
        if (activeSponsorship.length === 0) {
          // Each member pays their own entry fee
          // Call backend function to deduct tokens for all members
          const functions = getFunctions(app);
          const deductTokensForUsers = httpsCallable(functions, 'deductTokensForUsers');
          const deductions = partyMemberIds.map(memberId => ({
            userId: memberId,
            amount: Number(formData.amount),
            wagerId
          }));
          let allSuccess = true;
          let deductionResults = [];
          try {
            const result = await deductTokensForUsers({ deductions });
            deductionResults = result.data?.results || [];
            // Token deduction results processed
            allSuccess = deductionResults.every(r => r.success);
          } catch (err) {
            console.error('[CreateWagerModal] Error calling deductTokensForUsers:', err);
            allSuccess = false;
          }
          if (!allSuccess) {
            errorMessage = 'Failed to deduct tokens for one or more party members.';
            deductionSuccess = false;
          } else {
            deductionSuccess = true;
          }
        } else {
          // Sponsorship logic (existing)
          let totalCostForLeader = Number(formData.amount); // Leader always pays their own entry
          const nonLeaderMembers = partyMemberIds.filter(id => id !== currentUser.uid);
          for (const memberId of nonLeaderMembers) {
            const isSponsored = activeSponsorship.some(s => s.memberId === memberId);
            if (!isSponsored) {
              totalCostForLeader += Number(formData.amount);
            }
          }
          // Total cost calculated for party wager
          const deductionResult = await deductTokens(totalCostForLeader + totalSponsorshipCost, `Party wager creation: ${wagerId}`, wagerId);
          if (deductionResult.success) {
            deductionSuccess = true;
          } else {
            errorMessage = deductionResult.error || 'Unknown error with party wager';
            deductionSuccess = false;
          }
        }
      } else {
        // For regular wagers, just deduct from the creator
        const deductionResult = await deductTokens(Number(formData.amount), `Wager creation: ${wagerId}`, wagerId);
        deductionSuccess = deductionResult.success;
        
        if (deductionSuccess) {
          await updateDoc(wagerRef, {
            entryFeesDeducted: true,
            updatedAt: serverTimestamp()
          });
        } else {
          errorMessage = deductionResult.error || 'Unknown error';
        }
      }
      
      if (deductionSuccess) {
        // Apply insurance if user has active insurance
        if (insuranceStatus?.isActive) {
          try {
            const insuranceResult = await applyInsuranceToWager(wagerId, Number(formData.amount));
            if (insuranceResult.applied) {
              console.log('[CreateWagerModal] Insurance applied to wager:', insuranceResult);
              // Update the wager document to track insurance info for the host
              await updateDoc(wagerRef, {
                [`hostInsurance`]: {
                  isActive: true,
                  maxRefund: insuranceResult.maxRefund,
                  activatedAt: insuranceResult.activatedAt,
                  userId: currentUser.uid
                }
              });
              
              // For party wagers, track insurance for all party members who might have it
              if (formData.isPartyWager && currentParty) {
                const partyInsuranceInfo = {};
                partyInsuranceInfo[currentUser.uid] = {
                  isActive: true,
                  maxRefund: insuranceResult.maxRefund,
                  activatedAt: insuranceResult.activatedAt,
                  userId: currentUser.uid
                };
                
                await updateDoc(wagerRef, {
                  [`hostPartyInsurance`]: partyInsuranceInfo
                });
                console.log('[CreateWagerModal] Party insurance info saved for host:', partyInsuranceInfo);
              }
            }
          } catch (insuranceError) {
            console.error('[CreateWagerModal] Error applying insurance:', insuranceError);
            // Don't block the wager creation if insurance fails
          }
        }
        
        notification.addNotification('Wager created successfully!', 'success');
        
        // If this is a party wager, add notifications for other party members
        if (formData.isPartyWager && currentParty && currentParty.members) {
          try {
            // Get all party member UIDs except the leader
            const memberUids = currentParty.members
              .filter(member => (member.id || member) !== currentUser.uid)
              .map(member => member.id || member);

            for (const uid of memberUids) {
              await addDoc(collection(db, 'users', uid, 'notifications'), {
                type: 'party-wager',
                matchId: wagerId,
                message: `${currentUser.displayName || 'Your party leader'} placed you into a wager.`,
                createdAt: serverTimestamp(),
                read: false
              });
            }
            // Party member notifications created
          } catch (notificationError) {
            console.error('[CreateWagerModal] Error creating party member notifications (Firestore):', notificationError);
            // Non-critical error, continue with wager creation flow
          }
        }
        
        if (onWagerCreated) {
          onWagerCreated();
        }
        
        onClose();
        
        // Redirect to the wager match page
        navigate(`/wager/${wagerId}`);
      } else {
        // If token deduction failed, mark the wager as failed
        await updateDoc(wagerRef, {
          status: 'failed',
          failureReason: 'Token deduction failed',
          updatedAt: serverTimestamp()
        });
        
        notification.addNotification(`Failed to deduct tokens: ${errorMessage}`, 'error');
      }
    } catch (error) {
      console.error('Error creating wager:', error);
      notification.addNotification('Failed to create wager', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      // Set default values but customize them based on party context
      const defaultFormData = {
        amount: 1,
        gameMode: 'Zone Wars',
        platform: 'All',
        region: 'NA-East',
        firstTo: 'First to: 5',
        roundLead: 'None',
        isPartyWager: false,
        isPrivateMatch: false,
        privateMatchPassword: '',
        lootPool: 'Default',
      };

      // If user is in a party, set appropriate defaults
      if (currentParty && currentParty.members) {
        const partyMemberCount = currentParty.members.length;
        // Map party size to corresponding format (e.g. 2 members = "2v2")
        const partySizeFormat = `${partyMemberCount}v${partyMemberCount}`;
        // Check if this party size is supported
        const isValidPartySize = partySizes.includes(partySizeFormat);
        defaultFormData.partySize = isValidPartySize ? partySizeFormat : '1v1';
        defaultFormData.isPartyWager = true;
      } else {
        defaultFormData.partySize = '1v1';
      }

      setFormData(defaultFormData);
      setErrors({});

      // Debug logging removed for production
    }
  }, [isOpen, currentParty, currentUser, isPartyLeader]);
  
  // Calculate prize and fee breakdown for display
  const entry = Number(formData.amount) || 0;
  const numPlayers = formData.partySize ? parseInt(formData.partySize) || 2 : 2;
  const { feePerPlayer, totalFee, totalPrize, feePercent } = getWagerPrizeAndFee(entry, numPlayers);
  
  // Handle sponsorship confirmation
  const handleSponsorshipConfirm = (confirmedSponsorships) => {
    setSponsorships(confirmedSponsorships);
    setShowSponsorshipModal(false);
    // Proceed with wager creation, passing sponsorships directly
    createWager(confirmedSponsorships);
  };

  if (!isOpen) {
    return null;
  }
  
  return (
    <ModalBackdrop onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()} className="fade-in bounce">
        <ModalHeader>
          <h2>Create a Match</h2>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </ModalHeader>
        
        <TokenInfo>
          <div className="balance">Your Balance: <span>{balance}</span> tokens</div>
        </TokenInfo>
        
        {accountLinkError && (
          <ErrorBox>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#ff4757" style={{ marginRight: '8px' }}>
                <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 100-16 8 8 0 000 16zM11 7h2v7h-2V7zm0 8h2v2h-2v-2z"/>
              </svg>
              <p>{accountLinkError}</p>
            </div>
            <Button 
              type="button"
              style={{ width: 'auto', alignSelf: 'flex-start' }}
              onClick={() => {
                navigate('/profile');
                onClose();
              }}
            >
              Go to Profile to Link Accounts
            </Button>
          </ErrorBox>
        )}
        
        {hasActiveWager && (
          <ErrorBox>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#ff4757" style={{ marginRight: '8px' }}>
                <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 100-16 8 8 0 000 16zM11 7h2v7h-2V7zm0 8h2v2h-2v-2z"/>
              </svg>
              <p>You have an active wager. You must complete or cancel your existing wager before creating a new one.</p>
            </div>
            <Button 
              type="button"
              style={{ width: 'auto', alignSelf: 'flex-start' }}
              onClick={async () => {
                // Fetch the user's active wagers and navigate to the first one
                try {
                  const wagerQuery = query(
                    collection(db, 'wagers'),
                    where('participants', 'array-contains', currentUser.uid)
                  );
                  const wagerSnapshot = await getDocs(wagerQuery);
                  const activeWagers = wagerSnapshot.docs.filter(doc => {
                    const status = doc.data().status;
                    return status !== 'completed' && status !== 'cancelled';
                  });
                  if (activeWagers.length > 0) {
                    const wagerId = activeWagers[0].id;
                    navigate(`/wager/${wagerId}`);
                    onClose();
                  } else {
                    // fallback: just go to /wagers
                    navigate('/wagers');
                    onClose();
                  }
                } catch (err) {
                  navigate('/wagers');
                  onClose();
                }
              }}
            >
              View My Active Wagers
            </Button>
          </ErrorBox>
        )}
        
        {currentParty && !isPartyLeader && (
          <div style={{ color: '#ff4757', marginBottom: '1rem', fontWeight: 'bold', textAlign: 'center' }}>
            Only the party leader can create a match for your party.
          </div>
        )}
        
        <Form onSubmit={handleSubmit} style={{ display: (hasActiveWager || (accountLinkError && !isSubmitting)) ? 'none' : 'block' }}>
          <FormGroup>
            <FunPlayOption>
              <input
                type="checkbox"
                id="isFunPlay"
                name="isFunPlay"
                checked={isFunPlay}
                onChange={handleChange}
              />
              <Label htmlFor="isFunPlay"> Fun Play (No tokens required, just for fun!)</Label>
            </FunPlayOption>
          </FormGroup>
          {/* Hide amount input if Fun Play is enabled */}
          {!isFunPlay && (
            <FormGroup>
              <Label htmlFor="amount">Wager Amount (tokens)</Label>
              <Input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                min={FEE_CONFIG.minWagerAmount}
                step="0.01"
                max={balance}
              />
              {errors.amount && <ErrorMessage>{errors.amount}</ErrorMessage>}
              <div style={{marginTop: '0.5rem', color: '#b8c1ec', fontSize: '0.95rem'}}>
                Each player pays {Number(formData.amount || 0).toFixed(2)} tokens. 
                {formData.amount ? ` ${feePerPlayer.toFixed(2)} tokens (${(feePercent * 100).toFixed(0)}%) is taken as a site fee from each player. The winner receives ${totalPrize.toFixed(2)} tokens.` : ''}
              </div>
              <div style={{ marginTop: '1rem' }}>
                <InsuranceIndicator entryFee={Number(formData.amount)} />
              </div>
            </FormGroup>
          )}
          
          <FormGroup>
            <Label htmlFor="gameMode">Game Mode</Label>
            <Select
              id="gameMode"
              name="gameMode"
              value={formData.gameMode}
              onChange={handleChange}
            >
              {gameModes.map(mode => (
                <option key={mode} value={mode}>{mode}</option>
              ))}
            </Select>
            {errors.gameMode && <ErrorMessage>{errors.gameMode}</ErrorMessage>}
          </FormGroup>

          {(formData.gameMode === 'Realistics' || formData.gameMode === 'Build Fight') && (
            <FormGroup>
              <Label htmlFor="lootPool">Loot Pool</Label>
              <Select
                id="lootPool"
                name="lootPool"
                value={formData.lootPool}
                onChange={handleChange}
                required
              >
                {lootPoolOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </Select>
              {errors.lootPool && <ErrorMessage>{errors.lootPool}</ErrorMessage>}
            </FormGroup>
          )}
          
          <FormGroup>
            <Label htmlFor="partySize">Party Size</Label>
            <Select
              id="partySize"
              name="partySize"
              value={formData.partySize}
              onChange={handleChange}
              disabled={formData.isPartyWager && currentParty}
            >
              {/* Restrict party size options if in a party wager */}
              {formData.isPartyWager && currentParty ? (
                (() => {
                  const partyMemberCount = currentParty.members.length;
                  const partySizeOption = `${partyMemberCount}v${partyMemberCount}`;
                  return partySizes.includes(partySizeOption) ? (
                    <option key={partySizeOption} value={partySizeOption}>{partySizeOption}</option>
                  ) : (
                    <option key="1v1" value="1v1">1v1</option>
                  );
                })()
              ) : (
                partySizes.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))
              )}
            </Select>
            {formData.isPartyWager && currentParty && (
              <span style={{ fontSize: '0.8rem', color: '#4facfe', marginTop: '5px', display: 'block' }}>
                Party size is automatically set to {currentParty.members.length}v{currentParty.members.length} when creating a party wager.
              </span>
            )}
            {errors.partySize && <ErrorMessage>{errors.partySize}</ErrorMessage>}
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="platform">Platform</Label>
            <Select
              id="platform"
              name="platform"
              value={formData.platform}
              onChange={handleChange}
            >
              {platforms.map(platform => (
                <option key={platform} value={platform}>{platform}</option>
              ))}
            </Select>
            {errors.platform && <ErrorMessage>{errors.platform}</ErrorMessage>}
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="region">Region</Label>
            <Select
              id="region"
              name="region"
              value={formData.region}
              onChange={handleChange}
            >
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </Select>
            {errors.region && <ErrorMessage>{errors.region}</ErrorMessage>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="firstTo">First to</Label>
            <Select
              id="firstTo"
              name="firstTo"
              value={formData.firstTo}
              onChange={handleChange}
            >
              {firstToOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </Select>
            {errors.firstTo && <ErrorMessage>{errors.firstTo}</ErrorMessage>}
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="roundLead">Round lead</Label>
            <Select
              id="roundLead"
              name="roundLead"
              value={formData.roundLead}
              onChange={handleChange}
            >
              {roundLeadOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </Select>
            {errors.roundLead && <ErrorMessage>{errors.roundLead}</ErrorMessage>}
          </FormGroup>
          
          <FormGroup>
            <PartyOption>
              <input
                type="checkbox"
                id="isPrivateMatch"
                name="isPrivateMatch"
                checked={formData.isPrivateMatch}
                onChange={handleChange}
              />
              <Label htmlFor="isPrivateMatch"> Private Match (requires password to join)</Label>
            </PartyOption>
            {errors.isPrivateMatch && <ErrorMessage>{errors.isPrivateMatch}</ErrorMessage>}
            
            {formData.isPrivateMatch && (
              <div style={{ marginTop: '10px' }}>
                <Label htmlFor="privateMatchPassword">Match Password</Label>
                <Input
                  type="text"
                  id="privateMatchPassword"
                  name="privateMatchPassword"
                  value={formData.privateMatchPassword}
                  onChange={handleChange}
                  placeholder="Enter a password (3-20 characters)"
                  maxLength="20"
                />
                {errors.privateMatchPassword && <ErrorMessage>{errors.privateMatchPassword}</ErrorMessage>}
                <div style={{ fontSize: '0.8rem', color: '#b8c1ec', marginTop: '5px' }}>
                   Other players will need this password to join your wager
                </div>
              </div>
            )}
          </FormGroup>
          
          {currentParty && (
            <FormGroup>
              <PartyOption>
                <input
                  type="checkbox"
                  id="isPartyWager"
                  name="isPartyWager"
                  checked={true}
                  disabled={true}
                  readOnly
                />
                <Label htmlFor="isPartyWager">Create as party wager ({currentParty.members.length} members)</Label>
              </PartyOption>
              {errors.isPartyWager && <ErrorMessage>{errors.isPartyWager}</ErrorMessage>}
              {/* Sponsorship indicator */}
              {formData.isPartyWager && partyMembersWithBalance.length > 0 && (
                <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#4facfe' }}> Party Members</h4>
                  {partyMembersWithBalance.map(member => {
                    const needsSponsorship = member.tokenBalance < Number(formData.amount);
                    return (
                      <div key={member.userId} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '5px',
                        padding: '5px',
                        background: needsSponsorship ? 'rgba(255, 71, 87, 0.1)' : 'rgba(76, 175, 80, 0.1)',
                        borderRadius: '4px'
                      }}>
                        <span>{member.displayName}</span>
                        <span style={{ 
                          color: needsSponsorship ? '#ff4757' : '#4caf50',
                          fontSize: '0.9rem'
                        }}>
                          {member.tokenBalance} tokens {needsSponsorship ? '(needs sponsorship)' : ''}
                        </span>
                      </div>
                    );
                  })}
                  {partyMembersWithBalance.some(m => m.tokenBalance < Number(formData.amount)) && (
                    <p style={{ margin: '10px 0 0 0', fontSize: '0.85rem', color: '#b8c1ec' }}>
                       You'll be able to sponsor teammates who don't have enough coins
                    </p>
                  )}
                </div>
              )}
            </FormGroup>
          )}
          
          <ButtonGroup>
            <Button 
              type="submit" 
              $disabled={isSubmitting || Object.keys(errors).length > 0 || (currentParty && !isPartyLeader) || !isDiscordLinked || !isGameLinked}
              disabled={isSubmitting || (currentParty && !isPartyLeader) || !isDiscordLinked || !isGameLinked}
            >
              {isSubmitting ? 'Creating...' : 'Create Wager'}
            </Button>
            <Button 
              type="button" 
              $secondary 
              onClick={onClose}
            >
              Cancel
            </Button>
          </ButtonGroup>
        </Form>
        
        {/* Sponsorship Modal */}
        <SponsorshipModal
          isOpen={showSponsorshipModal}
          onClose={() => setShowSponsorshipModal(false)}
          partyMembers={partyMembersWithBalance}
          wagerAmount={Number(formData.amount)}
          onSponsorshipConfirm={handleSponsorshipConfirm}
        />
      </ModalContent>
      {/* Party Confirmation Modal */}
      <PartyConfirmationModal
        isOpen={showPartyConfirmModal}
        onClose={handlePartyDeny}
        onConfirm={handlePartyConfirm}
        partyMembers={partyMembers}
      />
    </ModalBackdrop>
  );
};

export default CreateWagerModal;
