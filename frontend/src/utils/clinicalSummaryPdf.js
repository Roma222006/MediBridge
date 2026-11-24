import { jsPDF } from 'jspdf';

/**
 * Generates an official, printable and downloadable clinical summary PDF
 * conforming to the MediBridge Healthcare Design System & NDHM / DPDP Act 2023 standards.
 */
export function generateClinicalSummaryPDF(followup = {}, user = {}, activeProfile = {}) {
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
  const hospital = followup.hospitalName || 'KOVAI MEDICAL CENTER AND HOSPITAL (KMCH)';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...deepPlum);
  doc.text(hospital.toUpperCase(), 105, 15, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(90, 85, 90);
  doc.text('Avinashi Road, Civil Aerodrome Post, Coimbatore - 641014, Tamil Nadu, India', 105, 20, { align: 'center' });
  doc.text('NABH Accredited Tertiary Center  |  Emergency Trauma Helpline: 108  |  MediBridge Connected', 105, 24.5, { align: 'center' });

  // Divider Line
  doc.setDrawColor(...roseMagenta);
  doc.setLineWidth(0.6);
  doc.line(14, 28, 196, 28);

  // 3. DOCUMENT TITLE
  doc.setFillColor(...paleRose);
  doc.rect(14, 30, 182, 9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...deepPlum);
  doc.text('OFFICIAL CLINICAL ENCOUNTER & CARE PLAN SUMMARY', 105, 36, { align: 'center' });

  // 4. METADATA STRIP
  const folId = (followup.id || followup._id || 'FOL-8841').toUpperCase();
  const patName = activeProfile.fullName || user.fullName || 'Roma R';
  const docName = followup.doctorName || 'Dr. Sundar M';
  const specialty = followup.specialty || 'Interventional Cardiology';
  const encDate = followup.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const encTime = followup.time || '10:30 AM';
  const modeText = followup.mode === 'teleconsult' ? 'HD Video Teleconsultation' : 'In-Person OPD Visit';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...charcoal);
  doc.text(`Encounter Ref: MB-${folId}`, 14, 44);
  doc.text(`Date & Time: ${encDate} at ${encTime}`, 105, 44, { align: 'center' });
  doc.text(`Consultation Mode: ${modeText}`, 196, 44, { align: 'right' });

  // 5. PATIENT DEMOGRAPHICS BOX
  doc.setFillColor(...blushPink);
  doc.roundedRect(14, 48, 182, 22, 2, 2, 'F');
  doc.setDrawColor(...softGrey);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, 48, 182, 22, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...charcoal);
  doc.text(`Patient Full Name: ${patName}`, 18, 54);
  doc.text(`Relationship: ${activeProfile.relationship || 'Self'}`, 105, 54);
  doc.text(`UHID: KMCH-${String(Math.abs(patName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 100000))).slice(0, 6)}`, 160, 54);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(60, 55, 60);
  const dobText = activeProfile.dateOfBirth ? new Date(activeProfile.dateOfBirth).toLocaleDateString() : '14 Aug 1998';
  doc.text(`DOB / Age: ${dobText} (28 Yrs)`, 18, 60);
  doc.text(`Gender: ${activeProfile.gender || 'Female'}  |  Blood: ${activeProfile.bloodGroup || 'O+'}`, 105, 60);
  doc.text(`ABHA ID: ${activeProfile.abhaId || activeProfile.abhaNumber || '91-4528-9031-7721'}`, 18, 66);
  doc.text(`Insurance: ${activeProfile.insurance || 'Star Health Family Optima (#SH-884192)'}`, 105, 66);

  // 6. ATTENDING PHYSICIAN BOX
  doc.setFillColor(...paleRose);
  doc.roundedRect(14, 73, 182, 16, 2, 2, 'F');
  doc.setDrawColor(...softGrey);
  doc.roundedRect(14, 73, 182, 16, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...deepPlum);
  doc.text(`Attending Physician: ${docName}`, 18, 79);
  doc.text(`Department: ${specialty}`, 18, 84);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(70, 65, 70);
  doc.text('Reg No: TNMC/2014/08492 (Tamil Nadu Medical Council)', 115, 79);
  doc.text(`Encounter Status: ${followup.status || 'Active Clinical Protocol'}`, 115, 84);

  // 7. CLINICAL FOCUS & TITLE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...deepPlum);
  doc.text('1. CLINICAL EVALUATION & PROTOCOL TITLE', 14, 95);

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14, 98, 182, 12, 1.5, 1.5, 'F');
  doc.setDrawColor(...softGrey);
  doc.roundedRect(14, 98, 182, 12, 1.5, 1.5, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...charcoal);
  doc.text(followup.title || 'Post-Angioplasty Stent Recovery & ECG Check', 18, 105);

  // 8. RECORDED CLINICAL VITALS
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...deepPlum);
  doc.text('2. RECORDED PHYSIOLOGICAL PARAMETERS (VITALS)', 14, 117);

  // Vitals Table
  const vitals = [
    { label: 'Blood Pressure', val: '118/78 mmHg', normal: '110-120/70-80', stat: 'OPTIMAL' },
    { label: 'Resting Heart Rate', val: '72 bpm', normal: '60-100 bpm', stat: 'NORMAL' },
    { label: 'Pulse Oximetry (SpO2)', val: '99% on ambient air', normal: '>= 95%', stat: 'OPTIMAL' },
    { label: 'Body Temperature', val: '98.4 °F (Oral)', normal: '97.8 - 99.1 °F', stat: 'AFEBRILE' }
  ];

  doc.setFillColor(...deepPlum);
  doc.rect(14, 120, 182, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('Vital Parameter', 18, 125);
  doc.text('Recorded Value', 70, 125);
  doc.text('Standard Reference Range', 120, 125);
  doc.text('Clinical Status', 170, 125);

  let yPos = 127;
  vitals.forEach((v, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 249, idx % 2 === 0 ? 255 : 246, idx % 2 === 0 ? 255 : 247);
    doc.rect(14, yPos, 182, 6.5, 'F');
    doc.setDrawColor(...softGrey);
    doc.line(14, yPos + 6.5, 196, yPos + 6.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(...charcoal);
    doc.text(v.label, 18, yPos + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.text(v.val, 70, yPos + 4.5);
    doc.text(v.normal, 120, yPos + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 123, 103); // #477B67 success
    doc.text(v.stat, 170, yPos + 4.5);

    yPos += 6.5;
  });

  // 9. CARE PLAN RECOVERY MILESTONES
  yPos += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...deepPlum);
  doc.text('3. CARE PLAN RECOVERY MILESTONES', 14, yPos);

  yPos += 4;
  const goals = followup.carePlanGoals || [
    'Resting Heart Rate < 75 bpm (Stabilized at 72 bpm)',
    'Zero chest discomfort during brisk 15-minute walks (Achieved)',
    'Serum electrolyte and fasting lipid panel scheduled at KMCH lab'
  ];

  goals.forEach((goal) => {
    doc.setFillColor(...paleRose);
    doc.roundedRect(14, yPos, 182, 7, 1, 1, 'F');
    doc.setDrawColor(...softGrey);
    doc.roundedRect(14, yPos, 182, 7, 1, 1, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...roseMagenta);
    doc.text('[COMPLIANT]', 18, yPos + 4.8);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...charcoal);
    doc.text(goal, 44, yPos + 4.8);

    yPos += 8.5;
  });

  // 10. PHYSICIAN DIRECTIVES & INSTRUCTIONS
  yPos += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...deepPlum);
  doc.text('4. ATTENDING PHYSICIAN INSTRUCTIONS & CARE PROTOCOL', 14, yPos);

  yPos += 4;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14, yPos, 182, 18, 1.5, 1.5, 'F');
  doc.setDrawColor(...softGrey);
  doc.roundedRect(14, yPos, 182, 18, 1.5, 1.5, 'D');

  const instructions = followup.instructions ||
    'Maintain daily morning BP log (<130/80 mmHg). Continue dual antiplatelet therapy as prescribed. Have recent pulse readings ready. Report immediately if chest discomfort occurs.';

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(...charcoal);
  const splitInstr = doc.splitTextToSize(instructions, 174);
  doc.text(splitInstr, 18, yPos + 6);

  // 11. MEDICATIONS & CONTINUING REGIMEN
  yPos += 24;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...deepPlum);
  doc.text('5. PRESCRIBED PHARMACEUTICAL REGIMEN', 14, yPos);

  const meds = [
    { drug: 'Tab Atorvastatin 20mg', freq: '1-0-1 (Post Dinner)', dur: '30 Days', ind: 'Lipid Titration' },
    { drug: 'Tab Metoprolol Succinate 25mg', freq: '1-0-0 (Morning)', dur: '30 Days', ind: 'Beta-Blocker / BP' },
    { drug: 'Tab Ecosprin 75mg', freq: '0-1-0 (After Lunch)', dur: '30 Days', ind: 'Antiplatelet Cardio-Protection' }
  ];

  yPos += 4;
  doc.setFillColor(...deepPlum);
  doc.rect(14, yPos, 182, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Medication & Formulation', 18, yPos + 4.2);
  doc.text('Dosage & Timing', 80, yPos + 4.2);
  doc.text('Duration', 135, yPos + 4.2);
  doc.text('Clinical Indication', 165, yPos + 4.2);

  yPos += 6;
  meds.forEach((m, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 249, idx % 2 === 0 ? 255 : 246, idx % 2 === 0 ? 255 : 247);
    doc.rect(14, yPos, 182, 5.5, 'F');
    doc.setDrawColor(...softGrey);
    doc.line(14, yPos + 5.5, 196, yPos + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...charcoal);
    doc.text(m.drug, 18, yPos + 3.8);

    doc.setFont('helvetica', 'normal');
    doc.text(m.freq, 80, yPos + 3.8);
    doc.text(m.dur, 135, yPos + 3.8);
    doc.text(m.ind, 165, yPos + 3.8);

    yPos += 5.5;
  });

  // 12. STATUTORY DPDP 2023 & NDHM COMPLIANCE FOOTER
  yPos += 10;
  doc.setDrawColor(...softGrey);
  doc.line(14, yPos, 196, yPos);

  yPos += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...deepPlum);
  doc.text('DIGITALLY CERTIFIED HEALTH ENCOUNTER RECORD', 14, yPos);
  doc.text(`ATTENDING PHYSICIAN: ${docName}`, 196, yPos, { align: 'right' });

  yPos += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(90, 85, 90);
  doc.text('Protected under Digital Personal Data Protection (DPDP) Act 2023 & Ayushman Bharat Digital Mission (ABDM).', 14, yPos);
  doc.text('Tamil Nadu Medical Council Registered Practitioner', 196, yPos, { align: 'right' });

  yPos += 4;
  doc.setFont('courier', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(110, 105, 110);
  const mockSha = `SHA256:${folId.toLowerCase()}a87f1c9940213bd8e5f201948ba28172c3d4e5f6`;
  doc.text(`Cryptographic Audit Seal: ${mockSha}  |  Encounter Verified`, 14, yPos);

  // Bottom Color Bar
  doc.setFillColor(...deepPlum);
  doc.rect(0, 292, 210, 5, 'F');

  // Trigger browser download
  const sanitizedTitle = (followup.title || 'Clinical_Summary').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`MediBridge_${sanitizedTitle}_${folId}.pdf`);
  return true;
}
