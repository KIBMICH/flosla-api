import { Router } from 'express';
import { getReceipt, verifyReceipt } from './receipts.controller';

const router = Router();

// Order matters: specific routes before parameterized routes
router.get('/verify/:reference', verifyReceipt);
router.get('/:reference', getReceipt);

export default router;
