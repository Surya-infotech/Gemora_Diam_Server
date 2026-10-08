const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema({
    bannerid: { type: Number, required: true },
    tag: { type: String, default: "" },
    title: { type: String, default: "" },
    headingLine1: { type: String, default: "" },
    headingLine2: { type: String, default: "" },
    description: { type: String, default: "" },
    image: { type: String, required: true },
    buttonText: { type: String, default: "" },
    buttonLink: { type: String, default: "" },
    secondaryButtonText: { type: String, default: "" },
    secondaryButtonLink: { type: String, default: "" },
    order: { type: Number, default: 1 },
    status: { type: Boolean, default: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
});

const BannerModel = mongoose.models.Banner || mongoose.model("Banner", bannerSchema);

module.exports = BannerModel;