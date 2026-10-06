const mongoose = require("mongoose");

const ringSizeSchema = new mongoose.Schema({
    ringsizeid: { type: Number, required: true },
    ringsize: { type: String, required: true },
    status: { type: Boolean, default: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
});

const RingSizeModel = mongoose.models.RingSize || mongoose.model("RingSize", ringSizeSchema);

module.exports = RingSizeModel;
