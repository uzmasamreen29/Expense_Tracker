import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import app from './app.js';
import connectDB from './config/db.js';

const startServer = async () => {
  try {
    // Connect to Database
    await connectDB();

    console.log(`\n========================================`);
    console.log(`🔗 CONNECTED TO HOST: ${mongoose.connection.host}`);
    console.log(`📂 CONNECTED TO DB:   ${mongoose.connection.name}`);
    console.log(`========================================\n`);

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Server startup error:', err.message);
  }
};

startServer();