// Run the API without installing MongoDB: `npm run dev:memory`
// Spins up a throwaway in-memory MongoDB, seeds it, and starts the server.
// Data is lost when you stop the process. Use a real MONGO_URI for anything else.
require('dotenv').config();
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../app');
const seed = require('../seed/seedData');

(async () => {
  process.env.JWT_SECRET ||= 'dev-only-secret';
  const mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongo.getUri('imovies'));
  console.log('In-memory MongoDB started');
  await seed();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`IMovies API (in-memory DB) on http://localhost:${PORT}`));

  const stop = async () => {
    await mongoose.disconnect();
    await mongo.stop();
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
