const request = require('supertest');
const app = require('../src/app');
const { setupTestDB, teardownTestDB, clearTestDB } = require('./setup');
const Hospital = require('../src/models/Hospital');
const Doctor = require('../src/models/Doctor');
const PatientProfile = require('../src/models/PatientProfile');
const User = require('../src/models/User');
const Referral = require('../src/models/Referral');
const authService = require('../src/services/authService');

let ruralHospital, cityHospital, alternativeHospital, ruralDoctorToken, cityDoctorToken, patientToken, patientProfile;

beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  await clearTestDB();

  // Rural PHC (Pollachi)
  ruralHospital = await Hospital.create({
    name: 'Pollachi Primary Health Center',
    licenseNumber: 'LIC-PHC-01',
    type: 'phc',
    location: { type: 'Point', coordinates: [77.01, 10.66] },
    address: { city: 'Pollachi', district: 'Coimbatore', pincode: '642001' },
    phone: '+914259111222'
  });

  // City Tertiary Center (KMCH Coimbatore)
  cityHospital = await Hospital.create({
    name: 'Coimbatore Multi-Specialty Tertiary Hospital',
    licenseNumber: 'LIC-KMCH-01',
    type: 'tertiary',
    location: { type: 'Point', coordinates: [77.03, 11.02] },
    address: { city: 'Coimbatore', district: 'Coimbatore', pincode: '641014' },
    phone: '+91422444555'
  });

  // Alternative City Hospital (PSG)
  alternativeHospital = await Hospital.create({
    name: 'PSG Specialty Hospital',
    licenseNumber: 'LIC-PSG-02',
    type: 'tertiary',
    location: { type: 'Point', coordinates: [77.02, 11.03] },
    address: { city: 'Coimbatore', district: 'Coimbatore', pincode: '641004' },
    phone: '+91422222333'
  });

  // Rural Doctor
  const ruralDocUser = await User.create({
    email: 'rural.doc@phc.gov.in',
    phone: '+919999000101',
    password: 'Password123!',
    role: 'doctor',
    hospitalId: ruralHospital._id
  });
  const rTokens = await authService.generateTokens(ruralDocUser);
  ruralDoctorToken = rTokens.accessToken;

  // City Doctor
  const cityDocUser = await User.create({
    email: 'city.doc@tertiary.org',
    phone: '+919999000102',
    password: 'Password123!',
    role: 'doctor',
    hospitalId: cityHospital._id
  });
  const cTokens = await authService.generateTokens(cityDocUser);
  cityDoctorToken = cTokens.accessToken;

  // Patient
  const patientUser = await User.create({
    email: 'patient.referral@test.com',
    phone: '+919999000103',
    password: 'Password123!',
    role: 'patient'
  });
  const pTokens = await authService.generateTokens(patientUser);
  patientToken = pTokens.accessToken;

  patientProfile = await PatientProfile.create({
    userId: patientUser._id,
    fullName: 'Muthusamy K',
    dateOfBirth: '1965-02-10',
    gender: 'male',
    relationship: 'self',
    isDefault: true
  });
});

