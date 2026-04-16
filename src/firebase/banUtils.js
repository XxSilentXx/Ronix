import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  limit,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const db = getFirestore();

/**
 * Check if user is currently banned
 */
export const checkUserBanStatus = async (userId) => {
  if (!userId) return { isBanned: false };

  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { isBanned: false };
    }

    const userData = userDoc.data();
    
    // Check if user is marked as banned
    if (!userData.isBanned) {
      return { isBanned: false };
    }

    // Check if ban has expired
    const banDetails = userData.banDetails;
    if (banDetails?.expirationDate && banDetails.expirationDate.toDate() < new Date()) {

      // Ban has expired, remove it
      const batch = writeBatch(db);
      
      // Update user document
      batch.update(userRef, {
        isBanned: false,
        banDetails: null,
        appealStatus: 'none'
      });

      // Find and update ban records
      const bansQuery = query(
        collection(db, 'bans'),
        where('userId', '==', userId),
        where('status', '==', 'active')
      );
      const bansSnapshot = await getDocs(bansQuery);
      
      bansSnapshot.forEach((banDoc) => {
        batch.update(banDoc.ref, { 
          status: 'expired',
          expiredAt: serverTimestamp()
        });
      });

      // Find and expire IP bans if any
      const ipBansQuery = query(
        collection(db, 'ipBans'),
        where('userId', '==', userId),
        where('status', '==', 'active')
      );
      const ipBansSnapshot = await getDocs(ipBansQuery);
      
      ipBansSnapshot.forEach((ipBanDoc) => {
        const ipBanData = ipBanDoc.data();
        if (ipBanData.expirationDate && ipBanData.expirationDate.toDate() < new Date()) {
          batch.update(ipBanDoc.ref, { 
            status: 'expired',
            expiredAt: serverTimestamp()
          });
        }
      });

      // Find and expire Epic ID bans if any
      const epicBansQuery = query(
        collection(db, 'epicIdBans'),
        where('userId', '==', userId),
        where('status', '==', 'active')
      );
      const epicBansSnapshot = await getDocs(epicBansQuery);
      
      epicBansSnapshot.forEach((epicBanDoc) => {
        const epicBanData = epicBanDoc.data();
        if (epicBanData.expirationDate && epicBanData.expirationDate.toDate() < new Date()) {
          batch.update(epicBanDoc.ref, { 
            status: 'expired',
            expiredAt: serverTimestamp()
          });
        }
      });

      await batch.commit();

      return { isBanned: false };
    }

    return {
      isBanned: true,
      banDetails: banDetails,
      appealStatus: userData.appealStatus || 'none'
    };
  } catch (error) {
    console.error('Error checking ban status:', error);
    return { isBanned: false, error: error.message };
  }
};

/**
 * Check if IP address is banned
 */
export const checkIPBanStatus = async (ipAddress) => {
  if (!ipAddress) return { isBanned: false };

  try {
    const ipBanRef = doc(db, 'ipBans', ipAddress);
    const ipBanDoc = await getDoc(ipBanRef);
    
    if (!ipBanDoc.exists()) {
      return { isBanned: false };
    }

    const ipBanData = ipBanDoc.data();
    
    // Check if ban has expired
    if (ipBanData.expirationDate && ipBanData.expirationDate.toDate() < new Date()) {
      // Ban has expired, remove it
      await updateDoc(ipBanRef, { status: 'expired' });
      return { isBanned: false };
    }

    if (ipBanData.status === 'active') {
      return {
        isBanned: true,
        banDetails: ipBanData
      };
    }

    return { isBanned: false };
  } catch (error) {
    console.error('Error checking IP ban status:', error);
    // If it's a permission error, assume not banned (only admins can read ban collections)
    if (error.code === 'permission-denied') {
      return { isBanned: false };
    }
    return { isBanned: false, error: error.message };
  }
};

/**
 * Check if Epic ID is banned
 */
export const checkEpicIdBanStatus = async (epicId) => {
  if (!epicId) return { isBanned: false };

  try {
    const epicBanRef = doc(db, 'epicIdBans', epicId);
    const epicBanDoc = await getDoc(epicBanRef);
    
    if (!epicBanDoc.exists()) {
      return { isBanned: false };
    }

    const epicBanData = epicBanDoc.data();
    
    // Check if ban has expired
    if (epicBanData.expirationDate && epicBanData.expirationDate.toDate() < new Date()) {
      // Ban has expired, remove it
      await updateDoc(epicBanRef, { status: 'expired' });
      return { isBanned: false };
    }

    if (epicBanData.status === 'active') {
      return {
        isBanned: true,
        banDetails: epicBanData
      };
    }

    return { isBanned: false };
  } catch (error) {
    console.error('Error checking Epic ID ban status:', error);
    // If it's a permission error, assume not banned (only admins can read ban collections)
    if (error.code === 'permission-denied') {
      return { isBanned: false };
    }
    return { isBanned: false, error: error.message };
  }
};

