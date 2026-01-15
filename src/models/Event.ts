import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  name: string;
  description: string;
  amount: number;
  currency: 'NGN';
  isActive: boolean;
  createdAt: Date;
}

const EventSchema = new Schema<IEvent>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'NGN', enum: ['NGN'] },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export const Event = mongoose.model<IEvent>('Event', EventSchema);
