# Stat Reset Implementation

## Overview
The Stat Reset item has been successfully implemented to allow users to reset their wins and losses to 0 while preserving their earnings. This feature is designed to give players a fresh start with their statistics without affecting their accumulated earnings.

## How It Works

### 1. Shop Item Definition
The `stat_reset` item is already defined in the shop data (`src/data/shopData.js`):
```javascript
{
  "id": "stat_reset",
  "title": "Stat Reset",
  "description": "Reset your match stats and win rate.",
  "price": 1.99,
  "originalPrice": 2.99,
  "icon": "",
  "type": "utility"
}
```

### 2. Client-Side Implementation
When a user uses the stat reset item from their inventory (`src/contexts/ShopContext.js`):
- The system calls a secure Cloud Function instead of directly modifying the database
- The Cloud Function validates the user has a valid stat reset item
- Upon successful reset, the client refreshes the user's inventory

### 3. Server-Side Cloud Function
A new Cloud Function `processStatReset` (`functions/index.js`) handles the stat reset securely:
- **Authentication**: Verifies the user is logged in
- **Authorization**: Checks the user has a valid stat reset item in their inventory
- **Data Integrity**: Uses Firestore batch operations for atomic updates
- **Preservation**: Keeps `totalEarnings` unchanged while resetting other stats
- **Logging**: Records the stat reset operation for audit purposes

## What Gets Reset
When a stat reset is used, the following user statistics are set to 0:
- `matchesPlayed`
- `matchesWon`
- `matchesLost`
- `winRate`

## What Gets Preserved
The following data remains unchanged:
- `totalEarnings` (the user's lifetime earnings)
- `displayName`
- `userId`
- Creation timestamps

## Security Features
1. **Server-side validation**: All validation happens on the Cloud Function
2. **Inventory verification**: Ensures the user actually owns a valid stat reset item
3. **Atomic operations**: Uses Firestore batch operations to ensure data consistency
4. **Audit trail**: Logs all stat reset operations in a separate collection
5. **Error handling**: Graceful error handling with meaningful user feedback

## Usage Flow
1. User purchases a Stat Reset item from the shop
2. Item appears in their inventory with 1 use
3. User clicks "Use Item" on the Stat Reset in their inventory
4. Cloud Function is called to process the reset
5. User's stats are reset to 0 (wins, losses, matches played, win rate)
6. User's earnings remain unchanged
7. Item usage is decremented in their inventory
8. User receives confirmation notification

## Database Collections Affected
- `userStats/{userId}` - User statistics are reset
- `userInventory/{userId}` - Item usage is updated
- `statResetLogs/{logId}` - Reset operation is logged

## Error Handling
The system handles various error cases:
- User not authenticated
- No stat reset item in inventory
- Expired or used up items
- Database operation failures
- Network connectivity issues

## Testing
The implementation has been tested for:
- Successful compilation
- Proper import of required Firebase functions
- Error handling for various edge cases
- Atomic database operations

## Bundles
The Stat Reset item is also included in the "Pro Pack" bundle alongside other useful items.

## Considerations
- The stat reset is irreversible once applied
- Only affects the public statistics, not the underlying match history
- Earnings are intentionally preserved to maintain the economic integrity of the platform
- Cloud Function approach ensures data consistency and prevents client-side manipulation

## Future Enhancements
Potential future improvements could include:
- Confirmation dialog before using the item
- Ability to view stat reset history
- Different tiers of stat reset (partial vs full)
- Time-based cooldowns between resets 