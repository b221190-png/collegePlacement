const jwt = require('jsonwebtoken');

// Check if JWT secrets are properly configured
const checkJwtSecrets = () => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-this-in-production') {
    console.warn('WARNING: Using default JWT secret. Please set JWT_SECRET in production!');
  }
  if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET === 'your-super-secret-refresh-key-change-this-in-production') {
    console.warn('WARNING: Using default JWT refresh secret. Please set JWT_REFRESH_SECRET in production!');
  }
};

// Initialize with secret check
checkJwtSecrets();

// Generate JWT token
const generateToken = (payload) => {
  try {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '1h',
      issuer: 'college-placement-system',
      audience: 'college-placement-users'
    });
  } catch (error) {
    console.error('Error generating access token:', error);
    throw new Error('Failed to generate access token');
  }
};

// Generate refresh token
const generateRefreshToken = (payload) => {
  try {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
      issuer: 'college-placement-system',
      audience: 'college-placement-users'
    });
  } catch (error) {
    console.error('Error generating refresh token:', error);
    throw new Error('Failed to generate refresh token');
  }
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'college-placement-system',
      audience: 'college-placement-users'
    });
  } catch (error) {
    console.error('Error verifying access token:', error.message);
    throw error;
  }
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
      issuer: 'college-placement-system',
      audience: 'college-placement-users'
    });
  } catch (error) {
    console.error('Error verifying refresh token:', error.message);
    throw error;
  }
};

// Generate token pair (access + refresh)
const generateTokenPair = (payload) => {
  const accessToken = generateToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    accessToken,
    refreshToken
  };
};

// Decode token without verification (for getting expiration date)
const decodeToken = (token) => {
  return jwt.decode(token);
};

// Check if token will expire soon (within 5 minutes)
const isTokenExpiringSoon = (token) => {
  try {
    const decoded = decodeToken(token);
    const now = Date.now() / 1000;
    const fiveMinutes = 5 * 60;

    return (decoded.exp - now) < fiveMinutes;
  } catch (error) {
    return true; // Assume it's expiring if there's an error
  }
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  generateTokenPair,
  decodeToken,
  isTokenExpiringSoon
};