const mongoose = require("mongoose");

const loginActivitySchema = new mongoose.Schema({
    loginacitivityid: {
        type: Number,
        required: true,
    },
    adminid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        required: false,
    },
    browserdetails: {
        type: String,
        default: "Unknown",
    },
    ipaddress: {
        type: String,
        default: "Unknown",
    },
    device: {
        type: String,
        default: "Desktop",
    },
    location: {
        type: String,
        default: "Unknown",
    },
    login: {
        type: String,
        required: true,
    },
    createdAt: {
        type: String,
        default: () => new Date().toISOString(),
    }
});

const AdminLoginActivity = mongoose.model("AdminLoginActivity", loginActivitySchema);

module.exports = AdminLoginActivity;
