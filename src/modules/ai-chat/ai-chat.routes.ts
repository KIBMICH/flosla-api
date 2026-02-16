import { Router } from 'express';
import { chatWithAI } from './ai-chat.controller';
import { validate } from '../../middlewares/validate.middleware';
import { chatMessageSchema } from './ai-chat.schema';

const router = Router();

router.post('/chat', validate(chatMessageSchema), chatWithAI);

export default router;
