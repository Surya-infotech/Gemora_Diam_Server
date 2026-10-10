const AboutUs = require("../../../models/AdminPanel/Support/aboutus-model");
const { deleteImageFromS3 } = require("../../../utils/s3Config-admin");

const get_about_us = async (_req, res) => {
    try {
        let aboutUs = await AboutUs.findOne().lean();
        if (!aboutUs) {
            aboutUs = {
                heroEyebrow: "",
                heroTitle: "",
                heroDescription: "",
                commitmentEyebrow: "",
                pillar1Title: "",
                pillar1Description: "",
                pillar2Title: "",
                pillar2Description: "",
                pillar3Title: "",
                pillar3Description: "",
                studioEyebrow: "",
                studioTitle: "",
                studioDescription: "",
                studioImage: "",
                buttonText: "",
                buttonLink: ""
            };
        }
        return res.status(200).json(aboutUs);
    } catch (error) {
        console.error("Error fetching About Us:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const get_active_about_us = async (_req, res) => {
    try {
        const aboutUs = await AboutUs.findOne().lean();
        return res.status(200).json(aboutUs || {});
    } catch (error) {
        console.error("Error fetching active About Us:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_about_us = async (req, res) => {
    try {
        const {
            heroEyebrow,
            heroTitle,
            heroDescription,
            commitmentEyebrow,
            pillar1Title,
            pillar1Description,
            pillar2Title,
            pillar2Description,
            pillar3Title,
            pillar3Description,
            studioEyebrow,
            studioTitle,
            studioDescription,
            buttonText,
            buttonLink
        } = req.body;

        const uploadedImage = req.file ? req.file.location : null;
        const bodyImage = req.body.studioImage ? req.body.studioImage.trim() : (req.body.image ? req.body.image.trim() : "");
        const finalImage = uploadedImage || bodyImage;

        let existing = await AboutUs.findOne();
        const now = new Date().toISOString();

        if (existing) {
            if (uploadedImage && existing.studioImage && existing.studioImage !== uploadedImage) {
                try {
                    await deleteImageFromS3(existing.studioImage, "aboutus");
                } catch (s3Err) {
                    console.warn("Failed to delete old S3 image:", s3Err);
                }
            }

            existing.heroEyebrow = heroEyebrow !== undefined ? heroEyebrow.trim() : existing.heroEyebrow;
            existing.heroTitle = heroTitle !== undefined ? heroTitle.trim() : existing.heroTitle;
            existing.heroDescription = heroDescription !== undefined ? heroDescription.trim() : existing.heroDescription;

            existing.commitmentEyebrow = commitmentEyebrow !== undefined ? commitmentEyebrow.trim() : existing.commitmentEyebrow;
            existing.pillar1Title = pillar1Title !== undefined ? pillar1Title.trim() : existing.pillar1Title;
            existing.pillar1Description = pillar1Description !== undefined ? pillar1Description.trim() : existing.pillar1Description;
            existing.pillar2Title = pillar2Title !== undefined ? pillar2Title.trim() : existing.pillar2Title;
            existing.pillar2Description = pillar2Description !== undefined ? pillar2Description.trim() : existing.pillar2Description;
            existing.pillar3Title = pillar3Title !== undefined ? pillar3Title.trim() : existing.pillar3Title;
            existing.pillar3Description = pillar3Description !== undefined ? pillar3Description.trim() : existing.pillar3Description;

            existing.studioEyebrow = studioEyebrow !== undefined ? studioEyebrow.trim() : existing.studioEyebrow;
            existing.studioTitle = studioTitle !== undefined ? studioTitle.trim() : existing.studioTitle;
            existing.studioDescription = studioDescription !== undefined ? studioDescription.trim() : existing.studioDescription;
            if (finalImage !== undefined && finalImage !== null) {
                existing.studioImage = finalImage;
            }
            existing.buttonText = buttonText !== undefined ? buttonText.trim() : existing.buttonText;
            existing.buttonLink = buttonLink !== undefined ? buttonLink.trim() : existing.buttonLink;
            existing.updatedAt = now;

            await existing.save();
            return res.status(200).json({ message: "About Us updated successfully", aboutUs: existing });
        } else {
            const newAboutUs = new AboutUs({
                heroEyebrow: heroEyebrow ? heroEyebrow.trim() : "",
                heroTitle: heroTitle ? heroTitle.trim() : "",
                heroDescription: heroDescription ? heroDescription.trim() : "",
                commitmentEyebrow: commitmentEyebrow ? commitmentEyebrow.trim() : "",
                pillar1Title: pillar1Title ? pillar1Title.trim() : "",
                pillar1Description: pillar1Description ? pillar1Description.trim() : "",
                pillar2Title: pillar2Title ? pillar2Title.trim() : "",
                pillar2Description: pillar2Description ? pillar2Description.trim() : "",
                pillar3Title: pillar3Title ? pillar3Title.trim() : "",
                pillar3Description: pillar3Description ? pillar3Description.trim() : "",
                studioEyebrow: studioEyebrow ? studioEyebrow.trim() : "",
                studioTitle: studioTitle ? studioTitle.trim() : "",
                studioDescription: studioDescription ? studioDescription.trim() : "",
                studioImage: finalImage || "",
                buttonText: buttonText ? buttonText.trim() : "",
                buttonLink: buttonLink ? buttonLink.trim() : "",
                updatedAt: now
            });

            await newAboutUs.save();
            return res.status(201).json({ message: "About Us added successfully", aboutUs: newAboutUs });
        }
    } catch (error) {
        console.error("Error updating About Us:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    get_about_us,
    get_active_about_us,
    update_about_us
};