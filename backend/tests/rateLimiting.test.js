const request = require('supertest');
const app = require('../app');
const { connectDB, disconnectDB } = require('./testHelper');

jest.setTimeout(30000);

let mongoServer;

beforeAll(async () => {
  mongoServer = await connectDB();
});

afterAll(async () => {
  await disconnectDB();
});

describe('Security Headers & Rate Limiting', () => {
  it('should include Helmet security headers on HTTP responses', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.headers['x-dns-prefetch-control']).toBe('off');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers['strict-transport-security']).toBeDefined();
  });

  it('should return HTTP 429 when rate limit threshold is exceeded', async () => {
    const requests = [];
    // Send 6 requests with x-test-ratelimit header (limit is set to 5 for test mode)
    for (let i = 0; i < 6; i++) {
      requests.push(
        request(app)
          .post('/api/auth/login')
          .set('x-test-ratelimit', 'true')
          .send({ email: 'ratelimit@example.com', password: 'wrong' })
      );
    }

    const responses = await Promise.all(requests);
    const lastResponse = responses[responses.length - 1];

    expect(lastResponse.status).toBe(429);
    expect(lastResponse.body.message).toMatch(/too many authentication attempts/i);
  });
});
