import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config';
import { Admin } from '../models/Admin';

const seedAdmin = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    const email = 'admin@event.com';
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      console.log('Admin already exists');
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash('admin123', 12);

    await Admin.create({
      email,
      passwordHash,
      role: 'ADMIN',
    });

    console.log('Admin created successfully');
    console.log('Email: admin@event.com');
    console.log('Password: admin123');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
