const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const path = require('path');

describe('Applications API', () => {
  beforeAll(async () => {
    // Connect to test DB if needed
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should submit an application with resume upload', async () => {
    const res = await request(app)
      .post('/api/applications')
      .field('name', 'Test User')
      .field('email', 'testuser@example.com')
      .field('phone', '1234567890')
      .field('message', 'I want to join')
      .attach('resume', path.join(__dirname, '../uploads/1760030567627.pdf'));
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('msg', 'Application submitted successfully');
  });

  it('should get all applications as admin', async () => {
    // First login as admin to get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@shruti.com', password: 'admin123' });
    const token = loginRes.body.token;

    const res = await request(app)
      .get('/api/applications')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should serve resume file as admin', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@shruti.com', password: 'admin123' });
    const token = loginRes.body.token;

    const res = await request(app)
      .get('/api/applications/resume/1760030567627.pdf')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.headers['content-type']).toMatch(/application\/pdf/);
  });
});
