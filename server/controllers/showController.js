const Show = require('../models/Show');
const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');
const Booking = require('../models/Booking');
const ApiError = require('../utils/ApiError');

// Dates from the UI ("2026-10-24") mean a calendar day in the cinema's local
// timezone, not UTC. Default is India (+05:30).
const TZ_OFFSET = process.env.APP_TZ_OFFSET || '+05:30';
const CLEANUP_GAP_MIN = 15; // minutes between shows on the same screen

function dayRange(dateStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) throw new ApiError(400, 'date must be YYYY-MM-DD');
  const start = new Date(`${dateStr}T00:00:00${TZ_OFFSET}`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

async function assertNoOverlap({ theatre, screenName, startTime, durationMin, excludeId }) {
  const windowStart = new Date(startTime.getTime() - 24 * 3600 * 1000);
  const windowEnd = new Date(startTime.getTime() + 24 * 3600 * 1000);
  const nearby = await Show.find({
    theatre,
    screenName,
    startTime: { $gte: windowStart, $lte: windowEnd },
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  }).populate('movie', 'duration title');

  const newEnd = startTime.getTime() + (durationMin + CLEANUP_GAP_MIN) * 60000;
  for (const s of nearby) {
    const sStart = s.startTime.getTime();
    const sEnd = sStart + ((s.movie?.duration || 0) + CLEANUP_GAP_MIN) * 60000;
    if (startTime.getTime() < sEnd && sStart < newEnd) {
      throw new ApiError(
        409,
        `Screen "${screenName}" is busy: "${s.movie?.title}" runs at ${s.startTime.toISOString()}`
      );
    }
  }
}

// GET /api/shows?movieId=&date=YYYY-MM-DD&city=&theatreId=&includePast=true
async function listShows(req, res) {
  const { movieId, date, city, theatreId, includePast } = req.query;
  const filter = {};
  if (movieId) filter.movie = movieId;
  if (theatreId) filter.theatre = theatreId;

  const timeFilter = {};
  if (date) {
    const { start, end } = dayRange(String(date));
    timeFilter.$gte = start;
    timeFilter.$lt = end;
  }
  // Customers shouldn't see shows that already started.
  if (includePast !== 'true') {
    const now = new Date();
    if (!timeFilter.$gte || timeFilter.$gte < now) timeFilter.$gte = now;
  }
  if (Object.keys(timeFilter).length) filter.startTime = timeFilter;

  if (city) {
    const theatres = await Theatre.find({ city: new RegExp(`^${String(city).replace(/[^\w\s-]/g, '')}$`, 'i') }, '_id');
    filter.theatre = theatreId ? theatreId : { $in: theatres.map((t) => t._id) };
  }

  const shows = await Show.find(filter)
    .sort({ startTime: 1 })
    .populate('movie', 'title duration language posterUrl certificate')
    .populate('theatre', 'name city address')
    .lean();

  // The list view only needs a count, not the full seat array.
  res.json(
    shows.map(({ bookedSeats, ...s }) => ({
      ...s,
      totalSeats: s.rows * s.seatsPerRow,
      availableSeats: s.rows * s.seatsPerRow - bookedSeats.length,
    }))
  );
}

// GET /api/shows/:id  (includes bookedSeats - the seat map is built from this)
async function getShow(req, res) {
  const show = await Show.findById(req.params.id)
    .populate('movie', 'title duration language posterUrl certificate')
    .populate('theatre', 'name city address');
  if (!show) throw new ApiError(404, 'Show not found');
  res.json(show);
}

// POST /api/shows (admin)  body: { movie, theatre, screenName, startTime, price }
async function createShow(req, res) {
  const { movie: movieId, theatre: theatreId, screenName, startTime, price } = req.body || {};
  if (!movieId || !theatreId || !screenName || !startTime || price === undefined) {
    throw new ApiError(400, 'movie, theatre, screenName, startTime and price are required');
  }
  const [movie, theatre] = await Promise.all([Movie.findById(movieId), Theatre.findById(theatreId)]);
  if (!movie) throw new ApiError(404, 'Movie not found');
  if (!theatre) throw new ApiError(404, 'Theatre not found');

  const screen = theatre.screens.find((s) => s.name === screenName);
  if (!screen) throw new ApiError(400, `Theatre has no screen named "${screenName}"`);

  const start = new Date(startTime);
  if (Number.isNaN(start.getTime())) throw new ApiError(400, 'Invalid startTime');
  if (start < new Date()) throw new ApiError(400, 'startTime must be in the future');

  await assertNoOverlap({ theatre: theatre._id, screenName, startTime: start, durationMin: movie.duration });

  const show = await Show.create({
    movie: movie._id,
    theatre: theatre._id,
    screenName,
    rows: screen.rows,
    seatsPerRow: screen.seatsPerRow,
    startTime: start,
    price,
  });
  res.status(201).json(show);
}

// PUT /api/shows/:id (admin)
// Price can always change (affects new bookings only). Time can only move if
// nobody has booked yet - otherwise you'd silently move people's tickets.
async function updateShow(req, res) {
  const show = await Show.findById(req.params.id).populate('movie', 'duration');
  if (!show) throw new ApiError(404, 'Show not found');
  const { price, startTime } = req.body || {};

  if (startTime !== undefined) {
    if (show.bookedSeats.length > 0) throw new ApiError(409, 'Cannot change time: seats are already booked');
    const start = new Date(startTime);
    if (Number.isNaN(start.getTime()) || start < new Date()) throw new ApiError(400, 'Invalid or past startTime');
    await assertNoOverlap({
      theatre: show.theatre,
      screenName: show.screenName,
      startTime: start,
      durationMin: show.movie.duration,
      excludeId: show._id,
    });
    show.startTime = start;
  }
  if (price !== undefined) show.price = price;
  await show.save();
  res.json(show);
}

// DELETE /api/shows/:id (admin)
async function deleteShow(req, res) {
  const active = await Booking.countDocuments({ show: req.params.id, status: 'confirmed' });
  if (active > 0) throw new ApiError(409, `${active} confirmed booking(s) exist for this show`);
  const show = await Show.findByIdAndDelete(req.params.id);
  if (!show) throw new ApiError(404, 'Show not found');
  await Booking.deleteMany({ show: show._id }); // only cancelled ones remain
  res.json({ message: 'Show deleted' });
}

module.exports = { listShows, getShow, createShow, updateShow, deleteShow };
