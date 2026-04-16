import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { doc, updateDoc, arrayUnion, serverTimestamp, collection, addDoc, getDoc, getFirestore } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import useWagerXp from '../hooks/useWagerXp';
import { useXp } from '../contexts/XpContext';
import XpNotification from './XpNotification';

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
`;

const ModalContent = styled.div`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  padding: 30px;
  border-radius: 15px;
  width: 90%;
  max-width: 500px;
  color: white;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
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

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 1rem;
  color: #b8c1ec;
`;

const RadioGroup = styled.div`
  display: flex;
  gap: 15px;
`;

const RadioOption = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 10px 15px;
  border-radius: 8px;
  background: ${props => props.$selected ? 'rgba(79, 172, 254, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid ${props => props.$selected ? '#4facfe' : 'transparent'};
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(79, 172, 254, 0.1);
  }
  
  input {
    display: none;
  }
`;

const UploadArea = styled.div`
  border: 2px dashed ${props => props.$isDragOver ? '#4facfe' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.$isDragOver ? 'rgba(79, 172, 254, 0.1)' : 'transparent'};
  
  &:hover {
    border-color: #4facfe;
    background: rgba(79, 172, 254, 0.05);
  }
  
  input {
    display: none;
  }
`;

const UploadIcon = styled.div`
  margin-bottom: 10px;
  
  svg {
    width: 40px;
    height: 40px;
    color: #4facfe;
  }
`;

const PreviewContainer = styled.div`
  margin-top: 15px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const ImagePreview = styled.div`
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const RemoveButton = styled.button`
  position: absolute;
  top: 5px;
  right: 5px;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  font-size: 12px;
  
  &:hover {
    background: rgba(255, 0, 0, 0.7);
  }
`;

const ScoreInput = styled.input`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 12px 15px;
  color: white;
  font-size: 1rem;
  width: 60px;
  text-align: center;
  
  &:focus {
    outline: none;
    border-color: #4facfe;
  }
`;

const ScoreContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 10px;
`;

const TeamName = styled.div`
  font-weight: bold;
  color: ${props => props.$isHost ? '#4facfe' : '#fff'};
`;

const Versus = styled.div`
  font-size: 1.2rem;
  margin: 0 10px;
  color: #b8c1ec;
`;

const ErrorMessage = styled.div`
  color: #ff4757;
  font-size: 0.85rem;
  margin-top: 5px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 10px;
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
  transition: all 0.3s ease;
  
  &:hover {
    transform: ${props => props.$disabled ? 'none' : 'translateY(-2px)'};
    box-shadow: ${props => props.$disabled ? 'none' : '0 5px 15px rgba(0, 242, 254, 0.3)'};
  }
`;

const InfoMessage = styled.div`
  background: rgba(79, 172, 254, 0.1);
  border: 1px solid rgba(79, 172, 254, 0.3);
  border-radius: 8px;
  padding: 12px 15px;
  margin-bottom: 20px;
  color: #b8c1ec;
  font-size: 0.9rem;
  line-height: 1.5;
`;

const DisputeSection = styled.div`
  margin-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 15px;
