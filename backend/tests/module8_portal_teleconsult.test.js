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
const authService = require('../src/services/authService');

let hospital, doctor, doctorToken, patientToken, patientProfile, adminToken, teleconsultAppt, unrelatedPatientToken;

beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  await clearTestDB();

  hospital = await Hospital.create({
    name: 'Apollo Specialty Hospital',
    licenseNumber: 'LIC-APO-01',
    location: { type: 'Point', coordinates: [80.25, 13.06] },
    address: { city: 'Chennai', district: 'Chennai', pincode: '600006' },
    phone: '+914428290200',
    bedCapacity: {
      general: { total: 100, available: 25 },
      icu: { total: 20, available: 4 }
    }
  });

  // Admin
  const adminUser = await User.create({
    email: 'apollo.admin@test.com',
    phone: '+919876500111',
    password: 'Password123!',
    role: 'hospital_admin',
    hospitalId: hospital._id
  });
  const aTokens = await authService.generateTokens(adminUser);
  adminToken = aTokens.accessToken;

  // Doctor
  const docUser = await User.create({
    email: 'apollo.doc@test.com',
    phone: '+919876500112',
    password: 'Password123!',
    role: 'doctor',
    hospitalId: hospital._id
  });
  const dTokens = await authService.generateTokens(docUser);
  doctorToken = dTokens.accessToken;

  doctor = await Doctor.create({
    userId: docUser._id,
    hospitalId: hospital._id,
    name: 'Dr. S. Radhakrishnan',
    specialty: 'Neurology',
    qualifications: 'MD, DM (Neuro)',
    regNumber: 'TNMC/2026/88888 (Demo, not verified)',
    consultationFee: 900
  });

  // Patient
  const pUser = await User.create({
    email: 'tele.patient@test.com',
    phone: '+919876500113',
    password: 'Password123!',
    role: 'patient'
  });
  const pTokens = await authService.generateTokens(pUser);
  patientToken = pTokens.accessToken;

  patientProfile = await PatientProfile.create({
    userId: pUser._id,
    fullName: 'Saravanan M',
    dateOfBirth: '1982-11-05',
    gender: 'male',
    relationship: 'self',
    isDefault: true
  });

  // Unrelated Patient (attacker)
  const uUser = await User.create({
    email: 'unrelated@test.com',
    phone: '+919876500114',
    password: 'Password123!',
    role: 'patient'
  });
  const uTokens = await authService.generateTokens(uUser);
  unrelatedPatientToken = uTokens.accessToken;

  const service = await Service.create({
    hospitalId: hospital._id,
    name: 'Neurology Teleconsultation',
    code: 'SRV-TELE-NEURO',
    category: 'consultation',
    specialty: 'Neurology',
    price: 900
  });

  const slot = await Slot.create({
    hospitalId: hospital._id,
    doctorId: doctor._id,
    serviceId: service._id,
    date: '2026-11-25',
    startTime: '10:00',
    endTime: '10:30',
    type: 'consultation_tele',
    status: 'BOOKED'
  });

  teleconsultAppt = await Appointment.create({
    referenceNumber: 'MB-20261125-NEUR',
    hospitalId: hospital._id,
    doctorId: doctor._id,
    serviceId: service._id,
    slotId: slot._id,
    patientProfileId: patientProfile._id,
    date: '2026-11-25',
    startTime: '10:00',
    endTime: '10:30',
    type: 'consultation_tele',
    consultationFee: 900,
    status: 'CONFIRMED'
  });
});

describe('Module 8: Admin Dashboard, Doctor Portal & Teleconsult Entry Point', () => {
  it('should return admin overview with slot numbers and capacity', async () => {
    const res = await request(app)
      .get('/api/v1/admin/overview')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.hospital.name).toBe('Apollo Specialty Hospital');
    expect(res.body.data.hospital.bedCapacity.general.available).toBe(25);
  });

  it('should return doctor schedule for today', async () => {
    const res = await request(app)
      .get('/api/v1/doctor/schedule?date=2026-11-25')
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.count).toBe(1);
    expect(res.body.data.appointments[0].referenceNumber).toBe('MB-20261125-NEUR');
  });

  it('should block unauthorized user from joining teleconsult session (403 JOIN_UNAUTHORIZED)', async () => {
    const res = await request(app)
      .post(`/api/v1/teleconsult/session/${teleconsultAppt._id}/join`)
      .set('Authorization', `Bearer ${unrelatedPatientToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('JOIN_UNAUTHORIZED');
  });

  it('should handle patient joining first into waiting room state', async () => {
    const res = await request(app)
      .post(`/api/v1/teleconsult/session/${teleconsultAppt._id}/join`)
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.participantRole).toBe('PATIENT');
    expect(res.body.data.waitingRoom).toBe(true);
    expect(res.body.data.waitingMessage).toContain('waiting room');
    expect(res.body.data.sessionToken).toBeDefined();
    expect(res.body.data.tierDelivered).toContain('Tier 1');
  });

  it('should transition status to IN_CONSULTATION when doctor joins and clear waiting room', async () => {
    // Patient joins
    await request(app)
      .post(`/api/v1/teleconsult/session/${teleconsultAppt._id}/join`)
      .set('Authorization', `Bearer ${patientToken}`);

    // Doctor joins
    const res = await request(app)
      .post(`/api/v1/teleconsult/session/${teleconsultAppt._id}/join`)
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.participantRole).toBe('DOCTOR');
    expect(res.body.data.status).toBe('IN_CONSULTATION');
    expect(res.body.data.waitingRoom).toBe(false);

    // Verify appointment status updated in database
    const appt = await Appointment.findById(teleconsultAppt._id);
    expect(appt.status).toBe('IN_CONSULTATION');
    expect(appt.teleconsultSession.doctorJoinedAt).toBeDefined();
    expect(appt.teleconsultSession.patientJoinedAt).toBeDefined();
  });
});
