const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { findByEmail, createUser, publicUser } = require('../models/userModel');

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  };
}

function createToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
}

async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const existing = await findByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'Email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await createUser({ name, email, password: hashedPassword, role: 'user' });

    return res.status(201).json({ message: 'Registration successful.', user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Email already exists.' });
    }
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await findByEmail(email || '');

    if (!user || !(await bcrypt.compare(password || '', user.password))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = createToken(user);
    res.cookie(process.env.COOKIE_NAME || 'auth_token', token, cookieOptions());

    res.json({ message: 'Login successful.', user: publicUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
}

function logout(req, res) {
  res.clearCookie(process.env.COOKIE_NAME || 'auth_token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
  res.json({ message: 'Logged out successfully.' });
}

module.exports = { register, login, logout };
