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

let hospital, doctorA, doctorB, service, adminToken, patientToken, patientProfile;

beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  await clearTestDB();

  hospital = await Hospital.create({
    name: 'PSG Hospitals Coimbatore',
    licenseNumber: 'LIC-PSG-01',
    type: 'tertiary',
    location: { type: 'Point', coordinates: [77.01, 11.02] },
    address: { city: 'Coimbatore', district: 'Coimbatore', pincode: '641004' },
    phone: '+914222570170'
  });

  // Admin
  const adminUser = await User.create({
    email: 'admin@psg.com',
    phone: '+919999000001',
    password: 'Password123!',
    role: 'hospital_admin',
    hospitalId: hospital._id
  });
  const adminTokens = await authService.generateTokens(adminUser);
  adminToken = adminTokens.accessToken;

  // Patient
  const patientUser = await User.create({
    email: 'patient@test.com',
    phone: '+919999000002',
    password: 'Password123!',
    role: 'patient'
  });
  const patientTokens = await authService.generateTokens(patientUser);
  patientToken = patientTokens.accessToken;
  patientProfile = await PatientProfile.create({
    userId: patientUser._id,
    fullName: 'Anitha S',
    dateOfBirth: '1988-04-12',
    gender: 'female',
    relationship: 'self',
    isDefault: true
  });

  // Doctor A (Primary Cardiologist)
  doctorA = await Doctor.create({
    userId: adminUser._id,
    hospitalId: hospital._id,
    name: 'Dr. K. Sundaram',
    specialty: 'Cardiology',
    qualifications: 'MD, DM (Cardio)',
    regNumber: 'TNMC/2026/10291 (Demo, not verified)',
    consultationFee: 750
  });

  // Doctor B (Peer Cardiologist - Suggested Alternative)
  doctorB = await Doctor.create({
    userId: adminUser._id,
    hospitalId: hospital._id,
    name: 'Dr. M. Revathi',
    specialty: 'Cardiology',
    qualifications: 'MD, DNB (Cardio)',
    regNumber: 'TNMC/2026/10482 (Demo, not verified)',
    consultationFee: 750
  });

  service = await Service.create({
    hospitalId: hospital._id,
    name: 'Cardiology OPD',
    code: 'SRV-CARD-PSG',
    category: 'consultation',
    specialty: 'Cardiology',
    price: 750
  });
});

