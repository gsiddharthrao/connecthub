const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');

describe('Auth REST API Endpoints', () => {
  const testUser = {
    name: 'Alice Johnson',
    email: 'alice@example.com',
    password: 'password123',
  };

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully with encrypted password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.name).toBe(testUser.name);
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body.user.password).toBeUndefined();

      // Verify in DB that password is encrypted
      const dbUser = await User.findOne({ email: testUser.email }).select('+password');
      expect(dbUser).not.toBeNull();
      expect(dbUser.password).not.toBe(testUser.password);
      expect(dbUser.password.startsWith('$2')).toBe(true);
    });

    it('should reject registration if email is duplicate (409 Conflict)', async () => {
      await request(app).post('/api/auth/register').send(testUser);

      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('should reject registration with missing required fields (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'incomplete@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject registration with password under 6 characters (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Bob', email: 'bob@example.com', password: '123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/at least 6 characters/i);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(testUser);
    });

    it('should login an existing user with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body.user.password).toBeUndefined();
    });

    it('should reject login with incorrect password (401 Unauthorized)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid email or password/i);
    });

    it('should reject login with non-existent email (401 Unauthorized)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject login with missing fields (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    let token;

    beforeEach(async () => {
      const regRes = await request(app).post('/api/auth/register').send(testUser);
      token = regRes.body.token;
    });

    it('should return authenticated user with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body.user.password).toBeUndefined();
    });

    it('should return 401 when Authorization header is missing', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not authorized|no token/i);
    });

    it('should return 401 when Authorization header contains invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.xyz');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/invalid or expired/i);
    });
  });

  describe('POST /api/auth/demo', () => {
    it('should authenticate demo user Sarah Chen and auto-provision account if not exists', async () => {
      const res = await request(app).post('/api/auth/demo');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('sarah.chen@techcorp.io');
      expect(res.body.user.name).toBe('Sarah Chen');
      expect(res.body.user.password).toBeUndefined();
    });
  });
});
