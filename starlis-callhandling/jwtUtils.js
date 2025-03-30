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

export const generateToken = (source) => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not set');
  }

  return jwt.sign(
    { 
      source, // 'frontend' or 'backend'
      timestamp: Date.now()
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
};

export const verifyToken = (token) => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not set');
  }

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
}; 