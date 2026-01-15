import { Router } from 'express';
import { initializePayment, handleWebhook } from './payments.controller';
import { validate } from '../../middlewares/validate.middleware';
import { initializePaymentSchema } from './payments.schema';
import { webhookMiddleware } from '../../middlewares/webhook.middleware';

const router = Router();

router.post('/initialize', validate(initializePaymentSchema), initializePayment);
router.post('/webhook', webhookMiddleware, handleWebhook);

export default router;
