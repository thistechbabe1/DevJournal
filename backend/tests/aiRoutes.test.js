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

describe('AI Routes Protection', () => {
  it('POST /api/ai/chat without Bearer token returns HTTP 401', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .send({ message: 'Hello AI' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: 'Not authorized, no token' });
  });

  it('POST /api/ai/journal-insights without Bearer token returns HTTP 401', async () => {
    const res = await request(app)
      .post('/api/ai/journal-insights')
      .send({ journalEntryContent: 'Learned Docker today' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: 'Not authorized, no token' });
  });
});
