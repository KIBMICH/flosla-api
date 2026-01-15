import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import mongoose from 'mongoose';
import { config } from '../../config';
import { Registration } from '../../models/Registration';
import { Payment } from '../../models/Payment';
import { Event } from '../../models/Event';
import { AppError } from '../../middlewares/error.middleware';

export const initializePayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { registrationId, reference } = req.body;

    if (!mongoose.Types.ObjectId.isValid(registrationId)) {
      return next(new AppError('Invalid registration ID', 400));
    }

    const registration = await Registration.findById(registrationId);
    if (!registration) {
      return next(new AppError('Registration not found', 404));
    }

    if (registration.paystackReference !== reference) {
      return next(new AppError('Invalid reference', 400));
    }

    if (registration.paymentStatus === 'PAID') {
      return next(new AppError('Payment already completed', 400));
    }

    const event = await Event.findById(registration.eventId);
    if (!event) {
      return next(new AppError('Event not found', 404));
    }

    const response = await axios.post(
      `${config.paystack.baseUrl}/transaction/initialize`,
      {
        email: registration.email,
        amount: event.amount,
        reference: registration.paystackReference,
        callback_url: `${config.frontendUrl}/payment/verify`,
        metadata: {
          registrationId: registration._id.toString(),
          eventId: event._id.toString(),
        },
      },
      {
        headers: {
          Authorization: `Bearer ${config.paystack.secretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json({
      success: true,
      data: {
        authorizationUrl: response.data.data.authorization_url,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const handleWebhook = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  
  try {
    const { event, data } = req.body;

    if (event !== 'charge.success') {
      return res.sendStatus(200);
    }

    const { reference, amount, currency, channel, paid_at } = data;

    const registration = await Registration.findOne({ paystackReference: reference });
    if (!registration) {
      return res.sendStatus(200);
    }

    if (registration.paymentStatus === 'PAID') {
      return res.sendStatus(200);
    }

    const eventDoc = await Event.findById(registration.eventId);
    if (!eventDoc) {
      return res.sendStatus(200);
    }

    if (amount !== eventDoc.amount || currency !== eventDoc.currency) {
      console.error('Amount/currency mismatch:', { expected: eventDoc.amount, received: amount });
      return res.sendStatus(200);
    }

    // Use transaction for atomic updates
    session.startTransaction();

    registration.paymentStatus = 'PAID';
    registration.receiptGenerated = true;
    await registration.save({ session });

    await Payment.create(
      [{
        registrationId: registration._id,
        receiptNumber: reference,
        amount,
        currency,
        channel,
        status: 'success',
        paystackResponse: data,
        paidAt: new Date(paid_at),
      }],
      { session }
    );

    await session.commitTransaction();
    res.sendStatus(200);
  } catch (error) {
    await session.abortTransaction();
    console.error('Webhook error:', error);
    res.sendStatus(200);
  } finally {
    session.endSession();
  }
};
