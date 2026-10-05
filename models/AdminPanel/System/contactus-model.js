const mongoose = require("mongoose");

const contactusSchema = new mongoose.Schema({
    contactusid: { type: Number, required: true },
    fullname: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
});

const ContactUsModel = mongoose.models.ContactUs || mongoose.model("ContactUs", contactusSchema);
const ContactUs = (db) => ContactUsModel;
module.exports = Object.assign(ContactUs, ContactUsModel);
