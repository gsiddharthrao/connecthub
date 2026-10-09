const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Profile = require('../src/models/Profile');
const Post = require('../src/models/Post');

describe('Adversarial Security & Auth Challenge Suite (Challenger M1-1)', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-connecthub-qa-2026';

  const baseUser = {
    name: 'Security Probe',
    email: 'probe@connecthub.security',
    password: 'CorrectHorseBatteryStaple!9',
  };

  // ─────────────────────────────────────────────────────────────
  // 1. JWT TOKEN INTEGRITY & EDGE CASES
  // ─────────────────────────────────────────────────────────────
  describe('JWT Verification & Header Edge Cases', () => {
    let validToken;
    let validUserId;

    beforeEach(async () => {
      const reg = await request(app).post('/api/auth/register').send(baseUser);
      validToken = reg.body.token;
      validUserId = reg.body.user._id;
    });

    it('PROBE-JWT-01: Missing Authorization header must return 401', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Unauthorized');
    });

    it('PROBE-JWT-02: Empty Authorization header must return 401', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', '');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('PROBE-JWT-03: Header without Bearer prefix (e.g. Basic / Token) must return 401', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Token ${validToken}`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('PROBE-JWT-04: Header with empty Bearer value must return 401', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer ');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('PROBE-JWT-05: Header with multiple spaces after Bearer must return 401', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer     ');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('PROBE-JWT-06: Malformed / gibberish JWT string must return 401', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.malformed.token.signature');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid or expired/i);
    });

    it('PROBE-JWT-07: Token signed with unauthorized secret key must return 401', async () => {
      const forgedToken = jwt.sign({ id: validUserId }, 'evil-attacker-secret-key-12345');
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${forgedToken}`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid or expired/i);
    });

    it('PROBE-JWT-08: Expired token must return 401', async () => {
      const expiredToken = jwt.sign(
        { id: validUserId },
        JWT_SECRET,
        { expiresIn: '-10s' }
      );
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid or expired/i);
    });

    it('PROBE-JWT-09: Token with valid signature for deleted user must return 401', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const orphanToken = jwt.sign({ id: nonExistentId.toString() }, JWT_SECRET);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${orphanToken}`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/no longer exists/i);
    });

    it('PROBE-JWT-10: Token with malformed user ID (non-ObjectId) must return 401 without crashing', async () => {
      const malformedIdToken = jwt.sign({ id: 'this-is-not-a-mongo-id' }, JWT_SECRET);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${malformedIdToken}`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('PROBE-JWT-11: Unsigned token (alg: none exploit attempt) must be rejected with 401', async () => {
      // Craft an alg: none JWT
      const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({ id: validUserId.toString() })).toString('base64url');
      const noneToken = `${header}.${payload}.`;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${noneToken}`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. PASSWORD HASH SECRECY & PAYLOAD SANITIZATION
  // ─────────────────────────────────────────────────────────────
  describe('Password Hash Secrecy & Data Leakage Prevention', () => {
    it('PROBE-LEAK-01: Registration response must NEVER contain password or hash', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Secrecy Test 1',
          email: 'secrecy1@example.com',
          password: 'TopSecretPassword99!',
        });

      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.password).toBeUndefined();

      // Deep string scan of entire response JSON
      const serialized = JSON.stringify(res.body);
      expect(serialized).not.toContain('TopSecretPassword99!');
      expect(serialized).not.toContain('$2a$');
      expect(serialized).not.toContain('$2b$');
    });

    it('PROBE-LEAK-02: Login response must NEVER leak password or hash', async () => {
      await request(app).post('/api/auth/register').send(baseUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: baseUser.email, password: baseUser.password });

      expect(res.status).toBe(200);
      expect(res.body.user.password).toBeUndefined();

      const serialized = JSON.stringify(res.body);
      expect(serialized).not.toContain(baseUser.password);
      expect(serialized).not.toContain('$2a$');
      expect(serialized).not.toContain('$2b$');
    });

    it('PROBE-LEAK-03: GET /api/auth/me response must NEVER leak password or hash', async () => {
      const reg = await request(app).post('/api/auth/register').send(baseUser);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${reg.body.token}`);

      expect(res.status).toBe(200);
      expect(res.body.user.password).toBeUndefined();

      const serialized = JSON.stringify(res.body);
      expect(serialized).not.toContain(baseUser.password);
      expect(serialized).not.toContain('$2a$');
      expect(serialized).not.toContain('$2b$');
    });

    it('PROBE-LEAK-04: Stored database record must have strong bcrypt hash, not plaintext', async () => {
      await request(app).post('/api/auth/register').send(baseUser);

      const dbUser = await User.findOne({ email: baseUser.email.toLowerCase() }).select('+password');
      expect(dbUser).not.toBeNull();
      expect(dbUser.password).not.toBe(baseUser.password);
      // Bcrypt hash signature check
      expect(dbUser.password).toMatch(/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/);
    });

    it('PROBE-SEC-05: Mass assignment / Role escalation attempt on register must be ignored', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Attacker Escalation',
          email: 'attacker@example.com',
          password: 'password123',
          role: 'admin',
        });

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('user');

      // Verify directly in DB
      const dbUser = await User.findOne({ email: 'attacker@example.com' });
      expect(dbUser.role).toBe('user');
    });

    it('PROBE-LEAK-06: Profile and Post populated user objects must NEVER leak password', async () => {
      const reg = await request(app).post('/api/auth/register').send(baseUser);
      const token = reg.body.token;

      // Create a post
      const postRes = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Security audit test post' });

      expect(postRes.status).toBe(201);
      const postSerialized = JSON.stringify(postRes.body);
      expect(postSerialized).not.toContain('$2');
      expect(postRes.body.post.user.password).toBeUndefined();

      // Retrieve profiles
      const profRes = await request(app).get('/api/profiles');
      expect(profRes.status).toBe(200);
      const profSerialized = JSON.stringify(profRes.body);
      expect(profSerialized).not.toContain('$2');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. REGISTRATION & LOGIN BOUNDARY CONDITIONS & VALIDATION
  // ─────────────────────────────────────────────────────────────
  describe('Input Validation & Boundary Probes', () => {
    it('PROBE-VAL-01: Empty password string ("") on register must return 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Bob', email: 'bob@example.com', password: '' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('PROBE-VAL-02: Missing password field on register must return 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Bob', email: 'bob@example.com' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('PROBE-VAL-03: Password under 6 characters (5 chars) must return 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Bob', email: 'bob@example.com', password: '12345' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/at least 6 characters/i);
    });

    it('PROBE-VAL-04: Whitespace-only name must return 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: '   ', email: 'trimname@example.com', password: 'password123' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('PROBE-VAL-05: Malformed email formats must return 400 Bad Request', async () => {
      const badEmails = [
        'plainaddress',
        '@missinguser.com',
        'missingdomain@',
        'spaces in@email.com',
      ];

      for (const badEmail of badEmails) {
        const res = await request(app)
          .post('/api/auth/register')
          .send({ name: 'Test', email: badEmail, password: 'password123' });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      }
    });

    it('PROBE-DUP-06: Duplicate email with case differences must return 409 Conflict', async () => {
      const res1 = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Case User', email: 'caseuser@example.com', password: 'password123' });
      expect(res1.status).toBe(201);

      const res2 = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Case User Upper', email: 'CASEUSER@EXAMPLE.COM', password: 'password123' });
      expect(res2.status).toBe(409);
      expect(res2.body.success).toBe(false);
      expect(res2.body.message).toMatch(/already exists/i);
    });

    it('PROBE-DUP-07: Duplicate email with leading/trailing spaces must return 409 Conflict', async () => {
      const res1 = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Pad User', email: 'paduser@example.com', password: 'password123' });
      expect(res1.status).toBe(201);

      const res2 = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Pad User 2', email: '  paduser@example.com  ', password: 'password123' });
      expect(res2.status).toBe(409);
      expect(res2.body.success).toBe(false);
    });

    it('PROBE-AUTH-08: Login with mixed-case and padded email must succeed', async () => {
      await request(app).post('/api/auth/register').send(baseUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: '  PROBE@ConnectHub.Security  ', password: baseUser.password });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(baseUser.email.toLowerCase());
    });

    it('PROBE-AUTH-09: Login error message must be uniform to prevent user enumeration', async () => {
      await request(app).post('/api/auth/register').send(baseUser);

      // 1. Existing user, wrong password
      const resWrongPass = await request(app)
        .post('/api/auth/login')
        .send({ email: baseUser.email, password: 'wrong_password_xyz' });
      expect(resWrongPass.status).toBe(401);

      // 2. Non-existent user
      const resNoSuchUser = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ghost@nowhere.org', password: 'some_password' });
      expect(resNoSuchUser.status).toBe(401);

      // Both should yield the exact same error message to avoid enumeration
      expect(resWrongPass.body.message).toBe(resNoSuchUser.body.message);
      expect(resWrongPass.body.message).toMatch(/invalid email or password/i);
    });

    it('PROBE-AUTH-10: Login with empty password or email must return 400', async () => {
      const resNoPass = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@example.com' });
      expect(resNoPass.status).toBe(400);

      const resNoEmail = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' });
      expect(resNoEmail.status).toBe(400);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. CONCURRENT REGISTRATION RACE CONDITION STRESS TEST
  // ─────────────────────────────────────────────────────────────
  describe('Concurrency & Race Condition Resistance', () => {
    it('PROBE-RACE-01: Concurrent duplicate registrations must only allow exactly 1 success', async () => {
      const concurrentEmail = 'race_condition@example.com';
      const requests = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post('/api/auth/register')
          .send({
            name: `Race User ${i}`,
            email: concurrentEmail,
            password: 'concurrentPassword123',
          })
      );

      const results = await Promise.all(requests);
      const successCount = results.filter((r) => r.status === 201).length;
      const conflictCount = results.filter((r) => r.status === 409).length;

      // Exactly 1 should win, all other 4 should receive 409
      expect(successCount).toBe(1);
      expect(conflictCount).toBe(4);

      // Ensure DB only has 1 record for this email
      const dbUsers = await User.find({ email: concurrentEmail });
      expect(dbUsers.length).toBe(1);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. COMPREHENSIVE 401 GUARD VERIFICATION ON ALL PROTECTED ROUTES
  // ─────────────────────────────────────────────────────────────
  describe('Universal Protected Route Guards (Strict 401)', () => {
    const fakeId = new mongoose.Types.ObjectId();

    const protectedEndpoints = [
      { method: 'get', url: '/api/auth/me' },
      { method: 'get', url: '/api/profiles/me' },
      { method: 'put', url: '/api/profiles/me', body: { headline: 'Test' } },
      { method: 'delete', url: '/api/profiles/me' },
      { method: 'post', url: '/api/posts', body: { content: 'Test post' } },
      { method: 'delete', url: `/api/posts/${fakeId}` },
      { method: 'post', url: `/api/posts/${fakeId}/like` },
      { method: 'post', url: `/api/posts/${fakeId}/comment`, body: { content: 'Test' } },
      { method: 'delete', url: `/api/posts/${fakeId}/comment/${fakeId}` },
      { method: 'post', url: '/api/connections/request', body: { recipientId: fakeId } },
      { method: 'post', url: `/api/connections/${fakeId}/accept` },
      { method: 'post', url: `/api/connections/${fakeId}/reject` },
      { method: 'get', url: '/api/connections' },
      { method: 'get', url: '/api/connections/pending' },
      { method: 'get', url: `/api/connections/status/${fakeId}` },
    ];

    test.each(protectedEndpoints)(
      'PROBE-GUARD: $method.toUpperCase() $url must strictly reject unauthenticated requests with 401',
      async ({ method, url, body }) => {
        let reqBuilder = request(app)[method](url);
        if (body) {
          reqBuilder = reqBuilder.send(body);
        }

        const res = await reqBuilder;
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Unauthorized');
      }
    );
  });
});