describe('Module 5: Rural-to-City Referral Lifecycle & Journey Metrics', () => {
  it('should create referral with dedupeKey and prevent duplicate submissions', async () => {
    const dedupeKey = 'referral_test_key_001';

    // 1st dispatch
    const res1 = await request(app)
      .post('/api/v1/referrals')
      .set('Authorization', `Bearer ${ruralDoctorToken}`)
      .send({
        patientProfileId: patientProfile._id,
        receivingHospitalId: cityHospital._id,
        targetSpecialty: 'Cardiothoracic Surgery',
        clinicalSummary: 'Severe aortic stenosis with recurrent syncope. Immediate surgical evaluation required.',
        priority: 'CRITICAL',
        dedupeKey
      });

    expect(res1.status).toBe(201);
    expect(res1.body.data.status).toBe('SENT');
    expect(res1.body.data.referralNumber).toMatch(/^REF-[0-9]{8}-[A-Z0-9]{4}$/);

    // 2nd duplicate attempt with same dedupeKey
    const res2 = await request(app)
      .post('/api/v1/referrals')
      .set('Authorization', `Bearer ${ruralDoctorToken}`)
      .send({
        patientProfileId: patientProfile._id,
        receivingHospitalId: cityHospital._id,
        targetSpecialty: 'Cardiothoracic Surgery',
        clinicalSummary: 'Duplicate submit attempt',
        dedupeKey
      });

    // Returns existing referral cleanly
    expect(res2.body.data.referralNumber).toBe(res1.body.data.referralNumber);
    const count = await Referral.countDocuments({ dedupeKey });
    expect(count).toBe(1);
  });

  it('should track full lifecycle: Sent -> Received -> Under review -> Accepted -> Patient notified -> Arrived -> Completed with journey metrics', async () => {
    // 1. Sent
    const createRes = await request(app)
      .post('/api/v1/referrals')
      .set('Authorization', `Bearer ${ruralDoctorToken}`)
      .send({
        patientProfileId: patientProfile._id,
        receivingHospitalId: cityHospital._id,
        targetSpecialty: 'Neurology',
        clinicalSummary: 'Intractable seizures refractory to oral anticonvulsants.',
        priority: 'URGENT'
      });
    const referralId = createRes.body.data._id;
    expect(createRes.body.data.status).toBe('SENT');

    // 2. City hospital acknowledges (Received)
    const receiveRes = await request(app)
      .patch(`/api/v1/referrals/${referralId}/receive`)
      .set('Authorization', `Bearer ${cityDoctorToken}`);
    expect(receiveRes.status).toBe(200);
    expect(receiveRes.body.data.status).toBe('RECEIVED');
    expect(receiveRes.body.data.journeyMetrics.receivedAt).toBeDefined();

    // 3. Specialist reviews (Under review)
    const reviewRes = await request(app)
      .patch(`/api/v1/referrals/${referralId}/review`)
      .set('Authorization', `Bearer ${cityDoctorToken}`);
    expect(reviewRes.status).toBe(200);
    expect(reviewRes.body.data.status).toBe('UNDER_REVIEW');

    // 4. City hospital accepts (Accepted)
    const acceptRes = await request(app)
      .patch(`/api/v1/referrals/${referralId}/accept`)
      .set('Authorization', `Bearer ${cityDoctorToken}`)
      .send({});
    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.data.status).toBe('ACCEPTED');

    // 5. Patient confirms travel (Patient notified)
    const confirmRes = await request(app)
      .patch(`/api/v1/referrals/${referralId}/confirm`)
      .set('Authorization', `Bearer ${patientToken}`);
    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.status).toBe('PATIENT_NOTIFIED');

    // 6. Patient arrives at triage (Arrived)
    const arriveRes = await request(app)
      .patch(`/api/v1/referrals/${referralId}/arrive`)
      .set('Authorization', `Bearer ${cityDoctorToken}`);
    expect(arriveRes.status).toBe(200);
    expect(arriveRes.body.data.status).toBe('ARRIVED');
    expect(arriveRes.body.data.journeyMetrics.arrivedAt).toBeDefined();

    // 7. Care completed (Completed)
    const completeRes = await request(app)
      .patch(`/api/v1/referrals/${referralId}/complete`)
      .set('Authorization', `Bearer ${cityDoctorToken}`)
      .send({ outcomeSummary: 'Patient stabilized, MRI completed, medications adjusted.' });
    expect(completeRes.status).toBe(200);
    expect(completeRes.body.data.status).toBe('COMPLETED');
    expect(completeRes.body.data.journeyMetrics.completedAt).toBeDefined();
    expect(completeRes.body.data.journeyMetrics.arrivalToCompletionMinutes).toBeDefined();
  });

  it('should support rejection with alternative hospital recommendations', async () => {
    const createRes = await request(app)
      .post('/api/v1/referrals')
      .set('Authorization', `Bearer ${ruralDoctorToken}`)
      .send({
        patientProfileId: patientProfile._id,
        receivingHospitalId: cityHospital._id,
        targetSpecialty: 'Cardiothoracic Surgery',
        clinicalSummary: 'ICU bed required for post-op telemetry.',
        priority: 'ROUTINE'
      });
    const referralId = createRes.body.data._id;

    // Reject due to ICU capacity and suggest Alternative Hospital
    const rejectRes = await request(app)
      .patch(`/api/v1/referrals/${referralId}/reject`)
      .set('Authorization', `Bearer ${cityDoctorToken}`)
      .send({
        reason: 'Zero ICU beds currently available for surgical recovery.',
        alternativeHospitalIds: [alternativeHospital._id]
      });

    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.data.status).toBe('REJECTED');
    expect(rejectRes.body.data.alternativeHospitals.length).toBe(1);
    expect(rejectRes.body.data.alternativeHospitals[0].hospitalId.toString()).toBe(alternativeHospital._id.toString());
  });
});
