const mongoose = require("mongoose");

const stoneSchema = new mongoose.Schema({
    stoneid: { type: Number, required: true },
    stonename: { type: String, required: true },
    status: { type: Boolean, default: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
});

const StoneModel = mongoose.models.Stone || mongoose.model("Stone", stoneSchema);

module.exports = StoneModel;
