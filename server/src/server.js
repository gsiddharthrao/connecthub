const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');
const { seedDemoData } = require('./utils/seeder');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start HTTP listener
const startServer = async () => {
  try {
    await connectDB();
    // Only execute seedDemoData if explicitly requested via environment variable and not in production
    if (process.env.SEED_DEV_DATA === 'true' && process.env.NODE_ENV !== 'production') {
      await seedDemoData();
    }
    const server = app.listen(PORT, () => {
      console.log(`[Server] ConnectHub API running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });

    // Graceful shutdown handler for cloud deployments (Render, Railway, Fly, AWS)
    const handleShutdown = async (signal) => {
      console.log(`\n[Server] Received ${signal}. Initiating graceful shutdown...`);
      server.close(async () => {
        console.log('[Server] HTTP listener closed.');
        await disconnectDB();
        console.log('[Server] Database connections closed. Process terminating safely.');
        process.exit(0);
      });

      // Force exit if hanging
      setTimeout(() => {
        console.error('[Server] Forced shutdown after timeout.');
        process.exit(1);
      }, 10000).unref();
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error(`[UnhandledRejection] ${err.message}`);
      server.close(() => process.exit(1));
    });

    return server;
  } catch (error) {
    console.error(`[Server Startup Error] ${error.message}`);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
