const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const profileRoutes = require('./profileRoutes');
const connectionRoutes = require('./connectionRoutes');
const postRoutes = require('./postRoutes');

const mongoose = require('mongoose');

router.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  const isHealthy = dbState === 1 || process.env.NODE_ENV === 'test';

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    status: isHealthy ? 'healthy' : 'degraded',
    message: isHealthy ? 'ConnectHub API and Database are operational' : 'Database connection not ready',
    database: {
      status: dbStatusMap[dbState] || 'unknown',
      host: mongoose.connection.host || null,
      name: mongoose.connection.name || null,
    },
    uptime: `${Math.floor(process.uptime())}s`,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/profiles', profileRoutes);
router.use('/connections', connectionRoutes);
router.use('/posts', postRoutes);

module.exports = router;
