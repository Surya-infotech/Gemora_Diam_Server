const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
    itemid: { type: Number, required: true },
    itemname: { type: String, required: true },
    categoryid: { type: Number, required: true },
    categoryname: { type: String, required: true },
    metals: {
        type: [
            {
                metalid: { type: Number },
                metalname: { type: String },
                metaltype: { type: String }
            }
        ],
        default: []
    },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    status: { type: Boolean, default: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
});

const ItemModel = mongoose.models.Item || mongoose.model("Item", itemSchema);

module.exports = ItemModel;