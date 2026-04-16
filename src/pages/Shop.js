import React, { useState, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { useShop } from '../contexts/ShopContext';
import { useTokens } from '../contexts/TokenContext';
import { useAuth } from '../contexts/AuthContext';
import { useInsurance } from '../contexts/InsuranceContext';
import { useNotification } from '../contexts/NotificationContext';
import { motion } from 'framer-motion';
import CrateOpeningModal from '../components/CrateOpeningModal';
import InsuranceIndicator from '../components/InsuranceIndicator';
import { useCosmetics } from '../contexts/CosmeticContext';
import VipPurchaseModal from '../components/VipPurchaseModal';
import BattlePassModal from '../components/BattlePassModal';
import { functions } from '../firebase/config';
import { httpsCallable } from 'firebase/functions';
import NinjaSVG from '../assets/icons/ninja-svgrepo-com.svg';

const ShopContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
  padding: 2rem 0;
`;

const ShopHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 0 2rem;
  
  h1 {
    font-size: 3rem;
    background: linear-gradient(90deg, #4facfe 0%, #ff61e6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-family: 'Inter', Arial, sans-serif;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-shadow: 0 4px 24px #4facfe88;
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    h1 { font-size: 2rem; }
  }
`;

const TokenDisplay = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.2rem;
  color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  .balance {
    font-weight: 700;
    color: #4facfe;
  }
  
  .token-icon {
    font-size: 1.4rem;
  }
`;

const CategoriesContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 0 2rem 0.5rem 2rem;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  position: relative;
  &::-webkit-scrollbar { display: none; }
  @media (max-width: 768px) {
    padding-bottom: 0.5rem;
    gap: 0.5rem;
  }
`;

const CategoryButton = styled.button`
  background: ${props => props.$active ? 'linear-gradient(90deg, #A259F7 0%, #00FFD0 100%)' : 'rgba(255, 255, 255, 0.13)'};
  color: ${props => props.$active ? '#18122B' : '#fff'};
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  box-shadow: ${props => props.$active ? '0 0 12px #A259F7, 0 0 8px #00FFD0' : 'none'};
  border: ${props => props.$active ? '2.5px solid #A259F7' : '2px solid transparent'};
  position: relative;
  &:hover {
    background: ${props => props.$active ? 'linear-gradient(90deg, #A259F7 0%, #00FFD0 100%)' : 'rgba(255, 255, 255, 0.18)'};
    transform: translateY(-2px) scale(1.04);
  }
`;

const SortFilterBar = styled.div`
  display: flex;
  gap: 1.2rem;
  align-items: center;
  margin: 0 2rem 2rem 2rem;
  flex-wrap: wrap;
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.7rem;
    margin: 0 1rem 1.2rem 1rem;
    align-items: stretch;
  }
`;

const SortSelect = styled.select`
  background: rgba(32,34,54,0.98);
  color: #fff;
  border: 2px solid #A259F7;
  border-radius: 8px;
  padding: 0.5rem 1.2rem;
  font-size: 1rem;
  font-weight: 600;
  outline: none;
  margin-right: 0.5rem;
`;

const ItemsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  padding: 0 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ItemCard = styled(motion.div)`
  background: rgba(36, 38, 56, 0.96);
  border-radius: 18px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1.5px solid rgba(79, 172, 254, 0.13);
  box-shadow: 0 8px 32px 0 #18122B99, 0 2px 8px #A259F744;
  transition: all 0.3s ease;
  position: relative;
  &:hover {
    box-shadow: 0 16px 40px 0 #A259F799, 0 0 32px #00FFD044;
    border-color: #A259F7;
    transform: translateY(-7px) scale(1.02);
  }
`;

const ItemHeader = styled.div`
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  h3 {
    font-size: 1.4rem;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    
    .item-icon {
      font-size: 1.8rem;
    }
  }
  
  .item-type {
    background: rgba(79, 172, 254, 0.2);
    padding: 0.3rem 0.8rem;
    border-radius: 50px;
    font-size: 0.8rem;
    color: #4facfe;
    font-weight: 600;
    text-transform: capitalize;
  }
`;

const ItemBody = styled.div`
  padding: 1.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const ItemDescription = styled.p`
  color: #b8c1ec;
  margin-bottom: 1.5rem;
  line-height: 1.5;
  flex: 1;
`;

const ItemPriceSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  
  .price-container {
    display: flex;
    flex-direction: column;
    
    .current-price {
      font-size: 1.4rem;
      font-weight: 700;
      color: #4facfe;
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }
    
    .original-price {
      font-size: 0.9rem;
      color: #b8c1ec;
      text-decoration: line-through;
      opacity: 0.7;
    }
  }
`;

const PurchaseButton = styled.button`
  background: ${props => props.ghost ? 'transparent' : 'linear-gradient(90deg, #7B6CF6 0%, #7DE2FC 100%)'};
  color: ${props => props.ghost ? '#7B6CF6' : '#fff'};
  border: ${props => props.ghost ? '2px solid #7B6CF6' : 'none'};
  padding: 0.8rem 1.2rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: ${props => props.ghost ? 'none' : '0 2px 8px #7B6CF644'};
  &:hover {
    transform: translateY(-2px) scale(1.03);
    box-shadow: 0 4px 12px #7B6CF6;
    background: ${props => props.ghost ? 'rgba(123, 108, 246, 0.08)' : 'linear-gradient(90deg, #7DE2FC 0%, #7B6CF6 100%)'};
    color: #fff;
  }
  &:disabled {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.5);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
    border: none;
  }
`;

const BenefitsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 1.5rem;
  
  li {
    padding: 0.5rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #b8c1ec;
    
    &::before {
      content: '';
      color: #4facfe;
    }
  }
`;

const BundleContents = styled.div`
  margin-top: 1rem;
  
  .bundle-title {
    font-size: 0.9rem;
    color: #b8c1ec;
    margin-bottom: 0.5rem;
  }
  
  .contents {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    
    .content-item {
      background: rgba(79, 172, 254, 0.1);
      padding: 0.3rem 0.6rem;
      border-radius: 4px;
      font-size: 0.8rem;
      color: #4facfe;
      display: flex;
      align-items: center;
      gap: 0.3rem;
      border: 1px solid rgba(79, 172, 254, 0.2);
    }
  }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const LoadingOverlay = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  width: 100%;
  
  .spinner {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: 3px solid rgba(79, 172, 254, 0.2);
    border-top-color: #4facfe;
    animation: ${spin} 1s linear infinite;
  }
`;

const Divider = styled.div`
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 1.5rem 0;
`;

const NoItemsMessage = styled.div`
  grid-column: 1 / -1;
  text-align: center;
  padding: 4rem 2rem;
  
  h3 {
    font-size: 1.5rem;
    color: #4facfe;
    margin-bottom: 1rem;
  }
  
  p {
    color: #b8c1ec;
    max-width: 500px;
    margin: 0 auto;
  }
`;

const InventoryToggle = styled.button`
  background: ${props => props.$active ? 'linear-gradient(90deg, #ff61e6 0%, #4facfe 100%)' : 'rgba(255, 255, 255, 0.1)'};
  color: #fff;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background: ${props => props.$active ? 'linear-gradient(90deg, #ff61e6 0%, #4facfe 100%)' : 'rgba(255, 255, 255, 0.2)'};
    transform: translateY(-2px);
  }
  
  .inventory-icon {
    font-size: 1.2rem;
  }
