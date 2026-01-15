import { Router } from 'express';
import {
  register,
  login,
  getRegistrations,
  getRegistrationById,
  getPayments,
  exportRecords,
  createEvent,
  getProfile,
  getAllAdmins,
} from './admin.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { adminLoginSchema, adminRegisterSchema, createEventSchema } from './admin.schema';

const router = Router();

router.post('/register', validate(adminRegisterSchema), register);
router.post('/login', validate(adminLoginSchema), login);

router.use(authMiddleware);

router.get('/profile', getProfile);
router.get('/admins', getAllAdmins);
router.get('/registrations', getRegistrations);
router.get('/registrations/:id', getRegistrationById);
router.get('/payments', getPayments);
router.get('/export', exportRecords);
router.post('/events', validate(createEventSchema), createEvent);

export default router;
