const SocialMedia = require("../../../../models/AdminPanel/System/Setting/socialmedia-model");

const get_social_media = async (req, res) => {
    try {
        const SocialMediaModel = SocialMedia(req.db);
        let socialMedia = await SocialMediaModel.findOne();

        if (!socialMedia) {
            socialMedia = await SocialMediaModel.create({
                socialmedia: [
                    { platform: "Facebook", url: "https://facebook.com/gemoradiam" },
                    { platform: "Instagram", url: "https://instagram.com/gemoradiam" },
                    { platform: "LinkedIn", url: "https://linkedin.com/company/gemoradiam" },
                    { platform: "Twitter", url: "https://twitter.com/gemoradiam" }
                ]
            });
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

        const SocialMediaModel = SocialMedia(req.db);
        let socialMediaSetting = await SocialMediaModel.findOne();

        if (socialMediaSetting) {
            socialMediaSetting = await SocialMediaModel.findOneAndUpdate(
                { _id: socialMediaSetting._id },
                { socialmedia },
                { new: true }
            );
        } else {
            socialMediaSetting = new SocialMediaModel({ socialmedia });
            await socialMediaSetting.save();
        }

        return res.status(200).json(socialMediaSetting);
    } catch (error) {
        console.log("Error updating social media setting:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = { get_social_media, update_social_media };
