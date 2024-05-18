const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ETenanciesSchema = new Schema({
    _id: Schema.ObjectId,
    //activeTenant details
    activeTenant: Schema.ObjectId,
    // property details 
    propertyUnit: {
        _id: Schema.ObjectId,
        //extra information needed for eTenancies        
        fullAddress: String,
        roomType: String,
        code: String,
        numberOfTenant: Number,
        numberOfCarpark: Number,
        carParkRental: Number,
        basicMonthlyRental: Number, //become constant after both parties sign
    },
    propertyRoom: {
        _id: Schema.ObjectId,
        name: String, //for completed status
    },
    // tenant details 1 
    mainTenant: {
        _id: Schema.ObjectId,
        identity: { //for completed status
            number: { type: String },
            type: { type: String },
        },
        mobile: String, //for completed status
        email: String, //for completed status
        gender: String, //for completed status
        name: String, //for completed status
        title: String,
        race: String,
        otherRace: String,
    },

    // tenant details 2
    subTenant: {
        name: String,
        identity: {
            number: { type: String },
            type: { type: String },
        },
        mobile: String,
        email: String,
        gender: String,
        title: String,
        race: String,
        otherRace: String,
    },

    //deposit details
    accessCardNo: String,
    deposit: {
        advanceRentalMonth: String,
        advanceRental: Number,
        securityMonth: String,
        security: Number,
        utilityMonth: String,
        utility: Number,
        accessCard: Number,
        assuranceAgreement: Number,
        totalToBePaid: Number,
    },

    tenantPayment: {
        amount: Number,
        date: Date,
    },
    balanceAmount: Number,

    // tenancy details
    tenancy: {
        period: String,
        otherPeriod: String,
        startDate: Date,
        endDate: Date,
    },

    contract: {
        host: Schema.ObjectId,
        hostName: String, //for completed status, to be confirm
        hostSignatureImage: String,
        isHostSigned: Boolean,
        hostSignDate: Date,
        tenant: Schema.ObjectId,
        tenantSignatureImage: String,
        isTenantSigned: Boolean,
        tenantSignDate: Date,
    },

    dateOfAgreement: Date,
    status: String,

    emergencyContact: {
        name: String,
        title: String,
        mobile: String,
        relationWithTenant: String,
    },
    referee: {
        name: String,
        title: String,
        mobile: String,
        relationWithTenant: String,
    },
}, {
    versionKey: false,
    timestamps: {
        createdAt: 'created',
        updatedAt: 'updated'
    }
})

module.exports = mongoose.model("etenancyModel", ETenanciesSchema);