const MiscSetting = require("../../../../models/AdminPanel/System/Setting/miscsetting-model");

const get_misc_setting = async (req, res) => {
    try {
        const MiscSettingModel = MiscSetting(req.db);
        let miscSetting = await MiscSettingModel.findOne();

        if (!miscSetting) {
            miscSetting = await MiscSettingModel.create({
                currencyid: 1,
                timeZone: "Asia/Kolkata",
                dateFormat: "DD/MM/YYYY",
                timeFormat: "hh:mm A",
                defaultlanguage: "English",
                yearlydiscount: "10",
                yearlydiscounttype: "percentage"
            });
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
        const MiscSettingModel = MiscSetting(req.db);

        let miscSetting = await MiscSettingModel.findOne();

        if (miscSetting) {
            const updateData = {};
            if (currencyid !== undefined) updateData.currencyid = currencyid;
            if (timeZone !== undefined) updateData.timeZone = timeZone;
            if (dateFormat !== undefined) updateData.dateFormat = dateFormat;
            if (timeFormat !== undefined) updateData.timeFormat = timeFormat;
            if (defaultlanguage !== undefined) updateData.defaultlanguage = defaultlanguage;
            if (yearlydiscount !== undefined) updateData.yearlydiscount = yearlydiscount;
            if (yearlydiscounttype !== undefined) updateData.yearlydiscounttype = yearlydiscounttype;

            miscSetting = await MiscSettingModel.findOneAndUpdate(
                { _id: miscSetting._id },
                updateData,
                { new: true }
            );
        } else {
            miscSetting = new MiscSettingModel({
                currencyid, timeZone, dateFormat, timeFormat, defaultlanguage,
                yearlydiscount: yearlydiscount || "",
                yearlydiscounttype: yearlydiscounttype || "percentage"
            });
            await miscSetting.save();
        }

        return res.status(200).json(miscSetting);
    } catch (error) {
        console.log("Error updating misc setting:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = { get_misc_setting, update_misc_setting };
