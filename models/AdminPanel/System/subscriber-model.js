const mongoose = require("mongoose");

const subscriberSchema = new mongoose.Schema({
    subscriberid: { type: Number, required: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    status: { type: String, enum: ["Subscribed", "Unsubscribed"], default: "Subscribed" },
    source: { type: String, default: "LandingPage Footer" },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
});

const SubscriberModel = mongoose.models.Subscriber || mongoose.model("Subscriber", subscriberSchema);
const Subscriber = (db) => SubscriberModel;
module.exports = Object.assign(Subscriber, SubscriberModel);
