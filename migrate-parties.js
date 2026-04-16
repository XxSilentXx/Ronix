const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc } = require('firebase/firestore');

// Firebase configuration - replace with your own
const firebaseConfig = {
  apiKey: "AIzaSyDApAy4GLF-kGHimmfYwoYpZmjxIjN4c_U",
  authDomain: "tokensite-6eef3.firebaseapp.com",
  projectId: "tokensite-6eef3",
  storageBucket: "tokensite-6eef3.firebasestorage.app",
  messagingSenderId: "799947602848",
  appId: "1:799947602848:web:4d415df2b6a362820982c5",
  measurementId: "G-7VD4VDJ819"
};

// Initialize Firebase
console.log("Initializing Firebase for migration...");
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateParties() {
  console.log("Starting party data migration...");
  
  try {
    // Get all parties
    const partiesRef = collection(db, 'parties');
    const partiesSnapshot = await getDocs(partiesRef);
    
    console.log(`Found ${partiesSnapshot.size} parties to migrate`);
    
    // Process each party
    for (const partyDoc of partiesSnapshot.docs) {
      const partyData = partyDoc.data();
      const partyId = partyDoc.id;
      
      console.log(`Processing party: ${partyId} - ${partyData.name || 'Unnamed Party'}`);
      
      // Extract invited users from invites array
      const invitedUsers = [];
      
      if (partyData.invites && Array.isArray(partyData.invites)) {
        partyData.invites.forEach(invite => {
          if (invite.userId && invite.status === 'pending') {
            invitedUsers.push(invite.userId);
          }
        });
      }
      
      // Update the party with the new invitedUsers field
      console.log(`Updating party with ${invitedUsers.length} invited users`);
      
      try {
        await updateDoc(doc(db, 'parties', partyId), {
          invitedUsers: invitedUsers
        });
        console.log(`Successfully updated party: ${partyId}`);
      } catch (updateError) {
        console.error(`Error updating party ${partyId}:`, updateError);
      }
    }
    
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

// Run the migration
migrateParties().then(() => {
  console.log("Migration script finished");
  process.exit(0);
}).catch(err => {
  console.error("Migration script failed:", err);
  process.exit(1);
}); 