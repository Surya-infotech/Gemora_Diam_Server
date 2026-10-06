const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
    itemid: { type: Number, required: true },
    itemname: { type: String, required: true },
    categoryid: { type: Number, default: null },
    categoryname: { type: String, default: "" },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    status: { type: Boolean, default: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
});

const ItemModel = mongoose.models.Item || mongoose.model("Item", itemSchema);

module.exports = ItemModel;