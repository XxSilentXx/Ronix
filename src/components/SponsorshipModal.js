import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { SPONSORSHIP_RULES } from '../types/wager';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 20px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ModalHeader = styled.div`
  padding: 30px 30px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h2`
  color: #fff;
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #888;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
`;

const ModalBody = styled.div`
  padding: 30px;
`;

const InfoSection = styled.div`
  background: rgba(74, 144, 226, 0.1);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
`;

const InfoText = styled.p`
  color: #b8c1ec;
  margin: 0 0 8px 0;
  font-size: 1rem;
  line-height: 1.5;

  &:last-child {
    margin-bottom: 0;
  }
`;



const MembersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 30px;
`;

const MemberCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s ease;

  ${props => props.isSponsored && `
    border-color: rgba(79, 172, 254, 0.5);
    background: rgba(79, 172, 254, 0.1);
  `}
`;

const MemberHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const MemberInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const Avatar = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);
`;

const MemberDetails = styled.div``;

const MemberName = styled.h3`
  color: #fff;
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 5px 0;
`;

const BalanceInfo = styled.div`
  display: flex;
  gap: 15px;
  font-size: 0.9rem;
`;

const BalanceItem = styled.span`
  color: ${props => props.type === 'has' ? '#4caf50' : '#ff4757'};
  font-weight: 500;
`;

const SponsorToggle = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.1);
  padding: 12px 16px;
  border-radius: 10px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  input {
    width: 18px;
    height: 18px;
    accent-color: #4facfe;
  }

  span {
    color: #fff;
    font-weight: 500;
  }
`;

const SponsorshipDetails = styled.div`
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const SliderSection = styled.div`
  margin-bottom: 20px;
`;

const SliderLabel = styled.label`
  display: block;
  color: #b8c1ec;
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 15px;
`;

const SliderContainer = styled.div`
  position: relative;
  margin-bottom: 15px;
`;

const Slider = styled.input`
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.2);
  outline: none;
  -webkit-appearance: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #4facfe;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  }

  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #4facfe;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  }
`;

const SliderLabels = styled.div`
  display: flex;
  justify-content: space-between;
  color: #888;
  font-size: 0.8rem;
  margin-top: 5px;
`;

const ShareDisplay = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
`;

const ShareBreakdown = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 15px;
`;

const ShareItem = styled.div`
  text-align: center;
  padding: 15px;
  border-radius: 10px;
  background: ${props => props.type === 'sponsor' ? 'rgba(79, 172, 254, 0.2)' : 'rgba(76, 175, 80, 0.2)'};
  border: 1px solid ${props => props.type === 'sponsor' ? 'rgba(79, 172, 254, 0.3)' : 'rgba(76, 175, 80, 0.3)'};
`;

const ShareLabel = styled.div`
  color: #b8c1ec;
  font-size: 0.9rem;
  margin-bottom: 5px;
`;

const ShareValue = styled.div`
  color: #fff;
  font-size: 1.5rem;
  font-weight: 700;
`;

const ShareNote = styled.p`
  color: #4facfe;
  font-size: 0.9rem;
  text-align: center;
  margin: 0;
  font-style: italic;
`;

const SummarySection = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 30px;
`;

const SummaryTitle = styled.h3`
  color: #fff;
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0 0 20px 0;
  text-align: center;
`;

const CostBreakdown = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const CostItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #b8c1ec;
  font-size: 1rem;

  &.total {
    padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    color: #fff;
    font-weight: 600;
    font-size: 1.1rem;
  }

  &.remaining {
    color: ${props => props.isNegative ? '#ff4757' : '#4caf50'};
    font-weight: 500;
  }
`;

const ModalFooter = styled.div`
  padding: 20px 30px 30px;
  display: flex;
  gap: 15px;
  justify-content: flex-end;
`;

