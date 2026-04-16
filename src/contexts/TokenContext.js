import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, query, where, orderBy, getDocs, writeBatch, serverTimestamp, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useNotification } from '../contexts/NotificationContext';
import { getTipFee } from '../utils/feeUtils';
import { getFunctions, httpsCallable } from 'firebase/functions';

const TokenContext = createContext();

export function useTokens() {
  return useContext(TokenContext);
}

export function TokenProvider({ children }) {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const notification = useNotification();

  useEffect(() => {
    let unsubscribe;
    if (currentUser && currentUser.uid) {
      const userRef = doc(db, 'users', currentUser.uid);
      unsubscribe = onSnapshot(userRef, (userDoc) => {
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setBalance(userData.tokenBalance || 0);
        } else {
          setBalance(0);
        }
      });
      fetchTransactions();
    } else {
      setBalance(0);
      setTransactions([]);
      setLoading(false);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser]);

  const fetchUserBalance = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching user balance for user:', currentUser?.uid);
      
      if (!currentUser || !currentUser.uid) {
        console.error('No current user available');
        setBalance(0);
        setLoading(false);
        return;
      }
      
      const userRef = doc(db, 'users', currentUser.uid);
      
      try {
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('User document exists:', userData);
          setBalance(userData.tokenBalance || 0);
      } else {
          console.log('User document does not exist, creating a new one');
        // Create user document if it doesn't exist
        await setDoc(userRef, {
          email: currentUser.email,
          displayName: currentUser.displayName || '',
          photoURL: currentUser.photoURL || '',
          tokenBalance: 0,
          createdAt: new Date()
        });
          setBalance(0);
        }
      } catch (docError) {
        console.error('Error accessing Firestore document:', docError);
        // Handle initialization failure gracefully
        setBalance(0);
      }
    } catch (error) {
      console.error('Error fetching user balance:', error);
      setBalance(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      if (!currentUser || !currentUser.uid) {
        console.error('No current user available for fetching transactions');
        setTransactions([]);
        return;
      }
      
      console.log('Fetching transactions for user:', currentUser.uid);
      
      try {
        // Try with the complex query first (requires index)
        const q = query(
          collection(db, 'transactions'),
          where('userId', '==', currentUser.uid),
          orderBy('timestamp', 'desc'),
          limit(50) // Only fetch the 50 most recent
        );
        
        const querySnapshot = await getDocs(q);
        const transactionList = [];
        
        querySnapshot.forEach((doc) => {
          transactionList.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        setTransactions(transactionList);
        console.log('Fetched transactions:', transactionList.length);
      } catch (complexQueryError) {
        console.error('Error with complex query:', complexQueryError);
        
        // Check if this is a missing index error
        if (complexQueryError.message && complexQueryError.message.includes('requires an index')) {
          // Extract the index creation URL
          const indexUrlMatch = complexQueryError.message.match(/https:\/\/console\.firebase\.google\.com\/.*?(?='|"|\s|$)/);
          const indexUrl = indexUrlMatch ? indexUrlMatch[0] : null;
          
          if (indexUrl) {
            console.log('Index required for transactions. URL:', indexUrl);
            notification.addNotification(`Transactions require a Firestore index. Please ask an administrator to create it.`, 'warning');
            
            // Fallback: just use a simple where query without ordering
            try {
              const simpleQuery = query(
                collection(db, 'transactions'),
                where('userId', '==', currentUser.uid)
              );
              
              const simpleSnapshot = await getDocs(simpleQuery);
              const simpleTransactionList = [];
              
              simpleSnapshot.forEach((doc) => {
                simpleTransactionList.push({
                  id: doc.id,
                  ...doc.data()
                });
              });
              
              // Sort manually by timestamp (descending)
              simpleTransactionList.sort((a, b) => {
                const timestampA = a.timestamp?.toDate?.() || a.timestamp || new Date(0);
                const timestampB = b.timestamp?.toDate?.() || b.timestamp || new Date(0);
                return timestampB - timestampA;
              });
              
              setTransactions(simpleTransactionList);
              console.log('Fetched transactions with fallback:', simpleTransactionList.length);
            } catch (simpleQueryError) {
              console.error('Error with fallback transactions query:', simpleQueryError);
              setTransactions([]);
            }
          } else {
            console.error('Missing index but no URL found');
            setTransactions([]);
          }
        } else {
          // Other error
          console.error('Transaction fetch error:', complexQueryError);
          setTransactions([]);
        }
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const addTokens = async (amount, paymentMethod, paymentAmount) => {
    try {
      setLoading(true);
      
      if (!currentUser || !currentUser.uid) {
        console.error('No current user available for adding tokens');
        return false;
      }
      
      console.log(`Adding ${amount} tokens to user ${currentUser.uid}`);
      
      // Update user balance
      const userRef = doc(db, 'users', currentUser.uid);
      
      // Get current user data to ensure we have the latest balance
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        console.error('User document not found');
        // Create document if it doesn't exist
        await setDoc(userRef, {
          email: currentUser.email,
          displayName: currentUser.displayName || '',
          photoURL: currentUser.photoURL || '',
          tokenBalance: amount,
          createdAt: new Date()
        });
        setBalance(amount);
      } else {
        const currentBalance = userDoc.data().tokenBalance || 0;
        const newBalance = currentBalance + amount;
        
        // Update with the new balance
      await updateDoc(userRef, {
          tokenBalance: newBalance
      });
        
        // Update local state
        setBalance(newBalance);
      }
      
      // Record transaction
      const transactionData = {
        userId: currentUser.uid,
        type: paymentMethod ? 'purchase' : 'crate_reward',
        amount: amount,
        timestamp: new Date()
      };
      if (paymentMethod) transactionData.paymentMethod = paymentMethod;
      if (paymentAmount) transactionData.paymentAmount = paymentAmount;
      await addDoc(collection(db, 'transactions'), transactionData);
      
      // Refresh transactions
      fetchTransactions();
      
      return true;
    } catch (error) {
      console.error('Error adding tokens:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeTokens = async (amount, reason) => {
    if (balance < amount) {
      return false;
    }
    
    try {
      setLoading(true);
      
      if (!currentUser || !currentUser.uid) {
        console.error('No current user available for removing tokens');
        return false;
      }
      
      // Update user balance
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        tokenBalance: balance - amount
      });
      
      // Record transaction
      await addDoc(collection(db, 'transactions'), {
        userId: currentUser.uid,
        type: 'spend',
        amount: amount,
        reason: reason,
        timestamp: new Date()
      });
      
      // Update local state
      setBalance(prevBalance => prevBalance - amount);
      
      // Refresh transactions
      fetchTransactions();
      
      return true;
    } catch (error) {
      console.error('Error removing tokens:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const tipUser = async (recipientId, amount) => {
    try {
      // Validate input
      if (!recipientId || !amount || amount <= 0) {
        console.error('Invalid tip amount or recipient');
        return { success: false, error: 'Invalid tip amount or recipient' };
      }
      if (!currentUser || !currentUser.uid) {
        console.error('You must be logged in to send tips');
        return { success: false, error: 'You must be logged in to send tips' };
      }
      if (currentUser.uid === recipientId) {
        console.error('You cannot tip yourself');
        return { success: false, error: 'You cannot tip yourself' };
      }
      setLoading(true);
      // Call the backend Cloud Function
      const functions = getFunctions();
      const sendTip = httpsCallable(functions, 'sendTip');
      const result = await sendTip({ recipientId, amount });
      // Refresh balance and transactions after tip
      await fetchUserBalance();
      fetchTransactions();
      if (notification) {
        notification.addNotification('Successfully sent tip!', 'success');
      }
      return result.data || { success: true };
    } catch (error) {
      console.error('Error sending tip:', error);
      return { success: false, error: error.message || error.details || 'Failed to send tip' };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Deduct tokens from user for wager entry fees with proper transaction recording
   * @param {number} amount - The amount to deduct
   * @param {string} reason - The reason for the deduction
   * @param {string} wagerId - The wager ID associated with this deduction
   * @returns {Promise<Object>} - Result of the deduction
   */
  const deductTokens = async (amount, reason, wagerId) => {
    try {
      console.log(`Deducting ${amount} tokens for wager ${wagerId}`);
      
      if (!currentUser || !currentUser.uid) {
        console.error('No current user available for deducting tokens');
        return { success: false, error: 'User not authenticated' };
      }
      
      // Validate amount
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        console.error('Invalid amount:', amount);
        return { success: false, error: 'Invalid amount' };
      }
      
      // Get latest user data to ensure we have the current balance
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        console.error('User document not found');
        return { success: false, error: 'User not found' };
      }
      
      const currentBalance = userDoc.data().tokenBalance || 0;
      
      // Check if user has enough balance
      if (currentBalance < numAmount) {
        console.error(`Insufficient balance: ${currentBalance} < ${numAmount}`);
        return { success: false, error: 'Insufficient balance' };
      }
      
      // Calculate new balance
      const newBalance = currentBalance - numAmount;
      
      // Use a batch to ensure atomicity
      const batch = writeBatch(db);
      
      // Update user balance
      batch.update(userRef, {
        tokenBalance: newBalance
      });
      
      // Create transaction document
      const transactionRef = doc(collection(db, 'transactions'));
      const transactionData = {
        userId: currentUser.uid,
        amount: numAmount,
        reason: reason,
        timestamp: serverTimestamp(),
        type: wagerId ? 'wager_entry' : 'shop_purchase'
      };

      // Only include wagerId for wager entries
      if (wagerId) {
        transactionData.wagerId = wagerId;
      }
      
      batch.set(transactionRef, transactionData);
      
      // Commit the batch
      await batch.commit();
      
      console.log(`Successfully deducted ${numAmount} tokens. New balance: ${newBalance}`);
      
      // Update local state
      setBalance(newBalance);
      
      // Refresh transactions
      fetchTransactions();
      
      return { success: true };
    } catch (error) {
      console.error('Error deducting tokens:', error);
      return { success: false, error: error.message };
    }
  };

  // Add XP to user profile and log transaction
  const addXp = async (amount, reason = 'crate_reward') => {
    try {
      if (!currentUser || !currentUser.uid) {
        console.error('No current user available for adding XP');
        return false;
      }
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      let currentXp = 0;
      if (userDoc.exists()) {
        currentXp = userDoc.data().xp || 0;
      }
      const newXp = currentXp + amount;
      await updateDoc(userRef, { xp: newXp });
      // Log XP transaction
      await addDoc(collection(db, 'transactions'), {
        userId: currentUser.uid,
        type: 'xp_reward',
        amount,
        reason,
        timestamp: new Date()
      });
      // Optionally: notification.addNotification(`You gained ${amount} XP!`, 'success');
      return true;
    } catch (error) {
      console.error('Error adding XP:', error);
      return false;
    }
  };

  const value = {
    balance,
    transactions,
    loading,
    addTokens,
    removeTokens,
    deductTokens,
    tipUser,
    refreshBalance: fetchUserBalance,
    addXp // Export addXp for use in ShopContext
  };

  return (
    <TokenContext.Provider value={value}>
      {children}
    </TokenContext.Provider>
  );
}
