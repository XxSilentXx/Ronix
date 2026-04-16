const admin = require('firebase-admin');

/**
 * Adds an admin notification to Firestore.
 * @param {Object} params
 * @param {string} params.type - The type of event (e.g., 'wager_request', 'withdrawal_update').
 * @param {string} params.message - The notification message.
 * @param {Object} params.data - Additional data (user, amount, status, etc.).
 * @returns {Promise<void>}
 */
async function addAdminNotification({ type, message, data }) {
  try {
    await admin.firestore().collection('admin_notifications').add({
      type,
      message,
      data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false
    });
    console.log('Admin notification created:', type, message);
  } catch (error) {
    console.error('Error creating admin notification:', error);
  }
}

module.exports = { addAdminNotification }; 