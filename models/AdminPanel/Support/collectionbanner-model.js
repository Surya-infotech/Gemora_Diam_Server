const mongoose = require("mongoose");

const collectionBannerSchema = new mongoose.Schema({
    bannerid: { type: Number, required: true },
    tag: { type: String, default: "" },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    image: { type: String, required: true },
    buttonText: { type: String, default: "SHOP COLLECTION" },
    buttonLink: { type: String, default: "/shop" },
    position: { type: String, enum: ["left", "right"], default: "left" },
    order: { type: Number, default: 1 },
    status: { type: Boolean, default: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
});

const CollectionBannerModel = mongoose.models.CollectionBanner || mongoose.model("CollectionBanner", collectionBannerSchema);

module.exports = CollectionBannerModel;