# Epic Username Updater - Deployment Steps

##  Step-by-Step Deployment Guide

### 1. Verify Files Are in Place
Make sure these files exist in your project:
-  `functions/epicUsernameUpdater.js`
-  `functions/index.js` (updated with imports)
-  `src/components/AdminEpicUsernameUpdater.js`
-  `src/components/EpicUsernameTest.js`
-  `src/pages/AdminDashboard.js` (updated with components)

### 2. Deploy Firebase Functions

```bash
# Navigate to functions directory
cd functions

# Install dependencies (if not already done)
npm install

# Deploy the specific Epic Username Updater functions
firebase deploy --only functions:scheduleEpicUsernameUpdates,functions:updateEpicUsernames,functions:checkUserEpicUsername
```

**Expected Output:**
```
 functions[scheduleEpicUsernameUpdates] Successful create operation.
 functions[updateEpicUsernames] Successful create operation.
 functions[checkUserEpicUsername] Successful create operation.
```

### 3. Verify Deployment in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (`tokensite-6eef3`)
3. Navigate to **Functions** tab
4. You should see these new functions:
   - `scheduleEpicUsernameUpdates`
   - `updateEpicUsernames`
   - `checkUserEpicUsername`

### 4. Check Cloud Scheduler

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **Cloud Scheduler**
3. You should see a new scheduled job for `scheduleEpicUsernameUpdates`
4. It should be set to run daily at midnight EST

### 5. Test the Admin Interface

1. **Deploy frontend changes:**
   ```bash
   # In your project root
   npm run build
   firebase deploy --only hosting
   ```

2. **Access your admin dashboard:**
   - Go to your site's `/admin` page
   - You should see two new sections:
     - ** Epic Username Updater - Function Test**
     - **Epic Username Updater**

3. **Run the function test:**
   - Click "Test Function Deployment" button
   - You should see  "Functions are deployed and accessible!"

### 6. Test Individual User Check

1. In the Epic Username Updater section
2. Enter a User ID of someone with a linked Epic account
3. Click "Check User"
4. Verify it shows results (even if no update needed)

### 7. Verify Database Schema

After running a test, check Firestore to see if new fields were added:
- `epicUsernameUpdatedAt`
- `epicUsernameHistory` (array)

##  Configuration Check

### API Keys Verification
The system uses your existing API keys:
- **Yunite API Key**: `21713048-f175-4115-ad6f-9115aeef35cd`
- **Discord Guild ID**: `1273693076825473075`
- **FortniteAPI**: Removed (no longer used)

### Schedule Configuration
- **Frequency**: Every 24 hours
- **Time Zone**: America/New_York (EST)
- **Time**: Midnight

##  Troubleshooting

### Functions Not Deploying
```bash
# Check your Firebase project
firebase use --add

# Ensure you're authenticated
firebase login

# Try deploying all functions
firebase deploy --only functions
```

### "Permission Denied" Errors
1. Ensure your user has `isAdmin: true` in Firestore
2. Check browser console for detailed error messages
3. Verify you're logged into the correct account

### Scheduled Function Not Running
1. Check Google Cloud Console → Cloud Scheduler
2. Verify the job was created and is enabled
3. Check Firebase Functions logs for execution

### API Rate Limit Issues
- The system includes rate limiting (2-second delays)
- Monitor API usage in respective dashboards
- Consider upgrading API plans if needed

##  Monitoring

### Function Logs
1. Firebase Console → Functions → Logs
2. Look for:
   - Successful updates: `Updated user ABC123: OldName -> NewName`
   - Batch completions: `Epic username update completed: {...}`
   - Any error messages

### Database Changes
1. Firestore Console → users collection
2. Check updated users for new fields:
   - `epicUsernameUpdatedAt`
   - `epicUsernameHistory`

### Scheduled Execution
1. Google Cloud Console → Cloud Scheduler
2. Check execution history
3. Look for successful/failed runs

##  Success Checklist

- [ ] Functions deployed successfully
- [ ] Admin interface shows both test and main components
- [ ] Function test passes (shows green checkmark)
- [ ] Individual user test works
- [ ] Scheduled job visible in Cloud Scheduler
- [ ] Database shows new fields after test run
- [ ] Function logs show successful execution

##  Next Steps After Deployment

1. **Test with Known Changed Username**: Find a user who you know changed their Epic username and test the individual check
2. **Monitor First Scheduled Run**: Check logs after the first automatic execution
3. **Bulk Test**: Use the "Update All Epic Usernames" for a comprehensive test
4. **Set Up Alerts**: Configure monitoring alerts for function failures

---

**Need Help?** Check the detailed documentation in `EPIC_USERNAME_UPDATE_SYSTEM.md` or review the troubleshooting section above. 