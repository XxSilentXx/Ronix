# Epic Username Updater - Quick Setup Guide

##  What This Does

Automatically checks and updates users' Epic Games usernames daily to ensure they match their current Epic usernames. For example, if a user changes from "Bob" to "Joe" in Epic Games, this system will detect and update their username in your database.

##  Files Created

1. **`functions/epicUsernameUpdater.js`** - Core Firebase Functions for the update system
2. **`src/components/AdminEpicUsernameUpdater.js`** - Admin interface component
3. **`EPIC_USERNAME_UPDATE_SYSTEM.md`** - Detailed documentation
4. **`deploy-epic-username-updater.js`** - Deployment helper script

##  Quick Deployment Steps

### 1. Deploy the Firebase Functions
```bash
cd functions
npm install
firebase deploy --only functions:scheduleEpicUsernameUpdates,functions:updateEpicUsernames,functions:checkUserEpicUsername
```

### 2. Add Admin Component to Your Dashboard
Add this to your admin panel component:

```jsx
import AdminEpicUsernameUpdater from '../components/AdminEpicUsernameUpdater';

// In your admin dashboard JSX:
<AdminEpicUsernameUpdater />
```

### 3. Test the System
1. Go to your admin dashboard
2. Use the "Check User" feature with a specific user ID
3. Or click "Update All Epic Usernames" to test bulk updates

##  How It Works

### Automatic Updates
- **Runs daily at midnight EST** via Cloud Scheduler
- **Uses multiple APIs** for verification:
  - Yunite API (primary - via Discord ID)
  - FortniteAPI.io (fallback - via Epic ID)
  - Username verification (ensures current username still exists)

### Update Process
1. Finds all users with `epicLinked: true`
2. Checks each username via APIs
3. Updates if username changed
4. Logs all changes with history

### Admin Controls
- **Bulk Update**: Update all users at once
- **Single User Check**: Test specific users
- **Real-time Status**: See progress and results
- **Detailed Logging**: View what was updated and why

##  Database Changes

When usernames are updated, the system adds:

```javascript
// In user document:
{
  epicUsername: "NewUsername",           // Updated username
  epicUsernameUpdatedAt: Timestamp,      // When it was updated
  epicUsernameHistory: [                 // History of changes
    {
      oldUsername: "OldUsername",
      newUsername: "NewUsername",
      updatedAt: "2024-01-15T10:30:00Z",
      updateMethod: "yunite"               // or "fortnite_api"
    }
  ]
}
```

##  Configuration

The system uses your existing API keys:
- **Yunite API**: Already configured in your system
- **FortniteAPI.io**: Already configured in your system
- **Discord Guild ID**: Uses your current guild

No additional configuration needed!

##  Admin Interface Features

### Status Dashboard
- Real-time progress updates
- Color-coded results:
  -  **Green**: Successfully updated
  -  **Red**: Errors occurred
  -  **Yellow**: Needs attention
  -  **Blue**: No update needed

### Detailed Results
- Shows old → new username changes
- Displays update method used
- Lists any errors encountered
- Provides user IDs for troubleshooting

##  Monitoring

### Check Function Status
1. Go to Firebase Console → Functions
2. Look for these functions:
   - `scheduleEpicUsernameUpdates` (scheduled)
   - `updateEpicUsernames` (manual)
   - `checkUserEpicUsername` (single user)

### View Logs
1. Firebase Console → Functions → Logs
2. Look for scheduled function execution
3. Check for any errors or successful updates

### Cloud Scheduler
1. Google Cloud Console → Cloud Scheduler
2. Verify daily schedule is active
3. Check execution history

##  Troubleshooting

### Common Issues

**"No users with linked Epic accounts found"**
- Check that users have `epicLinked: true` in Firestore

**"Permission denied"**
- Ensure your user has `isAdmin: true` in Firestore

**API errors**
- Verify API keys are valid and have quota remaining
- Check Firebase Function logs for specific error messages

**Function not scheduled**
- Check Cloud Scheduler in Google Cloud Console
- Ensure the function deployed successfully

### Testing Tips

1. **Start Small**: Test with individual users first
2. **Check Logs**: Monitor Firebase Console logs during testing  
3. **Verify Data**: Check Firestore to confirm updates are working
4. **Monitor APIs**: Watch API usage to avoid rate limits

##  Expected Results

After deployment:
- **Daily automatic updates** at midnight EST
- **Manual update capability** via admin interface
- **Username history tracking** for all changes
- **Error handling** with detailed logging
- **Rate limiting** to respect API quotas

##  Success Indicators

You'll know it's working when:
-  Functions appear in Firebase Console
-  Cloud Scheduler shows the daily job
-  Admin component loads without errors
-  Test user check shows results
-  Logs show successful API calls

##  Support

If you need help:
1. Check the detailed documentation in `EPIC_USERNAME_UPDATE_SYSTEM.md`
2. Review Firebase Function logs for errors
3. Test the admin component with individual users first
4. Ensure all API keys are valid and active

---

**Next Steps**: Run the deployment commands above, then test with the admin interface! 