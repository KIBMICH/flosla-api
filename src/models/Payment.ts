import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPayment extends Document {
  registrationId: Types.ObjectId;
  receiptNumber: string;
  amount: number;
  currency: 'NGN';
  channel: string;
  status: 'success';
  paystackResponse: object;
  paidAt: Date;
}

const PaymentSchema = new Schema<IPayment>({
  registrationId: { type: Schema.Types.ObjectId, ref: 'Registration', required: true, index: true },
  receiptNumber: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'NGN' },
  channel: { type: String, required: true },
  status: { type: String, default: 'success' },
  paystackResponse: { type: Object, required: true },
  paidAt: { type: Date, required: true },
});

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
