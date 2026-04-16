#!/usr/bin/env node

/**
 * Deployment script for Epic Username Update System
 * 
 * This script helps deploy the Epic Username Update System to Firebase
 * and provides verification steps to ensure everything is working correctly.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log(' Epic Username Update System Deployment Script');
console.log('================================================\n');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorLog(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function step(title) {
  colorLog(`\n ${title}`, 'cyan');
  colorLog('─'.repeat(50), 'cyan');
}

function success(message) {
  colorLog(` ${message}`, 'green');
}

function warning(message) {
  colorLog(`  ${message}`, 'yellow');
}

function error(message) {
  colorLog(` ${message}`, 'red');
}

function info(message) {
  colorLog(`  ${message}`, 'blue');
}

// Check if we're in the right directory
function checkProjectStructure() {
  step('Checking Project Structure');
  
  const requiredFiles = [
    'functions/epicUsernameUpdater.js',
    'functions/index.js',
    'src/components/AdminEpicUsernameUpdater.js',
    'firebase.json'
  ];
  
  let allFilesExist = true;
  
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      success(`Found: ${file}`);
    } else {
      error(`Missing: ${file}`);
      allFilesExist = false;
    }
  });
  
  if (!allFilesExist) {
    error('Required files are missing. Please ensure you\'ve created all the necessary files.');
    process.exit(1);
  }
  
  success('All required files found!');
}

// Install dependencies
function installDependencies() {
  step('Installing Dependencies');
  
  try {
    info('Installing Node.js dependencies in functions directory...');
    execSync('cd functions && npm install', { stdio: 'inherit' });
    success('Dependencies installed successfully!');
  } catch (err) {
    error('Failed to install dependencies');
    error(err.message);
    process.exit(1);
  }
}

// Validate Firebase configuration
function validateFirebaseConfig() {
  step('Validating Firebase Configuration');
  
  try {
    const firebaseJson = JSON.parse(fs.readFileSync('firebase.json', 'utf8'));
    
    if (firebaseJson.functions) {
      success('Firebase Functions configuration found');
    } else {
      warning('Firebase Functions not configured in firebase.json');
    }
    
    if (firebaseJson.firestore) {
      success('Firestore configuration found');
    } else {
      warning('Firestore not configured in firebase.json');
    }
    
  } catch (err) {
    error('Could not read firebase.json');
    error(err.message);
  }
}

// Check API keys (without exposing them)
function checkApiKeys() {
  step('Checking API Keys Configuration');
  
  const epicUpdaterPath = 'functions/epicUsernameUpdater.js';
  const content = fs.readFileSync(epicUpdaterPath, 'utf8');
  
  if (content.includes('YOUR_EPIC_CLIENT_ID') || content.includes('your-api-key')) {
    warning('API keys appear to be placeholder values');
    warning('Please update the API keys in functions/epicUsernameUpdater.js');
  } else {
    success('API keys appear to be configured');
  }
  
  info('Please ensure these API keys are valid:');
  info('- Yunite API Key');
  info('- FortniteAPI.io API Key');
  info('- Discord Guild ID');
}

// Deploy functions
function deployFunctions() {
  step('Deploying Firebase Functions');
  
  try {
    info('Deploying Epic Username Update functions...');
    
    const functionNames = [
      'scheduleEpicUsernameUpdates',
      'updateEpicUsernames', 
      'checkUserEpicUsername'
    ];
    
    const deployCommand = `firebase deploy --only functions:${functionNames.join(',functions:')}`;
    
    info(`Running: ${deployCommand}`);
    execSync(deployCommand, { stdio: 'inherit' });
    
    success('Functions deployed successfully!');
  } catch (err) {
    error('Function deployment failed');
    error(err.message);
    process.exit(1);
  }
}

// Verify deployment
function verifyDeployment() {
  step('Verifying Deployment');
  
  info('Please verify the following in Firebase Console:');
  info('1. Check Functions tab for the three new functions');
  info('2. Verify the scheduled function is active');
  info('3. Check Cloud Scheduler for the daily schedule');
  
  info('\nTo test the system:');
  info('1. Add the AdminEpicUsernameUpdater component to your admin panel');
  info('2. Test with a single user first using the "Check User" feature');
  info('3. Monitor function logs in Firebase Console');
  
  success('Deployment verification steps provided!');
}

// Admin component integration guide
function showIntegrationGuide() {
  step('Admin Component Integration');
  
  info('To add the admin component to your dashboard:');
  
  const integrationCode = `
// 1. Import the component
import AdminEpicUsernameUpdater from '../components/AdminEpicUsernameUpdater';

// 2. Add to your admin panel JSX
function AdminPanel() {
  return (
    <div>
      {/* Other admin components */}
      <AdminEpicUsernameUpdater />
    </div>
  );
}
`;
  
  colorLog(integrationCode, 'magenta');
  
  info('Make sure only users with isAdmin: true can access this component');
}

// Show next steps
function showNextSteps() {
  step('Next Steps');
  
  info('1. Test the manual update function with the admin component');
  info('2. Monitor the first scheduled run (check Firebase Console logs)');
  info('3. Verify usernames are being updated correctly in Firestore');
  info('4. Set up monitoring alerts for function failures');
  
  warning('Remember to:');
  warning('- Test with a small subset of users first');
  warning('- Monitor API usage to avoid rate limits');
  warning('- Check that all API keys have sufficient quotas');
  
  success(' Epic Username Update System deployment complete!');
}

// Main execution
async function main() {
  try {
    checkProjectStructure();
    installDependencies();
    validateFirebaseConfig();
    checkApiKeys();
    deployFunctions();
    verifyDeployment();
    showIntegrationGuide();
    showNextSteps();
    
    colorLog('\n Deployment Summary:', 'green');
    success('Epic Username Update System is ready to use!');
    success('Check the EPIC_USERNAME_UPDATE_SYSTEM.md file for detailed documentation');
    
  } catch (err) {
    error('\nDeployment failed:');
    error(err.message);
    process.exit(1);
  }
}

// Handle process interruption
process.on('SIGINT', () => {
  warning('\nDeployment interrupted by user');
  process.exit(0);
});

// Run the script
main(); 