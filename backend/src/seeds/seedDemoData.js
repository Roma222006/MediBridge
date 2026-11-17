const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { connectDB, disconnectDB } = require('../config/database');

const User = require('../models/User');
const Hospital = require('../models/Hospital');
const Doctor = require('../models/Doctor');
const Service = require('../models/Service');
const SharedResource = require('../models/SharedResource');
const Slot = require('../models/Slot');
const Appointment = require('../models/Appointment');
const PatientProfile = require('../models/PatientProfile');
const Referral = require('../models/Referral');
const HealthRecord = require('../models/HealthRecord');
const ConsentArtifact = require('../models/ConsentArtifact');
const PatientAccessLog = require('../models/PatientAccessLog');
const DoctorLeave = require('../models/DoctorLeave');
const AuditLog = require('../models/AuditLog');
const vaultStorageService = require('../services/vaultStorageService');

async function seedDemoData() {
  console.log('[Seed] Connecting to MongoDB...');
  await connectDB(config.mongoUri);

  console.log('[Seed] Purging previous demo data...');
  await Promise.all([
    User.deleteMany({}),
    Hospital.deleteMany({}),
    Doctor.deleteMany({}),
    Service.deleteMany({}),
    SharedResource.deleteMany({}),
    Slot.deleteMany({}),
    Appointment.deleteMany({}),
    PatientProfile.deleteMany({}),
    Referral.deleteMany({}),
    HealthRecord.deleteMany({}),
    ConsentArtifact.deleteMany({}),
    PatientAccessLog.deleteMany({}),
    DoctorLeave.deleteMany({}),
    AuditLog.deleteMany({})
  ]);

  console.log('[Seed] Creating Hospitals...');

  // 1. Kovai Medical Center (KMCH) - City Tertiary Center
  const kmch = await Hospital.create({
    name: 'Kovai Medical Center & Hospital (KMCH)',
    licenseNumber: 'LIC-TN-CBE-001 (Demo, not verified)',
    type: 'tertiary',
    location: { type: 'Point', coordinates: [77.0384, 11.0267] },
    address: {
      street: 'Avinashi Road, Civil Aerodrome Post',
      area: 'Peelamedu',
      city: 'Coimbatore',
      district: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641014'
    },
    phone: '+914224323800',
    emergencyPhone: '108',
    email: 'contact@kmch-demo.org',
    schemesSupported: ['pmjay', 'cmchis', 'private_star', 'private_hdfc'],
    bedCapacity: {
      general: { total: 350, available: 48, lastUpdated: new Date() },
      icu: { total: 45, available: 7, lastUpdated: new Date() }
    },
    emergencyAvailable: true,
    isVerified: true
  });

  // 2. PSG Institute of Medical Sciences - Academic City Center
  const psg = await Hospital.create({
    name: 'PSG Institute of Medical Sciences & Research',
    licenseNumber: 'LIC-TN-CBE-002 (Demo, not verified)',
    type: 'tertiary',
    location: { type: 'Point', coordinates: [77.0145, 11.0248] },
    address: {
      street: 'Avinashi Road',
      area: 'Peelamedu',
      city: 'Coimbatore',
      district: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641004'
    },
    phone: '+914222570170',
    emergencyPhone: '108',
    email: 'info@psgimsr-demo.org',
    schemesSupported: ['cmchis', 'private_star'],
    bedCapacity: {
      general: { total: 500, available: 62, lastUpdated: new Date(Date.now() - 25 * 60 * 1000) },
      icu: { total: 60, available: 3, lastUpdated: new Date(Date.now() - 25 * 60 * 1000) }
    },
    emergencyAvailable: true,
    isVerified: true
  });

  // 3. Pollachi District Headquarters Hospital - Rural / Taluk Referral Hub
  const pollachiGH = await Hospital.create({
    name: 'Kongu District Headquarters Government Hospital (Pollachi)',
    licenseNumber: 'LIC-TN-POL-003 (Demo, not verified)',
    type: 'district_hq',
    location: { type: 'Point', coordinates: [77.0048, 10.6609] },
    address: {
      street: 'Palakkad Road',
      area: 'Town Center',
      city: 'Pollachi',
      district: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '642001'
    },
    phone: '+914259223344',
    emergencyPhone: '108',
    email: 'gh.pollachi@tnhealth-demo.gov.in',
    schemesSupported: ['cmchis'],
    bedCapacity: {
      general: { total: 180, available: 14, lastUpdated: new Date(Date.now() - 210 * 60 * 1000) }, // Stale! >3h ago
      icu: { total: 12, available: 1, lastUpdated: new Date(Date.now() - 210 * 60 * 1000) }
    },
    emergencyAvailable: true,
    isVerified: true
  });

  console.log('[Seed] Creating User Accounts...');

  // Super Admin
  await User.create({
    email: 'superadmin@medibridge.org',
    phone: '+919876500000',
    password: 'SuperAdmin123!',
    role: 'super_admin'
  });

  // Hospital Admins
  const adminKmchUser = await User.create({
    email: 'admin.kmch@medibridge.org',
    phone: '+919876500001',
    password: 'AdminPass123!',
    role: 'hospital_admin',
    hospitalId: kmch._id
  });

  const adminPsgUser = await User.create({
    email: 'admin.psg@medibridge.org',
    phone: '+919876500002',
    password: 'AdminPass123!',
    role: 'hospital_admin',
    hospitalId: psg._id
  });

  const adminPollachiUser = await User.create({
    email: 'admin.pollachi@medibridge.org',
    phone: '+919876500003',
    password: 'AdminPass123!',
    role: 'hospital_admin',
    hospitalId: pollachiGH._id
  });

  // Doctors
  const drSundaramUser = await User.create({
    email: 'dr.sundaram@medibridge.org',
    phone: '+919876500011',
    password: 'DoctorPass123!',
    role: 'doctor',
    hospitalId: kmch._id
  });

  const drRevathiUser = await User.create({
    email: 'dr.revathi@medibridge.org',
    phone: '+919876500012',
    password: 'DoctorPass123!',
    role: 'doctor',
    hospitalId: kmch._id
  });

  const drArumugamUser = await User.create({
    email: 'dr.arumugam@medibridge.org',
    phone: '+919876500013',
    password: 'DoctorPass123!',
    role: 'doctor',
    hospitalId: pollachiGH._id
  });

  // Patients (The 3 Team Members / Patient Roles)
  const romaUser = await User.create({
    email: 'roma.patient@medibridge.org',
    phone: '+917904468928',
    password: 'PatientPass123!',
    role: 'patient'
  });

  const ragaviUser = await User.create({
    email: 'ragavi.patient@medibridge.org',
    phone: '+919876500022',
    password: 'PatientPass123!',
    role: 'patient'
  });

  const rithikaUser = await User.create({
    email: 'rithika.patient@medibridge.org',
    phone: '+919876500023',
    password: 'PatientPass123!',
    role: 'patient'
  });

  console.log('[Seed] Creating Doctor Clinical Profiles...');
  const drSundaram = await Doctor.create({
    userId: drSundaramUser._id,
    hospitalId: kmch._id,
    name: 'Dr. K. Sundaram',
    specialty: 'Cardiology',
    qualifications: 'MBBS, MD (Gen Med), DM (Cardio), FACC',
    regNumber: 'TNMC/2012/04819 (Demo, not verified)',
    verificationStatus: 'DEMO_NOT_VERIFIED',
    experienceYears: 14,
    consultationFee: 800,
    availableDays: [1, 2, 3, 4, 5],
    teleconsultAvailable: true,
    inPersonAvailable: true
  });

  const drRevathi = await Doctor.create({
    userId: drRevathiUser._id,
    hospitalId: kmch._id,
    name: 'Dr. M. Revathi',
    specialty: 'Cardiology',
    qualifications: 'MBBS, MD, DNB (Cardiology)',
    regNumber: 'TNMC/2016/09283 (Demo, not verified)',
    verificationStatus: 'DEMO_NOT_VERIFIED',
    experienceYears: 9,
    consultationFee: 750,
    availableDays: [1, 2, 3, 4, 5, 6],
    teleconsultAvailable: true,
    inPersonAvailable: true
  });

  const drArumugam = await Doctor.create({
    userId: drArumugamUser._id,
    hospitalId: pollachiGH._id,
    name: 'Dr. P. Arumugam',
    specialty: 'General Medicine',
    qualifications: 'MBBS, MD (General Medicine)',
    regNumber: 'TNMC/2008/01123 (Demo, not verified)',
    verificationStatus: 'DEMO_NOT_VERIFIED',
    experienceYears: 18,
    consultationFee: 200,
    availableDays: [1, 2, 3, 4, 5, 6],
    teleconsultAvailable: true,
    inPersonAvailable: true
  });

  console.log('[Seed] Creating Patient Profiles (Family Profiles)...');
  const romaSelfProfile = await PatientProfile.create({
    userId: romaUser._id,
    fullName: 'Roma R',
    dateOfBirth: new Date('2004-06-15'),
    gender: 'female',
    bloodGroup: 'B+',
    phone: '+917904468928',
    relationship: 'self',
    insurance: { provider: 'Star Health Allied', policyNumber: 'SH-XXXX-7140', schemeType: 'private' },
    isDefault: true
  });

  const romaFatherProfile = await PatientProfile.create({
    userId: romaUser._id,
    fullName: 'Rengadurai K (Father)',
    dateOfBirth: new Date('1970-03-22'),
    gender: 'male',
    bloodGroup: 'O+',
    phone: '+919443322110',
    relationship: 'parent',
    insurance: { provider: 'Chief Minister Comprehensive Scheme', policyNumber: 'CMCHIS-XXXX-0982', schemeType: 'cmchis' },
    emergencyContact: { name: 'Roma R', phone: '+917904468928', relationship: 'daughter' },
    isDefault: false
  });

  const ragaviProfile = await PatientProfile.create({
    userId: ragaviUser._id,
    fullName: 'Ragavi R',
    dateOfBirth: new Date('2004-08-10'),
    gender: 'female',
    bloodGroup: 'A+',
    phone: '+919876500022',
    relationship: 'self',
    isDefault: true
  });

  const rithikaProfile = await PatientProfile.create({
    userId: rithikaUser._id,
    fullName: 'Rithika KP',
    dateOfBirth: new Date('2004-12-05'),
    gender: 'female',
    bloodGroup: 'AB+',
    phone: '+919876500023',
    relationship: 'self',
    isDefault: true
  });

  console.log('[Seed] Creating Hospital Diagnostic Services & Shared Resources...');
  const mriResource = await SharedResource.create({
    hospitalId: kmch._id,
    name: 'Siemens Magnetom Vida 3T MRI Scanner',
    type: 'scanner_mri',
    operatingDays: [1, 2, 3, 4, 5, 6],
    dailyCapacity: 16
  });

  const mriService = await Service.create({
    hospitalId: kmch._id,
    name: 'MRI Brain with Contrast (3T)',
    code: 'SRV-RAD-MRI-3T',
    category: 'radiology',
    specialty: 'Radiology',
    price: 6500,
    operatingDays: [1, 2, 3, 4, 5, 6],
    sharedResourceId: mriResource._id,
    slotDurationMinutes: 45
  });

  const cardioConsultService = await Service.create({
    hospitalId: kmch._id,
    name: 'Cardiology Specialist OPD',
    code: 'SRV-CARD-OPD',
    category: 'consultation',
    specialty: 'Cardiology',
    price: 800,
    operatingDays: [1, 2, 3, 4, 5]
  });

  const teleCardioService = await Service.create({
    hospitalId: kmch._id,
    name: 'Cardiology Teleconsultation',
    code: 'SRV-CARD-TELE',
    category: 'consultation',
    specialty: 'Cardiology',
    price: 600,
    operatingDays: [1, 2, 3, 4, 5, 6]
  });

  const psgMriService = await Service.create({
    hospitalId: psg._id,
    name: 'MRI Brain & Whole Spine (1.5T)',
    code: 'SRV-PSG-MRI-15T',
    category: 'radiology',
    specialty: 'Radiology',
    price: 4800,
    operatingDays: [1, 2, 3, 4, 5]
  });

  const pollachiOpdService = await Service.create({
    hospitalId: pollachiGH._id,
    name: 'General Medicine & Triage OPD',
    code: 'SRV-POL-GEN',
    category: 'consultation',
    specialty: 'General Medicine',
    price: 100,
    operatingDays: [1, 2, 3, 4, 5, 6]
  });

  console.log('[Seed] Creating Slots & Pre-seeding Live Scenarios...');

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const nextWeekStr = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];

  // Scenario 1: MRI Search Slots at KMCH
  await Slot.create({
    hospitalId: kmch._id,
    serviceId: mriService._id,
    sharedResourceId: mriResource._id,
    date: todayStr,
    startTime: '14:00',
    endTime: '14:45',
    type: 'procedure_scan',
    status: 'AVAILABLE'
  });

  await Slot.create({
    hospitalId: kmch._id,
    serviceId: mriService._id,
    sharedResourceId: mriResource._id,
    date: todayStr,
    startTime: '15:00',
    endTime: '15:45',
    type: 'procedure_scan',
    status: 'AVAILABLE'
  });

  // Scenario 2: Last-slot Race Condition (Tomorrow 11:30 AM with Dr. Revathi)
  const raceSlot = await Slot.create({
    hospitalId: kmch._id,
    doctorId: drRevathi._id,
    serviceId: cardioConsultService._id,
    date: tomorrowStr,
    startTime: '11:30',
    endTime: '12:00',
    type: 'consultation_in_person',
    status: 'AVAILABLE'
  });

  // Scenario 3: Doctor Leave & Reassignment (Dr. K. Sundaram emergency leave)
  // Create leave event
  const leaveEventId = `LV-${tomorrowStr.replace(/-/g, '')}-DEMO`;
  await DoctorLeave.create({
    eventId: leaveEventId,
    hospitalId: kmch._id,
    doctorId: drSundaram._id,
    startDate: tomorrowStr,
    endDate: tomorrowStr,
    reason: 'Emergency hospital executive medical committee meeting',
    affectedAppointmentsCount: 2,
    recordedBy: adminKmchUser._id
  });

  // Slot A (Blocked by leave)
  const slotSundaramBlocked1 = await Slot.create({
    hospitalId: kmch._id,
    doctorId: drSundaram._id,
    serviceId: cardioConsultService._id,
    date: tomorrowStr,
    startTime: '09:30',
    endTime: '10:00',
    status: 'BLOCKED_LEAVE'
  });

  // Slot B (Blocked by leave)
  const slotSundaramBlocked2 = await Slot.create({
    hospitalId: kmch._id,
    doctorId: drSundaram._id,
    serviceId: cardioConsultService._id,
    date: tomorrowStr,
    startTime: '10:00',
    endTime: '10:30',
    status: 'BLOCKED_LEAVE'
  });

  // Suggested alternative slot with peer Dr. Revathi on same day
  const slotRevathiSuggested = await Slot.create({
    hospitalId: kmch._id,
    doctorId: drRevathi._id,
    serviceId: cardioConsultService._id,
    date: tomorrowStr,
    startTime: '10:30',
    endTime: '11:00',
    status: 'AVAILABLE'
  });

  // Future slot with Dr. Sundaram after return
  const slotSundaramFuture = await Slot.create({
    hospitalId: kmch._id,
    doctorId: drSundaram._id,
    serviceId: cardioConsultService._id,
    date: nextWeekStr,
    startTime: '10:00',
    endTime: '10:30',
    status: 'AVAILABLE'
  });

  // Pre-seed Appointment 1 (Roma's Father -> REASSIGNMENT_PENDING)
  await Appointment.create({
    referenceNumber: `MB-${tomorrowStr.replace(/-/g, '')}-LEAV1`,
    hospitalId: kmch._id,
    doctorId: drSundaram._id,
    serviceId: cardioConsultService._id,
    slotId: slotSundaramBlocked1._id,
    patientProfileId: romaFatherProfile._id,
    date: tomorrowStr,
    startTime: '09:30',
    endTime: '10:00',
    consultationFee: 800,
    status: 'REASSIGNMENT_PENDING',
    reassignmentDetails: {
      originalDoctorId: drSundaram._id,
      eventId: leaveEventId,
      reason: 'Emergency hospital executive medical committee meeting',
      suggestedDoctorId: drRevathi._id,
      suggestedSlotId: slotRevathiSuggested._id,
      deadlineAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      resolutionChoice: 'NONE'
    }
  });

  // Pre-seed Appointment 2 (Rithika KP -> REASSIGNMENT_PENDING)
  await Appointment.create({
    referenceNumber: `MB-${tomorrowStr.replace(/-/g, '')}-LEAV2`,
    hospitalId: kmch._id,
    doctorId: drSundaram._id,
    serviceId: cardioConsultService._id,
    slotId: slotSundaramBlocked2._id,
    patientProfileId: rithikaProfile._id,
    date: tomorrowStr,
    startTime: '10:00',
    endTime: '10:30',
    consultationFee: 800,
    status: 'REASSIGNMENT_PENDING',
    reassignmentDetails: {
      originalDoctorId: drSundaram._id,
      eventId: leaveEventId,
      reason: 'Emergency hospital executive medical committee meeting',
      suggestedDoctorId: drRevathi._id,
      suggestedSlotId: null,
      deadlineAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      resolutionChoice: 'NONE'
    }
  });

  // Scenario 4: Rural-to-City Referral (Pollachi GH -> KMCH)
  await Referral.create({
    referralNumber: `REF-${todayStr.replace(/-/g, '')}-DEMO`,
    dedupeKey: `REF_DEDUPE_${pollachiGH._id}_${romaFatherProfile._id}_CARDIO`,
    patientProfileId: romaFatherProfile._id,
    referringHospitalId: pollachiGH._id,
    referringDoctorId: drArumugam._id,
    receivingHospitalId: kmch._id,
    targetSpecialty: 'Cardiology',
    clinicalSummary: 'Patient presented with exertional chest heaviness, non-ST elevation on ECG, and elevated cardiac enzymes. Comprehensive catheterization and advanced cardiac evaluation recommended at KMCH.',
    priority: 'URGENT',
    status: 'ACCEPTED',
    assignedCityDoctorId: drSundaram._id,
    responseDeadlineAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    journeyMetrics: {
      sentAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      receivedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      acceptedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      sentToReceivedMinutes: 60
    },
    statusHistory: [
      {
        fromStatus: 'SENT',
        toStatus: 'RECEIVED',
        reason: 'Referral triaged by KMCH Intake',
        changedBy: adminKmchUser._id,
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000)
      },
      {
        fromStatus: 'RECEIVED',
        toStatus: 'ACCEPTED',
        reason: 'Accepted for advanced cardiac catheterization review',
        changedBy: drSundaramUser._id,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
      }
    ]
  });

  // Scenario 5: Health Vault & 24h Ephemeral Consent
  const samplePdf = Buffer.from('%PDF-1.4\n% MediBridge Certified Health Record\n1 0 obj\n<< /Title (MRI Cardiac Scan) >>\nendobj\n%%EOF');
  const storedFile = vaultStorageService.saveFile(samplePdf, 'MRI_Cardiac_Evaluation_2026.pdf', 'application/pdf');

  const vaultDoc = await HealthRecord.create({
    patientProfileId: romaFatherProfile._id,
    ownerUserId: romaUser._id,
    title: 'Cardiac MRI Contrast Assessment',
    category: 'radiology_scan',
    fileKey: storedFile.fileKey,
    fileName: 'MRI_Cardiac_Evaluation_2026.pdf',
    mimeType: 'application/pdf',
    fileSizeBytes: storedFile.fileSizeBytes,
    sha256Hash: storedFile.sha256Hash,
    version: 1
  });

  const activeConsent = await ConsentArtifact.create({
    patientProfileId: romaFatherProfile._id,
    ownerUserId: romaUser._id,
    grantedToDoctorId: drRevathi._id,
    grantedToHospitalId: kmch._id,
    allowedRecordIds: [vaultDoc._id],
    purpose: 'Pre-referral Teleconsultation & Cardiac Risk Stratification',
    status: 'ACTIVE',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24-hour consent
  });

  await PatientAccessLog.create({
    patientProfileId: romaFatherProfile._id,
    healthRecordId: vaultDoc._id,
    consentArtifactId: activeConsent._id,
    actorId: drRevathiUser._id,
    actorRole: 'doctor',
    actorName: drRevathi.name,
    action: 'VIEW_METADATA',
    accessGranted: true,
    clinicalPurpose: activeConsent.purpose,
    timestamp: new Date(Date.now() - 30 * 60 * 1000)
  });

  // Pre-seed a Teleconsult appointment for live demo
  const teleSlot = await Slot.create({
    hospitalId: kmch._id,
    doctorId: drRevathi._id,
    serviceId: teleCardioService._id,
    date: todayStr,
    startTime: '16:00',
    endTime: '16:30',
    type: 'consultation_tele',
    status: 'BOOKED'
  });

  await Appointment.create({
    referenceNumber: `MB-${todayStr.replace(/-/g, '')}-TELE`,
    hospitalId: kmch._id,
    doctorId: drRevathi._id,
    serviceId: teleCardioService._id,
    slotId: teleSlot._id,
    patientProfileId: romaFatherProfile._id,
    date: todayStr,
    startTime: '16:00',
    endTime: '16:30',
    type: 'consultation_tele',
    consultationFee: 600,
    status: 'CONFIRMED'
  });

  console.log('[Seed] Demonstration dataset seeded successfully!');
  console.log('====================================================');
  console.log('DEMO ACCOUNTS READY:');
  console.log('  1. Super Admin:      superadmin@medibridge.org      / SuperAdmin123!');
  console.log('  2. Hospital Admin:   admin.kmch@medibridge.org      / AdminPass123!');
  console.log('  3. Doctor (City):    dr.revathi@medibridge.org      / DoctorPass123!');
  console.log('  4. Doctor (Rural):   dr.arumugam@medibridge.org     / DoctorPass123!');
  console.log('  5. Patient (Lead):   roma.patient@medibridge.org    / PatientPass123!');
  console.log('  6. Patient (Peer 1): ragavi.patient@medibridge.org  / PatientPass123!');
  console.log('  7. Patient (Peer 2): rithika.patient@medibridge.org / PatientPass123!');
  console.log('  8. Emergency Guest:  (Zero-auth, click Emergency Button)');
  console.log('====================================================');

  await disconnectDB();
}

if (require.main === module) {
  seedDemoData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed] Error:', err);
      process.exit(1);
    });
}

module.exports = seedDemoData;
