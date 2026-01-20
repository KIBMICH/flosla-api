import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { errorHandler } from './middlewares/error.middleware';
import { sanitizeInput, preventNoSQLInjection } from './middlewares/security.middleware';

import eventsRoutes from './modules/events/events.routes';
import paymentsRoutes from './modules/payments/payments.routes';
import receiptsRoutes from './modules/receipts/receipts.routes';
import adminRoutes from './modules/admin/admin.routes';

const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS - Allow frontend and localhost
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  config.frontendUrl,
  'https://fosla-registration-portal.vercel.app'
].filter(Boolean);

app.use(cors({ 
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, or webhooks)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Raw body for webhook signature verification
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10kb' })); // Limit body size

// Security middlewares
app.use(sanitizeInput);
app.use(preventNoSQLInjection);

// Global rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Disable x-powered-by header
app.disable('x-powered-by');

app.use('/api/events', eventsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/receipts', receiptsRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (_req: express.Request, res: express.Response) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

export default app;
