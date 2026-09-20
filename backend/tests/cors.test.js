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

describe('CORS Configuration', () => {
  it('should allow official Netlify production domain', async () => {
    const res = await request(app)
      .get('/')
      .set('Origin', 'https://devjournaal.netlify.app');

    expect(res.headers['access-control-allow-origin']).toBe('https://devjournaal.netlify.app');
  });

  it('should allow Netlify deploy previews matching strict regex pattern', async () => {
    const previewOrigin = 'https://deploy-preview-123--devjournaal.netlify.app';
    const res = await request(app)
      .get('/')
      .set('Origin', previewOrigin);

    expect(res.headers['access-control-allow-origin']).toBe(previewOrigin);
  });

  it('should reject unauthorized origins', async () => {
    const res = await request(app)
      .get('/')
      .set('Origin', 'https://malicious-domain.com');

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
