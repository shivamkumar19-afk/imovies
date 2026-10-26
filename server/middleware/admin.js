const ApiError = require('../utils/ApiError');

// Must run after `protect`.
function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') throw new ApiError(403, 'Admin access only');
  next();
}

module.exports = adminOnly;
