const mongoose = require("mongoose");

const lengthSchema = new mongoose.Schema({
    lengthid: { type: Number, required: true },
    lengthname: { type: String, required: true, trim: true },
    lengthtype: { type: String, required: true, enum: ["Bracelet", "Pendant"] },
    status: { type: Boolean, default: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
});

const LengthModel = mongoose.models.Length || mongoose.model("Length", lengthSchema);

module.exports = LengthModel;