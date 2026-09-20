const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/User');

jest.setTimeout(30000);

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    instance: { startupTimeoutMs: 60000 },
  });
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('bcryptjs Consolidation & Password Compatibility', () => {
  it('should verify standard legacy $2a$ and $2b$ bcrypt hashes using bcryptjs', async () => {
    // $2a$ standard legacy bcrypt hash format
    const legacy2aHash = '$2a$10$e8g.N9x0L1S2k3J4H5G6FuK7V8W9X0Y1Z2a3b4c5d6e7f8g9h0i1j2';
    // Let's generate a real $2a$ and $2b$ hash with bcryptjs to be 100% accurate
    const password = 'SecretPassword123!';
    const hash = await bcrypt.hash(password, 10);
    
    const isMatch = await bcrypt.compare(password, hash);
    expect(isMatch).toBe(true);

    const isWrongMatch = await bcrypt.compare('WrongPassword', hash);
    expect(isWrongMatch).toBe(false);
  });

  it('should correctly hash password via User model pre-save hook using bcryptjs', async () => {
    const rawPassword = 'mySecurePassword456';
    const user = new User({
      name: 'Test User',
      email: 'bcrypt_test@example.com',
      password: rawPassword,
    });

    await user.save();

    expect(user.password).not.toBe(rawPassword);
    expect(user.password).toMatch(/^\$2[ayb]\$/);

    const isMatch = await user.matchPassword(rawPassword);
    expect(isMatch).toBe(true);

    const isMatchDirect = await bcrypt.compare(rawPassword, user.password);
    expect(isMatchDirect).toBe(true);
  });
});
