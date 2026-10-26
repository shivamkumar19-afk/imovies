const router = require('express').Router();
const protect = require('../middleware/auth');
const adminOnly = require('../middleware/admin');
const c = require('../controllers/theatreController');

router.get('/', c.listTheatres);
router.get('/:id', c.getTheatre);
router.post('/', protect, adminOnly, c.createTheatre);
router.put('/:id', protect, adminOnly, c.updateTheatre);
router.delete('/:id', protect, adminOnly, c.deleteTheatre);

module.exports = router;
