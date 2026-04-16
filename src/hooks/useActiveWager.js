import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

export const useActiveWager = () => {
  const { currentUser } = useAuth();
  const [activeWager, setActiveWager] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      setActiveWager(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Create a real-time listener for active wagers
    const wagerQuery = query(
      collection(db, 'wagers'),
      where('participants', 'array-contains', currentUser.uid)
    );

    const unsubscribe = onSnapshot(wagerQuery, (snapshot) => {
      try {
        // Filter out completed/cancelled wagers
        const activeWagers = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(wager => {
            const status = wager.status;
            return status !== 'completed' && status !== 'cancelled';
          });

        // Set the first active wager (user should only have one active wager at a time)
        setActiveWager(activeWagers.length > 0 ? activeWagers[0] : null);
      } catch (error) {
        console.error('Error fetching active wager:', error);
        setActiveWager(null);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error('Error listening to active wagers:', error);
      setActiveWager(null);
      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [currentUser]);

  return { activeWager, loading };
}; 