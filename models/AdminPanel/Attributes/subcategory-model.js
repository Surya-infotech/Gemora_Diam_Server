const mongoose = require("mongoose");

const subCategorySchema = new mongoose.Schema({
    subcategoryid: { type: Number, required: true },
    subcategoryname: { type: String, required: true, trim: true },
    categoryid: { type: Number, default: null },
    categoryname: { type: String, default: "" },
    status: { type: Boolean, default: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
});

const SubCategoryModel = mongoose.models.SubCategory || mongoose.model("SubCategory", subCategorySchema);

module.exports = SubCategoryModel;