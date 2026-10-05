const mongoose = require("mongoose");

const generalsettingSchema = new mongoose.Schema({
    softwarename: { type: String, required: true },
    copyright: { type: String, required: true },
    maintainedby: { type: String, required: true },
    version: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    cityname: { type: String, required: true },
    statename: { type: String, required: true },
    countryname: { type: String, required: true },
    postalcode: { type: String, required: true },
    description: { type: String, required: true }
});

const GeneralSettingModel = mongoose.models.GeneralSetting || mongoose.model("GeneralSetting", generalsettingSchema);
const GeneralSetting = (db) => GeneralSettingModel;
module.exports = Object.assign(GeneralSetting, GeneralSettingModel);
