const Theatre = require('../models/Theatre');
const Show = require('../models/Show');
const ApiError = require('../utils/ApiError');

function pick(body) {
  const out = {};
  for (const k of ['name', 'city', 'address', 'screens']) if (body?.[k] !== undefined) out[k] = body[k];
  return out;
}

// GET /api/theatres?city=
async function listTheatres(req, res) {
  const city = String(req.query.city || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const filter = city ? { city: new RegExp(`^${city}$`, 'i') } : {};
  res.json(await Theatre.find(filter).sort({ city: 1, name: 1 }));
}

// GET /api/theatres/:id
async function getTheatre(req, res) {
  const theatre = await Theatre.findById(req.params.id);
  if (!theatre) throw new ApiError(404, 'Theatre not found');
  res.json(theatre);
}

// POST /api/theatres (admin)
async function createTheatre(req, res) {
  res.status(201).json(await Theatre.create(pick(req.body)));
}

// PUT /api/theatres/:id (admin)
// Existing shows keep the seat layout they were created with, so changing a
// screen's size here only affects shows created afterwards.
async function updateTheatre(req, res) {
  const theatre = await Theatre.findByIdAndUpdate(req.params.id, pick(req.body), {
    returnDocument: 'after',
    runValidators: true,
  });
  if (!theatre) throw new ApiError(404, 'Theatre not found');
  res.json(theatre);
}

// DELETE /api/theatres/:id (admin)
async function deleteTheatre(req, res) {
  const showCount = await Show.countDocuments({ theatre: req.params.id });
  if (showCount > 0) throw new ApiError(409, `This theatre has ${showCount} show(s). Delete those shows first.`);
  const theatre = await Theatre.findByIdAndDelete(req.params.id);
  if (!theatre) throw new ApiError(404, 'Theatre not found');
  res.json({ message: 'Theatre deleted' });
}

module.exports = { listTheatres, getTheatre, createTheatre, updateTheatre, deleteTheatre };
