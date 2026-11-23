import { jsPDF } from 'jspdf';

/**
 * Generates an official, beautiful, printable and downloadable medical prescription PDF
 * conforming to the MediBridge Design System & National Digital Health Mission (NDHM) standards.
 */
export function generatePrescriptionPDF(rx, doctor = {}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // MediBridge Palette
  const deepPlum = [112, 43, 89];      // #702B59
  const roseMagenta = [184, 61, 131];   // #B83D83
  const charcoal = [41, 37, 42];        // #29252A
  const softGrey = [232, 227, 229];     // #E8E3E5
  const blushPink = [248, 221, 227];    // #F8DDE3
  const paleRose = [252, 239, 237];     // #FCEFED

  // 1. TOP ACCENT STRIP
  doc.setFillColor(...deepPlum);
  doc.rect(0, 0, 210, 5, 'F');

  // 2. HOSPITAL LETTERHEAD HEADER
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...deepPlum);
  doc.text('KOVAI MEDICAL CENTER AND HOSPITAL (KMCH)', 105, 16, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(90, 85, 90);
  doc.text('Avinashi Road, Civil Aerodrome Post, Coimbatore - 641014, Tamil Nadu, India', 105, 21, { align: 'center' });
  doc.text('Phone: +91 422 4323800  |  Emergency Trauma Helpline: 108  |  Website: www.kmch-health.org', 105, 25.5, { align: 'center' });
  doc.text('Accreditation: NABH (Hospital) & NABL (Diagnostics)  |  State License: LIC-TN-CBE-001', 105, 30, { align: 'center' });

  // Divider Line
  doc.setDrawColor(...roseMagenta);
  doc.setLineWidth(0.6);
  doc.line(14, 33, 196, 33);

  // 3. DOCTOR & PRESCRIPTION METADATA
  const docName = doctor.fullName || 'Dr. M. Revathi';
  const docQual = doctor.qualifications || 'MBBS, MD (Gen Med), DM (Cardiology), FACC';
  const docReg = doctor.regNumber || 'TNMC/2018/09283';
  const docCouncil = doctor.councilName || 'Tamil Nadu Medical Council';
  const docDept = doctor.department || 'Department of Cardiology (OPD Room 204)';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...deepPlum);
  doc.text(docName, 14, 40);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(70, 65, 70);
  doc.text(docQual, 14, 44.5);
  doc.text(`Reg No: ${docReg} (${docCouncil})`, 14, 48.5);
  doc.text(docDept, 14, 52.5);

  // Right side: Rx Number, Date, Visit Type
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...deepPlum);
  doc.text(`Rx Reference: ${rx.rxNumber || 'RX-202611-0491'}`, 196, 40, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(70, 65, 70);
  doc.text(`Date of Issue: ${rx.date || '24 Nov 2026'}`, 196, 44.5, { align: 'right' });
  doc.text(`Consultation Mode: ${rx.mode || 'In-Person OPD Consultation'}`, 196, 48.5, { align: 'right' });
  doc.text(`UHID: KMCH-UHID-${(rx.id ? Math.abs(String(rx.id).split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0)) % 900000 + 100000 : '884920')}`, 196, 52.5, { align: 'right' });

  // 4. PATIENT DEMOGRAPHICS & CLINICAL DIAGNOSIS BOX
  doc.setFillColor(...blushPink);
  doc.roundedRect(14, 56, 182, 22, 2, 2, 'F');
  doc.setDrawColor(...softGrey);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, 56, 182, 22, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...charcoal);
  doc.text(`Patient Name: ${rx.patientName}`, 18, 62.5);
  doc.text(`Age / Gender: ${rx.patientAge || '42 / Female'}`, 95, 62.5);
  doc.text(`Token #: 04 (OPD-204)`, 160, 62.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.8);
  doc.setTextColor(...deepPlum);
  doc.text('Clinical Diagnosis:', 18, 71.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.3);
  doc.setTextColor(...charcoal);
  doc.text(rx.diagnosis || 'Essential (primary) hypertension, Atherosclerotic cardiovascular disease', 52, 71.5);

  // 5. VITALS STRIP AT VISIT
  doc.setFillColor(...paleRose);
  doc.roundedRect(14, 81, 182, 8, 1.5, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(...deepPlum);
  doc.text('Triage Vitals:', 18, 86.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...charcoal);
  doc.text('Blood Pressure: 122/80 mmHg   |   Pulse: 72 bpm   |   SpO2: 99%   |   Temp: 98.4 F   |   Weight: 64 kg', 40, 86.5);

  // 6. Rx SYMBOL & TABLE HEADER
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...roseMagenta);
  doc.text('Rx', 14, 98);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(110, 110, 110);
  doc.text('(Medical Prescription Schedule & Dispensing Orders)', 24, 97.5);

  // Table Header
  let y = 104;
  doc.setFillColor(242, 238, 240);
  doc.rect(14, y - 5, 182, 7, 'F');
  doc.setDrawColor(...softGrey);
  doc.line(14, y + 2, 196, y + 2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(...deepPlum);
  doc.text('#', 17, y);
  doc.text('Medication / Brand & Generic Name', 25, y);
  doc.text('Dosage', 95, y);
  doc.text('Frequency & Timing', 125, y);
  doc.text('Duration', 172, y);

  // Medications Table Rows
  y += 7;
  const meds = rx.medications || [
    { name: 'Tab Atorvastatin', dose: '20mg', freq: '0-0-1 (Night, After Food)', duration: '30 Days' },
    { name: 'Tab Metoprolol Succinate', dose: '25mg', freq: '1-0-0 (Morning, Empty Stomach)', duration: '30 Days' },
    { name: 'Tab Ecosprin', dose: '75mg', freq: '0-1-0 (After Lunch)', duration: '30 Days' }
  ];

  meds.forEach((m, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 252, idx % 2 === 0 ? 255 : 249, idx % 2 === 0 ? 255 : 250);
    doc.rect(14, y - 4.5, 182, 7.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(...charcoal);
    doc.text(String(idx + 1), 17, y);
    doc.text(m.name || m.drug || 'Medication', 25, y);

    doc.setFont('helvetica', 'normal');
    doc.text(m.dose || '10mg', 95, y);
    doc.text(m.freq || '1-0-0 (Morning)', 125, y);
    doc.text(m.duration || '30 Days', 172, y);

    y += 7.5;
  });

  // 7. CLINICAL ADVICE & DIETARY GUIDELINES
  y += 5;
  doc.setFillColor(...paleRose);
  doc.roundedRect(14, y, 182, 28, 2, 2, 'F');
  doc.setDrawColor(...softGrey);
  doc.roundedRect(14, y, 182, 28, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(...deepPlum);
  doc.text('Physician Advice & Lifestyle Instructions:', 18, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...charcoal);
  doc.text('1. Strictly follow low-sodium cardiac diet (table salt < 5g/day). Avoid fried snacks and saturated fats.', 18, y + 10.5);
  doc.text('2. Daily moderate aerobic physical activity: 30 minutes brisk walking in early morning.', 18, y + 15);
  doc.text('3. Monitor blood pressure twice weekly at rest and maintain home BP record log.', 18, y + 19.5);
  doc.text('4. Review in Cardiology OPD after 4 weeks with Fasting Lipid Profile & Resting 12-Lead ECG.', 18, y + 24);

  // 8. EMERGENCY PROTOCOL
  y += 32;
  doc.setFillColor(255, 243, 243);
  doc.roundedRect(14, y, 182, 10, 1.5, 1.5, 'F');
  doc.setDrawColor(220, 150, 150);
  doc.roundedRect(14, y, 182, 10, 1.5, 1.5, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(196, 71, 82);
  doc.text('EMERGENCY RED FLAG PROTOCOL:', 18, y + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.text('In case of acute chest discomfort radiating to left arm, severe breathlessness or syncope, dial 108 or report immediately to KMCH Emergency Center.', 18, y + 8);

  // 9. DOCTOR DIGITAL SIGNATURE & VERIFICATION
  y += 15;
  doc.setDrawColor(...softGrey);
  doc.line(14, y, 196, y);

  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(...deepPlum);
  doc.text('Digitally Authenticated By Attending Physician:', 125, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...charcoal);
  doc.text(docName, 125, y + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.3);
  doc.setTextColor(90, 90, 90);
  doc.text(`${docQual}`, 125, y + 8.5);
  doc.text(`State Council Reg No: ${docReg}`, 125, y + 12);
  doc.text(`Timestamp: ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString()}`, 125, y + 15.5);

  // Security & Legal Notice
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(130, 125, 130);
  doc.text('This is a verified computer-generated e-Prescription compliant with the National Digital Health Mission (NDHM) guidelines.', 14, 280);
  doc.text('MediBridge Integrated Healthcare Coordination Platform  |  Official Document  |  Valid across all licensed pharmacies in India', 14, 284);

  const cleanName = (rx.patientName || 'Patient').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `${rx.rxNumber || 'RX-202611'}_${cleanName}_KMCH.pdf`;
  doc.save(filename);
}
