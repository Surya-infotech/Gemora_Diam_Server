const Metal = require("../../../models/AdminPanel/Attributes/metal-model");
const mongoose = require("mongoose");

const get_metals = async (_req, res) => {
    try {
        const metals = await Metal.find().sort({ updatedAt: -1 }).lean();
        return res.status(200).json({ metals });
    } catch (error) {
        console.error("Error fetching metals:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const get_active_metals = async (_req, res) => {
    try {
        const metals = await Metal.find({ status: true }).sort({ metalname: 1 }).lean();
        return res.status(200).json(metals);
    } catch (error) {
        console.error("Error fetching active metals:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const add_metal = async (req, res) => {
    try {
        const { metalname, metaltype } = req.body;

        if (!metalname || !metaltype) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const trimmedName = metalname.trim();
        const trimmedType = metaltype.trim();

        const existingMetal = await Metal.findOne({
            metalname: { $regex: new RegExp(`^${trimmedName}$`, "i") }
        });
        if (existingMetal) {
            return res.status(400).json({ message: "Metal Name Already Exists" });
        }

        const maxMetal = await Metal.findOne().sort({ metalid: -1 });
        const nextMetalId = maxMetal ? parseInt(maxMetal.metalid) + 1 : 1;

        const now = new Date().toISOString();
        const newMetal = new Metal({
            metalid: nextMetalId,
            metalname: trimmedName,
            metaltype: trimmedType,
            status: true,
            createdAt: now,
            updatedAt: now
        });

        await newMetal.save();
        return res.status(201).json({ message: "Metal added successfully", metal: newMetal });
    } catch (error) {
        console.error("Error adding metal:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const edit_metal = async (req, res) => {
    const { metalid } = req.params;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(metalid);
        const query = isObjectId ? { _id: metalid } : { metalid: Number(metalid) };
        const metal = await Metal.findOne(query);

        if (!metal) {
            return res.status(404).json({ message: "Metal not found" });
        }
        return res.status(200).json(metal);
    } catch (error) {
        console.error("Error fetching metal details:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_metal_status = async (req, res) => {
    const { metalid } = req.params;
    const { status } = req.body;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(metalid);
        const query = isObjectId ? { _id: metalid } : { metalid: Number(metalid) };
        const updated = await Metal.findOneAndUpdate(
            query,
            { status: Boolean(status), updatedAt: new Date().toISOString() },
            { returnDocument: "after" }
        );

        if (!updated) {
            return res.status(404).json({ message: "Metal not found" });
        }
        return res.status(200).json(updated);
    } catch (error) {
        console.error("Error updating metal status:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_metal = async (req, res) => {
    const { metalid } = req.params;
    const { metalname, metaltype, status } = req.body;

    try {
        if (!metalname || !metaltype) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const isObjectId = mongoose.Types.ObjectId.isValid(metalid);
        const selfQuery = isObjectId ? { _id: metalid } : { metalid: Number(metalid) };
        const existingSelf = await Metal.findOne(selfQuery);

        if (!existingSelf) {
            return res.status(404).json({ message: "Metal not found" });
        }

        const trimmedName = metalname.trim();
        const trimmedType = metaltype.trim();

        const duplicateQuery = {
            _id: { $ne: existingSelf._id },
            metalname: { $regex: new RegExp(`^${trimmedName}$`, "i") }
        };
        const duplicate = await Metal.findOne(duplicateQuery);
        if (duplicate) {
            return res.status(400).json({ message: "Metal Name Already Exists" });
        }

        existingSelf.metalname = trimmedName;
        existingSelf.metaltype = trimmedType;
        if (status !== undefined) {
            existingSelf.status = Boolean(status);
        }
        existingSelf.updatedAt = new Date().toISOString();

        await existingSelf.save();
        return res.status(200).json({ message: "Metal updated successfully", metal: existingSelf });
    } catch (error) {
        console.error("Error updating metal:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const delete_metal = async (req, res) => {
    const { metalid } = req.params;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(metalid);
        const query = isObjectId ? { _id: metalid } : { metalid: Number(metalid) };
        const deleted = await Metal.findOneAndDelete(query);

        if (!deleted) {
            return res.status(404).json({ message: "Metal not found" });
        }

        return res.status(200).json({ message: "Metal deleted successfully" });
    } catch (error) {
        console.error("Error deleting metal:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    get_metals,
    get_active_metals,
    add_metal,
    edit_metal,
    update_metal_status,
    update_metal,
    delete_metal
};
