const SocialMedia = require("../../../../models/AdminPanel/System/Setting/socialmedia-model");

const get_social_media = async (req, res) => {
    try {
        const socialMedia = await SocialMedia.findOne();

        if (!socialMedia) {
            return res.status(404).json({ message: "Social media setting not found" });
        }

        return res.status(200).json(socialMedia);
    } catch (error) {
        console.log("Error retrieving social media setting:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_social_media = async (req, res) => {
    try {
        const { socialmedia } = req.body;

        if (!socialmedia || !Array.isArray(socialmedia)) {
            return res.status(400).json({ message: "Social media array is required" });
        }

        // Validate each social media entry
        for (const item of socialmedia) {
            if (!item.platform || !item.url) {
                return res.status(400).json({ message: "Each social media entry must have platform and url" });
            }
        }

        let socialMediaSetting = await SocialMedia.findOne();

        if (socialMediaSetting) {
            // Update existing setting
            socialMediaSetting = await SocialMedia.findOneAndUpdate(
                { _id: socialMediaSetting._id },
                { socialmedia },
                { new: true }
            );
        } else {
            // Create new setting if none exists
            socialMediaSetting = new SocialMedia({
                socialmedia
            });

            await socialMediaSetting.save();
        }

        if (!socialMediaSetting) {
            return res.status(404).json({ message: "Social media setting not found" });
        }

        return res.status(200).json(socialMediaSetting);
    } catch (error) {
        console.log("Error updating social media setting:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = { get_social_media, update_social_media };
