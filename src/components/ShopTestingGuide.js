import React, { useState } from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 16px;
  padding: 2rem;
  max-width: 700px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(79, 172, 254, 0.3);
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  
  &:hover {
    color: #ff61e6;
  }
`;

const Title = styled.h2`
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  background: linear-gradient(90deg, #4facfe 0%, #ff61e6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Section = styled.div`
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.3rem;
  margin-bottom: 0.8rem;
  color: #4facfe;
`;

const List = styled.ul`
  list-style-type: none;
  padding-left: 0.5rem;
  
  li {
    margin-bottom: 0.5rem;
    display: flex;
    align-items: flex-start;
    
    &:before {
      content: '→';
      color: #ff61e6;
      margin-right: 0.5rem;
      font-weight: bold;
    }
  }
`;

const TestStep = styled.div`
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  border-left: 3px solid #4facfe;
`;

const StepNumber = styled.div`
  background: #4facfe;
  color: #000;
  font-weight: bold;
  width: 25px;
  height: 25px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 0.8rem;
`;

const StepHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  font-weight: bold;
  font-size: 1.1rem;
`;

const Button = styled.button`
  background: linear-gradient(90deg, #4facfe 0%, #ff61e6 100%);
  color: white;
  border: none;
  padding: 0.6rem 1.5rem;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  margin-top: 1rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(79, 172, 254, 0.4);
  }
`;

const TestingCategories = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 1rem 0;
  
  .category {
    background: rgba(79, 172, 254, 0.1);
    padding: 0.5rem 1rem;
    border-radius: 6px;
    border: 1px solid rgba(79, 172, 254, 0.2);
    
    &:hover {
      background: rgba(79, 172, 254, 0.2);
    }
  }
`;

const ShopTestingGuide = ({ onClose }) => {
  const [currentView, setCurrentView] = useState('intro');
  
  return (
    <ModalOverlay>
      <ModalContent>
        <CloseButton onClick={onClose}>×</CloseButton>
        
        {currentView === 'intro' && (
          <>
            <Title>Shop System Testing Guide</Title>
            
            <Section>
              <p>
                This guide will help you test all aspects of the shop system to ensure each item
                type works correctly. Follow the steps below to verify the functionality.
              </p>
            </Section>
            
            <Section>
              <SectionTitle>Items to Test</SectionTitle>
              <TestingCategories>
                <div className="category">Subscriptions</div>
                <div className="category">Utilities</div>
                <div className="category">XP Boosts</div>
                <div className="category">Crates</div>
                <div className="category">Special Items</div>
                <div className="category">Bundles</div>
              </TestingCategories>
            </Section>
            
            <Section>
              <SectionTitle>Testing Process</SectionTitle>
              <List>
                <li>Add test tokens to your balance</li>
                <li>Purchase different types of items</li>
                <li>View your inventory</li>
                <li>Use items and verify their effects</li>
                <li>Check for proper integration with other systems</li>
              </List>
            </Section>
            
            <Button onClick={() => setCurrentView('steps')}>View Step-by-Step Guide</Button>
          </>
        )}
        
        {currentView === 'steps' && (
          <>
            <Title>Step-by-Step Testing Guide</Title>
            
            <TestStep>
              <StepHeader>
                <StepNumber>1</StepNumber>
                Add Test Tokens
              </StepHeader>
              <p>
                Use the "Add Test Tokens" button with an amount of your choice.
                Verify that your balance increases correctly.
              </p>
            </TestStep>
            
            <TestStep>
              <StepHeader>
                <StepNumber>2</StepNumber>
                Test VIP Subscription
              </StepHeader>
              <p>
                Purchase the VIP Subscription and check that:
              </p>
              <List>
                <li>Tokens are deducted correctly</li>
                <li>The "VIP Subscription" status changes to "ACTIVE"</li>
                <li>The item appears in your inventory with the correct expiration date</li>
              </List>
            </TestStep>
            
            <TestStep>
              <StepHeader>
                <StepNumber>3</StepNumber>
                Test XP Boosts
              </StepHeader>
              <p>
                Purchase an XP Boost item and verify:
              </p>
              <List>
                <li>The item appears in your inventory</li>
                <li>The "XP Boost" status changes to "ACTIVE"</li>
                <li>If it's a match-limited boost, check that it shows the correct number of uses</li>
              </List>
            </TestStep>
            
            <TestStep>
              <StepHeader>
                <StepNumber>4</StepNumber>
                Test Utility Items
              </StepHeader>
              <p>
                Purchase a utility item (like Match Snipes) and verify:
              </p>
              <List>
                <li>The item appears in your inventory with the correct number of uses</li>
                <li>The "Snipes Remaining" counter increases</li>
                <li>Using the item decreases the counter</li>
              </List>
            </TestStep>
            
            <TestStep>
              <StepHeader>
                <StepNumber>5</StepNumber>
                Test Bundles
              </StepHeader>
              <p>
                Purchase a bundle and check that:
              </p>
              <List>
                <li>All contained items appear in your inventory</li>
                <li>Each individual item functions correctly</li>
                <li>Status indicators update for all included items</li>
              </List>
            </TestStep>
            
            <TestStep>
              <StepHeader>
                <StepNumber>6</StepNumber>
                Verify Inventory Management
              </StepHeader>
              <p>
                Switch to the inventory view and:
              </p>
              <List>
                <li>Confirm all purchased items are listed</li>
                <li>Verify expiration dates are shown correctly</li>
                <li>Test using items from the inventory</li>
                <li>Check that used items show reduced uses or are removed if fully consumed</li>
              </List>
            </TestStep>
            
            <TestStep>
              <StepHeader>
                <StepNumber>7</StepNumber>
                Integration Tests
              </StepHeader>
              <p>
                Verify that shop items integrate with other systems:
              </p>
              <List>
                <li>XP boosts should affect XP earned in matches</li>
                <li>VIP subscription should provide any promised benefits</li>
                <li>Snipes should be available when joining matches</li>
                <li>Stat resets should update user profiles</li>
              </List>
            </TestStep>
            
            <Button onClick={() => setCurrentView('intro')}>Back to Overview</Button>
          </>
        )}
      </ModalContent>
    </ModalOverlay>
  );
};

export default ShopTestingGuide;
