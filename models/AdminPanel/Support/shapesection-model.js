const mongoose = require("mongoose");

const shapeItemSchema = new mongoose.Schema({
    shapeid: { type: String, required: true },
    name: { type: String, required: true },
    tagline: { type: String, default: "" },
    description: { type: String, default: "" },
    bestFor: { type: String, default: "" },
    brilliance: { type: String, default: "" },
    shapeIcon: { type: String, default: "" },
    showcaseImage: { type: String, default: "" },
    showcaseTitle: { type: String, default: "" },
    buttonLink: { type: String, default: "" },
    order: { type: Number, default: 1 },
    status: { type: Boolean, default: true }
});

const shapeSectionSchema = new mongoose.Schema({
    sectionid: { type: Number, default: 1 },
    headerEyebrow: { type: String, default: "" },
    headerTitle: { type: String, default: "" },
    headerDescription: { type: String, default: "" },

    designEyebrow: { type: String, default: "" },
    designTitle: { type: String, default: "" },
    designDescription: { type: String, default: "" },
    primaryBtnText: { type: String, default: "" },
    primaryBtnLink: { type: String, default: "" },
    secondaryBtnText: { type: String, default: "" },
    secondaryBtnLink: { type: String, default: "" },

    step1Num: { type: String, default: "" },
    step1Title: { type: String, default: "" },
    step1Desc: { type: String, default: "" },

    step2Num: { type: String, default: "" },
    step2Title: { type: String, default: "" },
    step2Desc: { type: String, default: "" },

    step3Num: { type: String, default: "" },
    step3Title: { type: String, default: "" },
    step3Desc: { type: String, default: "" },

    shapes: [shapeItemSchema],

    status: { type: Boolean, default: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
});

const ShapeSectionModel = mongoose.models.ShapeSection || mongoose.model("ShapeSection", shapeSectionSchema);

module.exports = ShapeSectionModel;
