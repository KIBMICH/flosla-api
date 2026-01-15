import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { errorHandler } from './middlewares/error.middleware';

import eventsRoutes from './modules/events/events.routes';
import paymentsRoutes from './modules/payments/payments.routes';
import receiptsRoutes from './modules/receipts/receipts.routes';
import adminRoutes from './modules/admin/admin.routes';

const app = express();

app.use(helmet());
app.use(cors({ origin: config.frontendUrl === '*' ? true : config.frontendUrl }));

// Raw body for webhook signature verification
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests' },
});
app.use(limiter);

app.use('/api/events', eventsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/receipts', receiptsRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

export default app;
