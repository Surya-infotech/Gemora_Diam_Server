const Tax = require("../../../models/AdminPanel/System/tax-model");
const MiscSetting = require("../../../models/AdminPanel/System/Setting/miscsetting-model");
const Currency = require("../../../models/AdminPanel/System/currency-model");

const get_taxes = async (req, res) => {
    try {
        const TaxModel = Tax(req.db);
        const MiscSettingModel = MiscSetting(req.db);
        const CurrencyModel = Currency(req.db);

        const taxes = await TaxModel.find().sort({ updatedAt: -1 });

        const miscSetting = await MiscSettingModel.findOne();
        let currencyDetails = null;

        if (miscSetting && miscSetting.currencyid) {
            currencyDetails = await CurrencyModel.findOne({ currencyid: miscSetting.currencyid });
        }

        const response = {
            taxes: taxes,
            currency: currencyDetails ? {
                currencyid: currencyDetails.currencyid,
                currency: currencyDetails.currency,
                currencysymbol: currencyDetails.currencysymbol,
                currencyposition: currencyDetails.currencyposition,
                thousandseparator: currencyDetails.thousandseparator,
                decimalseparator: currencyDetails.decimalseparator,
                decimal: currencyDetails.decimal
            } : null
        };

        return res.status(200).json(response);
    } catch (error) {
        console.log("Error fetching taxes:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const get_active_taxes = async (req, res) => {
    try {
        const TaxModel = Tax(req.db);
        const activeTaxes = await TaxModel.find({ status: true }).sort({ updatedAt: -1 });
        return res.status(200).json(activeTaxes);
    } catch (error) {
        console.log("Error fetching active taxes:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const add_tax = async (req, res) => {
    try {
        const { taxname, taxtype, price, taxcomputation, country } = req.body;

        if (!taxname || !taxtype || price == null || !country) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const TaxModel = Tax(req.db);

        const existingTax = await TaxModel.findOne({ taxname });
        if (existingTax) return res.status(400).json({ message: "Tax Name Already Exists" });

        const maxTaxId = await TaxModel.findOne().sort({ taxid: -1 });
        const nextTaxId = maxTaxId ? parseInt(maxTaxId.taxid) + 1 : 1;

        let currencyDetails = null;
        if (country && country.toLowerCase() !== "all") {
            const currencyObj = await Currency(req.db).findOne({
                countryname: { $regex: new RegExp(`^${country.trim()}$`, "i") }
            });
            if (currencyObj) {
                currencyDetails = {
                    currencyid: currencyObj.currencyid,
                    currency: currencyObj.currency,
                    currencysymbol: currencyObj.currencysymbol,
                    currencyposition: currencyObj.currencyposition,
                    thousandseparator: currencyObj.thousandseparator,
                    decimalseparator: currencyObj.decimalseparator,
                    decimal: currencyObj.decimal
                };
            }
        }

        const newTax = new TaxModel({
            taxid: nextTaxId,
            taxname,
            taxtype,
            price,
            taxcomputation: taxcomputation || "exclusive",
            country: country || "",
            currencyid: currencyDetails ? currencyDetails.currencyid : null,
            currency: currencyDetails ? currencyDetails.currency : "",
            currencysymbol: currencyDetails ? currencyDetails.currencysymbol : "",
            currencyposition: currencyDetails ? currencyDetails.currencyposition : "",
            thousandseparator: currencyDetails ? currencyDetails.thousandseparator : "",
            decimalseparator: currencyDetails ? currencyDetails.decimalseparator : "",
            decimal: currencyDetails ? currencyDetails.decimal : null,
            status: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        await newTax.save();
        return res.status(201).json({ message: "Tax added successfully", tax: newTax });
    } catch (error) {
        console.log("Error adding tax:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const edit_tax = async (req, res) => {
    try {
        const { taxId } = req.params;

        if (!taxId) return res.status(400).json({ message: "Tax ID is required" });

        const TaxModel = Tax(req.db);

        let tax = await TaxModel.findOne({ _id: taxId });
        if (!tax) tax = await TaxModel.findOne({ taxid: taxId });
        if (!tax) return res.status(404).json({ message: "Tax not found" });

        return res.status(200).json(tax);
    } catch (error) {
        console.log("Error fetching Tax by ID:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_tax_status = async (req, res) => {
    try {
        const { taxId } = req.params;
        const { status } = req.body;

        if (!taxId) return res.status(400).json({ message: "Tax ID is required" });

        const TaxModel = Tax(req.db);

        let tax = await TaxModel.findOne({ _id: taxId });
        if (!tax) tax = await TaxModel.findOne({ taxid: taxId });
        if (!tax) return res.status(404).json({ message: "Tax not found" });

        tax.status = status;
        tax.updatedAt = new Date().toISOString();
        await tax.save();

        return res.status(200).json(tax);
    } catch (error) {
        console.log("Error updating Tax status:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_tax = async (req, res) => {
    try {
        const { taxId } = req.params;
        const { taxname, taxtype, price, taxcomputation, country, status } = req.body;

        if (!taxId) return res.status(400).json({ message: "Tax ID is required" });
        if (!taxname || !taxtype || price == null || !country) return res.status(400).json({ message: "All fields are required" });

        const TaxModel = Tax(req.db);

        let tax = await TaxModel.findOne({ _id: taxId });
        if (!tax) tax = await TaxModel.findOne({ taxid: taxId });
        if (!tax) return res.status(404).json({ message: "Tax not found" });

        const existingTax = await TaxModel.findOne({
            taxname,
            _id: { $ne: tax._id },
            taxid: { $ne: tax.taxid }
        });

        if (existingTax) return res.status(400).json({ message: "Tax Name Already Exists" });

        let currencyDetails = null;
        if (country && country.toLowerCase() !== "all") {
            const currencyObj = await Currency(req.db).findOne({
                countryname: { $regex: new RegExp(`^${country.trim()}$`, "i") }
            });
            if (currencyObj) {
                currencyDetails = {
                    currencyid: currencyObj.currencyid,
                    currency: currencyObj.currency,
                    currencysymbol: currencyObj.currencysymbol,
                    currencyposition: currencyObj.currencyposition,
                    thousandseparator: currencyObj.thousandseparator,
                    decimalseparator: currencyObj.decimalseparator,
                    decimal: currencyObj.decimal
                };
            }
        }

        tax.taxname = taxname;
        tax.taxtype = taxtype;
        tax.price = price;
        tax.taxcomputation = taxcomputation || "exclusive";
        tax.country = country || "";
        tax.currencyid = currencyDetails ? currencyDetails.currencyid : null;
        tax.currency = currencyDetails ? currencyDetails.currency : "";
        tax.currencysymbol = currencyDetails ? currencyDetails.currencysymbol : "";
        tax.currencyposition = currencyDetails ? currencyDetails.currencyposition : "";
        tax.thousandseparator = currencyDetails ? currencyDetails.thousandseparator : "";
        tax.decimalseparator = currencyDetails ? currencyDetails.decimalseparator : "";
        tax.decimal = currencyDetails ? currencyDetails.decimal : null;
        tax.status = status !== undefined ? status : tax.status;
        tax.updatedAt = new Date().toISOString();

        await tax.save();

        return res.status(200).json(tax);
    } catch (error) {
        console.log("Error updating Tax:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const delete_tax = async (req, res) => {
    try {
        const { taxId } = req.params;

        if (!taxId) return res.status(400).json({ message: "Tax ID is required" });

        const TaxModel = Tax(req.db);

        let tax = await TaxModel.findOne({ _id: taxId });
        if (!tax) tax = await TaxModel.findOne({ taxid: taxId });
        if (!tax) return res.status(404).json({ message: "Tax not found" });

        await TaxModel.deleteOne({ _id: tax._id });
        return res.status(200).json({ message: "Tax deleted successfully" });
    } catch (error) {
        console.log("Error deleting Tax:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = { get_taxes, get_active_taxes, add_tax, edit_tax, update_tax_status, update_tax, delete_tax };
