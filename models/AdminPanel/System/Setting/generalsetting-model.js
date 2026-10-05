const mongoose = require("mongoose");

const generalsettingSchema = new mongoose.Schema({
    softwarename: { type: String, required: true },
    copyright: { type: String, required: true },
    maintainedby: { type: String, required: true },
    version: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, default: "" },
    cityname: { type: String, default: "" },
    statename: { type: String, default: "" },
    countryname: { type: String, default: "" },
    postalcode: { type: String, default: "" },
    description: { type: String, default: "" }
});

const GeneralSettingModel = mongoose.model("GeneralSetting", generalsettingSchema);

module.exports = GeneralSettingModel;
