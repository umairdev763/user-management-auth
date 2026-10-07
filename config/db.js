const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.MONGODB_URI);
let db;

async function connectDB() {
  if (db) return db;

  await client.connect();
  db = client.db(process.env.DB_NAME);

  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('users').createIndex({ name: 1 });

  await db.collection('blogs').createIndex({ permalink: 1 }, { unique: true });
  await db.collection('blogs').createIndex({ status: 1, createdAt: -1 });
  await db.collection('blogs').createIndex({ createdAt: -1 });

  await db.collection('models').createIndex({ permalink: 1 }, { unique: true });
  await db.collection('models').createIndex({ status: 1, createdAt: -1 });
  await db.collection('models').createIndex({ createdAt: -1 });

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

function blogsCollection() {
  return getDB().collection('blogs');
}

function modelsCollection() {
  return getDB().collection('models');
}

module.exports = { connectDB, getDB, usersCollection, blogsCollection, modelsCollection };
