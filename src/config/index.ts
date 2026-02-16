import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/event-payment',
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret',
  paystack: {
    secretKey: process.env.PAYSTACK_SECRET_KEY || '',
    publicKey: process.env.PAYSTACK_PUBLIC_KEY || '',
    baseUrl: 'https://api.paystack.co',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
  nodeEnv: process.env.NODE_ENV || 'development',
  hfToken: process.env.HF_TOKEN || '',
};

// Validate critical environment variables
if (!process.env.JWT_SECRET && config.nodeEnv === 'production') {
  throw new Error('JWT_SECRET must be set in production');
}

if (!process.env.PAYSTACK_SECRET_KEY) {
  console.warn('WARNING: PAYSTACK_SECRET_KEY not set');
}

if (!process.env.MONGODB_URI && config.nodeEnv === 'production') {
  throw new Error('MONGODB_URI must be set in production');
}

if (!process.env.HF_TOKEN) {
  console.warn('WARNING: HF_TOKEN not set - AI chat will not work');
}
