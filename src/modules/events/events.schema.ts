import { z } from 'zod';

export const createEventSchema = z.object({
  name: z.string().min(1, 'Event name is required'),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be positive'),
});

export const registerEventSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  surname: z.string().min(1, 'Surname is required'),
  sex: z.enum(['male', 'female'], { errorMap: () => ({ message: 'Sex must be male or female' }) }),
  dateOfBirth: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Date of birth must be in MM/DD/YYYY format'),
  age: z.number().int().min(0).max(150, 'Age must be between 0 and 150'),
  stateOfResidence: z.string().min(1, 'State of residence is required'),
  stateOfOrigin: z.string().min(1, 'State of origin is required'),
  positionOfPlay: z.string().min(1, 'Position of play is required'),
  guardianFullName: z.string().min(1, 'Guardian full name is required'),
  guardianPhoneNumber: z.string().min(10, 'Valid guardian phone number is required'),
  email: z.string().email('Valid email is required').optional(),
});
