const GeneralSetting = require("../../../../models/AdminPanel/System/Setting/generalsetting-model");
const SocialMedia = require("../../../../models/AdminPanel/System/Setting/socialmedia-model");

const get_general_setting = async (req, res) => {
    try {
        const generalSetting = await GeneralSetting.findOne();

        if (!generalSetting) {
            return res.status(404).json({ message: "General setting not found" });
        }

        return res.status(200).json(generalSetting);
    } catch (error) {
        console.log("Error retrieving general setting:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const get_general_setting_for_landingpage = async (req, res) => {
    try {
        const generalSetting = await GeneralSetting.findOne();
        const socialMedia = await SocialMedia.findOne();

        if (!generalSetting) {
            return res.status(404).json({ message: "General setting not found" });
        }

        const response = {
            generalSetting: generalSetting,
            socialMedia: socialMedia ? socialMedia.socialmedia : []
        };
        return res.status(200).json(response);
    } catch (error) {
        console.log("Error retrieving general setting for landing page:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_general_setting = async (req, res) => {
    try {
        const { softwarename, copyright, maintainedby, version, address, cityname, statename, countryname, postalcode, description, phone, email } = req.body;

        let generalSetting = await GeneralSetting.findOne();

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

            generalSetting = await GeneralSetting.findOneAndUpdate(
                { _id: generalSetting._id },
                updateData,
                { returnDocument: 'after' }
            );
        } else {
            // Create new setting if none exists
            if (!softwarename || !copyright || !maintainedby || !version || !phone || !email) {
                return res.status(400).json({ message: "Software name, copyright, maintained by, version, phone, and email are required" });
            }

            generalSetting = new GeneralSetting({
                softwarename,
                copyright,
                maintainedby,
                version,
                address,
                cityname,
                statename,
                countryname,
                postalcode,
                description,
                phone,
                email
            });

            await generalSetting.save();
        }

        if (!generalSetting) {
            return res.status(404).json({ message: "General setting not found" });
        }

        return res.status(200).json(generalSetting);
    } catch (error) {
        console.log("Error updating general setting:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = { get_general_setting, get_general_setting_for_landingpage, update_general_setting };