const mongoose = require("mongoose");

const colorSchema = new mongoose.Schema({
    colorid: { type: Number, required: true },
    colorname: { type: String, required: true, trim: true },
    colortype: { type: String, required: true, enum: ["Diamond", "Band"] },
    status: { type: Boolean, default: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
});

const ColorModel = mongoose.models.Color || mongoose.model("Color", colorSchema);

module.exports = ColorModel;
