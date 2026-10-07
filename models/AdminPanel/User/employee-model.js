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
    employeetype: {
        type: String,
        enum: ["Admin", "Employee"],
        default: "Employee",
        required: true
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
    },
    Token: {
        type: String,
        default: ""
    }
});

employeeSchema.methods.generateToken = function () {
    try {
        return jwt.sign(
            { adminId: this._id.toString(), email: this.email, role: this.employeetype ? this.employeetype.toLowerCase() : "employee" },
            process.env.JWT_KEY || "gemora_diam_secret_jwt_key_2026",
            { expiresIn: "12h" }
        );
    } catch (error) {
        console.error("JWT sign error:", error);
        throw error;
    }
};

const Employee = mongoose.model("Employee", employeeSchema);

module.exports = Employee;
