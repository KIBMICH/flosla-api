import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Event } from '../../models/Event';
import { Registration } from '../../models/Registration';
import { generateReference } from '../../utils/generateReference';
import { AppError } from '../../middlewares/error.middleware';

export const getActiveEvents = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Return the single U-13 event
    const event = await Event.findOne({ isActive: true }).select('-__v');
    if (!event) {
      return next(new AppError('Event not found. Please contact admin.', 404));
    }
    res.json({ success: true, data: event });
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
    // Always use the single U-13 event
    const event = await Event.findOne({ isActive: true });
    if (!event) {
      return next(new AppError('Event not found or inactive', 404));
    }

    const {
      firstName,
      surname,
      sex,
      dateOfBirth,
      age,
      stateOfResidence,
      stateOfOrigin,
      positionOfPlay,
      guardianFullName,
      guardianPhoneNumber,
      email,
    } = req.body;

    // Check for duplicate registration (same guardian phone + child name)
    const existingRegistration = await Registration.findOne({
      eventId: event._id,
      guardianPhoneNumber,
      firstName: { $regex: new RegExp(`^${firstName}$`, 'i') },
      surname: { $regex: new RegExp(`^${surname}$`, 'i') },
    });

    if (existingRegistration) {
      return next(new AppError('This child has already been registered by this guardian for this event', 400));
    }

    const reference = generateReference();

    const registration = await Registration.create({
      eventId: event._id,
      firstName,
      surname,
      sex,
      dateOfBirth,
      age,
      stateOfResidence,
      stateOfOrigin,
      positionOfPlay,
      guardianFullName,
      guardianPhoneNumber,
      email: email?.toLowerCase(),
      paystackReference: reference,
    });

    res.status(201).json({
      success: true,
      data: {
        registrationId: registration._id,
        reference,
        eventName: event.name,
        amount: event.amount,
      },
    });
  } catch (error) {
    next(error);
  }
};
