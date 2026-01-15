import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Event } from '../../models/Event';
import { Registration } from '../../models/Registration';
import { generateReference } from '../../utils/generateReference';
import { AppError } from '../../middlewares/error.middleware';

export const getActiveEvents = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const events = await Event.find({ isActive: true }).select('-__v');
    res.json({ success: true, data: events });
  } catch (error) {
    next(error);
  }
};

export const getEventById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.eventId)) {
      return next(new AppError('Invalid event ID', 400));
    }

    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return next(new AppError('Event not found', 404));
    }
    res.json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

export const registerForEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventId } = req.params;
    const { fullName, email, phone } = req.body;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return next(new AppError('Invalid event ID', 400));
    }

    const event = await Event.findById(eventId);
    if (!event || !event.isActive) {
      return next(new AppError('Event not found or inactive', 404));
    }

    const reference = generateReference();

    const registration = await Registration.create({
      eventId,
      fullName,
      email: email.toLowerCase(),
      phone,
      paystackReference: reference,
    });

    res.status(201).json({
      success: true,
      data: {
        registrationId: registration._id,
        reference,
      },
    });
  } catch (error) {
    next(error);
  }
};
