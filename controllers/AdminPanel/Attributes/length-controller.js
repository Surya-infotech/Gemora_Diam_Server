const mongoose = require("mongoose");
const Length = require("../../../models/AdminPanel/Attributes/length-model");

const ALLOWED_LENGTH_TYPES = ["Bracelet", "Pendant"];

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeLengthType = (value) => {
    const trimmed = String(value || "").trim().toLowerCase();
    return ALLOWED_LENGTH_TYPES.find((type) => type.toLowerCase() === trimmed) || null;
};

const buildLengthQuery = (lengthid) => {
    return mongoose.Types.ObjectId.isValid(lengthid)
        ? { _id: lengthid }
        : { lengthid: Number(lengthid) };
};

const get_lengths = async (req, res) => {
    try {
        const lengths = await Length.find().sort({ createdAt: -1 });
        return res.status(200).json({ lengths });
    } catch (error) {
        console.error("Error fetching lengths:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const get_active_lengths = async (req, res) => {
    try {
        const query = { status: true };
        if (req.query.lengthtype) {
            const normalizedType = normalizeLengthType(req.query.lengthtype);
            if (!normalizedType) {
                return res.status(400).json({ message: "Invalid length type" });
            }
            query.lengthtype = normalizedType;
        }
        const lengths = await Length.find(query).sort({ lengthname: 1 });
        return res.status(200).json({ lengths });
    } catch (error) {
        console.error("Error fetching active lengths:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const add_length = async (req, res) => {
    const { lengthname, lengthtype, status } = req.body;
    try {
        const trimmedName = String(lengthname || "").trim();
        const normalizedType = normalizeLengthType(lengthtype);

        if (!trimmedName || !String(lengthtype || "").trim()) {
            return res.status(400).json({ message: "All fields are required" });
        }
        if (!normalizedType) {
            return res.status(400).json({ message: "Invalid length type" });
        }

        const existingLength = await Length.findOne({
            lengthname: { $regex: `^${escapeRegex(trimmedName)}$`, $options: "i" },
            lengthtype: normalizedType
        });
        if (existingLength) {
            return res.status(400).json({ message: "Length with this type already exists" });
        }

        const lastLength = await Length.findOne().sort({ lengthid: -1 });
        const nextId = lastLength && Number.isFinite(Number(lastLength.lengthid))
            ? Number(lastLength.lengthid) + 1
            : 1;

        const now = new Date().toISOString();
        const newLength = await Length.create({
            lengthid: nextId,
            lengthname: trimmedName,
            lengthtype: normalizedType,
            status: status !== undefined ? Boolean(status) : true,
            createdAt: now,
            updatedAt: now
        });

        return res.status(201).json({ message: "Length added successfully", length: newLength });
    } catch (error) {
        console.error("Error adding length:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const edit_length = async (req, res) => {
    const { lengthid } = req.params;
    try {
        const length = await Length.findOne(buildLengthQuery(lengthid));
        if (!length) {
            return res.status(404).json({ message: "Length not found" });
        }
        return res.status(200).json(length);
    } catch (error) {
        console.error("Error fetching length details:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_length_status = async (req, res) => {
    const { lengthid } = req.params;
    const { status } = req.body;
    try {
        const updated = await Length.findOneAndUpdate(
            buildLengthQuery(lengthid),
            {
                status: Boolean(status),
                updatedAt: new Date().toISOString()
            },
            { new: true }
        );
        if (!updated) {
            return res.status(404).json({ message: "Length not found" });
        }
        return res.status(200).json({ message: "Length status updated successfully", length: updated });
    } catch (error) {
        console.error("Error updating length status:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_length = async (req, res) => {
    const { lengthid } = req.params;
    const { lengthname, lengthtype, status } = req.body;
    try {
        const trimmedName = String(lengthname || "").trim();
        const normalizedType = normalizeLengthType(lengthtype);

        if (!trimmedName || !String(lengthtype || "").trim()) {
            return res.status(400).json({ message: "All fields are required" });
        }
        if (!normalizedType) {
            return res.status(400).json({ message: "Invalid length type" });
        }

        const existingSelf = await Length.findOne(buildLengthQuery(lengthid));
        if (!existingSelf) {
            return res.status(404).json({ message: "Length not found" });
        }

        const duplicate = await Length.findOne({
            _id: { $ne: existingSelf._id },
            lengthname: { $regex: `^${escapeRegex(trimmedName)}$`, $options: "i" },
            lengthtype: normalizedType
        });
        if (duplicate) {
            return res.status(400).json({ message: "Length with this type already exists" });
        }

        existingSelf.lengthname = trimmedName;
        existingSelf.lengthtype = normalizedType;
        if (status !== undefined) {
            existingSelf.status = Boolean(status);
        }
        existingSelf.updatedAt = new Date().toISOString();
        await existingSelf.save();

        return res.status(200).json({ message: "Length updated successfully", length: existingSelf });
    } catch (error) {
        console.error("Error updating length:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const delete_length = async (req, res) => {
    const { lengthid } = req.params;
    try {
        const deleted = await Length.findOneAndDelete(buildLengthQuery(lengthid));
        if (!deleted) {
            return res.status(404).json({ message: "Length not found" });
        }
        return res.status(200).json({ message: "Length deleted successfully" });
    } catch (error) {
        console.error("Error deleting length:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    get_lengths,
    get_active_lengths,
    add_length,
    edit_length,
    update_length_status,
    update_length,
    delete_length
};