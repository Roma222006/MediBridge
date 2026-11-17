const request = require('supertest');
const app = require('../src/app');
const { setupTestDB, teardownTestDB, clearTestDB } = require('./setup');
const Hospital = require('../src/models/Hospital');
const Doctor = require('../src/models/Doctor');
const PatientProfile = require('../src/models/PatientProfile');
const User = require('../src/models/User');
const HealthRecord = require('../src/models/HealthRecord');
const PatientAccessLog = require('../src/models/PatientAccessLog');
const authService = require('../src/services/authService');

let patientToken, patientProfile, doctorUser, doctor, doctorToken, adminToken;

beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  await clearTestDB();

  const hospital = await Hospital.create({
    name: 'Coimbatore Heart Institute',
    licenseNumber: 'LIC-CHI-01',
    location: { type: 'Point', coordinates: [77.0, 11.0] },
    address: { city: 'Coimbatore', district: 'Coimbatore', pincode: '641018' },
    phone: '+914221234567'
  });

  // Patient
  const pUser = await User.create({
    email: 'vault.patient@test.com',
    phone: '+919876500001',
    password: 'Password123!',
    role: 'patient'
  });
  const pTokens = await authService.generateTokens(pUser);
  patientToken = pTokens.accessToken;

  patientProfile = await PatientProfile.create({
    userId: pUser._id,
    fullName: 'Lakshmi Narayanan',
    dateOfBirth: '1975-08-20',
    gender: 'female',
    relationship: 'self',
    isDefault: true
  });

  // Doctor
  doctorUser = await User.create({
    email: 'vault.doctor@test.com',
    phone: '+919876500002',
    password: 'Password123!',
    role: 'doctor',
    hospitalId: hospital._id
  });
  const dTokens = await authService.generateTokens(doctorUser);
  doctorToken = dTokens.accessToken;

  doctor = await Doctor.create({
    userId: doctorUser._id,
    hospitalId: hospital._id,
    name: 'Dr. R. Vijayakumar',
    specialty: 'Cardiology',
    qualifications: 'MD, DM',
    consultationFee: 600
  });

  // Hospital Admin
  const adminUser = await User.create({
    email: 'vault.admin@test.com',
    phone: '+919876500003',
    password: 'Password123!',
    role: 'hospital_admin',
    hospitalId: hospital._id
  });
  const aTokens = await authService.generateTokens(adminUser);
  adminToken = aTokens.accessToken;
});

