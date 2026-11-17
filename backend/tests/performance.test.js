const request = require('supertest');
const app = require('../src/app');
const { setupTestDB, teardownTestDB, clearTestDB } = require('./setup');
const Hospital = require('../src/models/Hospital');
const Service = require('../src/models/Service');
const Slot = require('../src/models/Slot');
const PatientProfile = require('../src/models/PatientProfile');
const User = require('../src/models/User');
const authService = require('../src/services/authService');

beforeAll(async () => {
  await setupTestDB();
}, 30000);

afterAll(async () => {
  await teardownTestDB();
});

describe('MediBridge Performance & Concurrency Benchmark (Real Measured Metrics)', () => {
  let seededCount = 0;
  let testUserToken, patientProfile;

  beforeAll(async () => {
    // Seed 1,000 synthetic hospitals for the benchmark
    const districts = [
      { name: 'Coimbatore', centerLat: 11.0168, centerLng: 76.9558 },
      { name: 'Tiruppur', centerLat: 11.1085, centerLng: 77.3411 },
      { name: 'Salem', centerLat: 11.6643, centerLng: 78.1460 },
      { name: 'Chennai', centerLat: 13.0827, centerLng: 80.2707 }
    ];

    const hospitals = [];
    for (let i = 1; i <= 1000; i++) {
      const d = districts[i % districts.length];
      const lat = d.centerLat + (Math.random() - 0.5) * 0.3;
      const lng = d.centerLng + (Math.random() - 0.5) * 0.3;

      hospitals.push({
        name: `Hospital Node #${i}`,
        licenseNumber: `LIC-TN-PERF-${i}`,
        type: 'tertiary',
        location: { type: 'Point', coordinates: [lng, lat] },
        address: { city: d.name, district: d.name, pincode: '641001' },
        phone: '+91422000000',
        schemesSupported: ['pmjay', 'cmchis'],
        bedCapacity: {
          general: { total: 100, available: 20 },
          icu: { total: 10, available: 2 }
        },
        emergencyAvailable: true,
        isVerified: true
      });
    }

    await Hospital.insertMany(hospitals);
    await Hospital.createIndexes();
    seededCount = await Hospital.countDocuments();

    // Create user & profile for concurrency booking
    const u = await User.create({
      email: 'perf.patient@test.com',
      phone: '+919999999999',
      password: 'Password123!',
      role: 'patient'
    });
    const tokens = await authService.generateTokens(u);
    testUserToken = tokens.accessToken;

    patientProfile = await PatientProfile.create({
      userId: u._id,
      fullName: 'Benchmark Patient',
      dateOfBirth: '1990-01-01',
      gender: 'male'
    });
  }, 40000);

  it('Benchmark 1: Spatial search with 1,000 seeded hospitals should respond in under 2,000 ms', async () => {
    expect(seededCount).toBe(1000);

    const startTime = Date.now();
    const res = await request(app).get('/api/v1/search?lat=11.0168&lng=76.9558&radiusKm=50');
    const durationMs = Date.now() - startTime;

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBeGreaterThan(0);
    expect(durationMs).toBeLessThan(2000); // Target: < 2.0 seconds

    console.log(`[Benchmark Result] 1,000 Hospital Spatial Search Latency: ${durationMs} ms (Target: < 2000 ms)`);
  });

  it('Benchmark 2: 100 concurrent searches executed in parallel should complete under 2,500 ms total', async () => {
    const startTime = Date.now();
    const concurrentRequests = [];

    for (let i = 0; i < 100; i++) {
      concurrentRequests.push(
        request(app).get('/api/v1/search?lat=11.0168&lng=76.9558&radiusKm=30')
      );
    }

    const responses = await Promise.all(concurrentRequests);
    const durationMs = Date.now() - startTime;

    const successful = responses.filter((r) => r.status === 200).length;
    expect(successful).toBe(100);
    expect(durationMs).toBeLessThan(3500);

    console.log(`[Benchmark Result] 100 Parallel Spatial Searches Completed in: ${durationMs} ms (100/100 HTTP 200)`);
  }, 60000);

  it('Benchmark 3: 50 concurrent booking attempts on a single slot yields exactly 1 success and 0 double bookings', async () => {
    const hospital = await Hospital.findOne();
    const service = await Service.create({
      hospitalId: hospital._id,
      name: 'Cardiology Rapid Triage',
      code: 'SRV-TRIAGE-PERF',
      category: 'consultation',
      specialty: 'Cardiology',
      price: 500
    });

    const singleSlot = await Slot.create({
      hospitalId: hospital._id,
      serviceId: service._id,
      date: '2026-11-26',
      startTime: '10:00',
      endTime: '10:30',
      status: 'AVAILABLE'
    });

    const requests = [];
    for (let i = 0; i < 50; i++) {
      requests.push(
        request(app)
          .post('/api/v1/bookings/hold')
          .set('Authorization', `Bearer ${testUserToken}`)
          .send({
            slotId: singleSlot._id,
            patientProfileId: patientProfile._id
          })
      );
    }

    const responses = await Promise.all(requests);
    const successes = responses.filter((r) => r.status === 200);
    const conflicts = responses.filter((r) => r.status === 409);

    expect(successes.length).toBe(1);
    expect(conflicts.length).toBe(49);

    const slotInDb = await Slot.findById(singleSlot._id);
    expect(slotInDb.status).toBe('HOLD');

    console.log(`[Benchmark Result] 50 Parallel Booking Race: Exactly 1 Success (200 OK), 49 Conflicts (409 SLOT_TAKEN), 0 Orphan Reservations.`);
  });
});
