/**
 * Audio utility functions for playing notification and game sounds
 */

// Keep a map of loaded audio elements to avoid reloading them
const audioCache = {};

// Define sound file paths
const SOUND_FILES = {
  join: '/sounds/wager-join.mp3',
  notification: '/sounds/notification.mp3',
  ready: '/sounds/ready.mp3',
  win: '/sounds/win.mp3',
  lose: '/sounds/lose.mp3',
  // Add your custom sounds here
  custom1: '/sounds/your-custom-sound.mp3',
  matchStart: '/sounds/match-start.mp3',
  levelUp: '/sounds/level-up.mp3',
  coins: '/sounds/coins.mp3'
};

/**
 * Play a notification sound when someone joins a wager
 * 
 * @param {string} type - Type of sound to play (join, ready, notification, or custom sound name)
 * @param {number} volume - Volume from 0 to 1
 */
export const playNotificationSound = (type = 'join', volume = 0.5) => {
  // Check if sounds are enabled
  const soundsEnabled = localStorage.getItem('soundsEnabled') !== 'false';
  if (!soundsEnabled) return;

  try {
    // First try to play a sound file if available
    const soundPath = SOUND_FILES[type];
    
    if (soundPath) {
      // Play from sound file
      const baseUrl = process.env.PUBLIC_URL || '';
      const fullPath = `${baseUrl}${soundPath}`;
      playAudioFile(fullPath, volume);
      return;
    }
    
    // Fallback to generated sounds if no sound file is available
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    let oscillator;
    let gainNode;
    
    // Different sound patterns based on type
    switch (type) {
      case 'join':
        // Create a "joined" notification sound
        gainNode = audioContext.createGain();
        gainNode.gain.value = volume;
        gainNode.connect(audioContext.destination);
        
        // First note
        oscillator = audioContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(587.33, audioContext.currentTime); // D5
        oscillator.connect(gainNode);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.15);
        
        // Second note (higher)
        const oscillator2 = audioContext.createOscillator();
        oscillator2.type = 'sine';
        oscillator2.frequency.setValueAtTime(880, audioContext.currentTime + 0.2); // A5
        oscillator2.connect(gainNode);
        oscillator2.start(audioContext.currentTime + 0.2);
        oscillator2.stop(audioContext.currentTime + 0.35);
        break;
        
      case 'ready':
        // Create a "ready" notification sound (different pattern)
        gainNode = audioContext.createGain();
        gainNode.gain.value = volume;
        gainNode.connect(audioContext.destination);
        
        // First note
        oscillator = audioContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        oscillator.connect(gainNode);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
        
        // Second note (higher)
        const oscillator3 = audioContext.createOscillator();
        oscillator3.type = 'sine';
        oscillator3.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
        oscillator3.connect(gainNode);
        oscillator3.start(audioContext.currentTime + 0.1);
        oscillator3.stop(audioContext.currentTime + 0.2);
        
        // Third note (even higher)
        const oscillator4 = audioContext.createOscillator();
        oscillator4.type = 'sine';
        oscillator4.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
        oscillator4.connect(gainNode);
        oscillator4.start(audioContext.currentTime + 0.2);
        oscillator4.stop(audioContext.currentTime + 0.3);
        break;
        
      default: // generic notification
        // Create a generic notification sound
        gainNode = audioContext.createGain();
        gainNode.gain.value = volume;
        gainNode.connect(audioContext.destination);
        
        oscillator = audioContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime); // E5
        oscillator.connect(gainNode);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2);
        break;
    }
  } catch (e) { /* do nothing */ }
};

/**
 * Play a custom audio file
 * 
 * @param {string} url - URL to the audio file
 * @param {number} volume - Volume from 0 to 1
 */
export const playAudioFile = (url, volume = 0.5) => {
  // Check if sounds are enabled
  const soundsEnabled = localStorage.getItem('soundsEnabled') !== 'false';
  if (!soundsEnabled) return;
  
  try {
    // Check if this audio is already loaded
    if (!audioCache[url]) {
      audioCache[url] = new Audio(url);
    }
    
    const audio = audioCache[url];
    audio.volume = volume;
    
    // Reset in case it was already playing
    audio.pause();
    audio.currentTime = 0;
    
    // Play the sound
    audio.play().catch(() => {});
  } catch (e) { /* do nothing */ }
};

/**
 * Toggle sounds on/off
 * @param {boolean} enabled - Whether sounds should be enabled
 * @returns {boolean} - Current sound state after toggle
 */
export const toggleSounds = (enabled) => {
  if (typeof enabled === 'boolean') {
    localStorage.setItem('soundsEnabled', enabled.toString());
    return enabled;
  } else {
    const current = localStorage.getItem('soundsEnabled') !== 'false';
    localStorage.setItem('soundsEnabled', (!current).toString());
    return !current;
  }
};

/**
 * Check if sounds are enabled
 * @returns {boolean} - Whether sounds are enabled
 */
export const areSoundsEnabled = () => {
  return localStorage.getItem('soundsEnabled') !== 'false';
};
