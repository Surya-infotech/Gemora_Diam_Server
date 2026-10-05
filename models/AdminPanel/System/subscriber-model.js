const mongoose = require("mongoose");

const subscriberSchema = new mongoose.Schema({
    subscriberid: { type: Number, required: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    status: { type: String, enum: ["Subscribed", "Unsubscribed"], default: "Subscribed" },
    source: { type: String, default: "LandingPage Footer" },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
});

const SubscriberModel = mongoose.model("Subscriber", subscriberSchema);

module.exports = SubscriberModel;
