import { useState } from 'react';
import { awardWagerParticipationXp, awardWagerWinXp } from '../firebase/xpSystem';

/**
 * Custom hook to handle XP awards for wager participation and wins
 */
const useWagerXp = () => {
  const [xpResult, setXpResult] = useState(null);
  const [loading, setLoading] = useState(false);

  /**
   * Award XP for participating in a wager
   * @param {string} userId - User ID to award XP to
   * @param {number} wagerAmount - Token amount of the wager
   */
  const awardParticipationXp = async (userId, wagerAmount) => {
    if (!userId || !wagerAmount) return null;
    
    setLoading(true);
    try {
      const result = await awardWagerParticipationXp(userId, wagerAmount);
      setXpResult(result);
      return result;
    } catch (error) {
      console.error('Error awarding participation XP:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Award XP for winning a wager
   * @param {string} userId - User ID to award XP to
   * @param {number} wagerAmount - Token amount of the wager
   */
  const awardWinXp = async (userId, wagerAmount) => {
    if (!userId || !wagerAmount) return null;
    
    setLoading(true);
    try {
      const result = await awardWagerWinXp(userId, wagerAmount);
      setXpResult(result);
      return result;
    } catch (error) {
      console.error('Error awarding win XP:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Award XP for both participants and additionally for the winner
   * @param {string} winnerUserId - User ID of the winner
   * @param {string[]} participantUserIds - Array of all participant user IDs
   * @param {number} wagerAmount - Token amount of the wager
   */
  const processWagerXp = async (winnerUserId, participantUserIds, wagerAmount) => {

    
    if (!participantUserIds || !participantUserIds.length || !wagerAmount) {
      console.error('XP HOOK: Invalid parameters for processWagerXp:', { winnerUserId, participantUserIds, wagerAmount });
      return null;
    }

    setLoading(true);
    const results = {
      participation: {},
      win: null
    };

    try {

      
      // Award participation XP to all losers (exclude the winner)
      const losers = participantUserIds.filter(id => id && id !== winnerUserId);

      const participationPromises = [];
      
      for (const userId of losers) {

        participationPromises.push(
          awardWagerParticipationXp(userId, wagerAmount)
            .then(result => {

              results.participation[userId] = result;
              return result;
            })
            .catch(error => {
              console.error('XP HOOK: Error awarding participation XP to loser', userId, ':', error);
              return null;
            })
        );
      }
      
      // Wait for all participation XP awards to complete
      
      await Promise.all(participationPromises);
      

      // Award win XP to the winner
      if (winnerUserId) {

        try {
          results.win = await awardWagerWinXp(winnerUserId, wagerAmount);

          
          // Show the winner XP notification if it's for the current user
          if (results.win) {

            setXpResult(results.win);
          } else {
            console.warn('XP HOOK: No XP result returned for winner:', winnerUserId);
          }
        } catch (winnerError) {
          console.error('XP HOOK: Error awarding winner XP:', winnerError);
        }
      }

      
      return results;
    } catch (error) {
      console.error('XP HOOK: Error processing wager XP:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Clear the XP result notification
  const clearXpResult = () => {
    setXpResult(null);
  };

  return {
    xpResult,
    loading,
    awardParticipationXp,
    awardWinXp,
    processWagerXp,
    clearXpResult
  };
};

export default useWagerXp;
