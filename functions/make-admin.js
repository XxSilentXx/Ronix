const admin = require('firebase-admin');

// Initialize Firebase Admin SDK with project ID
try {
  admin.initializeApp({
    projectId: 'tokensite-6eef3'
  });
  console.log("Firebase Admin SDK initialized successfully");
} catch (error) {
  console.error("Error initializing Firebase Admin:", error);
}

// Get user ID from command line argument
const userId = process.argv[2];

if (!userId) {
  console.error('Please provide a user ID as an argument');
  process.exit(1);
}

// Make user an admin
admin.firestore().collection('users').doc(userId).update({
  isAdmin: true,
  adminSetupAt: admin.firestore.FieldValue.serverTimestamp()
})
.then(() => {
  console.log(`User ${userId} is now an admin`);
  process.exit(0);
})
.catch(error => {
  console.error('Error making user admin:', error);
  process.exit(1);
}); 