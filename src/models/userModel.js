const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AddressSchema = new Schema({
    line1: String,
    line2: String,
    postcode: String,
    city: String,
    area: String,
    state: String,
    country: String,
});

const UserSchema = new Schema({
    _id: Schema.ObjectId,
    personal: {
        name: String,
        email: String,
        gender: String,
        identity: {        
            number: { type: String },
            type: { type: String }
        },
        mobile: String,
        password: {
            type: String,
            select: false // field won't be included in the returned documents unless explicitly specified.
        },
        address: AddressSchema
    },
    company: { 
        logo: String,
        regNo: String,
        name: String,
        email: String,
        contact: String,
        address: AddressSchema
    },
    status: String,
    role: String,
    access: {
        module: [],       
    },
    lastLogin: Date,
}, {
    versionKey: false,
    timestamps: {
        createdAt: 'created',
        updatedAt: 'updated'
    }
});

module.exports = mongoose.model("usermodel", UserSchema);

