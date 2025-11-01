const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');

describe('Pagination API Tests', () => {
  let adminToken;

  beforeAll(async () => {
    // Login as admin to get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@shruti.com', password: 'admin123' });
    adminToken = loginRes.body.token;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Dashboard Pagination', () => {
    it('should return paginated dashboard data with default values', async () => {
      const res = await request(app)
        .get('/api/dashboard/admin')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('pendingTimesheets');
      expect(res.body).toHaveProperty('allTimesheets');
      expect(res.body).toHaveProperty('stats');
      expect(Array.isArray(res.body.pendingTimesheets)).toBe(true);
      expect(Array.isArray(res.body.allTimesheets)).toBe(true);
    });

    it('should return paginated timesheets with page and limit', async () => {
      const res = await request(app)
        .get('/api/dashboard/admin?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('pendingTimesheets');
      expect(res.body).toHaveProperty('allTimesheets');
      expect(Array.isArray(res.body.allTimesheets)).toBe(true);
      expect(res.body.allTimesheets.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Blogs Pagination', () => {
    it('should return paginated blogs', async () => {
      const res = await request(app)
        .get('/api/blogs?page=1&limit=10');

      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body.blogs)).toBe(true);
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.pagination).toHaveProperty('currentPage');
      expect(res.body.pagination).toHaveProperty('totalPages');
      expect(res.body.pagination).toHaveProperty('totalBlogs');
      expect(res.body.pagination).toHaveProperty('hasNext');
      expect(res.body.pagination).toHaveProperty('hasPrev');
    });

    it('should handle page 2 correctly', async () => {
      const res = await request(app)
        .get('/api/blogs?page=2&limit=5');

      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body.blogs)).toBe(true);
      expect(res.body.blogs.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Team Pagination', () => {
    it('should return paginated team members', async () => {
      const res = await request(app)
        .get('/api/team?page=1&limit=10');

      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeLessThanOrEqual(10);
    });

    it('should handle different page sizes', async () => {
      const res = await request(app)
        .get('/api/team?page=1&limit=3');

      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeLessThanOrEqual(3);
    });
  });
});
