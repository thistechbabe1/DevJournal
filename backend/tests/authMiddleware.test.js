const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const app = require('../app');
const User = require('../models/User');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Auth Middleware & Centralized Error Handling', () => {
  const secret = 'test_jwt_secret';
  beforeEach(() => {
    process.env.JWT_SECRET = secret;
  });

  test('Missing Bearer token returns clean 401 without process crash', async () => {
    const res = await request(app).get('/api/auth/profile');
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/not authorized, no token/i);
  });

  test('Malformed Bearer token returns clean 401 without process crash', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', 'Bearer malformed_token_123');
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/not authorized, token failed/i);
  });

  test('Expired Bearer token returns clean 401 without process crash', async () => {
    const expiredToken = jwt.sign({ userId: '507f1f77bcf86cd799439011' }, secret, { expiresIn: '-1s' });
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${expiredToken}`);
    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/not authorized, token failed/i);
  });
});
