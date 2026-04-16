# HIGH ROLLER TRACKING SYSTEM - COMPLETELY REBUILT

## Overview
The high roller achievement tracking system has been completely rebuilt from the ground up with comprehensive logging and robust error handling. This system tracks when users win wagers of 5+ coins and unlocks the "High Roller" achievement after 10 such wins.

## New Architecture

### 1. Dedicated High Roller Tracking Function
- **Function**: `trackHighRollerProgress`
- **Purpose**: Exclusively handles high roller win tracking
- **Features**:
  - Comprehensive logging at every step
  - Input validation and error handling
  - Automatic achievement unlocking at 10 wins
  - Source tracking for debugging

### 2. Progress Retrieval Function
- **Function**: `getHighRollerProgress`
- **Purpose**: Retrieve current progress for a user
- **Returns**: Current wins, threshold, remaining, unlock status

### 3. Comprehensive Test System
- **Function**: `testHighRollerSystem`
- **Purpose**: End-to-end testing of the entire system
- **Admin only**: Requires admin privileges

## Implementation Details

### Core Functions

#### trackHighRollerProgress
```javascript
exports.trackHighRollerProgress = functions.https.onCall(async (data, context) => {
  // Comprehensive logging and validation
  // Increment high roller wins
  // Check for achievement unlock
  // Return detailed progress information
});
```

**Parameters**:
- `wagerAmount`: Number (required) - Amount of the wager won
- `source`: String (optional) - Source of the tracking call for debugging

**Returns**:
```javascript
{
  success: true,
  userId: "user_id",
  wagerAmount: 7,
  source: "match_completion",
  progress: {
    currentHighRollerWins: 3,
    threshold: 10,
    remaining: 7
  },
  achievementUnlocked: false,
  timestamp: "2024-01-15T10:30:00.000Z"
}
```

#### getHighRollerProgress
```javascript
exports.getHighRollerProgress = functions.https.onCall(async (data, context) => {
  // Retrieve and return current progress
});
```

**Returns**:
```javascript
{
  success: true,
  progress: {
    highRollerWins: 3,
    threshold: 10,
    remaining: 7,
    isUnlocked: false,
    lastWin: {
      timestamp: "...",
      wagerAmount: 7,
      source: "match_completion"
    }
  }
}
```

### Integration Points

#### 1. Match Completion (`handleMatchCompletion`)
```javascript
// Track high roller win if applicable
if (amount >= 5) {
  const trackHighRoller = exports.trackHighRollerProgress;
  const result = await trackHighRoller({
    wagerAmount: amount,
    source: 'match_completion'
  }, { auth: { uid: winnerId } });
}
```

#### 2. Transaction Processing (`updateUserStatsOnTransaction`)
```javascript
// Track high roller win if last reward was 5+ coins
if (lastRewardAmount >= 5) {
  const trackHighRoller = exports.trackHighRollerProgress;
  const result = await trackHighRoller({
    wagerAmount: lastRewardAmount,
    source: 'transaction_reward'
  }, { auth: { uid: userId } });
}
```

## Data Structure

### userAchievements Collection
```javascript
{
  userId: "user_id",
  unlockedAchievements: ["achievement_high_roller"], // If unlocked
  highRollerWins: 10,
  lastHighRollerWin: {
    timestamp: Timestamp,
    wagerAmount: 8,
    source: "match_completion"
  },
  // ... other achievement data
  updatedAt: Timestamp
}
```

## Logging System

### Log Levels and Prefixes
- `[HIGH_ROLLER_TRACKING]` - Main tracking function logs
- `[HIGH_ROLLER_UNLOCK]` - Achievement unlock process logs
- `[HIGH_ROLLER_GET]` - Progress retrieval logs
- `[HIGH_ROLLER_TEST]` - System testing logs

### Log Examples
```
[HIGH_ROLLER_TRACKING] === STARTING HIGH ROLLER TRACKING ===
[HIGH_ROLLER_TRACKING] Processing for userId: abc123
[HIGH_ROLLER_TRACKING] Wager amount: 7
[HIGH_ROLLER_TRACKING]  Current high roller wins: 3
[HIGH_ROLLER_TRACKING]  Incrementing to: 4
[HIGH_ROLLER_TRACKING]  Successfully saved! New high roller wins: 4
```

## Testing and Debugging

### Admin Dashboard Controls
1. ** +5 High Roller Wins (NEW)** - Add 5 wins with logging
2. ** Get High Roller Progress** - Check current progress
3. ** +1 High Roller Win** - Add single win for testing
4. ** Test High Roller System** - Run comprehensive end-to-end test

### Comprehensive Test Function
The `testHighRollerSystem` function runs 5 tests:
1. Get initial progress
2. Add a high roller win
3. Get updated progress
4. Test with amount below threshold
5. Verify Firestore data directly

## Error Handling

### Input Validation
- Authentication check
- wagerAmount validation (must be number)
- Threshold check (must be >= 5)

### Comprehensive Error Logging
```javascript
try {
  // Main logic
} catch (error) {
  console.error(`[HIGH_ROLLER_TRACKING]  FATAL ERROR:`, error);
  console.error(`[HIGH_ROLLER_TRACKING] Error stack:`, error.stack);
  throw new functions.https.HttpsError('internal', `High roller tracking failed: ${error.message}`);
}
```

## Achievement Unlock Process

### Automatic Unlock at 10 Wins
When a user reaches 10 high roller wins:
1. Check if already unlocked
2. Update `userAchievements` document
3. Update `userCosmetics` document with reward
4. Comprehensive logging throughout

### Achievement Definition
```javascript
{
  id: 'achievement_high_roller',
  name: 'High Roller',
  description: 'Win 10 wagers of 5+ coins.',
  cosmeticReward: 'card_high_roller',
  criteria: { type: 'custom', key: 'high_roller_wins', value: 10 }
}
```

## Troubleshooting

### Common Issues and Solutions

1. **Function not found**: Ensure functions are deployed
2. **Progress not incrementing**: Check logs for validation failures
3. **Achievement not unlocking**: Verify 10 wins reached and not already unlocked

### Debug Steps
1. Check Cloud Function logs in Firebase Console
2. Use admin dashboard test functions
3. Verify Firestore data directly
4. Run comprehensive system test

### Log Monitoring
Search for these patterns in Cloud Function logs:
- `[HIGH_ROLLER_TRACKING]` - Main tracking activity
- ` FATAL ERROR` - Critical failures
- ` HIGH ROLLER ACHIEVEMENT UNLOCKED` - Successful unlocks

## Deployment Notes

### Required Functions
- `trackHighRollerProgress` - Main tracking function
- `getHighRollerProgress` - Progress retrieval
- `testHighRollerSystem` - Testing function (admin only)

### Dependencies
- Original `trackAchievementProgress` still exists for other achievements
- `MASTER_ACHIEVEMENTS` array for achievement definitions
- Firestore collections: `userAchievements`, `userCosmetics`

## Future Improvements

1. **Batch Processing**: Handle multiple wins in single transaction
2. **Historical Tracking**: Store complete win history
3. **Performance Optimization**: Cache progress data
4. **Real-time Updates**: WebSocket notifications for achievement unlocks

---

This rebuilt system provides a robust, well-logged, and thoroughly testable high roller achievement tracking system with comprehensive error handling and debugging capabilities. 