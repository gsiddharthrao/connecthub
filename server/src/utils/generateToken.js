const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  const id = typeof userId === 'object' && userId._id ? userId._id.toString() : userId.toString();
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'connecthub_default_secret_key_2026',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = generateToken;
