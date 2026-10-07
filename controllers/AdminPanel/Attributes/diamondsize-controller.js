const DiamondSize = require("../../../models/AdminPanel/Attributes/diamondsize-model");
const mongoose = require("mongoose");

const get_diamond_sizes = async (_req, res) => {
    try {
        const diamondSizes = await DiamondSize.find().sort({ updatedAt: -1 }).lean();
        return res.status(200).json({ diamondSizes });
    } catch (error) {
        console.error("Error fetching diamond sizes:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const get_active_diamond_sizes = async (_req, res) => {
    try {
        const diamondSizes = await DiamondSize.find({ status: true }).sort({ diamondsize: 1 }).lean();
        return res.status(200).json(diamondSizes);
    } catch (error) {
        console.error("Error fetching active diamond sizes:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const add_diamond_size = async (req, res) => {
    try {
        const { diamondsize } = req.body;

        if (!diamondsize || !diamondsize.trim()) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const trimmedSize = diamondsize.trim();

        const existing = await DiamondSize.findOne({
            diamondsize: { $regex: new RegExp(`^${trimmedSize}$`, "i") }
        });
        if (existing) {
            return res.status(400).json({ message: "Diamond Size Already Exists" });
        }

        const maxItem = await DiamondSize.findOne().sort({ diamondsizeid: -1 });
        const nextId = maxItem ? parseInt(maxItem.diamondsizeid) + 1 : 1;

        const now = new Date().toISOString();
        const newDiamondSize = new DiamondSize({
            diamondsizeid: nextId,
            diamondsize: trimmedSize,
            status: true,
            createdAt: now,
            updatedAt: now
        });

        await newDiamondSize.save();
        return res.status(201).json({ message: "Diamond Size added successfully", diamondSize: newDiamondSize });
    } catch (error) {
        console.error("Error adding diamond size:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const edit_diamond_size = async (req, res) => {
    const { diamondsizeid } = req.params;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(diamondsizeid);
        const query = isObjectId ? { _id: diamondsizeid } : { diamondsizeid: Number(diamondsizeid) };
        const item = await DiamondSize.findOne(query);

        if (!item) {
            return res.status(404).json({ message: "Diamond Size not found" });
        }
        return res.status(200).json(item);
    } catch (error) {
        console.error("Error fetching diamond size details:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_diamond_size_status = async (req, res) => {
    const { diamondsizeid } = req.params;
    const { status } = req.body;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(diamondsizeid);
        const query = isObjectId ? { _id: diamondsizeid } : { diamondsizeid: Number(diamondsizeid) };
        const updated = await DiamondSize.findOneAndUpdate(
            query,
            { status: Boolean(status), updatedAt: new Date().toISOString() },
            { returnDocument: "after" }
        );

        if (!updated) {
            return res.status(404).json({ message: "Diamond Size not found" });
        }
        return res.status(200).json(updated);
    } catch (error) {
        console.error("Error updating diamond size status:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_diamond_size = async (req, res) => {
    const { diamondsizeid } = req.params;
    const { diamondsize, status } = req.body;

    try {
        if (!diamondsize || !diamondsize.trim()) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const isObjectId = mongoose.Types.ObjectId.isValid(diamondsizeid);
        const selfQuery = isObjectId ? { _id: diamondsizeid } : { diamondsizeid: Number(diamondsizeid) };
        const existingSelf = await DiamondSize.findOne(selfQuery);

        if (!existingSelf) {
            return res.status(404).json({ message: "Diamond Size not found" });
        }

        const trimmedSize = diamondsize.trim();

        const duplicateQuery = {
            _id: { $ne: existingSelf._id },
            diamondsize: { $regex: new RegExp(`^${trimmedSize}$`, "i") }
        };
        const duplicate = await DiamondSize.findOne(duplicateQuery);
        if (duplicate) {
            return res.status(400).json({ message: "Diamond Size Already Exists" });
        }

        existingSelf.diamondsize = trimmedSize;
        if (status !== undefined) {
            existingSelf.status = Boolean(status);
        }
        existingSelf.updatedAt = new Date().toISOString();

        await existingSelf.save();
        return res.status(200).json({ message: "Diamond Size updated successfully", diamondSize: existingSelf });
    } catch (error) {
        console.error("Error updating diamond size:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const delete_diamond_size = async (req, res) => {
    const { diamondsizeid } = req.params;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(diamondsizeid);
        const query = isObjectId ? { _id: diamondsizeid } : { diamondsizeid: Number(diamondsizeid) };
        const deleted = await DiamondSize.findOneAndDelete(query);

        if (!deleted) {
            return res.status(404).json({ message: "Diamond Size not found" });
        }
        return res.status(200).json({ message: "Diamond Size deleted successfully" });
    } catch (error) {
        console.error("Error deleting diamond size:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    get_diamond_sizes,
    get_active_diamond_sizes,
    add_diamond_size,
    edit_diamond_size,
    update_diamond_size_status,
    update_diamond_size,
    delete_diamond_size
};