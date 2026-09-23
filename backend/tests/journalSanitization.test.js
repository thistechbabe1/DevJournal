const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const User = require('../models/User');
const Journal = require('../models/Journal');
const { connectDB, disconnectDB } = require('./testHelper');

jest.setTimeout(30000);

let mongoServer;
let userAToken, userBToken;
let userA, userB;

beforeAll(async () => {
  mongoServer = await connectDB();
});

afterAll(async () => {
  await disconnectDB();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Journal.deleteMany({});

  userA = await User.create({
    name: 'User A',
    email: 'usera@example.com',
    password: 'password123',
  });

  userB = await User.create({
    name: 'User B',
    email: 'userb@example.com',
    password: 'password123',
  });

  userAToken = jwt.sign(
    { id: userA._id.toString(), userId: userA._id.toString(), email: userA.email },
    process.env.JWT_SECRET || 'test_jwt_secret_only'
  );

  userBToken = jwt.sign(
    { id: userB._id.toString(), userId: userB._id.toString(), email: userB.email },
    process.env.JWT_SECRET || 'test_jwt_secret_only'
  );
});

describe('Journal Sanitization & Owner Scoping', () => {
  it('should strip mass-assigned fields (e.g. user ID reassignment) during journal creation and update', async () => {
    // Attempt mass assignment on create by supplying userB ID while authenticated as userA
    const createRes = await request(app)
      .post('/api/journals')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        title: 'User A Journal',
        content: 'Journal content',
        user: userB._id.toString(), // malicious field
        adminRole: 'superadmin',    // non-whitelisted field
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.user).toBe(userA._id.toString());
    expect(createRes.body.adminRole).toBeUndefined();

    const journalId = createRes.body._id;

    // Attempt mass assignment on update by trying to change user ownership to userB
    const updateRes = await request(app)
      .put(`/api/journals/${journalId}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        title: 'Updated User A Journal',
        user: userB._id.toString(), // malicious ownership change attempt
        hackedField: true,
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.user).toBe(userA._id.toString());
    expect(updateRes.body.hackedField).toBeUndefined();
  });

  it('should enforce strict cross-user isolation (User B cannot read, update, or delete User A entry)', async () => {
    // User A creates a journal entry
    const journalA = await Journal.create({
      title: 'Private Journal of User A',
      content: 'Confidential thoughts',
      status: 'draft',
      user: userA._id,
    });

    // User B attempts to read User A's journal
    const getRes = await request(app)
      .get(`/api/journals/${journalA._id}`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(getRes.status).toBe(404);
    expect(getRes.body.message).toMatch(/not found or unauthorized/i);

    // User B attempts to update User A's journal
    const putRes = await request(app)
      .put(`/api/journals/${journalA._id}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ title: 'Hacked Title' });

    expect(putRes.status).toBe(404);
    expect(putRes.body.message).toMatch(/not found or unauthorized/i);

    // Verify title was NOT changed in DB
    const checkDb = await Journal.findById(journalA._id);
    expect(checkDb.title).toBe('Private Journal of User A');

    // User B attempts to delete User A's journal
    const deleteRes = await request(app)
      .delete(`/api/journals/${journalA._id}`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(deleteRes.status).toBe(404);

    // Verify journal still exists in DB
    const checkStillExists = await Journal.findById(journalA._id);
    expect(checkStillExists).not.toBeNull();
  });
});
