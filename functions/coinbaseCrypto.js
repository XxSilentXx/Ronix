require('dotenv').config();
const axios = require('axios');
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Coinbase Commerce API configuration
const COINBASE_API_KEY = process.env.COINBASE_API_KEY || functions.config().coinbase?.api_key || '';
const COINBASE_API_URL = 'https://api.commerce.coinbase.com';

// Create a new crypto payment charge
async function createCryptoCharge(userId, amount, packageId, redirectUrl = '', cancelUrl = '') {
  try {
    console.log('createCryptoCharge called with:', { userId, amount, packageId, redirectUrl, cancelUrl });
    console.log('Using COINBASE_API_KEY:', COINBASE_API_KEY ? 'Present' : 'Missing');
    const payload = {
      name: 'Token Purchase',
      description: `Purchase of ${packageId} by user ${userId}`,
      pricing_type: 'fixed_price',
      local_price: {
        amount: amount.toFixed(2),
        currency: 'USD',
      },
      metadata: {
        userId,
        packageId,
      },
      redirect_url: redirectUrl,
      cancel_url: cancelUrl,
    };

    const response = await axios.post(
      `${COINBASE_API_URL}/charges`,
      payload,
      {
        headers: {
          'X-CC-Api-Key': COINBASE_API_KEY,
          'X-CC-Version': '2018-03-22',
          'Content-Type': 'application/json',
        },
      }
    );

    const charge = response.data.data;
    return {
      success: true,
      chargeId: charge.id,
      hostedUrl: charge.hosted_url,
      code: charge.code,
    };
  } catch (error) {
    console.error('Error creating Coinbase charge:', error.response ? error.response.data : error.message);
    return { success: false, error: error.message };
  }
}

// Check the status of a charge
async function checkCryptoChargeStatus(chargeId) {
  try {
    const response = await axios.get(
      `${COINBASE_API_URL}/charges/${chargeId}`,
      {
        headers: {
          'X-CC-Api-Key': COINBASE_API_KEY,
          'X-CC-Version': '2018-03-22',
        },
      }
    );
    const charge = response.data.data;
    return {
      success: true,
      status: charge.timeline[charge.timeline.length - 1].status,
      charge,
    };
  } catch (error) {
    console.error('Error checking Coinbase charge status:', error.response ? error.response.data : error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  createCryptoCharge,
  checkCryptoChargeStatus,
}; 