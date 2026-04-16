import React from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useInsurance } from '../contexts/InsuranceContext';

const pulse = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
`;

const InsuranceContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  
  ${props => props.$isActive ? css`
    background: linear-gradient(135deg, #4CAF50, #45a049);
    color: white;
    border: 2px solid #4CAF50;
    animation: ${pulse} 2s infinite;
  ` : props.$isOnCooldown ? css`
    background: linear-gradient(135deg, #ff6b6b, #ff5252);
    color: white;
    border: 2px solid #ff6b6b;
  ` : css`
    background: rgba(255, 255, 255, 0.1);
    color: #ccc;
    border: 2px solid #555;
  `}
`;

const InsuranceIcon = styled.span`
  font-size: 16px;
  ${props => props.$isActive && css`
    filter: drop-shadow(0 0 4px rgba(76, 175, 80, 0.6));
  `}
  ${props => props.$isOnCooldown && css`
    filter: drop-shadow(0 0 4px rgba(255, 107, 107, 0.6));
  `}
`;

const InsuranceText = styled.span`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const InsuranceTitle = styled.span`
  font-weight: 600;
`;

const InsuranceDetails = styled.span`
  font-size: 12px;
  opacity: 0.9;
`;

const InsuranceIndicator = ({ entryFee, compact = false }) => {
  const { 
    isActive, 
    maxRefund, 
    loading, 
    isOnCooldown, 
    cooldownRemaining, 
    formatCooldownTime 
  } = useInsurance();

  if (loading) {
    return (
      <InsuranceContainer $isActive={false} $isOnCooldown={false}>
        <InsuranceIcon></InsuranceIcon>
        <span>Loading...</span>
      </InsuranceContainer>
    );
  }

  if (isActive) {
    const protectedAmount = entryFee ? Math.min(entryFee, maxRefund) : maxRefund;

    return (
      <InsuranceContainer $isActive={true} $isOnCooldown={false}>
        <InsuranceIcon $isActive={true}></InsuranceIcon>
        <InsuranceText>
          <InsuranceTitle>Insurance Active</InsuranceTitle>
          {!compact && (
            <InsuranceDetails>
              Protected: {protectedAmount} coins
            </InsuranceDetails>
          )}
        </InsuranceText>
      </InsuranceContainer>
    );
  }

  if (isOnCooldown) {
    return (
      <InsuranceContainer $isActive={false} $isOnCooldown={true}>
        <InsuranceIcon $isOnCooldown={true}></InsuranceIcon>
        <InsuranceText>
          <InsuranceTitle>Insurance Cooldown</InsuranceTitle>
          {!compact && (
            <InsuranceDetails>
              {formatCooldownTime(cooldownRemaining)} remaining
            </InsuranceDetails>
          )}
        </InsuranceText>
      </InsuranceContainer>
    );
  }

  return (
    <InsuranceContainer $isActive={false} $isOnCooldown={false}>
      <InsuranceIcon></InsuranceIcon>
      <InsuranceText>
        <InsuranceTitle>No Insurance</InsuranceTitle>
        {!compact && <InsuranceDetails>Activate in Shop</InsuranceDetails>}
      </InsuranceText>
    </InsuranceContainer>
  );
};

export default InsuranceIndicator; 