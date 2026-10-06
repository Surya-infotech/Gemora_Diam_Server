const Category = require("../../../models/AdminPanel/Attributes/category-model");
const mongoose = require("mongoose");

const get_categories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ updatedAt: -1 }).lean();
        return res.status(200).json({ categories });
    } catch (error) {
        console.error("Error fetching categories:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const get_active_categories = async (req, res) => {
    try {
        const categories = await Category.find({ status: true }).sort({ categoryname: 1 }).lean();
        return res.status(200).json(categories);
    } catch (error) {
        console.error("Error fetching active categories:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const add_category = async (req, res) => {
    try {
        const { categoryname } = req.body;

        if (!categoryname || !categoryname.trim()) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const trimmedName = categoryname.trim();

        const existing = await Category.findOne({
            categoryname: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") }
        });
        if (existing) {
            return res.status(400).json({ message: "Category Already Exists" });
        }

        const maxItem = await Category.findOne().sort({ categoryid: -1 });
        const nextId = maxItem ? parseInt(maxItem.categoryid) + 1 : 1;

        const now = new Date().toISOString();
        const newCategory = new Category({
            categoryid: nextId,
            categoryname: trimmedName,
            status: true,
            createdAt: now,
            updatedAt: now
        });

        await newCategory.save();
        return res.status(201).json({ message: "Category added successfully", category: newCategory });
    } catch (error) {
        console.error("Error adding category:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const edit_category = async (req, res) => {
    const { categoryid } = req.params;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(categoryid);
        const query = isObjectId ? { _id: categoryid } : { categoryid: Number(categoryid) };
        const item = await Category.findOne(query);

        if (!item) {
            return res.status(404).json({ message: "Category not found" });
        }
        return res.status(200).json(item);
    } catch (error) {
        console.error("Error fetching category details:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_category_status = async (req, res) => {
    const { categoryid } = req.params;
    const { status } = req.body;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(categoryid);
        const query = isObjectId ? { _id: categoryid } : { categoryid: Number(categoryid) };
        const updated = await Category.findOneAndUpdate(
            query,
            { status: Boolean(status), updatedAt: new Date().toISOString() },
            { returnDocument: "after" }
        );

        if (!updated) {
            return res.status(404).json({ message: "Category not found" });
        }
        return res.status(200).json(updated);
    } catch (error) {
        console.error("Error updating category status:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_category = async (req, res) => {
    const { categoryid } = req.params;
    const { categoryname, status } = req.body;

    try {
        if (!categoryname || !categoryname.trim()) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const isObjectId = mongoose.Types.ObjectId.isValid(categoryid);
        const selfQuery = isObjectId ? { _id: categoryid } : { categoryid: Number(categoryid) };
        const existingSelf = await Category.findOne(selfQuery);

        if (!existingSelf) {
            return res.status(404).json({ message: "Category not found" });
        }

        const trimmedName = categoryname.trim();

        const duplicateQuery = {
            _id: { $ne: existingSelf._id },
            categoryname: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") }
        };
        const duplicate = await Category.findOne(duplicateQuery);
        if (duplicate) {
            return res.status(400).json({ message: "Category Already Exists" });
        }

        existingSelf.categoryname = trimmedName;
        if (status !== undefined) {
            existingSelf.status = Boolean(status);
        }
        existingSelf.updatedAt = new Date().toISOString();

        await existingSelf.save();
        return res.status(200).json({ message: "Category updated successfully", category: existingSelf });
    } catch (error) {
        console.error("Error updating category:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const delete_category = async (req, res) => {
    const { categoryid } = req.params;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(categoryid);
        const query = isObjectId ? { _id: categoryid } : { categoryid: Number(categoryid) };
        const deleted = await Category.findOneAndDelete(query);

        if (!deleted) {
            return res.status(404).json({ message: "Category not found" });
        }
        return res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
        console.error("Error deleting category:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    get_categories,
    get_active_categories,
    add_category,
    edit_category,
    update_category_status,
    update_category,
    delete_category
};
