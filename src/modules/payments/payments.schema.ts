import { z } from 'zod';

export const initializePaymentSchema = z.object({
  registrationId: z.string().min(1, 'Registration ID is required'),
  reference: z.string().min(1, 'Reference is required'),
});
