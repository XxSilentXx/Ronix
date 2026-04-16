# Party Wager Refund System Enhancement

## Problem
The existing refund system for cancelled party wagers was not handling complex payment scenarios correctly. Specifically:

1. **Mixed Payment Scenarios**: When some party members paid their own entry fees while others were sponsored by the party leader
2. **Incorrect Refunds**: Sponsored players were getting refunded even though they didn't pay
3. **Missing Refunds**: Party leaders weren't getting back their sponsorship costs
4. **Scalability Issues**: System didn't properly handle larger team formats (3v3, 4v4, etc.)

## Root Cause Analysis

### Previous Refund Logic Issues
- **Simple Binary Logic**: Only checked if sponsorships existed, not who actually paid
- **No Transaction Analysis**: Didn't examine actual payment transactions to determine refunds
- **Incomplete Coverage**: Missed complex scenarios where party leaders paid for some but not all teammates
- **Poor Logging**: Limited visibility into refund decisions

### Payment Scenarios Not Handled
1. **All Members Pay**: Each party member pays their own entry fee (no sponsorships)
2. **Partial Sponsorship**: Party leader sponsors some teammates, others pay themselves
3. **Full Sponsorship**: Party leader sponsors all teammates
4. **Mixed Teams**: Different sponsorship arrangements on host vs guest teams

## Solution: Comprehensive Party Wager Refund System

### New `refundPartyWager` Function
Created a sophisticated refund system that:
1. **Analyzes Actual Transactions**: Examines all wager-related transactions to understand who paid what
2. **Handles Sponsorships Correctly**: Refunds sponsors for their sponsorship costs, not sponsored players
3. **Processes Mixed Scenarios**: Correctly handles any combination of sponsored and non-sponsored players
4. **Scales to Any Team Size**: Works for 2v2, 3v3, 4v4, and larger team formats

### Implementation Details

#### 1. Transaction Analysis
```javascript
// Get all transactions for this wager to understand who paid what
const transactionsQuery = await db.collection('transactions')
  .where('wagerId', '==', wagerId)
  .get();

const wagerTransactions = {};
transactionsQuery.docs.forEach(doc => {
  const transaction = doc.data();
  const userId = transaction.userId;
  if (!wagerTransactions[userId]) {
    wagerTransactions[userId] = [];
  }
  wagerTransactions[userId].push({
    id: doc.id,
    ...transaction
  });
});
```

#### 2. Sponsorship Refund Logic
```javascript
// 1. Handle sponsorship refunds - sponsors get their sponsorship money back
for (const sponsorship of allSponsorships) {
  const { sponsorId, sponsoredUserId, amount: sponsorshipAmount } = sponsorship;
  
  // Find the sponsorship payment transaction
  const sponsorTransactions = wagerTransactions[sponsorId] || [];
  const sponsorshipPayment = sponsorTransactions.find(t => 
    t.type === 'sponsorship_payment' && t.sponsoredUserId === sponsoredUserId
  );
  
  if (sponsorshipPayment) {
    // Refund the sponsor
    const sponsorRef = db.collection('users').doc(sponsorId);
    batch.update(sponsorRef, {
      tokenBalance: admin.firestore.FieldValue.increment(sponsorshipAmount)
    });
    
    // Remove the original sponsorship payment transaction
    batch.delete(db.collection('transactions').doc(sponsorshipPayment.id));
  }
  
  // Sponsored users don't get refunded because they didn't pay
}
```

#### 3. Regular Entry Fee Refunds
```javascript
// 2. Handle regular entry fee refunds for non-sponsored participants
const sponsoredUserIds = new Set(allSponsorships.map(s => s.sponsoredUserId));

for (const userId of participants) {
  // Skip if this user was sponsored (they didn't pay)
  if (sponsoredUserIds.has(userId)) continue;
  
  // Skip if we already processed this user as a sponsor
  if (refundedUsers.has(userId)) continue;
  
  // Find their wager entry transaction
  const userTransactions = wagerTransactions[userId] || [];
  const entryTransaction = userTransactions.find(t => t.type === 'wager_entry');
  
  if (entryTransaction) {
    // Refund their entry fee
    const userRef = db.collection('users').doc(userId);
    batch.update(userRef, {
      tokenBalance: admin.firestore.FieldValue.increment(amount)
    });
    
    // Remove the original entry transaction
    batch.delete(db.collection('transactions').doc(entryTransaction.id));
  }
}
```

## Refund Scenarios Handled

### Scenario 1: All Members Pay (No Sponsorships)
**Setup**: 3v3 match, all 6 players pay their own 100 token entry fee
**Cancellation**: Each player gets their 100 tokens back
**Result**:  All 6 players refunded 100 tokens each

