const request = require('supertest');
const app = require('../src/app');
const { setupTestDB, teardownTestDB, clearTestDB } = require('./setup');
const Hospital = require('../src/models/Hospital');
const Doctor = require('../src/models/Doctor');
const Service = require('../src/models/Service');
const Slot = require('../src/models/Slot');
const User = require('../src/models/User');

let hospitalA, hospitalB, hospitalC, adminAToken, adminBToken;

beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  await clearTestDB();

  // Create Hospital A (KMCH Coimbatore - 11.0267, 77.0384)
  hospitalA = await Hospital.create({
    name: 'Kovai Medical Center (KMCH)',
    licenseNumber: 'LIC-CBE-001',
    type: 'tertiary',
    location: { type: 'Point', coordinates: [77.0384, 11.0267] },
    address: { city: 'Coimbatore', district: 'Coimbatore', pincode: '641014' },
    phone: '+914224323800',
    schemesSupported: ['pmjay', 'cmchis', 'private_star'],
    bedCapacity: {
      general: { total: 200, available: 45, lastUpdated: new Date() },
      icu: { total: 30, available: 6, lastUpdated: new Date() }
    }
  });

  // Create Hospital B (Pollachi GH - 10.6609, 77.0048, ~40km south)
  hospitalB = await Hospital.create({
    name: 'Pollachi District Headquarters Hospital',
    licenseNumber: 'LIC-POL-002',
    type: 'district_hq',
    location: { type: 'Point', coordinates: [77.0048, 10.6609] },
    address: { city: 'Pollachi', district: 'Coimbatore', pincode: '642001' },
    phone: '+914259223344',
    schemesSupported: ['cmchis'],
    bedCapacity: {
      general: { total: 100, available: 12, lastUpdated: new Date(Date.now() - 180 * 60 * 1000) }, // Stale! 3 hours ago
      icu: { total: 10, available: 1, lastUpdated: new Date(Date.now() - 180 * 60 * 1000) }
    }
  });

  // Create Hospital C (Chennai Apollo - 13.0604, 80.2496, ~500km away)
  hospitalC = await Hospital.create({
    name: 'Chennai Specialty Hospital',
    licenseNumber: 'LIC-CHN-003',
    type: 'tertiary',
    location: { type: 'Point', coordinates: [80.2496, 13.0604] },
    address: { city: 'Chennai', district: 'Chennai', pincode: '600006' },
    phone: '+914428290200',
    schemesSupported: ['pmjay', 'private_star'],
    bedCapacity: {
      general: { total: 300, available: 80, lastUpdated: new Date() },
      icu: { total: 50, available: 15, lastUpdated: new Date() }
    }
  });

  // Services
  await Service.create({
    hospitalId: hospitalA._id,
    name: 'MRI Brain Scan (3T)',
    code: 'SRV-RAD-01',
    category: 'radiology',
    specialty: 'Radiology',
    price: 4500,
    operatingDays: [1, 2, 3, 4, 5, 6]
  });

  await Service.create({
    hospitalId: hospitalA._id,
    name: 'Cardiology Consultation',
    code: 'SRV-CARD-01',
    category: 'consultation',
    specialty: 'Cardiology',
    price: 800,
    operatingDays: [1, 2, 3, 4, 5]
  });

  await Service.create({
    hospitalId: hospitalB._id,
    name: 'General Medicine OPD',
    code: 'SRV-GEN-01',
    category: 'consultation',
    specialty: 'General Medicine',
    price: 150,
    operatingDays: [1, 2, 3, 4, 5, 6]
  });

  // Slots for Hospital A
  await Slot.create({
    hospitalId: hospitalA._id,
    serviceId: (await Service.findOne({ hospitalId: hospitalA._id, specialty: 'Cardiology' }))._id,
    date: '2026-11-20',
    startTime: '10:00',
    endTime: '10:30',
    status: 'AVAILABLE'
  });

  // Setup admin users
  const adminAUser = await User.create({
    email: 'adminA@kmch.com',
    phone: '+919876543201',
    password: 'Password123!',
    role: 'hospital_admin',
    hospitalId: hospitalA._id
  });

  const adminBUser = await User.create({
    email: 'adminB@pollachi.com',
    phone: '+919876543202',
    password: 'Password123!',
    role: 'hospital_admin',
    hospitalId: hospitalB._id
  });

  const authService = require('../src/services/authService');
  const tokensA = await authService.generateTokens(adminAUser);
  adminAToken = tokensA.accessToken;
  const tokensB = await authService.generateTokens(adminBUser);
  adminBToken = tokensB.accessToken;
});

describe('Module 2: Availability Engine and Geospatial Search', () => {
  it('should find hospitals within 50km radius and calculate distance', async () => {
    // Search from Coimbatore city center (11.0168, 76.9558)
    const res = await request(app)
      .get('/api/v1/search?lat=11.0168&lng=76.9558&radiusKm=50');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Should include Hospital A and Hospital B, but NOT Hospital C (~500km away)
    const names = res.body.data.map((h) => h.name);
    expect(names).toContain('Kovai Medical Center (KMCH)');
    expect(names).toContain('Pollachi District Headquarters Hospital');
    expect(names).not.toContain('Chennai Specialty Hospital');
    expect(res.body.data[0].distanceKm).toBeLessThan(res.body.data[1].distanceKm);
  });

  it('should filter hospitals by specialty (Cardiology)', async () => {
    const res = await request(app)
      .get('/api/v1/search?specialty=Cardiology');

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('Kovai Medical Center (KMCH)');
  });

  it('should filter hospitals by government scheme (PM-JAY)', async () => {
    const res = await request(app)
      .get('/api/v1/search?scheme=pmjay');

    expect(res.status).toBe(200);
    const names = res.body.data.map((h) => h.name);
    expect(names).toContain('Kovai Medical Center (KMCH)');
    expect(names).toContain('Chennai Specialty Hospital');
    expect(names).not.toContain('Pollachi District Headquarters Hospital'); // only CMCHIS
  });

  it('should flag stale bed capacity updates (> 120 mins old)', async () => {
    const res = await request(app)
      .get('/api/v1/search?query=Pollachi');

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    const pollachi = res.body.data[0];
    expect(pollachi.bedCapacity.isStale).toBe(true);
    expect(pollachi.bedCapacity.general.minutesAgo).toBeGreaterThanOrEqual(120);
  });

  it('should fetch available slots for a hospital and date', async () => {
    const res = await request(app)
      .get(`/api/v1/search/slots?hospitalId=${hospitalA._id}&date=2026-11-20`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].startTime).toBe('10:00');
    expect(res.body.data[0].status).toBe('AVAILABLE');
  });

  it('should allow hospital admin to update their own bed capacity', async () => {
    const res = await request(app)
      .patch(`/api/v1/search/hospitals/${hospitalA._id}/bed-capacity`)
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({
        general: { total: 200, available: 40 },
        icu: { total: 30, available: 8 }
      });

    expect(res.status).toBe(200);
    expect(res.body.data.general.available).toBe(40);
    expect(res.body.data.icu.available).toBe(8);
  });

  it('should DENY hospital admin from updating another hospital bed capacity (Tenant Isolation)', async () => {
    // Admin A tries to modify Hospital B's bed counts
    const res = await request(app)
      .patch(`/api/v1/search/hospitals/${hospitalB._id}/bed-capacity`)
      .set('Authorization', `Bearer ${adminAToken}`)
      .send({
        general: { total: 100, available: 0 }
      });

    // Tenant guard blocks with 404
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('RESOURCE_NOT_FOUND');
  });
});
