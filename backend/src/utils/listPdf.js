const PDFDocument = require('pdfkit');

function createListPdf(res, filename, title, columns, rows) {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  doc.pipe(res);

  doc.font('Helvetica-Bold').fontSize(14).text(title, { align: 'center' });
  doc.moveDown(0.5);
  doc.font('Helvetica').fontSize(9).text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, { align: 'center' });
  doc.moveDown(1);

  const startX = 40;
  let y = doc.y;
  const colW = (doc.page.width - 80) / columns.length;

  doc.font('Helvetica-Bold').fontSize(8);
  columns.forEach((c, i) => {
    doc.text(c, startX + i * colW, y, { width: colW - 4 });
  });
  y += 16;
  doc.moveTo(40, y).lineTo(doc.page.width - 40, y).stroke();
  y += 6;

  doc.font('Helvetica').fontSize(8);
  rows.forEach((row) => {
    if (y > doc.page.height - 60) {
      doc.addPage();
      y = 50;
    }
    row.forEach((cell, i) => {
      doc.text(String(cell ?? ''), startX + i * colW, y, { width: colW - 4 });
    });
    y += 14;
  });

  doc.end();
}

module.exports = { createListPdf };
