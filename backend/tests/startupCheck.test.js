const { verifyEnvironment } = require('../config/envCheck');

describe('Server Startup Environment Check', () => {
  const originalSecret = process.env.JWT_SECRET;

  afterEach(() => {
    if (originalSecret) {
      process.env.JWT_SECRET = originalSecret;
    } else {
      delete process.env.JWT_SECRET;
    }
  });

  it('refuses to start and throws clear error message when JWT_SECRET is undefined', () => {
    delete process.env.JWT_SECRET;
    expect(() => verifyEnvironment()).toThrow(
      'FATAL: JWT_SECRET environment variable is missing. Server refusing to start.'
    );
  });

  it('refuses to start and throws clear error message when JWT_SECRET is empty whitespace', () => {
    process.env.JWT_SECRET = '   ';
    expect(() => verifyEnvironment()).toThrow(
      'FATAL: JWT_SECRET environment variable is missing. Server refusing to start.'
    );
  });

  it('passes startup check cleanly when JWT_SECRET is set', () => {
    process.env.JWT_SECRET = 'valid_production_or_test_secret_123';
    expect(() => verifyEnvironment()).not.toThrow();
  });
});
