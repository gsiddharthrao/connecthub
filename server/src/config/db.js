const mongoose = require('mongoose');

let memoryServer = null;

const connectDB = async (customUri = null) => {
  let mongoUri = customUri || process.env.MONGODB_URI || process.env.MONGO_URI;

  // Validate production configuration
  if (process.env.NODE_ENV === 'production' && !mongoUri) {
    console.error('[Database Fatal Error] MONGODB_URI or MONGO_URI environment variable is required in production!');
    console.error('Please configure your MongoDB Atlas connection string in your deployment dashboard.');
    process.exit(1);
  }

  // Use MongoMemoryServer in test mode or when no URI is provided in non-production
  if (process.env.NODE_ENV === 'test' || (!mongoUri && process.env.NODE_ENV !== 'production')) {
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      if (!memoryServer) {
        memoryServer = await MongoMemoryServer.create();
      }
      mongoUri = memoryServer.getUri();
      process.env.MONGO_URI = mongoUri;
      process.env.MONGODB_URI = mongoUri;
      if (process.env.NODE_ENV !== 'test') {
        console.log(`[Database] Connected to MongoMemoryServer: ${mongoUri}`);
      }
    } catch (err) {
      if (!mongoUri) {
        mongoUri = 'mongodb://127.0.0.1:27017/connecthub';
      }
    }
  }

  // Setup connection event listeners if not already attached
  if (mongoose.connection.listenerCount('error') === 0) {
    mongoose.connection.on('connected', () => {
      if (process.env.NODE_ENV !== 'test') {
        console.log('[Database] Mongoose connection successfully established');
      }
    });

    mongoose.connection.on('error', (err) => {
      console.error(`[Database] Mongoose connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      if (process.env.NODE_ENV !== 'test') {
        console.warn('[Database] Mongoose connection disconnected');
      }
    });
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 10000,
      family: 4, // Force IPv4 for reliable cloud host routing
    });
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    }
    return conn;
  } catch (error) {
    console.error(`[Database] Error connecting to MongoDB: ${error.message}`);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (memoryServer) {
      await memoryServer.stop();
      memoryServer = null;
    }
  } catch (err) {
    console.error(`[Database] Error disconnecting: ${err.message}`);
  }
};

const clearDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        await collections[key].deleteMany({});
      }
    }
  } catch (err) {
    console.error(`[Database] Error clearing collections: ${err.message}`);
  }
};

module.exports = { connectDB, disconnectDB, clearDB };
