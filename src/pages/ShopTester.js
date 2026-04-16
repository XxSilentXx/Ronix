import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useShop } from '../contexts/ShopContext';
import { useTokens } from '../contexts/TokenContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import shopData, { findItemById } from '../data/shopData';
import ShopTestingGuide from '../components/ShopTestingGuide';

const TestContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
  padding: 2rem;
`;

const Header = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 2rem;
  background: linear-gradient(90deg, #4facfe 0%, #ff61e6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const TokenDisplay = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
  
  .token-count {
    font-weight: bold;
    color: #4facfe;
  }
`;

const Section = styled.div`
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(79, 172, 254, 0.2);
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #4facfe;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
`;

const Card = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(79, 172, 254, 0.1);
  
  &:hover {
    border-color: rgba(79, 172, 254, 0.3);
    background: rgba(255, 255, 255, 0.08);
  }
`;

const ItemTitle = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  .icon {
    font-size: 1.5rem;
  }
`;

const Button = styled.button`
  background: ${props => props.$secondary 
    ? 'rgba(255, 255, 255, 0.1)' 
    : 'linear-gradient(90deg, #4facfe 0%, #ff61e6 100%)'};
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  color: white;
  font-weight: bold;
  cursor: pointer;
  margin-top: ${props => props.$marginTop ? '1rem' : '0'};
  
  &:hover {
    opacity: 0.9;
    transform: translateY(-2px);
  }
  
  &:disabled {
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.3);
    cursor: not-allowed;
    transform: none;
  }
`;

const TestResult = styled.div`
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 6px;
  background: ${props => props.$success ? 'rgba(46, 204, 113, 0.1)' : props.$error ? 'rgba(231, 76, 60, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid ${props => props.$success ? 'rgba(46, 204, 113, 0.3)' : props.$error ? 'rgba(231, 76, 60, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.$success ? '#2ecc71' : props.$error ? '#e74c3c' : '#ecf0f1'};
  
  pre {
    margin-top: 0.5rem;
    white-space: pre-wrap;
    font-family: monospace;
    font-size: 0.85rem;
  }
`;

