const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key-connecthub-qa-2026';
  process.env.PORT = '5001';

  // Disconnect any lingering connection
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  // Allow external test URI override, or spin up in-memory mongo
  let mongoUri = process.env.TEST_MONGO_URI;
  if (!mongoUri) {
    mongoServer = await MongoMemoryServer.create();
    mongoUri = mongoServer.getUri();
  }

  process.env.MONGO_URI = mongoUri;
  process.env.MONGODB_URI = mongoUri;

  await mongoose.connect(mongoUri);
}, 60000);

afterEach(async () => {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});
