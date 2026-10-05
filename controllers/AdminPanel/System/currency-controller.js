const Currency = require("../../../models/AdminPanel/System/currency-model");

const DEFAULT_CURRENCIES = [
    { currencyid: 1, countryname: "India", currency: "INR", currencysymbol: "₹", currencyposition: "before", thousandseparator: ",", decimalseparator: ".", decimal: 2, status: true },
    { currencyid: 2, countryname: "United States", currency: "USD", currencysymbol: "$", currencyposition: "before", thousandseparator: ",", decimalseparator: ".", decimal: 2, status: true },
    { currencyid: 3, countryname: "European Union", currency: "EUR", currencysymbol: "€", currencyposition: "before", thousandseparator: ".", decimalseparator: ",", decimal: 2, status: true },
    { currencyid: 4, countryname: "United Kingdom", currency: "GBP", currencysymbol: "£", currencyposition: "before", thousandseparator: ",", decimalseparator: ".", decimal: 2, status: true },
    { currencyid: 5, countryname: "United Arab Emirates", currency: "AED", currencysymbol: "AED", currencyposition: "after", thousandseparator: ",", decimalseparator: ".", decimal: 2, status: true }
];

const get_currency_with_statustrue = async (req, res) => {
    try {
        const CurrencyModel = Currency(req.db);
        let currency = await CurrencyModel.find({ status: true }).sort({ countryname: 1 });
        if (!currency || currency.length === 0) {
            await CurrencyModel.insertMany(DEFAULT_CURRENCIES);
            currency = await CurrencyModel.find({ status: true }).sort({ countryname: 1 });
        }
        return res.status(200).json(currency);
    } catch (error) {
        console.log("Error fetching currency:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const get_currency = async (req, res) => {
    try {
        const CurrencyModel = Currency(req.db);
        const currency = await CurrencyModel.find();
        return res.status(200).json(currency);
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};

const addCurrency = async (req, res) => {
    const { countryname, currencyName, currencySymbol, currencyPosition, decimalValue, thousandSeparator, decimalSeparator } = req.body;
    try {
        const CurrencyModel = Currency(req.db);
        const maxCurrencyId = await CurrencyModel.findOne().sort({ currencyid: -1 });
        const nextCurrencyId = maxCurrencyId ? parseInt(maxCurrencyId.currencyid) + 1 : 1;

        const newCurrency = new CurrencyModel({
            currencyid: nextCurrencyId,
            countryname,
            currency: currencyName,
            currencysymbol: currencySymbol,
            currencyposition: currencyPosition,
            decimal: decimalValue,
            thousandseparator: thousandSeparator,
            decimalseparator: decimalSeparator,
            status: true
        });

        await newCurrency.save();
        return res.status(201).json(newCurrency);
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};

const edit_currency = async (req, res) => {
    const { currencyid } = req.params;
    try {
        const CurrencyModel = Currency(req.db);
        const currency = await CurrencyModel.findById(currencyid);
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
        const CurrencyModel = Currency(req.db);
        const updated = await CurrencyModel.findByIdAndUpdate(currencyid, { status }, { new: true });
        return res.status(200).json(updated);
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};

const updateCurrency = async (req, res) => {
    const { currencyid } = req.params;
    try {
        const CurrencyModel = Currency(req.db);
        const updated = await CurrencyModel.findByIdAndUpdate(currencyid, req.body, { new: true });
        return res.status(200).json(updated);
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};

const deletecurrency = async (req, res) => {
    const { currencyid } = req.params;
    try {
        const CurrencyModel = Currency(req.db);
        await CurrencyModel.findByIdAndDelete(currencyid);
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
