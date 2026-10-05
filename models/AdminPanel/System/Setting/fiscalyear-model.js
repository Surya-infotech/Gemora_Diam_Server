const mongoose = require("mongoose");

const fiscalyearSchema = new mongoose.Schema({
    fiscalyearid: { type: Number, required: true },
    fiscalyear: { type: String, required: true },
    startdate: { type: String, required: true },
    enddate: { type: String, required: true },
    status: { type: String, required: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
});

const FiscalYearModel = mongoose.models.FiscalYear || mongoose.model("FiscalYear", fiscalyearSchema);
const FiscalYear = (db) => FiscalYearModel;
module.exports = Object.assign(FiscalYear, FiscalYearModel);
