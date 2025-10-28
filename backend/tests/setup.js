const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Setup test database
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

// Cleanup test database
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Clear all collections before each test
beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    try {
      await collections[key].deleteMany({});
    } catch (error) {
      // Ignore errors for collections that don't exist
    }
  }
});

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};