// Run the API against the database in MONGO_URI (e.g. MongoDB Atlas):
//   npm run dev:atlas
// First run on an empty database adds demo data. Later runs keep everything
// and only add showtimes for the coming days.
require('dotenv').config();
const mongoose = require('mongoose');
const app = require('../app');
const { seed, topUpShows } = require('../seed/seedData');
const User = require('../models/User');

const uri = process.env.MONGO_URI || '';

(async () => {
  if (!uri) throw new Error('MONGO_URI is empty in server/.env');
  if (uri.includes('<password>')) {
    throw new Error('Replace <password> in server/.env (MONGO_URI line) with your Atlas database user password.');
  }
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is empty in server/.env');

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  const host = mongoose.connection.host;
  console.log(`Connected to MongoDB at ${host}, database "${mongoose.connection.name}"`);

  if ((await User.estimatedDocumentCount()) === 0) {
    console.log('Empty database - adding demo data');
    await seed();
  } else {
    console.log(`Existing data found (${await User.estimatedDocumentCount()} users) - keeping it`);
    await topUpShows();
  }

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`IMovies API on http://localhost:${PORT}`));
})().catch((err) => {
  const msg = String(err && err.message);
  if (/bad auth|authentication failed/i.test(msg)) {
    console.error('\nAtlas rejected the username/password. Check the password in server/.env.');
    console.error('If it has symbols like @ : / ? # %, either change it in Atlas to letters+numbers or URL-encode them.\n');
  } else if (/ENOTFOUND|querySrv|ETIMEOUT|Server selection timed out/i.test(msg)) {
    console.error('\nCould not reach Atlas. Check your internet, that the cluster is not paused, and that Network Access allows your IP.\n');
  }
  console.error(err);
  process.exit(1);
});
