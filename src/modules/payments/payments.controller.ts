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

    // Use guardian phone if no email provided
    const contactEmail = registration.email || `${registration.guardianPhoneNumber}@temp.flosla.com`;

    const paymentData = {
      email: contactEmail,
      amount: event.amount, // Amount should already be in kobo
      reference: registration.paystackReference,
      currency: event.currency,
      callback_url: `${config.frontendUrl}/payment/verify`,
      metadata: {
        registrationId: registration._id.toString(),
        eventId: event._id.toString(),
        playerName: `${registration.firstName} ${registration.surname}`,
        guardianName: registration.guardianFullName,
        guardianPhone: registration.guardianPhoneNumber,
      },
    };

    console.log('Sending to Paystack:', JSON.stringify(paymentData, null, 2));

    const response = await axios.post(
      `${config.paystack.baseUrl}/transaction/initialize`,
      paymentData,
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
    console.error('Payment initialization error:', error);
    if (axios.isAxiosError(error)) {
      console.error('Paystack API error:', error.response?.data);
      return next(new AppError(error.response?.data?.message || 'Payment initialization failed', error.response?.status || 500));
    }
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
