const Color = require("../../../models/AdminPanel/Attributes/color-model");
const mongoose = require("mongoose");

const get_colors = async (req, res) => {
    try {
        const colors = await Color.find().sort({ updatedAt: -1 }).lean();
        return res.status(200).json({ colors });
    } catch (error) {
        console.error("Error fetching colors:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const get_active_colors = async (req, res) => {
    try {
        const query = { status: true };
        if (req.query.colortype) {
            query.colortype = req.query.colortype;
        }
        const colors = await Color.find(query).sort({ colorname: 1 }).lean();
        return res.status(200).json(colors);
    } catch (error) {
        console.error("Error fetching active colors:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const add_color = async (req, res) => {
    try {
        const { colorname, colortype } = req.body;

        if (!colorname || !colorname.trim() || !colortype || !colortype.trim()) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const trimmedName = colorname.trim();
        const trimmedType = colortype.trim();

        if (!["Diamond", "Band"].includes(trimmedType)) {
            return res.status(400).json({ message: "Color Type must be either Diamond or Band" });
        }

        // Condition: both colorname and colortype must be unique together (case-insensitive on name)
        const existing = await Color.findOne({
            colorname: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") },
            colortype: trimmedType
        });
        if (existing) {
            return res.status(400).json({ message: "Color with this type already exists" });
        }

        const maxItem = await Color.findOne().sort({ colorid: -1 });
        const nextId = maxItem ? parseInt(maxItem.colorid) + 1 : 1;

        const now = new Date().toISOString();
        const newColor = new Color({
            colorid: nextId,
            colorname: trimmedName,
            colortype: trimmedType,
            status: true,
            createdAt: now,
            updatedAt: now
        });

        await newColor.save();
        return res.status(201).json({ message: "Color added successfully", color: newColor });
    } catch (error) {
        console.error("Error adding color:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const edit_color = async (req, res) => {
    const { colorid } = req.params;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(colorid);
        const query = isObjectId ? { _id: colorid } : { colorid: Number(colorid) };
        const item = await Color.findOne(query);

        if (!item) {
            return res.status(404).json({ message: "Color not found" });
        }
        return res.status(200).json(item);
    } catch (error) {
        console.error("Error fetching color details:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_color_status = async (req, res) => {
    const { colorid } = req.params;
    const { status } = req.body;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(colorid);
        const query = isObjectId ? { _id: colorid } : { colorid: Number(colorid) };
        const updated = await Color.findOneAndUpdate(
            query,
            { status: Boolean(status), updatedAt: new Date().toISOString() },
            { returnDocument: "after" }
        );

        if (!updated) {
            return res.status(404).json({ message: "Color not found" });
        }
        return res.status(200).json(updated);
    } catch (error) {
        console.error("Error updating color status:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_color = async (req, res) => {
    const { colorid } = req.params;
    const { colorname, colortype, status } = req.body;

    try {
        if (!colorname || !colorname.trim() || !colortype || !colortype.trim()) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const isObjectId = mongoose.Types.ObjectId.isValid(colorid);
        const selfQuery = isObjectId ? { _id: colorid } : { colorid: Number(colorid) };
        const existingSelf = await Color.findOne(selfQuery);

        if (!existingSelf) {
            return res.status(404).json({ message: "Color not found" });
        }

        const trimmedName = colorname.trim();
        const trimmedType = colortype.trim();

        if (!["Diamond", "Band"].includes(trimmedType)) {
            return res.status(400).json({ message: "Color Type must be either Diamond or Band" });
        }

        // Condition: both colorname and colortype must be unique together (case-insensitive on name)
        const duplicateQuery = {
            _id: { $ne: existingSelf._id },
            colorname: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") },
            colortype: trimmedType
        };
        const duplicate = await Color.findOne(duplicateQuery);
        if (duplicate) {
            return res.status(400).json({ message: "Color with this type already exists" });
        }

        existingSelf.colorname = trimmedName;
        existingSelf.colortype = trimmedType;
        if (status !== undefined) {
            existingSelf.status = Boolean(status);
        }
        existingSelf.updatedAt = new Date().toISOString();

        await existingSelf.save();
        return res.status(200).json({ message: "Color updated successfully", color: existingSelf });
    } catch (error) {
        console.error("Error updating color:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const delete_color = async (req, res) => {
    const { colorid } = req.params;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(colorid);
        const query = isObjectId ? { _id: colorid } : { colorid: Number(colorid) };
        const deleted = await Color.findOneAndDelete(query);

        if (!deleted) {
            return res.status(404).json({ message: "Color not found" });
        }

        return res.status(200).json({ message: "Color deleted successfully" });
    } catch (error) {
        console.error("Error deleting color:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    get_colors,
    get_active_colors,
    add_color,
    edit_color,
    update_color_status,
    update_color,
    delete_color
};