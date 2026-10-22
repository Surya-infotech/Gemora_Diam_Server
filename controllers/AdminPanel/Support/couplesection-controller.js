const CoupleSection = require("../../../models/AdminPanel/Support/couplesection-model");

const get_couple_section = async (_req, res) => {
    try {
        let section = await CoupleSection.findOne({ sectionid: 1 });
        if (!section) {
            const now = new Date().toISOString();
            section = new CoupleSection({
                sectionid: 1,
                headerEyebrow: "",
                headerTitle: "",
                headerDescription: "",
                ratingScore: "",
                reviewCountText: "",
                stories: [],
                reviews: [],
                status: true,
                createdAt: now,
                updatedAt: now
            });
            await section.save();
        }
        return res.status(200).json(section);
    } catch (error) {
        console.error("Error getting couple section:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const get_active_couple_section = async (_req, res) => {
    try {
        let section = await CoupleSection.findOne({ sectionid: 1 });
        if (!section) {
            return res.status(200).json({
                headerEyebrow: "",
                headerTitle: "",
                headerDescription: "",
                ratingScore: "",
                reviewCountText: "",
                stories: [],
                reviews: [],
                status: true
            });
        }

        if (!section.status) {
            return res.status(200).json({ status: false, stories: [], reviews: [] });
        }

        const activeStories = (section.stories || [])
            .filter(item => item.status !== false)
            .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

        const activeReviews = (section.reviews || [])
            .filter(item => item.status !== false)
            .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

        return res.status(200).json({
            ...section.toObject(),
            stories: activeStories,
            reviews: activeReviews
        });
    } catch (error) {
        console.error("Error getting active couple section:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_couple_section = async (req, res) => {
    try {
        const {
            headerEyebrow,
            headerTitle,
            headerDescription,
            ratingScore,
            reviewCountText,
            stories,
            reviews,
            status
        } = req.body;

        const now = new Date().toISOString();
        let section = await CoupleSection.findOne({ sectionid: 1 });

        if (!section) {
            section = new CoupleSection({
                sectionid: 1,
                createdAt: now,
                updatedAt: now
            });
        }

        if (headerEyebrow !== undefined) section.headerEyebrow = headerEyebrow.trim ? headerEyebrow.trim() : headerEyebrow;
        if (headerTitle !== undefined) section.headerTitle = headerTitle.trim ? headerTitle.trim() : headerTitle;
        if (headerDescription !== undefined) section.headerDescription = headerDescription.trim ? headerDescription.trim() : headerDescription;
        if (ratingScore !== undefined) section.ratingScore = ratingScore.trim ? ratingScore.trim() : ratingScore;
        if (reviewCountText !== undefined) section.reviewCountText = reviewCountText.trim ? reviewCountText.trim() : reviewCountText;
        if (stories !== undefined) section.stories = stories;
        if (reviews !== undefined) section.reviews = reviews;
        if (status !== undefined) section.status = status === true || status === "true" || status === 1 || status === "1";
        section.updatedAt = now;

        await section.save();
        return res.status(200).json({ message: "Couple section updated successfully", section });
    } catch (error) {
        console.error("Error updating couple section:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const upload_couple_asset = async (req, res) => {
    try {
        if (!req.file || !req.file.location) {
            return res.status(400).json({ message: "No file uploaded to S3" });
        }
        return res.status(200).json({
            message: "File uploaded successfully",
            url: req.file.location
        });
    } catch (error) {
        console.error("Error uploading couple asset:", error);
        return res.status(500).json({ message: "Upload failed" });
    }
};

module.exports = {
    get_couple_section,
    get_active_couple_section,
    update_couple_section,
    upload_couple_asset
};