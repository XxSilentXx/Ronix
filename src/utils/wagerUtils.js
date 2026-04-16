/**
 * Utility functions for wager management
 */

/**
 * Check if all players in a wager are ready
 * @param {Object} match - The match/wager object
 * @returns {boolean} - True if all players are ready
 */
export const areAllPlayersReady = (match) => {
  if (!match) return false;
  
  if (match.isPartyWager) {
    // For party wagers, check readyStatus for all participants
    if (!match.participants || !match.readyStatus) return false;
    
    // All participants must be ready
    return match.participants.every(participantId => 
      match.readyStatus[participantId] === true
    );
  } else {
    // For non-party wagers, check hostReady and guestReady
    return match.hostReady && match.guestReady;
  }
};

/**
 * Get the ready status for a specific player
 * @param {Object} match - The match/wager object
 * @param {string} playerId - The player's ID
 * @returns {boolean} - True if the player is ready
 */
export const getPlayerReadyStatus = (match, playerId) => {
  if (!match || !playerId) return false;
  
  if (match.isPartyWager) {
    return match.readyStatus?.[playerId] || false;
  } else {
    if (playerId === match.hostId) {
      return match.hostReady || false;
    } else if (playerId === match.guestId) {
      return match.guestReady || false;
    }
    return false;
  }
};

/**
 * Get the total number of players in a wager
 * @param {Object} match - The match/wager object
 * @returns {number} - Total number of players
 */
export const getTotalPlayerCount = (match) => {
  if (!match) return 0;
  
  if (match.isPartyWager) {
    return match.participants ? match.participants.length : 0;
  } else {
    // Non-party wagers always have 2 players (host + guest)
    return match.guestId ? 2 : 1;
  }
};

/**
 * Get the number of ready players in a wager
 * @param {Object} match - The match/wager object
 * @returns {number} - Number of ready players
 */
export const getReadyPlayerCount = (match) => {
  if (!match) return 0;
  
  if (match.isPartyWager) {
    if (!match.participants || !match.readyStatus) return 0;
    
    return match.participants.filter(participantId => 
      match.readyStatus[participantId] === true
    ).length;
  } else {
    let count = 0;
    if (match.hostReady) count++;
    if (match.guestReady) count++;
    return count;
  }
};

/**
 * Check if a user is a party leader in a wager
 * @param {Object} match - The match/wager object
 * @param {string} userId - The user's ID
 * @returns {boolean} - True if the user is a party leader
 */
export const isUserPartyLeader = (match, userId) => {
  if (!match || !userId) return false;
  
  if (match.isPartyWager) {
    // Check if user is the host (match creator)
    if (userId === match.hostId) return true;
    
    // Check if user is the guest (joiner)
    if (userId === match.guestId) return true;
    
    // Check if user is marked as leader in partyMembers
    const memberInPartyMembers = match.partyMembers?.find(m => m.id === userId);
    if (memberInPartyMembers?.isLeader) return true;
    
    // Check if user is marked as leader in guestPartyMembers
    const memberInGuestPartyMembers = match.guestPartyMembers?.find(m => m.id === userId);
    if (memberInGuestPartyMembers?.isLeader) return true;
    
    return false;
  } else {
    // Non-party wager: host or guest
    return userId === match.hostId || userId === match.guestId;
  }
}; 