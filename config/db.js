const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.MONGODB_URI);
let db;

async function connectDB() {
  if (db) return db;

  await client.connect();
  db = client.db(process.env.DB_NAME);

  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('users').createIndex({ name: 1 });

  console.log(`MongoDB connected: ${process.env.DB_NAME}`);
  return db;
}

function getDB() {
  if (!db) throw new Error('Database is not connected.');
  return db;
}

function usersCollection() {
  return getDB().collection('users');
}

module.exports = { connectDB, getDB, usersCollection };
