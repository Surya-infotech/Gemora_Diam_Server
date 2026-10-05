const mongoose = require("mongoose");

const taxSchema = new mongoose.Schema({
    taxid: { type: Number, required: true },
    taxname: { type: String, required: true },
    taxtype: { type: String, enum: ["fixed", "percentage"], required: true },
    taxcomputation: { type: String, enum: ["inclusive", "exclusive"], default: "exclusive" },
    price: { type: Number, required: true },
    country: { type: String, required: true },
    currencyid: { type: Number, required: false },
    currency: { type: String, required: false },
    currencysymbol: { type: String, required: false },
    currencyposition: { type: String, required: false },
    thousandseparator: { type: String, required: false },
    decimalseparator: { type: String, required: false },
    decimal: { type: Number, required: false },
    status: { type: Boolean, required: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
});

const TaxModel = mongoose.models.Tax || mongoose.model("Tax", taxSchema);
const Tax = (db) => TaxModel;
module.exports = Object.assign(Tax, TaxModel);