describe('Module 4: Doctor Leave and Reassignment Engine', () => {
  it('should detect interval-overlap and place affected appointments into REASSIGNMENT_PENDING with suggested alternative', async () => {
    // Slot & Appointment for Doctor A on 2026-11-24
    const slotA = await Slot.create({
      hospitalId: hospital._id,
      doctorId: doctorA._id,
      serviceId: service._id,
      date: '2026-11-24',
      startTime: '10:00',
      endTime: '10:30',
      status: 'BOOKED'
    });

    const appointment = await Appointment.create({
      referenceNumber: 'MB-20261124-T1A1',
      hospitalId: hospital._id,
      doctorId: doctorA._id,
      serviceId: service._id,
      slotId: slotA._id,
      patientProfileId: patientProfile._id,
      date: '2026-11-24',
      startTime: '10:00',
      endTime: '10:30',
      consultationFee: 750,
      status: 'CONFIRMED'
    });

    // Create an available slot for peer Doctor B on the same day
    const slotB = await Slot.create({
      hospitalId: hospital._id,
      doctorId: doctorB._id,
      serviceId: service._id,
      date: '2026-11-24',
      startTime: '11:00',
      endTime: '11:30',
      status: 'AVAILABLE'
    });

    // Admin records emergency leave for Doctor A
    const leaveRes = await request(app)
      .post('/api/v1/reassignments/leave')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        doctorId: doctorA._id,
        startDate: '2026-11-24',
        endDate: '2026-11-24',
        reason: 'Family medical emergency'
      });

    expect(leaveRes.status).toBe(201);
    expect(leaveRes.body.data.affectedAppointmentsCount).toBe(1);

    // Verify appointment status updated to REASSIGNMENT_PENDING
    const updatedAppt = await Appointment.findById(appointment._id);
    expect(updatedAppt.status).toBe('REASSIGNMENT_PENDING');
    expect(updatedAppt.reassignmentDetails.suggestedDoctorId.toString()).toBe(doctorB._id.toString());
    expect(updatedAppt.reassignmentDetails.suggestedSlotId.toString()).toBe(slotB._id.toString());

    // Verify old slot marked as BLOCKED_LEAVE
    const blockedSlot = await Slot.findById(slotA._id);
    expect(blockedSlot.status).toBe('BLOCKED_LEAVE');
  });

  it('should resolve reassignment using Option 1 (Suggested Doctor)', async () => {
    const slotA = await Slot.create({
      hospitalId: hospital._id,
      doctorId: doctorA._id,
      serviceId: service._id,
      date: '2026-11-24',
      startTime: '14:00',
      endTime: '14:30',
      status: 'BLOCKED_LEAVE'
    });

    const slotB = await Slot.create({
      hospitalId: hospital._id,
      doctorId: doctorB._id,
      serviceId: service._id,
      date: '2026-11-24',
      startTime: '14:30',
      endTime: '15:00',
      status: 'AVAILABLE'
    });

    const appointment = await Appointment.create({
      referenceNumber: 'MB-20261124-OPT1',
      hospitalId: hospital._id,
      doctorId: doctorA._id,
      serviceId: service._id,
      slotId: slotA._id,
      patientProfileId: patientProfile._id,
      date: '2026-11-24',
      startTime: '14:00',
      endTime: '14:30',
      consultationFee: 750,
      status: 'REASSIGNMENT_PENDING',
      reassignmentDetails: {
        originalDoctorId: doctorA._id,
        suggestedDoctorId: doctorB._id,
        suggestedSlotId: slotB._id,
        resolutionChoice: 'NONE'
      }
    });

    // Patient accepts suggested doctor
    const res = await request(app)
      .post(`/api/v1/reassignments/resolve/${appointment._id}`)
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        choice: 'SUGGESTED_DOCTOR',
        replacementSlotId: slotB._id
      });

    expect(res.status).toBe(200);
    expect(res.body.data.resolution).toBe('SUGGESTED_DOCTOR');

    // Verify appointment confirmed with Doctor B
    const confirmedAppt = await Appointment.findById(appointment._id);
    expect(confirmedAppt.status).toBe('CONFIRMED');
    expect(confirmedAppt.doctorId.toString()).toBe(doctorB._id.toString());
    expect(confirmedAppt.slotId.toString()).toBe(slotB._id.toString());

    // Verify replacement slot is now BOOKED
    const bookedSlotB = await Slot.findById(slotB._id);
    expect(bookedSlotB.status).toBe('BOOKED');
  });

  it('should rollback if the replacement slot is claimed by another patient concurrently', async () => {
    const slotA = await Slot.create({
      hospitalId: hospital._id,
      doctorId: doctorA._id,
      serviceId: service._id,
      date: '2026-11-24',
      startTime: '15:00',
      endTime: '15:30',
      status: 'BLOCKED_LEAVE'
    });

    const alreadyTakenSlot = await Slot.create({
      hospitalId: hospital._id,
      doctorId: doctorB._id,
      serviceId: service._id,
      date: '2026-11-24',
      startTime: '15:30',
      endTime: '16:00',
      status: 'BOOKED'
    });

    const appointment = await Appointment.create({
      referenceNumber: 'MB-20261124-ROLL',
      hospitalId: hospital._id,
      doctorId: doctorA._id,
      serviceId: service._id,
      slotId: slotA._id,
      patientProfileId: patientProfile._id,
      date: '2026-11-24',
      startTime: '15:00',
      endTime: '15:30',
      consultationFee: 750,
      status: 'REASSIGNMENT_PENDING'
    });

    // Attempt to resolve with taken slot
    const res = await request(app)
      .post(`/api/v1/reassignments/resolve/${appointment._id}`)
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        choice: 'SUGGESTED_DOCTOR',
        replacementSlotId: alreadyTakenSlot._id
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('NEW_SLOT_UNAVAILABLE');

    // Appointment must remain in REASSIGNMENT_PENDING
    const unchangedAppt = await Appointment.findById(appointment._id);
    expect(unchangedAppt.status).toBe('REASSIGNMENT_PENDING');
  });

  it('should support urgent-case emergency redirect option', async () => {
    const slotA = await Slot.create({
      hospitalId: hospital._id,
      doctorId: doctorA._id,
      serviceId: service._id,
      date: '2026-11-24',
      startTime: '16:00',
      endTime: '16:30',
      status: 'BLOCKED_LEAVE'
    });

    const appointment = await Appointment.create({
      referenceNumber: 'MB-20261124-EMERG',
      hospitalId: hospital._id,
      doctorId: doctorA._id,
      serviceId: service._id,
      slotId: slotA._id,
      patientProfileId: patientProfile._id,
      date: '2026-11-24',
      startTime: '16:00',
      endTime: '16:30',
      consultationFee: 750,
      status: 'REASSIGNMENT_PENDING'
    });

    const res = await request(app)
      .post(`/api/v1/reassignments/resolve/${appointment._id}`)
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ choice: 'EMERGENCY_REDIRECT' });

    expect(res.status).toBe(200);
    expect(res.body.data.resolution).toBe('EMERGENCY_REDIRECT');
    expect(res.body.data.emergencyInstructions.hotline).toBe('108');

    const appt = await Appointment.findById(appointment._id);
    expect(appt.status).toBe('CANCELLED');
    expect(appt.reassignmentDetails.resolutionChoice).toBe('EMERGENCY_REDIRECT');
  });
});