const Button = styled.button`
  padding: 15px 30px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;

  &.secondary {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.2);

    &:hover {
      background: rgba(255, 255, 255, 0.15);
    }
  }

  &.primary {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(79, 172, 254, 0.3);

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(79, 172, 254, 0.4);
    }

    &:disabled {
      background: #444;
      cursor: not-allowed;
      box-shadow: none;
      transform: none;
    }
  }
`;

const SponsorshipModal = ({ 
  isOpen, 
  onClose, 
  partyMembers, 
  wagerAmount, 
  onSponsorshipConfirm 
}) => {
  const { currentUser } = useAuth();
  const [sponsorships, setSponsorships] = useState([]);
  const [totalCost, setTotalCost] = useState(0);

  // Calculate members who need sponsorship
  const membersNeedingSponsorship = partyMembers.filter(member => 
    member.userId !== currentUser.uid && 
    member.tokenBalance < wagerAmount
  );

  useEffect(() => {
    // Calculate total cost when sponsorships change
    const cost = sponsorships.reduce((sum, sponsorship) => 
      sum + (sponsorship.enabled ? wagerAmount : 0), 0
    );
    setTotalCost(cost);
  }, [sponsorships, wagerAmount]);

  const handleSponsorshipToggle = (memberId, enabled) => {
    setSponsorships(prev => {
      const existing = prev.find(s => s.memberId === memberId);
      if (existing) {
        return prev.map(s => 
          s.memberId === memberId 
            ? { ...s, enabled }
            : s
        );
      } else {
        return [...prev, {
          memberId,
          enabled,
          sponsorShare: SPONSORSHIP_RULES.DEFAULT_SPONSOR_SHARE,
          sponsoredShare: SPONSORSHIP_RULES.DEFAULT_SPONSORED_SHARE
        }];
      }
    });
  };

  const handleShareChange = (memberId, sponsoredShare) => {
    const sponsorShare = 100 - sponsoredShare;
    setSponsorships(prev => 
      prev.map(s => 
        s.memberId === memberId 
          ? { ...s, sponsorShare, sponsoredShare }
          : s
      )
    );
  };

  const handleConfirm = () => {
    const enabledSponsorships = sponsorships.filter(s => s.enabled);
    onSponsorshipConfirm(enabledSponsorships);
    onClose();
  };



  const remainingBalance = Math.max(0, currentUser.tokenBalance - (wagerAmount + totalCost));
  const isInsufficientFunds = totalCost + wagerAmount > currentUser.tokenBalance;
  
  // Check if ALL members who need sponsorship are sponsored
  const enabledSponsorships = sponsorships.filter(s => s.enabled);
  const allMembersSponsored = membersNeedingSponsorship.length === 0 || 
    membersNeedingSponsorship.every(member => 
      enabledSponsorships.some(sponsorship => sponsorship.memberId === member.userId)
    );

  if (!isOpen) return null;

  return (
    <ModalOverlay>
      <ModalContent>
        <ModalHeader>
          <Title>
             Sponsor Teammates
          </Title>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>

        <ModalBody>
          <InfoSection>
            <InfoText>
              <strong>Some teammates need sponsorship!</strong>
            </InfoText>
            <InfoText>
              You can sponsor them and choose how to split any winnings. This lets everyone play together even if they don't have enough coins.
            </InfoText>
          </InfoSection>

          {membersNeedingSponsorship.length === 0 ? (
            <InfoSection>
              <InfoText style={{ color: '#4caf50', textAlign: 'center' }}>
                 All party members have enough coins!
              </InfoText>
            </InfoSection>
          ) : (
            <>


              <MembersList>
                {membersNeedingSponsorship.map(member => {
                  const sponsorship = sponsorships.find(s => s.memberId === member.userId);
                  const isEnabled = sponsorship?.enabled || false;
                  const sponsoredShare = sponsorship?.sponsoredShare ?? SPONSORSHIP_RULES.DEFAULT_SPONSORED_SHARE;
                  const sponsorShare = 100 - sponsoredShare;

                  return (
                    <MemberCard key={member.userId} isSponsored={isEnabled}>
                      <MemberHeader>
                        <MemberInfo>
                          <Avatar 
                            src={member.photoURL || '/default-avatar.png'} 
                            alt={member.displayName}
                          />
                          <MemberDetails>
                            <MemberName>{member.displayName}</MemberName>
                            <BalanceInfo>
                              <BalanceItem type="has">Has: {member.tokenBalance} coins</BalanceItem>
                              <BalanceItem type="needs">Needs: {wagerAmount} coins</BalanceItem>
                            </BalanceInfo>
                          </MemberDetails>
                        </MemberInfo>
                        
                        <SponsorToggle>
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={(e) => handleSponsorshipToggle(member.userId, e.target.checked)}
                          />
                          <span>Sponsor ({wagerAmount} coins)</span>
                        </SponsorToggle>
                      </MemberHeader>

                      {isEnabled && (
                        <SponsorshipDetails>
                          <SliderSection>
                            <SliderLabel>How much of the winnings should {member.displayName} keep?</SliderLabel>
                            <SliderContainer>
                              <Slider
                                type="range"
                                min={SPONSORSHIP_RULES.MIN_SPONSORED_SHARE}
                                max={SPONSORSHIP_RULES.MAX_SPONSORED_SHARE}
                                step="1"
                                value={sponsoredShare}
                                onChange={(e) => handleShareChange(member.userId, parseInt(e.target.value))}
                              />
                              <SliderLabels>
                                <span>0%</span>
                                <span>50%</span>
                                <span>100%</span>
                              </SliderLabels>
                            </SliderContainer>
                          </SliderSection>

                          <ShareDisplay>
                            <ShareBreakdown>
                              <ShareItem type="sponsor">
                                <ShareLabel>You get</ShareLabel>
                                <ShareValue>{sponsorShare}%</ShareValue>
                              </ShareItem>
                              <ShareItem type="sponsored">
                                <ShareLabel>{member.displayName} gets</ShareLabel>
                                <ShareValue>{sponsoredShare}%</ShareValue>
                              </ShareItem>
                            </ShareBreakdown>
                            
                            {sponsoredShare === 0 && (
                              <ShareNote> They play for free, you get all winnings</ShareNote>
                            )}
                            {sponsoredShare === 100 && (
                              <ShareNote> You're being generous - they keep everything!</ShareNote>
                            )}
                            {sponsoredShare === 50 && (
                              <ShareNote> Fair 50/50 split</ShareNote>
                            )}
                          </ShareDisplay>
                        </SponsorshipDetails>
                      )}
                    </MemberCard>
                  );
                })}
              </MembersList>
            </>
          )}

          <SummarySection>
            <SummaryTitle> Cost Summary</SummaryTitle>
            <CostBreakdown>
              <CostItem>
                <span>Your entry fee:</span>
                <span>{wagerAmount} coins</span>
              </CostItem>
              <CostItem>
                <span>Sponsorship cost:</span>
                <span>{totalCost} coins</span>
              </CostItem>
              <CostItem className="total">
                <span>Total cost:</span>
                <span>{wagerAmount + totalCost} coins</span>
              </CostItem>
              {currentUser.tokenBalance && (
                <CostItem className="remaining" isNegative={remainingBalance <= 0}>
                  <span>Remaining balance:</span>
                  <span>{remainingBalance} coins</span>
                </CostItem>
              )}
            </CostBreakdown>
          </SummarySection>
        </ModalBody>

        <ModalFooter>
          <Button className="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            className="primary" 
            onClick={handleConfirm}
            disabled={isInsufficientFunds || !allMembersSponsored}
          >
            {isInsufficientFunds 
              ? 'Insufficient Coins' 
              : !allMembersSponsored
              ? `Sponsor all ${membersNeedingSponsorship.length} teammates who need it`
              : `Confirm (${wagerAmount + totalCost} coins)`
            }
          </Button>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};

export default SponsorshipModal; 