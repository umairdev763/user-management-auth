const { ObjectId } = require('mongodb');
const { modelsCollection } = require('../config/db');

function serializeModel(model) {
  if (!model) return null;
  return {
    ...model,
    _id: model._id?.toString()
  };
}

async function createModel(data) {
  const result = await modelsCollection().insertOne(data);
  return findById(result.insertedId.toString());
}

async function findById(id) {
  if (!ObjectId.isValid(id)) return null;
  return modelsCollection().findOne({ _id: new ObjectId(id) });
}

async function findByPermalink(permalink) {
  return modelsCollection().findOne({ permalink });
}

async function findPermalinkExceptId(permalink, id) {
  const filter = { permalink };
  if (id && ObjectId.isValid(id)) filter._id = { $ne: new ObjectId(id) };
  return modelsCollection().findOne(filter);
}

async function listModels({ status, search = '' } = {}) {
  const filter = {};
  if (status) filter.status = status;
  if (search.trim()) {
    filter.$or = [
      { title: { $regex: search.trim(), $options: 'i' } },
      { permalink: { $regex: search.trim(), $options: 'i' } }
    ];
  }

  const models = await modelsCollection().find(filter).sort({ createdAt: -1 }).toArray();
  return models.map(serializeModel);
}

async function updateModel(id, updates) {
  if (!ObjectId.isValid(id)) return null;
  await modelsCollection().updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...updates, updatedAt: new Date() } }
  );
  return findById(id);
}

async function deleteModel(id) {
  if (!ObjectId.isValid(id)) return null;
  const model = await findById(id);
  if (!model) return null;
  await modelsCollection().deleteOne({ _id: new ObjectId(id) });
  return model;
}

async function getStats() {
  const [total, published, drafts] = await Promise.all([
    modelsCollection().countDocuments(),
    modelsCollection().countDocuments({ status: 'published' }),
    modelsCollection().countDocuments({ status: 'draft' })
  ]);
  return { total, published, drafts };
}

module.exports = {
  serializeModel,
  createModel,
  findById,
  findByPermalink,
  findPermalinkExceptId,
  listModels,
  updateModel,
  deleteModel,
  getStats
};
