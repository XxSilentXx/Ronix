// ReferralCode model
/**
 * @typedef {Object} ReferralCode
 * @property {string} referralCode
 * @property {string} creatorUserId
 * @property {number} payoutRate
 * @property {number} uses
 * @property {number} totalReferredAmount
 * @property {number} totalEarned
 * @property {boolean} isActive
 * @property {string} createdAt
 */

// ReferralUsage model
/**
 * @typedef {Object} ReferralUsage
 * @property {string} userId
 * @property {string} referralCode
 * @property {string} coinPackage
 * @property {number} amountSpent
 * @property {number} payoutGenerated
 * @property {string} timestamp
 * @property {string} userIp
 * @property {string} deviceId
 */

// CreatorPayoutStatus model
/**
 * @typedef {Object} CreatorPayoutStatus
 * @property {string} creatorUserId
 * @property {boolean} payoutRequested
 * @property {string} lastPaidOut
 * @property {number} pendingAmount
 * @property {number} threshold
 */

// ReferralPayoutHistory model
/**
 * @typedef {Object} ReferralPayoutHistory
 * @property {string} creatorUserId
 * @property {number} amount
 * @property {string} paidAt
 * @property {string} method
 * @property {string} transactionId
 */ 