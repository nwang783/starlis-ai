import { generateToken } from './jwtUtils.js';

try {
  console.log('Testing JWT token generation...');
  const token = generateToken('frontend');
  console.log('Token generated successfully:');
  console.log(token);
} catch (error) {
  console.error('Error generating token:', error);
} 