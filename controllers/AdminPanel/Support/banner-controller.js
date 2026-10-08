const Banner = require("../../../models/AdminPanel/Support/banner-model");
const mongoose = require("mongoose");
const { deleteImageFromS3 } = require("../../../utils/s3Config-admin");

const get_banners = async (_req, res) => {
    try {
        const banners = await Banner.find().sort({ order: 1, bannerid: 1 }).lean();
        return res.status(200).json({ banners });
    } catch (error) {
        console.error("Error fetching banners:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const get_active_banners = async (_req, res) => {
    try {
        const banners = await Banner.find({ status: true }).sort({ order: 1, bannerid: 1 }).lean();
        return res.status(200).json(banners);
    } catch (error) {
        console.error("Error fetching active banners:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const add_banner = async (req, res) => {
    try {
        const {
            tag,
            title,
            headingLine1,
            headingLine2,
            description,
            buttonText,
            buttonLink,
            secondaryButtonText,
            secondaryButtonLink,
            order
        } = req.body;

        const imageUrl = req.file ? req.file.location : (req.body.image ? req.body.image.trim() : "");

        if (!imageUrl) {
            return res.status(400).json({ message: "Banner image is required" });
        }

        const maxItem = await Banner.findOne().sort({ bannerid: -1 });
        const nextId = maxItem ? parseInt(maxItem.bannerid) + 1 : 1;

        const now = new Date().toISOString();
        const newBanner = new Banner({
            bannerid: nextId,
            tag: tag ? tag.trim() : "",
            title: title ? title.trim() : `${headingLine1 || ''} ${headingLine2 || ''}`.trim(),
            headingLine1: headingLine1 ? headingLine1.trim() : (title ? title.trim() : ""),
            headingLine2: headingLine2 ? headingLine2.trim() : "",
            description: description ? description.trim() : "",
            image: imageUrl,
            buttonText: buttonText ? buttonText.trim() : "",
            buttonLink: buttonLink ? buttonLink.trim() : "",
            secondaryButtonText: secondaryButtonText ? secondaryButtonText.trim() : "",
            secondaryButtonLink: secondaryButtonLink ? secondaryButtonLink.trim() : "",
            order: order !== undefined && order !== "" ? Number(order) : nextId,
            status: true,
            createdAt: now,
            updatedAt: now
        });

        await newBanner.save();
        return res.status(201).json({ message: "Banner added successfully", banner: newBanner });
    } catch (error) {
        console.error("Error adding banner:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const edit_banner = async (req, res) => {
    const { bannerid } = req.params;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(bannerid);
        const query = isObjectId ? { _id: bannerid } : { bannerid: Number(bannerid) };
        const banner = await Banner.findOne(query);

        if (!banner) {
            return res.status(404).json({ message: "Banner not found" });
        }
        return res.status(200).json(banner);
    } catch (error) {
        console.error("Error fetching banner details:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_banner = async (req, res) => {
    const { bannerid } = req.params;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(bannerid);
        const query = isObjectId ? { _id: bannerid } : { bannerid: Number(bannerid) };
        const existing = await Banner.findOne(query);

        if (!existing) {
            return res.status(404).json({ message: "Banner not found" });
        }

        const {
            tag,
            title,
            headingLine1,
            headingLine2,
            description,
            buttonText,
            buttonLink,
            secondaryButtonText,
            secondaryButtonLink,
            order,
            status
        } = req.body;

        if (req.file) {
            if (existing.image && existing.image.includes("amazonaws.com")) {
                await deleteImageFromS3(existing.image, "banners");
            }
            existing.image = req.file.location;
        } else if (req.body.image && req.body.image.trim()) {
            existing.image = req.body.image.trim();
        }

        if (tag !== undefined) existing.tag = tag.trim();
        if (title !== undefined) existing.title = title.trim();
        if (headingLine1 !== undefined) existing.headingLine1 = headingLine1.trim();
        if (headingLine2 !== undefined) existing.headingLine2 = headingLine2.trim();
        if (description !== undefined) existing.description = description.trim();
        if (buttonText !== undefined) existing.buttonText = buttonText.trim();
        if (buttonLink !== undefined) existing.buttonLink = buttonLink.trim();
        if (secondaryButtonText !== undefined) existing.secondaryButtonText = secondaryButtonText.trim();
        if (secondaryButtonLink !== undefined) existing.secondaryButtonLink = secondaryButtonLink.trim();
        if (order !== undefined && order !== "") existing.order = Number(order);
        if (status !== undefined) existing.status = Boolean(status === true || status === "true");

        existing.updatedAt = new Date().toISOString();

        await existing.save();
        return res.status(200).json({ message: "Banner updated successfully", banner: existing });
    } catch (error) {
        console.error("Error updating banner:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_banner_status = async (req, res) => {
    const { bannerid } = req.params;
    const { status } = req.body;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(bannerid);
        const query = isObjectId ? { _id: bannerid } : { bannerid: Number(bannerid) };
        const updated = await Banner.findOneAndUpdate(
            query,
            { status: Boolean(status), updatedAt: new Date().toISOString() },
            { returnDocument: "after" }
        );

        if (!updated) {
            return res.status(404).json({ message: "Banner not found" });
        }
        return res.status(200).json(updated);
    } catch (error) {
        console.error("Error updating banner status:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const delete_banner = async (req, res) => {
    const { bannerid } = req.params;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(bannerid);
        const query = isObjectId ? { _id: bannerid } : { bannerid: Number(bannerid) };
        const deleted = await Banner.findOneAndDelete(query);

        if (!deleted) {
            return res.status(404).json({ message: "Banner not found" });
        }

        if (deleted.image && deleted.image.includes("amazonaws.com")) {
            await deleteImageFromS3(deleted.image, "banners");
        }

        return res.status(200).json({ message: "Banner deleted successfully" });
    } catch (error) {
        console.error("Error deleting banner:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    get_banners,
    get_active_banners,
    add_banner,
    edit_banner,
    update_banner,
    update_banner_status,
    delete_banner
};
