/**
 * Sound utility functions for playing notification and game sounds
 */

// Sound cache to prevent reloading sounds
const soundCache = {};

/**
 * Preload a sound for faster playback
 * 
 * @param {string} soundName - The name of the sound file without extension
 * @returns {Promise} - Promise that resolves when the sound is loaded
 */
export const preloadSound = async (soundName) => {
  if (soundCache[soundName]) {
    return Promise.resolve(soundCache[soundName]);
  }
  
  try {
    const soundUrl = require(`../assets/sounds/${soundName}.mp3`);
    const audio = new Audio(soundUrl);
    
    // Return a promise that resolves when the audio is loaded
    return new Promise((resolve, reject) => {
      audio.addEventListener('canplaythrough', () => {
        soundCache[soundName] = audio;
        resolve(audio);
      }, { once: true });
      
      audio.addEventListener('error', (error) => {
        reject(error);
      }, { once: true });
      
      audio.load();
    });
  } catch (error) {
    return Promise.reject(error);
  }
};

/**
 * Play a sound with optional volume control
 * 
 * @param {string} soundName - The name of the sound file without extension
 * @param {number} volume - Volume level from 0 to 1, defaults to 1
 * @returns {Promise} - Promise that resolves when the sound starts playing
 */
export const playSound = async (soundName, volume = 1) => {
  try {
    // Check if sound is enabled in user preferences
    const soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
    if (!soundEnabled) {
      return;
    }
    
    // Get the cached sound or load it
    const audio = soundCache[soundName] || await preloadSound(soundName);
    
    // Reset audio to beginning if it was already playing
    audio.pause();
    audio.currentTime = 0;
    
    // Set volume and play
    audio.volume = Math.min(Math.max(volume, 0), 1); // Ensure volume is between 0 and 1
    return audio.play();
  } catch (error) {
    return Promise.reject(error);
  }
};

/**
 * Toggle sound on/off
 * 
 * @param {boolean} enabled - Whether sound should be enabled
 * @returns {boolean} - The new sound enabled state
 */
export const toggleSound = (enabled) => {
  if (typeof enabled === 'boolean') {
    localStorage.setItem('soundEnabled', enabled.toString());
    return enabled;
  } else {
    const current = localStorage.getItem('soundEnabled') !== 'false';
    localStorage.setItem('soundEnabled', (!current).toString());
    return !current;
  }
};

/**
 * Check if sound is currently enabled
 * 
 * @returns {boolean} - Whether sound is enabled
 */
export const isSoundEnabled = () => {
  return localStorage.getItem('soundEnabled') !== 'false';
};

// Sound names constants
export const SOUNDS = {
  WAGER_JOIN: 'wager-join',
  MATCH_READY: 'match-ready',
  NOTIFICATION: 'notification'
};
