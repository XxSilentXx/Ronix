const axios = require('axios');
const functions = require('firebase-functions');

// Set your Discord webhook URL in environment config or as a secret
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || functions.config().discord?.webhook_url;

/**
 * Sends a message to the Discord admin alerts channel via webhook.
 * @param {string} message - The message to send to Discord.
 * @returns {Promise<void>}
 */
async function sendDiscordAdminAlert(message) {
  if (!DISCORD_WEBHOOK_URL) {
    console.error('Discord webhook URL not set.');
    return;
  }
  try {
    await axios.post(DISCORD_WEBHOOK_URL, { content: message });
    console.log('Sent Discord admin alert:', message);
  } catch (error) {
    console.error('Error sending Discord admin alert:', error);
  }
}

module.exports = { sendDiscordAdminAlert }; 