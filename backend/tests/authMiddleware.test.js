const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const User = require('../models/User');
const { connectDB, disconnectDB } = require('./testHelper');

jest.setTimeout(30000);

let mongoServer;

beforeAll(async () => {
  mongoServer = await connectDB();
});

afterAll(async () => {
  await disconnectDB();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('Auth Middleware & Centralized Error Handling', () => {
  it('Missing Bearer token returns clean 401 without process crash', async () => {
    const res = await request(app).get('/api/journals');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: 'Not authorized, no token' });
  });

  it('Malformed Bearer token returns clean 401 without process crash', async () => {
    const res = await request(app)
      .get('/api/journals')
      .set('Authorization', 'Bearer invalidtoken123');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: 'Not authorized, token failed' });
  });

  it('Expired Bearer token returns clean 401 without process crash', async () => {
    const expiredToken = jwt.sign(
      { userId: '507f1f77bcf86cd799439011' },
      process.env.JWT_SECRET || 'test_jwt_secret_only',
      { expiresIn: '-1s' }
    );

    const res = await request(app)
      .get('/api/journals')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: 'Not authorized, token failed' });
  });
});
