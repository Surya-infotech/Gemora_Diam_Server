const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const employeeSchema = new mongoose.Schema({
    employeeid: {
        type: Number,
        required: true,
        unique: true
    },
    firstname: {
        type: String,
        required: true,
        trim: true
    },
    lastname: {
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
    role: {
        type: String,
        enum: ["Admin", "Employee"],
        default: "Employee",
        required: true
    },
    status: {
        type: Boolean,
        default: true
    },
    profileimage: {
        type: String,
        default: ""
    },
    gender: {
        type: String,
        default: "Male"
    },
    address: {
        type: String,
        default: ""
    },
    countryname: {
        type: String,
        default: ""
    },
    statename: {
        type: String,
        default: ""
    },
    cityname: {
        type: String,
        default: ""
    },
    countryid: {
        type: String,
        default: ""
    },
    stateid: {
        type: String,
        default: ""
    },
    cityid: {
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
    },
    permissions: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    Token: {
        type: String,
        default: ""
    }
});

employeeSchema.methods.generateToken = function () {
    try {
        return jwt.sign(
            { adminId: this._id.toString(), employeeId: this._id.toString(), email: this.email, role: this.role },
            process.env.JWT_KEY,
            { expiresIn: "12h" }
        );
    } catch (error) {
        console.error("JWT sign error:", error);
        throw error;
    }
};

const Employee = mongoose.model("Employee", employeeSchema);

module.exports = Employee;
