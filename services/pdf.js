const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

const pdf = async ({ res, walletId, json }) => {

  // Set up pdf
  const doc = new PDFDocument({
    autoFirstPage: false
  });
  const filename = `${walletId}.pdf`;
  res.setHeader('Content-disposition', 'inline');
  res.setHeader('Content-type', 'application/pdf');

  // Genetate page with MASTERWALLET title
  doc.addPage({
    layout: 'landscape',
    size: [280, 680],
    margin: 0,
    padding: 0,
  });
  
  doc.rotate(-90, { 
    origin: [135, 110]
  });

  const wallet = json.wallets.find(w => w.id === walletId);
  const address = wallet && wallet.address ? wallet.address : null;
  const privateKey = wallet && wallet.privateKey ? wallet.privateKey : null;

  if (wallet) {
    const network = wallet.network
    doc.x = -20;
    doc.y = 5;
    doc.image(`${__dirname}/../img/${network}.png`, { width: 30 });
    doc.x = 18;
    doc.y = 10;
    doc.font('Courier-Bold').fontSize(30).text('MASTERWALLET');
    doc.rotate(90, { origin: [135, 110] });  
  }
  if (!wallet) {
    // Missing wallet = error message in PDF
    doc.font('Courier-Bold').fontSize(30).text('MASTERWALLET');
    doc.rotate(90, { origin: [135, 110] });  
    doc.x = 100;
    doc.y = 100;
    doc.font('Courier-Bold').fillColor('red').fontSize(50).text('Error: \n wallet not found!', {
      width: 550,
      align: 'left'
    });
  }
  if (address) {
    // Display address and QR
    const addressQR = await QRCode.toDataURL(address);
    doc.y = 40;
    doc.x = 100;
    doc.font('Courier-Bold').fontSize(15).text('Address:');
    doc.moveDown(1);
    doc.font('Courier').fontSize(10).text(address, { width: 210, align: 'right' });
    doc.moveDown();
    doc.x = doc.x + 25;
    doc.image(addressQR);
  }
  if (privateKey) {
    const pkQR = await QRCode.toDataURL(address);
    doc.y = 40;
    doc.x = address ? 350 : 100;
    doc.font('Courier-Bold').fontSize(15).text('Private Key:');
    doc.moveDown(1);
    doc.font('Courier').fontSize(10).text(privateKey, { width: 320, align: 'right' });
    doc.moveDown();
    doc.x = doc.x + 80;
    doc.image(pkQR);
  }

  // // Rotate entire document
  // doc.page.dictionary.data.Rotate = 270;
  // doc._root.data.Pages.data.Kids[0] = doc.page.dictionary;

  doc.pipe(res);
  doc.end();
};

module.exports = {
  pdf
};