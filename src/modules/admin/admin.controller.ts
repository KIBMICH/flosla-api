import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { config } from '../../config';
import { Admin } from '../../models/Admin';
import { Registration } from '../../models/Registration';
import { Payment } from '../../models/Payment';
import { Event } from '../../models/Event';
import { AppError } from '../../middlewares/error.middleware';
import { logger } from '../../utils/logger';

const MAX_LIMIT = 100;

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      logger.security('Admin registration attempt with existing email', { email });
      return next(new AppError('Admin already exists', 400));
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const admin = await Admin.create({
      email: email.toLowerCase(),
      passwordHash,
      role: 'ADMIN',
    });

    const token = jwt.sign({ adminId: admin._id }, config.jwtSecret, { expiresIn: '24h' });

    logger.security('New admin registered', { email: admin.email, id: admin._id });

    res.status(201).json({
      success: true,
      data: {
        token,
        admin: {
          id: admin._id,
          email: admin.email,
          role: admin.role,
          createdAt: admin.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      logger.security('Failed login attempt - admin not found', { email });
      return next(new AppError('Invalid credentials', 401));
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      logger.security('Failed login attempt - wrong password', { email });
      return next(new AppError('Invalid credentials', 401));
    }

    const token = jwt.sign({ adminId: admin._id }, config.jwtSecret, { expiresIn: '24h' });

    logger.security('Admin logged in', { email: admin.email, id: admin._id });

    res.json({
      success: true,
      data: {
        token,
        admin: {
          id: admin._id,
          email: admin.email,
          role: admin.role,
          createdAt: admin.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getRegistrations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventId, status, page = '1', limit = '20' } = req.query;

    const filter: Record<string, unknown> = {};
    if (eventId) {
      if (!mongoose.Types.ObjectId.isValid(eventId as string)) {
        return next(new AppError('Invalid event ID', 400));
      }
      filter.eventId = eventId;
    }
    if (status) filter.paymentStatus = status;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(MAX_LIMIT, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [registrations, total] = await Promise.all([
      Registration.find(filter)
        .populate('eventId', 'name amount')
        .skip(skip)
        .limit(limitNum)
        .sort({ registeredDate: -1 }),
      Registration.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        registrations,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getRegistrationById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(new AppError('Invalid registration ID', 400));
    }

    const registration = await Registration.findById(req.params.id).populate('eventId');
    if (!registration) {
      return next(new AppError('Registration not found', 404));
    }

    const payment = await Payment.findOne({ registrationId: registration._id });

    res.json({
      success: true,
      data: {
        registration,
        payment,
        receiptLink: payment ? `/api/receipts/${payment.receiptNumber}` : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPayments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(MAX_LIMIT, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [payments, total] = await Promise.all([
      Payment.find()
        .populate({
          path: 'registrationId',
          populate: { path: 'eventId', select: 'name' },
        })
        .skip(skip)
        .limit(limitNum)
        .sort({ paidAt: -1 }),
      Payment.countDocuments(),
    ]);

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const exportRecords = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventId } = req.query;

    const filter: Record<string, unknown> = { paymentStatus: 'PAID' };
    if (eventId) {
      if (!mongoose.Types.ObjectId.isValid(eventId as string)) {
        return next(new AppError('Invalid event ID', 400));
      }
      filter.eventId = eventId;
    }

    const registrations = await Registration.find(filter).populate('eventId', 'name');

    const csv = [
      'First Name,Surname,Sex,Date of Birth,Age,State of Residence,State of Origin,Religion,Position,First Alternate Position,Second Alternate Position,Guardian Name,Guardian WhatsApp,Guardian Occupation,Event,Reference,Registered Date',
      ...registrations.map((r) => {
        const event = r.eventId as unknown as { name: string };
        return `"${r.firstName}","${r.surname}","${r.sex}","${r.dateOfBirth}",${r.age},"${r.stateOfResidence}","${r.stateOfOrigin}","${r.religion}","${r.positionOfPlay}","${r.firstAlternatePosition}","${r.secondAlternatePosition}","${r.guardianFullName}","${r.guardianWhatsappNumber}","${r.guardianOccupation}","${event?.name || ''}","${r.paystackReference}","${r.registeredDate.toISOString()}"`;
      }),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=registrations.csv');
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amount } = req.body;

    // Check if event already exists
    const existingEvent = await Event.findOne();
    if (existingEvent) {
      return next(new AppError('Event already exists. Use update endpoint to change amount.', 400));
    }

    const event = await Event.create({
      name: 'U-13 Football Registration',
      description: 'Under 13 Football Registration',
      amount,
    });

    res.status(201).json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

export const updateEventAmount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amount } = req.body;

    const event = await Event.findOne();
    if (!event) {
      return next(new AppError('Event not found. Create event first.', 404));
    }

    event.amount = amount;
    await event.save();

    res.json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = (req as any).adminId;
    const admin = await Admin.findById(adminId).select('-passwordHash');
    
    if (!admin) {
      return next(new AppError('Admin not found', 404));
    }

    res.json({ success: true, data: admin });
  } catch (error) {
    next(error);
  }
};

export const getAllAdmins = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const admins = await Admin.find().select('-passwordHash');
    res.json({ success: true, data: admins });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = (req as any).adminId;
    const { currentPassword, newPassword } = req.body;

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return next(new AppError('Admin not found', 404));
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!isMatch) {
      logger.security('Failed password change - wrong current password', { adminId });
      return next(new AppError('Current password is incorrect', 401));
    }

    admin.passwordHash = await bcrypt.hash(newPassword, 12);
    await admin.save();

    logger.security('Admin password changed', { adminId, email: admin.email });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};
