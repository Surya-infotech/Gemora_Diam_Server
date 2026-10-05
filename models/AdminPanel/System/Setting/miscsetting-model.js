const mongoose = require("mongoose");

const miscsettingSchema = new mongoose.Schema({
    currencyid: { type: Number, required: true },
    timeZone: { type: String, required: true },
    dateFormat: { type: String, required: true },
    timeFormat: { type: String, required: true },
    defaultlanguage: { type: String, required: true },
    yearlydiscount: { type: String, default: "" },
    yearlydiscounttype: { type: String, default: "percentage" }
});

const MiscSettingModel = mongoose.models.MiscSetting || mongoose.model("MiscSetting", miscsettingSchema);
const MiscSetting = (db) => MiscSettingModel;
module.exports = Object.assign(MiscSetting, MiscSettingModel);
