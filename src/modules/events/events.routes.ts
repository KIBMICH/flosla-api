import { Router } from 'express';
import { getActiveEvents, registerForEvent } from './events.controller';
import { validate } from '../../middlewares/validate.middleware';
import { registerEventSchema } from './events.schema';
import { registrationLimiter } from '../../middlewares/security.middleware';

const router = Router();

router.get('/', getActiveEvents);
router.post('/register', registrationLimiter, validate(registerEventSchema), registerForEvent);

export default router;
