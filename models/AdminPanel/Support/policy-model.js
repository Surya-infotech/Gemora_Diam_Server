const mongoose = require("mongoose");

const policySchema = new mongoose.Schema({
    policyid: { type: Number, required: true },
    policyname: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: Boolean, default: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
});

const PolicyModel = mongoose.models.Policy || mongoose.model("Policy", policySchema);

module.exports = PolicyModel;
