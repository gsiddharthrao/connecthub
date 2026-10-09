const request = require('supertest');
const app = require('../src/app');

describe('Profile REST API Endpoints', () => {
  let tokenUser1;
  let user1;
  let tokenUser2;
  let user2;

  beforeEach(async () => {
    const res1 = await request(app).post('/api/auth/register').send({
      name: 'Developer One',
      email: 'dev1@example.com',
      password: 'password123',
    });
    tokenUser1 = res1.body.token;
    user1 = res1.body.user;

    const res2 = await request(app).post('/api/auth/register').send({
      name: 'Developer Two',
      email: 'dev2@example.com',
      password: 'password123',
    });
    tokenUser2 = res2.body.token;
    user2 = res2.body.user;
  });

  describe('GET /api/profiles/me & PUT /api/profiles/me', () => {
    it('should retrieve my profile when authenticated', async () => {
      const res = await request(app)
        .get('/api/profiles/me')
        .set('Authorization', `Bearer ${tokenUser1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.profile).toBeDefined();
      expect(res.body.profile.user._id).toBe(user1._id);
    });

    it('should return 401 when accessing /api/profiles/me unauthenticated', async () => {
      const res = await request(app).get('/api/profiles/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should update current user profile with skills, experience and headline', async () => {
      const updateData = {
        headline: 'Senior Full Stack Engineer',
        summary: 'Specializing in React, Node, and Cloud architecture.',
        location: 'San Francisco, CA',
        website: 'https://example.dev',
        skills: ['JavaScript', 'TypeScript', 'Node.js', 'React', 'MongoDB'],
        experience: [
          {
            title: 'Lead Architect',
            company: 'Tech Corp',
            location: 'San Francisco, CA',
            from: '2022-01-01',
            current: true,
            description: 'Leading platform engineering.',
          },
        ],
      };

      const res = await request(app)
        .put('/api/profiles/me')
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.profile.headline).toBe(updateData.headline);
      expect(res.body.profile.summary).toBe(updateData.summary);
      expect(res.body.profile.skills).toEqual(expect.arrayContaining(['JavaScript', 'Node.js']));
      expect(res.body.profile.experience.length).toBe(1);
      expect(res.body.profile.experience[0].title).toBe('Lead Architect');
    });
  });

  describe('GET /api/profiles & GET /api/profiles/:id', () => {
    beforeEach(async () => {
      await request(app)
        .put('/api/profiles/me')
        .set('Authorization', `Bearer ${tokenUser1}`)
        .send({
          headline: 'Fullstack Dev',
          skills: ['Node.js', 'React'],
          location: 'New York',
        });

      await request(app)
        .put('/api/profiles/me')
        .set('Authorization', `Bearer ${tokenUser2}`)
        .send({
          headline: 'DevOps Engineer',
          skills: ['Docker', 'Kubernetes'],
          location: 'Austin',
        });
    });

    it('should list all profiles with pagination and count', async () => {
      const res = await request(app).get('/api/profiles');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.profiles.length).toBe(2);
    });

    it('should filter profiles by search term', async () => {
      const res = await request(app).get('/api/profiles?search=DevOps');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.profiles.length).toBe(1);
      expect(res.body.profiles[0].headline).toBe('DevOps Engineer');
    });

    it('should retrieve a profile by user ID', async () => {
      const res = await request(app).get(`/api/profiles/${user1._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.profile.headline).toBe('Fullstack Dev');
    });

    it('should return 400 CastError for invalid ObjectId format', async () => {
      const res = await request(app).get('/api/profiles/invalid-id-xyz');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('CastError');
    });

    it('should return 404 for non-existent profile ID', async () => {
      const res = await request(app).get('/api/profiles/507f1f77bcf86cd799439011');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('NotFoundError');
    });
  });
});
