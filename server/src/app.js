const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables if not already loaded
dotenv.config();

const apiRoutes = require('./routes');
const mediaRoutes = require('./routes/mediaRoutes');
const pdfRoutes = require('./routes/pdfRoutes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Trust proxy for secure cookies/headers behind Netlify, Render, Railway, Vercel
app.set('trust proxy', 1);

// Configure CORS for production domains (Netlify, Vercel, custom domain) and local dev
const getCorsOrigin = () => {
  if (!process.env.CLIENT_URL || process.env.CLIENT_URL === '*') {
    return true;
  }
  const origins = process.env.CLIENT_URL.split(',').map((url) => url.trim().replace(/\/$/, ''));
  return (origin, callback) => {
    // Allow server-to-server or non-browser requests
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.trim().replace(/\/$/, '');
    if (process.env.NODE_ENV !== 'production') {
      if (
        cleanOrigin.startsWith('http://localhost') ||
        cleanOrigin.startsWith('http://127.0.0.1') ||
        origins.includes(cleanOrigin)
      ) {
        return callback(null, true);
      }
    } else {
      if (origins.includes(cleanOrigin)) {
        return callback(null, true);
      }
    }
    return callback(null, false);
  };
};

app.use(
  cors({
    origin: getCorsOrigin(),
    credentials: true,
  })
);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static upload directory for local media fallback
const uploadsPath = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// Base welcome endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ConnectHub API Server',
    version: '1.0.0',
    docs: '/api/health',
  });
});

// Mount dedicated media and pdf routes
app.use('/api/media', mediaRoutes);
app.use('/api/pdf', pdfRoutes);

// Mount core API routes (auth, profiles, connections, posts)
app.use('/api', apiRoutes);

// Catch 404 routes
app.use(notFound);

// Global centralized error handler
app.use(errorHandler);

module.exports = app;
