const Clarity = require("../../../models/AdminPanel/Attributes/clarity-model");
const mongoose = require("mongoose");

const get_clarities = async (req, res) => {
    try {
        const clarities = await Clarity.find().sort({ updatedAt: -1 }).lean();
        return res.status(200).json({ clarities });
    } catch (error) {
        console.error("Error fetching clarities:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const get_active_clarities = async (req, res) => {
    try {
        const clarities = await Clarity.find({ status: true }).sort({ clarityname: 1 }).lean();
        return res.status(200).json(clarities);
    } catch (error) {
        console.error("Error fetching active clarities:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const add_clarity = async (req, res) => {
    try {
        const { clarityname } = req.body;

        if (!clarityname || !clarityname.trim()) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const trimmedName = clarityname.trim();

        const existing = await Clarity.findOne({
            clarityname: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") }
        });
        if (existing) {
            return res.status(400).json({ message: "Clarity Already Exists" });
        }

        const maxItem = await Clarity.findOne().sort({ clarityid: -1 });
        const nextId = maxItem ? parseInt(maxItem.clarityid) + 1 : 1;

        const now = new Date().toISOString();
        const newClarity = new Clarity({
            clarityid: nextId,
            clarityname: trimmedName,
            status: true,
            createdAt: now,
            updatedAt: now
        });

        await newClarity.save();
        return res.status(201).json({ message: "Clarity added successfully", clarity: newClarity });
    } catch (error) {
        console.error("Error adding clarity:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const edit_clarity = async (req, res) => {
    const { clarityid } = req.params;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(clarityid);
        const query = isObjectId ? { _id: clarityid } : { clarityid: Number(clarityid) };
        const item = await Clarity.findOne(query);

        if (!item) {
            return res.status(404).json({ message: "Clarity not found" });
        }
        return res.status(200).json(item);
    } catch (error) {
        console.error("Error fetching clarity details:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_clarity_status = async (req, res) => {
    const { clarityid } = req.params;
    const { status } = req.body;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(clarityid);
        const query = isObjectId ? { _id: clarityid } : { clarityid: Number(clarityid) };
        const updated = await Clarity.findOneAndUpdate(
            query,
            { status: Boolean(status), updatedAt: new Date().toISOString() },
            { returnDocument: "after" }
        );

        if (!updated) {
            return res.status(404).json({ message: "Clarity not found" });
        }
        return res.status(200).json(updated);
    } catch (error) {
        console.error("Error updating clarity status:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_clarity = async (req, res) => {
    const { clarityid } = req.params;
    const { clarityname, status } = req.body;

    try {
        if (!clarityname || !clarityname.trim()) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const isObjectId = mongoose.Types.ObjectId.isValid(clarityid);
        const selfQuery = isObjectId ? { _id: clarityid } : { clarityid: Number(clarityid) };
        const existingSelf = await Clarity.findOne(selfQuery);

        if (!existingSelf) {
            return res.status(404).json({ message: "Clarity not found" });
        }

        const trimmedName = clarityname.trim();

        const duplicateQuery = {
            _id: { $ne: existingSelf._id },
            clarityname: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") }
        };
        const duplicate = await Clarity.findOne(duplicateQuery);
        if (duplicate) {
            return res.status(400).json({ message: "Clarity Already Exists" });
        }

        existingSelf.clarityname = trimmedName;
        if (status !== undefined) {
            existingSelf.status = Boolean(status);
        }
        existingSelf.updatedAt = new Date().toISOString();

        await existingSelf.save();
        return res.status(200).json({ message: "Clarity updated successfully", clarity: existingSelf });
    } catch (error) {
        console.error("Error updating clarity:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const delete_clarity = async (req, res) => {
    const { clarityid } = req.params;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(clarityid);
        const query = isObjectId ? { _id: clarityid } : { clarityid: Number(clarityid) };
        const deleted = await Clarity.findOneAndDelete(query);

        if (!deleted) {
            return res.status(404).json({ message: "Clarity not found" });
        }
        return res.status(200).json({ message: "Clarity deleted successfully" });
    } catch (error) {
        console.error("Error deleting clarity:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    get_clarities,
    get_active_clarities,
    add_clarity,
    edit_clarity,
    update_clarity_status,
    update_clarity,
    delete_clarity
};
