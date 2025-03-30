import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get JWT secret and validate it exists
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('JWT_SECRET is not set in environment variables');
  throw new Error('JWT_SECRET is required');
}

console.log('JWT_SECRET loaded:', JWT_SECRET ? 'Yes' : 'No');

// In-memory storage for used tokens (in production, use Redis or a database)
const usedTokens = new Set();

export const generateToken = (source) => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not set');
  }

  return jwt.sign(
    { 
      source,
      timestamp: Date.now(),
      used: false
    },
    JWT_SECRET,
    { expiresIn: '5m' } // Short expiration time since it's single-use
  );
};

export const verifyToken = (token) => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not set');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if token has been used
    if (usedTokens.has(token)) {
      throw new Error('Token has already been used');
    }

    // Mark token as used
    usedTokens.add(token);

    // Clean up old tokens (optional)
    setTimeout(() => {
      usedTokens.delete(token);
    }, 5 * 60 * 1000); // Remove after 5 minutes (matching expiration)

    return decoded;
  } catch (error) {
    if (error.message === 'Token has already been used') {
      throw error;
    }
    throw new Error('Invalid token');
  }
}; 