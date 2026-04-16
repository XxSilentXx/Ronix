import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParty } from '../contexts/PartyContext';
import { useAuth } from '../contexts/AuthContext';
import InviteFriendsModal from './InviteFriendsModal';
import PartyChat from './PartyChat';
import { useNavigate } from 'react-router-dom';
import RankBadge from './RankBadge';

const PartyPopupContainer = styled.div`
  position: fixed;
  right: ${props => props.$isOpen ? '0' : '-350px'};
  top: 80px;
  width: 350px;
  height: calc(100vh - 80px);
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(10px);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  transition: right 0.3s ease;
  z-index: 1000;
  display: flex;
  flex-direction: column;
`;

const PartyTab = styled.div`
  position: absolute;
  left: -60px;
  top: 20px;
  background: rgba(26, 26, 46, 0.95);
  backdrop-filter: blur(10px);
  border: 2px solid #4facfe;
  border-right: none;
  border-top-left-radius: 10px;
  border-bottom-left-radius: 10px;
  padding: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 0 15px rgba(79, 172, 254, 0.5);
  animation: pulse 2s infinite;
  
  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(79, 172, 254, 0.7);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(79, 172, 254, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(79, 172, 254, 0);
    }
  }
  
  &:hover {
    background: rgba(79, 172, 254, 0.4);
    transform: scale(1.05);
  }
  
  svg {
    width: 30px;
    height: 30px;
    fill: #4facfe;
  }
`;

const NotificationBadge = styled.div`
  position: absolute;
  top: -8px;
  right: -8px;
  width: 22px;
  height: 22px;
  background: #ff4757;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  border: 2px solid rgba(26, 26, 46, 0.95);
  color: white;
  animation: bounce 1s infinite;
  
  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-5px);
    }
  }
`;

const PartyContent = styled.div`
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  
  h3 {
    font-size: 1.2rem;
    color: #4facfe;
    margin: 0;
  }
`;

const CreatePartyButton = styled.button`
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 242, 254, 0.3);
  }
`;

const PartyMembersList = styled.div`
  margin-top: 1rem;
`;

const PartyMember = styled.div`
  display: flex;
  align-items: center;
  padding: 0.8rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  margin-bottom: 0.5rem;
  
  .avatar {
    width: 50px;
    height: 50px;
    min-width: 50px;
    border-radius: 8px;
    background: #4facfe;
    margin-right: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    color: white;
    font-size: 1.5rem;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
    background-size: cover;
    background-position: center;
    overflow: hidden;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
  
  .info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
    
    .name {
      font-weight: 600;
      color: #fff;
      display: flex;
      align-items: center;
    }
    
    .epic-username {
      font-size: 0.85rem;
      color: #b8c1ec;
    }
  }
  
  .leader-badge {
    background: #4facfe;
    color: white;
    font-size: 0.7rem;
    padding: 2px 8px;
    border-radius: 4px;
    margin-left: 8px;
    font-weight: 600;
  }
  
  .actions {
    display: flex;
    gap: 0.5rem;
  }
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.color || '#4facfe'};
  cursor: pointer;
  font-size: 0.8rem;
  padding: 2px 8px;
  border-radius: 5px;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const PartyActions = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
  
  button {
    flex: 1;
    margin: 0 0.5rem;
    
    &:first-child {
      margin-left: 0;
    }
    
    &:last-child {
      margin-right: 0;
    }
  }
`;

const InviteButton = styled(CreatePartyButton)`
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
`;

const LeaveButton = styled(CreatePartyButton)`
  background: rgba(255, 71, 87, 0.8);
  
  &:hover {
    background: rgba(255, 71, 87, 1);
    box-shadow: 0 5px 15px rgba(255, 71, 87, 0.3);
  }
`;

const StartWagerButton = styled(CreatePartyButton)`
  background: linear-gradient(90deg, #2ed573 0%, #7bed9f 100%);
  
  &:hover {
    box-shadow: 0 5px 15px rgba(46, 213, 115, 0.3);
  }
`;

const EmptyPartyMessage = styled.div`
  text-align: center;
  padding: 2rem 1rem;
  color: #b8c1ec;
`;

const CreatePartyForm = styled.form`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  
  input {
    flex: 1;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    padding: 0.8rem 1rem;
    color: #fff;
    font-size: 1rem;
    
    &:focus {
      outline: none;
      border-color: #4facfe;
    }
  }
`;

const ChatContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 1rem;
`;

const PartyPopup = () => {
  const { 
    currentParty, 
    partyMembers,
    partyInvites, 
    loading, 
    createParty, 
    leaveParty, 
    kickMember, 
    transferLeadership 
  } = useParty();
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [isOpen, setIsOpen] = useState(false);
  const [partyName, setPartyName] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  // Toggle panel open/closed
  const togglePanel = () => {
    setIsOpen(!isOpen);
  };
  
  // Check if user is party leader
  const isLeader = currentParty && currentUser && currentParty.leader === currentUser.uid;
  
  // Get user's initials for avatar
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };
  
  // Handle form submission to create a party
  const handleCreateParty = async (e) => {
    e.preventDefault();
    if (!partyName.trim()) return;
    
    try {
      await createParty(partyName.trim());
      setPartyName('');
    } catch (error) {
      console.error('Error creating party:', error);
    }
  };
  
  // Handle leaving the party
  const handleLeaveParty = async () => {
    try {
      await leaveParty();
    } catch (error) {
      console.error('Error leaving party:', error);
    }
  };
  
  // Handle kicking a member from the party
  const handleKickMember = async (userId) => {
    try {
      await kickMember(userId);
    } catch (error) {
      console.error('Error kicking member:', error);
    }
  };
  
  // Handle transferring party leadership
  const handleTransferLeadership = async (userId) => {
    try {
      await transferLeadership(userId);
    } catch (error) {
      console.error('Error transferring leadership:', error);
    }
  };
  
  // Navigate to wagers page
  const handleGoToWagers = () => {
    navigate('/wagers');
    setIsOpen(false);
  };
  
  return (
    <PartyPopupContainer $isOpen={isOpen}>
      <PartyTab onClick={togglePanel}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M12 12.75c1.63 0 3.07.39 4.24.9 1.08.48 1.76 1.56 1.76 2.73V18H6v-1.62c0-1.17.68-2.25 1.76-2.73 1.17-.51 2.61-.9 4.24-.9zM12 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm9 3.75V19H21v-4.25c0-1.52-.88-2.93-2.25-3.6.56.6.89 1.41.89 2.28V15c0 .55-.45 1-1 1h-1.64zm-1-9.75c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zM4.42 13.4c-1.37.67-2.25 2.08-2.25 3.6V19H3v-2.25c0-.87.33-1.68.89-2.28-1.37.67-2.25 2.08-2.25 3.6V19h1.64c.55 0 1-.45 1-1v-1.62c0-.87.33-1.68.89-2.28-.56-.6-.89-1.41-.89-2.28V11c0-.55.45-1 1-1h1.64c.55 0 1 .45 1 1v1.62c0 .87-.33 1.68-.89 2.28.56.6.89 1.41.89 2.28V19h1.64c.55 0 1-.45 1-1v-1.62c0-.87.33-1.68.89-2.28-.56-.6-.89-1.41-.89-2.28V11c0-.55.45-1 1-1h1.64c.55 0 1 .45 1 1v1.62c0 .87-.33 1.68-.89 2.28.56.6.89 1.41.89 2.28V19H15v2H9v-2H3v2h-.58V13.4z"/>
        </svg>
        {partyInvites && partyInvites.length > 0 && (
          <NotificationBadge>{partyInvites.length}</NotificationBadge>
        )}
      </PartyTab>
      
      <PartyContent>
        <PanelHeader>
          <h3>{currentParty ? currentParty.name : 'Party'}</h3>
        </PanelHeader>
        
        {loading ? (
          <EmptyPartyMessage>Loading...</EmptyPartyMessage>
        ) : !currentUser ? (
          <EmptyPartyMessage>
            <p>Sign in to create or join a party</p>
          </EmptyPartyMessage>
        ) : !currentParty ? (
          <>
            <EmptyPartyMessage>
              <p>You are not in a party</p>
              <p>Create a new party or wait for an invitation</p>
            </EmptyPartyMessage>
            
            <CreatePartyForm onSubmit={handleCreateParty}>
              <input
                type="text"
                placeholder="Party name"
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
              />
              <CreatePartyButton type="submit">Create</CreatePartyButton>
            </CreatePartyForm>
          </>
        ) : (
          <>
            <PartyMembersList>
              {partyMembers.map((member) => (
                <PartyMember key={member.id}>
                  <div className="avatar">
                    {member.photoURL ? (
                      <img src={member.photoURL} alt={member.displayName} />
                    ) : (
                      getInitials(member.displayName)
                    )}
                  </div>
                  <div className="info">
                    <div className="name" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      {member.displayName}
                      <RankBadge userId={member.id} size={20} marginLeft="0.25rem" />
                      {member.isLeader && <span className="leader-badge">Leader</span>}
                    </div>
                    {member.epicUsername && (
                      <div className="epic-username">Epic: {member.epicUsername}</div>
                    )}
                  </div>
                  
                  {isLeader && member.id !== currentUser.uid && (
                    <div className="actions">
                      <ActionButton 
                        onClick={() => handleTransferLeadership(member.id)}
                        title="Transfer leadership"
                      >
                        
                      </ActionButton>
                      <ActionButton 
                        onClick={() => handleKickMember(member.id)}
                        color="#ff4757"
                        title="Kick from party"
                      >
                        
                      </ActionButton>
                    </div>
                  )}
                </PartyMember>
              ))}
            </PartyMembersList>
            
            <PartyActions>
              <InviteButton onClick={() => setShowInviteModal(true)}>
                Invite Friends
              </InviteButton>
              <LeaveButton onClick={handleLeaveParty}>
                Leave Party
              </LeaveButton>
            </PartyActions>
            
            {isLeader && (
              <PartyActions>
                <StartWagerButton onClick={handleGoToWagers}>
                  Start Wager
                </StartWagerButton>
              </PartyActions>
            )}
            
            <ChatContainer>
              <PartyChat partyId={currentParty.id} />
            </ChatContainer>
          </>
        )}
      </PartyContent>
      
      {showInviteModal && (
        <InviteFriendsModal onClose={() => setShowInviteModal(false)} />
      )}
    </PartyPopupContainer>
  );
};

export default PartyPopup; 