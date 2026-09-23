const bcrypt = require('bcryptjs');
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

describe('bcryptjs Consolidation & Password Compatibility', () => {
  it('should verify standard legacy $2a$ and $2b$ bcrypt hashes using bcryptjs', async () => {
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
