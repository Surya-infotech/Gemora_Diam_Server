const Currency = require("../../../models/AdminPanel/System/currency-model");
const mongoose = require("mongoose");

const get_currency_with_statustrue = async (req, res) => {
    try {
        const currency = await Currency.find({ status: true }).sort({ countryname: 1 });
        return res.status(200).json(currency);
    } catch (error) {
        console.log("Error fetching currency:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const get_currency = async (req, res) => {
    try {
        const currency = await Currency.find().sort({ currencyid: 1 });
        return res.status(200).json(currency);
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};

const addCurrency = async (req, res) => {
    const { countryname, currencyName, currencySymbol, currencyPosition, decimalValue, thousandSeparator, decimalSeparator } = req.body;
    try {
        if (!countryname || !currencyName || !currencySymbol || !currencyPosition || decimalValue === undefined || !thousandSeparator || !decimalSeparator) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existingCurrency = await Currency.findOne({
            countryname: { $regex: new RegExp(`^${countryname.trim()}$`, "i") }
        });
        if (existingCurrency) {
            return res.status(409).json({ message: "Country Name Already Exists" });
        }

        const maxCurrencyId = await Currency.findOne().sort({ currencyid: -1 });
        const nextCurrencyId = maxCurrencyId ? parseInt(maxCurrencyId.currencyid) + 1 : 1;

        const newCurrency = new Currency({
            currencyid: nextCurrencyId,
            countryname: countryname.trim(),
            currency: currencyName.trim(),
            currencysymbol: currencySymbol.trim(),
            currencyposition: currencyPosition,
            decimal: Number(decimalValue),
            thousandseparator: thousandSeparator,
            decimalseparator: decimalSeparator,
            status: true
        });

        await newCurrency.save();
        return res.status(201).json(newCurrency);
    } catch (error) {
        console.error("Error adding Currency:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const edit_currency = async (req, res) => {
    const { currencyid } = req.params;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(currencyid);
        const query = isObjectId ? { _id: currencyid } : { currencyid: Number(currencyid) };
        const currency = await Currency.findOne(query);

        if (!currency) return res.status(404).json({ message: "Currency not found" });
        return res.status(200).json(currency);
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};

const updateCurrency_status = async (req, res) => {
    const { currencyid } = req.params;
    const { status } = req.body;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(currencyid);
        const query = isObjectId ? { _id: currencyid } : { currencyid: Number(currencyid) };
        const updated = await Currency.findOneAndUpdate(query, { status }, { returnDocument: 'after' });

        if (!updated) return res.status(404).json({ message: "Currency not found" });
        return res.status(200).json(updated);
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};

const updateCurrency = async (req, res) => {
    const { currencyid } = req.params;
    const { countryname, currencyName, currencySymbol, status, currencyPosition, decimalValue, thousandSeparator, decimalSeparator } = req.body;

    try {
        if (!countryname || !currencyName || !currencySymbol || !currencyPosition || decimalValue === undefined || !thousandSeparator || !decimalSeparator) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const isObjectId = mongoose.Types.ObjectId.isValid(currencyid);
        const selfQuery = isObjectId ? { _id: currencyid } : { currencyid: Number(currencyid) };
        const existingSelf = await Currency.findOne(selfQuery);
        if (!existingSelf) return res.status(404).json({ message: "Currency not found" });

        const duplicateCheck = await Currency.findOne({
            countryname: { $regex: new RegExp(`^${countryname.trim()}$`, "i") },
            _id: { $ne: existingSelf._id }
        });
        if (duplicateCheck) {
            return res.status(409).json({ message: "Country Name Already Exists" });
        }

        const updateData = {
            countryname: countryname.trim(),
            currency: currencyName.trim(),
            currencysymbol: currencySymbol.trim(),
            currencyposition: currencyPosition,
            thousandseparator: thousandSeparator,
            decimalseparator: decimalSeparator,
            decimal: Number(decimalValue)
        };
        if (status !== undefined) updateData.status = status;

        const updated = await Currency.findByIdAndUpdate(existingSelf._id, updateData, { returnDocument: 'after' });
        return res.status(200).json(updated);
    } catch (error) {
        console.error("Error updating Currency:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const deletecurrency = async (req, res) => {
    const { currencyid } = req.params;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(currencyid);
        const query = isObjectId ? { _id: currencyid } : { currencyid: Number(currencyid) };
        const currency = await Currency.findOne(query);

        if (!currency) return res.status(404).json({ message: "Currency not found" });

        await Currency.deleteOne({ _id: currency._id });
        return res.status(200).json({ message: "Currency deleted successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    get_currency_with_statustrue,
    get_currency,
    addCurrency,
    edit_currency,
    updateCurrency_status,
    updateCurrency,
    deletecurrency
};