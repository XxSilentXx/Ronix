import React, { useState } from 'react';
import styled from 'styled-components';
import { useParty } from '../contexts/PartyContext';
import { useAuth } from '../contexts/AuthContext';
import InviteFriendsModal from './InviteFriendsModal';
import RankBadge from './RankBadge';
import { getAvatarUrl } from '../utils/avatarUtils';

const PartyPanelContainer = styled.div`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 2rem;
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

const PartyInvites = styled.div`
  margin-top: 1rem;
  
  h4 {
    font-size: 1rem;
    color: #fff;
    margin-bottom: 0.5rem;
  }
`;

const InviteCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 0.8rem;
  margin-bottom: 0.5rem;
  
  .party-name {
    font-weight: 600;
    color: #fff;
  }
  
  .leader-name {
    font-size: 0.8rem;
    color: #b8c1ec;
    margin-bottom: 0.5rem;
  }
  
  .actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }
`;

const PartyPanel = () => {
  const { currentUser } = useAuth();
  const { 
    currentParty, 
    partyMembers, 
    partyInvites,
    loading, 
    error,
    createParty,
    leaveParty,
    kickMember,
    transferLeadership,
    acceptInvite,
    declineInvite
  } = useParty();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [partyName, setPartyName] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isCreatingParty, setIsCreatingParty] = useState(false);
  const [isLeavingParty, setIsLeavingParty] = useState(false);
  
  const handleCreateParty = async (e) => {
    e.preventDefault();
    
    if (!partyName.trim()) {
      return;
    }
    
    try {
      setIsCreatingParty(true);
      await createParty(partyName);
      setShowCreateForm(false);
      setPartyName('');
    } catch (err) {
      console.error('Error creating party:', err);
    } finally {
      setIsCreatingParty(false);
    }
  };
  
  const handleLeaveParty = async () => {
    try {
      setIsLeavingParty(true);
      await leaveParty();
    } catch (err) {
      console.error('Error leaving party:', err);
    } finally {
      setIsLeavingParty(false);
    }
  };
  
  const handleKickMember = async (userId) => {
    try {
      await kickMember(userId);
    } catch (err) {
      console.error('Error kicking member:', err);
    }
  };
  
  const handleTransferLeadership = async (userId) => {
    try {
      await transferLeadership(userId);
    } catch (err) {
      console.error('Error transferring leadership:', err);
    }
  };
  
  const handleAcceptInvite = async (partyId) => {
    try {
      await acceptInvite(partyId);
    } catch (err) {
      console.error('Error accepting invite:', err);
    }
  };
  
  const handleDeclineInvite = async (partyId) => {
    try {
      await declineInvite(partyId);
    } catch (err) {
      console.error('Error declining invite:', err);
    }
  };
  
  if (loading) {
    return (
      <PartyPanelContainer>
        <PanelHeader>
          <h3>Party</h3>
        </PanelHeader>
        <div style={{ textAlign: 'center', padding: '1rem' }}>Loading party information...</div>
      </PartyPanelContainer>
    );
  }
  
  if (error) {
    return (
      <PartyPanelContainer>
        <PanelHeader>
          <h3>Party</h3>
        </PanelHeader>
        <div style={{ color: '#ff4757', textAlign: 'center', padding: '1rem' }}>{error}</div>
      </PartyPanelContainer>
    );
  }
  
  if (!currentParty) {
    return (
      <PartyPanelContainer>
        <PanelHeader>
          <h3>Party</h3>
          {!showCreateForm && (
            <CreatePartyButton onClick={() => setShowCreateForm(true)}>
              Create Party
            </CreatePartyButton>
          )}
        </PanelHeader>
        
        {showCreateForm ? (
          <CreatePartyForm onSubmit={handleCreateParty}>
            <input
              type="text"
              placeholder="Enter party name"
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              required
            />
            <CreatePartyButton type="submit" disabled={isCreatingParty}>
              {isCreatingParty ? 'Creating...' : 'Create'}
            </CreatePartyButton>
            <ActionButton 
              color="#ff4757" 
              onClick={() => setShowCreateForm(false)}
              type="button"
            >
              Cancel
            </ActionButton>
          </CreatePartyForm>
        ) : (
          <EmptyPartyMessage>
            You're not in a party. Create one to invite friends and play together!
          </EmptyPartyMessage>
        )}
        
        {partyInvites.length > 0 && (
          <PartyInvites>
            <h4>Party Invitations</h4>
            {partyInvites.map(invite => (
              <InviteCard key={invite.partyId}>
                <div className="party-name">{invite.partyName}</div>
                <div className="leader-name">From: {invite.leaderName}</div>
                <div className="actions">
                  <ActionButton 
                    color="#2ed573" 
                    onClick={() => handleAcceptInvite(invite.partyId)}
                  >
                    Accept
                  </ActionButton>
                  <ActionButton 
                    color="#ff4757" 
                    onClick={() => handleDeclineInvite(invite.partyId)}
                  >
                    Decline
                  </ActionButton>
                </div>
              </InviteCard>
            ))}
          </PartyInvites>
        )}
      </PartyPanelContainer>
    );
  }
  
  // User is in a party
  return (
    <PartyPanelContainer>
      <PanelHeader>
        <h3>{currentParty.name}</h3>
        <div style={{ fontSize: '0.8rem', color: '#b8c1ec' }}>
          {partyMembers.length}/{currentParty.maxSize} members
        </div>
      </PanelHeader>
      
      <PartyMembersList>
        {partyMembers.map(member => {
          const [imgError, setImgError] = useState(false);
          const avatarUrl = getAvatarUrl ? getAvatarUrl(member) : member.photoURL;
          return (
            <PartyMember key={member.id}>
              <div className="avatar">
                {avatarUrl && !imgError ? (
                  <img
                    src={avatarUrl}
                    alt={member.displayName}
                    onError={() => setImgError(true)}
                  />
                ) : (
                  member.displayName.charAt(0).toUpperCase()
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
              {currentUser && 
               currentParty.leader === currentUser.uid && 
               member.id !== currentUser.uid && (
                <div className="actions">
                  <ActionButton 
                    color="#4facfe" 
                    onClick={() => handleTransferLeadership(member.id)}
                  >
                    Make Leader
                  </ActionButton>
                  <ActionButton 
                    color="#ff4757" 
                    onClick={() => handleKickMember(member.id)}
                  >
                    Kick
                  </ActionButton>
                </div>
              )}
            </PartyMember>
          );
        })}
      </PartyMembersList>
      
      <PartyActions>
        {currentUser && currentParty.leader === currentUser.uid && (
          <InviteButton onClick={() => setShowInviteModal(true)}>
            Invite Friends
          </InviteButton>
        )}
        
        {currentUser && currentParty.leader === currentUser.uid && (
          <StartWagerButton>Start Wager</StartWagerButton>
        )}
        
        <LeaveButton 
          onClick={handleLeaveParty}
          disabled={isLeavingParty}
        >
          {isLeavingParty ? 'Leaving...' : 'Leave Party'}
        </LeaveButton>
      </PartyActions>
      
      {showInviteModal && (
        <InviteFriendsModal onClose={() => setShowInviteModal(false)} />
      )}
    </PartyPanelContainer>
  );
};

export default PartyPanel; 