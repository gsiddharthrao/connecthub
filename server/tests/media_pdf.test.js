const request = require('supertest');
const app = require('../src/app');
const path = require('path');
const fs = require('fs');

describe('Media Upload & PDF Resume REST API Endpoints', () => {
  let tokenUser;
  let user;
  let profile;

  beforeEach(async () => {
    // Register test user
    const resAuth = await request(app).post('/api/auth/register').send({
      name: 'Grace Hopper',
      email: 'grace@example.com',
      password: 'password123',
    });
    tokenUser = resAuth.body.token;
    user = resAuth.body.user;

    // Populate profile details
    const resProfile = await request(app)
      .put('/api/profiles/me')
      .set('Authorization', `Bearer ${tokenUser}`)
      .send({
        headline: 'Computer Scientist & Naval Officer',
        summary: 'Pioneer of computer programming and inventor of compilers.',
        location: 'Arlington, VA',
        website: 'https://hopper.example.org',
        skills: ['Compilers', 'COBOL', 'Computer Architecture', 'Debugging'],
        experience: [
          {
            title: 'Director',
            company: 'Naval Data Automation Command',
            location: 'Washington, DC',
            from: '1970-01-01',
            current: true,
            description: 'Directed naval data automation and programming language standardization.',
          },
        ],
        education: [
          {
            school: 'Yale University',
            degree: 'Ph.D.',
            fieldOfStudy: 'Mathematics',
            from: '1930-09-01',
            to: '1934-06-01',
          },
        ],
      });
    profile = resProfile.body.profile;
  });

  describe('POST /api/media/upload', () => {
    it('should upload an image file and return reachable URL and storage indicator', async () => {
      // 1x1 transparent PNG buffer
      const pngBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );

      const res = await request(app)
        .post('/api/media/upload')
        .attach('file', pngBuffer, 'test-image.png');

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.url).toBe('string');
      expect(res.body.url.length).toBeGreaterThan(0);
      expect(['local', 'cloudinary']).toContain(res.body.storage);

      // If local storage, verify file was written and is reachable via static endpoint
      if (res.body.storage === 'local') {
        expect(res.body.filename).toBeDefined();
        // Fetch static uploaded file from /uploads/:filename
        const uploadRes = await request(app).get(`/uploads/${res.body.filename}`);
        expect(uploadRes.status).toBe(200);
      }
    });

    it('should reject request when no file is uploaded (400 Bad Request)', async () => {
      const res = await request(app).post('/api/media/upload');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/no file/i);
    });

    it('should reject non-image file formats (400 Bad Request)', async () => {
      const textBuffer = Buffer.from('Plain text content');

      const res = await request(app)
        .post('/api/media/upload')
        .attach('file', textBuffer, 'document.txt');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject SVG image uploads to prevent stored XSS attacks (400 Bad Request)', async () => {
      const svgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><circle cx="50" cy="50" r="40"/></svg>');

      const res = await request(app)
        .post('/api/media/upload')
        .attach('file', svgBuffer, 'vector.svg');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/svg/i);
    });

    it('should reject SVG disguised with image/svg+xml MIME (400 Bad Request)', async () => {
      const svgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');

      const res = await request(app)
        .post('/api/media/upload')
        .attach('file', svgBuffer, { filename: 'exploit.svg', contentType: 'image/svg+xml' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/profiles/:id/pdf & GET /api/pdf/:id', () => {
    it('should generate and stream a valid PDF resume for a user profile', async () => {
      const res = await request(app)
        .get(`/api/profiles/${profile._id}/pdf`)
        .buffer()
        .parse((res, callback) => {
          const chunks = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => callback(null, Buffer.concat(chunks)));
        });

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toMatch(/application\/pdf/);
      expect(res.header['content-disposition']).toMatch(/attachment; filename=.*\.pdf/);

      // Verify valid PDF binary header magic number %PDF-
      const pdfHeader = res.body.toString('utf8', 0, 5);
      expect(pdfHeader).toBe('%PDF-');
    });

    it('should also generate a valid PDF resume via GET /api/pdf/:id', async () => {
      const res = await request(app)
        .get(`/api/pdf/${user._id}`)
        .buffer()
        .parse((res, callback) => {
          const chunks = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => callback(null, Buffer.concat(chunks)));
        });

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toMatch(/application\/pdf/);
      expect(res.header['content-disposition']).toMatch(/attachment; filename=.*\.pdf/);

      const pdfHeader = res.body.toString('utf8', 0, 5);
      expect(pdfHeader).toBe('%PDF-');
    });

    it('should return 400 for invalid ObjectId format', async () => {
      const res = await request(app).get('/api/profiles/invalid-id/pdf');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('CastError');
    });

    it('should return 404 for non-existent profile ID', async () => {
      const nonExistentId = '65e9b8f2c0a1b2c3d4e5f6a7';
      const res = await request(app).get(`/api/profiles/${nonExistentId}/pdf`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
