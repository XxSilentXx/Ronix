import React, { useState } from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.6);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalContent = styled.div`
  background: #181a2a;
  border-radius: 16px;
  padding: 2rem 2.5rem;
  min-width: 340px;
  box-shadow: 0 8px 32px #000a;
  color: #fff;
  position: relative;
`;

const Title = styled.h2`
  margin-top: 0;
  margin-bottom: 1.5rem;
  font-size: 1.6rem;
  text-align: center;
`;

const Plans = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const PlanOption = styled.label`
  display: flex;
  align-items: center;
  background: #23244a;
  border-radius: 10px;
  padding: 1rem;
  cursor: pointer;
  border: 2px solid ${props => props.selected ? '#ffd700' : 'transparent'};
  transition: border 0.2s;
`;

const Radio = styled.input`
  margin-right: 1rem;
`;

const PlanDetails = styled.div`
  flex: 1;
`;

const Price = styled.div`
  font-weight: bold;
  color: #ffd700;
  font-size: 1.1rem;
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
`;

const Button = styled.button`
  background: #ffd700;
  color: #181a2a;
  border: none;
  border-radius: 8px;
  padding: 0.7rem 1.5rem;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: #ffe066;
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorMsg = styled.div`
  color: #ff4d4f;
  margin-bottom: 1rem;
  text-align: center;
`;

const plans = [
  { id: '1-month', label: '1 Month', price: 3.49, duration: '30 days' },
  { id: '3-month', label: '3 Months', price: 9.49, duration: '90 days' },
];

export default function VipPurchaseModal({ isOpen, onClose, onPurchase, loading, error }) {
  const [selectedPlan, setSelectedPlan] = useState('1-month');

  if (!isOpen) return null;

  return (
    <ModalOverlay>
      <ModalContent>
        <Title>Choose Your VIP Plan</Title>
        {error && <ErrorMsg>{error}</ErrorMsg>}
        <Plans>
          {plans.map(plan => (
            <PlanOption key={plan.id} selected={selectedPlan === plan.id}>
              <Radio
                type="radio"
                name="vip-plan"
                value={plan.id}
                checked={selectedPlan === plan.id}
                onChange={() => setSelectedPlan(plan.id)}
                disabled={loading}
              />
              <PlanDetails>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{plan.label}</div>
                <div style={{ fontSize: '0.95rem', color: '#aaa' }}>{plan.duration}</div>
              </PlanDetails>
              <Price>{plan.price} Coins</Price>
            </PlanOption>
          ))}
        </Plans>
        <ButtonRow>
          <Button onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            onClick={() => onPurchase(selectedPlan)}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Purchase'}
          </Button>
        </ButtonRow>
      </ModalContent>
    </ModalOverlay>
  );
} 