const request = require('supertest');
const app = require('../src/app');

describe('Connections REST API Endpoints', () => {
  let tokenAlice;
  let userAlice;
  let tokenBob;
  let userBob;
  let tokenCharlie;
  let userCharlie;

  beforeEach(async () => {
    const resA = await request(app).post('/api/auth/register').send({
      name: 'Alice User',
      email: 'alice@connect.test',
      password: 'password123',
    });
    tokenAlice = resA.body.token;
    userAlice = resA.body.user;

    const resB = await request(app).post('/api/auth/register').send({
      name: 'Bob User',
      email: 'bob@connect.test',
      password: 'password123',
    });
    tokenBob = resB.body.token;
    userBob = resB.body.user;

    const resC = await request(app).post('/api/auth/register').send({
      name: 'Charlie User',
      email: 'charlie@connect.test',
      password: 'password123',
    });
    tokenCharlie = resC.body.token;
    userCharlie = resC.body.user;
  });

  describe('POST /api/connections/request', () => {
    it('should allow user Alice to send a connection request to user Bob', async () => {
      const res = await request(app)
        .post('/api/connections/request')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ recipientId: userBob._id });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.connection).toBeDefined();
      expect(res.body.connection.status).toBe('pending');
      expect(res.body.connection.requester._id).toBe(userAlice._id);
      expect(res.body.connection.recipient._id).toBe(userBob._id);
    });

    it('should reject connection request to self with 400', async () => {
      const res = await request(app)
        .post('/api/connections/request')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ recipientId: userAlice._id });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/cannot send connection request to yourself/i);
    });

    it('should reject duplicate connection request with 400', async () => {
      await request(app)
        .post('/api/connections/request')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ recipientId: userBob._id });

      const res = await request(app)
        .post('/api/connections/request')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ recipientId: userBob._id });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already pending|already connected/i);
    });

    it('should return 401 when sending request unauthenticated', async () => {
      const res = await request(app)
        .post('/api/connections/request')
        .send({ recipientId: userBob._id });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Connection Acceptance & Mutual Network', () => {
    let connectionId;

    beforeEach(async () => {
      const reqRes = await request(app)
        .post('/api/connections/request')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ recipientId: userBob._id });
      connectionId = reqRes.body.connection._id;
    });

    it('should show pending requests in GET /api/connections/pending for recipient', async () => {
      const res = await request(app)
        .get('/api/connections/pending')
        .set('Authorization', `Bearer ${tokenBob}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.incoming.length).toBe(1);
      expect(res.body.incoming[0]._id).toBe(connectionId);
      expect(res.body.incoming[0].requester._id).toBe(userAlice._id);
    });

    it('should allow recipient Bob to accept the connection request', async () => {
      const res = await request(app)
        .post(`/api/connections/${connectionId}/accept`)
        .set('Authorization', `Bearer ${tokenBob}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.connection.status).toBe('accepted');
    });

    it('should also accept connection request via PUT /api/connections/accept/:id', async () => {
      const res = await request(app)
        .put(`/api/connections/accept/${connectionId}`)
        .set('Authorization', `Bearer ${tokenBob}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.connection.status).toBe('accepted');
    });

    it('should forbid third-party Charlie from accepting the connection (403 Forbidden)', async () => {
      const res = await request(app)
        .post(`/api/connections/${connectionId}/accept`)
        .set('Authorization', `Bearer ${tokenCharlie}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not authorized to accept/i);
    });

    it('should reflect mutual connection in GET /api/connections for both users', async () => {
      // Bob accepts
      await request(app)
        .post(`/api/connections/${connectionId}/accept`)
        .set('Authorization', `Bearer ${tokenBob}`);

      // Check for Alice
      const resAlice = await request(app)
        .get('/api/connections')
        .set('Authorization', `Bearer ${tokenAlice}`);

      expect(resAlice.status).toBe(200);
      expect(resAlice.body.success).toBe(true);
      expect(resAlice.body.count).toBe(1);

      // Check for Bob
      const resBob = await request(app)
        .get('/api/connections')
        .set('Authorization', `Bearer ${tokenBob}`);

      expect(resBob.status).toBe(200);
      expect(resBob.body.success).toBe(true);
      expect(resBob.body.count).toBe(1);
    });

    it('should allow recipient Bob to reject the connection request', async () => {
      const res = await request(app)
        .post(`/api/connections/${connectionId}/reject`)
        .set('Authorization', `Bearer ${tokenBob}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/connection rejected/i);

      // Verify mutual connections is 0
      const resConnections = await request(app)
        .get('/api/connections')
        .set('Authorization', `Bearer ${tokenAlice}`);

      expect(resConnections.body.count).toBe(0);
    });
  });
});
