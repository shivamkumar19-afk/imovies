const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    genre: [{ type: String, trim: true }],
    language: { type: String, required: true, trim: true },
    duration: { type: Number, required: true, min: 1 }, // minutes
    rating: { type: Number, min: 0, max: 10, default: 0 },
    certificate: { type: String, enum: ['U', 'UA', 'A', 'S'], default: 'UA' },
    posterUrl: { type: String, default: '' },
    releaseDate: { type: Date },
  },
  { timestamps: true }
);

// No MongoDB text index here: a text index treats a field named "language" as
// the stemming language, and rejects values like "Hindi" (error 17262).
// Search uses a case-insensitive regex on title instead (see movieController).

module.exports = mongoose.model('Movie', movieSchema);
