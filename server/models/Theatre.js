const mongoose = require('mongoose');

const screenSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    rows: { type: Number, required: true, min: 1, max: 26 }, // A..Z
    seatsPerRow: { type: Number, required: true, min: 1, max: 40 },
  },
  { _id: false }
);

const theatreSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    address: { type: String, default: '' },
    screens: {
      type: [screenSchema],
      validate: [(v) => v.length > 0, 'A theatre needs at least one screen'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Theatre', theatreSchema);
