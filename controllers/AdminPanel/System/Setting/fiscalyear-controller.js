const FiscalYear = require("../../../../models/AdminPanel/System/Setting/fiscalyear-model");

const check_current_fiscalyear = async (_req, res) => {
    try {
        const today = new Date().toISOString().split("T")[0];

        let foundFiscalYear = await FiscalYear.findOne({
            startdate: { $lte: today },
            enddate: { $gte: today }
        });

        if (!foundFiscalYear) {
            const count = await FiscalYear.countDocuments();
            if (count === 0) {
                const currentYear = new Date().getFullYear();
                foundFiscalYear = await FiscalYear.create({
                    fiscalyearid: 1,
                    fiscalyear: `${currentYear}-${currentYear + 1}`,
                    startdate: `${currentYear}-04-01`,
                    enddate: `${currentYear + 1}-03-31`,
                    status: "Active",
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }
        }

        return res.status(200).json({
            message: "Fiscal year status retrieved.",
            fiscalYear: foundFiscalYear || null,
            isActive: !!foundFiscalYear,
            suggestedNewFiscalYear: null
        });
    } catch (error) {
        console.log("Error checking fiscal year:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const get_fiscalyear = async (_req, res) => {
    try {
        let fiscalyear = await FiscalYear.find().sort({ fiscalyearid: -1 });

        if (!fiscalyear || fiscalyear.length === 0) {
            const currentYear = new Date().getFullYear();
            const initial = await FiscalYear.create({
                fiscalyearid: 1,
                fiscalyear: `${currentYear}-${currentYear + 1}`,
                startdate: `${currentYear}-04-01`,
                enddate: `${currentYear + 1}-03-31`,
                status: "Active",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            fiscalyear = [initial];
        }

        return res.status(200).json(fiscalyear);
    } catch (error) {
        console.log("Error retrieving fiscal year:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const add_fiscalyear = async (req, res) => {
    try {
        const { fiscalyear, startdate, enddate } = req.body;
        if (!fiscalyear || !startdate || !enddate) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const maxItem = await FiscalYear.findOne().sort({ fiscalyearid: -1 });
        const nextId = maxItem ? maxItem.fiscalyearid + 1 : 1;

        const newFiscalYear = new FiscalYear({
            fiscalyearid: nextId,
            fiscalyear,
            startdate,
            enddate,
            status: "Active",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        await newFiscalYear.save();
        return res.status(201).json(newFiscalYear);
    } catch (error) {
        console.log("Error adding fiscal year:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const edit_fiscalyear = async (req, res) => {
    const { fiscalyearId } = req.params;
    try {
        const fiscalyear = await FiscalYear.findById(fiscalyearId);
        if (!fiscalyear) return res.status(404).json({ message: "Fiscal year not found" });
        return res.status(200).json(fiscalyear);
    } catch (error) {
        console.error("Error editing fiscal year:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_fiscalyear = async (req, res) => {
    const { fiscalyearId } = req.params;
    const { fiscalyear, startdate, enddate, status } = req.body;
    try {
        const updated = await FiscalYear.findByIdAndUpdate(
            fiscalyearId,
            { fiscalyear, startdate, enddate, status, updatedAt: new Date().toISOString() },
            { returnDocument: 'after' }
        );
        if (!updated) return res.status(404).json({ message: "Fiscal year not found" });
        return res.status(200).json(updated);
    } catch (error) {
        console.error("Error updating fiscal year:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const delete_fiscalyear = async (req, res) => {
    const { fiscalyearId } = req.params;
    try {
        await FiscalYear.findByIdAndDelete(fiscalyearId);
        return res.status(200).json({ message: "Fiscal year deleted successfully" });
    } catch (error) {
        console.error("Error deleting fiscal year:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    check_current_fiscalyear,
    get_fiscalyear,
    add_fiscalyear,
    edit_fiscalyear,
    update_fiscalyear,
    delete_fiscalyear
};
