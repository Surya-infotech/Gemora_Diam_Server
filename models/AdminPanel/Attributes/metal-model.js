const mongoose = require("mongoose");

const metalSchema = new mongoose.Schema({
    metalid: { type: Number, required: true },
    metalname: { type: String, required: true },
    metaltype: { type: String, required: true },
    status: { type: Boolean, default: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
});

const MetalModel = mongoose.models.Metal || mongoose.model("Metal", metalSchema);

module.exports = MetalModel;
