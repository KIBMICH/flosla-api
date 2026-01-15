import { Request, Response, NextFunction } from 'express';
import { Registration } from '../../models/Registration';
import { Payment } from '../../models/Payment';
import { Event } from '../../models/Event';
import { formatReceipt } from '../../utils/receiptFormatter';
import { AppError } from '../../middlewares/error.middleware';

export const getReceipt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reference } = req.params;

    const payment = await Payment.findOne({ receiptNumber: reference });
    if (!payment) {
      return next(new AppError('Receipt not found', 404));
    }

    const registration = await Registration.findById(payment.registrationId);
    if (!registration) {
      return next(new AppError('Registration not found', 404));
    }

    const event = await Event.findById(registration.eventId);
    if (!event) {
      return next(new AppError('Event not found', 404));
    }

    const receipt = formatReceipt(payment, registration, event);

    res.json({ success: true, data: receipt });
  } catch (error) {
    next(error);
  }
};

export const verifyReceipt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reference } = req.params;

    const registration = await Registration.findOne({ paystackReference: reference });
    if (!registration) {
      return res.json({
        success: true,
        data: { valid: false, status: 'NOT_FOUND' },
      });
    }

    res.json({
      success: true,
      data: {
        valid: registration.paymentStatus === 'PAID',
        status: registration.paymentStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};
