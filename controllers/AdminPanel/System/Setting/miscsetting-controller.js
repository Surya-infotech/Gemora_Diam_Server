const MiscSetting = require("../../../../models/AdminPanel/System/Setting/miscsetting-model");

const get_misc_setting = async (req, res) => {
    try {
        const miscSetting = await MiscSetting.findOne();

        if (!miscSetting) {
            return res.status(404).json({ message: "Misc setting not found" });
        }

        return res.status(200).json(miscSetting);
    } catch (error) {
        console.log("Error retrieving misc setting:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_misc_setting = async (req, res) => {
    try {
        const { currencyid, timeZone, dateFormat, timeFormat, defaultlanguage, yearlydiscount, yearlydiscounttype } = req.body;

        // Find existing misc setting or create new one
        let miscSetting = await MiscSetting.findOne();

        if (miscSetting) {
            // Update existing setting
            const updateData = {};
            if (currencyid !== undefined) updateData.currencyid = currencyid;
            if (timeZone !== undefined) updateData.timeZone = timeZone;
            if (dateFormat !== undefined) updateData.dateFormat = dateFormat;
            if (timeFormat !== undefined) updateData.timeFormat = timeFormat;
            if (defaultlanguage !== undefined) updateData.defaultlanguage = defaultlanguage;
            if (yearlydiscount !== undefined) updateData.yearlydiscount = yearlydiscount;
            if (yearlydiscounttype !== undefined) updateData.yearlydiscounttype = yearlydiscounttype;

            miscSetting = await MiscSetting.findOneAndUpdate(
                { _id: miscSetting._id },
                updateData,
                { new: true }
            );
        } else {
            // Create new setting if none exists
            if (!currencyid || !timeZone || !dateFormat || !timeFormat || !defaultlanguage) {
                return res.status(400).json({ message: "All fields are required" });
            }

            miscSetting = new MiscSetting({
                currencyid,
                timeZone,
                dateFormat,
                timeFormat,
                defaultlanguage,
                yearlydiscount: yearlydiscount || "",
                yearlydiscounttype: yearlydiscounttype || "percentage"
            });

            await miscSetting.save();
        }

        if (!miscSetting) {
            return res.status(404).json({ message: "Misc setting not found" });
        }

        return res.status(200).json(miscSetting);
    } catch (error) {
        console.log("Error updating misc setting:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = { get_misc_setting, update_misc_setting };
