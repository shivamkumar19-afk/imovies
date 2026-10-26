const router = require('express').Router();
const protect = require('../middleware/auth');
const adminOnly = require('../middleware/admin');
const c = require('../controllers/movieController');

router.get('/', c.listMovies);
router.get('/filters', c.getFilters); // must be above /:id
router.get('/:id', c.getMovie);
router.post('/', protect, adminOnly, c.createMovie);
router.put('/:id', protect, adminOnly, c.updateMovie);
router.delete('/:id', protect, adminOnly, c.deleteMovie);

module.exports = router;
