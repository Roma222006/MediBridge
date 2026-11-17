const request = require('supertest');
const { v4: uuidv4 } = require('uuid');
const app = require('../src/app');
const { setupTestDB, teardownTestDB, clearTestDB } = require('./setup');
const Hospital = require('../src/models/Hospital');
const Service = require('../src/models/Service');
const Slot = require('../src/models/Slot');
const Appointment = require('../src/models/Appointment');
const PatientProfile = require('../src/models/PatientProfile');
const OutboxEvent = require('../src/models/OutboxEvent');
const bookingService = require('../src/services/bookingService');

let hospital, service, user1Token, user1Profile, user2Token, user2Profile;

beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  await clearTestDB();

  hospital = await Hospital.create({
    name: 'Coimbatore Medical Center',
    licenseNumber: 'LIC-001',
    type: 'tertiary',
    location: { type: 'Point', coordinates: [77.0, 11.0] },
    address: { city: 'Coimbatore', district: 'Coimbatore', pincode: '641001' },
    phone: '+91422111222'
  });

  service = await Service.create({
    hospitalId: hospital._id,
    name: 'Cardiology Consultation',
    code: 'SRV-01',
    category: 'consultation',
    specialty: 'Cardiology',
    price: 700,
    operatingDays: [1, 2, 3, 4, 5]
  });

  // User 1
  const u1 = await request(app).post('/api/v1/auth/register').send({
    email: 'user1@test.com',
    phone: '+919999900001',
    password: 'Password123!',
    fullName: 'Patient One'
  });
  user1Token = u1.body.data.tokens.accessToken;
  user1Profile = await PatientProfile.findOne({ userId: u1.body.data.user.id });

  // User 2
  const u2 = await request(app).post('/api/v1/auth/register').send({
    email: 'user2@test.com',
    phone: '+919999900002',
    password: 'Password123!',
    fullName: 'Patient Two'
  });
  user2Token = u2.body.data.tokens.accessToken;
  user2Profile = await PatientProfile.findOne({ userId: u2.body.data.user.id });
});

