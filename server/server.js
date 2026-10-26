require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { topUpShows } = require('./seed/seedData');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const PORT = process.env.PORT || 5000;
const TOP_UP_EVERY_MS = 6 * 60 * 60 * 1000; // 6 hours

// Demo showtimes cover the next few days. On a long-running (deployed) server,
// keep adding upcoming shows so the site never runs dry. Existing shows and
// bookings are never touched. Set AUTO_TOP_UP_SHOWS=false to turn this off.
async function keepShowsFresh() {
  if (process.env.AUTO_TOP_UP_SHOWS === 'false') return;
  try {
    await topUpShows();
  } catch (err) {
    console.error('Show top-up failed:', err.message);
  }
}

connectDB()
  .then(async () => {
    await keepShowsFresh();
    setInterval(keepShowsFresh, TOP_UP_EVERY_MS).unref();
    app.listen(PORT, () => console.log(`IMovies API on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to start:', err.message);
    process.exit(1);
  });
