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

const MAX_LIMIT = 100;

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return next(new AppError('Admin already exists', 400));
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const admin = await Admin.create({
      email: email.toLowerCase(),
      passwordHash,
      role: 'ADMIN',
    });

    const token = jwt.sign({ adminId: admin._id }, config.jwtSecret, { expiresIn: '24h' });

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
      return next(new AppError('Invalid credentials', 401));
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return next(new AppError('Invalid credentials', 401));
    }

    const token = jwt.sign({ adminId: admin._id }, config.jwtSecret, { expiresIn: '24h' });

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
        .sort({ createdAt: -1 }),
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
      'Name,Email,Phone,Event,Reference,Paid At',
      ...registrations.map((r) => {
        const event = r.eventId as unknown as { name: string };
        return `"${r.fullName}","${r.email}","${r.phone || ''}","${event?.name || ''}","${r.paystackReference}","${r.createdAt.toISOString()}"`;
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
    const { name, description, amount } = req.body;

    const event = await Event.create({
      name,
      description,
      amount,
    });

    res.status(201).json({ success: true, data: event });
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
