// Usage: npm run seed   (WIPES the database and inserts demo data)
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const seed = require('./seedData');

connectDB()
  .then(() => seed())
  .then(() => mongoose.disconnect())
  .catch(async (err) => {
    console.error('Seed failed:', err);
    await mongoose.disconnect();
    process.exit(1);
  });
