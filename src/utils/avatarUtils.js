/**
 * Utility functions for handling user avatars consistently across the application
 */

/**
 * Gets the Discord avatar URL for a user if available, falls back to photoURL
 * @param {Object} userData - The user data object from Firestore
 * @returns {string|null} - The avatar URL or null if not available
 */
export const getAvatarUrl = (userData) => {
  // If no user data, return null
  if (!userData) return null;
  
  // Check if user has Discord linked with avatar
  if (userData.discordLinked && userData.discordId && userData.discordAvatar) {
    // Check if discordAvatar is already a full URL
    if (userData.discordAvatar.includes('http')) {
      return `${userData.discordAvatar}?t=${Date.now()}`;
    } else {
      // Otherwise construct the URL from the avatar hash
      return `https://cdn.discordapp.com/avatars/${userData.discordId}/${userData.discordAvatar}.png?t=${Date.now()}`;
    }
  }
  
  // Fall back to photoURL if available
  return userData.photoURL || null;
};

/**
 * Gets the appropriate avatar image or initial for a user component
 * @param {Object} userData - The user data object
 * @param {string} defaultImage - Optional URL to a default image
 * @returns {Object} - Object containing the avatar URL and initial
 */
export const getUserAvatar = (userData, defaultImage = null) => {
  if (!userData) return { url: defaultImage, initial: '?' };
  
  const url = getAvatarUrl(userData);
  const initial = userData.displayName ? userData.displayName.charAt(0).toUpperCase() : '?';
  
  return {
    url,
    initial
  };
};

/**
 * Gets the consistent fallback image for avatars
 * @param {number} size - The size of the avatar in pixels
 * @returns {string} - The URL to the placeholder image
 */
export const getDefaultAvatarImage = (size = 40) => {
  return `https://placehold.co/${size}x${size}`;
};
