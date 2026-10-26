const Movie = require('../models/Movie');
const Show = require('../models/Show');
const ApiError = require('../utils/ApiError');

const EDITABLE = ['title', 'description', 'genre', 'language', 'duration', 'rating', 'certificate', 'posterUrl', 'releaseDate'];

function pick(body) {
  const out = {};
  for (const k of EDITABLE) if (body?.[k] !== undefined) out[k] = body[k];
  if (typeof out.genre === 'string') out.genre = out.genre.split(',').map((g) => g.trim()).filter(Boolean);
  return out;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// GET /api/movies?q=&genre=&language=
async function listMovies(req, res) {
  const { q, genre, language } = req.query;
  const filter = {};
  if (q) filter.title = { $regex: escapeRegex(String(q)), $options: 'i' };
  if (genre) filter.genre = { $regex: `^${escapeRegex(String(genre))}$`, $options: 'i' };
  if (language) filter.language = { $regex: `^${escapeRegex(String(language))}$`, $options: 'i' };

  const movies = await Movie.find(filter).sort({ releaseDate: -1, title: 1 });
  res.json(movies);
}

// GET /api/movies/filters - distinct genres/languages for the filter dropdowns
async function getFilters(req, res) {
  const [genres, languages] = await Promise.all([Movie.distinct('genre'), Movie.distinct('language')]);
  res.json({ genres: genres.sort(), languages: languages.sort() });
}

// GET /api/movies/:id
async function getMovie(req, res) {
  const movie = await Movie.findById(req.params.id);
  if (!movie) throw new ApiError(404, 'Movie not found');
  res.json(movie);
}

// POST /api/movies (admin)
async function createMovie(req, res) {
  const movie = await Movie.create(pick(req.body));
  res.status(201).json(movie);
}

// PUT /api/movies/:id (admin)
async function updateMovie(req, res) {
  const movie = await Movie.findByIdAndUpdate(req.params.id, pick(req.body), {
    returnDocument: 'after',
    runValidators: true,
  });
  if (!movie) throw new ApiError(404, 'Movie not found');
  res.json(movie);
}

// DELETE /api/movies/:id (admin)
async function deleteMovie(req, res) {
  const showCount = await Show.countDocuments({ movie: req.params.id });
  if (showCount > 0) {
    throw new ApiError(409, `This movie has ${showCount} show(s). Delete those shows first.`);
  }
  const movie = await Movie.findByIdAndDelete(req.params.id);
  if (!movie) throw new ApiError(404, 'Movie not found');
  res.json({ message: 'Movie deleted' });
}

module.exports = { listMovies, getFilters, getMovie, createMovie, updateMovie, deleteMovie };
