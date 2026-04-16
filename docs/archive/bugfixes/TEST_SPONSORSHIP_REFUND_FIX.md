# Test Plan: Sponsorship Refund Fix Verification

## Issue Fixed
Sponsors who paid combined entry fee + sponsorship amounts were only getting refunded their entry fee, not the full amount they paid.

## Test Scenario

### Setup
1. Create a party wager with sponsorship
2. Have a sponsor pay for their own entry + sponsor another player
3. Cancel the wager
4. Verify correct refund amounts

### Expected Results After Fix

#### Before Fix (Incorrect):
- **Sponsor**: Gets only 100 tokens back (entry fee only)
- **Sponsored Player**: Gets 0 tokens back (correct)
- **Other Players**: Get their entry fees back

#### After Fix (Correct):
- **Sponsor**: Gets 200 tokens back (100 entry fee + 100 sponsorship)
- **Sponsored Player**: Gets 0 tokens back (correct)
- **Other Players**: Get their entry fees back

## How to Test

### Method 1: Monitor Logs for Next Cancellation
```bash
# Run this command and wait for a party wager cancellation
firebase functions:log --lines 10
# Refresh every few seconds to see new logs
```

### Method 2: Manual Test
1. Create a party wager with sponsorship
2. Cancel it manually in Firebase Console:
   ```javascript
   db.collection('wagers').doc('WAGER_ID').update({
     status: 'cancelled',
     cancelledAt: firebase.firestore.Timestamp.now()
   });
   ```

### Method 3: Check User Balances
1. Note user token balances before cancellation
2. Cancel the wager
3. Check balances after cancellation
4. Verify sponsors got full refunds

## Expected Log Output After Fix

Look for these log entries:
```
[refundPartyWager] Sponsorship amounts by sponsor: { 'USER_ID': 100 }
[refundPartyWager] User USER_ID transaction analysis: {
  transactionAmount: -200,
  sponsorshipAmount: 100,
  totalRefundAmount: 200,
  isSponsor: true
}
[refundPartyWager] Refunded sponsor USER_ID: 200 tokens (100 entry fee + 100 sponsorship)
```

## Verification Checklist

- [ ] Sponsor gets full amount back (entry + sponsorship)
- [ ] Sponsored player gets 0 tokens back
- [ ] Regular participants get their entry fees back
- [ ] Logs show correct transaction analysis
- [ ] Logs show proper refund breakdown
- [ ] No errors in batch commit
- [ ] User token balances are correct

## Success Criteria

 **Fix is working if:**
- Sponsors receive the full amount they paid (entry fee + sponsorship costs)
- Logs show "Refunded sponsor USER_ID: X tokens (Y entry fee + Z sponsorship)"
- No users are under-refunded or over-refunded

 **Fix needs more work if:**
- Sponsors still only get entry fee refunds
- Logs show "No separate sponsorship payment transaction found" without proper handling
- Any user gets incorrect refund amounts

The fix is now deployed and ready for testing! 