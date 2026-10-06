const Subscriber = require("../../../models/AdminPanel/Support/subscriber-model");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const subscribe_newsletter = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || typeof email !== 'string' || !email.trim()) {
            return res.status(400).json({ message: "Email address is required." });
        }

        const normalizedEmail = email.trim().toLowerCase();

        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({ message: "Please enter a valid email address." });
        }

        const existingSubscriber = await Subscriber.findOne({ email: normalizedEmail });

        if (existingSubscriber) {
            if (existingSubscriber.status === "Subscribed") {
                return res.status(200).json({
                    message: "You are already subscribed to our newsletter!",
                    alreadySubscribed: true
                });
            } else {
                existingSubscriber.status = "Subscribed";
                existingSubscriber.updatedAt = new Date().toISOString();
                await existingSubscriber.save();

                return res.status(200).json({
                    message: "Welcome back! Your newsletter subscription has been reactivated.",
                    subscriber: existingSubscriber
                });
            }
        }

        const maxSubscriber = await Subscriber.findOne().sort({ subscriberid: -1 });
        const nextSubscriberId = maxSubscriber && maxSubscriber.subscriberid ? parseInt(maxSubscriber.subscriberid, 10) + 1 : 1;

        const newSubscriber = new Subscriber({
            subscriberid: nextSubscriberId,
            email: normalizedEmail,
            status: "Subscribed",
            source: "LandingPage Footer",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        await newSubscriber.save();

        return res.status(201).json({
            message: "Thank you for subscribing! You're all set to receive our industry insights.",
            subscriber: newSubscriber
        });
    } catch (error) {
        console.error("Error subscribing to newsletter:", error);
        return res.status(500).json({ message: "Server error occurred while processing subscription." });
    }
};

const get_subscribers = async (req, res) => {
    try {
        const subscribers = await Subscriber.find().sort({ subscriberid: -1 }).lean();
        return res.status(200).json(subscribers);
    } catch (error) {
        console.error("Error fetching subscribers:", error);
        return res.status(500).json({ message: "Server error occurred while fetching subscribers." });
    }
};

module.exports = {
    subscribe_newsletter,
    get_subscribers
};
