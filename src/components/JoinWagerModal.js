import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useTokens } from '../contexts/TokenContext';
import { useAuth } from '../contexts/AuthContext';
import { useParty } from '../contexts/PartyContext';
import { doc, getDoc, updateDoc, arrayUnion, serverTimestamp, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useNotification } from '../contexts/NotificationContext';
import { getWagerPrizeAndFee } from '../utils/feeUtils';
import { useInsurance } from '../contexts/InsuranceContext';
import InsuranceIndicator from './InsuranceIndicator';
import SponsorshipModal from './SponsorshipModal';
import PrivateMatchPasswordModal from './PrivateMatchPasswordModal';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebase/config';

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
  z-index: 9999;
  animation: fadeIn 0.7s cubic-bezier(.25,1.7,.45,.87);
`;

const ModalContent = styled.div`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  padding: 30px;
  border-radius: 15px;
  width: 90%;
  max-width: 500px;
  color: white;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
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
  margin-bottom: 20px;
  
  h2 {
    font-size: 1.8rem;
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

const WagerDetails = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  .label {
    color: #b8c1ec;
  }
  
  .value {
    color: #fff;
    font-weight: 500;
  }
  
  .highlight {
    color: #4facfe;
    font-weight: 600;
  }
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin: 15px 0;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 25px;
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
  color: #ff4757;
  background: rgba(255, 71, 87, 0.1);
  padding: 10px 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 0.9rem;
`;

const JoinWagerModal = ({ isOpen, onClose, wager, onWagerJoined }) => {
  const { balance, deductTokens } = useTokens();
  const { currentUser } = useAuth();
  const { currentParty, isPartyLeader } = useParty();
  const notification = useNotification();
  const navigate = useNavigate();
  const { insuranceStatus, applyInsuranceToWager } = useInsurance();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [hasActiveWager, setHasActiveWager] = useState(false);
  const [checkingActiveWagers, setCheckingActiveWagers] = useState(false);
  
  // Sponsorship state
  const [showSponsorshipModal, setShowSponsorshipModal] = useState(false);
  const [sponsorships, setSponsorships] = useState([]);
  const [partyMembersWithBalance, setPartyMembersWithBalance] = useState([]);
  
  // Private match state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingJoinData, setPendingJoinData] = useState(null);
  
  // Reset error when modal opens and check for active wagers
  useEffect(() => {
    if (isOpen && currentUser) {
      setError(null);
      // Check if user already has an active wager
      const checkActiveWagers = async () => {
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
          const hasActive = activeWagers.length > 0;
          setHasActiveWager(hasActive);
          if (hasActive) {
            setError('You already have an active wager. Please complete or cancel your existing wager before joining a new one.');
            console.log(`User has ${activeWagers.length} active wagers`);
          }
        } catch (error) {
          console.error('Error checking active wagers:', error);
        } finally {
          setCheckingActiveWagers(false);
        }
      };
      checkActiveWagers();
    }
  }, [isOpen, currentUser]);
  
  // Function to check party members' balances for sponsorship
  const checkPartyMembersBalances = async () => {
    if (!currentParty || !currentParty.members || !wager?.isPartyWager) {
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

  // Check party members' balances when modal opens and it's a party wager
  useEffect(() => {
    if (isOpen && wager?.isPartyWager && currentParty && wager.amount) {
      checkPartyMembersBalances();
    }
  }, [isOpen, wager, currentParty]);
  
  // Handle sponsorship confirmation
  const handleSponsorshipConfirm = (confirmedSponsorships) => {
    setSponsorships(confirmedSponsorships);
    setShowSponsorshipModal(false);
    // Proceed with joining the wager
    joinWagerWithSponsorship(confirmedSponsorships);
  };
  
  const handlePasswordSubmit = async (password) => {
    if (!pendingJoinData) return;
    
    // Verify password
    if (password !== pendingJoinData.wager.privateMatchPassword) {
      throw new Error('Incorrect password');
    }
    
    // Password is correct, close modal and proceed with join
    setShowPasswordModal(false);
    
    // Check if sponsorship is needed for party wagers
    if (pendingJoinData.isPartyWager && currentParty) {
      const membersNeedingSponsorship = partyMembersWithBalance.filter(
        member => member.tokenBalance < wager.amount
      );
      
      if (membersNeedingSponsorship.length > 0) {
        // Show sponsorship modal
        setShowSponsorshipModal(true);
        return;
      }
    }
    
    // Proceed with joining the wager (no sponsorship needed)
    await joinWagerWithSponsorship([]);
    setPendingJoinData(null);
  };
  
  const handleJoinWager = async () => {
    if (!wager || !currentUser) return;
    
    setError(null);
    
    // Check if user has an active wager
    if (hasActiveWager) {
      setError('You already have an active wager. Please complete or cancel your existing wager before joining a new one.');
      return;
    }
    
    // Check if user is in a party but not the leader
    if (currentParty && !isPartyLeader) {
      setError('Only the party leader can join wagers for your party.');
      return;
    }
    
    // Check if user has enough tokens for their own entry
    if (balance < wager.amount) {
      setError('You do not have enough tokens to join this wager.');
      return;
    }
    
    // Check if wager is still open
    const wagerRef = doc(db, 'wagers', wager.id);
    const wagerDoc = await getDoc(wagerRef);
    
    if (!wagerDoc.exists()) {
      setError('This wager no longer exists.');
      return;
    }
    
    const currentWagerData = wagerDoc.data();
    
    if (currentWagerData.status !== 'open') {
      setError('This wager is no longer open for joining.');
      return;
    }
    
    // Check if user is already in the wager
    if (currentWagerData.participants.includes(currentUser.uid)) {
      setError('You are already participating in this wager.');
      return;
    }
    
    // Check if it's a private match and show password modal
    if (currentWagerData.isPrivateMatch) {
      // Store the join data for after password verification
      setPendingJoinData({
        wager: currentWagerData,
        isPartyWager: currentWagerData.isPartyWager,
        sponsorships: []
      });
      setShowPasswordModal(true);
      return;
    }
    
    // Check if it's a party wager and user is in a party
    if (currentWagerData.isPartyWager) {
      if (!currentParty) {
        setError('You need to be in a party to join a party wager.');
        return;
      }
      
      // Extract the numeric value from partySize (e.g., "1v1" -> 1)
      const requiredSize = parseInt(currentWagerData.partySize.charAt(0));
      
      if (currentParty.members.length !== requiredSize) {
        setError(`Your party size (${currentParty.members.length}) doesn't match the required size (${requiredSize}).`);
        return;
      }
      
      // Check if sponsorship is needed for party wagers
      const membersNeedingSponsorship = partyMembersWithBalance.filter(
        member => member.tokenBalance < wager.amount
      );
      
      if (membersNeedingSponsorship.length > 0) {
        // Show sponsorship modal
        setShowSponsorshipModal(true);
        return;
      }
    }
    
    // Proceed with joining the wager (no sponsorship needed)
    await joinWagerWithSponsorship([]);
  };
  
  // Separate function for actual wager joining with sponsorship support
  const joinWagerWithSponsorship = async (confirmedSponsorships = []) => {
    if (!wager || !currentUser) return;
    
    setIsSubmitting(true);
    
    try {
      // If Fun Play, skip all token deduction logic
      if (wager.mode === 'fun') {
        // Get fresh wager data
        const wagerRef = doc(db, 'wagers', wager.id);
        const wagerDoc = await getDoc(wagerRef);
        const currentWagerData = wagerDoc.data();
        let updateData = {
          status: 'ready',
          updatedAt: serverTimestamp(),
          participants: arrayUnion(currentUser.uid),
          guestId: currentUser.uid,
          guestName: currentUser.displayName || 'Guest',
          guestPhoto: currentUser.photoURL || null,
          guestEpicName: currentUser.epicUsername || 'Unknown',
          guestEntryFeesDeducted: true
        };
        await updateDoc(wagerRef, updateData);
        notification.addNotification('Successfully joined the Fun Play wager!', 'success');
        if (onWagerJoined) {
          onWagerJoined();
        }
        onClose();
        navigate(`/wager/${wager.id}`);
        setIsSubmitting(false);
        return;
      }
      
      // Calculate total sponsorship cost
      const totalSponsorshipCost = confirmedSponsorships.reduce((sum, sponsorship) => 
        sum + wager.amount, 0
      );
      
      // Get fresh wager data
      const wagerRef = doc(db, 'wagers', wager.id);
      const wagerDoc = await getDoc(wagerRef);
      const currentWagerData = wagerDoc.data();
      
      // Prepare update data based on whether it's a party wager or not
      let updateData = {
        status: 'ready',
        updatedAt: serverTimestamp()
      };
      
      if (currentWagerData.isPartyWager && currentParty) {
        const partyMemberIds = currentParty.members.map(member => member.id || member);
        if (confirmedSponsorships.length === 0) {
          // Each member pays their own entry fee
          // Call backend function to deduct tokens for all members
          const functions = getFunctions(app);
          const deductTokensForUsers = httpsCallable(functions, 'deductTokensForUsers');
          const deductions = partyMemberIds.map(memberId => ({
            userId: memberId,
            amount: wager.amount,
            wagerId: wager.id
          }));
          let allSuccess = true;
          let deductionResults = [];
          try {
            const result = await deductTokensForUsers({ deductions });
            deductionResults = result.data?.results || [];
            console.log('[JoinWagerModal] deductTokensForUsers results:', deductionResults);
            allSuccess = deductionResults.every(r => r.success);
          } catch (err) {
            console.error('[JoinWagerModal] Error calling deductTokensForUsers:', err);
            allSuccess = false;
          }
          if (!allSuccess) {
            setError('Failed to deduct tokens for one or more party members.');
            setIsSubmitting(false);
            return;
          }
        } else {
          // Sponsorship logic (existing)
          let totalCostForLeader = wager.amount; // Leader always pays their own entry
          const nonLeaderMembers = partyMemberIds.filter(id => id !== currentUser.uid);
          for (const memberId of nonLeaderMembers) {
            const isSponsored = confirmedSponsorships.some(s => s.memberId === memberId);
            if (!isSponsored) {
              totalCostForLeader += wager.amount;
            }
          }
          totalCostForLeader += totalSponsorshipCost;
          console.log(`[JoinWagerModal] Total cost calculation:`, {
            leaderEntry: wager.amount,
            sponsorshipCost: totalSponsorshipCost,
            nonSponsoredMembersCost: totalCostForLeader - wager.amount - totalSponsorshipCost,
            totalCost: totalCostForLeader
          });
          const deductionResult = await deductTokens(totalCostForLeader, `Joined wager with party/sponsorships: ${wager.id}`, wager.id);
          if (!deductionResult.success) {
            setError(`Failed to deduct tokens: ${deductionResult.error || 'Unknown error'}`);
            setIsSubmitting(false);
            return;
          }
        }
        
        // Add all party members to participants
        updateData.participants = arrayUnion(...partyMemberIds);
        
        // Set the party leader as the guest
        updateData.guestId = currentUser.uid;
        updateData.guestName = currentUser.displayName || 'Guest';
        updateData.guestPhoto = currentUser.photoURL || null;
        updateData.guestEpicName = currentUser.epicUsername || 'Unknown';
        updateData.guestEntryFeesDeducted = true;
        
        // Add guest party members data
        updateData.guestPartyMembers = currentParty.members.map(member => ({
          id: member.id || member,
          displayName: member.displayName || (member.id === currentUser.uid ? currentUser.displayName : 'Unknown'),
          photoURL: member.photoURL || null,
          isLeader: (member.id || member) === currentUser.uid
        }));
        
        console.log('[JoinWagerModal] Guest party members to save:', updateData.guestPartyMembers);
        
        // Add sponsorship data if any
        if (confirmedSponsorships.length > 0) {
          console.log('[JoinWagerModal] Confirmed sponsorships:', confirmedSponsorships);
          console.log('[JoinWagerModal] Party member IDs:', partyMemberIds);
          // Write both for compatibility
          updateData.sponsorships = confirmedSponsorships.map(sponsorship => ({
            sponsorId: currentUser.uid,
            sponsoredUserId: sponsorship.memberId,
            amount: wager.amount,
            sponsorShare: sponsorship.sponsorShare,
            sponsoredShare: sponsorship.sponsoredShare
          }));
          updateData.guestSponsorships = updateData.sponsorships;
          updateData.guestSponsorshipTotal = totalSponsorshipCost;
          console.log('[JoinWagerModal] Sponsorships to save:', updateData.sponsorships);
        }
        
        // Initialize readyStatus for all party members (set to false initially)
        const readyStatusUpdates = {};
        partyMemberIds.forEach(memberId => {
          readyStatusUpdates[`readyStatus.${memberId}`] = false;
        });
        Object.assign(updateData, readyStatusUpdates);
        
        // FIXED: Initialize entry fee tracking for party members correctly
        // Only mark as paid if they are sponsored OR if they are the leader
        const entryFeeUpdates = {};
        partyMemberIds.forEach(memberId => {
          const isSponsored = confirmedSponsorships.some(s => s.memberId === memberId);
          const isLeader = memberId === currentUser.uid;
          
          // Mark as paid if sponsored or if they are the leader (who paid for everyone)
          entryFeeUpdates[`partyMemberEntryFeesDeducted.${memberId}`] = isSponsored || isLeader;
          
          console.log(`[JoinWagerModal] Member ${memberId}: isSponsored=${isSponsored}, isLeader=${isLeader}, paid=${isSponsored || isLeader}`);
        });
        Object.assign(updateData, entryFeeUpdates);
        
        // Create notifications for all party members except the leader
        try {
          const memberUids = partyMemberIds.filter(uid => uid !== currentUser.uid);
          
          for (const uid of memberUids) {
            const isSponsored = confirmedSponsorships.some(s => s.memberId === uid);
            const message = isSponsored 
              ? `${currentUser.displayName || 'Your party leader'} joined a wager and sponsored your entry.`
              : `${currentUser.displayName || 'Your party leader'} joined a wager and paid your entry fee.`;
              
            await addDoc(collection(db, 'users', uid, 'notifications'), {
              type: 'party-wager-joined',
              matchId: wager.id,
              message: message,
              createdAt: serverTimestamp(),
              read: false
            });
          }
          console.log('[JoinWagerModal] Party member notifications created for joined wager:', wager.id);
        } catch (notificationError) {
          console.error('[JoinWagerModal] Error creating party member notifications:', notificationError);
          // Non-critical error, continue with wager joining flow
        }
      } else {
        // For regular wagers, deduct tokens from the guest and add them to participants
        const deductionResult = await deductTokens(wager.amount, `Joined wager: ${wager.id}`, wager.id);
        if (!deductionResult.success) {
          setError(`Failed to deduct tokens: ${deductionResult.error || 'Unknown error'}`);
          setIsSubmitting(false);
          return;
        }
        
        updateData.participants = arrayUnion(currentUser.uid);
        updateData.guestId = currentUser.uid;
        updateData.guestName = currentUser.displayName || 'Guest';
        updateData.guestPhoto = currentUser.photoURL || null;
        updateData.guestEpicName = currentUser.epicUsername || 'Unknown';
        updateData.guestEntryFeesDeducted = true;
      }
      
      // Update wager with the prepared data
      await updateDoc(wagerRef, updateData);
      
      // Apply insurance if user has active insurance
      if (insuranceStatus?.isActive && !currentWagerData.isPartyWager) {
        try {
          const insuranceResult = await applyInsuranceToWager(wager.id, wager.amount);
          if (insuranceResult.applied) {
            console.log('[JoinWagerModal] Insurance applied to wager:', insuranceResult);
            // Update the wager document to track insurance info
            await updateDoc(wagerRef, {
              [`guestInsurance`]: {
                isActive: true,
                maxRefund: insuranceResult.maxRefund,
                activatedAt: insuranceResult.activatedAt,
                userId: currentUser.uid
              }
            });
          }
        } catch (insuranceError) {
          console.error('[JoinWagerModal] Error applying insurance:', insuranceError);
          // Don't block the wager join if insurance fails
        }
      }
      
      // For party wagers, check insurance for all party members
      if (insuranceStatus?.isActive && currentWagerData.isPartyWager && currentParty) {
        try {
          const partyMemberIds = currentParty.members.map(member => member.id || member);
          const partyInsuranceInfo = {};
          
          for (const memberId of partyMemberIds) {
            if (memberId === currentUser.uid && insuranceStatus.isActive) {
              // Apply insurance for the current user (party leader)
              const insuranceResult = await applyInsuranceToWager(wager.id, wager.amount);
              if (insuranceResult.applied) {
                partyInsuranceInfo[memberId] = {
                  isActive: true,
                  maxRefund: insuranceResult.maxRefund,
                  activatedAt: insuranceResult.activatedAt,
                  userId: memberId
                };
              }
            }
            // Note: We can only check insurance for the current user since we don't have 
            // access to other users' insurance status from the frontend
          }
          
          if (Object.keys(partyInsuranceInfo).length > 0) {
            await updateDoc(wagerRef, {
              [`guestPartyInsurance`]: partyInsuranceInfo
            });
            console.log('[JoinWagerModal] Party insurance info saved:', partyInsuranceInfo);
          }
        } catch (partyInsuranceError) {
          console.error('[JoinWagerModal] Error applying party insurance:', partyInsuranceError);
          // Don't block the wager join if insurance fails
        }
      }
      
      notification.addNotification('Successfully joined the wager!', 'success');
      
      // Send notification to the wager creator that someone joined their wager
      try {
        // Get the host's user ID (the creator of the wager)
        const hostId = wager.hostId;
        
        if (hostId && hostId !== currentUser.uid) {
          // Create a notification in the host's notifications collection
          await addDoc(collection(db, 'users', hostId, 'notifications'), {
            type: 'wager-joined',
            matchId: wager.id,
            message: `${currentUser.displayName || 'Someone'} joined your wager for ${wager.amount} tokens.`,
            createdAt: serverTimestamp(),
            read: false,
            cleared: false
          });
          
          console.log('[JoinWagerModal] Notification sent to wager creator:', hostId);
        }
      } catch (notificationError) {
        console.error('[JoinWagerModal] Error sending notification to wager creator:', notificationError);
        // Non-critical error, continue with wager joining flow
      }
      
      if (onWagerJoined) {
        onWagerJoined();
      }
      
      onClose();
      
      // Redirect to the wager match page
      navigate(`/wager/${wager.id}`);
      
    } catch (error) {
      console.error('Error joining wager:', error);
      setError(`Failed to join wager: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Calculate prize and fee breakdown for display
  const entry = wager?.amount || 0;
  const numPlayers = wager?.partySize ? parseInt(wager.partySize) || 2 : 2;
  const { feePerPlayer, totalFee, totalPrize, feePercent } = getWagerPrizeAndFee(entry, numPlayers);
  
  if (!isOpen || !wager) {
    return null;
  }
  
  return (
    <ModalBackdrop onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()} className="fade-in bounce">
        <ModalHeader>
          <h2>Join Wager</h2>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </ModalHeader>
        
        {error && (
          <ErrorMessage>
            {error}
            {hasActiveWager && (
              <div style={{ marginTop: '10px' }}>
                <Button 
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
                  style={{ width: 'auto', marginTop: '5px', padding: '8px 15px' }}
                >
                  View My Active Wagers
                </Button>
              </div>
            )}
          </ErrorMessage>
        )}
        
        {currentParty && !isPartyLeader && (
          <div style={{ color: '#ff4757', marginBottom: '1rem', fontWeight: 'bold', textAlign: 'center' }}>
            Only the party leader can join wagers for your party.
          </div>
        )}
        
        <WagerDetails>
          <DetailRow>
            <span className="label">Game Mode:</span>
            <span className="value">{wager.gameMode}</span>
          </DetailRow>
          <DetailRow>
            <span className="label">Region:</span>
            <span className="value">{wager.region}</span>
          </DetailRow>
          <DetailRow>
            <span className="label">Platform:</span>
            <span className="value">{wager.platform}</span>
          </DetailRow>
          <DetailRow>
            <span className="label">Host:</span>
            <span className="value">{wager.hostDisplayName || 'Anonymous'}</span>
          </DetailRow>
          {wager.description && (
            <DetailRow>
              <span className="label">Description:</span>
              <span className="value">{wager.description}</span>
            </DetailRow>
          )}
          {wager.isPartyWager && (
            <DetailRow>
              <span className="label">Party Size:</span>
              <span className="value">{wager.partySize}</span>
            </DetailRow>
          )}
        </WagerDetails>
        
        <Divider />
        
        {/* Insurance Status */}
        <div style={{ marginBottom: '1rem' }}>
          <InsuranceIndicator entryFee={wager.amount} />
        </div>
        
        <DetailRow>
          <span className="label">Your Balance:</span>
          <span className="value">{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })} tokens</span>
        </DetailRow>
        <DetailRow>
          <span className="label">Wager Amount:</span>
          <span className="highlight">{wager.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })} tokens</span>
        </DetailRow>
        <DetailRow>
          <span className="label">Balance After:</span>
          <span className={`value ${balance - wager.amount < 0 ? 'highlight' : ''}`}>
            {(balance - wager.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })} tokens
          </span>
        </DetailRow>
        {/* Prize & Fee Breakdown */}
        <div style={{marginTop: '0.5rem', color: '#b8c1ec', fontSize: '0.95rem'}}>
          Each player pays {entry} tokens. {feePerPlayer} tokens ({feePercent * 100}%) is taken as a site fee from each player. The winner receives {totalPrize} tokens.
        </div>
        
        {/* Party Member Information for Party Wagers */}
        {wager.isPartyWager && currentParty && partyMembersWithBalance.length > 0 && (
          <div style={{ marginTop: '15px', padding: '15px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#4facfe' }}> Your Party Members</h4>
            {partyMembersWithBalance.map(member => {
              const needsSponsorship = member.tokenBalance < wager.amount;
              return (
                <div key={member.userId} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '5px',
                  padding: '8px',
                  background: needsSponsorship ? 'rgba(255, 71, 87, 0.1)' : 'rgba(76, 175, 80, 0.1)',
                  borderRadius: '4px'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {member.photoURL && (
                      <img 
                        src={member.photoURL} 
                        alt={member.displayName}
                        style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                      />
                    )}
                    {member.displayName}
                  </span>
                  <span style={{ 
                    color: needsSponsorship ? '#ff4757' : '#4caf50',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}>
                    {member.tokenBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })} tokens {needsSponsorship ? '(needs sponsorship)' : ''}
                  </span>
                </div>
              );
            })}
            {partyMembersWithBalance.some(m => m.tokenBalance < wager.amount) && (
              <p style={{ margin: '10px 0 0 0', fontSize: '0.85rem', color: '#b8c1ec' }}>
                 You'll be able to sponsor teammates who don't have enough coins
              </p>
            )}
          </div>
        )}
        
        <ButtonGroup>
          <Button 
            onClick={handleJoinWager}
            $disabled={isSubmitting || balance < wager.amount || (currentParty && !isPartyLeader)}
            disabled={isSubmitting || balance < wager.amount || (currentParty && !isPartyLeader)}
          >
            {isSubmitting ? 'Joining...' : 'Join Wager'}
          </Button>
          <Button 
            $secondary 
            onClick={onClose}
          >
            Cancel
          </Button>
        </ButtonGroup>
        
        {/* Sponsorship Modal */}
        <SponsorshipModal
          isOpen={showSponsorshipModal}
          onClose={() => setShowSponsorshipModal(false)}
          partyMembers={partyMembersWithBalance}
          wagerAmount={wager?.amount || 0}
          onSponsorshipConfirm={handleSponsorshipConfirm}
        />
        
        {/* Private Match Password Modal */}
        <PrivateMatchPasswordModal
          isOpen={showPasswordModal}
          onClose={() => {
            setShowPasswordModal(false);
            setPendingJoinData(null);
          }}
          onPasswordSubmit={handlePasswordSubmit}
          wagerInfo={wager}
        />
      </ModalContent>
    </ModalBackdrop>
  );
};

export default JoinWagerModal; 