### Scenario 2: Partial Sponsorship
**Setup**: 3v3 match, party leader sponsors 1 teammate, other teammate pays themselves
- Party Leader: Pays 100 (own) + 100 (sponsorship) = 200 tokens
- Teammate 1: Sponsored (pays 0)
- Teammate 2: Pays 100 tokens

**Cancellation**:
- Party Leader: Gets 200 tokens back (own entry + sponsorship cost)
- Teammate 1: Gets 0 tokens back (was sponsored)
- Teammate 2: Gets 100 tokens back (own entry)

**Result**:  Correct refunds based on who actually paid

### Scenario 3: Full Sponsorship
**Setup**: 4v4 match, party leader sponsors all 3 teammates
- Party Leader: Pays 100 (own) + 300 (3 sponsorships) = 400 tokens
- Teammates 1-3: Sponsored (pay 0 each)

**Cancellation**:
- Party Leader: Gets 400 tokens back
- Teammates 1-3: Get 0 tokens back each

**Result**:  Only the party leader gets refunded

### Scenario 4: Mixed Teams with Different Sponsorship Arrangements
**Setup**: 3v3 match with different arrangements on each team
- Host Team: Leader sponsors 1, other pays themselves
- Guest Team: All pay their own entry fees

**Cancellation**: Each team's refunds processed independently based on their payment structure
**Result**:  Correct refunds for complex mixed scenarios

## Enhanced Logging and Debugging

### Comprehensive Refund Logging
```javascript
return {
  refundedUsers: Array.from(refundedUsers),
  refundLog: [
    "Refunded sponsor UserA: 100 tokens for sponsoring UserB",
    "Sponsored user UserB: No refund (was sponsored by UserA)",
    "Refunded participant UserC: 100 tokens (entry fee)",
    "Warning: No entry transaction found for participant UserD"
  ],
  totalRefunded: refundedUsers.size
};
```

### Detailed Wager Logs
The system now adds detailed refund information to the wager document:
- Who was refunded and how much
- Why certain users weren't refunded
- Any warnings or issues encountered
- Complete audit trail of refund decisions

## Backward Compatibility

### Legacy Function Support
The original `refundSponsorships` function is maintained for backward compatibility:
```javascript
async function refundSponsorships(wagerData) {
  // For party wagers, use the comprehensive refund function
  if (wagerData.isPartyWager) {
    return await refundPartyWager(wagerData);
  }
  
  // For regular wagers, use the original logic
  // ... existing logic
}
```

### Automatic Detection
The system automatically detects party wagers and uses the appropriate refund logic:
- **Party Wagers**: Use comprehensive `refundPartyWager` function
- **Regular Wagers**: Use original simple refund logic
- **Sponsored Regular Wagers**: Use original sponsorship refund logic

## Files Modified

### Backend Changes
- `functions/sponsorship.js`
  - Added `refundPartyWager` function
  - Enhanced `refundSponsorships` with party wager detection
  - Comprehensive transaction analysis and refund logic

- `functions/index.js`
  - Updated `handleMatchCancellation` to use enhanced refund system
  - Added better logging for party wager cancellations
  - Enhanced error handling and reporting

## Benefits

### For Users
-  **Correct Refunds**: Only users who actually paid get refunded
-  **Fair Sponsorship**: Sponsors get their sponsorship costs back
-  **No Double Refunds**: Sponsored players don't get money they didn't pay
-  **Transparent Process**: Clear logging shows exactly what happened

### For System Integrity
-  **Accurate Accounting**: Refunds match actual payments made
-  **Scalable Solution**: Works for any team size and sponsorship arrangement
-  **Comprehensive Coverage**: Handles all possible payment scenarios
-  **Audit Trail**: Complete logging for debugging and verification

### for Developers
-  **Better Debugging**: Detailed logs show refund decisions
-  **Maintainable Code**: Clear separation of concerns and logic
-  **Backward Compatible**: Existing functionality preserved
-  **Extensible Design**: Easy to add new refund scenarios

## Testing Scenarios

### Test Case 1: Simple Party Wager (All Pay)
1. Create 2v2 party wager, both members pay 100 tokens
2. Cancel wager
3. Verify both members get 100 tokens back

### Test Case 2: Sponsored Party Wager
1. Create 3v3 party wager, leader sponsors 2 teammates (pays 300 total)
2. Cancel wager  
3. Verify leader gets 300 tokens back, sponsored teammates get 0

### Test Case 3: Mixed Payment Party Wager
1. Create 4v4 party wager, leader sponsors 1 teammate, others pay themselves
2. Cancel wager
3. Verify correct refunds: leader gets entry + sponsorship, sponsored gets 0, others get entry fees

### Test Case 4: Large Team Format
1. Create 5v5 party wager with various sponsorship arrangements
2. Cancel wager
3. Verify all refunds are correct based on payment structure

This enhanced refund system ensures that party wager cancellations are handled fairly and accurately, regardless of team size or sponsorship complexity. 