const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
    categoryid: { type: Number, required: true },
    categoryname: { type: String, required: true },
    description: { type: String, default: "", maxlength: 120, trim: true },
    image: { type: String, default: "" },
    status: { type: Boolean, default: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
});

const CategoryModel = mongoose.models.Category || mongoose.model("Category", categorySchema);

module.exports = CategoryModel;