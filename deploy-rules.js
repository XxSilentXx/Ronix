const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Deploying Firebase security rules...');

// Check if Firebase CLI is installed
exec('firebase --version', (error) => {
  if (error) {
    console.error('Error: Firebase CLI is not installed or not in PATH.');
    console.log('Please install Firebase CLI with: npm install -g firebase-tools');
    process.exit(1);
  }

  // Check if user is logged in to Firebase
  exec('firebase projects:list', (error) => {
    if (error) {
      console.error('Error: You are not logged in to Firebase.');
      console.log('Please login with: firebase login');
      process.exit(1);
    }

    // Check if firestore.rules file exists
    const rulesPath = path.join(__dirname, 'firestore.rules');
    if (!fs.existsSync(rulesPath)) {
      console.error('Error: firestore.rules file not found.');
      process.exit(1);
    }

    // Deploy Firestore rules
    console.log('Deploying Firestore rules...');
    exec('firebase deploy --only firestore:rules', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error deploying Firestore rules: ${stderr}`);
        process.exit(1);
      }
      
      console.log(stdout);
      console.log('Firestore rules deployed successfully!');
    });
  });
}); 