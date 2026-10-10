const CollectionBanner = require("../../../models/AdminPanel/Support/collectionbanner-model");
const mongoose = require("mongoose");
const { deleteImageFromS3 } = require("../../../utils/s3Config-admin");

const get_collection_banners = async (_req, res) => {
    try {
        const banners = await CollectionBanner.find().sort({ order: 1, bannerid: 1 }).lean();
        return res.status(200).json({ collectionBanners: banners });
    } catch (error) {
        console.error("Error fetching collection banners:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const get_active_collection_banners = async (_req, res) => {
    try {
        const banners = await CollectionBanner.find({ status: true }).sort({ order: 1, bannerid: 1 }).lean();
        return res.status(200).json(banners);
    } catch (error) {
        console.error("Error fetching active collection banners:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const add_collection_banner = async (req, res) => {
    try {
        const {
            tag,
            title,
            description,
            buttonText,
            buttonLink,
            position,
            order
        } = req.body;

        const imageUrl = req.file ? req.file.location : (req.body.image ? req.body.image.trim() : "");

        if (!title || !title.trim()) {
            return res.status(400).json({ message: "Title is required" });
        }

        if (!imageUrl) {
            return res.status(400).json({ message: "Banner image is required" });
        }

        const maxItem = await CollectionBanner.findOne().sort({ bannerid: -1 });
        const nextId = maxItem ? parseInt(maxItem.bannerid) + 1 : 1;

        const now = new Date().toISOString();
        const newBanner = new CollectionBanner({
            bannerid: nextId,
            tag: tag ? tag.trim() : "",
            title: title.trim(),
            description: description ? description.trim() : "",
            image: imageUrl,
            buttonText: buttonText ? buttonText.trim() : "EXPLORE COLLECTION",
            buttonLink: buttonLink ? buttonLink.trim() : "/collections",
            position: position === "right" ? "right" : "left",
            order: order ? Number(order) : 1,
            status: true,
            createdAt: now,
            updatedAt: now
        });

        await newBanner.save();
        return res.status(201).json({ message: "Collection Banner added successfully", collectionBanner: newBanner });
    } catch (error) {
        console.error("Error adding collection banner:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const edit_collection_banner = async (req, res) => {
    const { bannerid } = req.params;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(bannerid);
        const query = isObjectId ? { _id: bannerid } : { bannerid: Number(bannerid) };
        const banner = await CollectionBanner.findOne(query);

        if (!banner) {
            return res.status(404).json({ message: "Collection Banner not found" });
        }
        return res.status(200).json(banner);
    } catch (error) {
        console.error("Error fetching collection banner details:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_collection_banner_status = async (req, res) => {
    const { bannerid } = req.params;
    const { status } = req.body;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(bannerid);
        const query = isObjectId ? { _id: bannerid } : { bannerid: Number(bannerid) };
        const isStatusActive = status === true || status === "true" || status === 1 || status === "1";
        const updated = await CollectionBanner.findOneAndUpdate(
            query,
            { status: isStatusActive, updatedAt: new Date().toISOString() },
            { returnDocument: "after" }
        );

        if (!updated) {
            return res.status(404).json({ message: "Collection Banner not found" });
        }
        return res.status(200).json(updated);
    } catch (error) {
        console.error("Error updating collection banner status:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_collection_banner = async (req, res) => {
    const { bannerid } = req.params;
    const {
        tag,
        title,
        description,
        buttonText,
        buttonLink,
        position,
        order,
        status
    } = req.body;

    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(bannerid);
        const query = isObjectId ? { _id: bannerid } : { bannerid: Number(bannerid) };
        const existing = await CollectionBanner.findOne(query);

        if (!existing) {
            return res.status(404).json({ message: "Collection Banner not found" });
        }

        if (!title || !title.trim()) {
            return res.status(400).json({ message: "Title is required" });
        }

        let newImageUrl = existing.image;
        if (req.file) {
            newImageUrl = req.file.location;
            if (existing.image && existing.image !== newImageUrl && existing.image.includes(".amazonaws.com/")) {
                try {
                    await deleteImageFromS3(existing.image);
                } catch (s3Err) {
                    console.warn("Could not delete old image from S3:", s3Err.message);
                }
            }
        } else if (req.body.image && req.body.image.trim()) {
            newImageUrl = req.body.image.trim();
        }

        existing.tag = tag ? tag.trim() : "";
        existing.title = title.trim();
        existing.description = description ? description.trim() : "";
        existing.image = newImageUrl;
        existing.buttonText = buttonText ? buttonText.trim() : "EXPLORE COLLECTION";
        existing.buttonLink = buttonLink ? buttonLink.trim() : "/collections";
        existing.position = position === "right" ? "right" : "left";
        if (order !== undefined) existing.order = Number(order) || 1;
        if (status !== undefined) {
            existing.status = (status === true || status === "true" || status === 1 || status === "1");
        }
        existing.updatedAt = new Date().toISOString();

        await existing.save();
        return res.status(200).json({ message: "Collection Banner updated successfully", collectionBanner: existing });
    } catch (error) {
        console.error("Error updating collection banner:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const delete_collection_banner = async (req, res) => {
    const { bannerid } = req.params;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(bannerid);
        const query = isObjectId ? { _id: bannerid } : { bannerid: Number(bannerid) };
        const deleted = await CollectionBanner.findOneAndDelete(query);

        if (!deleted) {
            return res.status(404).json({ message: "Collection Banner not found" });
        }

        if (deleted.image && deleted.image.includes(".amazonaws.com/")) {
            try {
                await deleteImageFromS3(deleted.image);
            } catch (s3Err) {
                console.warn("Could not delete banner image from S3:", s3Err.message);
            }
        }

        return res.status(200).json({ message: "Collection Banner deleted successfully" });
    } catch (error) {
        console.error("Error deleting collection banner:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    get_collection_banners,
    get_active_collection_banners,
    add_collection_banner,
    edit_collection_banner,
    update_collection_banner_status,
    update_collection_banner,
    delete_collection_banner
};