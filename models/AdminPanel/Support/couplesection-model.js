const mongoose = require("mongoose");

const storyItemSchema = new mongoose.Schema({
    storyId: { type: String, required: true },
    names: { type: String, required: true },
    location: { type: String, default: "" },
    ringName: { type: String, default: "" },
    proposalDate: { type: String, default: "" },
    excerpt: { type: String, default: "" },
    badge: { type: String, default: "" },
    image: { type: String, default: "" },
    storyLink: { type: String, default: "" },
    order: { type: Number, default: 1 },
    status: { type: Boolean, default: true }
});

const reviewItemSchema = new mongoose.Schema({
    reviewId: { type: String, required: true },
    name: { type: String, required: true },
    badge: { type: String, default: "" },
    rating: { type: Number, default: 5 },
    quote: { type: String, default: "" },
    order: { type: Number, default: 1 },
    status: { type: Boolean, default: true }
});

const coupleSectionSchema = new mongoose.Schema({
    sectionid: { type: Number, default: 1 },
    headerEyebrow: { type: String, default: "" },
    headerTitle: { type: String, default: "" },
    headerDescription: { type: String, default: "" },
    ratingScore: { type: String, default: "" },
    reviewCountText: { type: String, default: "" },
    stories: [storyItemSchema],
    reviews: [reviewItemSchema],
    status: { type: Boolean, default: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
});

const CoupleSectionModel = mongoose.models.CoupleSection || mongoose.model("CoupleSection", coupleSectionSchema);

module.exports = CoupleSectionModel;