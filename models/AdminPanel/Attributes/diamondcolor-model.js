const mongoose = require("mongoose");

const diamondColorSchema = new mongoose.Schema({
    diamondcolorid: { type: Number, required: true },
    diamondcolor: { type: String, required: true },
    status: { type: Boolean, default: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
});

const DiamondColorModel = mongoose.models.DiamondColor || mongoose.model("DiamondColor", diamondColorSchema);

module.exports = DiamondColorModel;
