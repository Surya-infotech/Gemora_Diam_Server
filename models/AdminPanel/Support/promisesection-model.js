const mongoose = require("mongoose");

const promiseStyleItemSchema = new mongoose.Schema({
    styleId: { type: String, required: true },
    name: { type: String, required: true },
    desc: { type: String, default: "" },
    img: { type: String, default: "" },
    link: { type: String, default: "" },
    order: { type: Number, default: 1 },
    status: { type: Boolean, default: true }
});

const promiseSectionSchema = new mongoose.Schema({
    sectionid: { type: Number, default: 1 },
    status: { type: Boolean, default: true },

    // Section Header
    headerEyebrow: { type: String, default: "" },
    headerTitle: { type: String, default: "" },
    headerHighlightText: { type: String, default: "" },
    headerDescription: { type: String, default: "" },

    // Left Large Card (The Vows - Wedding Bands)
    vowsEyebrow: { type: String, default: "" },
    vowsTitle: { type: String, default: "" },
    vowsSubtitle: { type: String, default: "" },
    vowsImage: { type: String, default: "" },
    vowsButtonText: { type: String, default: "" },
    vowsButtonLink: { type: String, default: "" },

    // Right Top Card (The Proposal - Engagement Rings)
    proposalEyebrow: { type: String, default: "" },
    proposalTitle: { type: String, default: "" },
    proposalSubtitle: { type: String, default: "" },
    proposalImage: { type: String, default: "" },
    proposalButtonText: { type: String, default: "" },
    proposalButtonLink: { type: String, default: "" },

    // Bottom Box (Shop by Style Carousel)
    styleSectionTitle: { type: String, default: "" },
    styles: [promiseStyleItemSchema],

    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
});

const PromiseSectionModel = mongoose.models.PromiseSection || mongoose.model("PromiseSection", promiseSectionSchema);

module.exports = PromiseSectionModel;