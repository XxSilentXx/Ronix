# Party Wager Sponsorship Refund Fix

## Problem Identified

User `YUOz6hjiZMW4SqUu2UAJDe693FA2` sponsored user `aqSa0P4qEfQX4ABgAfyvB7j9kLN2` for 100 tokens, meaning they paid a total of 200 tokens (100 for their own entry + 100 for sponsorship). However, when the wager was cancelled, they only received 100 tokens back instead of the full 200 tokens they paid.

## Root Cause Analysis

### Transaction Structure Issue
The refund logic was looking for separate `sponsorship_payment` transactions, but the actual transaction structure was:

1. **Expected Structure** (what the refund logic looked for):
   ```
   User YUOz6hjiZMW4SqUu2UAJDe693FA2:
   - Transaction 1: wager_entry, amount: -100 (own entry fee)
   - Transaction 2: sponsorship_payment, amount: -100 (sponsoring another user)
   ```

2. **Actual Structure** (what was created):
   ```
   User YUOz6hjiZMW4SqUu2UAJDe693FA2:
   - Transaction 1: wager_entry, amount: -200 (combined entry fee + sponsorship)
   ```

### Refund Logic Failure
1. **Sponsorship Refund Step**: Looked for `sponsorship_payment` transactions → **Found none** → No sponsorship refund
2. **Participant Refund Step**: Found `wager_entry` transaction → Refunded only the base entry fee (100 tokens) instead of the full transaction amount (200 tokens)

## Solution Implemented

### Enhanced Refund Logic
Modified `refundPartyWager` function in `functions/sponsorship.js` to handle both transaction structures:

#### 1. Track Sponsorship Amounts by Sponsor
```javascript
// Track sponsorship amounts by sponsor to handle combined transactions
const sponsorshipAmountsBySponsor = {};
for (const sponsorship of allSponsorships) {
  const { sponsorId, amount: sponsorshipAmount } = sponsorship;
  if (!sponsorshipAmountsBySponsor[sponsorId]) {
    sponsorshipAmountsBySponsor[sponsorId] = 0;
  }
  sponsorshipAmountsBySponsor[sponsorId] += sponsorshipAmount;
}
```

#### 2. Handle Both Separate and Combined Transactions
```javascript
// First try to find separate sponsorship_payment transactions
const sponsorshipPayment = sponsorTransactions.find(t => 
  t.type === 'sponsorship_payment' && t.sponsoredUserId === sponsoredUserId
);

if (sponsorshipPayment) {
  // Handle separate sponsorship transaction (existing logic)
} else {
  // Will handle with combined wager_entry transaction in next step
}
```

#### 3. Enhanced Participant Refund Logic
```javascript
// Check if this user is a sponsor with combined transaction
const sponsorshipAmount = sponsorshipAmountsBySponsor[userId] || 0;
const totalRefundAmount = Math.abs(entryTransaction.amount); // Use actual transaction amount

// Refund the full amount they paid (entry fee + any sponsorships)
batch.update(userRef, {
  tokenBalance: admin.firestore.FieldValue.increment(totalRefundAmount)
});

if (sponsorshipAmount > 0) {
  refundLog.push(`Refunded sponsor ${userId}: ${totalRefundAmount} tokens (${amount} entry fee + ${sponsorshipAmount} sponsorship)`);
} else {
  refundLog.push(`Refunded participant ${userId}: ${totalRefundAmount} tokens (entry fee)`);
}
```

## Key Improvements

### 1. **Flexible Transaction Handling**
- Supports both separate `sponsorship_payment` transactions and combined `wager_entry` transactions
- Uses actual transaction amounts instead of assuming base entry fee amounts

### 2. **Accurate Refund Calculation**
- Refunds the full amount paid by each user based on their actual transactions
- Properly handles sponsors who paid entry fee + sponsorship costs

### 3. **Enhanced Logging**
- Clear distinction between sponsor refunds and participant refunds
- Shows breakdown of entry fee vs sponsorship amounts
- Better debugging information for transaction analysis

### 4. **Backward Compatibility**
- Still handles separate sponsorship transactions if they exist
- Maintains existing logic for non-sponsored participants
- No breaking changes to existing functionality

## Expected Behavior After Fix

### For the Specific Case:
- **User `YUOz6hjiZMW4SqUu2UAJDe693FA2`**: Will receive **200 tokens** back (100 entry + 100 sponsorship)
- **User `aqSa0P4qEfQX4ABgAfyvB7j9kLN2`**: Will receive **0 tokens** back (was sponsored, didn't pay)
- **Other participants**: Will receive their entry fees back based on actual amounts paid

### General Cases:
1. **Sponsors with combined transactions**: Get full amount back (entry + sponsorship)
2. **Sponsors with separate transactions**: Get both entry fee and sponsorship refunds
3. **Regular participants**: Get their entry fees back
4. **Sponsored players**: Get no refund (correct behavior)

## Testing Verification

After deployment, the logs should show:
```
[refundPartyWager] User YUOz6hjiZMW4SqUu2UAJDe693FA2 transaction analysis: {
  transactionAmount: -200,
  sponsorshipAmount: 100,
  totalRefundAmount: 200,
  isSponsor: true
}
[refundPartyWager] Refunded sponsor YUOz6hjiZMW4SqUu2UAJDe693FA2: 200 tokens (100 entry fee + 100 sponsorship)
```

## Files Modified
- `functions/sponsorship.js` - Enhanced `refundPartyWager` function with combined transaction handling

This fix ensures that sponsors receive the correct refund amount regardless of how their transactions were structured during wager creation. 