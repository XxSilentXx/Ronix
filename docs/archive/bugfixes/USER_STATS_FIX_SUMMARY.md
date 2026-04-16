# User Stats Tracking Fix Summary

## Issues Identified and Fixed

### 1. **Inconsistent Total Earnings Calculation**
**Problem**: Two different functions were calculating earnings differently:
- `handleMatchCompletion`: Added only `prizePerPlayer` to winner's earnings 
- `updateUserStatsOnTransaction`: Added full `totalPrize` to winner's earnings

**Solution**: Updated `handleMatchCompletion` to consistently use `totalPrize` (the full amount the winner receives) for both the user's balance and total earnings tracking.

### 2. **Missing `matchesLost` Field**
**Problem**: The `updateUserStatsOnTransaction` function wasn't tracking `matchesLost`, leading to incomplete user stats.

**Solution**: Added `matchesLost` calculation and tracking in both:
- `updateUserStatsOnTransaction` function
- `handleMatchCompletion` function 
- Consistent across create and update operations

### 3. **Inconsistent Win Rate Calculation**
**Problem**: Some functions were storing win rate as a percentage (0-100), others as a decimal (0-1).

**Solution**: Standardized to store win rate as decimal (0-1) in database, which frontend correctly multiplies by 100 for display.

### 4. **Dual Stats Update Functions**
**Problem**: Both `handleMatchCompletion` and `updateUserStatsOnTransaction` were updating stats, potentially causing conflicts.

**Solution**: The `updateUserStatsOnWagerCompletion` function was already properly commented out to avoid conflicts. `handleMatchCompletion` now handles immediate stats updates, while `updateUserStatsOnTransaction` serves as a backup/recalculation mechanism.

## Files Modified

### `functions/index.js`
- **Lines 1848-1863**: Fixed winner stats update in `handleMatchCompletion`
- **Lines 1901-1923**: Fixed loser stats update in `handleMatchCompletion`  
- **Lines 2045-2110**: Added `matchesLost` calculation to `updateUserStatsOnTransaction`
- **Lines 2125-2133**: Updated return statement to include `matchesLost`

### `scripts/fix-user-stats.js` (NEW)
- Created migration script to recalculate all existing user stats from transaction data
- Ensures data consistency across all users

## Data Structure

### UserStats Document Structure
```javascript
{
  userId: string,
  displayName: string,
  matchesPlayed: number,    // Total matches entered
  matchesWon: number,       // Total matches won
  matchesLost: number,      // Total matches lost (calculated)
  winRate: number,          // Win rate as decimal (0.0 to 1.0)
  totalEarnings: number,    // Total tokens earned from wins
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Deployment Instructions

### 1. Deploy Updated Cloud Functions
```bash
# Navigate to the functions directory
cd functions

# Deploy the updated functions
firebase deploy --only functions:handleMatchCompletion,functions:updateUserStatsOnTransaction
```

### 2. Run Data Migration Script
```bash
# Navigate to the scripts directory
cd scripts

# Update the project ID in fix-user-stats.js
# Replace 'your-project-id' with your actual Firebase project ID

# Run the migration script
node fix-user-stats.js
```

### 3. Verification Steps

1. **Check Function Logs**: Monitor Firebase Function logs for any errors during deployment
2. **Test Stats Updates**: Create a test wager and complete it to verify stats update correctly
3. **Verify Data Consistency**: Use the Admin Debug panel to check that user stats are consistent
4. **Check Frontend Display**: Verify that win rates display correctly as percentages

## Expected Results

After implementing these fixes:

1. **Accurate Earnings**: Total earnings will correctly reflect the full prize amount winners receive
2. **Complete Stats**: All users will have `matchesPlayed`, `matchesWon`, and `matchesLost` tracked
3. **Consistent Win Rates**: Win rates will be stored as decimals and display correctly as percentages
4. **No Conflicts**: Single source of truth for stats updates eliminates conflicts
5. **Data Integrity**: Migration script ensures all existing data is consistent

## Testing Recommendations

1. **Create Test Wagers**: Test with small amounts to verify stats update correctly
2. **Check Multiple Users**: Verify stats accuracy across different users
3. **Monitor Logs**: Watch for any errors in function execution
4. **Verify Frontend**: Ensure all stats display correctly in Profile, Leaderboard, and User Search

## Rollback Plan

If issues occur:
1. Revert functions using: `firebase functions:config:clone --from=<previous-version>`
2. Previous user stats data is preserved (migration uses merge operations)
3. Re-run migration script if needed to recalculate stats

## Notes

- The migration script can be run multiple times safely (uses merge operations)
- Existing user stats will be recalculated from transaction history for accuracy
- Win rate calculations now properly handle edge cases (division by zero)
- All stats updates are atomic using Firestore batch operations 