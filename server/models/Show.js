const mongoose = require('mongoose');

// One show = one movie, on one screen, at one start time.
// Seat layout (rows x seatsPerRow) is copied from the theatre screen when the
// show is created, so editing a theatre later can't corrupt existing bookings.
const showSchema = new mongoose.Schema(
  {
    movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
    theatre: { type: mongoose.Schema.Types.ObjectId, ref: 'Theatre', required: true },
    screenName: { type: String, required: true },
    rows: { type: Number, required: true },
    seatsPerRow: { type: Number, required: true },
    startTime: { type: Date, required: true },
    price: { type: Number, required: true, min: 0 },
    bookedSeats: { type: [String], default: [] },
  },
  { timestamps: true }
);

showSchema.index({ movie: 1, startTime: 1 });
// Same screen can't host two shows starting at the same time.
showSchema.index({ theatre: 1, screenName: 1, startTime: 1 }, { unique: true });

module.exports = mongoose.model('Show', showSchema);
