const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');
const {
  listUsers,
  findById,
  findByEmail,
  createUser,
  updateUser,
  deleteUser,
  publicUser
} = require('../models/userModel');

async function getProfile(req, res) {
  res.json({ user: publicUser(req.user) });
}

async function getUsers(req, res) {
  try {
    const users = await listUsers(req.query.search || '');
    res.json({ users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not load users.' });
  }
}

async function addUser(req, res) {
  try {
    const { name, email, password, role = 'user' } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }
    if (await findByEmail(email)) {
      return res.status(409).json({ message: 'Email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await createUser({ name, email, password: hashedPassword, role });
    res.status(201).json({ message: 'User added.', user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'Email already exists.' });
    console.error(error);
    res.status(500).json({ message: 'Could not add user.' });
  }
}

async function editUser(req, res) {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid user ID.' });

    const current = await findById(id);
    if (!current) return res.status(404).json({ message: 'User not found.' });

    const { name, email, password, role } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name.trim();
    if (email !== undefined) {
      const normalizedEmail = email.toLowerCase().trim();
      const other = await findByEmail(normalizedEmail);
      if (other && other._id.toString() !== id) {
        return res.status(409).json({ message: 'Email already exists.' });
      }
      updates.email = normalizedEmail;
    }
    if (role !== undefined) {
      if (!['user', 'admin'].includes(role)) return res.status(400).json({ message: 'Invalid role.' });
      updates.role = role;
    }
    if (password) {
      if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters.' });
      updates.password = await bcrypt.hash(password, 12);
    }

    const user = await updateUser(id, updates);
    res.json({ message: 'User updated.', user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'Email already exists.' });
    console.error(error);
    res.status(500).json({ message: 'Could not update user.' });
  }
}

async function removeUser(req, res) {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own admin account.' });
    }
    const deleted = await deleteUser(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'User not found.' });
    res.json({ message: 'User deleted.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not delete user.' });
  }
}

module.exports = { getProfile, getUsers, addUser, editUser, removeUser };
