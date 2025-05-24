const express = require('express');
const { stkPush } = require('../utils/mpesa');
const router = express.Router();

// Initiate an STK Push (Mpesa payment)
router.post('/stkpush', async (req, res) => {
  const { phoneNumber, amount } = req.body;
  try {
    // trigger STK Push
    const response = await stkPush({ phoneNumber, amount });
    console.log('📲 STK Push initiated:', response);
    // return the Daraja response immediately
    return res.status(200).json(response);
  } catch (err) {
    console.error('🚨 STK Push error:', err.message || err);
    return res.status(500).json({ error: err.message || 'STK Push failed' });
  }
});

// Callback endpoint for Daraja (ngrok URL should point here)
router.post('/callback', (req, res) => {
  console.log('📥 Daraja callback received:', req.body);
  // respond 200 to acknowledge receipt
  res.status(200).send('OK');
});

module.exports = router;
