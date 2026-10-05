const mongoose = require("mongoose");

const currencySchema = new mongoose.Schema({
    currencyid: { type: Number, required: true },
    countryname: { type: String, required: true },
    currency: { type: String, required: true },
    currencysymbol: { type: String, required: true },
    currencyposition: { type: String, required: true },
    thousandseparator: { type: String, required: true },
    decimalseparator: { type: String, required: true },
    decimal: { type: Number, required: true },
    status: { type: Boolean, default: true }
});

const CurrencyModel = mongoose.model("Currency", currencySchema);

module.exports = CurrencyModel;
