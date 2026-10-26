const router = require('express').Router();
const protect = require('../middleware/auth');
const adminOnly = require('../middleware/admin');
const c = require('../controllers/showController');

router.get('/', c.listShows);
router.get('/:id', c.getShow);
router.post('/', protect, adminOnly, c.createShow);
router.put('/:id', protect, adminOnly, c.updateShow);
router.delete('/:id', protect, adminOnly, c.deleteShow);

module.exports = router;
