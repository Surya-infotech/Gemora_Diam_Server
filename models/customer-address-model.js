const mongoose = require("mongoose");

const customerAddressSchema = new mongoose.Schema({
    addressid: {
        type: Number,
        required: true,
        unique: true
    },
    customerid: {
        type: Number,
        required: true,
        index: true
    },
    title: {
        type: String,
        default: "Home"
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    pincode: {
        type: String,
        required: true,
        trim: true
    },
    countryname: {
        type: String,
        required: true,
        trim: true
    },
    countrycode: {
        type: String,
        default: ""
    },
    statename: {
        type: String,
        required: true,
        trim: true
    },
    statecode: {
        type: String,
        default: ""
    },
    cityname: {
        type: String,
        required: true,
        trim: true
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    status: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: String,
        default: () => new Date().toISOString()
    },
    updatedAt: {
        type: String,
        default: () => new Date().toISOString()
    }
});

const CustomerAddress = mongoose.model("CustomerAddress", customerAddressSchema);

module.exports = CustomerAddress;
