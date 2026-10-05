const GeneralSetting = require("../../../../models/AdminPanel/System/Setting/generalsetting-model");

const get_general_setting = async (req, res) => {
    try {
        const GeneralSettingModel = GeneralSetting(req.db);
        let generalSetting = await GeneralSettingModel.findOne();

        if (!generalSetting) {
            generalSetting = await GeneralSettingModel.create({
                softwarename: "Gemora Diam",
                copyright: "© 2026 Gemora Diam. All rights reserved.",
                maintainedby: "Gemora Diam",
                version: "1.0.0",
                phone: "+919876543210",
                email: "info@gemoradiam.com",
                countryname: "India",
                statename: "Gujarat",
                cityname: "Surat",
                postalcode: "395006",
                address: "Mini Bazar, Varachha, Surat",
                description: "Gemora Diam - Premium Certified Lab-Grown & Natural Diamonds Management Panel."
            });
        }

        return res.status(200).json(generalSetting);
    } catch (error) {
        console.log("Error retrieving general setting:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const get_general_setting_for_landingpage = async (req, res) => {
    try {
        const GeneralSettingModel = GeneralSetting(req.db);
        const generalSetting = await GeneralSettingModel.findOne();

        if (!generalSetting) {
            return res.status(404).json({ message: "General setting not found" });
        }

        return res.status(200).json({ generalSetting });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
};

const update_general_setting = async (req, res) => {
    try {
        const { softwarename, copyright, maintainedby, version, address, cityname, statename, countryname, postalcode, description, phone, email } = req.body;
        const GeneralSettingModel = GeneralSetting(req.db);

        let generalSetting = await GeneralSettingModel.findOne();

        if (generalSetting) {
            const updateData = {};
            if (softwarename !== undefined) updateData.softwarename = softwarename;
            if (copyright !== undefined) updateData.copyright = copyright;
            if (maintainedby !== undefined) updateData.maintainedby = maintainedby;
            if (version !== undefined) updateData.version = version;
            if (address !== undefined) updateData.address = address;
            if (cityname !== undefined) updateData.cityname = cityname;
            if (statename !== undefined) updateData.statename = statename;
            if (countryname !== undefined) updateData.countryname = countryname;
            if (postalcode !== undefined) updateData.postalcode = postalcode;
            if (description !== undefined) updateData.description = description;
            if (phone !== undefined) updateData.phone = phone;
            if (email !== undefined) updateData.email = email;

            generalSetting = await GeneralSettingModel.findOneAndUpdate(
                { _id: generalSetting._id },
                updateData,
                { new: true }
            );
        } else {
            generalSetting = new GeneralSettingModel({
                softwarename, copyright, maintainedby, version, address, cityname, statename, countryname, postalcode, description, phone, email
            });
            await generalSetting.save();
        }

        return res.status(200).json(generalSetting);
    } catch (error) {
        console.log("Error updating general setting:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = { get_general_setting, get_general_setting_for_landingpage, update_general_setting };
