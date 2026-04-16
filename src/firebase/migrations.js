import { collection, getDocs, doc, updateDoc, query, where, limit } from 'firebase/firestore';
import { db } from './config';

// Add displayNameLower field to all existing users
export const migrateDisplayNameLower = async () => {
  try {
    console.log('Starting migration: Adding displayNameLower field to users');
    
    // Get all user documents that have a displayName but no displayNameLower
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('displayName', '!=', null)
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`Found ${querySnapshot.size} users to update`);
    
    const batchSize = 100;
    let count = 0;
    let processed = 0;
    
    // Process in smaller batches to avoid overwhelming Firestore
    for (const userDoc of querySnapshot.docs) {
      const userData = userDoc.data();
      const displayName = userData.displayName;
      
      if (displayName && (!userData.displayNameLower || userData.displayNameLower !== displayName.toLowerCase())) {
        await updateDoc(doc(db, 'users', userDoc.id), {
          displayNameLower: displayName.toLowerCase(),
          updatedAt: new Date().toISOString()
        });
        
        count++;
        console.log(`Updated user ${count}: ${displayName} -> ${displayName.toLowerCase()}`);
      }
      
      processed++;
      if (processed % 10 === 0) {
        console.log(`Processed ${processed}/${querySnapshot.size} users`);
      }
      
      // Add delay every batchSize updates to avoid rate limits
      if (count % batchSize === 0 && count > 0) {
        console.log(`Processed ${count} users, pausing for 1 second...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`Migration complete. Updated ${count} users.`);
    return { success: true, count };
  } catch (error) {
    console.error('Error during migration:', error);
    return { success: false, error: error.message };
  }
};

// Run migrations - can be called from an admin page
export const runMigrations = async () => {
  console.log('Running all migrations...');
  
  // Add migrations here
  const results = {
    displayNameLower: await migrateDisplayNameLower()
  };
  
  console.log('All migrations complete:', results);
  return results;
}; 