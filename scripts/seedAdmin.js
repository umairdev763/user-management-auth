require('dotenv').config();

const bcrypt = require('bcrypt');
const { connectDB, usersCollection } = require('../config/db');

async function seedAdmin() {
  try {
    await connectDB();

    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.ADMIN_PASSWORD || 'Admin@12345';
    const existing = await usersCollection().findOne({ email });

    if (existing) {
      console.log(`Admin already exists: ${email}`);
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await usersCollection().insertOne({
      name: 'Administrator',
      email,
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('Admin created.');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('Change this password after first login.');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

seedAdmin();
