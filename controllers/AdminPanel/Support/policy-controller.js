const Policy = require("../../../models/AdminPanel/Support/policy-model");
const mongoose = require("mongoose");

const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const get_policies = async (req, res) => {
    try {
        const policies = await Policy.find().sort({ updatedAt: -1 }).lean();
        return res.status(200).json({ policies });
    } catch (error) {
        console.error("Error fetching policies:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const get_active_policies = async (req, res) => {
    try {
        const policies = await Policy.find({ status: true }).sort({ policyname: 1 }).lean();
        return res.status(200).json(policies);
    } catch (error) {
        console.error("Error fetching active policies:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const add_policy = async (req, res) => {
    try {
        const { policyname, description } = req.body;

        if (!policyname || !policyname.trim() || !description || !description.trim()) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const trimmedName = policyname.trim();
        const trimmedDesc = description.trim();

        const existing = await Policy.findOne({
            policyname: { $regex: new RegExp("^" + escapeRegex(trimmedName) + "$", "i") }
        });

        if (existing) {
            return res.status(400).json({ message: "Policy Already Exists" });
        }

        const maxItem = await Policy.findOne().sort({ policyid: -1 });
        const nextId = maxItem ? parseInt(maxItem.policyid) + 1 : 1;

        const now = new Date().toISOString();
        const newPolicy = new Policy({
            policyid: nextId,
            policyname: trimmedName,
            description: trimmedDesc,
            status: true,
            createdAt: now,
            updatedAt: now
        });

        await newPolicy.save();
        return res.status(201).json({ message: "Policy added successfully", policy: newPolicy });
    } catch (error) {
        console.error("Error adding policy:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const edit_policy = async (req, res) => {
    const { policyid } = req.params;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(policyid);
        const query = isObjectId ? { _id: policyid } : { policyid: Number(policyid) };
        const item = await Policy.findOne(query);

        if (!item) {
            return res.status(404).json({ message: "Policy not found" });
        }
        return res.status(200).json(item);
    } catch (error) {
        console.error("Error fetching policy details:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_policy_status = async (req, res) => {
    const { policyid } = req.params;
    const { status } = req.body;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(policyid);
        const query = isObjectId ? { _id: policyid } : { policyid: Number(policyid) };
        const updated = await Policy.findOneAndUpdate(
            query,
            { status: Boolean(status), updatedAt: new Date().toISOString() },
            { returnDocument: "after" }
        );

        if (!updated) {
            return res.status(404).json({ message: "Policy not found" });
        }
        return res.status(200).json(updated);
    } catch (error) {
        console.error("Error updating policy status:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_policy = async (req, res) => {
    const { policyid } = req.params;
    const { policyname, description, status } = req.body;

    try {
        if (!policyname || !policyname.trim() || !description || !description.trim()) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const isObjectId = mongoose.Types.ObjectId.isValid(policyid);
        const selfQuery = isObjectId ? { _id: policyid } : { policyid: Number(policyid) };
        const existingSelf = await Policy.findOne(selfQuery);

        if (!existingSelf) {
            return res.status(404).json({ message: "Policy not found" });
        }

        const trimmedName = policyname.trim();
        const trimmedDesc = description.trim();

        const duplicateQuery = {
            _id: { $ne: existingSelf._id },
            policyname: { $regex: new RegExp("^" + escapeRegex(trimmedName) + "$", "i") }
        };
        const duplicate = await Policy.findOne(duplicateQuery);
        if (duplicate) {
            return res.status(400).json({ message: "Policy Already Exists" });
        }

        existingSelf.policyname = trimmedName;
        existingSelf.description = trimmedDesc;
        if (status !== undefined) {
            existingSelf.status = Boolean(status);
        }
        existingSelf.updatedAt = new Date().toISOString();

        await existingSelf.save();
        return res.status(200).json({ message: "Policy updated successfully", policy: existingSelf });
    } catch (error) {
        console.error("Error updating policy:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const delete_policy = async (req, res) => {
    const { policyid } = req.params;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(policyid);
        const query = isObjectId ? { _id: policyid } : { policyid: Number(policyid) };
        const deleted = await Policy.findOneAndDelete(query);

        if (!deleted) {
            return res.status(404).json({ message: "Policy not found" });
        }
        return res.status(200).json({ message: "Policy deleted successfully" });
    } catch (error) {
        console.error("Error deleting policy:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    get_policies,
    get_active_policies,
    add_policy,
    edit_policy,
    update_policy_status,
    update_policy,
    delete_policy
};
