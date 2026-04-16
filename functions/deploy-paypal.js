// This is a Node.js script to help deploy just the PayPal function
const fs = require('fs');
const { execSync } = require('child_process');

console.log('Backing up original index.js...');
if (fs.existsSync('index.js')) {
  fs.copyFileSync('index.js', 'index.js.backup');
}

console.log('Using separate-index.js for deployment...');
if (fs.existsSync('separate-index.js')) {
  fs.copyFileSync('separate-index.js', 'index.js');
}

try {
  console.log('Deploying PayPal function...');
  execSync('firebase deploy --only functions:verifyPaypalPaymentV2', { stdio: 'inherit' });
  console.log('Deployment successful!');
} catch (error) {
  console.error('Deployment failed:', error);
} finally {
  console.log('Restoring original index.js...');
  if (fs.existsSync('index.js.backup')) {
    fs.copyFileSync('index.js.backup', 'index.js');
    fs.unlinkSync('index.js.backup');
  }
}

console.log('Process completed.'); 