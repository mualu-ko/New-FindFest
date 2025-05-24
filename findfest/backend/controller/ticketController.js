// backend/controller/ticketController.js
const admin    = require('../firebaseAdmin');
const sendEmail= require('../utils/email');
const QRCode   = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const { generateTicketPDF } = require('../utils/pdfGenerator');

exports.createTicket = async (req, res) => {
  // inline auth: verify Firebase ID token
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }
  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(authHeader.split(' ')[1]);
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  const userId = decoded.uid;
  const { eventId } = req.params;
  try {
    const db      = admin.firestore();
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const email    = userDoc.data().email;
    const userName = userDoc.data().name || '';
    const ticketId = uuidv4();
    const qrData   = `ticket:${ticketId}`;
    const qrImage  = await QRCode.toDataURL(qrData);

    // save ticket
    await db.collection('tickets').doc(ticketId).set({
      ticketId,
      eventId,
      userId,
      qrData,
      createdAt: Date.now(),
    });

    // fetch event data for name and image
    const eventDocFetch = await db.collection('events').doc(eventId).get();
    const eventData = eventDocFetch.exists ? eventDocFetch.data() : { name: '', imageUrl: '' };
    const officialEventName = eventData.name;
    const photoUrl = eventData.imageUrl;

    // generate styled PDF with event details and photo
    const pdfBuffer = await generateTicketPDF({ ticketId, eventName: officialEventName, userName, qrImage, photoUrl });

    // send email with PDF attachment
    await sendEmail({
      to: [email],
      subject: 'Your FindFest Ticket',
      html: `<p>Hi ${userName},<br/>Your ticket is attached.</p>`,
      attachments: [
        {
          filename: `ticket-${ticketId}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    res.json({ ticketId });
  } catch (err) {
    console.error('Ticket error:', err);
    res.status(500).json({ error: 'Could not generate ticket.' });
  }
};

// GET PDF ticket in browser
exports.getTicketPDF = async (req, res) => {
  const { eventId, ticketId } = req.params;
  const db = admin.firestore();
  const ticketDoc = await db.collection('tickets').doc(ticketId).get();
  if (!ticketDoc.exists || ticketDoc.data().eventId !== eventId) {
    return res.status(404).json({ error: 'Ticket not found' });
  }
  // regenerate QR, fetch event and user, then PDF
  const ticketData = ticketDoc.data();
  const qrImage = await QRCode.toDataURL(ticketData.qrData);
  const userDoc = await db.collection('users').doc(ticketData.userId).get();
  const userName = userDoc.exists ? userDoc.data().name : '';
  const eventReDoc = await db.collection('events').doc(ticketData.eventId).get();
  const eventReData = eventReDoc.exists ? eventReDoc.data() : { name: '', imageUrl: '' };
  const replEventName = eventReData.name;
  const replPhotoUrl = eventReData.imageUrl;
  const pdfBuffer = await generateTicketPDF({ ticketId, eventName: replEventName, userName, qrImage, photoUrl: replPhotoUrl });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="ticket-${ticketId}.pdf"`);
  res.send(pdfBuffer);
};
