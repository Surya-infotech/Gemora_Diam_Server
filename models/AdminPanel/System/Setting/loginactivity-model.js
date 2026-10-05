const mongoose = require("mongoose");

const loginActivitySchema = new mongoose.Schema({
    loginacitivityid: { type: Number, required: true },
    adminid: { type: mongoose.Schema.Types.Mixed, required: false },
    browserdetails: { type: String, required: true },
    ipaddress: { type: String, required: true },
    device: { type: String, required: true },
    location: { type: String, required: true },
    login: { type: String, required: true },
    createdAt: { type: String, default: () => new Date().toISOString() }
});

const LoginActivityModel = mongoose.models.LoginActivity || mongoose.model("LoginActivity", loginActivitySchema);
const LoginActivity = (db) => LoginActivityModel;
module.exports = Object.assign(LoginActivity, LoginActivityModel);