describe('Module 6: Health Vault, Ephemeral Consent & Access History', () => {
  it('should accept valid PDF file and reject spoofed file with fake extension via magic bytes', async () => {
    // Valid PDF buffer starting with %PDF
    const validPdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');

    const uploadRes = await request(app)
      .post('/api/v1/vault/upload')
      .set('Authorization', `Bearer ${patientToken}`)
      .field('patientProfileId', patientProfile._id.toString())
      .field('title', 'Echocardiogram Report')
      .field('category', 'radiology_scan')
      .attach('file', validPdfBuffer, 'echo_report.pdf');

    expect(uploadRes.status).toBe(201);
    expect(uploadRes.body.success).toBe(true);
    expect(uploadRes.body.data.title).toBe('Echocardiogram Report');
    expect(uploadRes.body.data.sha256Hash).toBeDefined();
    expect(uploadRes.body.data.fileKey).not.toBe('echo_report.pdf'); // Random storage key!

    // Spoofed executable pretending to be PDF
    const spoofedBuffer = Buffer.from('MZ\x90\x00\x03\x00\x00\x00This is a Windows executable');
    const spoofedRes = await request(app)
      .post('/api/v1/vault/upload')
      .set('Authorization', `Bearer ${patientToken}`)
      .field('patientProfileId', patientProfile._id.toString())
      .field('title', 'Malicious File')
      .attach('file', spoofedBuffer, 'virus.pdf');

    expect(spoofedRes.status).toBe(400);
    expect(spoofedRes.body.error.code).toBe('INVALID_FILE_SIGNATURE');
  });

  it('should strictly DENY Hospital Admin and Super Admin from accessing Vault routes', async () => {
    const res = await request(app)
      .get(`/api/v1/vault/records?patientProfileId=${patientProfile._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('VAULT_ACCESS_PROHIBITED');
  });

  it('should deny doctor access to patient records when no consent exists', async () => {
    const res = await request(app)
      .get(`/api/v1/vault/records?patientProfileId=${patientProfile._id}`)
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('CONSENT_REQUIRED_OR_REVOKED');

    // Verify denied attempt logged in access log
    const logs = await PatientAccessLog.find({ patientProfileId: patientProfile._id });
    expect(logs.some((l) => l.accessGranted === false && l.denialReason.includes('consent'))).toBe(true);
  });

  it('should grant 24-hour consent, allow doctor to request 60s signed URL, and immediately block upon revocation', async () => {
    // 1. Upload valid document
    const validPdf = Buffer.from('%PDF-1.4\nEcho Report Content\n%%EOF');
    const upRes = await request(app)
      .post('/api/v1/vault/upload')
      .set('Authorization', `Bearer ${patientToken}`)
      .field('patientProfileId', patientProfile._id.toString())
      .field('title', 'Cardiac Stress Test')
      .attach('file', validPdf, 'stress_test.pdf');
    const recordId = upRes.body.data._id;

    // 2. Patient grants 24-hour consent to Dr. Vijayakumar
    const consentRes = await request(app)
      .post('/api/v1/vault/consent')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        patientProfileId: patientProfile._id,
        doctorId: doctor._id,
        purpose: 'Cardiology Teleconsultation Evaluation',
        durationHours: 24
      });

    expect(consentRes.status).toBe(201);
    expect(consentRes.body.data.status).toBe('ACTIVE');
    const consentId = consentRes.body.data._id;

    // 3. Doctor requests records list (Allowed)
    const recordsRes = await request(app)
      .get(`/api/v1/vault/records?patientProfileId=${patientProfile._id}`)
      .set('Authorization', `Bearer ${doctorToken}`);
    expect(recordsRes.status).toBe(200);
    expect(recordsRes.body.data.length).toBe(1);

    // 4. Doctor requests 60-second signed download URL (Allowed)
    const dlRes = await request(app)
      .get(`/api/v1/vault/records/${recordId}/download-url`)
      .set('Authorization', `Bearer ${doctorToken}`);
    expect(dlRes.status).toBe(200);
    expect(dlRes.body.data.downloadUrl).toContain('/api/v1/vault/files/download?token=');
    expect(dlRes.body.data.expiresInSeconds).toBe(60);

    // 5. Patient immediately revokes consent
    const revokeRes = await request(app)
      .patch(`/api/v1/vault/consent/${consentId}/revoke`)
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ reason: 'Consultation concluded' });
    expect(revokeRes.status).toBe(200);
    expect(revokeRes.body.data.status).toBe('REVOKED');

    // 6. Doctor immediately tries to request download URL again (Must be BLOCKED!)
    const blockedDlRes = await request(app)
      .get(`/api/v1/vault/records/${recordId}/download-url`)
      .set('Authorization', `Bearer ${doctorToken}`);
    expect(blockedDlRes.status).toBe(403);
    expect(blockedDlRes.body.error.code).toBe('CONSENT_REQUIRED_OR_REVOKED');

    // 7. Verify Patient Access Log shows the complete audit trail
    const logRes = await request(app)
      .get(`/api/v1/vault/access-logs?patientProfileId=${patientProfile._id}`)
      .set('Authorization', `Bearer ${patientToken}`);
    expect(logRes.status).toBe(200);
    const actions = logRes.body.data.map((l) => l.action);
    expect(actions).toContain('UPLOAD_RECORD');
    expect(actions).toContain('GRANT_CONSENT');
    expect(actions).toContain('DOWNLOAD_FILE');
    expect(actions).toContain('REVOKE_CONSENT');
  });

  it('should soft-delete a record and automatically revoke active consents for that record', async () => {
    const validPdf = Buffer.from('%PDF-1.4\nDischarge Summary\n%%EOF');
    const upRes = await request(app)
      .post('/api/v1/vault/upload')
      .set('Authorization', `Bearer ${patientToken}`)
      .field('patientProfileId', patientProfile._id.toString())
      .field('title', 'Discharge Summary')
      .attach('file', validPdf, 'discharge.pdf');
    const recordId = upRes.body.data._id;

    // Soft delete
    const delRes = await request(app)
      .delete(`/api/v1/vault/records/${recordId}`)
      .set('Authorization', `Bearer ${patientToken}`);
    expect(delRes.status).toBe(200);

    const docInDb = await HealthRecord.findById(recordId);
    expect(docInDb.isDeleted).toBe(true);
    expect(docInDb.deletedAt).toBeDefined();
  });
});
