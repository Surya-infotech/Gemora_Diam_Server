const mongoose = require("mongoose");

const invoicesettingSchema = new mongoose.Schema({
    invoiceprefix: { type: String, required: true },
    notes: { type: String, required: true }
});

const InvoiceSettingModel = mongoose.model("InvoiceSetting", invoicesettingSchema);

module.exports = InvoiceSettingModel;
