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
  name: { type: String, required: true, default: 'U-13 Football Registration' },
  description: { type: String, required: true, default: 'Under 13 Football Registration' },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'NGN', enum: ['NGN'] },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

// Ensure only one event exists
EventSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await mongoose.model('Event').countDocuments();
    if (count > 0) {
      throw new Error('Only one event is allowed');
    }
  }
  next();
});

export const Event = mongoose.model<IEvent>('Event', EventSchema);
