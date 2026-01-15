import { Router } from 'express';
import { getActiveEvents, getEventById, registerForEvent } from './events.controller';
import { validate } from '../../middlewares/validate.middleware';
import { registerEventSchema } from './events.schema';

const router = Router();

router.get('/', getActiveEvents);
router.get('/:eventId', getEventById);
router.post('/:eventId/register', validate(registerEventSchema), registerForEvent);

export default router;
