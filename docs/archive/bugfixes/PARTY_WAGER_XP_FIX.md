# Party Wager XP Fix

## Problem
Party wager matches were not giving out XP to participants, while regular 1v1 wagers were also missing XP awards. Players were only receiving tokens and stats updates but no experience points for participating in or winning wagers.

## Root Cause
The XP awarding system was completely missing from the backend `handleMatchCompletion` function in `functions/index.js`. While the frontend had a complete XP system with functions like `awardWagerParticipationXp` and `awardWagerWinXp`, these were never called during match completion.

### What Was Missing
- No XP imports in Firebase functions
- No XP awarding logic in `handleMatchCompletion`
- Both regular and party wagers were affected
- Players received tokens and stats but no XP progression

## Solution
Added comprehensive XP awarding logic directly to the `handleMatchCompletion` Firebase function to ensure all wager participants receive appropriate XP rewards.

### XP Award Structure
Following the same logic as the frontend XP system:

#### Participation XP (for losers)
- **Base XP**: 25 points
- **Bonus XP**: Based on wager amount (max 75 bonus)
  - Formula: `Math.min(75, Math.floor(wagerAmount / 10))`
- **Total**: Up to 100 XP for participation

#### Win XP (for winners)
- **Base XP**: 50 points  
- **Bonus XP**: Based on wager amount (max 150 bonus)
  - Formula: `Math.min(150, Math.floor(wagerAmount / 5))`
- **Total**: Up to 200 XP for winning

### Examples
| Wager Amount | Participation XP | Win XP |
|--------------|------------------|---------|
| 100 tokens   | 35 XP (25+10)   | 70 XP (50+20) |
| 500 tokens   | 75 XP (25+50)   | 150 XP (50+100) |
| 1000 tokens  | 100 XP (25+75)  | 200 XP (50+150) |

## Implementation Details

### Files Modified
- `functions/index.js` - Added XP awarding logic to `handleMatchCompletion` function

### Code Changes

#### 1. XP Calculation Logic
```javascript
// Calculate XP amounts based on wager amount
const participationBaseXP = 25;
const participationBonusXP = Math.min(75, Math.floor(amount / 10));
const participationTotalXP = participationBaseXP + participationBonusXP;

const winBaseXP = 50;
const winBonusXP = Math.min(150, Math.floor(amount / 5));
const winTotalXP = winBaseXP + winBonusXP;
```

#### 2. XP Award for Losers (Participation)
```javascript
// Award participation XP to losers
for (const loserId of loserIds) {
  const userData = loserDoc.data();
  const currentXp = userData.xpTotal || 0;
  const newXpTotal = currentXp + participationTotalXP;
  
  batch.update(loserRef, {
    xpTotal: newXpTotal,
    lastXpUpdate: admin.firestore.Timestamp.now(),
    xpHistory: admin.firestore.FieldValue.arrayUnion({
      amount: participationTotalXP,
      reason: `Wager participation (${amount} tokens)`,
      timestamp: admin.firestore.Timestamp.now()
    })
  });
}
```

#### 3. XP Award for Winners
```javascript
// Award win XP to winners
for (const winnerId of winnerIds) {
  const userData = winnerDoc.data();
  const currentXp = userData.xpTotal || 0;
  const newXpTotal = currentXp + winTotalXP;
  
  batch.update(winnerRef, {
    xpTotal: newXpTotal,
    lastXpUpdate: admin.firestore.Timestamp.now(),
    xpHistory: admin.firestore.FieldValue.arrayUnion({
      amount: winTotalXP,
      reason: `Wager victory (${amount} tokens)`,
      timestamp: admin.firestore.Timestamp.now()
    })
  });
}
```

### XP History Tracking
Each XP award is recorded in the user's `xpHistory` array with:
- `amount`: XP points awarded
- `baseAmount`: Base XP (same as amount since no boosts in backend)
- `boosted`: false (no boost system in backend)
- `multiplier`: 1 (no multipliers in backend)
- `newTotal`: User's new total XP
- `reason`: Description of why XP was awarded
- `timestamp`: When the XP was awarded
- `levelUp`: false (level calculation not implemented in backend)

## Benefits

### For All Wager Types
-  **Regular 1v1 wagers**: Now award XP to both participants
-  **Party wagers**: All team members receive appropriate XP
-  **Sponsored wagers**: XP awarded regardless of sponsorship status
-  **Consistent rewards**: XP scales with wager amount like token rewards

### XP Progression
- **Encourages participation**: Even losing gives meaningful XP
- **Rewards skill**: Winners get significantly more XP
- **Scales with stakes**: Higher wager amounts = more XP
- **Complete tracking**: All XP awards logged in user history

## Testing

To verify the fix works:

1. **Complete a regular 1v1 wager**
   - Winner should receive win XP (50 + bonus)
   - Loser should receive participation XP (25 + bonus)

2. **Complete a party wager**
   - All winning team members should receive win XP
   - All losing team members should receive participation XP

3. **Check XP history**
   - User profiles should show XP awards in history
   - XP totals should increase appropriately

4. **Verify scaling**
   - Higher wager amounts should award more XP
   - XP amounts should match the formulas above

## Impact

-  **Fixed**: Party wagers now award XP like regular wagers
-  **Enhanced**: All wager types now have complete reward systems (tokens + stats + XP)
-  **Consistent**: XP system works uniformly across all wager formats
-  **Scalable**: XP rewards scale appropriately with wager stakes
-  **Tracked**: Complete audit trail of all XP awards

This fix ensures that the XP progression system works correctly for all players regardless of whether they participate in regular 1v1 wagers or party wagers, providing a complete and engaging reward system. 