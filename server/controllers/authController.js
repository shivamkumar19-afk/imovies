const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

function signToken(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role };
}

// POST /api/auth/register
async function register(req, res) {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) throw new ApiError(400, 'Name, email and password are required');
  if (String(password).length < 6) throw new ApiError(400, 'Password must be at least 6 characters');

  const exists = await User.exists({ email: String(email).toLowerCase().trim() });
  if (exists) throw new ApiError(409, 'An account with this email already exists');

  // Role is never taken from the request body - otherwise anyone could
  // register as admin by sending { role: "admin" }.
  const user = await User.create({ name, email, password });
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
}

// POST /api/auth/login
async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) throw new ApiError(400, 'Email and password are required');

  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');
  // Same message for "no user" and "wrong password" so emails can't be probed.
  if (!user || !(await user.matchPassword(String(password)))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  res.json({ token: signToken(user), user: publicUser(user) });
}

// GET /api/auth/me
async function me(req, res) {
  res.json({ user: publicUser(req.user) });
}

module.exports = { register, login, me };