describe('Module 3: Atomic Booking, Concurrency, State Machine & Idempotency', () => {
  it('should allow user1 to hold a slot and reject user2 with 409 SLOT_TAKEN', async () => {
    const slot = await Slot.create({
      hospitalId: hospital._id,
      serviceId: service._id,
      date: '2026-11-21',
      startTime: '09:00',
      endTime: '09:30',
      status: 'AVAILABLE'
    });

    // User 1 holds slot
    const holdRes1 = await request(app)
      .post('/api/v1/bookings/hold')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ slotId: slot._id, patientProfileId: user1Profile._id });

    expect(holdRes1.status).toBe(200);
    expect(holdRes1.body.data.slotId).toBe(slot._id.toString());

    // User 2 attempts to hold same slot
    const holdRes2 = await request(app)
      .post('/api/v1/bookings/hold')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ slotId: slot._id, patientProfileId: user2Profile._id });

    expect(holdRes2.status).toBe(409);
    expect(holdRes2.body.error.code).toBe('SLOT_TAKEN');
  });

  it('should confirm booking and write to Transactional Outbox', async () => {
    const slot = await Slot.create({
      hospitalId: hospital._id,
      serviceId: service._id,
      date: '2026-11-21',
      startTime: '10:00',
      endTime: '10:30',
      status: 'AVAILABLE'
    });

    const idempotencyKey = uuidv4();
    const res = await request(app)
      .post('/api/v1/bookings/confirm')
      .set('Authorization', `Bearer ${user1Token}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({
        slotId: slot._id,
        patientProfileId: user1Profile._id,
        schemeApplied: 'cmchis'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.referenceNumber).toMatch(/^MB-20261121-[A-Z0-9]{4}$/);

    // Verify slot updated to BOOKED
    const updatedSlot = await Slot.findById(slot._id);
    expect(updatedSlot.status).toBe('BOOKED');
    expect(updatedSlot.bookedAppointmentId).toBeDefined();

    // Verify Transactional Outbox event created
    const outbox = await OutboxEvent.findOne({ aggregateId: res.body.data.appointment._id });
    expect(outbox).toBeDefined();
    expect(outbox.eventType).toBe('BOOKING_CONFIRMED');
    expect(outbox.payload.referenceNumber).toBe(res.body.data.referenceNumber);
  });

  it('should enforce idempotency: repeating request returns cached response with X-Cache-Lookup: HIT', async () => {
    const slot = await Slot.create({
      hospitalId: hospital._id,
      serviceId: service._id,
      date: '2026-11-21',
      startTime: '11:00',
      endTime: '11:30',
      status: 'AVAILABLE'
    });

    const idempotencyKey = uuidv4();

    // 1st call
    const res1 = await request(app)
      .post('/api/v1/bookings/confirm')
      .set('Authorization', `Bearer ${user1Token}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({ slotId: slot._id, patientProfileId: user1Profile._id });

    expect(res1.status).toBe(201);
    const ref1 = res1.body.data.referenceNumber;

    // 2nd call with identical key
    const res2 = await request(app)
      .post('/api/v1/bookings/confirm')
      .set('Authorization', `Bearer ${user1Token}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({ slotId: slot._id, patientProfileId: user1Profile._id });

    expect(res2.status).toBe(201);
    expect(res2.headers['x-cache-lookup']).toBe('HIT');
    expect(res2.body.data.referenceNumber).toBe(ref1);

    // Verify only ONE appointment was created in database
    const appts = await Appointment.find({ patientProfileId: user1Profile._id });
    expect(appts.length).toBe(1);
  });

  it('should prevent overlapping appointments for the same patient', async () => {
    // Slot 1: 14:00 - 14:30
    const slot1 = await Slot.create({
      hospitalId: hospital._id,
      serviceId: service._id,
      date: '2026-11-21',
      startTime: '14:00',
      endTime: '14:30',
      status: 'AVAILABLE'
    });

    // Slot 2: 14:15 - 14:45 (Overlaps!)
    const slot2 = await Slot.create({
      hospitalId: hospital._id,
      serviceId: service._id,
      date: '2026-11-21',
      startTime: '14:15',
      endTime: '14:45',
      status: 'AVAILABLE'
    });

    // Book slot 1
    await request(app)
      .post('/api/v1/bookings/confirm')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ slotId: slot1._id, patientProfileId: user1Profile._id });

    // Attempt to book slot 2 for the same patient
    const res2 = await request(app)
      .post('/api/v1/bookings/confirm')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ slotId: slot2._id, patientProfileId: user1Profile._id });

    expect(res2.status).toBe(409);
    expect(res2.body.error.code).toBe('PATIENT_SCHEDULE_CONFLICT');
  });

  it('should cancel booking and restore slot to AVAILABLE', async () => {
    const slot = await Slot.create({
      hospitalId: hospital._id,
      serviceId: service._id,
      date: '2026-11-21',
      startTime: '15:00',
      endTime: '15:30',
      status: 'AVAILABLE'
    });

    const bookRes = await request(app)
      .post('/api/v1/bookings/confirm')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ slotId: slot._id, patientProfileId: user1Profile._id });

    const apptId = bookRes.body.data.appointment._id;

    // Cancel appointment
    const cancelRes = await request(app)
      .post(`/api/v1/bookings/${apptId}/cancel`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ reason: 'Personal emergency' });

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.status).toBe('CANCELLED');

    // Verify slot is returned to AVAILABLE
    const restoredSlot = await Slot.findById(slot._id);
    expect(restoredSlot.status).toBe('AVAILABLE');
  });

  it('should atomically reserve new slot during reschedule, and rollback if new slot is unavailable', async () => {
    const slot1 = await Slot.create({
      hospitalId: hospital._id,
      serviceId: service._id,
      date: '2026-11-21',
      startTime: '16:00',
      endTime: '16:30',
      status: 'AVAILABLE'
    });

    const bookRes = await request(app)
      .post('/api/v1/bookings/confirm')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ slotId: slot1._id, patientProfileId: user1Profile._id });

    const apptId = bookRes.body.data.appointment._id;

    // Create a new slot that is already BOOKED by someone else
    const takenSlot = await Slot.create({
      hospitalId: hospital._id,
      serviceId: service._id,
      date: '2026-11-22',
      startTime: '16:00',
      endTime: '16:30',
      status: 'BOOKED'
    });

    // Try to reschedule to taken slot
    const failRes = await request(app)
      .post(`/api/v1/bookings/${apptId}/reschedule`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ newSlotId: takenSlot._id });

    expect(failRes.status).toBe(409);
    expect(failRes.body.error.code).toBe('NEW_SLOT_UNAVAILABLE');

    // Original appointment must remain CONFIRMED and untouched
    const appt = await Appointment.findById(apptId);
    expect(appt.status).toBe('CONFIRMED');
    expect(appt.slotId.toString()).toBe(slot1._id.toString());
  });

  it('concurrency test: parallel booking race on single slot results in exactly 1 success and 0 orphan reservations', async () => {
    const slot = await Slot.create({
      hospitalId: hospital._id,
      serviceId: service._id,
      date: '2026-11-21',
      startTime: '17:00',
      endTime: '17:30',
      status: 'AVAILABLE'
    });

    // 10 concurrent requests to hold the same slot
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        request(app)
          .post('/api/v1/bookings/hold')
          .set('Authorization', i % 2 === 0 ? `Bearer ${user1Token}` : `Bearer ${user2Token}`)
          .send({
            slotId: slot._id,
            patientProfileId: i % 2 === 0 ? user1Profile._id : user2Profile._id
          })
      );
    }

    const responses = await Promise.all(promises);
    const successes = responses.filter((r) => r.status === 200);
    const conflicts = responses.filter((r) => r.status === 409);

    expect(successes.length).toBe(1);
    expect(conflicts.length).toBe(9);

    const slotInDb = await Slot.findById(slot._id);
    expect(slotInDb.status).toBe('HOLD');
  });

  it('reconciler should release expired holds back to AVAILABLE', async () => {
    const expiredSlot = await Slot.create({
      hospitalId: hospital._id,
      serviceId: service._id,
      date: '2026-11-21',
      startTime: '18:00',
      endTime: '18:30',
      status: 'HOLD',
      holdExpiresAt: new Date(Date.now() - 60 * 1000) // expired 1 min ago
    });

    const result = await bookingService.runReconciler();
    expect(result.releasedHoldsCount).toBeGreaterThanOrEqual(1);

    const refreshedSlot = await Slot.findById(expiredSlot._id);
    expect(refreshedSlot.status).toBe('AVAILABLE');
    expect(refreshedSlot.heldByPatientId).toBeNull();
  });
});
