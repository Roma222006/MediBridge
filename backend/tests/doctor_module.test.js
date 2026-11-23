const request = require('supertest');
const app = require('../src/app');
const { setupTestDB, teardownTestDB, clearTestDB } = require('./setup');
const Hospital = require('../src/models/Hospital');
const Doctor = require('../src/models/Doctor');
const Service = require('../src/models/Service');
const Slot = require('../src/models/Slot');
const Appointment = require('../src/models/Appointment');
const PatientProfile = require('../src/models/PatientProfile');
const User = require('../src/models/User');
const Referral = require('../src/models/Referral');
const ConsultationNote = require('../src/models/ConsultationNote');
const DoctorLeaveRequest = require('../src/models/DoctorLeaveRequest');
const authService = require('../src/services/authService');

let hospitalA, hospitalB;
let doctorAUser, doctorBUser, patientUser, adminUser;
let doctorAToken, doctorBToken, patientToken, adminToken;
let doctorA, doctorB, patientProfile, serviceA, slotA, appointmentA;

beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  await clearTestDB();

  // Hospital A (KMCH)
  hospitalA = await Hospital.create({
    name: 'Kovai Medical Center & Hospital',
    licenseNumber: 'LIC-KMCH-01',
    type: 'tertiary',
    location: { type: 'Point', coordinates: [77.03, 11.02] },
    address: { city: 'Coimbatore', district: 'Coimbatore', pincode: '641014' },
    phone: '+914224440001',
    isVerified: true
  });

  // Hospital B (Pollachi GH)
  hospitalB = await Hospital.create({
    name: 'Pollachi Government Hospital',
    licenseNumber: 'LIC-POL-02',
    type: 'district_hq',
    location: { type: 'Point', coordinates: [77.01, 10.66] },
    address: { city: 'Pollachi', district: 'Coimbatore', pincode: '642001' },
    phone: '+914259444002',
    isVerified: true
  });

  // Doctor A (Hospital A)
  doctorAUser = await User.create({
    email: 'docA@kmch.org',
    phone: '+919999000001',
    password: 'Password123!',
    role: 'doctor',
    hospitalId: hospitalA._id
  });
  const tokensA = await authService.generateTokens(doctorAUser);
  doctorAToken = tokensA.accessToken;

  doctorA = await Doctor.create({
    userId: doctorAUser._id,
    hospitalId: hospitalA._id,
    name: 'Dr. Aravind Sundaram',
    specialty: 'Cardiology',
    qualifications: 'MBBS, MD, DM',
    regNumber: 'TNMC/2026/01111 (Demo, not verified)',
    verificationStatus: 'DEMO_NOT_VERIFIED',
    consultationFee: 600,
    availableDays: [1, 2, 3, 4, 5]
  });

  // Doctor B (Hospital B)
  doctorBUser = await User.create({
    email: 'docB@pollachi.gov.in',
    phone: '+919999000002',
    password: 'Password123!',
    role: 'doctor',
    hospitalId: hospitalB._id
  });
  const tokensB = await authService.generateTokens(doctorBUser);
  doctorBToken = tokensB.accessToken;

  doctorB = await Doctor.create({
    userId: doctorBUser._id,
    hospitalId: hospitalB._id,
    name: 'Dr. Bala Arumugam',
    specialty: 'General Medicine',
    qualifications: 'MBBS, MD',
    regNumber: 'TNMC/2026/02222 (Demo, not verified)',
    verificationStatus: 'DEMO_NOT_VERIFIED',
    consultationFee: 300,
    availableDays: [1, 2, 3, 4, 5]
  });

  // Patient
  patientUser = await User.create({
    email: 'patient.doc@test.com',
    phone: '+919999000003',
    password: 'Password123!',
    role: 'patient'
  });
  const pTokens = await authService.generateTokens(patientUser);
  patientToken = pTokens.accessToken;

  patientProfile = await PatientProfile.create({
    userId: patientUser._id,
    fullName: 'Ramasamy V',
    dateOfBirth: '1975-06-15',
    gender: 'male',
    relationship: 'self',
    phone: '+919999000003'
  });

  // Hospital Admin (Hospital A)
  adminUser = await User.create({
    email: 'admin.kmch@test.com',
    phone: '+919999000004',
    password: 'Password123!',
    role: 'hospital_admin',
    hospitalId: hospitalA._id
  });
  const aTokens = await authService.generateTokens(adminUser);
  adminToken = aTokens.accessToken;

  // Service & Slot for Doctor A
  serviceA = await Service.create({
    hospitalId: hospitalA._id,
    name: 'Cardiology OPD',
    code: 'SRV-CARD-01',
    category: 'consultation',
    specialty: 'Cardiology',
    price: 600
  });

  const today = new Date().toISOString().split('T')[0];
  slotA = await Slot.create({
    hospitalId: hospitalA._id,
    serviceId: serviceA._id,
    doctorId: doctorA._id,
    date: today,
    startTime: '10:00',
    endTime: '10:30',
    type: 'consultation_in_person',
    status: 'BOOKED'
  });

  appointmentA = await Appointment.create({
    referenceNumber: 'APT-TEST-001',
    hospitalId: hospitalA._id,
    patientProfileId: patientProfile._id,
    doctorId: doctorA._id,
    serviceId: serviceA._id,
    slotId: slotA._id,
    date: today,
    startTime: '10:00',
    endTime: '10:30',
    type: 'consultation_in_person',
    consultationFee: 600,
    status: 'CHECKED_IN',
    version: 0
  });
});

