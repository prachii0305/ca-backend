const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server'); // assuming we export app from server.js

describe('Auth API', () => {
  beforeAll(async () => {
    // Connect to test DB if needed
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should login admin', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@shruti.com',
        password: 'admin123'
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });

  // Add more tests
});
