const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Journal = require('../models/Journal');
const { connectDB, disconnectDB } = require('./testHelper');
const path = require('path');
const fs = require('fs');

describe('Full User Flow & Authorization Header Verification', () => {
  let token;
  let userId;
  let journalId;

  beforeAll(async () => {
    await connectDB();
    await User.deleteMany({});
    await Journal.deleteMany({});
  });

  afterAll(async () => {
    await disconnectDB();
  });

  it('Step 1: Register User and receive token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Flow User',
        email: 'flowuser@example.com',
        password: 'password123'
      });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
  });

  it('Step 2: Login and store token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'flowuser@example.com',
        password: 'password123'
      });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  it('Step 3: Create Journal Entry WITH Authorization header succeeds', async () => {
    const res = await request(app)
      .post('/api/journals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'E2E Verified Journal',
        content: '<p>Testing journal creation after header refactor</p>',
        category: 'Development',
        tags: ['refactor', 'test']
      });

    expect(res.status).toBe(201);
    expect(res.body._id).toBeDefined();
    expect(res.body.title).toBe('E2E Verified Journal');
    journalId = res.body._id;
  });

  it('Step 3b: Create Journal Entry WITHOUT Authorization header is rejected (401)', async () => {
    const res = await request(app)
      .post('/api/journals')
      .send({
        title: 'Unauthenticated Journal',
        content: '<p>Should fail</p>'
      });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Not authorized, no token');
  });

  it('Step 4: Edit Journal Entry WITH Authorization header succeeds', async () => {
    const res = await request(app)
      .put(`/api/journals/${journalId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'E2E Verified Journal - Edited',
        content: '<p>Updated content</p>'
      });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('E2E Verified Journal - Edited');
  });

  it('Step 4b: Edit Journal Entry WITHOUT Authorization header is rejected (401)', async () => {
    const res = await request(app)
      .put(`/api/journals/${journalId}`)
      .send({
        title: 'Hacked Title'
      });

    expect(res.status).toBe(401);
  });

  it('Step 5: Upload Cover Image WITH Authorization header', async () => {
    // Create a temporary 1x1 test image
    const tempImg = path.join(__dirname, 'temp_test_img.png');
    const pngBuffer = Buffer.from(
      '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
      'hex'
    );
    fs.writeFileSync(tempImg, pngBuffer);

    try {
      const res = await request(app)
        .post('/api/journals/upload-image')
        .set('Authorization', `Bearer ${token}`)
        .attach('image', tempImg);

      // In test environment without live Cloudinary creds, multer/cloudinary either uploads or yields structured response
      // Check that it reached the controller and didn't fail at auth
      expect(res.status).not.toBe(401);
    } finally {
      if (fs.existsSync(tempImg)) fs.unlinkSync(tempImg);
    }
  });

  it('Step 5b: Upload Cover Image WITHOUT Authorization header is rejected (401)', async () => {
    const res = await request(app)
      .post('/api/journals/upload-image');

    expect(res.status).toBe(401);
  });

  it('Step 6: Fetch Journal Entry WITH Authorization header succeeds', async () => {
    const res = await request(app)
      .get(`/api/journals/${journalId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(journalId);
  });

  it('Step 7: Delete Journal Entry WITH Authorization header succeeds', async () => {
    const res = await request(app)
      .delete(`/api/journals/${journalId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
  });
});
