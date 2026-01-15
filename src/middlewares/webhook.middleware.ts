import { Request, Response, NextFunction } from 'express';
import { verifyPaystackSignature } from '../utils/verifyPaystack';
import { AppError } from './error.middleware';

export const webhookMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  const signature = req.headers['x-paystack-signature'] as string;

  if (!signature) {
    return next(new AppError('Missing signature', 400));
  }

  // Use raw body for signature verification
  const payload = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body);
  const isValid = verifyPaystackSignature(payload, signature);

  if (!isValid) {
    return next(new AppError('Invalid signature', 400));
  }

  // Parse raw body to JSON for handler
  if (Buffer.isBuffer(req.body)) {
    req.body = JSON.parse(req.body.toString('utf8'));
  }

  next();
};