describe('MediBridge Doctor Module Verification Suite', () => {
  describe('1. Identity, Profile & Isolation Safeguards', () => {
    it('should return doctor profile with qualifications, regNumber and consult modes', async () => {
      const res = await request(app)
        .get('/api/v1/doctor/profile')
        .set('Authorization', `Bearer ${doctorAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Dr. Aravind Sundaram');
      expect(res.body.data.specialty).toBe('Cardiology');
      expect(res.body.data.regNumber).toContain('TNMC/2026/01111');
      expect(res.body.data.hospital.name).toBe('Kovai Medical Center & Hospital');
    });

    it('should deny patient and hospital admin access to doctor profile route', async () => {
      const resPatient = await request(app)
        .get('/api/v1/doctor/profile')
        .set('Authorization', `Bearer ${patientToken}`);
      expect(resPatient.status).toBe(403);

      const resAdmin = await request(app)
        .get('/api/v1/doctor/profile')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resAdmin.status).toBe(403);
    });

    it('should strictly isolate Doctor A schedule from Doctor B', async () => {
      // Doctor A queries schedule
      const resA = await request(app)
        .get('/api/v1/doctor/schedule')
        .set('Authorization', `Bearer ${doctorAToken}`);
      expect(resA.status).toBe(200);
      expect(resA.body.data.count).toBe(1);
      expect(resA.body.data.appointments[0].referenceNumber).toBe('APT-TEST-001');

      // Doctor B queries schedule: 0 appointments for Doctor B
      const resB = await request(app)
        .get('/api/v1/doctor/schedule')
        .set('Authorization', `Bearer ${doctorBToken}`);
      expect(resB.status).toBe(200);
      expect(resB.body.data.count).toBe(0);
    });
  });

  describe('2. Validated Appointment State Transitions & Concurrency', () => {
    it('should allow Doctor A to advance Checked-in to In consultation', async () => {
      const res = await request(app)
        .patch(`/api/v1/doctor/appointments/${appointmentA._id}/status`)
        .set('Authorization', `Bearer ${doctorAToken}`)
        .send({ status: 'IN_CONSULTATION', version: 0 });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('IN_CONSULTATION');
      expect(res.body.data.version).toBe(1);

      const updated = await Appointment.findById(appointmentA._id);
      expect(updated.status).toBe('IN_CONSULTATION');
    });

    it('should reject invalid transition (Completed to Rescheduled) with 422', async () => {
      // Set to Completed
      appointmentA.status = 'COMPLETED';
      appointmentA.version = 2;
      await appointmentA.save();

      const res = await request(app)
        .patch(`/api/v1/doctor/appointments/${appointmentA._id}/status`)
        .set('Authorization', `Bearer ${doctorAToken}`)
        .send({ status: 'RESCHEDULED', version: 2 });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_FAILED');
    });

    it('should reject concurrent status update with outdated version (409 Conflict)', async () => {
      appointmentA.version = 5;
      await appointmentA.save();

      const res = await request(app)
        .patch(`/api/v1/doctor/appointments/${appointmentA._id}/status`)
        .set('Authorization', `Bearer ${doctorAToken}`)
        .send({ status: 'IN_CONSULTATION', version: 4 });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('ALREADY_HANDLED');
    });

    it('should return 404 when Doctor B attempts to update Doctor A appointment', async () => {
      const res = await request(app)
        .patch(`/api/v1/doctor/appointments/${appointmentA._id}/status`)
        .set('Authorization', `Bearer ${doctorBToken}`)
        .send({ status: 'IN_CONSULTATION', version: 0 });

      expect(res.status).toBe(404);
    });
  });

  describe('3. Doctor Leave Request Submission & Admin Recording', () => {
    it('should submit leave request with idempotency key', async () => {
      const idempotencyKey = 'req_leave_001_idemp';
      const res1 = await request(app)
        .post('/api/v1/doctor/leave-request')
        .set('Authorization', `Bearer ${doctorAToken}`)
        .send({
          startDate: '2026-12-10',
          endDate: '2026-12-12',
          reason: 'Cardiology Annual Symposium',
          idempotencyKey
        });

      expect(res1.status).toBe(201);
      expect(res1.body.data.status).toBe('SUBMITTED');

      // Duplicate submission returns existing request
      const res2 = await request(app)
        .post('/api/v1/doctor/leave-request')
        .set('Authorization', `Bearer ${doctorAToken}`)
        .send({
          startDate: '2026-12-10',
          endDate: '2026-12-12',
          reason: 'Cardiology Annual Symposium',
          idempotencyKey
        });

      expect(res2.status).toBe(200);
      expect(res2.body.data._id).toBe(res1.body.data._id);
    });

    it('should allow hospital admin to record leave from submitted request', async () => {
      const leaveReq = await DoctorLeaveRequest.create({
        doctorId: doctorA._id,
        hospitalId: hospitalA._id,
        startDate: '2026-12-20',
        endDate: '2026-12-22',
        reason: 'Personal leave',
        status: 'SUBMITTED'
      });

      const res = await request(app)
        .patch(`/api/v1/admin/leave-requests/${leaveReq._id}/record`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.leaveRequest.status).toBe('RECORDED_BY_ADMIN');
      expect(res.body.data.leaveDetails.leave.eventId).toBeDefined();
    });
  });

  describe('4. Consultation Notes & Teleconsult Safeguards', () => {
    it('should save consultation notes draft and commit finalized notes', async () => {
      // 1. Save draft
      const draftRes = await request(app)
        .post(`/api/v1/teleconsult/session/${appointmentA._id}/notes`)
        .set('Authorization', `Bearer ${doctorAToken}`)
        .send({
          content: 'Initial patient history: chest discomfort on heavy exertion.',
          isDraft: true
        });

      expect(draftRes.status).toBe(200);
      expect(draftRes.body.data.isDraft).toBe(true);

      // 2. Commit finalized notes
      const commitRes = await request(app)
        .post(`/api/v1/teleconsult/session/${appointmentA._id}/notes`)
        .set('Authorization', `Bearer ${doctorAToken}`)
        .send({
          content: 'Final diagnosis: Stable angina pectoris. Prescribed rest and sublingual nitrates.',
          isDraft: false,
          recommendInPerson: true
        });

      expect(commitRes.status).toBe(200);
      expect(commitRes.body.data.isDraft).toBe(false);
      expect(commitRes.body.data.recommendInPerson).toBe(true);
    });

    it('should reject ending consultation before notes are saved (Clinical Safety Safeguard)', async () => {
      // Delete any existing notes
      await ConsultationNote.deleteMany({ appointmentId: appointmentA._id });

      const res = await request(app)
        .post(`/api/v1/teleconsult/session/${appointmentA._id}/end`)
        .set('Authorization', `Bearer ${doctorAToken}`);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_FAILED');
      expect(res.body.error.message).toContain('Consultation notes must be saved and committed');
    });

    it('should successfully conclude consultation after notes are committed', async () => {
      // Commit note
      await ConsultationNote.create({
        appointmentId: appointmentA._id,
        doctorId: doctorA._id,
        patientProfileId: patientProfile._id,
        hospitalId: hospitalA._id,
        content: 'Clinical notes successfully committed.',
        isDraft: false
      });

      const res = await request(app)
        .post(`/api/v1/teleconsult/session/${appointmentA._id}/end`)
        .set('Authorization', `Bearer ${doctorAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('COMPLETED');

      const updated = await Appointment.findById(appointmentA._id);
      expect(updated.status).toBe('COMPLETED');
    });
  });

  describe('5. Referral Role Separation & Withdrawal', () => {
    it('should deny hospital admin from creating clinical referrals', async () => {
      const res = await request(app)
        .post('/api/v1/referrals')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          patientProfileId: patientProfile._id,
          receivingHospitalId: hospitalB._id,
          targetSpecialty: 'Cardiology',
          clinicalSummary: 'Admin attempt'
        });

      expect(res.status).toBe(403);
    });

    it('should allow Doctor A to create and subsequently withdraw a referral', async () => {
      const resCreate = await request(app)
        .post('/api/v1/referrals')
        .set('Authorization', `Bearer ${doctorAToken}`)
        .send({
          patientProfileId: patientProfile._id,
          receivingHospitalId: hospitalB._id,
          targetSpecialty: 'Cardiology',
          clinicalSummary: 'Severe coronary disease needing physical catheterization',
          priority: 'URGENT'
        });

      expect(resCreate.status).toBe(201);
      const referralId = resCreate.body.data._id;
      expect(resCreate.body.data.status).toBe('SENT');

      // Withdraw referral
      const resWithdraw = await request(app)
        .patch(`/api/v1/referrals/${referralId}/withdraw`)
        .set('Authorization', `Bearer ${doctorAToken}`)
        .send({ reason: 'Patient elected local treatment' });

      expect(resWithdraw.status).toBe(200);
      expect(resWithdraw.body.data.status).toBe('WITHDRAWN');
    });
  });
});
