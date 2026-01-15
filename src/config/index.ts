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
};
