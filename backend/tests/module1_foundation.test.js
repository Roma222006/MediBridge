const request = require('supertest');
const app = require('../src/app');
const { setupTestDB, teardownTestDB, clearTestDB } = require('./setup');
const User = require('../src/models/User');
const RefreshToken = require('../src/models/RefreshToken');
const PatientProfile = require('../src/models/PatientProfile');

beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

describe('Module 1: Foundation (Auth, RBAC, Token Rotation, Session Invalidation, Profiles)', () => {
  describe('User Registration & Profiles', () => {
    it('should register a new patient and auto-generate default self profile', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'roma@example.com',
          phone: '+919876543210',
          password: 'Password123!',
          fullName: 'Roma R'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('roma@example.com');
      expect(res.body.data.user.role).toBe('patient');
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.tokens.refreshToken).toBeDefined();

      // Verify default self-profile in DB
      const profile = await PatientProfile.findOne({ userId: res.body.data.user.id });
      expect(profile).toBeDefined();
      expect(profile.fullName).toBe('Roma R');
      expect(profile.relationship).toBe('self');
      expect(profile.isDefault).toBe(true);
    });

    it('should prevent registration with duplicate email', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'ragavi@example.com',
          phone: '+919876543211',
          password: 'Password123!'
        });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'ragavi@example.com',
          phone: '+919876543212',
          password: 'AnotherPassword!'
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('EMAIL_EXISTS');
    });
  });

  describe('Authentication & Lockout Protection', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'rithika@example.com',
          phone: '+919876543213',
          password: 'CorrectPassword123!'
        });
    });

    it('should login successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'rithika@example.com',
          password: 'CorrectPassword123!'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tokens.accessToken).toBeDefined();
    });

    it('should lock out user after 5 consecutive failed attempts', async () => {
      for (let i = 0; i < 4; i++) {
        const res = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: 'rithika@example.com',
            password: 'WrongPassword!'
          });
        expect(res.status).toBe(401);
      }

      // 5th attempt triggers lockout
      const fifthRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'rithika@example.com',
          password: 'WrongPassword!'
        });
      expect(fifthRes.status).toBe(401);

      // 6th attempt should return 429 ACCOUNT_LOCKED even with correct password!
      const lockedRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'rithika@example.com',
          password: 'CorrectPassword123!'
        });
      expect(lockedRes.status).toBe(429);
      expect(lockedRes.body.error.code).toBe('ACCOUNT_LOCKED');
    });
  });

  describe('Refresh Token Rotation & Reuse Detection', () => {
    let authUser, initialTokens;

    beforeEach(async () => {
      const reg = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'patient1@example.com',
          phone: '+919876543214',
          password: 'SecurePassword123!'
        });
      authUser = reg.body.data.user;
      initialTokens = reg.body.data.tokens;
    });

    it('should rotate refresh token and issue a fresh token pair', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: initialTokens.refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.refreshToken).not.toBe(initialTokens.refreshToken);

      // Verify the old token is marked revoked
      const oldTokenDoc = await RefreshToken.findOne({ token: initialTokens.refreshToken });
      expect(oldTokenDoc.isRevoked).toBe(true);
    });

    it('should detect reuse of a revoked token and invalidate entire token family & session', async () => {
      // 1st rotation (legitimate)
      const rotateRes = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: initialTokens.refreshToken });
      expect(rotateRes.status).toBe(200);
      const secondTokens = rotateRes.body.data;

      // Attacker tries to use the initial (now revoked) refresh token
      const maliciousRes = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: initialTokens.refreshToken });

      expect(maliciousRes.status).toBe(401);
      expect(maliciousRes.body.error.code).toBe('TOKEN_REUSE_DETECTED');

      // The legitimate second token should ALSO now be revoked due to family invalidation
      const subsequentRes = await request(app)
        .post('/api/v1/auth/refresh-token')
        .send({ refreshToken: secondTokens.refreshToken });
      expect(subsequentRes.status).toBe(401);
      expect(subsequentRes.body.error.code).toBe('TOKEN_REUSE_DETECTED');

      // Furthermore, the existing access token should now be rejected due to tokenVersion increment
      const meRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${secondTokens.accessToken}`);
      expect(meRes.status).toBe(401);
      expect(meRes.body.error.code).toBe('SESSION_REVOKED');
    });
  });

  describe('Session Invalidation via tokenVersion', () => {
    it('should immediately invalidate access token when revoke-all-sessions is triggered', async () => {
      const reg = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'revoke@example.com',
          phone: '+919876543215',
          password: 'Password123!'
        });
      const token = reg.body.data.tokens.accessToken;

      // Access /me succeeds
      const beforeRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(beforeRes.status).toBe(200);

      // Call revoke-all-sessions
      const revokeRes = await request(app)
        .post('/api/v1/auth/revoke-all-sessions')
        .set('Authorization', `Bearer ${token}`);
      expect(revokeRes.status).toBe(200);

      // Access /me with the same token now fails
      const afterRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(afterRes.status).toBe(401);
      expect(afterRes.body.error.code).toBe('SESSION_REVOKED');
    });
  });

  describe('Family Patient Profiles & Isolation', () => {
    let user1Token, user2Token, user1ProfileId;

    beforeEach(async () => {
      const u1 = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'u1@example.com', phone: '+919999999991', password: 'Password123!' });
      user1Token = u1.body.data.tokens.accessToken;

      const u2 = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'u2@example.com', phone: '+919999999992', password: 'Password123!' });
      user2Token = u2.body.data.tokens.accessToken;

      // Create a family member profile under user1
      const pRes = await request(app)
        .post('/api/v1/patient-profiles')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          fullName: 'Kaliappan R (Father)',
          dateOfBirth: '1962-05-15',
          gender: 'male',
          bloodGroup: 'B+',
          relationship: 'parent'
        });
      user1ProfileId = pRes.body.data._id;
    });

    it('should list only profiles owned by the logged-in user', async () => {
      const res = await request(app)
        .get('/api/v1/patient-profiles')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2); // default self + father
      expect(res.body.data.some((p) => p.fullName.includes('Father'))).toBe(true);

      const res2 = await request(app)
        .get('/api/v1/patient-profiles')
        .set('Authorization', `Bearer ${user2Token}`);
      expect(res2.status).toBe(200);
      expect(res2.body.data.length).toBe(1); // user2's own self profile only
    });

    it('should deny user2 from accessing or modifying user1 profile (404/not found)', async () => {
      const getRes = await request(app)
        .get(`/api/v1/patient-profiles/${user1ProfileId}`)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(getRes.status).toBe(404);
      expect(getRes.body.error.code).toBe('PROFILE_NOT_FOUND');

      const updateRes = await request(app)
        .put(`/api/v1/patient-profiles/${user1ProfileId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ fullName: 'Malicious Change' });
      expect(updateRes.status).toBe(404);
    });
  });
});
