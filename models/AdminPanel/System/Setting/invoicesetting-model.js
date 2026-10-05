const mongoose = require("mongoose");

const invoicesettingSchema = new mongoose.Schema({
    invoiceprefix: { type: String, required: true },
    notes: { type: String, required: true }
});

const InvoiceSettingModel = mongoose.models.InvoiceSetting || mongoose.model("InvoiceSetting", invoicesettingSchema);
const InvoiceSetting = (db) => InvoiceSettingModel;
module.exports = Object.assign(InvoiceSetting, InvoiceSettingModel);
