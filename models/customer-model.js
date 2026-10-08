const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const customerSchema = new mongoose.Schema({
    customerid: {
        type: Number,
        required: true,
        unique: true
    },
    fullname: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        default: ""
    },
    status: {
        type: Boolean,
        default: true
    },
    profileimage: {
        type: String,
        default: ""
    },
    Token: {
        type: String,
        default: ""
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

customerSchema.methods.generateToken = function () {
    try {
        return jwt.sign(
            { customerId: this._id.toString(), email: this.email },
            process.env.CUSTOMER_JWT_KEY,
            { expiresIn: "12h" }
        );
    } catch (error) {
        console.error("JWT sign error for customer:", error);
        throw error;
    }
};

const Customer = mongoose.model("Customer", customerSchema);

module.exports = Customer;
