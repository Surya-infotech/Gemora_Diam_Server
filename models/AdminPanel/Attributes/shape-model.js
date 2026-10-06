const mongoose = require("mongoose");

const shapeSchema = new mongoose.Schema({
    shapeid: { type: Number, required: true },
    shapename: { type: String, required: true },
    status: { type: Boolean, default: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
});

const ShapeModel = mongoose.models.Shape || mongoose.model("Shape", shapeSchema);

module.exports = ShapeModel;
