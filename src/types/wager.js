// Enhanced wager structure to support sponsorship
export const WAGER_STRUCTURE = {
  // Existing fields...
  id: 'string',
  hostId: 'string',
  amount: 'number',
  status: 'string',
  mode: 'string', // 'real' or 'fun' (for Fun Play)
  
  // New sponsorship fields
  sponsorships: [
    {
      sponsorId: 'string',      // Who is paying
      sponsoredUserId: 'string', // Who is being sponsored
      amount: 'number',          // How much the sponsor is paying
      sponsorShare: 'number',    // Percentage of winnings sponsor gets (0-100)
      sponsoredShare: 'number'   // Percentage of winnings sponsored player gets (0-100)
    }
  ],
  
  // Enhanced participants structure
  participants: [
    {
      userId: 'string',
      displayName: 'string',
      team: 'string',           // 'team1' or 'team2'
      role: 'string',           // 'host', 'guest', 'teammate'
      isSponsored: 'boolean',   // Whether this player is sponsored
      sponsorId: 'string',      // ID of sponsor (if sponsored)
      paidAmount: 'number',     // Amount this player actually paid
      potentialWinnings: 'number' // Amount this player could win
    }
  ],
  
  // Financial breakdown
  totalPot: 'number',          // Total prize pool
  sponsorshipTotal: 'number',  // Total amount sponsored
  entryBreakdown: {
    selfPaid: 'number',        // Total paid by players themselves
    sponsored: 'number'        // Total paid by sponsors
  }
};

// Sponsorship rules - Updated for full flexibility
export const SPONSORSHIP_RULES = {
  // Full flexibility: sponsor can choose 0-100%
  MIN_SPONSOR_SHARE: 0,
  MAX_SPONSOR_SHARE: 100,
  
  // Minimum and maximum for sponsored player (inverse of sponsor)
  MIN_SPONSORED_SHARE: 0,
  MAX_SPONSORED_SHARE: 100,
  
  // Default split (sponsor gets 70%, sponsored gets 30%)
  DEFAULT_SPONSOR_SHARE: 70,
  DEFAULT_SPONSORED_SHARE: 30,
  
  // Maximum number of players one person can sponsor
  MAX_SPONSORSHIPS_PER_USER: 3
}; 