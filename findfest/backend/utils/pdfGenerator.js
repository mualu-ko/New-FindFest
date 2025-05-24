const PDFDocument = require('pdfkit');
const { PassThrough } = require('stream');
const axios = require('axios');

async function generateTicketPDF({ ticketId, eventName, userName, qrImage, photoUrl }) {
  const doc = new PDFDocument({
    size: [400, 600],
    margins: { top: 30, left: 30, right: 30, bottom: 30 },
  });
  const stream = new PassThrough();
  doc.pipe(stream);

  // 🎫 Header
  doc
    .save()
    .roundedRect(30, 30, 340, 60, 10)
    .fill('#007BFF')
    .fillColor('white')
    .font('Helvetica-Bold')
    .fontSize(22)
    .text('FindFest Ticket', 0, 50, { align: 'center' })
    .restore();

  // 📸 Event photo under header
  if (photoUrl) {
    try {
      const resp = await axios.get(photoUrl, { responseType: 'arraybuffer' });
      const imgBuf = Buffer.from(resp.data, 'binary');
      doc.image(imgBuf, 30, 110, { width: 340, height: 100 });
    } catch (e) {
      console.warn('Failed to load event image:', e);
    }
  }

  doc
    .save()
    .roundedRect(30, 220, 340, 140, 10)
    .fillOpacity(0.1)
    .fill('#007BFF') // Background color
    .strokeColor('#007BFF')
    .lineWidth(1.5)
    .stroke()
    .restore(); // End box styling
  
  doc
    .fillColor('black') // Ensure readable text color
    .font('Helvetica')
    .fontSize(14)
    .text(`Name: ${userName}`, 40, 230)
    .text(`Event: ${eventName}`, 40, 260)
    .text(`Ticket ID: ${ticketId}`, 40, 290);
  

  // 🧾 Divider line
  doc
    .moveTo(30, 350)
    .lineTo(370, 350)
    .dash(5, { space: 3 })
    .strokeColor('gray')
    .stroke()
    .undash();

  // 📷 QR Code
  const base64 = qrImage.split(',')[1];
  doc
    .image(Buffer.from(base64, 'base64'), 120, 370, { width: 160, height: 160 })
    .rect(120, 370, 160, 160)
    .strokeColor('#ccc')
    .lineWidth(1)
    .stroke();

  // 📝 Footer
  doc
    .fontSize(10)
    .fillColor('gray')
    .text('Please present this ticket at the entrance.\nThis ticket is valid for one entry only.', 0, 560, {
      align: 'center',
    });

  doc.end();

  const buffer = await new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', (err) => reject(err));
  });

  return buffer;
}

module.exports = { generateTicketPDF };
