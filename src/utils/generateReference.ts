import crypto from 'crypto';

export const generateReference = (): string => {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString('hex');
  return `EVT_${timestamp}${random}`.toUpperCase();
};