const TestStatusList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  
  li {
    padding: 0.5rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    justify-content: space-between;
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  .status {
    font-weight: bold;
    
    &.success {
      color: #2ecc71;
    }
    
    &.error {
      color: #e74c3c;
    }
    
    &.pending {
      color: #f39c12;
    }
  }
`;

const AddTokensForm = styled.div`
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
  
  input {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 0.5rem;
    border-radius: 6px;
    color: white;
    width: 100px;
  }
`;

// Helper function to classify shop items by type
const getItemsByType = () => {
  const allItems = shopData.shop.categories.flatMap(category => category.items);
  
  return {
    subscriptions: allItems.filter(item => item.type === 'subscription'),
    utilities: allItems.filter(item => item.type === 'utility'),
    boosts: allItems.filter(item => item.type === 'boost'),
    crates: allItems.filter(item => item.type === 'crate'),
    special: allItems.filter(item => item.type === 'special'),
    bundles: allItems.filter(item => item.type === 'bundle'),
    all: allItems
  };
};

const ShopTester = () => {
  const { currentUser } = useAuth();
  const { 
    purchaseItem, 
    userInventory, 
    useItem: consumeItem, // Renamed to avoid React hooks confusion
    hasActiveXpBoost, 
    hasVipSubscription,
    applyXpBoost,
    getRemainingSnipes,
    useSnipe 
  } = useShop();
  const { balance, addTokens } = useTokens();
  const notification = useNotification();
  
  const [testResults, setTestResults] = useState({});
  const [addTokensAmount, setAddTokensAmount] = useState(5000);
  const [processingPurchases, setProcessingPurchases] = useState([]);
  const [showInventory, setShowInventory] = useState(false);
  const [showTestingGuide, setShowTestingGuide] = useState(false);
  
  const itemsByType = getItemsByType();
  
  // Add test tokens to account
  const handleAddTestTokens = async () => {
    if (!currentUser) {
      notification.addNotification("You must be logged in", "error");
      return;
    }
    
    try {
      await addTokens(parseInt(addTokensAmount), "Shop test tokens");
      notification.addNotification(`${addTokensAmount} test tokens added to your account`, "success");
    } catch (error) {
      notification.addNotification("Failed to add test tokens", "error");
    }
  };
  
  // Purchase an item and record test result
  const handlePurchaseTest = async (item) => {
    if (!currentUser) {
      notification.addNotification("You must be logged in", "error");
      return;
    }
    
    setProcessingPurchases(prev => [...prev, item.id]);
    
    try {
      const result = await purchaseItem(item.id);
      
      setTestResults(prev => ({
        ...prev,
        [item.id]: {
          success: result.success,
          error: result.error,
          timestamp: new Date().toISOString(),
          message: result.success 
            ? `Successfully purchased ${item.title}` 
            : `Failed to purchase ${item.title}: ${result.error}`
        }
      }));
      
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [item.id]: {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
          message: `Error testing purchase of ${item.title}: ${error.message}`
        }
      }));
    } finally {
      setProcessingPurchases(prev => prev.filter(id => id !== item.id));
    }
  };
  
  // Use an inventory item and record test result
  const handleUseItem = async (inventoryItem) => {
    if (!currentUser) {
      notification.addNotification("You must be logged in", "error");
      return;
    }
    
    setProcessingPurchases(prev => [...prev, inventoryItem.id]);
    
    try {
      const result = await consumeItem(inventoryItem.id);
      
      setTestResults(prev => ({
        ...prev,
        [`use_${inventoryItem.id}_${Date.now()}`]: {
          success: result.success,
          error: result.error,
          timestamp: new Date().toISOString(),
          message: result.success 
            ? `Successfully used ${inventoryItem.title}` 
            : `Failed to use ${inventoryItem.title}: ${result.error}`
        }
      }));
      
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [`use_${inventoryItem.id}_${Date.now()}`]: {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
          message: `Error testing use of ${inventoryItem.title}: ${error.message}`
        }
      }));
    } finally {
      setProcessingPurchases(prev => prev.filter(id => id !== inventoryItem.id));
    }
  };
  
  // Test status checks
  const checkActiveBenefits = () => {
    const vipStatus = hasVipSubscription();
    const xpBoostActive = hasActiveXpBoost();
    const snipesRemaining = getRemainingSnipes();
    
    return {
      vipStatus,
      xpBoostActive,
      snipesRemaining
    };
  };
  
  // Clear all test results
  const clearTestResults = () => {
    setTestResults({});
  };
  
  // Get token price in dollars
  const getTokenPrice = (dollarPrice) => {
    return Math.round(dollarPrice * 100);
  };
  
  const benefits = checkActiveBenefits();
  
  return (
    <TestContainer>
      <Header>Shop System Tester</Header>
      
      <TokenDisplay>
        <span>Current Balance: </span>
        <span className="token-count">{balance} tokens</span>
      </TokenDisplay>
      
      {showTestingGuide && (
        <ShopTestingGuide onClose={() => setShowTestingGuide(false)} />
      )}
      
      <Section>
        <SectionTitle> Stat Reset Test</SectionTitle>
        <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
          <h4>Quick Stat Reset Test</h4>
          <p>Click below to test if the stat reset function is working:</p>
          
          {/* Debug info */}
          <div style={{ backgroundColor: '#000', color: '#fff', padding: '8px', borderRadius: '4px', marginBottom: '8px', fontFamily: 'monospace', fontSize: '12px' }}>
            <div>User logged in: {currentUser ? 'Yes' : 'No'}</div>
            <div>Inventory items: {userInventory.length}</div>
            <div>Has stat reset: {userInventory.some(item => item.id === 'stat_reset') ? 'Yes' : 'No'}</div>
          </div>
          
          <Button 
            onClick={async () => {
              try {
                const result = await consumeItem('stat_reset');
                setTestResults(prev => ({
                  ...prev,
                  [`manual_stat_reset_${Date.now()}`]: {
                    success: result.success,
                    error: result.error,
                    timestamp: new Date().toISOString(),
                    message: result.success 
                      ? "Manual stat reset test passed" 
                      : `Manual stat reset test failed: ${result.error}`
                  }
                }));
              } catch (error) {
                setTestResults(prev => ({
                  ...prev,
                  [`manual_stat_reset_error_${Date.now()}`]: {
                    success: false,
                    error: error.message,
                    timestamp: new Date().toISOString(),
                    message: `Manual stat reset test error: ${error.message}`
                  }
                }));
              }
            }}
            disabled={!currentUser}
            style={{ 
              opacity: currentUser ? 1 : 0.5,
              cursor: currentUser ? 'pointer' : 'not-allowed'
            }}
          >
             Test Stat Reset Function {!currentUser && '(Login Required)'}
          </Button>
          
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
            This will attempt to call the stat reset function directly. Check console for detailed logs.
          </div>
          
          {/* Test Results */}
          <div style={{ marginTop: '16px' }}>
            <h5>Recent Test Results:</h5>
            {Object.entries(testResults)
              .filter(([key]) => key.includes('manual_stat_reset'))
              .sort((a, b) => new Date(b[1].timestamp) - new Date(a[1].timestamp))
              .slice(0, 5)
              .map(([id, result]) => (
                <TestResult 
                  key={id}
                  $success={result.success} 
                  $error={!result.error}
                  style={{ marginTop: '8px' }}
                >
                  <div>{result.message}</div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>
                    {new Date(result.timestamp).toLocaleString()}
                  </div>
                </TestResult>
              ))}
          </div>
        </div>
      </Section>

      <Section>
        <SectionTitle>Test Tools</SectionTitle>
        <AddTokensForm>
          <input 
            type="number" 
            value={addTokensAmount} 
            onChange={(e) => setAddTokensAmount(e.target.value)} 
            min="1" 
            max="1000000" 
          />
          <Button onClick={handleAddTestTokens}>Add Test Tokens</Button>
        </AddTokensForm>
        
        <Button 
          $marginTop 
          $secondary 
          onClick={clearTestResults}
        >
          Clear Test Results
        </Button>
        
        <Button 
          $marginTop 
          $secondary 
          onClick={() => setShowInventory(!showInventory)}
        >
          {showInventory ? "Show Shop Items" : "Show Inventory"}
        </Button>
        
        <Button 
          $marginTop 
          $secondary 
          onClick={() => setShowTestingGuide(true)}
        >
          Show Testing Guide
        </Button>
      </Section>
      
      <Section>
        <SectionTitle>Active Benefits Status</SectionTitle>
        <TestStatusList>
          <li>
            <span>VIP Subscription:</span>
            <span className={`status ${benefits.vipStatus ? 'success' : 'error'}`}>
              {benefits.vipStatus ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </li>
          <li>
            <span>XP Boost:</span>
            <span className={`status ${benefits.xpBoostActive ? 'success' : 'error'}`}>
              {benefits.xpBoostActive ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </li>
          <li>
            <span>Snipes Remaining:</span>
            <span className={`status ${benefits.snipesRemaining > 0 ? 'success' : 'pending'}`}>
              {benefits.snipesRemaining}
            </span>
          </li>
        </TestStatusList>
      </Section>
      
      {showInventory ? (
        <Section>
          <SectionTitle>Your Inventory Items</SectionTitle>
          {userInventory.length === 0 ? (
            <p>Your inventory is empty. Purchase some items to test them.</p>
          ) : (
            <Grid>
              {userInventory.map((item, index) => {
                const now = new Date();
                const isExpired = item.expiresAt && new Date(item.expiresAt) < now;
                const usesRemaining = item.usesRemaining !== undefined ? item.usesRemaining : null;
                
                return (
                  <Card key={`${item.id}_${index}`}>
                    <ItemTitle>
                      <span className="icon">{item.icon}</span>
                      {item.title}
                    </ItemTitle>
                    <div>Type: {item.type}</div>
                    {isExpired && <div style={{ color: '#e74c3c' }}>EXPIRED</div>}
                    {usesRemaining !== null && (
                      <div>Uses remaining: {usesRemaining}</div>
                    )}
                    {item.expiresAt && !isExpired && (
                      <div>Expires: {new Date(item.expiresAt).toLocaleString()}</div>
                    )}
                    
                    {!isExpired && (usesRemaining === null || usesRemaining > 0) && (
                      <Button 
                        $marginTop
                        onClick={() => handleUseItem(item)}
                        disabled={processingPurchases.includes(item.id)}
                      >
                        {processingPurchases.includes(item.id) ? 'Processing...' : 'Use Item'}
                      </Button>
                    )}
                  </Card>
                );
              })}
            </Grid>
          )}
        </Section>
      ) : (
        <>
          {Object.entries(itemsByType).filter(([key]) => key !== 'all').map(([type, items]) => (
            <Section key={type}>
              <SectionTitle>{type.charAt(0).toUpperCase() + type.slice(1)}</SectionTitle>
              <Grid>
                {items.map(item => (
                  <Card key={item.id}>
                    <ItemTitle>
                      <span className="icon">{item.icon}</span>
                      {item.title}
                    </ItemTitle>
                    <div>Price: {getTokenPrice(item.price)} tokens</div>
                    {item.duration && <div>Duration: {item.duration}</div>}
                    {item.matches && <div>Matches: {item.matches}</div>}
                    {item.limitPerDay && <div>Daily Limit: {item.limitPerDay}</div>}
                    
                    <Button 
                      $marginTop
                      onClick={() => handlePurchaseTest(item)}
                      disabled={processingPurchases.includes(item.id) || balance < getTokenPrice(item.price)}
                    >
                      {processingPurchases.includes(item.id) ? 'Processing...' : 'Test Purchase'}
                    </Button>
                    
                    {testResults[item.id] && (
                      <TestResult 
                        $success={testResults[item.id].success} 
                        $error={!testResults[item.id].success}
                      >
                        {testResults[item.id].message}
                      </TestResult>
                    )}
                  </Card>
                ))}
              </Grid>
            </Section>
          ))}
        </>
      )}
      
      <Section>
        <SectionTitle>Test Results Log</SectionTitle>
        {Object.keys(testResults).length === 0 ? (
          <p>No test results yet. Try purchasing or using items.</p>
        ) : (
          <div style={{ maxHeight: '400px', overflow: 'auto' }}>
            {Object.entries(testResults)
              .sort((a, b) => new Date(b[1].timestamp) - new Date(a[1].timestamp))
              .map(([id, result]) => (
                <TestResult 
                  key={id}
                  $success={result.success} 
                  $error={!result.success}
                >
                  <div>{result.message}</div>
                  <div>Time: {new Date(result.timestamp).toLocaleString()}</div>
                </TestResult>
              ))}
          </div>
        )}
      </Section>
    </TestContainer>
  );
};

export default ShopTester;
