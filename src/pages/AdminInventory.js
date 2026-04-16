import React, { useState } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import shopData, { getAllItems } from '../data/shopData';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
  padding: 2rem;
`;

const Header = styled.h1`
  font-size: 2.5rem;
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 2rem;
`;

const SearchBar = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Input = styled.input`
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: #fff;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #4facfe;
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const Button = styled.button`
  background: ${props => props.$primary ? 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)' : 'rgba(255, 255, 255, 0.05)'};
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(79, 172, 254, 0.2);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const Section = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  color: #4facfe;
  margin-bottom: 1.5rem;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const ItemCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-3px);
    border-color: rgba(79, 172, 254, 0.5);
  }
`;

const ItemHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  
  .icon {
    font-size: 2rem;
  }
  
  .title {
    font-size: 1.2rem;
    font-weight: 600;
  }
`;

const ItemDetails = styled.div`
  color: #b8c1ec;
  font-size: 0.9rem;
  
  > div {
    margin-bottom: 0.5rem;
  }
  
  .label {
    color: rgba(255, 255, 255, 0.6);
    margin-right: 0.5rem;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(79, 172, 254, 0.1);
    border-top-color: #4facfe;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const AdminInventory = () => {
  const { currentUser } = useAuth();
  const notification = useNotification();
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [userInventory, setUserInventory] = useState(null);
  const [loading, setLoading] = useState(false);
  const allItems = getAllItems();

  // Fetch user's inventory
  const fetchUserInventory = async () => {
    if (!userId) {
      notification.addNotification('Please enter a user ID', 'error');
      return;
    }

    setLoading(true);
    try {
      // First verify the user exists
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        notification.addNotification('User not found', 'error');
        setUserInventory(null);
        return;
      }

      const inventoryDoc = await getDoc(doc(db, 'userInventory', userId));
      if (inventoryDoc.exists()) {
        setUserInventory(inventoryDoc.data().items || []);
      } else {
        setUserInventory([]);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      notification.addNotification('Error fetching inventory', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Add item to user's inventory
  const addItemToInventory = async (item) => {
    if (!userId || !userInventory) {
      notification.addNotification('Please fetch a user inventory first', 'error');
      return;
    }

    try {
      const inventoryItem = {
        id: item.id,
        title: item.title,
        type: item.type,
        icon: item.icon,
        purchasedAt: new Date().toISOString(),
        usesRemaining: item.limitPerDay || item.limit || item.matches || 1
      };

      if (item.duration) {
        const now = new Date();
        const duration = parseInt(item.duration);
        const unit = item.duration.slice(-1);
        let expiryDate = new Date(now);

        switch (unit) {
          case 'd':
            expiryDate.setDate(now.getDate() + duration);
            break;
          case 'h':
            expiryDate.setHours(now.getHours() + duration);
            break;
          case 'm':
            expiryDate.setMinutes(now.getMinutes() + duration);
            break;
          default:
            expiryDate.setDate(now.getDate() + 1); // Default to 1 day
        }
        inventoryItem.expiresAt = expiryDate.toISOString();
      }

      const inventoryRef = doc(db, 'userInventory', userId);
      await updateDoc(inventoryRef, {
        items: arrayUnion(inventoryItem),
        updatedAt: serverTimestamp()
      });

      notification.addNotification(`Added ${item.title} to inventory`, 'success');
      fetchUserInventory(); // Refresh the inventory display
    } catch (error) {
      console.error('Error adding item:', error);
      notification.addNotification('Error adding item to inventory', 'error');
    }
  };

  // Remove item from user's inventory
  const removeItemFromInventory = async (item) => {
    if (!userId || !userInventory) {
      notification.addNotification('Please fetch a user inventory first', 'error');
      return;
    }

    try {
      const inventoryRef = doc(db, 'userInventory', userId);
      await updateDoc(inventoryRef, {
        items: arrayRemove(item),
        updatedAt: serverTimestamp()
      });

      notification.addNotification(`Removed ${item.title} from inventory`, 'success');
      fetchUserInventory(); // Refresh the inventory display
    } catch (error) {
      console.error('Error removing item:', error);
      notification.addNotification('Error removing item from inventory', 'error');
    }
  };

  return (
    <Container>
      <Header>Admin Inventory Management</Header>
      
      <SearchBar>
        <Input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter User ID"
        />
        <Button 
          $primary
          onClick={fetchUserInventory}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Fetch Inventory'}
        </Button>
      </SearchBar>

      {loading ? (
        <LoadingSpinner>
          <div className="spinner" />
        </LoadingSpinner>
      ) : (
        <>
          {userInventory && (
            <Section>
              <SectionTitle>Current Inventory</SectionTitle>
              {userInventory.length === 0 ? (
                <p>User has no items in their inventory.</p>
              ) : (
                <Grid>
                  {userInventory.map((item, index) => {
                    const now = new Date();
                    const isExpired = item.expiresAt && new Date(item.expiresAt) < now;
                    
                    return (
                      <ItemCard key={`${item.id}-${index}`}>
                        <ItemHeader>
                          <span className="icon">{item.icon}</span>
                          <span className="title">{item.title}</span>
                        </ItemHeader>
                        <ItemDetails>
                          <div>
                            <span className="label">Type:</span>
                            {item.type}
                          </div>
                          {item.usesRemaining !== undefined && (
                            <div>
                              <span className="label">Uses Remaining:</span>
                              {item.usesRemaining}
                            </div>
                          )}
                          {item.expiresAt && (
                            <div>
                              <span className="label">Expires:</span>
                              {new Date(item.expiresAt).toLocaleString()}
                            </div>
                          )}
                          {isExpired && (
                            <div style={{ color: '#ff6b6b', marginTop: '0.5rem' }}>
                              EXPIRED
                            </div>
                          )}
                        </ItemDetails>
                        <Button
                          onClick={() => removeItemFromInventory(item)}
                          style={{ marginTop: '1rem', width: '100%' }}
                        >
                          Remove Item
                        </Button>
                      </ItemCard>
                    );
                  })}
                </Grid>
              )}
            </Section>
          )}

          {userInventory !== null && (
            <Section>
              <SectionTitle>Available Items</SectionTitle>
              <Grid>
                {allItems.map((item) => (
                  <ItemCard key={item.id}>
                    <ItemHeader>
                      <span className="icon">{item.icon}</span>
                      <span className="title">{item.title}</span>
                    </ItemHeader>
                    <ItemDetails>
                      <div>
                        <span className="label">Type:</span>
                        {item.type}
                      </div>
                      {item.duration && (
                        <div>
                          <span className="label">Duration:</span>
                          {item.duration}
                        </div>
                      )}
                      {item.limitPerDay && (
                        <div>
                          <span className="label">Daily Limit:</span>
                          {item.limitPerDay}
                        </div>
                      )}
                      {item.limit && (
                        <div>
                          <span className="label">Uses:</span>
                          {item.limit}
                        </div>
                      )}
                      {item.matches && (
                        <div>
                          <span className="label">Matches:</span>
                          {item.matches}
                        </div>
                      )}
                    </ItemDetails>
                    <Button
                      $primary
                      onClick={() => addItemToInventory(item)}
                      style={{ marginTop: '1rem', width: '100%' }}
                    >
                      Add to Inventory
                    </Button>
                  </ItemCard>
                ))}
              </Grid>
            </Section>
          )}
        </>
      )}
    </Container>
  );
};

export default AdminInventory; 