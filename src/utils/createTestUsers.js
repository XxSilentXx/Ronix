// This is a utility script for creating test users with Epic usernames
// You can run this in the browser console when logged in as an admin

import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc 
} from 'firebase/firestore';

/**
 * Creates a test user with the given details
 * @param {string} email - Email for the test user
 * @param {string} password - Password for the test user
 * @param {string} displayName - Display name for the test user
 * @param {string} epicUsername - Epic username for the test user
 * @returns {Promise<object>} - The created user object
 */
export const createTestUser = async (email, password, displayName, epicUsername) => {
  try {
    const auth = getAuth();
    const db = getFirestore();
    
    // Create the user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update the user profile with display name
    await updateProfile(user, {
      displayName: displayName
    });
    
    // Create a user document in Firestore with Epic username
    await setDoc(doc(db, 'users', user.uid), {
      email: email,
      displayName: displayName,
      epicUsername: epicUsername,
      createdAt: new Date(),
      tokens: 1000, // Give them some tokens to start with
      role: 'user'
    });
    
    return user;
  } catch (error) {
    throw error;
  }
};

/**
 * Creates multiple test users at once
 * @param {Array<object>} users - Array of user objects with email, password, displayName, and epicUsername
 * @returns {Promise<Array<object>>} - Array of created user objects
 */
export const createMultipleTestUsers = async (users) => {
  const createdUsers = [];
  
  for (const user of users) {
    try {
      const createdUser = await createTestUser(
        user.email,
        user.password,
        user.displayName,
        user.epicUsername
      );
      createdUsers.push(createdUser);
    } catch (error) {
      // No console.error statements in this file
    }
  }
  
  return createdUsers;
};

/**
 * Example usage:
 * 
 * // Import the function
 * import { createMultipleTestUsers } from './utils/createTestUsers';
 * 
 * // Create test users
 * const testUsers = [
 *   { email: 'test1@example.com', password: 'password123', displayName: 'Test User 1', epicUsername: 'TestNinja1' },
 *   { email: 'test2@example.com', password: 'password123', displayName: 'Test User 2', epicUsername: 'TestNinja2' },
 * ];
 * 
 * createMultipleTestUsers(testUsers)
 *   .then(users => console.log('Created users:', users))
 *   .catch(error => console.error('Error creating users:', error));
 */ 