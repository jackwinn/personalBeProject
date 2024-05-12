// models
const userModel = require("../models/userModel")


const getById = async (id) => {
    const result = await userModel.findById(id);
    return result;
  };
  exports.getById = getById;