`;

const BadgeOverlay = styled.div`
  position: absolute;
  top: 18px;
  left: 18px;
  background: linear-gradient(90deg, #A259F7 0%, #00FFD0 100%);
  color: #18122B;
  font-size: 1.05rem;
  font-weight: 900;
  padding: 0.35rem 1.2rem;
  border-radius: 1.2rem;
  box-shadow: 0 0 12px #A259F7, 0 0 8px #00FFD0;
  letter-spacing: 0.04em;
  z-index: 2;
  margin-bottom: 0.5rem;
  display: inline-block;
`;

const MostPopularBadge = styled.div`
  position: absolute;
  top: 18px;
  right: 18px;
  background: linear-gradient(90deg, #FFD700 0%, #FF61E6 100%);
  color: #18122B;
  font-size: 1.05rem;
  font-weight: 900;
  padding: 0.35rem 1.2rem;
  border-radius: 1.2rem;
  box-shadow: 0 0 12px #FFD700, 0 0 8px #FF61E6;
  letter-spacing: 0.04em;
  z-index: 2;
  margin-bottom: 0.5rem;
  display: inline-block;
`;

const Shop = () => {
  const { 
    shopData, 
    purchaseItem, 
    userInventory, 
    loading, 
    hasVipSubscription,
    useItem: consumeItem
  } = useShop();
  const { balance, refreshBalance } = useTokens();
  const { currentUser } = useAuth();
  const notification = useNotification();
  const { 
    isActive: insuranceIsActive,
    isOnCooldown: insuranceIsOnCooldown,
    cooldownRemaining: insuranceCooldownRemaining,
    formatCooldownTime,
    deactivateInsurance,
    canUseInsurance,
    getCooldownRemaining,
    applyInsuranceToWager
  } = useInsurance();
  const { awardCosmetic, userCosmetics, refreshUserCosmetics } = useCosmetics();
  
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showInventory, setShowInventory] = useState(false);
  const [purchasing, setPurchasing] = useState(null);
  const [using, setUsing] = useState(null);

  // Crate opening modal state
  const [crateModalOpen, setCrateModalOpen] = useState(false);
  const [crateReward, setCrateReward] = useState(null);
  const [crateOpening, setCrateOpening] = useState(false);
  const [currentCrateItem, setCurrentCrateItem] = useState(null);
  
  const crateOpenInProgress = useRef(false);
  
  // VIP purchase modal state
  const [vipModalOpen, setVipModalOpen] = useState(false);
  const [vipModalError, setVipModalError] = useState(null);
  const [vipPurchasing, setVipPurchasing] = useState(false);
  
  // Battle Pass modal state
  const [battlePassModalOpen, setBattlePassModalOpen] = useState(false);
  const [battlePassPurchasing, setBattlePassPurchasing] = useState(false);
  const [battlePassError, setBattlePassError] = useState(null);
  
  const [sortOption, setSortOption] = useState('default');
  
  // Filter items based on selected category
  const getFilteredItems = () => {
    if (showInventory) {
      return userInventory;
    }
    if (selectedCategory === 'All') {
      return shopData.shop.categories
        .filter(category => category.name !== 'Battle Pass')
        .flatMap(category => category.items);
    }
    if (selectedCategory === 'Battle Pass') {
      return [];
    }
    const category = shopData.shop.categories.find(cat => cat.name === selectedCategory);
    return category ? category.items : [];
  };
  
  // Sorting logic
  const getSortedItems = (items) => {
    if (sortOption === 'price_low_high') {
      return [...items].sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortOption === 'price_high_low') {
      return [...items].sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortOption === 'rarity') {
      const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'special'];
      return [...items].sort((a, b) => rarityOrder.indexOf((a.rarity || '').toLowerCase()) - rarityOrder.indexOf((b.rarity || '').toLowerCase()));
    }
    return items;
  };
  
  // Handle purchase button click
  const handlePurchase = async (itemId) => {
    if (!currentUser) {
      notification.addNotification("You must be logged in to make purchases", "error");
      return;
    }
    setPurchasing(itemId);
    try {
      const result = await purchaseItem(itemId);
      const item = shopData.shop.categories.flatMap(cat => cat.items).find(i => i.id === itemId);
      if (result.success && item && item.type === 'cosmetic') {
        // Award the cosmetic after purchase
        const awardResult = await awardCosmetic(item.id, 'shop');
        await refreshUserCosmetics();
        if (awardResult.success) {
          notification.addNotification(`Unlocked: ${item.title}!`, 'success');
        } else if (awardResult.error === 'Already owned') {
          notification.addNotification(`Already owned: ${item.title}`, 'info');
        } else {
          notification.addNotification(awardResult.error || 'Failed to unlock cosmetic', 'error');
        }
      }
      // Success message for non-cosmetics handled inside purchaseItem
    } catch (error) {
      notification.addNotification("Failed to complete purchase", "error");
    } finally {
      setPurchasing(null);
    }
  };
  
  // Calculate token price from dollar price
  const getTokenPrice = (dollarPrice) => {
    return Math.round(dollarPrice * 100);
  };
  
  // Format currency display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  // Add handleUseItem function
  const handleUseItem = async (item) => {
    if (!currentUser) {
      notification.addNotification("You must be logged in to use items", "error");
      return;
    }
    
    setUsing(item.id);
    
    try {
      const result = await consumeItem(item.id);
      
      if (result.success) {
        notification.addNotification(`Successfully used ${item.title}`, "success");
      } else {
        notification.addNotification(result.error || "Failed to use item", "error");
      }
    } catch (error) {
      notification.addNotification("An error occurred while using the item", "error");
    } finally {
      setUsing(null);
    }
  };
  
  // Handler to open crate
  const handleOpenCrate = async () => {
    if (crateOpenInProgress.current || !currentCrateItem) {
      return null;
    }
    
    console.log('Starting crate opening process for:', currentCrateItem);
    crateOpenInProgress.current = true;
    setCrateOpening(true);
    
    try {
      // Use the specific crate item by its unique identifier (purchasedAt + id)
      const uniqueItemId = `${currentCrateItem.id}-${currentCrateItem.purchasedAt}`;
      const result = await consumeItem(uniqueItemId);
      
      if (result.success) {
        // Award cosmetic if needed
        if (result.cosmeticToAward) {
          const awardResult = await awardCosmetic(result.cosmeticToAward, 'crate');
          if (awardResult.success) {
            notification.addNotification(`Unlocked: ${result.reward.title}!`, 'success');
          } else if (awardResult.error === 'Already owned') {
            notification.addNotification(`Already owned: ${result.reward.title}`, 'info');
          } else {
            notification.addNotification(awardResult.error || 'Failed to unlock cosmetic', 'error');
          }
        } else {
          notification.addNotification(`You received: ${result.reward.title}!`, 'success');
        }
        setCrateReward(result.reward);
        return result.reward;
      } else {
        notification.addNotification(result.error || 'Failed to open crate', 'error');
        return null;
      }
    } finally {
      setCrateOpening(false);
      crateOpenInProgress.current = false;
    }
  };
  
  // Handler to close crate modal
  const handleCloseCrateModal = () => {
    setCrateModalOpen(false);
    setCrateReward(null);
    setCurrentCrateItem(null);
    crateOpenInProgress.current = false;
  };
  
  // Helper: map item id to display name/icon
  const getItemDisplay = (item) => {
    switch (item.id) {
      case 'vip_subscription':
        return { title: 'VIP Subscription', icon: '', type: 'VIP' };
      case 'wager_insurance':
        return { title: 'Wager Insurance', icon: '', type: 'Utility' };
      case 'match_snipe_token':
        return { title: 'Match Snipe Token', icon: '', type: 'Utility' };
      default:
        return { title: item.title || item.id, icon: item.icon || '', type: item.type || 'Item' };
    }
  };
  
  // Helper to check if a cosmetic is owned
  const isCosmeticOwned = (cosmeticId) => userCosmetics?.owned?.includes(cosmeticId);
  
  if (loading) {
    return (
      <ShopContainer>
        <ShopHeader>
          <h1>ITEM SHOP</h1>
        </ShopHeader>
        <LoadingOverlay>
          <div className="spinner"></div>
        </LoadingOverlay>
      </ShopContainer>
    );
  }
  
  const filteredItems = getFilteredItems();
  const sortedItems = getSortedItems(filteredItems);
  
  return (
    <>
      <ShopContainer>
        <ShopHeader>
          <h1>ITEM SHOP</h1>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <InsuranceIndicator compact={true} />
            <TokenDisplay>
              <span className="token-icon"></span>
              <span>Balance: <span className="balance">{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</span></span>
            </TokenDisplay>
            <InventoryToggle 
              $active={showInventory}
              onClick={() => setShowInventory(!showInventory)}
            >
              <span className="inventory-icon">{showInventory ? '' : ''}</span>
              {showInventory ? 'Back to Shop' : 'My Inventory'}
            </InventoryToggle>
          </div>
        </ShopHeader>
        
        {!showInventory && (
          <CategoriesContainer>
            <CategoryButton 
              $active={selectedCategory === 'All'}
              onClick={() => setSelectedCategory('All')}
            >
              All Items
            </CategoryButton>
            {shopData.shop.categories
              .filter(category => category.name !== 'Battle Pass')
              .map(category => (
                <CategoryButton 
                  key={category.name}
                  $active={selectedCategory === category.name}
                  onClick={() => setSelectedCategory(category.name)}
                >
                  {category.name}
                </CategoryButton>
              ))}
          </CategoriesContainer>
        )}
        
        {!showInventory && (
          <SortFilterBar>
            <label htmlFor="sort-select" style={{ color: '#b8c1ec', fontWeight: 600 }}>Sort by:</label>
            <SortSelect id="sort-select" value={sortOption} onChange={e => setSortOption(e.target.value)}>
              <option value="default">Default</option>
              <option value="price_low_high">Price: Low → High</option>
              <option value="price_high_low">Price: High → Low</option>
              <option value="rarity">Rarity (Common → Rare)</option>
            </SortSelect>
          </SortFilterBar>
        )}
        
        <ItemsGrid>
          {sortedItems.length === 0 ? (
            <NoItemsMessage>
              <h3>{showInventory ? 'Your inventory is empty' : 'No items found'}</h3>
              <p>
                {showInventory 
                  ? 'Purchase items from the shop to start building your inventory.' 
                  : 'Try selecting a different category or check back later for new items.'}
              </p>
            </NoItemsMessage>
          ) : (
            sortedItems.map(item => {
              if (showInventory) {
                // Parse Firestore Timestamp or string
                const parseDate = (d) => {
                  if (!d) return null;
                  if (typeof d.toDate === 'function') return d.toDate();
                  const dt = new Date(d);
                  return isNaN(dt) ? null : dt;
                };
                const now = new Date();
                const expiresAt = parseDate(item.expiresAt);
                const grantedAt = parseDate(item.grantedAt);
                const purchasedAt = parseDate(item.purchasedAt);
                const isExpired = expiresAt && expiresAt < now;
                const usesRemaining = item.usesRemaining || item.count || 0;
                const { title, icon, type } = getItemDisplay(item);
                // VIP badge logic
                const isVip = item.id === 'vip_subscription' && item.isActive && expiresAt && expiresAt > now;
                return (
                  <ItemCard 
                    key={`${item.id}-${grantedAt || purchasedAt || Math.random()}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ opacity: isExpired ? 0.6 : 1 }}
                  >
                    <ItemHeader>
                      <h3>
                        <span className="item-icon">{item.icon === 'coin_svg' ? (
                          <img src="/assets/token-logo.png" alt="Coin" style={{ width: 24, height: 24, verticalAlign: 'middle' }} onError={e => { e.target.onerror = null; e.target.style.display = 'none'; e.target.parentNode.append(''); }} />
                        ) : item.icon === 'ninja_svg' ? (
                          <img src={NinjaSVG} alt="Shadow Operative" style={{ width: 32, height: 32, verticalAlign: 'middle' }} onError={e => { e.target.onerror = null; e.target.style.display = 'none'; e.target.parentNode.append(''); }} />
                        ) : (
                          item.icon
                        )}</span>
                        {title}
                        {isVip && <span style={{ marginLeft: 8, color: '#ffd700', fontWeight: 700, fontSize: 18 }} title="Active VIP"><span role="img" aria-label="VIP"></span> VIP</span>}
                      </h3>
                      <span className="item-type">{type}</span>
                    </ItemHeader>
                    <ItemBody>
                      <ItemDescription>
                        {isExpired ? (
                          <span style={{ color: '#ff4757' }}>EXPIRED</span>
                        ) : (
                          <>
                            {usesRemaining > 0 && (
                              <div style={{ marginBottom: '0.5rem' }}>
                                Uses remaining: <strong>{usesRemaining}</strong>
                              </div>
                            )}
                            {expiresAt && (
                              <div>
                                Expires: <strong>{expiresAt.toLocaleDateString()}</strong>
                              </div>
                            )}
                            {grantedAt && (
                              <div>
                                Purchased on <strong>{grantedAt.toLocaleDateString()}</strong>
                              </div>
                            )}
                          </>
                        )}
                      </ItemDescription>
                      <ItemPriceSection>
                        <div className="price-container">
                          <span>Purchased on {new Date(item.purchasedAt).toLocaleDateString()}</span>
                        </div>
                        {!isExpired && usesRemaining > 0 && (
                          (item.id === 'common_crate' || item.id === 'rare_crate') ? (
                            <PurchaseButton
                              onClick={() => {
                                setCurrentCrateItem(item);
                                setCrateModalOpen(true);
                                setCrateReward(null);
                              }}
                              disabled={crateOpening || crateOpenInProgress.current}
                            >
                              {crateOpening ? 'Opening...' : 'Open'}
                            </PurchaseButton>
                          ) : item.id === 'wager_insurance' ? (
                            <div>
                              {/* Show cooldown status if on cooldown */}
                              {insuranceIsOnCooldown && (
                                <div style={{ 
                                  color: '#ff6b6b', 
                                  fontSize: '0.9rem', 
                                  marginBottom: '0.5rem',
                                  textAlign: 'center',
                                  fontWeight: 'bold'
                                }}>
                                   Cooldown: {formatCooldownTime(insuranceCooldownRemaining)}
                                </div>
                              )}
                              {/* Show if insurance is already active */}
                              {insuranceIsActive && (
                                <div style={{ 
                                  color: '#51cf66', 
                                  fontSize: '0.9rem', 
                                  marginBottom: '0.5rem',
                                  textAlign: 'center',
                                  fontWeight: 'bold'
                                }}>
                                   Insurance Already Active
                                </div>
                              )}
                              <PurchaseButton 
                                onClick={() => handleUseItem(item)}
                                disabled={
                                  using === item.id || 
                                  insuranceIsOnCooldown || 
                                  insuranceIsActive
                                }
                                style={{ 
                                  background: insuranceIsOnCooldown || insuranceIsActive 
                                    ? 'linear-gradient(135deg, #666, #555)' 
                                    : 'linear-gradient(135deg, #4CAF50, #45a049)',
                                  border: insuranceIsOnCooldown || insuranceIsActive 
                                    ? '2px solid #666' 
                                    : '2px solid #4CAF50',
                                  cursor: insuranceIsOnCooldown || insuranceIsActive 
                                    ? 'not-allowed' 
                                    : 'pointer'
                                }}
                              >
                                {using === item.id 
                                  ? 'Activating...' 
                                  : insuranceIsActive 
                                    ? ' Already Active'
                                    : insuranceIsOnCooldown 
                                      ? ' On Cooldown'
                                      : ' Activate Insurance'
                                }
                              </PurchaseButton>
                            </div>
                          ) : (
                            <PurchaseButton 
                              onClick={() => handleUseItem(item)}
                              disabled={using === item.id}
                            >
                              {using === item.id ? 'Using...' : 'Use Item'}
                            </PurchaseButton>
                          )
                        )}
                      </ItemPriceSection>
                    </ItemBody>
                  </ItemCard>
                );
              }
              
              // For shop items
              const tokenPrice = item.price;
              const originalTokenPrice = item.originalPrice || null;
              const discount = originalTokenPrice ? Math.round((1 - (tokenPrice / originalTokenPrice)) * 100) : 0;
              const canAfford = balance >= tokenPrice;
              
              // VIP subscription special handling
              if (item.id === 'vip_subscription') {
                return (
                  <ItemCard 
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ItemHeader>
                      <h3>
                        <span className="item-icon">{item.icon === 'coin_svg' ? (
                          <img src="/assets/token-logo.png" alt="Coin" style={{ width: 24, height: 24, verticalAlign: 'middle' }} />
                        ) : (
                          item.icon
                        )}</span>
                        {item.title}
                      </h3>
                      <span className="item-type">{item.type}</span>
                    </ItemHeader>
                    <ItemBody>
                      <ItemDescription>{item.description}</ItemDescription>
                      {item.benefits && (
                        <BenefitsList>
                          {item.benefits.map((benefit, index) => (
                            <li key={index}>{benefit}</li>
                          ))}
                        </BenefitsList>
                      )}
                      {item.duration && (
                        <div style={{ marginBottom: '1rem', color: '#b8c1ec' }}>
                          Duration: <strong>{item.duration}</strong>
                        </div>
                      )}
                      <ItemPriceSection>
                        <div className="price-container">
                          <span className="current-price">
                            from 3.49 <span style={{ fontSize: '0.9rem' }}>Tokens</span>
                          </span>
                        </div>
                        {item.type === 'cosmetic' && isCosmeticOwned(item.id) ? (
                          <PurchaseButton disabled>Owned</PurchaseButton>
                        ) : (
                          <PurchaseButton 
                            onClick={() => { setVipModalOpen(true); setVipModalError(null); }}
                            disabled={vipPurchasing}
                          >
                            Select
                          </PurchaseButton>
                        )}
                      </ItemPriceSection>
                    </ItemBody>
                  </ItemCard>
                );
              }
              
              // Battle Pass special handling
              if (item.id === 'battlepass') {
                return (
                  <ItemCard
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ItemHeader>
                      <h3>
                        <span className="item-icon">{item.icon === 'coin_svg' ? (
                          <img src="/assets/token-logo.png" alt="Coin" style={{ width: 24, height: 24, verticalAlign: 'middle' }} />
                        ) : (
                          item.icon
                        )}</span>
                        {item.title}
                      </h3>
                      <span className="item-type">{item.type}</span>
                    </ItemHeader>
                    <ItemBody>
                      <ItemDescription>{item.description}</ItemDescription>
                      <ItemPriceSection>
                        <div className="price-container">
                          <span className="current-price">
                            {tokenPrice.toFixed(2)} <span style={{ fontSize: '0.9rem' }}>Tokens</span>
                          </span>
                        </div>
                        <PurchaseButton
                          onClick={() => { setBattlePassModalOpen(true); setBattlePassError(null); }}
                          disabled={battlePassPurchasing}
                        >
                          View Pass
                        </PurchaseButton>
                      </ItemPriceSection>
                    </ItemBody>
                  </ItemCard>
                );
              }
              
              return (
                <ItemCard 
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ItemHeader>
                    <h3>
                      <span className="item-icon">{item.icon === 'coin_svg' ? (
                        <img src="/assets/token-logo.png" alt="Coin" style={{ width: 24, height: 24, verticalAlign: 'middle' }} />
                      ) : item.icon === 'ninja_svg' ? (
                        <img src={NinjaSVG} alt="Shadow Operative" style={{ width: 32, height: 32, verticalAlign: 'middle' }} />
                      ) : (
                        item.icon
                      )}</span>
                      {item.title}
                    </h3>
                    <span className="item-type">{item.type}</span>
                  </ItemHeader>
                  <ItemBody>
                    <ItemDescription>{item.description}</ItemDescription>
                    
                    {/* Show benefits for subscription items */}
                    {item.benefits && (
                      <>
                        <BenefitsList>
                          {item.benefits.map((benefit, index) => (
                            <li key={index}>{benefit}</li>
                          ))}
                        </BenefitsList>
                      </>
                    )}
                    
                    {/* Show duration for time-based items */}
                    {item.duration && (
                      <div style={{ marginBottom: '1rem', color: '#b8c1ec' }}>
                        Duration: <strong>{item.duration}</strong>
                      </div>
                    )}
                    
                    {/* Show matches for match-limited items */}
                    {item.matches && (
                      <div style={{ marginBottom: '1rem', color: '#b8c1ec' }}>
                        Valid for: <strong>{item.matches} matches</strong>
                      </div>
                    )}
                    
                    {/* Show contents for bundle items */}
                    {item.type === 'bundle' && item.contents && (
                      <BundleContents>
                        <div className="bundle-title">Bundle includes:</div>
                        <div className="contents">
                          {item.contents.map((contentId, index) => {
                            const contentItem = shopData.shop.categories
                              .flatMap(cat => cat.items)
                              .find(item => item.id === contentId);
                              
                            return contentItem ? (
                              <div key={index} className="content-item">
                                <span>{contentItem.icon === 'coin_svg' ? (
                                  <img src="/assets/token-logo.png" alt="Coin" style={{ width: 24, height: 24, verticalAlign: 'middle' }} />
                                ) : (
                                  contentItem.icon
                                )}</span>
                                <span>{contentItem.title}</span>
                              </div>
                            ) : null;
                          })}
                        </div>
                      </BundleContents>
                    )}
                    
                    <ItemPriceSection>
                      <div className="price-container">
                        <span className="current-price">
                          {tokenPrice.toFixed(2)} <span style={{ fontSize: '0.9rem' }}>Tokens</span>
                        </span>
                        {originalTokenPrice && (
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <span className="original-price">{originalTokenPrice.toFixed(2)}</span>
                            <span style={{ color: '#4facfe', fontSize: '0.8rem' }}>Save {discount}%</span>
                          </div>
                        )}
                      </div>
                      {item.type === 'cosmetic' && isCosmeticOwned(item.id) ? (
                        <PurchaseButton disabled>Owned</PurchaseButton>
                      ) : (
                        <PurchaseButton 
                          onClick={() => handlePurchase(item.id)}
                          disabled={!canAfford || purchasing === item.id}
                        >
                          {purchasing === item.id ? 'Purchasing...' : canAfford ? 'Purchase' : 'Not Enough Tokens'}
                        </PurchaseButton>
                      )}
                    </ItemPriceSection>
                  </ItemBody>
                </ItemCard>
              );
            })
          )}
        </ItemsGrid>
      </ShopContainer>
      <VipPurchaseModal
        isOpen={vipModalOpen}
        onClose={() => { setVipModalOpen(false); setVipModalError(null); }}
        onPurchase={async (plan) => {
          setVipPurchasing(true);
          setVipModalError(null);
          try {
            // Call backend VIP purchase with selected plan
            const result = await purchaseItem('vip_subscription', plan);
            if (result.success) {
              setVipModalOpen(false);
            } else {
              setVipModalError(result.error || 'VIP purchase failed');
            }
          } catch (err) {
            setVipModalError(err.message || 'VIP purchase failed');
          } finally {
            setVipPurchasing(false);
          }
        }}
        loading={vipPurchasing}
        error={vipModalError}
      />
      <CrateOpeningModal
        isOpen={crateModalOpen}
        onClose={handleCloseCrateModal}
        onOpenCrate={handleOpenCrate}
        reward={crateReward}
        crateType={currentCrateItem?.id === 'rare_crate' ? 'rare' : 'common'}
      />
      <BattlePassModal
        isOpen={battlePassModalOpen}
        onClose={() => { setBattlePassModalOpen(false); setBattlePassError(null); }}
        onPurchase={async () => {
          setBattlePassPurchasing(true);
          setBattlePassError(null);
          try {
            // Call backend Battle Pass purchase
            const purchaseBattlePass = httpsCallable(functions, 'purchaseBattlePass');
            const result = await purchaseBattlePass();
            
            if (result?.data?.success) {
              // Refresh token balance after successful purchase
              if (refreshBalance) {
                await refreshBalance();
              }
              setBattlePassModalOpen(false);
              notification.addNotification('Battle Pass purchased successfully!', 'success');
            } else {
              setBattlePassError(result?.data?.message || 'Battle Pass purchase failed');
            }
          } catch (err) {
            setBattlePassError(err.message || 'Battle Pass purchase failed');
          } finally {
            setBattlePassPurchasing(false);
          }
        }}
        loading={battlePassPurchasing}
        error={battlePassError}
      />
    </>
  );
};

export default Shop;