/**
 * Create a notification for banned user
 */
const createBanNotification = async (userId, banData) => {
  try {
    const notificationRef = doc(collection(db, 'users', userId, 'notifications'));
    const isPermanent = banData.duration === 'permanent';
    const durationText = isPermanent ? 'permanently' : `for ${banData.duration} hours`;
    
    const notificationData = {
      id: notificationRef.id,
      type: 'ban',
      title: 'Account Suspended',
      message: `Your account has been suspended ${durationText}. Reason: ${banData.publicReason}`,
      data: {
        banReason: banData.publicReason,
        duration: banData.duration,
        isPermanent: isPermanent,
        canAppeal: true
      },
      timestamp: serverTimestamp(),
      read: false
    };
    
    await setDoc(notificationRef, notificationData);

  } catch (error) {
    console.error('Error creating ban notification:', error);
  }
};

/**
 * Ban a user
 */
export const banUser = async (targetUserId, banData, adminUserId) => {
  if (!targetUserId || !banData || !adminUserId) {
    throw new Error('Missing required parameters for banning user');
  }

  try {
    const batch = writeBatch(db);
    const banId = doc(collection(db, 'bans')).id;
    
    // Get target user data
    const userRef = doc(db, 'users', targetUserId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    
    // Get admin data
    const adminRef = doc(db, 'users', adminUserId);
    const adminDoc = await getDoc(adminRef);
    const adminData = adminDoc.exists() ? adminDoc.data() : {};

    const now = serverTimestamp();
    const expirationDate = banData.duration === 'permanent' ? null : 
      new Date(Date.now() + (banData.duration * 60 * 60 * 1000)); // duration in hours

    // Update user document
    const userBanDetails = {
      banId: banId,
      reason: banData.reason,
      publicReason: banData.publicReason,
      adminNotes: banData.adminNotes || '',
      bannedBy: adminUserId,
      banDate: now,
      expirationDate: expirationDate,
      ipBanned: banData.ipBan || false,
      epicIdBanned: banData.epicIdBan || false
    };

    batch.update(userRef, {
      isBanned: true,
      banDetails: userBanDetails,
      appealStatus: 'none'
    });

    // Create ban record
    const banRecord = {
      banId: banId,
      userId: targetUserId,
      username: userData.displayName || userData.email || 'Unknown',
      reason: banData.reason,
      publicReason: banData.publicReason,
      adminNotes: banData.adminNotes || '',
      bannedBy: adminUserId,
      adminName: adminData.displayName || adminData.email || 'Unknown Admin',
      banDate: now,
      expirationDate: expirationDate,
      ipBanned: banData.ipBan || false,
      epicIdBanned: banData.epicIdBan || false,
      status: 'active',
      appealId: null
    };

    batch.set(doc(db, 'bans', banId), banRecord);

    // Create IP ban if requested
    if (banData.ipBan && userData.currentIp) {
      const ipBanData = {
        ip: userData.currentIp,
        userId: targetUserId,
        username: userData.displayName || userData.email || 'Unknown',
        reason: banData.reason,
        bannedBy: adminUserId,
        banDate: now,
        expirationDate: expirationDate,
        status: 'active'
      };
      batch.set(doc(db, 'ipBans', userData.currentIp), ipBanData);
    }

    // Create Epic ID ban if requested
    if (banData.epicIdBan && userData.epicId) {
      const epicBanData = {
        epicId: userData.epicId,
        userId: targetUserId,
        username: userData.displayName || userData.email || 'Unknown',
        reason: banData.reason,
        bannedBy: adminUserId,
        banDate: now,
        expirationDate: expirationDate,
        status: 'active'
      };
      batch.set(doc(db, 'epicIdBans', userData.epicId), epicBanData);
    }

    await batch.commit();
    await createBanNotification(targetUserId, banData);
    return { success: true, banId: banId };
  } catch (error) {
    console.error('Error banning user:', error);
    throw error;
  }
};

/**
 * Unban a user
 */
export const unbanUser = async (userId, adminUserId) => {
  if (!userId || !adminUserId) {
    throw new Error('Missing required parameters for unbanning user');
  }

  try {
    const batch = writeBatch(db);
    
    // Update user document
    const userRef = doc(db, 'users', userId);
    batch.update(userRef, {
      isBanned: false,
      banDetails: null,
      appealStatus: 'none'
    });

    // Find and update ban records
    const bansQuery = query(
      collection(db, 'bans'),
      where('userId', '==', userId),
      where('status', '==', 'active')
    );
    const bansSnapshot = await getDocs(bansQuery);
    
    bansSnapshot.forEach((banDoc) => {
      batch.update(banDoc.ref, { status: 'expired' });
    });

    // Find and remove IP bans
    const ipBansQuery = query(
      collection(db, 'ipBans'),
      where('userId', '==', userId),
      where('status', '==', 'active')
    );
    const ipBansSnapshot = await getDocs(ipBansQuery);
    
    ipBansSnapshot.forEach((ipBanDoc) => {
      batch.update(ipBanDoc.ref, { status: 'expired' });
    });

    // Find and remove Epic ID bans
    const epicBansQuery = query(
      collection(db, 'epicIdBans'),
      where('userId', '==', userId),
      where('status', '==', 'active')
    );
    const epicBansSnapshot = await getDocs(epicBansQuery);
    
    epicBansSnapshot.forEach((epicBanDoc) => {
      batch.update(epicBanDoc.ref, { status: 'expired' });
    });

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Error unbanning user:', error);
    throw error;
  }
};

/**
 * Submit an appeal
 */
export const submitAppeal = async (userId, appealData) => {
  if (!userId || !appealData) {
    throw new Error('Missing required parameters for appeal submission');
  }

  console.log('submitAppeal: Starting appeal submission for user:', userId);
  console.log('submitAppeal: Appeal data:', appealData);

  try {
    // Check if user is banned
    console.log('submitAppeal: Checking ban status...');
    const banStatus = await checkUserBanStatus(userId);
    console.log('submitAppeal: Ban status result:', banStatus);
    
    if (!banStatus.isBanned) {
      throw new Error('User is not currently banned');
    }

    // Check if user already has a pending appeal
    console.log('submitAppeal: Checking existing appeals...');
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    
    console.log('submitAppeal: User appeal status:', userData.appealStatus);
    if (userData.appealStatus === 'pending') {
      throw new Error('You already have a pending appeal');
    }

    // Get banId from user's banDetails, or fall back to querying bans collection
    let banId = userData.banDetails?.banId;
    
    if (!banId) {
      console.log('submitAppeal: No banId in user banDetails, falling back to bans collection query...');
      // Fallback: query bans collection for users banned before banId was stored in user data
      const bansQuery = query(
        collection(db, 'bans'),
        where('userId', '==', userId),
        where('status', '==', 'active'),
        orderBy('banDate', 'desc'),
        limit(1)
      );
      const bansSnapshot = await getDocs(bansQuery);
      
      if (bansSnapshot.empty) {
        console.error('submitAppeal: No active ban found in bans collection');
        throw new Error('No active ban found');
      }

      const banDoc = bansSnapshot.docs[0];
      banId = banDoc.data().banId;
      console.log('submitAppeal: Found banId from bans collection:', banId);
    } else {
      console.log('submitAppeal: Found banId in user data:', banId);
    }

    // Create appeal
    const appealId = doc(collection(db, 'appeals')).id;
    console.log('submitAppeal: Creating appeal with ID:', appealId);
    
    const appealRecord = {
      appealId: appealId,
      banId: banId,
      userId: userId,
      username: userData.displayName || userData.email || 'Unknown',
      appealDate: serverTimestamp(),
      reason: appealData.reason,
      evidence: appealData.evidence || [],
      status: 'pending',
      reviewedBy: null,
      reviewerName: null,
      reviewDate: null,
      adminResponse: null
    };

    console.log('submitAppeal: Appeal record to be created:', appealRecord);

    const batch = writeBatch(db);
    
    // Create appeal document
    console.log('submitAppeal: Adding appeal document to batch...');
    batch.set(doc(db, 'appeals', appealId), appealRecord);
    
    // Update user appeal status
    console.log('submitAppeal: Updating user appeal status...');
    batch.update(userRef, { appealStatus: 'pending' });
    
    console.log('submitAppeal: Committing batch...');
    await batch.commit();
    console.log('submitAppeal: Appeal submitted successfully!');
    
    return { success: true, appealId: appealId };
  } catch (error) {
    console.error('submitAppeal: Error submitting appeal:', error);
    console.error('submitAppeal: Error code:', error.code);
    console.error('submitAppeal: Error message:', error.message);
    throw error;
  }
};

/**
 * Review an appeal
 */
export const reviewAppeal = async (appealId, decision, adminResponse, adminUserId) => {
  if (!appealId || !decision || !adminUserId) {
    throw new Error('Missing required parameters for appeal review');
  }

  try {
    const batch = writeBatch(db);
    
    // Get appeal data
    const appealRef = doc(db, 'appeals', appealId);
    const appealDoc = await getDoc(appealRef);
    
    if (!appealDoc.exists()) {
      throw new Error('Appeal not found');
    }

    const appealData = appealDoc.data();
    
    // Get admin data
    const adminRef = doc(db, 'users', adminUserId);
    const adminDoc = await getDoc(adminRef);
    const adminData = adminDoc.exists() ? adminDoc.data() : {};

    // Update appeal
    batch.update(appealRef, {
      status: decision,
      reviewedBy: adminUserId,
      reviewerName: adminData.displayName || adminData.email || 'Unknown Admin',
      reviewDate: serverTimestamp(),
      adminResponse: adminResponse
    });

    // Update user appeal status
    const userRef = doc(db, 'users', appealData.userId);
    batch.update(userRef, { appealStatus: decision });

    // If appeal is approved, unban the user
    if (decision === 'approved') {
      await unbanUser(appealData.userId, adminUserId);
    }

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Error reviewing appeal:', error);
    throw error;
  }
};

/**
 * Get all active bans (admin function)
 */
export const getActiveBans = async () => {
  try {
    console.log('Starting getActiveBans query...');
    const bansQuery = query(
      collection(db, 'bans'),
      where('status', '==', 'active'),
      orderBy('banDate', 'desc')
    );
    console.log('Query created, executing...');
    const bansSnapshot = await getDocs(bansQuery);
    console.log('Query executed, docs found:', bansSnapshot.size);
    
    const bans = bansSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('Processed bans:', bans);
    return bans;
  } catch (error) {
    console.error('Error getting active bans:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    throw error;
  }
};

/**
 * Get all pending appeals (admin function)
 */
export const getPendingAppeals = async () => {
  try {
    const appealsQuery = query(
      collection(db, 'appeals'),
      where('status', '==', 'pending'),
      orderBy('appealDate', 'desc')
    );
    const appealsSnapshot = await getDocs(appealsQuery);
    
    return appealsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting pending appeals:', error);
    throw error;
  }
};

/**
 * Get user's appeal status
 */
export const getUserAppealStatus = async (userId) => {
  try {
    const appealsQuery = query(
      collection(db, 'appeals'),
      where('userId', '==', userId),
      orderBy('appealDate', 'desc'),
      limit(1)
    );
    const appealsSnapshot = await getDocs(appealsQuery);
    
    if (appealsSnapshot.empty) {
      return null;
    }

    return {
      id: appealsSnapshot.docs[0].id,
      ...appealsSnapshot.docs[0].data()
    };
  } catch (error) {
    console.error('Error getting user appeal status:', error);
    throw error;
  }
};

/**
 * Update user's IP address
 */
export const updateUserIP = async (userId, ipAddress) => {
  if (!userId || !ipAddress) return;

  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const currentIpAddresses = userData.ipAddresses || [];
      
      // Add IP to history if not already present
      if (!currentIpAddresses.includes(ipAddress)) {
        currentIpAddresses.push(ipAddress);
      }

      await updateDoc(userRef, {
        currentIp: ipAddress,
        ipAddresses: currentIpAddresses,
        lastLogin: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error updating user IP:', error);
  }
};

/**
 * Check for ban evasion attempts
 */
export const checkBanEvasion = async (userId, ipAddress, epicId) => {
  if (!userId) return { isEvasion: false };

  try {
    const suspiciousActivity = [];

    // Check IP ban
    if (ipAddress) {
      const ipBanStatus = await checkIPBanStatus(ipAddress);
      if (ipBanStatus.isBanned && ipBanStatus.banDetails.userId !== userId) {
        suspiciousActivity.push({
          type: 'ip_match',
          details: `IP address matches banned user: ${ipBanStatus.banDetails.username}`
        });
      }
    }

    // Check Epic ID ban
    if (epicId) {
      const epicBanStatus = await checkEpicIdBanStatus(epicId);
      if (epicBanStatus.isBanned && epicBanStatus.banDetails.userId !== userId) {
        suspiciousActivity.push({
          type: 'epic_id_match',
          details: `Epic ID matches banned user: ${epicBanStatus.banDetails.username}`
        });
      }
    }

    return {
      isEvasion: suspiciousActivity.length > 0,
      suspiciousActivity: suspiciousActivity
    };
  } catch (error) {
    console.error('Error checking ban evasion:', error);
    return { isEvasion: false, error: error.message };
  }
};

/**
 * Debug function to check all bans (temporary)
 */
export const debugGetAllBans = async () => {
  try {
    console.log('Starting debugGetAllBans query...');
    const bansRef = collection(db, 'bans');
    const allBansSnapshot = await getDocs(bansRef);
    console.log('Total bans in collection:', allBansSnapshot.size);
    
    const allBans = allBansSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('All bans:', allBans);
    
    // Count by status
    const statusCounts = allBans.reduce((counts, ban) => {
      const status = ban.status || 'undefined';
      counts[status] = (counts[status] || 0) + 1;
      return counts;
    }, {});
    
    console.log('Bans by status:', statusCounts);
    return allBans;
  } catch (error) {
    console.error('Error in debugGetAllBans:', error);
    throw error;
  }
};

/**
 * Clean up expired bans across all collections
 */
export const cleanupExpiredBans = async () => {
  console.log('cleanupExpiredBans: Starting cleanup of expired bans...');
  const now = new Date();
  const batch = writeBatch(db);
  let updatedCount = 0;

  try {
    // Clean up user bans
    console.log('cleanupExpiredBans: Checking user bans...');
    const usersQuery = query(
      collection(db, 'users'),
      where('isBanned', '==', true)
    );
    const usersSnapshot = await getDocs(usersQuery);
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const banDetails = userData.banDetails;
      
      if (banDetails?.expirationDate && banDetails.expirationDate.toDate() < now) {
        console.log('cleanupExpiredBans: Found expired ban for user:', userDoc.id);
        batch.update(userDoc.ref, {
          isBanned: false,
          banDetails: null,
          appealStatus: 'none'
        });
        updatedCount++;
      }
    }

    // Clean up ban records
    console.log('cleanupExpiredBans: Checking ban records...');
    const bansQuery = query(
      collection(db, 'bans'),
      where('status', '==', 'active')
    );
    const bansSnapshot = await getDocs(bansQuery);
    
    for (const banDoc of bansSnapshot.docs) {
      const banData = banDoc.data();
      if (banData.expirationDate && banData.expirationDate.toDate() < now) {
        console.log('cleanupExpiredBans: Found expired ban record:', banDoc.id);
        batch.update(banDoc.ref, {
          status: 'expired',
          expiredAt: serverTimestamp()
        });
        updatedCount++;
      }
    }

    // Clean up IP bans
    console.log('cleanupExpiredBans: Checking IP bans...');
    const ipBansQuery = query(
      collection(db, 'ipBans'),
      where('status', '==', 'active')
    );
    const ipBansSnapshot = await getDocs(ipBansQuery);
    
    for (const ipBanDoc of ipBansSnapshot.docs) {
      const ipBanData = ipBanDoc.data();
      if (ipBanData.expirationDate && ipBanData.expirationDate.toDate() < now) {
        console.log('cleanupExpiredBans: Found expired IP ban:', ipBanDoc.id);
        batch.update(ipBanDoc.ref, {
          status: 'expired',
          expiredAt: serverTimestamp()
        });
        updatedCount++;
      }
    }

    // Clean up Epic ID bans
    console.log('cleanupExpiredBans: Checking Epic ID bans...');
    const epicBansQuery = query(
      collection(db, 'epicIdBans'),
      where('status', '==', 'active')
    );
    const epicBansSnapshot = await getDocs(epicBansQuery);
    
    for (const epicBanDoc of epicBansSnapshot.docs) {
      const epicBanData = epicBanDoc.data();
      if (epicBanData.expirationDate && epicBanData.expirationDate.toDate() < now) {
        console.log('cleanupExpiredBans: Found expired Epic ID ban:', epicBanDoc.id);
        batch.update(epicBanDoc.ref, {
          status: 'expired',
          expiredAt: serverTimestamp()
        });
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      console.log(`cleanupExpiredBans: Committing ${updatedCount} updates...`);
      await batch.commit();
      console.log(`cleanupExpiredBans: Successfully cleaned up ${updatedCount} expired bans`);
    } else {
      console.log('cleanupExpiredBans: No expired bans found');
    }

    return { success: true, cleanedUp: updatedCount };
  } catch (error) {
    console.error('cleanupExpiredBans: Error cleaning up expired bans:', error);
    throw error;
  }
};

/**
 * Get ban details by ban ID (admin function)
 */
export const getBanDetails = async (banId) => {
  try {
    const banDoc = await getDoc(doc(db, 'bans', banId));
    if (banDoc.exists()) {
      return {
        id: banDoc.id,
        ...banDoc.data()
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting ban details:', error);
    throw error;
  }
}; 