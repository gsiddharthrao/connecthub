const PDFDocument = require('pdfkit');

/**
 * Format a date value to Month Year or Year string
 */
const formatDate = (val) => {
  if (!val) return '';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return String(val);
  }
};

/**
 * Pure-JS PDF Resume Generator using PDFKit
 * @param {Object} profile - User profile document (with populated user)
 * @param {Stream.Writable} outputStream - Stream to pipe PDF chunks to (e.g. res)
 * @returns {PDFKit.PDFDocument}
 */
const generateResumePdf = (profile, outputStream) => {
  const doc = new PDFDocument({
    margin: 40,
    size: 'A4',
    info: {
      Title: `${profile?.user?.name || 'User'} - ConnectHub Resume`,
      Author: 'ConnectHub',
      Subject: 'Professional Resume',
      Keywords: 'ConnectHub, Resume, CV, Profile',
      CreationDate: new Date(),
    },
  });

  doc.pipe(outputStream);

  const primaryColor = '#0A66C2'; // ConnectHub Brand Blue
  const textDark = '#111827';
  const textBody = '#374151';
  const textMuted = '#6B7280';
  const lineDivider = '#E5E7EB';
  const pageWidth = 595.28; // standard A4 width in points
  const contentWidth = pageWidth - 80;

  const user = profile?.user || {};
  const name = user.name || 'ConnectHub Professional';
  const headline = profile?.headline || user.headline || '';
  const email = user.email || '';
  const location = profile?.location || '';
  const website = profile?.website || '';

  // 1. Header: Name & Headline
  doc.fillColor(primaryColor).fontSize(22).font('Helvetica-Bold').text(name, { align: 'left' });

  if (headline) {
    doc.moveDown(0.2);
    doc.fillColor(textDark).fontSize(12).font('Helvetica').text(headline, { align: 'left' });
  }

  // Contact line
  const contactParts = [];
  if (email) contactParts.push(email);
  if (location) contactParts.push(location);
  if (website) contactParts.push(website);

  if (contactParts.length > 0) {
    doc.moveDown(0.3);
    doc.fillColor(textMuted).fontSize(9).font('Helvetica').text(contactParts.join('   |   '));
  }

  // Divider Line
  doc.moveDown(0.5);
  doc.strokeColor(lineDivider).lineWidth(1).moveTo(40, doc.y).lineTo(40 + contentWidth, doc.y).stroke();
  doc.moveDown(0.6);

  // 2. Professional Summary
  if (profile?.summary && profile.summary.trim()) {
    doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('PROFESSIONAL SUMMARY');
    doc.moveDown(0.25);
    doc.fillColor(textBody).fontSize(9.5).font('Helvetica').text(profile.summary.trim(), {
      lineGap: 2.5,
      align: 'justify',
      width: contentWidth,
    });
    doc.moveDown(0.6);
  }

  // 3. Work Experience
  const experiences = profile?.experience || [];
  if (experiences.length > 0) {
    doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('WORK EXPERIENCE');
    doc.moveDown(0.35);

    experiences.forEach((exp) => {
      // Role Title
      doc.fillColor(textDark).fontSize(10.5).font('Helvetica-Bold').text(exp.title || 'Role');

      // Company, Location & Dates
      const fromDate = formatDate(exp.from || exp.startDate);
      const toDate = exp.current ? 'Present' : formatDate(exp.to || exp.endDate) || 'Present';
      const dateRange = fromDate ? `${fromDate} - ${toDate}` : '';

      const subParts = [exp.company, exp.location, dateRange].filter(Boolean);
      doc.fillColor(textMuted).fontSize(9).font('Helvetica').text(subParts.join('   |   '));

      // Description
      if (exp.description && exp.description.trim()) {
        doc.moveDown(0.2);
        doc.fillColor(textBody).fontSize(9).font('Helvetica').text(exp.description.trim(), {
          lineGap: 2,
          width: contentWidth,
        });
      }
      doc.moveDown(0.45);
    });
    doc.moveDown(0.2);
  }

  // 4. Skills & Expertise
  const skills = profile?.skills || [];
  if (skills.length > 0) {
    doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('SKILLS & EXPERTISE');
    doc.moveDown(0.25);
    doc.fillColor(textBody).fontSize(9.5).font('Helvetica').text(skills.join('   •   '), {
      lineGap: 2.5,
      width: contentWidth,
    });
    doc.moveDown(0.6);
  }

  // 5. Education
  const educationList = profile?.education || [];
  if (educationList.length > 0) {
    doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('EDUCATION');
    doc.moveDown(0.3);

    educationList.forEach((edu) => {
      const degreeText = edu.degree ? `${edu.degree}${edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}` : '';
      const schoolTitle = degreeText ? `${degreeText} - ${edu.school}` : edu.school;

      doc.fillColor(textDark).fontSize(10).font('Helvetica-Bold').text(schoolTitle);

      const fromDate = formatDate(edu.from || edu.startDate);
      const toDate = edu.current ? 'Present' : formatDate(edu.to || edu.endDate || edu.year);
      const dateStr = fromDate ? `${fromDate} - ${toDate}` : toDate;

      if (dateStr) {
        doc.fillColor(textMuted).fontSize(8.5).font('Helvetica').text(dateStr);
      }
      if (edu.description && edu.description.trim()) {
        doc.moveDown(0.15);
        doc.fillColor(textBody).fontSize(8.5).font('Helvetica').text(edu.description.trim(), {
          width: contentWidth,
        });
      }
      doc.moveDown(0.35);
    });
    doc.moveDown(0.2);
  }

  // Footer
  const bottomY = 785;
  doc.strokeColor(lineDivider).lineWidth(0.5).moveTo(40, bottomY).lineTo(40 + contentWidth, bottomY).stroke();
  doc.fontSize(8).fillColor(textMuted).font('Helvetica').text(
    `Exported from ConnectHub (${new Date().toLocaleDateString()}) • Verified Profile`,
    40,
    bottomY + 8,
    { align: 'center', width: contentWidth }
  );

  doc.end();
  return doc;
};

module.exports = {
  generateResumePdf,
};
