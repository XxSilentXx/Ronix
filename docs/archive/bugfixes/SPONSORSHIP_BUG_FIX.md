# Sponsorship Bug Fix

## Problem
When creating a party wager with sponsorship, users were getting the error:
> "Failed to deduct tokens for one or more party members"

Even though they were sponsoring teammates who didn't have enough tokens, the system was still trying to deduct tokens from all party members instead of properly handling the sponsorship.

## Root Cause
The issue was in the `CreateWagerModal.js` component's sponsorship flow:

1. User clicks "Create Wager"
2. System detects members need sponsorship
3. Shows sponsorship modal
4. User confirms sponsorships
5. `handleSponsorshipConfirm()` calls `setSponsorships(confirmedSponsorships)` and immediately calls `createWager()`
6. **BUG**: `createWager()` checks `sponsorships.length === 0` but the state hasn't updated yet due to React's asynchronous state updates
7. System incorrectly assumes no sponsorships exist and tries to deduct tokens from all members

## Technical Details

### Before (Buggy Code):
```javascript
const handleSponsorshipConfirm = (confirmedSponsorships) => {
  setSponsorships(confirmedSponsorships);  // Async state update
  setShowSponsorshipModal(false);
  createWager();  // Called immediately - state not updated yet!
};

const createWager = async () => {
  // This check fails because sponsorships state is still []
  if (sponsorships.length === 0) {
    // Incorrectly tries to deduct from all members
    // including sponsored ones who don't have tokens
  }
};
```

### After (Fixed Code):
```javascript
const handleSponsorshipConfirm = (confirmedSponsorships) => {
  setSponsorships(confirmedSponsorships);
  setShowSponsorshipModal(false);
  createWager(confirmedSponsorships);  // Pass sponsorships directly
};

const createWager = async (confirmedSponsorships = []) => {
  // Use passed parameter instead of state
  const activeSponsorship = confirmedSponsorships.length > 0 ? confirmedSponsorships : sponsorships;
  
  if (activeSponsorship.length === 0) {
    // Now correctly detects when sponsorships exist
  }
};
```

## Files Modified

### `src/components/CreateWagerModal.js`
1. **Modified `handleSponsorshipConfirm()`**: Now passes `confirmedSponsorships` directly to `createWager()`
2. **Modified `createWager()`**: Now accepts `confirmedSponsorships` parameter
3. **Added `activeSponsorship` logic**: Uses passed parameter when available, falls back to state
4. **Updated all sponsorship references**: Changed from `sponsorships` to `activeSponsorship` throughout the function

## Logic Flow (Fixed)

### Without Sponsorship:
1. User creates party wager
2. All members have enough tokens
3. `createWager([])` called with empty array
4. `activeSponsorship.length === 0` is true
5. System deducts tokens from all members 

### With Sponsorship:
1. User creates party wager
2. Some members need sponsorship
3. Sponsorship modal shown
4. User confirms sponsorships
5. `createWager(confirmedSponsorships)` called with actual sponsorship data
6. `activeSponsorship.length > 0` is true
7. System deducts correct amount from sponsor only 

## Comparison with JoinWagerModal

The `JoinWagerModal.js` was already implemented correctly:
- It passes `confirmedSponsorships` directly to `joinWagerWithSponsorship()`
- Uses the parameter throughout instead of relying on state
- No changes needed

## Testing

To test the fix:

1. **Create a party** with a member who has insufficient tokens
2. **Create a wager** that requires sponsorship
3. **Confirm sponsorship** in the modal
4. **Verify**: 
   - No "failed to deduct tokens" error
   - Wager creates successfully
   - Only sponsor's tokens are deducted
   - Sponsored member is marked as paid

## Impact

-  **Fixed**: Sponsorship now works correctly during wager creation
-  **Maintained**: All existing functionality for non-sponsored wagers
-  **Consistent**: CreateWagerModal now matches JoinWagerModal pattern
-  **Reliable**: No more race conditions with React state updates 