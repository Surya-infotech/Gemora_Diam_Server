const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const adminSchema = new mongoose.Schema({
    profileimage: {
        type: String,
        default: "",
    },
    adminfirstname: {
        type: String,
        required: true,
        trim: true,
    },
    adminlastname: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        default: "",
    },
    gender: {
        type: String,
        enum: ["Male", "Female", "Intersex", "Other"],
        default: "Male",
    },
    address: {
        type: String,
        default: "",
    },
    cityname: {
        type: String,
        default: "",
    },
    statename: {
        type: String,
        default: "",
    },
    countryname: {
        type: String,
        default: "",
    },
    countryid: {
        type: String,
        default: "",
    },
    stateid: {
        type: String,
        default: "",
    },
    cityid: {
        type: String,
        default: "",
    },
    createdAt: {
        type: String,
        default: () => new Date().toISOString(),
    },
    updatedAt: {
        type: String,
        default: () => new Date().toISOString(),
    },
    Token: {
        type: String,
        default: "",
    }
});

adminSchema.methods.generateToken = function () {
    try {
        return jwt.sign(
            { adminId: this._id.toString(), email: this.email, role: "admin" },
            process.env.JWT_KEY,
            { expiresIn: "12h" }
        );
    } catch (error) {
        console.error("JWT sign error:", error);
        throw error;
    }
};

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;