const Show = require('../models/Show');
const Booking = require('../models/Booking');
const ApiError = require('../utils/ApiError');
const { isValidSeat, MAX_SEATS_PER_BOOKING } = require('../utils/seats');

const populateShow = {
  path: 'show',
  select: 'startTime screenName price movie theatre',
  populate: [
    { path: 'movie', select: 'title posterUrl duration language' },
    { path: 'theatre', select: 'name city address' },
  ],
};

// POST /api/bookings  body: { showId, seats: ["A1","A2"] }
async function createBooking(req, res) {
  const { showId, seats: rawSeats } = req.body || {};
  if (!showId) throw new ApiError(400, 'showId is required');
  if (!Array.isArray(rawSeats) || rawSeats.length === 0) throw new ApiError(400, 'Select at least one seat');

  const seats = [...new Set(rawSeats.map((s) => String(s).toUpperCase().trim()))];
  if (seats.length !== rawSeats.length) throw new ApiError(400, 'Duplicate seats in request');
  if (seats.length > MAX_SEATS_PER_BOOKING) {
    throw new ApiError(400, `You can book at most ${MAX_SEATS_PER_BOOKING} seats at a time`);
  }

  const show = await Show.findById(showId);
  if (!show) throw new ApiError(404, 'Show not found');
  if (show.startTime <= new Date()) throw new ApiError(400, 'This show has already started');

  const invalid = seats.filter((s) => !isValidSeat(s, show.rows, show.seatsPerRow));
  if (invalid.length) throw new ApiError(400, `Invalid seat(s): ${invalid.join(', ')}`);

  // THE critical step. Matches the show only if none of the requested seats
  // are already in bookedSeats, and adds them in the same atomic operation.
  // Two users racing for the same seat: exactly one update matches.
  const updated = await Show.findOneAndUpdate(
    { _id: show._id, bookedSeats: { $nin: seats } },
    { $push: { bookedSeats: { $each: seats } } },
    { returnDocument: 'after' }
  );

  if (!updated) {
    const fresh = await Show.findById(show._id, 'bookedSeats');
    const taken = seats.filter((s) => fresh.bookedSeats.includes(s));
    throw new ApiError(409, `Seat(s) just got booked by someone else: ${taken.join(', ')}`);
  }

  // Price is computed on the server. Never trust a total sent by the client.
  let booking;
  try {
    booking = await Booking.create({
      user: req.user._id,
      show: show._id,
      seats,
      totalAmount: seats.length * show.price,
    });
  } catch (err) {
    // Seats were reserved but the booking failed - release them, or they'd
    // be locked forever with no owner.
    await Show.updateOne({ _id: show._id }, { $pullAll: { bookedSeats: seats } });
    throw err;
  }

  await booking.populate(populateShow);
  res.status(201).json(booking);
}

// GET /api/bookings/my
async function myBookings(req, res) {
  const bookings = await Booking.find({ user: req.user._id }).sort({ createdAt: -1 }).populate(populateShow);
  res.json(bookings);
}

// GET /api/bookings/:id  (owner or admin)
async function getBooking(req, res) {
  const booking = await Booking.findById(req.params.id).populate(populateShow).populate('user', 'name email');
  if (!booking) throw new ApiError(404, 'Booking not found');
  const isOwner = booking.user._id.equals(req.user._id);
  if (!isOwner && req.user.role !== 'admin') throw new ApiError(404, 'Booking not found');
  res.json(booking);
}

// PUT /api/bookings/:id/cancel
async function cancelBooking(req, res) {
  const existing = await Booking.findOne({ _id: req.params.id, user: req.user._id }).populate('show', 'startTime');
  if (!existing) throw new ApiError(404, 'Booking not found');
  if (existing.status === 'cancelled') throw new ApiError(400, 'Booking is already cancelled');
  if (!existing.show || existing.show.startTime <= new Date()) {
    throw new ApiError(400, 'Cannot cancel after the show has started');
  }

  // Conditional update so a double-click / two tabs can't cancel twice.
  const booking = await Booking.findOneAndUpdate(
    { _id: existing._id, status: 'confirmed' },
    { status: 'cancelled' },
    { returnDocument: 'after' }
  );
  if (!booking) throw new ApiError(400, 'Booking is already cancelled');

  await Show.updateOne({ _id: booking.show }, { $pullAll: { bookedSeats: booking.seats } });
  await booking.populate(populateShow);
  res.json(booking);
}

// GET /api/bookings  (admin) - all bookings, newest first
async function allBookings(req, res) {
  const bookings = await Booking.find()
    .sort({ createdAt: -1 })
    .limit(200)
    .populate(populateShow)
    .populate('user', 'name email');
  res.json(bookings);
}

module.exports = { createBooking, myBookings, getBooking, cancelBooking, allBookings };
