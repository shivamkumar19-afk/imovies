const router = require('express').Router();
const protect = require('../middleware/auth');
const adminOnly = require('../middleware/admin');
const c = require('../controllers/bookingController');

router.use(protect); // every booking route needs login

router.post('/', c.createBooking);
router.get('/my', c.myBookings); // must be above /:id
router.get('/', adminOnly, c.allBookings);
router.get('/:id', c.getBooking);
router.put('/:id/cancel', c.cancelBooking);

module.exports = router;
