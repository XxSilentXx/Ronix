import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, setDoc, arrayUnion, serverTimestamp, addDoc, collection, getDocs } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import { useTokens } from './TokenContext';
import { useNotification } from '../contexts/NotificationContext';
import shopData, { findItemById, crateRewards, rareCrateRewards } from '../data/shopData';
import { awardXp } from '../firebase/xpSystem';
import { findCosmeticById } from '../data/cosmeticData';
import { purchaseVipSubscription } from '../firebase/vip';

// Create context
const ShopContext = createContext();

// Custom hook to use the shop context
export const useShop = () => {
  return useContext(ShopContext);
};

// Provider component
export const ShopProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const { balance, deductTokens, refreshBalance, addTokens } = useTokens();
  const notification = useNotification();
  
  const [userInventory, setUserInventory] = useState([]);
  const [activeBenefits, setActiveBenefits] = useState({
    vipSubscription: false,
    xpBoosts: [],
    snipesRemaining: 0,
    insurancePolicies: 0
  });
  const [loading, setLoading] = useState(true);
  
  // Initialize user inventory when user changes
  useEffect(() => {
    const fetchUserInventory = async () => {
      if (!currentUser) {
        setUserInventory([]);
        setActiveBenefits({
          vipSubscription: false,
          xpBoosts: [],
          snipesRemaining: 0,
          insurancePolicies: 0
        });
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Get user inventory from Firestore
        const inventoryRef = doc(db, 'userInventory', currentUser.uid);
        const inventoryDoc = await getDoc(inventoryRef);
        
        if (inventoryDoc.exists()) {
          const inventoryData = inventoryDoc.data();
          setUserInventory(inventoryData.items || []);
          
          // Process active benefits
          processActiveBenefits(inventoryData.items || []);
        } else {
          // Create an empty inventory for new users
          await setDoc(inventoryRef, {
            items: [],
            updatedAt: serverTimestamp()
          });
          setUserInventory([]);
        }
      } catch (error) {
        console.error("Error fetching user inventory:", error);
        notification.addNotification("Failed to load inventory", "error");
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserInventory();
  }, [currentUser]);
  
  // Process the inventory to determine active benefits
  const processActiveBenefits = (inventory) => {
    const now = new Date();
    const benefits = {
      vipSubscription: false,
      xpBoosts: [],
      snipesRemaining: 0,
      insurancePolicies: 0
    };
    
    inventory.forEach(item => {
      // Check if item is still active based on expiry date
      if (item.expiresAt && new Date(item.expiresAt) < now) {
        return; // Skip expired items
      }
      
      // Process by item type
      switch (item.type) {
        case 'subscription':
          if (item.id === 'vip_subscription') {
            benefits.vipSubscription = true;
          }
          break;
          
        case 'boost':
          // Handle time-based XP boosts (activated)
          if (item.id === 'xp_boost_1hr' && item.activatedAt && item.expiresAt) {
            const expiryTime = new Date(item.expiresAt);
            if (now < expiryTime) {
              benefits.xpBoosts.push(item);
            }
          }
          // Handle match-based XP boosts (uses remaining)
          else if (item.id === 'xp_boost_3matches' && item.usesRemaining > 0) {
            benefits.xpBoosts.push(item);
          }
          // Handle other XP boosts that might exist
          else if (item.id.includes('xp_boost') && !item.activatedAt && item.usesRemaining > 0) {
            benefits.xpBoosts.push(item);
          }
          break;
          
        case 'utility':
          if (item.id === 'match_snipes') {
            benefits.snipesRemaining += (item.usesRemaining || 0);
          }
          break;
          
        case 'special':
          if (item.id === 'wager_insurance') {
            benefits.insurancePolicies += (item.usesRemaining || 0);
          }
          break;
          
        default:
          break;
      }
    });
    
    setActiveBenefits(benefits);
  };
  
  // Function to refresh user inventory on demand
  const refreshUserInventory = async () => {
    if (!currentUser) {
      setUserInventory([]);
      setActiveBenefits({
        vipSubscription: false,
        xpBoosts: [],
        snipesRemaining: 0,
        insurancePolicies: 0
      });
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const inventoryRef = doc(db, 'userInventory', currentUser.uid);
      const inventoryDoc = await getDoc(inventoryRef);
      if (inventoryDoc.exists()) {
        const inventoryData = inventoryDoc.data();
        setUserInventory(inventoryData.items || []);
        processActiveBenefits(inventoryData.items || []);
      } else {
        setUserInventory([]);
        setActiveBenefits({
          vipSubscription: false,
          xpBoosts: [],
          snipesRemaining: 0,
          insurancePolicies: 0
        });
      }
    } catch (error) {
      console.error("Error refreshing user inventory:", error);
      notification.addNotification("Failed to refresh inventory", "error");
    } finally {
      setLoading(false);
    }
  };
  
  // Purchase an item from the shop
  const purchaseItem = async (itemId, plan) => {
    if (!currentUser) {
      notification.addNotification("You must be logged in to make purchases", "error");
      return { success: false, error: "Not logged in" };
    }
    
    // Find the item in the shop data
    const item = findItemById(itemId);
    if (!item) {
      notification.addNotification("Item not found in shop", "error");
      return { success: false, error: "Item not found" };
    }
    
    // Prevent one-time bundles from being purchased more than once
    if (['starter_bundle', 'pro_pack'].includes(item.id)) {
      // Check if user already owns the bundle in inventory
      const inventoryRef = doc(db, 'userInventory', currentUser.uid);
      const inventoryDoc = await getDoc(inventoryRef);
      const items = (inventoryDoc.exists() ? inventoryDoc.data().items : []) || [];
      const alreadyOwned = items.some(i => i.id === item.id);
      // Also check transactions for previous purchase
      const txQuery = await getDocs(collection(db, 'transactions'));
      const alreadyPurchased = txQuery.docs.some(doc => {
        const tx = doc.data();
        return tx.userId === currentUser.uid && tx.itemId === item.id && tx.type === 'shop_purchase';
      });
      if (alreadyOwned || alreadyPurchased) {
        notification.addNotification('You can only purchase this bundle once.', 'error');
        return { success: false, error: 'Bundle already purchased' };
      }
    }
    
    // VIP subscription special handling
    if (item.id === 'vip_subscription') {
      try {
        // Call backend VIP purchase with selected plan (from modal)
        const result = await purchaseVipSubscription(plan || item.plan || '1-month');
        // Refresh inventory after purchase
        await refreshUserInventory();
        notification.addNotification(result.message || "VIP subscription purchased!", "success");
        return { success: true };
      } catch (error) {
        notification.addNotification(error.message || "VIP purchase failed", "error");
        return { success: false, error: error.message };
      }
    }
    
    // Check if user has enough tokens
    const itemPrice = Math.round(item.price * 100); // Convert dollars to tokens, rounded to nearest token
    if (balance < itemPrice) {
      notification.addNotification(`Not enough tokens. You need ${itemPrice} tokens to buy this item.`, "error");
      return { success: false, error: "Insufficient tokens" };
    }
    
    try {
      // Deduct tokens from user balance
      const deductResult = await deductTokens(itemPrice, `Purchase: ${item.title}`, null);
      if (!deductResult.success) {
        notification.addNotification(`Failed to complete purchase: ${deductResult.error}`, "error");
        return { success: false, error: deductResult.error };
      }

      // If cosmetic, do NOT add to inventory. Only unlock via awardCosmetic (handled in Shop page).
      if (item.type === 'cosmetic') {
        // Record purchase in transaction history
        await addDoc(collection(db, 'transactions'), {
          type: 'shop_purchase',
          userId: currentUser.uid,
          itemId: item.id,
          itemTitle: item.title,
          itemType: item.type,
          cost: itemPrice,
          timestamp: serverTimestamp()
        });
        refreshBalance();
        return { success: true };
      }
      
      // Create inventory item
      let inventoryItem = {
        id: item.id,
        title: item.title,
        type: item.type,
        icon: item.icon,
        purchasedAt: new Date().toISOString(),
        usesRemaining: getItemUses(item)
      };
      // Add expiry date if needed
      if (item.duration) {
        inventoryItem.expiresAt = calculateExpiryDate(item.duration).toISOString();
      }
      // Get inventory reference for later use
      const inventoryRef = doc(db, 'userInventory', currentUser.uid);
      // Prevent duplicate unactivated xp_boost_1hr
      if (item.id === 'xp_boost_1hr') {
        const inventoryDoc = await getDoc(inventoryRef);
        let items = (inventoryDoc.exists() ? inventoryDoc.data().items : []) || [];
        const existing = items.find(i => i.id === 'xp_boost_1hr' && !i.activatedAt);
        if (existing) {
          // Increment usesRemaining
          existing.usesRemaining = (existing.usesRemaining || 1) + getItemUses(item);
          await updateDoc(inventoryRef, {
            items: items,
            updatedAt: serverTimestamp()
          });
        } else {
          // Add as new item
          if (inventoryDoc.exists()) {
            await updateDoc(inventoryRef, {
              items: arrayUnion(inventoryItem),
              updatedAt: serverTimestamp()
            });
          } else {
            await setDoc(inventoryRef, {
              items: [inventoryItem],
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          }
        }
      } else {
        // If this is a bundle, only grant the contents, not the bundle itself
        if (item.type === 'bundle' && item.contents) {
          for (const contentItemId of item.contents) {
            const contentItem = findItemById(contentItemId);
            if (contentItem) {
              let bundleInventoryItem = {
                id: contentItem.id,
                title: contentItem.title,
                type: contentItem.type,
                icon: contentItem.icon,
                purchasedAt: new Date().toISOString(),
                usesRemaining: getItemUses(contentItem),
                fromBundle: item.id
              };
              if (contentItem.duration) {
                bundleInventoryItem.expiresAt = calculateExpiryDate(contentItem.duration).toISOString();
              }
              // Prevent duplicate unactivated xp_boost_1hr in bundle
              if (contentItem.id === 'xp_boost_1hr') {
                const currentInventoryDoc = await getDoc(inventoryRef);
                let items = (currentInventoryDoc.exists() ? currentInventoryDoc.data().items : []) || [];
                const existing = items.find(i => i.id === 'xp_boost_1hr' && !i.activatedAt);
                if (existing) {
                  existing.usesRemaining = (existing.usesRemaining || 1) + getItemUses(contentItem);
                  await updateDoc(inventoryRef, {
                    items: items,
                    updatedAt: serverTimestamp()
                  });
                  continue;
                }
              }
              const currentInventoryDoc = await getDoc(inventoryRef);
              if (currentInventoryDoc.exists()) {
                await updateDoc(inventoryRef, {
                  items: arrayUnion(bundleInventoryItem),
                  updatedAt: serverTimestamp()
                });
              } else {
                await setDoc(inventoryRef, {
                  items: [bundleInventoryItem],
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp()
                });
              }
            }
          }
          // Record purchase in transaction history (using top-level transactions collection)
          await addDoc(collection(db, 'transactions'), {
            type: 'shop_purchase',
            userId: currentUser.uid,
            itemId: item.id,
            itemTitle: item.title,
            itemType: item.type,
            cost: itemPrice,
            timestamp: serverTimestamp()
          });
          // Update local state
          const inventoryDoc = await getDoc(inventoryRef);
          if (inventoryDoc.exists()) {
            const updatedInventory = inventoryDoc.data().items || [];
            setUserInventory(updatedInventory);
            processActiveBenefits(updatedInventory);
          }
          notification.addNotification(`Successfully purchased ${item.title}!`, "success");
          refreshBalance(); // Refresh token balance
          return { success: true };
        } else {
          // Add to user's inventory in Firestore for non-cosmetic items
          const inventoryDoc = await getDoc(inventoryRef);
          if (inventoryDoc.exists()) {
            await updateDoc(inventoryRef, {
              items: arrayUnion(inventoryItem),
              updatedAt: serverTimestamp()
            });
          } else {
            // Create new inventory document
            await setDoc(inventoryRef, {
              items: [inventoryItem],
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          }
        }
      }
      
      // Update local state
      const inventoryDoc = await getDoc(inventoryRef);
      if (inventoryDoc.exists()) {
        const updatedInventory = inventoryDoc.data().items || [];
        setUserInventory(updatedInventory);
        processActiveBenefits(updatedInventory);
      }
      
      notification.addNotification(`Successfully purchased ${item.title}!`, "success");
      refreshBalance(); // Refresh token balance
      
      return { success: true };
    } catch (error) {
      console.error("Error purchasing item:", error);
      notification.addNotification("Failed to complete purchase", "error");
      return { success: false, error: error.message };
    }
  };
  
  // Helper to calculate expiry date based on duration string
  const calculateExpiryDate = (durationStr) => {
    const now = new Date();
    
    if (durationStr.endsWith('d')) {
      const days = parseInt(durationStr);
      return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    } else if (durationStr.endsWith('h')) {
      const hours = parseInt(durationStr);
      return new Date(now.getTime() + hours * 60 * 60 * 1000);
    } else if (durationStr.endsWith('m')) {
      const minutes = parseInt(durationStr);
      return new Date(now.getTime() + minutes * 60 * 1000);
    }
    
    // Default to 1 day if format is unknown
    return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  };
  
  // Helper to get number of uses for an item
  const getItemUses = (item) => {
    if (item.limitPerDay) return item.limitPerDay;
    if (item.limit) return item.limit;
    if (item.matches) return item.matches;
    return 1; // Default to 1 use if not specified
  };
  
  // Consume a consumable item
  const consumeItem = async (inventoryItemId) => {
    if (!currentUser) {
      notification.addNotification("You must be logged in to use items", "error");
      return { success: false, error: "Not logged in" };
    }
    
    console.log(`[consumeItem] Attempting to use item: ${inventoryItemId}`);
    
    try {
      // Handle unique item identifiers (id-purchasedAt format)
      let itemId = inventoryItemId;
      let purchasedAt = null;
      
      if (inventoryItemId.includes('-') && inventoryItemId !== 'xp_boost_1hr') {
        const parts = inventoryItemId.split('-');
        if (parts.length >= 2) {
          itemId = parts[0];
          // Reconstruct purchasedAt from remaining parts (in case timestamp contains hyphens)
          purchasedAt = parts.slice(1).join('-');
        }
      }
      
      // Find the item in inventory
      let itemIndex = -1;
      let inventoryItem = null;
      
      if (purchasedAt) {
        // Find specific item by id and purchasedAt
        itemIndex = userInventory.findIndex(item => 
          item.id === itemId && item.purchasedAt === purchasedAt
        );
      } else {
        // Find first matching item by id only
        itemIndex = userInventory.findIndex(item => item.id === itemId);
      }
      
      if (itemIndex === -1) {
        console.log(`[consumeItem] Item not found in inventory: ${inventoryItemId}`);
        notification.addNotification("Item not found in inventory", "error");
        return { success: false, error: "Item not found" };
      }
      
      inventoryItem = userInventory[itemIndex];
      console.log(`[consumeItem] Found item:`, inventoryItem);
      
      // Check if item is expired
      if (inventoryItem.expiresAt && new Date(inventoryItem.expiresAt) < new Date()) {
        console.log(`[consumeItem] Item has expired:`, inventoryItem.expiresAt);
        notification.addNotification("This item has expired", "error");
        return { success: false, error: "Item expired" };
      }
      
      // Check if item has uses remaining
      if (inventoryItem.usesRemaining !== undefined && inventoryItem.usesRemaining <= 0) {
        console.log(`[consumeItem] No uses remaining:`, inventoryItem.usesRemaining);
        notification.addNotification("No uses remaining for this item", "error");
        return { success: false, error: "No uses remaining" };
      }
      
      // Handle special item types
      if (inventoryItem.id === 'stat_reset') {
        console.log(`[consumeItem] Processing stat reset item`);
        
        try {
          console.log(`[consumeItem] Getting Firebase Functions instance`);
          const functions = getFunctions();
          console.log(`[consumeItem] Creating httpsCallable for processStatReset`);
          const processStatReset = httpsCallable(functions, 'processStatReset');
          
          console.log(`[consumeItem] Calling processStatReset Cloud Function with item:`, inventoryItem);
          console.log(`[consumeItem] Data being sent:`, {
            itemId: inventoryItem.id,
            purchasedAt: inventoryItem.purchasedAt
          });
          
          const result = await processStatReset({
            itemId: inventoryItem.id,
            purchasedAt: inventoryItem.purchasedAt
          });
          
          console.log(`[consumeItem] Cloud Function result:`, result);
          console.log(`[consumeItem] Result data:`, result.data);
          
          if (result.data && result.data.success) {
            console.log(`Stat reset completed via Cloud Function for user ${currentUser.uid}`);
            
            // Refresh user inventory after Cloud Function updates it
            const inventoryRef = doc(db, 'userInventory', currentUser.uid);
            const updatedInventoryDoc = await getDoc(inventoryRef);
            
            if (updatedInventoryDoc.exists()) {
              const updatedInventoryData = updatedInventoryDoc.data();
              setUserInventory(updatedInventoryData.items || []);
              processActiveBenefits(updatedInventoryData.items || []);
              console.log(`[consumeItem] Updated inventory:`, updatedInventoryData.items);
            }
            
            notification.addNotification(result.data.message || "Stats reset successfully!", "success");
            return { success: true };
          } else {
            console.error(`[consumeItem] Cloud Function returned failure:`, result.data);
            throw new Error(result.data?.message || "Stat reset failed");
          }
        } catch (error) {
          console.error("Error resetting user stats:", error);
          console.error("Error code:", error.code);
          console.error("Error message:", error.message);
          console.error("Error details:", error.details);
          
          // Extract meaningful error message
          let errorMessage = "Failed to reset stats";
          if (error.code === 'functions/permission-denied') {
            errorMessage = "You don't have permission to reset stats";
          } else if (error.code === 'functions/not-found') {
            errorMessage = "You don't have a valid stat reset item in your inventory";
          } else if (error.code === 'functions/failed-precondition') {
            errorMessage = "You don't have a valid stat reset item available";
          } else if (error.code === 'functions/unavailable') {
            errorMessage = "Stat reset service is temporarily unavailable. Please try again later.";
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          notification.addNotification(errorMessage, "error");
          return { success: false, error: errorMessage };
        }
      } else if (inventoryItem.id === 'earnings_reset') {
        console.log(`[consumeItem] Processing earnings reset item`);
        
        try {
          console.log(`[consumeItem] Getting Firebase Functions instance`);
          const functions = getFunctions();
          console.log(`[consumeItem] Creating httpsCallable for processEarningsReset`);
          const processEarningsReset = httpsCallable(functions, 'processEarningsReset');
          
          console.log(`[consumeItem] Calling processEarningsReset Cloud Function with item:`, inventoryItem);
          console.log(`[consumeItem] Data being sent:`, {
            itemId: inventoryItem.id,
            purchasedAt: inventoryItem.purchasedAt
          });
          
          const result = await processEarningsReset({
            itemId: inventoryItem.id,
            purchasedAt: inventoryItem.purchasedAt
          });
          
          console.log(`[consumeItem] Cloud Function result:`, result);
          console.log(`[consumeItem] Result data:`, result.data);
          
          if (result.data && result.data.success) {
            console.log(`Earnings reset completed via Cloud Function for user ${currentUser.uid}`);
            
            // Refresh user inventory after Cloud Function updates it
            const inventoryRef = doc(db, 'userInventory', currentUser.uid);
            const updatedInventoryDoc = await getDoc(inventoryRef);
            
            if (updatedInventoryDoc.exists()) {
              const updatedInventoryData = updatedInventoryDoc.data();
              setUserInventory(updatedInventoryData.items || []);
              processActiveBenefits(updatedInventoryData.items || []);
              console.log(`[consumeItem] Updated inventory:`, updatedInventoryData.items);
            }
            
            notification.addNotification(result.data.message || "Earnings reset successfully!", "success");
            return { success: true };
          } else {
            console.error(`[consumeItem] Cloud Function returned failure:`, result.data);
            throw new Error(result.data?.message || "Earnings reset failed");
          }
        } catch (error) {
          console.error(`[consumeItem] Error resetting earnings:`, error);
          notification.addNotification(`Error resetting earnings: ${error.message}`, "error");
          return { success: false, error: error.message };
        }
      } else if (inventoryItem.id === 'vip_subscription') {
        // Activate VIP via backend function
        try {
          const functions = getFunctions();
          const activateVip = httpsCallable(functions, 'activateVipFromInventory');
          const result = await activateVip({
            purchasedAt: inventoryItem.purchasedAt
          });
          if (result.data && result.data.success) {
            // Remove or decrement the used VIP subscription from inventory
            const updatedInventory = [...userInventory];
            if (updatedInventory[itemIndex].usesRemaining !== undefined && updatedInventory[itemIndex].usesRemaining > 1) {
              updatedInventory[itemIndex].usesRemaining -= 1;
            } else {
              updatedInventory.splice(itemIndex, 1);
            }
            // Update Firestore
            const inventoryRef = doc(db, 'userInventory', currentUser.uid);
            await updateDoc(inventoryRef, {
              items: updatedInventory,
              updatedAt: serverTimestamp()
            });
            setUserInventory(updatedInventory);
            processActiveBenefits(updatedInventory);
            // Refresh user doc to trigger VIP badge everywhere
            try {
              const userRef = doc(db, 'users', currentUser.uid);
              const userDoc = await getDoc(userRef);
              // Optionally, you can trigger a state update or event here if needed
            } catch (e) {
              // Ignore errors, as onSnapshot will update most places
            }
            notification.addNotification(result.data.message || 'VIP activated!', 'success');
            return { success: true };
          } else {
            throw new Error(result.data?.message || 'Failed to activate VIP');
          }
        } catch (error) {
          notification.addNotification(error.message || 'Failed to activate VIP', 'error');
          return { success: false, error: error.message };
        }
      } else if (inventoryItem.id === 'xp_boost_1hr') {
        console.log(`[consumeItem] Processing 1-hour XP boost item`);
        
        try {
          // Check if item has any uses remaining
          if (inventoryItem.usesRemaining !== undefined && inventoryItem.usesRemaining <= 0) {
            console.log(`[consumeItem] No uses remaining for XP boost`);
            notification.addNotification("No uses remaining for this XP boost", "error");
            return { success: false, error: "No uses remaining" };
          }

          // Check if there's already an active 1-hour boost
          const hasActiveBoost = userInventory.some(item => 
            item.id === 'xp_boost_1hr' && 
            item.activatedAt && 
            item.expiresAt && 
            new Date(item.expiresAt) > new Date()
          );

          if (hasActiveBoost) {
            console.log(`[consumeItem] Already has active 1-hour XP boost`);
            notification.addNotification("You already have an active XP boost!", "error");
            return { success: false, error: "Already has active boost" };
          }

          // Activate the 1-hour XP boost
          const now = new Date();
          const expiryTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
          
          // Create an updated inventory array
          const updatedInventory = [...userInventory];
          
          // Update the boost item with activation details and decrement uses
          updatedInventory[itemIndex] = {
            ...updatedInventory[itemIndex],
            activatedAt: now.toISOString(),
            expiresAt: expiryTime.toISOString(),
            lastUsed: now.toISOString(),
            active: true,
            usesRemaining: 0 // Set to 0 since it's been used
          };
          
          // Update Firestore
          const inventoryRef = doc(db, 'userInventory', currentUser.uid);
          await updateDoc(inventoryRef, {
            items: updatedInventory,
            updatedAt: serverTimestamp()
          });
          
          // Update local state
          setUserInventory(updatedInventory);
          processActiveBenefits(updatedInventory);
          
          notification.addNotification(`2x XP boost activated for 1 hour!`, "success");
          return { success: true, expiresAt: expiryTime };
          
        } catch (error) {
          console.error("Error activating XP boost:", error);
          notification.addNotification("Failed to activate XP boost", "error");
          return { success: false, error: error.message };
        }
      } else if (inventoryItem.id === 'common_crate') {
        console.log(`[consumeItem] Processing common crate item`);
        try {
          // Weighted random selection from crateRewards
          const totalWeight = crateRewards.reduce((sum, r) => sum + r.weight, 0);
          let rand = Math.random() * totalWeight;
          let reward = crateRewards[0];
          for (const r of crateRewards) {
            if (rand < r.weight) {
              reward = r;
              break;
            }
            rand -= r.weight;
          }

          // Prepare reward inventory item if needed
          let rewardInventoryItem = null;
          let updatedInventory = [...userInventory];
          let rewardMessage = '';

          // Apply reward based on type
          if (reward.type === 'coin') {
            // Add coins to user balance (assume addTokens is available)
            await addTokens(reward.amount);
            rewardMessage = `You received: ${reward.title}!`;
          } else if (reward.type === 'xp') {
            // Add XP to user profile using the proper XP system
            await awardXp(currentUser.uid, reward.amount, 'crate_reward');
            rewardMessage = `You received: ${reward.title}!`;
          } else if (reward.type === 'xp_boost') {
            // Add a 1-match XP boost to inventory
            rewardInventoryItem = {
              id: reward.id,
              title: reward.title,
              type: reward.type,
              icon: reward.icon,
              purchasedAt: new Date().toISOString(),
              usesRemaining: reward.matches || 1
            };
            updatedInventory.push(rewardInventoryItem);
            rewardMessage = `You received: ${reward.title}!`;
          } else if (reward.type === 'crate') {
            // Add another common crate to inventory
            rewardInventoryItem = {
              id: 'common_crate',
              title: 'Common Crate',
              type: 'crate',
              icon: '',
              purchasedAt: new Date().toISOString(),
              usesRemaining: 1
            };
            updatedInventory.push(rewardInventoryItem);
            rewardMessage = `You received: ${reward.title}!`;
          } else if (reward.type === 'utility') {
            // Add a match snipe to inventory
            rewardInventoryItem = {
              id: 'match_snipes',
              title: 'Match Snipes',
              type: 'utility',
              icon: '',
              purchasedAt: new Date().toISOString(),
              usesRemaining: reward.uses || 1
            };
            updatedInventory.push(rewardInventoryItem);
            rewardMessage = `You received: ${reward.title}!`;
          } else if (reward.type === 'cosmetic') {
            // Always update inventory before returning for cosmetics
            if (updatedInventory[itemIndex].usesRemaining !== undefined && updatedInventory[itemIndex].usesRemaining > 1) {
              updatedInventory[itemIndex].usesRemaining -= 1;
            } else {
              updatedInventory.splice(itemIndex, 1); // Remove crate if no uses left
            }

            // Update Firestore
            const inventoryRef = doc(db, 'userInventory', currentUser.uid);
            await updateDoc(inventoryRef, {
              items: updatedInventory,
              updatedAt: serverTimestamp()
            });

            // Update local state
            setUserInventory(updatedInventory);
            processActiveBenefits(updatedInventory);

            // Cosmetic unlock will be handled in the component
            return { success: true, reward, cosmeticToAward: reward.id };
          }

          // Update inventory: decrement or remove crate
          if (updatedInventory[itemIndex].usesRemaining !== undefined && updatedInventory[itemIndex].usesRemaining > 1) {
            updatedInventory[itemIndex].usesRemaining -= 1;
          } else {
            updatedInventory.splice(itemIndex, 1); // Remove crate if no uses left
          }

          // Update Firestore
          const inventoryRef = doc(db, 'userInventory', currentUser.uid);
          await updateDoc(inventoryRef, {
            items: updatedInventory,
            updatedAt: serverTimestamp()
          });

          // Update local state
          setUserInventory(updatedInventory);
          processActiveBenefits(updatedInventory);

          // Don't show notification here - it's handled in the Shop component
          return { success: true, reward: rewardInventoryItem || reward };
        } catch (error) {
          console.error('Error opening common crate:', error);
          notification.addNotification('Failed to open crate', 'error');
          return { success: false, error: error.message };
        }
      } else if (inventoryItem.id === 'rare_crate') {
        console.log(`[consumeItem] Processing rare crate item`);
        try {
          // Weighted random selection from rareCrateRewards
          const totalWeight = rareCrateRewards.reduce((sum, r) => sum + r.weight, 0);
          let rand = Math.random() * totalWeight;
          let reward = rareCrateRewards[0];
          for (const r of rareCrateRewards) {
            if (rand < r.weight) {
              reward = r;
              break;
            }
            rand -= r.weight;
          }

          // Prepare reward inventory item if needed
          let rewardInventoryItem = null;
          let updatedInventory = [...userInventory];
          let rewardMessage = '';

          // Apply reward based on type
          if (reward.type === 'coin') {
            await addTokens(reward.amount);
            rewardMessage = `You received: ${reward.title}!`;
          } else if (reward.type === 'xp') {
            await awardXp(currentUser.uid, reward.amount, 'rare_crate_reward');
            rewardMessage = `You received: ${reward.title}!`;
          } else if (reward.type === 'xp_boost') {
            rewardInventoryItem = {
              id: reward.id,
              title: reward.title,
              type: reward.type,
              icon: reward.icon,
              purchasedAt: new Date().toISOString(),
              usesRemaining: reward.matches || 1
            };
            updatedInventory.push(rewardInventoryItem);
            rewardMessage = `You received: ${reward.title}!`;
          } else if (reward.type === 'crate') {
            rewardInventoryItem = {
              id: 'rare_crate',
              title: 'Rare Crate',
              type: 'crate',
              icon: '',
              purchasedAt: new Date().toISOString(),
              usesRemaining: 1
            };
            updatedInventory.push(rewardInventoryItem);
            rewardMessage = `You received: ${reward.title}!`;
          } else if (reward.type === 'cosmetic') {
            // Always update inventory before returning for cosmetics
            if (updatedInventory[itemIndex].usesRemaining !== undefined && updatedInventory[itemIndex].usesRemaining > 1) {
              updatedInventory[itemIndex].usesRemaining -= 1;
            } else {
              updatedInventory.splice(itemIndex, 1); // Remove crate if no uses left
            }

            // Update Firestore
            const inventoryRef = doc(db, 'userInventory', currentUser.uid);
            await updateDoc(inventoryRef, {
              items: updatedInventory,
              updatedAt: serverTimestamp()
            });

            // Update local state
            setUserInventory(updatedInventory);
            processActiveBenefits(updatedInventory);

            // Cosmetic unlock will be handled in the component
            return { success: true, reward, cosmeticToAward: reward.id };
          }

          // Update inventory: decrement or remove rare crate
          if (updatedInventory[itemIndex].usesRemaining !== undefined && updatedInventory[itemIndex].usesRemaining > 1) {
            updatedInventory[itemIndex].usesRemaining -= 1;
          } else {
            updatedInventory.splice(itemIndex, 1); // Remove crate if no uses left
          }

          // Update Firestore
          const inventoryRef = doc(db, 'userInventory', currentUser.uid);
          await updateDoc(inventoryRef, {
            items: updatedInventory,
            updatedAt: serverTimestamp()
          });

          // Update local state
          setUserInventory(updatedInventory);
          processActiveBenefits(updatedInventory);

          // Don't show notification here - it's handled in the Shop component
          return { success: true, reward: rewardInventoryItem || reward };
        } catch (error) {
          console.error('Error opening rare crate:', error);
          notification.addNotification('Failed to open rare crate', 'error');
          return { success: false, error: error.message };
        }
      } else if (inventoryItem.id === 'wager_insurance') {
        console.log(`[consumeItem] Processing wager insurance item`);
        
        try {
          // Check if user already has active insurance
          const userRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userRef);
          const userData = userDoc.data();
          
          if (userData.activeInsurance?.isActive) {
            notification.addNotification("You already have active wager insurance!", "error");
            return { success: false, error: "Insurance already active" };
          }
          
          // Check 24-hour cooldown
          if (userData.lastInsuranceUsed) {
            const lastUsed = new Date(userData.lastInsuranceUsed.toDate());
            const now = new Date();
            const hoursSinceLastUse = (now - lastUsed) / (1000 * 60 * 60);
            
            if (hoursSinceLastUse < 24) {
              const hoursRemaining = Math.ceil(24 - hoursSinceLastUse);
              const minutesRemaining = Math.ceil((24 - hoursSinceLastUse - Math.floor(24 - hoursSinceLastUse)) * 60);
              
              let cooldownMessage;
              if (hoursRemaining > 1) {
                cooldownMessage = `Insurance cooldown active. ${hoursRemaining} hours remaining.`;
              } else if (hoursRemaining === 1) {
                cooldownMessage = `Insurance cooldown active. 1 hour ${minutesRemaining} minutes remaining.`;
              } else {
                cooldownMessage = `Insurance cooldown active. ${minutesRemaining} minutes remaining.`;
              }
              
              notification.addNotification(cooldownMessage, "error");
              return { success: false, error: "Cooldown active" };
            }
          }
          
          // Activate insurance
          const now = new Date();
          const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
          
          await updateDoc(userRef, {
            activeInsurance: {
              isActive: true,
              activatedAt: serverTimestamp(),
              expiresAt: expiresAt,
              maxRefund: 50,
              itemPurchasedAt: inventoryItem.purchasedAt
            }
          });
          
          // Update inventory: remove the insurance item
          const updatedInventory = [...userInventory];
          updatedInventory.splice(itemIndex, 1);
          
          // Update Firestore inventory
          const inventoryRef = doc(db, 'userInventory', currentUser.uid);
          await updateDoc(inventoryRef, {
            items: updatedInventory,
            updatedAt: serverTimestamp()
          });
          
          // Update local state
          setUserInventory(updatedInventory);
          processActiveBenefits(updatedInventory);
          
          notification.addNotification("Wager Insurance activated! Your next wager is protected.", "success");
          return { success: true };
          
        } catch (error) {
          console.error("Error activating wager insurance:", error);
          notification.addNotification("Failed to activate wager insurance", "error");
          return { success: false, error: error.message };
        }
      } else {
        // For non-special items, handle inventory updates locally
        if (!['stat_reset', 'earnings_reset', 'xp_boost_1hr'].includes(inventoryItem.id)) {
          console.log(`[consumeItem] Processing regular item: ${inventoryItem.id}`);
          
          // Create an updated inventory array
          const updatedInventory = [...userInventory];
          
          // Update uses remaining
          if (updatedInventory[itemIndex].usesRemaining !== undefined) {
            updatedInventory[itemIndex].usesRemaining -= 1;
          }
          
          // Add used timestamp
          updatedInventory[itemIndex].lastUsed = new Date().toISOString();
          
          // Update Firestore
          const inventoryRef = doc(db, 'userInventory', currentUser.uid);
          await updateDoc(inventoryRef, {
            items: updatedInventory,
            updatedAt: serverTimestamp()
          });
          
          // Update local state
          setUserInventory(updatedInventory);
          processActiveBenefits(updatedInventory);
          
          notification.addNotification(`Successfully used ${inventoryItem.title}`, "success");
        }
        
        return { success: true };
      }
    } catch (error) {
      console.error("Error using item:", error);
      notification.addNotification("Failed to use item", "error");
      return { success: false, error: error.message };
    }
  };
  
  // Check if user has active XP boost
  const hasActiveXpBoost = () => {
    return activeBenefits.xpBoosts.length > 0;
  };
  
  // Check if user has VIP subscription
  const hasVipSubscription = () => {
    return activeBenefits.vipSubscription;
  };
  
  // Apply XP boost to a match
  const applyXpBoost = async (matchId) => {
    if (!currentUser || !hasActiveXpBoost()) {
      return { success: false, multiplier: 1 };
    }
    
    // Get the first available XP boost
    const boost = activeBenefits.xpBoosts[0];
    
    try {
      // Update the boost in the inventory
      if (boost.usesRemaining !== undefined) {
        const updatedInventory = userInventory.map(item => {
          if (item.id === boost.id && item.purchasedAt === boost.purchasedAt) {
            return {
              ...item,
              usesRemaining: item.usesRemaining - 1,
              lastUsed: new Date().toISOString()
            };
          }
          return item;
        });
        
        // Update Firestore
        const inventoryRef = doc(db, 'userInventory', currentUser.uid);
        await updateDoc(inventoryRef, {
          items: updatedInventory,
          updatedAt: serverTimestamp()
        });
        
        // Update local state
        setUserInventory(updatedInventory);
        processActiveBenefits(updatedInventory);
      }
      
      // Record the boost application
      const matchRef = doc(db, 'wagers', matchId);
      await updateDoc(matchRef, {
        xpBoostApplied: true,
        xpBoostMultiplier: 2, // 2x is the default multiplier
        xpBoostType: boost.id
      });
      
      return { success: true, multiplier: 2 };
    } catch (error) {
      console.error("Error applying XP boost:", error);
      return { success: false, multiplier: 1, error: error.message };
    }
  };
  
  // Get remaining snipes
  const getRemainingSnipes = () => {
    return activeBenefits.snipesRemaining;
  };
  
  // Use a snipe
  const useSnipe = async () => {
    if (activeBenefits.snipesRemaining <= 0) {
      notification.addNotification("No snipes remaining", "error");
      return { success: false, error: "No snipes remaining" };
    }
    
    // Find a snipe item to use
    const snipeItem = userInventory.find(item => 
      item.id === 'match_snipes' && 
      (!item.expiresAt || new Date(item.expiresAt) > new Date()) && 
      item.usesRemaining > 0
    );
    
    if (!snipeItem) {
      notification.addNotification("No valid snipe items found", "error");
      return { success: false, error: "No valid snipe items" };
    }
    
    return await consumeItem('match_snipes');
  };
  
  // Get active XP boost details
  const getActiveXpBoost = () => {
    const now = new Date();
    
    // Find active 1-hour XP boost
    const activeHourBoost = userInventory.find(item => 
      item.id === 'xp_boost_1hr' && 
      item.activatedAt && 
      item.expiresAt && 
      new Date(item.expiresAt) > now
    );
    
    if (activeHourBoost) {
      const timeRemaining = new Date(activeHourBoost.expiresAt).getTime() - now.getTime();
      return {
        type: '1hr',
        multiplier: 2,
        timeRemaining: Math.max(0, timeRemaining),
        expiresAt: activeHourBoost.expiresAt,
        active: true
      };
    }
    
    // Check for match-based boosts
    const activeMatchBoost = userInventory.find(item => 
      item.id === 'xp_boost_3matches' && 
      item.usesRemaining > 0
    );
    
    if (activeMatchBoost) {
      return {
        type: '3matches',
        multiplier: 2,
        matchesRemaining: activeMatchBoost.usesRemaining,
        active: true
      };
    }
    
    return {
      active: false,
      multiplier: 1
    };
  };
  
  // Value object to provide through context
  const value = {
    loading,
    userInventory,
    activeBenefits,
    purchaseItem,
    useItem: consumeItem, // renamed but kept the same API name in the value object
    hasActiveXpBoost,
    hasVipSubscription,
    applyXpBoost,
    getRemainingSnipes,
    useSnipe,
    getActiveXpBoost,
    shopData,
    refreshUserInventory
  };
  
  return (
    <ShopContext.Provider value={value}>
      {children}
    </ShopContext.Provider>
  );
};

export default ShopContext;
