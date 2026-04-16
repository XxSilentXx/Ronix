import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { signInWithPopup, OAuthProvider } from 'firebase/auth';
import { auth } from '../firebase/config';
import './NewUserLinkingModal.css';

// Discord server invite URL - configurable at top of file
const DISCORD_INVITE_URL = 'https://discord.gg/JqXwnb6rSq';

const NewUserLinkingModal = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [discordLinked, setDiscordLinked] = useState(false);
  const [epicLinked, setEpicLinked] = useState(false);
  const [loading, setLoading] = useState({
    discord: false,
    epic: false,
    checking: true
  });
  const [showConfetti, setShowConfetti] = useState(false);
  const [epicLinkError, setEpicLinkError] = useState('');

  // Check current linking status when modal opens
  useEffect(() => {
    const checkLinkingStatus = async () => {
      if (!currentUser || !isOpen) return;

      try {
        setLoading(prev => ({ ...prev, checking: true }));
        const db = getFirestore();
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const wasDiscordLinked = discordLinked;
          const newDiscordLinked = userData.discordLinked || false;
          const newEpicLinked = userData.epicLinked || false;
          
          setDiscordLinked(newDiscordLinked);
          setEpicLinked(newEpicLinked);
          setEpicLinkError(''); // Clear any previous errors when checking status
          
          // If Discord just got linked (wasn't linked before but is now), move to step 2
          if (!wasDiscordLinked && newDiscordLinked && !newEpicLinked) {
            console.log('Discord just got linked, moving to step 2');
            setCurrentStep(2);
          }
          // If Discord is linked but Epic isn't, move to step 2
          else if (newDiscordLinked && !newEpicLinked) {
            setCurrentStep(2);
          }
          // If both are linked, show confetti
          if (newDiscordLinked && newEpicLinked) {
            setShowConfetti(true);
          }
        }
      } catch (error) {
        console.error('Error checking linking status:', error);
      } finally {
        setLoading(prev => ({ ...prev, checking: false }));
      }
    };

    checkLinkingStatus();
  }, [currentUser, isOpen, discordLinked]);

  // Periodically check for linking status updates when modal is open
  useEffect(() => {
    if (!isOpen || !currentUser) return;

    const interval = setInterval(async () => {
      try {
        const db = getFirestore();
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const newDiscordLinked = userData.discordLinked || false;
          const newEpicLinked = userData.epicLinked || false;
          
          if (newDiscordLinked !== discordLinked) {
            console.log('Discord linking status changed:', newDiscordLinked);
            setDiscordLinked(newDiscordLinked);
            if (newDiscordLinked && !newEpicLinked) {
              setCurrentStep(2);
            }
          }
          
          if (newEpicLinked !== epicLinked) {
            console.log('Epic linking status changed:', newEpicLinked);
            setEpicLinked(newEpicLinked);
            if (newDiscordLinked && newEpicLinked) {
              setShowConfetti(true);
            }
          }
        }
      } catch (error) {
        console.error('Error checking linking status updates:', error);
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, [isOpen, currentUser, discordLinked, epicLinked]);

  // Handle Discord linking
  const handleLinkDiscord = async () => {
    try {
      setLoading(prev => ({ ...prev, discord: true }));
      
      // Discord application credentials
      const clientId = process.env.REACT_APP_DISCORD_CLIENT_ID;
      const redirectUri = window.location.origin + '/auth-callback';
      
      // Set flag to indicate this is a modal-initiated Discord linking
      localStorage.setItem('discord_linking_from_modal', 'true');
      
      // Generate Discord OAuth URL
      const discordUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify%20email`;
      
      // Redirect to Discord
      window.location.href = discordUrl;
    } catch (error) {
      console.error('Error linking Discord:', error);
      setLoading(prev => ({ ...prev, discord: false }));
    }
  };

  // Handle joining Discord server
  const handleJoinDiscord = () => {
    window.open(DISCORD_INVITE_URL, '_blank', 'noopener,noreferrer');
    alert('Discord server opened in a new tab!');
  };

  // Handle Epic Games linking using Yunite verification (same as profile page)
  const handleLinkEpic = async () => {
    if (!discordLinked) return; // Don't allow if Discord isn't linked yet

    try {
      setLoading(prev => ({ ...prev, epic: true }));
      setEpicLinkError(''); // Clear any previous errors
      
      if (!currentUser) {
        setEpicLinkError('You must be logged in to verify your Epic Games account');
        setLoading(prev => ({ ...prev, epic: false }));
        return;
      }
      
      console.log('Starting Yunite verification process for user:', currentUser.uid);
      
      // Get the user's Discord ID from Firestore
      const db = getFirestore();
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      
      if (!userDoc.exists() || !userDoc.data().discordId) {
        setEpicLinkError('Could not find your Discord ID. Please try relinking your Discord account.');
        setLoading(prev => ({ ...prev, epic: false }));
        return;
      }
      
      const discordId = userDoc.data().discordId || userDoc.data().discordUserId;
      
      if (!discordId) {
        setEpicLinkError('Discord ID not found. Please try relinking your Discord account.');
        setLoading(prev => ({ ...prev, epic: false }));
        return;
      }
      
      try {
        // Call the Yunite API proxy function
        console.log('Calling Yunite API proxy with Discord ID:', discordId);
        
        const functionUrl = 'https://us-central1-tokensite-6eef3.cloudfunctions.net/yuniteApiProxy';
        
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'DISCORD',
            userIds: [discordId]
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API error: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Yunite API response via proxy:', data);
        
        // Process the API response
        if (data.users && data.users.length > 0) {
          // User is linked to an Epic account
          const epicUser = data.users[0];
          
          console.log(`Epic Games account verified! Linked to ${epicUser.epic.epicName}`);
          
          // Prepare Epic account details
          const epicData = {
            epicLinked: true,
            epicId: epicUser.epic.epicID,
            epicUsername: epicUser.epic.epicName,
            epicVerifiedAt: new Date().toISOString(),
            epicPlatform: epicUser.chosenPlatform || 'Unknown',
            epicPeripheral: epicUser.chosenPeripheral || 'Unknown',
            updatedAt: new Date().toISOString()
          };
          
          // Store the verification info in Firestore
          await setDoc(doc(db, 'users', currentUser.uid), epicData, { merge: true });
          
          // Also create entry in epicAccountLinks collection
          try {
            // Import the helper function from firebase/config
            const { createEpicAccountLink } = await import('../firebase/config');
            await createEpicAccountLink(
              currentUser.uid, 
              epicUser.epic.epicID, 
              epicUser.epic.epicName
            );
          } catch (linkError) {
            // If already linked to another user
            if (linkError.message.includes('already linked to another user')) {
              // Undo our changes to user document
              await setDoc(doc(db, 'users', currentUser.uid), {
                epicLinked: false,
                epicId: null,
                epicUsername: null,
                updatedAt: new Date().toISOString()
              }, { merge: true });
              
              setEpicLinkError('This Epic Games account is already linked to another user. Please use a different Epic account.');
              setLoading(prev => ({ ...prev, epic: false }));
              return;
            }
            
            console.error('Error creating Epic account link record:', linkError);
            // Continue without failing since the user document was already updated
          }
          
          // Update modal state
          setEpicLinked(true);
          setEpicLinkError(''); // Clear any errors on success
          setShowConfetti(true);
          
        } else if (data.notLinked && data.notLinked.includes(discordId)) {
          // User is in the guild but not linked
          setEpicLinkError('Your Discord account is not linked to an Epic Games account in our system. Please join our Discord server and follow the verification process.');
        } else if (data.notFound && data.notFound.includes(discordId)) {
          // User is not in the guild
          setEpicLinkError('You are not a member of our Discord server. Please join our server first.');
        } else {
          // Unexpected response
          setEpicLinkError('Could not verify your Epic Games account. Please try again later.');
        }
      } catch (apiError) {
        console.error('Error with Yunite verification:', apiError);
        setEpicLinkError('Failed to verify Epic Games account. Please try again later.');
      }
      
    } catch (error) {
      console.error('Error linking Epic Games:', error);
      setEpicLinkError('Failed to start Epic Games verification. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, epic: false }));
    }
  };

  // Handle continuing to wagers
  const handleContinue = () => {
    setEpicLinkError(''); // Clear errors when closing modal
    onClose();
    // Refresh the page to ensure all components update with new linking status
    window.location.href = '/wagers';
  };

  // Handle skipping for now
  const handleSkip = () => {
    setEpicLinkError(''); // Clear errors when closing modal
    onClose();
    navigate('/wagers');
  };

  // Confetti animation effect
  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  if (!isOpen) return null;

  return (
    <div className="new-user-modal-overlay">
      <div className="new-user-modal">
        {/* Confetti Effect */}
        {showConfetti && (
          <div className="confetti-container">
            {[...Array(50)].map((_, i) => (
              <div key={i} className="confetti-piece" style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                backgroundColor: ['#A259F7', '#00FFD0', '#FF61E6'][Math.floor(Math.random() * 3)]
              }} />
            ))}
          </div>
        )}

        {/* Header */}
        <div className="modal-header">
          <div className="welcome-icon"></div>
          <h1>Welcome to Ronix!</h1>
          <p>Let's get your account set up for competitive wagers</p>
        </div>

        {/* Progress Steps */}
        <div className="progress-steps">
          <div className={`step ${currentStep >= 1 ? 'active' : ''} ${discordLinked ? 'completed' : ''}`}>
            <div className="step-number">
              {discordLinked ? '' : '1'}
            </div>
            <span>Link Discord Account</span>
          </div>
          <div className="progress-line" />
          <div className={`step ${currentStep >= 2 ? 'active' : ''} ${epicLinked ? 'completed' : ''}`}>
            <div className="step-number">
              {epicLinked ? '' : '2'}
            </div>
            <span>Link Epic Games Account</span>
          </div>
        </div>

        {/* Step Content */}
        <div className="step-content">
          {currentStep === 1 && (
            <div className="step-section">
              <h2>Link Discord Account</h2>
              <p>Link your Discord account for verification and join our community server to get started!</p>
              
              <div className="button-group">
                <button 
                  className="discord-button primary"
                  onClick={handleLinkDiscord}
                  disabled={loading.discord || discordLinked}
                >
                  {loading.discord ? 'Linking...' : discordLinked ? ' Discord Linked' : ' Link Discord'}
                </button>
                
                <button 
                  className="discord-button secondary"
                  onClick={handleJoinDiscord}
                >
                   Join Server
                </button>
              </div>

              {discordLinked && (
                <div className="success-message">
                  <span className="checkmark"></span>
                  Discord account successfully linked!
                  <button 
                    className="next-step-button"
                    onClick={() => setCurrentStep(2)}
                  >
                    Next Step →
                  </button>
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="step-section">
              <h2>Link Epic Games Account</h2>
              <p>Connect your Epic Games account with yunite to verify your Fortnite account.</p>
              
              <button 
                className={`epic-button ${!discordLinked ? 'disabled' : ''}`}
                onClick={handleLinkEpic}
                disabled={loading.epic || !discordLinked || epicLinked}
              >
                {loading.epic ? 'Linking...' : epicLinked ? ' Epic Games Linked' : ' Link Epic Games'}
              </button>

              {!discordLinked && (
                <p className="requirement-note">
                  Complete Discord linking first to unlock this step
                </p>
              )}

              {epicLinkError && (
                <div className="error-message">
                  <span className="error-icon"></span>
                  {epicLinkError}
                </div>
              )}

              {epicLinked && (
                <div className="success-message">
                  <span className="checkmark"></span>
                  Epic Games account successfully linked!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="modal-actions">
          {discordLinked && epicLinked ? (
            <button className="continue-button celebration" onClick={handleContinue}>
               Start matching!
            </button>
          ) : (
            <>
              <button className="skip-button" onClick={handleSkip}>
                Skip for Now
              </button>
              {discordLinked && !epicLinked && (
                <button className="continue-partial" onClick={handleContinue}>
                  Continue with Discord Only
                </button>
              )}
            </>
          )}
        </div>

        {/* Loading Overlay */}
        {loading.checking && (
          <div className="loading-overlay">
            <div className="loading-spinner" />
            <p>Checking account status...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewUserLinkingModal; 