const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ETenanciesSchema = new Schema(
  {
    _id: Schema.ObjectId,
    property: {
      address: String,
      monthlyRental: Number,
    },
    tenant: {
      name: String,
      email: String,
      mobile: String,
      identityNo: String,
      signatureImage: String,
      signDate: Date,
    },
    host: {
      name: String,
      identityNo: String,
      signatureImage: String,
      signDate: Date,
    },
    deposit: {   
      security: Number,
      utility: Number,
      accessCard: Number,
      parkingCard: Number,
    },
    tenancy: {
      period: String,     
      startDate: Date,
      endDate: Date,
    },
    dateOfAgreement: Date,
    status: String,
  },
  {
    versionKey: false,
    timestamps: {
      createdAt: "created",
      updatedAt: "updated",
    },
  }
);

module.exports = mongoose.model("etenancyModel", ETenanciesSchema);
