import { Router } from 'express';
import {
  register,
  login,
  getRegistrations,
  getRegistrationById,
  getPayments,
  exportRecords,
  createEvent,
  updateEventAmount,
  getProfile,
  getAllAdmins,
  changePassword,
} from './admin.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { adminLoginSchema, adminRegisterSchema, changePasswordSchema, updateEventAmountSchema } from './admin.schema';
import { authLimiter } from '../../middlewares/security.middleware';

const router = Router();

router.post('/register', authLimiter, validate(adminRegisterSchema), register);
router.post('/login', authLimiter, validate(adminLoginSchema), login);

router.use(authMiddleware);

router.get('/profile', getProfile);
router.get('/admins', getAllAdmins);
router.post('/change-password', validate(changePasswordSchema), changePassword);
router.get('/registrations', getRegistrations);
router.get('/registrations/:id', getRegistrationById);
router.get('/payments', getPayments);
router.get('/export', exportRecords);
router.post('/events', validate(updateEventAmountSchema), createEvent);
router.put('/events/amount', validate(updateEventAmountSchema), updateEventAmount);

export default router;
