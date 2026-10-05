const mongoose = require("mongoose");

const helpcenterSchema = new mongoose.Schema({
    ticketid: { type: Number, required: true },
    ownerid: { type: Number, required: false },
    adminid: { type: mongoose.Schema.Types.Mixed, required: false },
    customerid: { type: Number, required: false },
    employeeid: { type: Number, required: false },
    username: { type: String, required: true },
    usertype: { type: String, required: true, enum: ['admin', 'owner', 'employee', 'customer'] },
    issuename: { type: String, required: true },
    description: { type: String, required: true },
    messsages: [
        {
            usertype: { type: String, required: true, enum: ['admin', 'owner', 'employee', 'customer'] },
            username: { type: String, required: true },
            message: { type: String, required: true },
            images: [{ imageUrl: { type: String, required: true } }],
            createdAt: { type: String, required: true }
        }
    ],
    resolvedby: { type: String, default: "" },
    status: { type: String, required: true, enum: ['Pending', 'Open', 'Resolved'], default: 'Pending' },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
});

const HelpCenterModel = mongoose.models.HelpCenter || mongoose.model("HelpCenter", helpcenterSchema);
const HelpCenter = (db) => HelpCenterModel;
module.exports = Object.assign(HelpCenter, HelpCenterModel);
