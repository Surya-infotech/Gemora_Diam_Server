const DiamondColor = require("../../../models/AdminPanel/Attributes/diamondcolor-model");
const mongoose = require("mongoose");

const get_diamond_colors = async (req, res) => {
    try {
        const diamondColors = await DiamondColor.find().sort({ updatedAt: -1 }).lean();
        return res.status(200).json({ diamondColors });
    } catch (error) {
        console.error("Error fetching diamond colors:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const get_active_diamond_colors = async (req, res) => {
    try {
        const diamondColors = await DiamondColor.find({ status: true }).sort({ diamondcolor: 1 }).lean();
        return res.status(200).json(diamondColors);
    } catch (error) {
        console.error("Error fetching active diamond colors:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const add_diamond_color = async (req, res) => {
    try {
        const { diamondcolor } = req.body;

        if (!diamondcolor || !diamondcolor.trim()) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const trimmedColor = diamondcolor.trim();

        const existing = await DiamondColor.findOne({
            diamondcolor: { $regex: new RegExp(`^${trimmedColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") }
        });
        if (existing) {
            return res.status(400).json({ message: "Diamond Color Already Exists" });
        }

        const maxItem = await DiamondColor.findOne().sort({ diamondcolorid: -1 });
        const nextId = maxItem ? parseInt(maxItem.diamondcolorid) + 1 : 1;

        const now = new Date().toISOString();
        const newDiamondColor = new DiamondColor({
            diamondcolorid: nextId,
            diamondcolor: trimmedColor,
            status: true,
            createdAt: now,
            updatedAt: now
        });

        await newDiamondColor.save();
        return res.status(201).json({ message: "Diamond Color added successfully", diamondColor: newDiamondColor });
    } catch (error) {
        console.error("Error adding diamond color:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const edit_diamond_color = async (req, res) => {
    const { diamondcolorid } = req.params;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(diamondcolorid);
        const query = isObjectId ? { _id: diamondcolorid } : { diamondcolorid: Number(diamondcolorid) };
        const item = await DiamondColor.findOne(query);

        if (!item) {
            return res.status(404).json({ message: "Diamond Color not found" });
        }
        return res.status(200).json(item);
    } catch (error) {
        console.error("Error fetching diamond color details:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_diamond_color_status = async (req, res) => {
    const { diamondcolorid } = req.params;
    const { status } = req.body;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(diamondcolorid);
        const query = isObjectId ? { _id: diamondcolorid } : { diamondcolorid: Number(diamondcolorid) };
        const updated = await DiamondColor.findOneAndUpdate(
            query,
            { status: Boolean(status), updatedAt: new Date().toISOString() },
            { returnDocument: "after" }
        );

        if (!updated) {
            return res.status(404).json({ message: "Diamond Color not found" });
        }
        return res.status(200).json(updated);
    } catch (error) {
        console.error("Error updating diamond color status:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_diamond_color = async (req, res) => {
    const { diamondcolorid } = req.params;
    const { diamondcolor, status } = req.body;

    try {
        if (!diamondcolor || !diamondcolor.trim()) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const isObjectId = mongoose.Types.ObjectId.isValid(diamondcolorid);
        const selfQuery = isObjectId ? { _id: diamondcolorid } : { diamondcolorid: Number(diamondcolorid) };
        const existingSelf = await DiamondColor.findOne(selfQuery);

        if (!existingSelf) {
            return res.status(404).json({ message: "Diamond Color not found" });
        }

        const trimmedColor = diamondcolor.trim();

        const duplicateQuery = {
            _id: { $ne: existingSelf._id },
            diamondcolor: { $regex: new RegExp(`^${trimmedColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") }
        };
        const duplicate = await DiamondColor.findOne(duplicateQuery);
        if (duplicate) {
            return res.status(400).json({ message: "Diamond Color Already Exists" });
        }

        existingSelf.diamondcolor = trimmedColor;
        if (status !== undefined) {
            existingSelf.status = Boolean(status);
        }
        existingSelf.updatedAt = new Date().toISOString();

        await existingSelf.save();
        return res.status(200).json({ message: "Diamond Color updated successfully", diamondColor: existingSelf });
    } catch (error) {
        console.error("Error updating diamond color:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const delete_diamond_color = async (req, res) => {
    const { diamondcolorid } = req.params;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(diamondcolorid);
        const query = isObjectId ? { _id: diamondcolorid } : { diamondcolorid: Number(diamondcolorid) };
        const deleted = await DiamondColor.findOneAndDelete(query);

        if (!deleted) {
            return res.status(404).json({ message: "Diamond Color not found" });
        }
        return res.status(200).json({ message: "Diamond Color deleted successfully" });
    } catch (error) {
        console.error("Error deleting diamond color:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    get_diamond_colors,
    get_active_diamond_colors,
    add_diamond_color,
    edit_diamond_color,
    update_diamond_color_status,
    update_diamond_color,
    delete_diamond_color
};
