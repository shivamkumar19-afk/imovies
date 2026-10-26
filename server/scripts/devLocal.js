// Run the API with a real MongoDB that SAVES DATA TO DISK, without installing
// MongoDB yourself:   npm run dev:local
//
// - Data lives in server/.data/db and survives restarts (users, bookings, booked seats).
// - First run creates demo data. Later runs keep everything and only add
//   showtimes for the coming days.
// - Fresh start: stop the server and delete the server/.data folder.
// - View the data in MongoDB Compass: mongodb://127.0.0.1:27018/imovies
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../app');
const { seed, topUpShows } = require('../seed/seedData');
const User = require('../models/User');

const DB_PORT = Number(process.env.LOCAL_DB_PORT || 27018);
const dbPath = path.join(__dirname, '..', '.data', 'db');

(async () => {
  process.env.JWT_SECRET ||= 'dev-only-secret';
  fs.mkdirSync(dbPath, { recursive: true });

  const mongo = await MongoMemoryServer.create({
    instance: { dbPath, port: DB_PORT, storageEngine: 'wiredTiger' },
  });
  const uri = `mongodb://127.0.0.1:${DB_PORT}/imovies`;
  await mongoose.connect(uri);
  console.log(`Local MongoDB running. Data folder: ${dbPath}`);
  console.log(`Open in MongoDB Compass: ${uri}`);

  if ((await User.estimatedDocumentCount()) === 0) {
    console.log('Empty database - adding demo data');
    await seed();
  } else {
    console.log(`Existing data found (${await User.estimatedDocumentCount()} users) - keeping it`);
    await topUpShows();
  }

  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT, () => console.log(`IMovies API on http://localhost:${PORT}`));

  let stopping = false;
  const stop = async () => {
    if (stopping) return;
    stopping = true;
    console.log('Shutting down, saving data...');
    server.close();
    await mongoose.disconnect();
    await mongo.stop({ doCleanup: false }); // never delete the data folder
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
})().catch((err) => {
  if (/EADDRINUSE|already in use/i.test(String(err))) {
    console.error(`Port busy. Is IMovies already running in another window? Close it and try again.`);
  } else if (/lock|mongod\.lock/i.test(String(err))) {
    console.error('The database folder is locked by another running copy. Close other IMovies windows and try again.');
  }
  console.error(err);
  process.exit(1);
});
