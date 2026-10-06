const mongoose = require("mongoose");

const faqSchema = new mongoose.Schema({
    faqid: { type: Number, required: true },
    faqtype: {
        type: String,
        required: true,
        enum: ["Shipping policy", "Returns and exchanges", "Frequently asked questions"]
    },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    status: { type: Boolean, default: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
});

const FAQModel = mongoose.models.FAQ || mongoose.model("FAQ", faqSchema);

module.exports = FAQModel;
