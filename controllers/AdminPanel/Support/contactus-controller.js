const ContactUs = require("../../../models/AdminPanel/Support/contactus-model");

const get_contactus = async (_req, res) => {
    try {
        const contactusList = await ContactUs.find().sort({ createdAt: -1 }).lean();
        return res.status(200).json(contactusList);
    } catch (error) {
        console.log("Error fetching Contact Us:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const add_contactus = async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ message: "Full name, email and message are required" });
        }

        const maxContactUs = await ContactUs.findOne().sort({ contactusid: -1 });
        const nextContactUsId = maxContactUs ? parseInt(maxContactUs.contactusid, 10) + 1 : 1;

        const newContactUs = new ContactUs({
            contactusid: nextContactUsId,
            fullname: name.trim(),
            email: email.trim(),
            message: message.trim(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        await newContactUs.save();
        return res.status(201).json({ message: "Contact us submitted successfully", contactus: newContactUs });
    } catch (error) {
        console.log("Error adding Contact Us:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = { get_contactus, add_contactus };
