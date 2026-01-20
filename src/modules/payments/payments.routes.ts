import { Router } from 'express';
import { initializePayment, verifyPayment, handleWebhook } from './payments.controller';
import { validate } from '../../middlewares/validate.middleware';
import { initializePaymentSchema } from './payments.schema';
import { webhookMiddleware } from '../../middlewares/webhook.middleware';
import { paymentLimiter } from '../../middlewares/security.middleware';

const router = Router();

router.post('/initialize', paymentLimiter, validate(initializePaymentSchema), initializePayment);
router.get('/verify', verifyPayment);
router.post('/webhook', webhookMiddleware, handleWebhook);

export default router;
