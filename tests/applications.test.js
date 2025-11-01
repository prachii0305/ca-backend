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
    // First create an application with resume
    const appRes = await request(app)
      .post('/api/applications')
      .field('name', 'Test User')
      .field('email', 'testuser@example.com')
      .field('phone', '1234567890')
      .field('message', 'I want to join')
      .attach('resume', path.join(__dirname, '../uploads/1760030567627.pdf'));

    // Login as admin
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@shruti.com', password: 'admin123' });
    const token = loginRes.body.token;

    // Get all applications to find the ID
    const appsRes = await request(app)
      .get('/api/applications')
      .set('Authorization', `Bearer ${token}`);

    const applicationId = appsRes.body[0]._id;

    // Now test resume download
    const res = await request(app)
      .get(`/api/applications/resume/${applicationId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('filename');
    expect(res.body).toHaveProperty('type');
  });
});
