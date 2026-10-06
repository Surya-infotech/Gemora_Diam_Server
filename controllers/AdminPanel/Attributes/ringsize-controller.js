const RingSize = require("../../../models/AdminPanel/Attributes/ringsize-model");
const mongoose = require("mongoose");

const get_ring_sizes = async (req, res) => {
    try {
        const ringSizes = await RingSize.find().sort({ updatedAt: -1 }).lean();
        return res.status(200).json({ ringSizes });
    } catch (error) {
        console.error("Error fetching ring sizes:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const get_active_ring_sizes = async (req, res) => {
    try {
        const ringSizes = await RingSize.find({ status: true }).sort({ ringsize: 1 }).lean();
        return res.status(200).json(ringSizes);
    } catch (error) {
        console.error("Error fetching active ring sizes:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const add_ring_size = async (req, res) => {
    try {
        const { ringsize } = req.body;

        if (!ringsize || !ringsize.trim()) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const trimmedSize = ringsize.trim();

        const existing = await RingSize.findOne({
            ringsize: { $regex: new RegExp(`^${trimmedSize.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") }
        });
        if (existing) {
            return res.status(400).json({ message: "Ring Size Already Exists" });
        }

        const maxItem = await RingSize.findOne().sort({ ringsizeid: -1 });
        const nextId = maxItem ? parseInt(maxItem.ringsizeid) + 1 : 1;

        const now = new Date().toISOString();
        const newRingSize = new RingSize({
            ringsizeid: nextId,
            ringsize: trimmedSize,
            status: true,
            createdAt: now,
            updatedAt: now
        });

        await newRingSize.save();
        return res.status(201).json({ message: "Ring Size added successfully", ringSize: newRingSize });
    } catch (error) {
        console.error("Error adding ring size:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const edit_ring_size = async (req, res) => {
    const { ringsizeid } = req.params;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(ringsizeid);
        const query = isObjectId ? { _id: ringsizeid } : { ringsizeid: Number(ringsizeid) };
        const item = await RingSize.findOne(query);

        if (!item) {
            return res.status(404).json({ message: "Ring Size not found" });
        }
        return res.status(200).json(item);
    } catch (error) {
        console.error("Error fetching ring size details:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_ring_size_status = async (req, res) => {
    const { ringsizeid } = req.params;
    const { status } = req.body;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(ringsizeid);
        const query = isObjectId ? { _id: ringsizeid } : { ringsizeid: Number(ringsizeid) };
        const updated = await RingSize.findOneAndUpdate(
            query,
            { status: Boolean(status), updatedAt: new Date().toISOString() },
            { returnDocument: "after" }
        );

        if (!updated) {
            return res.status(404).json({ message: "Ring Size not found" });
        }
        return res.status(200).json(updated);
    } catch (error) {
        console.error("Error updating ring size status:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_ring_size = async (req, res) => {
    const { ringsizeid } = req.params;
    const { ringsize, status } = req.body;

    try {
        if (!ringsize || !ringsize.trim()) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const isObjectId = mongoose.Types.ObjectId.isValid(ringsizeid);
        const selfQuery = isObjectId ? { _id: ringsizeid } : { ringsizeid: Number(ringsizeid) };
        const existingSelf = await RingSize.findOne(selfQuery);

        if (!existingSelf) {
            return res.status(404).json({ message: "Ring Size not found" });
        }

        const trimmedSize = ringsize.trim();

        const duplicateQuery = {
            _id: { $ne: existingSelf._id },
            ringsize: { $regex: new RegExp(`^${trimmedSize.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") }
        };
        const duplicate = await RingSize.findOne(duplicateQuery);
        if (duplicate) {
            return res.status(400).json({ message: "Ring Size Already Exists" });
        }

        existingSelf.ringsize = trimmedSize;
        if (status !== undefined) {
            existingSelf.status = Boolean(status);
        }
        existingSelf.updatedAt = new Date().toISOString();

        await existingSelf.save();
        return res.status(200).json({ message: "Ring Size updated successfully", ringSize: existingSelf });
    } catch (error) {
        console.error("Error updating ring size:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const delete_ring_size = async (req, res) => {
    const { ringsizeid } = req.params;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(ringsizeid);
        const query = isObjectId ? { _id: ringsizeid } : { ringsizeid: Number(ringsizeid) };
        const deleted = await RingSize.findOneAndDelete(query);

        if (!deleted) {
            return res.status(404).json({ message: "Ring Size not found" });
        }
        return res.status(200).json({ message: "Ring Size deleted successfully" });
    } catch (error) {
        console.error("Error deleting ring size:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    get_ring_sizes,
    get_active_ring_sizes,
    add_ring_size,
    edit_ring_size,
    update_ring_size_status,
    update_ring_size,
    delete_ring_size
};
