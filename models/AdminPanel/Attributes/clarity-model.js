const mongoose = require("mongoose");

const claritySchema = new mongoose.Schema({
    clarityid: { type: Number, required: true },
    clarityname: { type: String, required: true },
    status: { type: Boolean, default: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
});

const ClarityModel = mongoose.models.Clarity || mongoose.model("Clarity", claritySchema);

module.exports = ClarityModel;