`;

const DisputeTextarea = styled.textarea`
  width: 100%;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 12px 15px;
  color: white;
  font-size: 0.9rem;
  min-height: 100px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #4facfe;
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const SubmitResultsModal = ({ isOpen, onClose, match, onResultSubmitted }) => {
  const { currentUser } = useAuth();
  const { processWagerXp, loading: xpLoading, xpResult, clearXpResult } = useWagerXp();
  const { refreshXpData } = useXp();
  const notification = useNotification();
  
  const [winner, setWinner] = useState('');
  const [hostScore, setHostScore] = useState(0);
  const [guestScore, setGuestScore] = useState(0);
  const [screenshots, setScreenshots] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [existingResults, setExistingResults] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [isDisputing, setIsDisputing] = useState(false);
  const [resultsDeadline, setResultsDeadline] = useState(null);
  const [timer, setTimer] = useState(0);
  
  const isHost = currentUser && match && match.hostId === currentUser.uid;
  const isGuest = currentUser && match && match.guestId === currentUser.uid;
  
  // Fetch any existing results and deadline when modal opens
  useEffect(() => {
    if (isOpen && match) {
      const fetchMatchDetails = async () => {
        try {
          const matchRef = doc(db, 'wagers', match.id);
          const matchDoc = await getDoc(matchRef);
          if (matchDoc.exists()) {
            const data = matchDoc.data();
            if (data.results) {
              setExistingResults(data.results);
              const otherPlayerResult = data.results.find(result => result.submittedBy !== currentUser.uid);
              if (otherPlayerResult) {
                setHostScore(otherPlayerResult.hostScore);
                setGuestScore(otherPlayerResult.guestScore);
                setWinner(otherPlayerResult.winnerId === match.hostId ? 'host' : 'guest');
              }
            }
            if (data.resultsDeadline) {
              setResultsDeadline(data.resultsDeadline.toDate ? data.resultsDeadline.toDate() : new Date(data.resultsDeadline));
            } else {
              setResultsDeadline(null);
            }
          }
        } catch (error) {
          console.error('Error fetching match details:', error);
        }
      };
      fetchMatchDetails();
    }
  }, [isOpen, match, currentUser]);
  
  // Timer countdown effect
  useEffect(() => {
    if (!resultsDeadline) return;
    const updateTimer = () => {
      const now = new Date();
      const diff = Math.max(0, Math.floor((resultsDeadline - now) / 1000));
      setTimer(diff);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [resultsDeadline]);
  
  // Format timer as mm:ss
  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };
  
  const handleWinnerChange = (value) => {
    setWinner(value);
    
    // Update scores based on winner
    if (value === 'host') {
      setHostScore(1);
      setGuestScore(0);
    } else if (value === 'guest') {
      setHostScore(0);
      setGuestScore(1);
    }
    
    // Clear error
    setErrors(prev => ({ ...prev, winner: null }));
  };
  
  const handleScoreChange = (team, value) => {
    const score = parseInt(value) || 0;
    
    if (team === 'host') {
      setHostScore(score);
      
      // Update winner based on scores
      if (score > guestScore) {
        setWinner('host');
      } else if (score < guestScore) {
        setWinner('guest');
      } else {
        setWinner('');
      }
    } else {
      setGuestScore(score);
      
      // Update winner based on scores
      if (score > hostScore) {
        setWinner('guest');
      } else if (score < hostScore) {
        setWinner('host');
      } else {
        setWinner('');
      }
    }
  };
  
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };
  
  const handleFiles = (files) => {
    if (files.length === 0) return;
    
    // Limit to 3 screenshots
    const newFiles = files.slice(0, 3 - screenshots.length);
    
    // Create preview URLs
    const newScreenshots = newFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    
    setScreenshots([...screenshots, ...newScreenshots].slice(0, 3));
    setErrors(prev => ({ ...prev, screenshots: null }));
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  
  const handleDragLeave = () => {
    setIsDragOver(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };
  
  const removeScreenshot = (index) => {
    const newScreenshots = [...screenshots];
    URL.revokeObjectURL(newScreenshots[index].preview);
    newScreenshots.splice(index, 1);
    setScreenshots(newScreenshots);
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!winner) {
      newErrors.winner = 'Please select a winner';
    }
    
    if (isDisputing && !disputeReason.trim()) {
      newErrors.disputeReason = 'Please provide a reason for the dispute';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const uploadScreenshot = async (file) => {
    const storageRef = ref(storage, `match-results/${match.id}/${Date.now()}-${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  };
  
  // Helper to check if current user is VIP (active and not expired)
  const checkIsVip = async () => {
    // Try to check from currentUser first
    if (currentUser?.vipStatus && currentUser.vipStatus.isActive && currentUser.vipStatus.expiresAt) {
      const now = new Date();
      const expiresAt = currentUser.vipStatus.expiresAt.toDate ? currentUser.vipStatus.expiresAt.toDate() : new Date(currentUser.vipStatus.expiresAt);
      if (expiresAt > now) return true;
    }
    // Fallback: fetch from Firestore
    try {
      const db = getFirestore();
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const vipStatus = userSnap.data().vipStatus;
        if (vipStatus && vipStatus.isActive && vipStatus.expiresAt) {
          const now = new Date();
          const expiresAt = vipStatus.expiresAt.toDate ? vipStatus.expiresAt.toDate() : new Date(vipStatus.expiresAt);
          if (expiresAt > now) return true;
        }
      }
    } catch (e) {
      // Ignore errors, treat as not VIP
    }
    return false;
  };
  
  const handleDispute = async () => {
    if (!disputeReason.trim()) {
      setErrors(prev => ({ ...prev, disputeReason: 'Please provide a reason for the dispute' }));
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const currentTime = new Date();
      
      // Create dispute object
      const disputeData = {
        submittedBy: currentUser.uid,
        submitterName: currentUser.displayName || 'Anonymous',
        reason: disputeReason,
        timestamp: currentTime,
        type: 'dispute'
      };
      
      // Update match with dispute
      const matchRef = doc(db, 'wagers', match.id);
      await updateDoc(matchRef, {
        disputes: arrayUnion(disputeData),
        status: 'disputed',
        updatedAt: serverTimestamp()
      });
      
      // Add a system message to the chat
      const chatRef = collection(db, 'wager_chats');
      await addDoc(chatRef, {
        wagerId: match.id,
        senderId: 'system',
        senderName: 'System',
        content: `Match results disputed by ${currentUser.displayName || 'Anonymous'}. Reason: ${disputeReason}`,
        isSystem: true,
        timestamp: serverTimestamp()
      });
      
      notification.addNotification('Dispute submitted successfully. An admin will review the case.', 'info');
      
      onClose();
    } catch (error) {
      console.error('Error submitting dispute:', error);
      notification.addNotification('Failed to submit dispute: ' + error.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    // Prevent late submission
    if (existingResults && existingResults.length === 1 && resultsDeadline) {
      const now = new Date();
      if (now > resultsDeadline) {
        notification.addNotification('The deadline to submit results has passed. The first submission will stand.', 'error');
        return;
      }
    }
    setIsSubmitting(true);
    try {
      let screenshotUrls = [];
      if (screenshots.length > 0) {
        screenshotUrls = await Promise.all(screenshots.map(s => uploadScreenshot(s.file)));
      }
      const currentTime = new Date();
      const winnerData = {
        winnerId: winner === 'host' ? match.hostId : match.guestId,
        winnerName: winner === 'host' ? match.hostName : match.guestName,
        loserScore: winner === 'host' ? guestScore : hostScore,
        winnerScore: winner === 'host' ? hostScore : guestScore,
      };
      const resultData = {
        submittedBy: currentUser.uid,
        submitterName: currentUser.displayName || 'Anonymous',
        hostScore,
        guestScore,
        timestamp: currentTime,
        screenshots: screenshotUrls,
        ...winnerData
      };
      const matchRef = doc(db, 'wagers', match.id);
      if (!existingResults || existingResults.length === 0) {
        // First player submitting results: set deadline based on VIP status
        let deadline;
        const isVip = await checkIsVip();
        if (isVip) {
          deadline = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes for VIP
        } else {
          deadline = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes for non-VIP
        }
        await updateDoc(matchRef, {
          results: arrayUnion(resultData),
          status: 'submitting',
          updatedAt: serverTimestamp(),
          resultsDeadline: deadline
        });
        
        // Add a system message to the chat
        const chatRef = collection(db, 'wager_chats');
        await addDoc(chatRef, {
          wagerId: match.id,
          senderId: 'system',
          senderName: 'System',
          content: `${currentUser.displayName || 'Anonymous'} submitted match results. Waiting for the other player to confirm.`,
          isSystem: true,
          timestamp: serverTimestamp()
        });
        
        notification.addNotification('Results submitted. Waiting for the other player to confirm.', 'success');
      } else {
        // Second player submitting results - or updating previous submission
        const otherPlayerResults = existingResults.filter(result => result.submittedBy !== currentUser.uid);
        const otherPlayerResult = otherPlayerResults.length > 0 ? otherPlayerResults[0] : null;
        
        // If this user is resubmitting, remove their previous submission
        const updatedResults = existingResults.filter(result => result.submittedBy !== currentUser.uid);
        
        // Add the new submission
        updatedResults.push(resultData);
        
        // Check if results match with other player's submission
        const resultsMatch = otherPlayerResult && 
          otherPlayerResult.hostScore === hostScore && 
          otherPlayerResult.guestScore === guestScore && 
          otherPlayerResult.winnerId === winnerData.winnerId;
        
        if (resultsMatch) {
          console.log('MATCH COMPLETION: Results match, finalizing match');
          // Results match, finalize the match
          let winnerTeamMembers = [];
          if (match.isPartyWager) {
            if (winner === 'host' && match.partyMembers) {
              winnerTeamMembers = match.partyMembers.map(m => m.id);
            } else if (winner === 'guest' && match.guestPartyMembers) {
              winnerTeamMembers = match.guestPartyMembers.map(m => m.id);
            }
          }
          await updateDoc(matchRef, {
            results: updatedResults,
            status: 'completed',
            updatedAt: serverTimestamp(),
            winner: winner === 'host' ? 'host' : 'guest',
            winnerData,
            verified: true,
            ...(winnerTeamMembers.length > 0 && { winnerTeamMembers })
          });
          
          console.log('MATCH COMPLETION: Match status updated to completed');
          
          // Award XP to participants and the winner
          const participantIds = [];
          
          // Add host team participants
          if (match.isPartyWager && match.partyMembers) {
            console.log('MATCH COMPLETION: Adding host party members:', match.partyMembers);
            match.partyMembers.forEach(member => {
              if (member.id) participantIds.push(member.id);
            });
          } else if (match.hostId) {
            console.log('MATCH COMPLETION: Adding host:', match.hostId);
            participantIds.push(match.hostId);
          }
          
          // Add guest team participants
          if (match.isPartyWager && match.guestPartyMembers) {
            console.log('MATCH COMPLETION: Adding guest party members:', match.guestPartyMembers);
            match.guestPartyMembers.forEach(member => {
              if (member.id) participantIds.push(member.id);
            });
          } else if (match.guestId) {
            console.log('MATCH COMPLETION: Adding guest:', match.guestId);
            participantIds.push(match.guestId);
          }
          
          // Process XP awards
          console.log('MATCH COMPLETION: Processing XP with data:', {
            winner: winnerData.winnerId,
            participants: participantIds,
            wagerAmount: match.amount
          });
          
          try {
            const xpResults = await processWagerXp(winnerData.winnerId, participantIds, match.amount);
            console.log('MATCH COMPLETION: XP processing results:', xpResults);
            
            // Force refresh of XP data in the UI
            console.log('MATCH COMPLETION: Refreshing XP data in UI');
            await refreshXpData();
            
            // Small delay to ensure Firestore has the latest data
            setTimeout(() => {
              console.log('MATCH COMPLETION: Triggering another XP refresh after delay');
              refreshXpData();
            }, 1000);
          } catch (error) {
            console.error('MATCH COMPLETION: Error processing XP:', error);
          }
          
          // Add a system message to the chat
          const chatRef = collection(db, 'wager_chats');
          await addDoc(chatRef, {
            wagerId: match.id,
            senderId: 'system',
            senderName: 'System',
            content: `Match results confirmed by both players. ${winnerData.winnerName} won with a score of ${winnerData.winnerScore}-${winnerData.loserScore}.`,
            isSystem: true,
            timestamp: serverTimestamp()
          });
          
          notification.addNotification('Results verified and match completed!', 'success');
        } else if (otherPlayerResult) {
          // Results don't match, mark as disputed
          await updateDoc(matchRef, {
            results: updatedResults,
            status: 'conflicted',
            updatedAt: serverTimestamp()
          });
          
          // Add a system message to the chat
          const chatRef = collection(db, 'wager_chats');
          await addDoc(chatRef, {
            wagerId: match.id,
            senderId: 'system',
            senderName: 'System',
            content: `Match results conflict detected. Both players submitted different results. An admin will review the case.`,
            isSystem: true,
            timestamp: serverTimestamp()
          });
          
          notification.addNotification('Results conflict detected. An admin will review the case.', 'warning');
        } else {
          // User is updating their own submission
          await updateDoc(matchRef, {
            results: updatedResults,
            updatedAt: serverTimestamp()
          });
          
          // Add a system message to the chat
          const chatRef = collection(db, 'wager_chats');
          await addDoc(chatRef, {
            wagerId: match.id,
            senderId: 'system',
            senderName: 'System',
            content: `${currentUser.displayName || 'Anonymous'} updated their match results. Waiting for the other player to confirm.`,
            isSystem: true,
            timestamp: serverTimestamp()
          });
          
          notification.addNotification('Results updated. Waiting for the other player to confirm.', 'success');
        }
      }
      
      if (onResultSubmitted) {
        onResultSubmitted(resultData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error submitting results:', error);
      notification.addNotification('Failed to submit results: ' + error.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen || !match) {
    return null;
  }
  
  // Determine if this user has already submitted results
  const hasSubmittedResults = existingResults?.some(result => result.submittedBy === currentUser?.uid);
  
  // Determine if the other player has already submitted results
  const otherPlayerSubmitted = existingResults?.some(result => result.submittedBy !== currentUser?.uid);
  
  return (
    <>
      {xpResult && <XpNotification xpResult={xpResult} onClose={clearXpResult} />}
      <ModalBackdrop onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <h2>Submit Match Results</h2>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </ModalHeader>
        
        {otherPlayerSubmitted && (
          <InfoMessage>
            The other player has already submitted results. Please verify if their submission is correct.
            If you disagree with their results, you can submit your own version and the system will flag the match for review.
          </InfoMessage>
        )}
        
        {hasSubmittedResults && (
          <InfoMessage>
            You have already submitted results for this match. You can update your submission if needed.
          </InfoMessage>
        )}
        
        {existingResults && existingResults.length === 1 && resultsDeadline && timer > 0 && (
          <InfoMessage>
            The other player has submitted their results. You have <b>{formatTimer(timer)}</b> to submit your results. If you do not submit in time, their result will stand.
          </InfoMessage>
        )}
        {existingResults && existingResults.length === 1 && resultsDeadline && timer === 0 && (
          <InfoMessage>
            The deadline to submit results has passed. The first submission will stand as the final result.
          </InfoMessage>
        )}
        
        {isDisputing ? (
          <Form onSubmit={(e) => { e.preventDefault(); handleDispute(); }}>
            <FormGroup>
              <Label>Reason for dispute</Label>
              <DisputeTextarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Please explain why you're disputing the match results. Be specific and provide evidence if possible."
              />
              {errors.disputeReason && <ErrorMessage>{errors.disputeReason}</ErrorMessage>}
            </FormGroup>
            
            <ButtonGroup>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Dispute'}
              </Button>
              <Button
                type="button"
                $secondary
                onClick={() => setIsDisputing(false)}
                disabled={isSubmitting}
              >
                Back
              </Button>
            </ButtonGroup>
          </Form>
        ) : (
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label>Who won the match?</Label>
              <RadioGroup>
                <RadioOption $selected={winner === 'host'}>
                  <input
                    type="radio"
                    name="winner"
                    value="host"
                    checked={winner === 'host'}
                    onChange={() => handleWinnerChange('host')}
                  />
                  <TeamName $isHost={true}>{match.hostName || 'Match Creator'}</TeamName>
                </RadioOption>
                
                <RadioOption $selected={winner === 'guest'}>
                  <input
                    type="radio"
                    name="winner"
                    value="guest"
                    checked={winner === 'guest'}
                    onChange={() => handleWinnerChange('guest')}
                  />
                  <TeamName>{match.guestName || 'Joining Team'}</TeamName>
                </RadioOption>
              </RadioGroup>
              {errors.winner && <ErrorMessage>{errors.winner}</ErrorMessage>}
              
              <ScoreContainer>
                <TeamName $isHost={true}>{match.hostName || 'Match Creator'}</TeamName>
                <ScoreInput
                  type="number"
                  min="0"
                  max="99"
                  value={hostScore}
                  onChange={(e) => handleScoreChange('host', e.target.value)}
                />
                <Versus>vs</Versus>
                <ScoreInput
                  type="number"
                  min="0"
                  max="99"
                  value={guestScore}
                  onChange={(e) => handleScoreChange('guest', e.target.value)}
                />
                <TeamName>{match.guestName || 'Joining Team'}</TeamName>
              </ScoreContainer>
            </FormGroup>
            
            <FormGroup>
              <Label>Upload Screenshots (Optional)</Label>
              <UploadArea
                $isDragOver={isDragOver}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => {
                  if (screenshots.length < 3) {
                    document.getElementById('screenshot-upload-input').click();
                  }
                }}
                style={{ pointerEvents: screenshots.length >= 3 ? 'none' : 'auto', opacity: screenshots.length >= 3 ? 0.5 : 1 }}
              >
                <input
                  id="screenshot-upload-input"
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  disabled={screenshots.length >= 3}
                />
                <UploadIcon>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path fill="#4facfe" d="M12 16a1 1 0 0 1-1-1V8.41l-2.3 2.3a1 1 0 1 1-1.4-1.42l4-4a1 1 0 0 1 1.4 0l4 4a1 1 0 1 1-1.4 1.42L13 8.41V15a1 1 0 0 1-1 1Z"/><path fill="#4facfe" d="M20 20H4a1 1 0 1 1 0-2h16a1 1 0 1 1 0 2Z"/></svg>
                </UploadIcon>
                {screenshots.length < 3 ? (
                  <span>Drag & drop or click to upload up to 3 screenshots</span>
                ) : (
                  <span>Maximum 3 screenshots uploaded</span>
                )}
              </UploadArea>
              {screenshots.length > 0 && (
                <PreviewContainer>
                  {screenshots.map((s, idx) => (
                    <ImagePreview key={idx}>
                      <img src={s.preview} alt={`Screenshot ${idx + 1}`} />
                      <RemoveButton type="button" onClick={() => removeScreenshot(idx)} title="Remove screenshot">&times;</RemoveButton>
                    </ImagePreview>
                  ))}
                </PreviewContainer>
              )}
              {errors.screenshots && <ErrorMessage>{errors.screenshots}</ErrorMessage>}
            </FormGroup>
            
            <ButtonGroup>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Results'}
              </Button>
              {otherPlayerSubmitted && (
                <Button
                  type="button"
                  $secondary
                  onClick={() => setIsDisputing(true)}
                  disabled={isSubmitting}
                >
                  Dispute Results
                </Button>
              )}
              <Button
                type="button"
                $secondary
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </ButtonGroup>
          </Form>
        )}
      </ModalContent>
    </ModalBackdrop>
    </>
  );
};

export default SubmitResultsModal; 