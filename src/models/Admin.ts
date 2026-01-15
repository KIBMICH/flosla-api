import mongoose, { Schema, Document } from 'mongoose';

export interface IAdmin extends Document {
  email: string;
  passwordHash: string;
  role: 'ADMIN';
  createdAt: Date;
}

const AdminSchema = new Schema<IAdmin>({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: 'ADMIN', enum: ['ADMIN'] },
  createdAt: { type: Date, default: Date.now },
});

export const Admin = mongoose.model<IAdmin>('Admin', AdminSchema);
