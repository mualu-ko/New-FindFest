const axios = require('axios');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');
dotenv.config();

const consumerKey = process.env.MPESA_CONSUMER_KEY;
const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
const callbackURL = process.env.DARAJA_CALLBACK_URL; // set to your ngrok URL
const mockStk = process.env.MPESA_MOCK === 'true';

async function getAccessToken() {
  console.log('🔑 Daraja getAccessToken using:', { consumerKey: Boolean(consumerKey), consumerSecret: Boolean(consumerSecret) });
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  console.log('🔑 Daraja Basic Auth header prefix:', auth.slice(0,10) + '...');
  const url = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
  const response = await axios.get(url, { headers: { Authorization: `Basic ${auth}` } });
  console.log('🔑 Daraja OAuth response:', response.data);
  return response.data.access_token;
}

async function stkPush({ phoneNumber, amount = 1, accountReference = 'FindFest', transactionDesc = 'Ticket purchase' }) {
  console.log('📲 stkPush called with:', { phoneNumber, amount, accountReference, transactionDesc });
  if (mockStk) {
    const mockCheckoutID = uuidv4();
    console.log('🛠️ MPESA STK Push mock enabled, returning fake response');
    return {
      MerchantRequestID: 'MOCK_'+mockCheckoutID,
      CheckoutRequestID: mockCheckoutID,
      ResponseCode: '0',
      ResponseDescription: 'Success. Request accepted for processing (mock)',
      CustomerMessage: 'Success. Request accepted for processing (mock)'
    };
  }
  const token = await getAccessToken();
  console.log('🔑 Daraja access token:', token);
  const url = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  console.log('🔑 Using shortcode/passkey:', { shortcode: Boolean(shortcode), passkey: Boolean(passkey) });
  if (!shortcode || !passkey) throw new Error('MPESA_SHORTCODE or MPESA_PASSKEY not set');
  const rawStr = shortcode + passkey + timestamp;
  console.log('🔑 Raw string for Base64 password:', rawStr);
  const password = Buffer.from(rawStr).toString('base64');
  console.log('🔑 Generated STK Password:', password);
  const payload = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: amount,
    PartyA: phoneNumber,
    PartyB: shortcode,
    PhoneNumber: phoneNumber,
    CallBackURL: callbackURL,
    AccountReference: accountReference,
    TransactionDesc: transactionDesc,
  };
  console.log('📤 Daraja STK payload:', payload);
  try {
    const resp = await axios.post(url, payload, { headers: { Authorization: `Bearer ${token}` } });
    console.log('📲 Daraja STK Push response:', resp.data);
    return resp.data;
  } catch (err) {
    console.error('🚨 Daraja STK Push request error:', err.response?.data || err.message);
    throw err;
  }
}

module.exports = { stkPush };
