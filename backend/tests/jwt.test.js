const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const { generateToken } = require('../controllers/userController');
const { connectDB, disconnectDB } = require('./testHelper');

jest.setTimeout(30000);

let mongoServer;

beforeAll(async () => {
  mongoServer = await connectDB();
  process.env.JWT_EXPIRES_IN = '12h';
});

afterAll(async () => {
  await disconnectDB();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('JWT Payload & Expiry Consolidation', () => {
  it('should include both id and userId in the decoded token payload', () => {
    const fakeUser = {
      _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
      email: 'jwt_test@example.com',
      name: 'JWT User',
    };

    const token = generateToken(fakeUser);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    expect(decoded).toHaveProperty('id', '507f1f77bcf86cd799439011');
    expect(decoded).toHaveProperty('userId', '507f1f77bcf86cd799439011');
    expect(decoded).toHaveProperty('email', 'jwt_test@example.com');
    expect(decoded).toHaveProperty('name', 'JWT User');
  });

  it('should use JWT_EXPIRES_IN from environment variables (e.g. 12h = 43200s)', () => {
    const fakeUser = {
      _id: new mongoose.Types.ObjectId(),
      email: 'jwt_expiry@example.com',
      name: 'Expiry User',
    };

    const token = generateToken(fakeUser);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const diffSeconds = decoded.exp - decoded.iat;
    expect(diffSeconds).toBe(12 * 3600); // 12 hours = 43200 seconds
  });

  it('should return valid token with id and userId on registration and login endpoints', async () => {
    // Register
    const resReg = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'API User',
        email: 'api_user@example.com',
        password: 'password123',
      });

    expect(resReg.status).toBe(201);
    expect(resReg.body.token).toBeDefined();

    const decodedReg = jwt.verify(resReg.body.token, process.env.JWT_SECRET);
    expect(decodedReg.id).toBeDefined();
    expect(decodedReg.userId).toBe(decodedReg.id);

    // Login
    const resLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'api_user@example.com',
        password: 'password123',
      });

    expect(resLogin.status).toBe(200);
    expect(resLogin.body.token).toBeDefined();

    const decodedLogin = jwt.verify(resLogin.body.token, process.env.JWT_SECRET);
    expect(decodedLogin.id).toBe(decodedReg.id);
    expect(decodedLogin.userId).toBe(decodedReg.id);
  });
});
