const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

const connectDB = async () => {
  process.env.JWT_SECRET = 'test_jwt_secret_only';
  process.env.JWT_EXPIRES_IN = '24h';

  // Ensure Mongoose connects to in-memory server regardless of any pre-existing process.env.MONGO_URI
  mongoServer = await MongoMemoryServer.create({
    instance: { launchTimeout: 60000 },
  });

  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  return mongoServer;
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
};

module.exports = { connectDB, disconnectDB };
