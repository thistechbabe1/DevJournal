const request = require('supertest');
const app = require('../app');

describe('Health Check Endpoint', () => {
  it('GET /health should return 200 { status: "ok" } without an authorization token', async () => {
    const res = await request(app).get('/health');

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
