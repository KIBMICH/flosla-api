import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IRegistration extends Document {
  eventId: Types.ObjectId;
  firstName: string;
  surname: string;
  sex: 'male' | 'female';
  dateOfBirth: string;
  age: number;
  stateOfResidence: string;
  stateOfOrigin: string;
  religion: string;
  positionOfPlay: string;
  firstAlternatePosition: string;
  secondAlternatePosition: string;
  guardianFullName: string;
  guardianWhatsappNumber: string;
  guardianEmail?: string;
  guardianOccupation: string;
  paymentStatus: 'PENDING' | 'PAID';
  paystackReference: string;
  receiptGenerated: boolean;
  registeredDate: Date;
}

const RegistrationSchema = new Schema<IRegistration>({
  eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  firstName: { type: String, required: true },
  surname: { type: String, required: true },
  sex: { type: String, enum: ['male', 'female'], required: true },
  dateOfBirth: { type: String, required: true },
  age: { type: Number, required: true, min: 1, max: 12 },
  stateOfResidence: { type: String, required: true },
  stateOfOrigin: { type: String, required: true },
  religion: { type: String, required: true },
  positionOfPlay: { type: String, required: true },
  firstAlternatePosition: { type: String, required: true },
  secondAlternatePosition: { type: String, required: true },
  guardianFullName: { type: String, required: true },
  guardianWhatsappNumber: { type: String, required: true },
  guardianEmail: { type: String, required: false },
  guardianOccupation: { type: String, required: true },
  paymentStatus: { type: String, enum: ['PENDING', 'PAID'], default: 'PENDING' },
  paystackReference: { type: String, required: true, unique: true },
  receiptGenerated: { type: Boolean, default: false },
  registeredDate: { type: Date, default: Date.now },
});

export const Registration = mongoose.model<IRegistration>('Registration', RegistrationSchema);
