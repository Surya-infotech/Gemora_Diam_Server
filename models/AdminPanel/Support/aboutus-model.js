const mongoose = require("mongoose");

const aboutUsSchema = new mongoose.Schema({
    // Hero / Heritage & Vision
    heroEyebrow: {
        type: String,
        default: ""
    },
    heroTitle: {
        type: String,
        default: ""
    },
    heroDescription: {
        type: String,
        default: ""
    },

    // Commitment Section (Pillars)
    commitmentEyebrow: {
        type: String,
        default: ""
    },
    pillar1Title: {
        type: String,
        default: ""
    },
    pillar1Description: {
        type: String,
        default: ""
    },
    pillar2Title: {
        type: String,
        default: ""
    },
    pillar2Description: {
        type: String,
        default: ""
    },
    pillar3Title: {
        type: String,
        default: ""
    },
    pillar3Description: {
        type: String,
        default: ""
    },

    // Studio & Showroom Spotlight
    studioEyebrow: {
        type: String,
        default: ""
    },
    studioTitle: {
        type: String,
        default: ""
    },
    studioDescription: {
        type: String,
        default: ""
    },
    studioImage: {
        type: String,
        default: ""
    },
    buttonText: {
        type: String,
        default: ""
    },
    buttonLink: {
        type: String,
        default: ""
    },

    updatedAt: {
        type: String
    }
}, { timestamps: true });

const AboutUs = mongoose.model("AboutUs", aboutUsSchema);
module.exports = AboutUs;
