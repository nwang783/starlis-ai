import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export const generateToken = (source) => {
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
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
}; 