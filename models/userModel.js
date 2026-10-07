const { ObjectId } = require('mongodb');
const { usersCollection } = require('../config/db');

function publicUser(user) {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return {
    ...safeUser,
    _id: safeUser._id?.toString()
  };
}

async function findByEmail(email) {
  return usersCollection().findOne({ email: email.toLowerCase().trim() });
}

async function findById(id) {
  if (!ObjectId.isValid(id)) return null;
  return usersCollection().findOne({ _id: new ObjectId(id) });
}

async function listUsers(search = '') {
  const filter = search
    ? {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { role: { $regex: search, $options: 'i' } }
        ]
      }
    : {};

  const users = await usersCollection()
    .find(filter, { projection: { password: 0 } })
    .sort({ createdAt: -1 })
    .toArray();

  return users.map(publicUser);
}

async function createUser({ name, email, password, role = 'user' }) {
  const now = new Date();
  const result = await usersCollection().insertOne({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    role,
    createdAt: now,
    updatedAt: now
  });

  return findById(result.insertedId.toString());
}

async function updateUser(id, updates) {
  if (!ObjectId.isValid(id)) return null;

  const cleanUpdates = { ...updates, updatedAt: new Date() };
  await usersCollection().updateOne(
    { _id: new ObjectId(id) },
    { $set: cleanUpdates }
  );

  return findById(id);
}

async function deleteUser(id) {
  if (!ObjectId.isValid(id)) return false;
  const result = await usersCollection().deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}

async function getStats() {
  const [total, admins, regularUsers] = await Promise.all([
    usersCollection().countDocuments(),
    usersCollection().countDocuments({ role: 'admin' }),
    usersCollection().countDocuments({ role: 'user' })
  ]);

  return { total, admins, regularUsers };
}

module.exports = {
  publicUser,
  findByEmail,
  findById,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  getStats
};
