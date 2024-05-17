const mongoose = require("mongoose");

exports.updateOption = {
  useFindAndModify: false,
  upsert: false,
  new: true,
};

exports.upsertOption = {
  useFindAndModify: false,
  upsert: true,
  new: true,
};

exports.updateOnlyOption = {
  useFindAndModify: false,
  upsert: false,
  new: false,
};

exports.formPipeline = (...stages) => {
  let pipeline = [];
  stages.forEach((stage) => {
    if (Array.isArray(stage)) pipeline.push(...stage);
    else pipeline.push(stage);
  });

  return pipeline;
};

const newId = () => {
  return new mongoose.Types.ObjectId();
};

exports.ensureMongoId = (id) => {
  return new mongoose.Types.ObjectId(id);
};
exports.isMongoDbObjectId = (id) => {
  return new RegExp("^[0-9a-fA-F]{24}$").test(id);
};

export const db = {
  newId: newId,
};
