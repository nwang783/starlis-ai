import crypto from 'crypto';

// Generate a secure random key
const generateSecureKey = () => {
  // Generate 64 random bytes and convert to base64
  const key = crypto.randomBytes(64).toString('base64');
  
  console.log('\nGenerated Secure JWT Secret:');
  console.log(key);
  
  console.log('\nAdd this to your .env file:');
  console.log(`JWT_SECRET=${key}`);
  
  return key;
};

// Generate the key
generateSecureKey(); 