import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// Function to generate a token
const generateTestToken = (source) => {
  const token = jwt.sign(
    { 
      source,
      timestamp: Date.now()
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  console.log('\nGenerated Token:');
  console.log(token);
  
  // Decode and display token contents (without verification)
  const decoded = jwt.decode(token);
  console.log('\nToken Contents:');
  console.log(JSON.stringify(decoded, null, 2));
  
  return token;
};

// Generate tokens for both frontend and backend
console.log('Generating Frontend Token:');
generateTestToken('frontend');

console.log('\nGenerating Backend Token:');
generateTestToken('backend'); 