const request = require('supertest');
const app = require('../app');
const { getTargetUrl, startKeepAlive, stopKeepAlive, pingServer } = require('../services/keepAliveService');

describe('Health & Keep-Alive Service', () => {
  afterEach(() => {
    stopKeepAlive();
    delete process.env.RENDER_EXTERNAL_URL;
    delete process.env.BACKEND_URL;
    delete process.env.SERVER_URL;
    delete process.env.ENABLE_KEEP_ALIVE;
    delete process.env.PING_INTERVAL_MINUTES;
  });

  describe('Health Check Endpoints', () => {
    it('GET /health returns 200 with service info and uptime', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('DevJournal Backend API');
      expect(typeof res.body.uptime).toBe('number');
      expect(res.body.timestamp).toBeDefined();
    });

    it('GET /api/health returns 200 matching /health', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('Keep-Alive Service Logic', () => {
    it('getTargetUrl resolves RENDER_EXTERNAL_URL with /health suffix', () => {
      process.env.RENDER_EXTERNAL_URL = 'https://devjournal.onrender.com/';
      expect(getTargetUrl()).toBe('https://devjournal.onrender.com/health');
    });

    it('getTargetUrl resolves BACKEND_URL when RENDER_EXTERNAL_URL is not set', () => {
      process.env.BACKEND_URL = 'https://custom-api.example.com';
      expect(getTargetUrl()).toBe('https://custom-api.example.com/health');
    });

    it('getTargetUrl returns null when no public URL is defined', () => {
      expect(getTargetUrl()).toBeNull();
    });

    it('startKeepAlive activates timer when ENABLE_KEEP_ALIVE is true', () => {
      process.env.ENABLE_KEEP_ALIVE = 'true';
      process.env.BACKEND_URL = 'http://localhost:5000';
      process.env.PING_INTERVAL_MINUTES = '14';

      expect(() => startKeepAlive()).not.toThrow();
      stopKeepAlive();
    });

    it('pingServer handles unreachable endpoints gracefully without throwing', async () => {
      await expect(pingServer('http://localhost:99999/health')).resolves.not.toThrow();
    });
  });
});
