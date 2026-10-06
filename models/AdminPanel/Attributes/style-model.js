const mongoose = require("mongoose");

const styleSchema = new mongoose.Schema({
    styleid: { type: Number, required: true },
    stylename: { type: String, required: true },
    status: { type: Boolean, default: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
});

const StyleModel = mongoose.models.Style || mongoose.model("Style", styleSchema);

module.exports = StyleModel;
