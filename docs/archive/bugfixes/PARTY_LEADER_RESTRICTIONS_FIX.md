# Party Leader Restrictions Fix

## Problem
Party members (non-leaders) were able to create and join wagers, which should only be allowed for party leaders. This created inconsistencies in the party system and could lead to confusion about who is responsible for the party's wagers.

## Root Cause
The `JoinWagerModal` component was missing the party leader restrictions that were already implemented in the `CreateWagerModal` component.

### CreateWagerModal (Already Fixed)
-  Imports `isPartyLeader` from `useParty()` hook
-  Shows warning message: "Only the party leader can create a wager for your party."
-  Disables submit button when `currentParty && !isPartyLeader`
-  Shows notification error when non-leader tries to submit

### JoinWagerModal (Was Missing Restrictions)
-  Did not import `isPartyLeader` from `useParty()` hook
-  No warning message for non-leaders
-  No button disabling for non-leaders
-  No validation check in the join function

## Solution Implemented

### 1. Import Party Leader Status
```javascript
// Before
const { currentParty } = useParty();

// After
const { currentParty, isPartyLeader } = useParty();
```

### 2. Add Validation in Join Function
```javascript
const handleJoinWager = async () => {
  // ... existing checks ...
  
  // Check if user is in a party but not the leader
  if (currentParty && !isPartyLeader) {
    setError('Only the party leader can join wagers for your party.');
    return;
  }
  
  // ... rest of function ...
};
```

### 3. Add Visual Warning Message
```javascript
{currentParty && !isPartyLeader && (
  <div style={{ color: '#ff4757', marginBottom: '1rem', fontWeight: 'bold', textAlign: 'center' }}>
    Only the party leader can join wagers for your party.
  </div>
)}
```

### 4. Disable Join Button for Non-Leaders
```javascript
<Button 
  onClick={handleJoinWager}
  $disabled={isSubmitting || balance < wager.amount || (currentParty && !isPartyLeader)}
  disabled={isSubmitting || balance < wager.amount || (currentParty && !isPartyLeader)}
>
  {isSubmitting ? 'Joining...' : 'Join Wager'}
</Button>
```

## Files Modified

### `src/components/JoinWagerModal.js`
- Added `isPartyLeader` import from `useParty()` hook
- Added party leader validation in `handleJoinWager()` function
- Added visual warning message for non-leaders
- Added button disabling for non-leaders

## How Party Leader Status is Determined

The `isPartyLeader` value comes from the `PartyContext`:

```javascript
// In src/contexts/PartyContext.js
isPartyLeader: currentParty && currentUser ? currentParty.leader === currentUser.uid : false
```

This checks if:
1. There is a current party
2. There is a current user
3. The current user's UID matches the party's leader field

## Testing the Fix

### Test Case 1: Party Leader
1. Create a party and become the leader
2. Try to create a wager  Should work
3. Try to join a wager  Should work

### Test Case 2: Party Member (Non-Leader)
1. Join someone else's party (not as leader)
2. Try to create a wager  Should show error and disable button
3. Try to join a wager  Should show error and disable button

### Test Case 3: Solo Player (No Party)
1. Leave any party or don't join one
2. Try to create a wager  Should work
3. Try to join a wager  Should work

## Additional Security

The party leader restrictions are enforced at the UI level. For additional security, the backend cloud functions should also validate party leadership before processing wager creation or joining requests.

## Related Components

- `CreateWagerModal.js` - Already had proper restrictions
- `JoinWagerModal.js` - Fixed in this update
- `PartyContext.js` - Provides `isPartyLeader` status
- `WagerMatch.js` - Uses party leader restrictions for match actions

## Future Considerations

Consider adding server-side validation in Firebase Cloud Functions to ensure party leader restrictions are enforced even if the frontend is bypassed. 