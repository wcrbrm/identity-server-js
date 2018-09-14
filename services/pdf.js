const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const pixelWidth = require('string-pixel-width');

const pdf = ({ res, wallet, rotate, errors }) => {
  return new Promise(async (resolve, reject) => {
    // Set up pdf
    let doc = new PDFDocument({
      autoFirstPage: false
    });

    const buffers = [];
    doc.on('data', (chunk) => {
      buffers.push(chunk);
    });
    doc.on('end', () => {
      resolve(Buffer.concat(buffers));
    });

    // Genetate page with MASTERWALLET title
    const companyName = 'MASTERWALLET.PRO';
    const docSize = [280, 680];
    const origin = [125, 120];

    doc.addPage({
      layout: 'landscape',
      size: docSize,
      margin: 0,
      padding: 0,
    });

    try {

      if (errors.length > 0) {
        throw new Error(errors.join(' '));
      }

      const address = wallet && wallet.address ? wallet.address : null;
      const privateKey = wallet && wallet.privateKey ? wallet.privateKey : null;
      const publicKey = wallet && wallet.publicKey ? wallet.publicKey : null;

      // Header
      const network = wallet.network
      doc.rotate(-90, { origin });
      doc.x = -30;
      doc.y = 5;
      doc.image(`${__dirname}/../img/${network}.png`, { width: 30 });
      doc.x = 5;
      doc.y = 12;
      doc.font('Courier-Bold').fontSize(24).text(companyName);
      doc.rotate(90, { origin });

      // In case only address or public key is available
      if ((address || publicKey) && !privateKey) {
        // Fixed numbers
        const addrPKQR = await QRCode.toDataURL(address || publicKey);
        doc.y = 40;
        doc.x = 60;
        doc.font('Courier-Bold').fontSize(15).text(`${address ? 'Address' : ''}${!address && publicKey ? 'Public Key' : ''}:`);
        doc.moveDown(1);
        doc.font('Courier').fontSize(10).text(address || publicKey);
        doc.moveDown();
        doc.x = doc.x + 25;
        doc.image(addrPKQR);

      } else {
        // Autoresize
        const gap = 20;
        const x = 60;
        const font = 'Courier New';
        let size = 7;
        let x2 = pixelWidth(address || publicKey, { font, size }) + gap + x;
        const availWidth = docSize[1] - x - gap; // 630

        for (let i = 7; i < 13; i++) {
          const leftColWidth = pixelWidth(address || publicKey, { font, size: i }) + gap;
          const rightColWidth = pixelWidth(privateKey, { font, size: i }) + gap;
          //console.log(size, x2);
          if (leftColWidth + rightColWidth >= availWidth) {
            break;
          }
          size = i;
          x2 = leftColWidth + x;
        }

        if (address || publicKey) {
          // Display address and QR
          const addrPKQR = await QRCode.toDataURL(address || publicKey);
          doc.y = 40;
          doc.x = x;
          doc.font('Courier-Bold').fontSize(15).text(`${address ? 'Address' : ''}${!address && publicKey ? 'Public Key' : ''}:`);
          doc.moveDown(1);
          doc.font('Courier').fontSize(size).text(address || publicKey);
          doc.moveDown();
          doc.x = x + 25;
          doc.image(addrPKQR);
        }

        if (privateKey) {
          const pkQR = await QRCode.toDataURL(privateKey);
          doc.y = 40;
          doc.x = x2;
          doc.font('Courier-Bold').fontSize(15).text('Private Key:');
          doc.moveDown(1);
          doc.font('Courier').fontSize(size).text(privateKey, {
            //width: 320, align: 'right' 
          });
          doc.moveDown();
          doc.x = x2 + 35;
          doc.image(pkQR);
        }
      }

    } catch (e) {
      // Display error in PDF
      // Generate plain doc with title and error
      let doc = new PDFDocument({
        autoFirstPage: false
      });
      doc.on('data', (chunk) => {
        buffers.push(chunk);
      });
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
      doc.addPage({
        layout: 'landscape',
        size: docSize,
        margin: 0,
        padding: 0,
      });
      doc.rotate(-90, { origin });
      doc.x = -5;
      doc.y = 12;
      doc.font('Courier-Bold').fontSize(24).text(companyName);
      doc.rotate(90, { origin });
      doc.x = 100;
      doc.y = 100;
      doc.font('Courier-Bold').fillColor('red').fontSize(50).text(e.message || e);
      if (rotate) {
        doc.page.dictionary.data.Rotate = 90;
        doc._root.data.Pages.data.Kids[0] = doc.page.dictionary;
      }
      doc.end();
    }
    // Rotate entire document
    if (rotate) {
      doc.page.dictionary.data.Rotate = 90;
      doc._root.data.Pages.data.Kids[0] = doc.page.dictionary;
    }

    doc.end();
  });
};

module.exports = {
  pdf
};