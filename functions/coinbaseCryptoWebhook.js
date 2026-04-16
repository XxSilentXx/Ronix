require('dotenv').config();
const admin = require('firebase-admin');
const crypto = require('crypto');
const express = require('express');
const bodyParser = require('body-parser');
const { handleSuccessfulSquarePayment } = require('./squareUtils'); // Reuse coin crediting logic
const functions = require('firebase-functions');

const COINBASE_WEBHOOK_SECRET = process.env.COINBASE_WEBHOOK_SECRET || functions.config().coinbase?.webhook_secret || '';

const app = express();
app.use(bodyParser.json({ type: 'application/json' }));

// Helper to verify Coinbase Commerce webhook signature
function verifySignature(req) {
  const signature = req.headers['x-cc-webhook-signature'];
  const payload = JSON.stringify(req.body);
  const computed = crypto
    .createHmac('sha256', COINBASE_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  return signature === computed;
}

app.post('/', async (req, res) => {
  if (!verifySignature(req)) {
    console.error('Invalid Coinbase webhook signature');
    return res.status(400).send('Invalid signature');
  }

  const event = req.body.event;
  if (!event) return res.status(400).send('No event');

  // Only process confirmed charges
  if (event.type === 'charge:confirmed') {
    const charge = event.data;
    const { userId, packageId } = charge.metadata || {};
    const amount = parseFloat(charge.pricing.local.amount);

    if (!userId || !packageId || !amount) {
      console.error('Missing metadata in charge:', charge);
      return res.status(400).send('Missing metadata');
    }

    // Simulate paymentResult for handleSuccessfulSquarePayment
    const paymentResult = {
      paymentId: charge.id,
      amount,
      packageId,
      receiptUrl: charge.hosted_url,
    };

    try {
      await handleSuccessfulSquarePayment(paymentResult, userId);
      console.log(`Credited coins for user ${userId} via crypto payment`);
      return res.status(200).send('OK');
    } catch (err) {
      console.error('Error crediting coins:', err);
      return res.status(500).send('Failed to credit coins');
    }
  }

  // Ignore other event types
  res.status(200).send('Ignored');
});

module.exports = app; 