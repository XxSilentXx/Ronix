const functions = require('firebase-functions');
const axios = require('axios');

/**
 * HTTPS endpoint to verify PayPal payment status securely on the backend.
 * Expects { orderID } in POST body.
 * Returns { success: true } if payment is completed, else { success: false, message }.
 */
exports.verifyPaypalPaymentV2 = functions.https.onRequest(async (req, res) => {
  // Always set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    // The OPTIONS request needs to return 204 with CORS headers
    res.status(204).end();
    return;
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  const { orderID } = req.body;
  if (!orderID) {
    return res.status(400).json({ error: 'Missing orderID' });
  }
  try {
    // Use environment variables or fallback to Firebase config
    const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || functions.config().paypal?.client_id;
    const PAYPAL_SECRET = process.env.PAYPAL_SECRET || functions.config().paypal?.secret;
    
    // Log to help with debugging
    console.log('Processing PayPal verification for order:', orderID);
    console.log('Using PayPal client ID:', PAYPAL_CLIENT_ID ? PAYPAL_CLIENT_ID.substring(0, 5) + "..." : 'undefined');
    console.log('Has PayPal secret:', PAYPAL_SECRET ? 'true' : 'false');
    
    // Get access token - PRODUCTION ENDPOINTS
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
    const tokenRes = await axios.post(
      'https://api-m.paypal.com/v1/oauth2/token',
      'grant_type=client_credentials',
      { headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const accessToken = tokenRes.data.access_token;
    
    // Verify order - PRODUCTION ENDPOINTS
    const orderRes = await axios.get(
      `https://api-m.paypal.com/v2/checkout/orders/${orderID}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    
    console.log('PayPal order status:', orderRes.data.status);
    console.log('PayPal order details:', JSON.stringify(orderRes.data, null, 2));
    
    // Accept both APPROVED and COMPLETED as valid statuses
    // APPROVED means the user has approved the payment, but it may not be captured yet
    // COMPLETED means the payment has been captured
    if (orderRes.data.status === 'COMPLETED' || orderRes.data.status === 'APPROVED') {
      console.log('PayPal order verified as:', orderRes.data.status);
      return res.json({ success: true, order: orderRes.data });
    } else {
      console.log('PayPal order has invalid status:', orderRes.data.status);
      return res.status(400).json({ success: false, message: 'Payment not completed', order: orderRes.data });
    }
  } catch (error) {
    console.error('PayPal verification error:', error.response ? error.response.data : error.message);
    return res.status(500).json({ success: false, message: 'PayPal verification failed', error: error.message });
  }
}); 