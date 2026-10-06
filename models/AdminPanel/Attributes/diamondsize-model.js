const mongoose = require("mongoose");

const diamondSizeSchema = new mongoose.Schema({
    diamondsizeid: { type: Number, required: true },
    diamondsize: { type: String, required: true },
    status: { type: Boolean, default: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
});

const DiamondSizeModel = mongoose.models.DiamondSize || mongoose.model("DiamondSize", diamondSizeSchema);

module.exports = DiamondSizeModel;
