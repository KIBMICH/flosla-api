import crypto from 'crypto';
import { config } from '../config';

export const verifyPaystackSignature = (payload: string, signature: string): boolean => {
  const hash = crypto
    .createHmac('sha512', config.paystack.secretKey)
    .update(payload)
    .digest('hex');
  return hash === signature;
};
