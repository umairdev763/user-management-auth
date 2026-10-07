const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const {
  getProfile,
  getUsers,
  addUser,
  editUser,
  removeUser
} = require('../controllers/userController');

const router = express.Router();
router.get('/me', requireAuth, getProfile);
router.get('/', requireAdmin, getUsers);
router.post('/', requireAdmin, addUser);
router.put('/:id', requireAdmin, editUser);
router.delete('/:id', requireAdmin, removeUser);

module.exports = router;
