const PDFDocument = require('pdfkit');

function generateProspectus(res) {
  const doc = new PDFDocument({ margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=Nayab-School-Prospectus.pdf');
  doc.pipe(res);

  doc.fontSize(20).text('Nayab English Grammar High School', { align: 'center' });
  doc.fontSize(12).text('Mirwah Gorchani, District Mirpurkhas, Sindh', { align: 'center' });
  doc.moveDown();
  doc.fontSize(16).text('Admission Prospectus 2025-2026', { align: 'center' });
  doc.moveDown();

  const sections = [
    ['About Us', 'Nayab English Grammar High School provides quality English-medium education from Play Group to Class 10. We focus on academic excellence, moral values, and holistic development.'],
    ['Admission Requirements', '• Birth Certificate\n• Previous School Result (if applicable)\n• 2 Passport Size Photos\n• B-Form / CNIC Copy\n• Parent/Guardian CNIC Copy'],
    ['Fee Structure', 'Play Group to Class 5: Rs. 2,500/month\nClass 6 to 8: Rs. 3,000/month\nClass 9 to 10: Rs. 3,500/month\nAdmission Fee: Rs. 5,000 (one time)'],
    ['Facilities', 'Modern Classrooms, Science Lab, Computer Lab, Library, Playground, CCTV Security, Clean Drinking Water'],
    ['Contact', 'Address: Mirwah Gorchani, Mirpurkhas, Sindh\nPhone: +92-XXX-XXXXXXX\nEmail: info@nayabgrammar.edu.pk'],
  ];

  sections.forEach(([title, content]) => {
    doc.fontSize(14).text(title, { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).text(content);
    doc.moveDown();
  });

  doc.fontSize(10).text('Note: Contact details marked as placeholder until confirmed by school administration.', { italics: true });
  doc.end();
}

module.exports = { generateProspectus };
