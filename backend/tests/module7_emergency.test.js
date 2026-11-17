const request = require('supertest');
const app = require('../src/app');
const { setupTestDB, teardownTestDB, clearTestDB } = require('./setup');
const Hospital = require('../src/models/Hospital');

beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  await clearTestDB();

  await Hospital.create({
    name: 'Coimbatore Trauma & Emergency Care',
    licenseNumber: 'LIC-EMERG-01',
    type: 'tertiary',
    location: { type: 'Point', coordinates: [76.96, 11.01] },
    address: { city: 'Coimbatore', district: 'Coimbatore', pincode: '641001' },
    phone: '+91422108108',
    emergencyPhone: '108',
    emergencyAvailable: true,
    bedCapacity: {
      general: { total: 50, available: 14, lastUpdated: new Date() },
      icu: { total: 12, available: 3, lastUpdated: new Date() }
    }
  });

  await Hospital.create({
    name: 'Salem Government Emergency Ward',
    licenseNumber: 'LIC-EMERG-02',
    type: 'district_hq',
    location: { type: 'Point', coordinates: [78.14, 11.66] },
    address: { city: 'Salem', district: 'Salem', pincode: '636001' },
    phone: '+91427108108',
    emergencyPhone: '108',
    emergencyAvailable: true,
    bedCapacity: {
      general: { total: 40, available: 5, lastUpdated: new Date(Date.now() - 150 * 60 * 1000) }, // Stale!
      icu: { total: 8, available: 0, lastUpdated: new Date(Date.now() - 150 * 60 * 1000) }
    }
  });
});

describe('Module 7: Emergency Mode (Zero-Auth, Offline-Ready, 108 Emergency Dial)', () => {
  it('should allow public access to nearest emergency hospitals with NO login or authorization token', async () => {
    const res = await request(app).get('/api/v1/emergency/nearest?lat=11.01&lng=76.96');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].emergencyPhone).toBe('108');
    expect(res.body.data[0].bedCapacity.disclaimer).toContain('Confirm directly with casualty triage');
  });

  it('should support manual district search when GPS is unavailable', async () => {
    const res = await request(app).get('/api/v1/emergency/nearest?district=Salem');

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toContain('Salem');
    expect(res.body.data[0].bedCapacity.isStale).toBe(true);
  });

  it('should provide offline data bundle for service worker caching', async () => {
    const res = await request(app).get('/api/v1/emergency/offline-bundle');

    expect(res.status).toBe(200);
    expect(res.body.emergencyDial).toBe('108');
    expect(res.body.centers.length).toBe(2);
  });
});
