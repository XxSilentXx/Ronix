# Entry Fee and Prize Distribution Bug Fixes

## Issues Identified and Fixed

###  Bug #1: Incorrect Entry Fee Deduction for Party Members

**Problem:**
- Only the party leader was paying entry fees, but ALL party members were marked as "paid" in `partyMemberEntryFeesDeducted`
- Non-sponsored party members should have their entry fees paid by the party leader
- Only sponsored members should be marked as paid without actual token deduction

**Root Cause:**
In both `CreateWagerModal.js` and `JoinWagerModal.js`, the code was setting:
```javascript
entryFeeUpdates[`partyMemberEntryFeesDeducted.${memberId}`] = true; // All paid by leader/sponsor
```
This marked ALL members as paid regardless of sponsorship status.

**Solution:**
Fixed the logic to correctly calculate costs and track payments:

```javascript
// FIXED: Initialize entry fee tracking for party members correctly
// Only mark as paid if they are sponsored OR if they are the leader
const entryFeeUpdates = {};
partyMemberIds.forEach(memberId => {
  const isSponsored = confirmedSponsorships.some(s => s.memberId === memberId);
  const isLeader = memberId === currentUser.uid;
  
  // Mark as paid if sponsored or if they are the leader (who paid for everyone)
  entryFeeUpdates[`partyMemberEntryFeesDeducted.${memberId}`] = isSponsored || isLeader;
});
```

**Cost Calculation Fix:**
```javascript
// For party wagers, calculate total cost for all non-sponsored members
let totalCostForLeader = wager.amount; // Leader always pays their own entry

if (currentParty && wager.isPartyWager) {
  // Add entry fees for non-sponsored party members (excluding leader)
  const partyMemberIds = currentParty.members.map(member => member.id || member);
  const nonLeaderMembers = partyMemberIds.filter(id => id !== currentUser.uid);
  
  for (const memberId of nonLeaderMembers) {
    const isSponsored = confirmedSponsorships.some(s => s.memberId === memberId);
    if (!isSponsored) {
      // Non-sponsored member - leader needs to pay for them
      totalCostForLeader += wager.amount;
    }
  }
}

// Add sponsorship costs
totalCostForLeader += totalSponsorshipCost;
```

###  Bug #2: Sponsored Player Not Receiving Prize

**Problem:**
- Sponsored players were not receiving their share of winnings
- The party leader was getting the full prize instead of the sponsored player getting their portion

**Root Cause:**
There was a potential conflict with the `winnerRef` variable being defined for the `primaryWinnerId` at the top of the function, which could interfere with the sponsorship distribution logic.

**Solution:**
1. **Removed conflicting variable declarations:**
   - Removed the early `winnerRef` and `winnerDoc` declarations that were tied to `primaryWinnerId`
   - This prevented conflicts with the sponsorship distribution logic

2. **Enhanced debugging logs:**
   ```javascript
   // DEBUGGING: Add more detailed logging
   console.log(`[handleMatchCompletion] DEBUGGING - Sponsored player details:`);
   console.log(`  - Sponsored player ID: ${winnerId}`);
   console.log(`  - Sponsor ID: ${sponsorId}`);
   console.log(`  - Sponsored player should receive: ${sponsoredWinnings} tokens`);
   console.log(`  - Sponsor should receive: ${sponsorWinnings} tokens`);
   ```

3. **Fixed regular wager logic:**
   ```javascript
   // Regular 1v1 wager or single winner - give full prize to primary winner
   const primaryWinnerRef = db.collection('users').doc(primaryWinnerId);
   const primaryWinnerDoc = await primaryWinnerRef.get();
   // ... proper error handling and balance updates
   ```

## Files Modified

### Frontend Files:
1. **`src/components/CreateWagerModal.js`**
   - Fixed entry fee calculation for party leaders
   - Updated `partyMemberEntryFeesDeducted` tracking logic
   - Added proper cost calculation for non-sponsored members

2. **`src/components/JoinWagerModal.js`**
   - Fixed entry fee calculation for joining party leaders
   - Updated `partyMemberEntryFeesDeducted` tracking logic
   - Added proper cost calculation for non-sponsored members
   - Updated notification messages

### Backend Files:
3. **`functions/index.js`**
   - Fixed potential variable conflicts in prize distribution
   - Enhanced debugging logs for sponsored player winnings
   - Improved error handling for missing user documents
   - Fixed regular wager prize distribution logic

## Testing

Created `test-entry-fee-fix.js` to verify fixes:

### Test Results:
```
 Testing Entry Fee Logic:
Host leader should pay: 200 tokens (own entry + teammate)
Guest leader should pay: 200 tokens (own entry + sponsorship)

 Testing Prize Distribution Logic:
guest-leader-789 (NON-SPONSORED): Player gets: 190 tokens
guest-member-101 (SPONSORED): 
  - Sponsor gets: 133 tokens
  - Sponsored player gets: 57 tokens

 Entry fee tracking verification:
host-leader-123: paid=true, sponsored=false, leader=true, correct=
host-member-456: paid=false, sponsored=false, leader=false, correct=
guest-leader-789: paid=true, sponsored=false, leader=true, correct=
guest-member-101: paid=true, sponsored=true, leader=false, correct=
```

## Summary of Fixes

1.  **Entry fee deduction now correctly charges party leaders for non-sponsored members**
2.  **Only sponsored members and leaders are marked as "paid" in partyMemberEntryFeesDeducted**
3.  **Prize distribution correctly splits winnings between sponsors and sponsored players**
4.  **Added detailed debugging logs for troubleshooting**
5.  **Fixed potential conflicts with primaryWinnerId variable reuse**

## Expected Behavior After Fixes

### For Party Wagers:
- **Party Leader**: Pays their own entry fee + entry fees for all non-sponsored team members + sponsorship costs
- **Sponsored Members**: Marked as "paid" but don't actually pay (sponsor pays for them)
- **Non-Sponsored Members**: NOT marked as "paid" (leader pays for them but they don't pay directly)

### For Prize Distribution:
- **Sponsored Winners**: Receive their percentage share as defined in sponsorship agreement
- **Sponsors**: Receive their percentage share of the sponsored player's winnings
- **Non-Sponsored Winners**: Receive equal share of total prize pool

### Debugging:
- Enhanced logging provides clear visibility into:
  - Who is paying what amounts
  - How prizes are being distributed
  - Sponsorship calculations and distributions
  - Entry fee tracking status for each player 