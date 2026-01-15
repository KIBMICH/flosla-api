import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IRegistration extends Document {
  eventId: Types.ObjectId;
  fullName: string;
  email: string;
  phone?: string;
  paymentStatus: 'PENDING' | 'PAID';
  paystackReference: string;
  receiptGenerated: boolean;
  createdAt: Date;
}

const RegistrationSchema = new Schema<IRegistration>({
  eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true, index: true },
  phone: { type: String },
  paymentStatus: { type: String, enum: ['PENDING', 'PAID'], default: 'PENDING' },
  paystackReference: { type: String, required: true, unique: true },
  receiptGenerated: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export const Registration = mongoose.model<IRegistration>('Registration', RegistrationSchema);
