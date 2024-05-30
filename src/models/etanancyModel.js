const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ETenanciesSchema = new Schema(
  {
    _id: Schema.ObjectId,
    property: {
      name: String,
      address: String,
      monthlyRental: Number,
    },
    tenant: {
      name: String,
      email: String,
      mobile: String,
      identity: {
        number: { type: String },
        type: { type: String },
      },
    },
    deposit: {
      booking: Number,
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
