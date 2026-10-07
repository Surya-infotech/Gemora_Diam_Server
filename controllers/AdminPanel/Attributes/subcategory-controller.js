const SubCategory = require("../../../models/AdminPanel/Attributes/subcategory-model");
const Category = require("../../../models/AdminPanel/Attributes/category-model");
const Item = require("../../../models/AdminPanel/Products/item-model");
const mongoose = require("mongoose");

const get_subcategories = async (_req, res) => {
    try {
        const subcategories = await SubCategory.find().sort({ updatedAt: -1 }).lean();
        return res.status(200).json({ subcategories });
    } catch (error) {
        console.error("Error fetching subcategories:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const get_active_subcategories = async (req, res) => {
    try {
        const query = { status: true };
        if (req.query.categoryid) {
            query.categoryid = Number(req.query.categoryid);
        }
        const subcategories = await SubCategory.find(query).sort({ subcategoryname: 1 }).lean();
        return res.status(200).json(subcategories);
    } catch (error) {
        console.error("Error fetching active subcategories:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const add_subcategory = async (req, res) => {
    try {
        const { subcategoryname, categoryid } = req.body;

        if (!subcategoryname || !subcategoryname.trim() || !categoryid) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const trimmedName = subcategoryname.trim();

        const isCatObjectId = mongoose.Types.ObjectId.isValid(categoryid);
        const catQuery = isCatObjectId ? { _id: categoryid } : { categoryid: Number(categoryid) };
        const categoryDoc = await Category.findOne(catQuery);

        if (!categoryDoc) {
            return res.status(400).json({ message: "Category not found" });
        }

        const existing = await SubCategory.findOne({
            categoryid: categoryDoc.categoryid,
            subcategoryname: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") }
        });
        if (existing) {
            return res.status(400).json({ message: "Sub Category Already Exists" });
        }

        const maxItem = await SubCategory.findOne().sort({ subcategoryid: -1 });
        const nextId = maxItem ? parseInt(maxItem.subcategoryid) + 1 : 1;

        const now = new Date().toISOString();
        const newSubCategory = new SubCategory({
            subcategoryid: nextId,
            subcategoryname: trimmedName,
            categoryid: categoryDoc.categoryid,
            categoryname: categoryDoc.categoryname,
            status: true,
            createdAt: now,
            updatedAt: now
        });

        await newSubCategory.save();
        return res.status(201).json({ message: "Sub Category added successfully", subcategory: newSubCategory });
    } catch (error) {
        console.error("Error adding subcategory:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const edit_subcategory = async (req, res) => {
    const { subcategoryid } = req.params;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(subcategoryid);
        const query = isObjectId ? { _id: subcategoryid } : { subcategoryid: Number(subcategoryid) };
        const item = await SubCategory.findOne(query);

        if (!item) {
            return res.status(404).json({ message: "Sub Category not found" });
        }
        return res.status(200).json(item);
    } catch (error) {
        console.error("Error fetching subcategory details:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_subcategory_status = async (req, res) => {
    const { subcategoryid } = req.params;
    const { status } = req.body;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(subcategoryid);
        const query = isObjectId ? { _id: subcategoryid } : { subcategoryid: Number(subcategoryid) };
        const updated = await SubCategory.findOneAndUpdate(
            query,
            { status: Boolean(status), updatedAt: new Date().toISOString() },
            { returnDocument: "after" }
        );

        if (!updated) {
            return res.status(404).json({ message: "Sub Category not found" });
        }
        return res.status(200).json(updated);
    } catch (error) {
        console.error("Error updating subcategory status:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_subcategory = async (req, res) => {
    const { subcategoryid } = req.params;
    const { subcategoryname, categoryid, status } = req.body;

    try {
        if (!subcategoryname || !subcategoryname.trim() || !categoryid) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const isObjectId = mongoose.Types.ObjectId.isValid(subcategoryid);
        const selfQuery = isObjectId ? { _id: subcategoryid } : { subcategoryid: Number(subcategoryid) };
        const existingSelf = await SubCategory.findOne(selfQuery);

        if (!existingSelf) {
            return res.status(404).json({ message: "Sub Category not found" });
        }

        const isCatObjectId = mongoose.Types.ObjectId.isValid(categoryid);
        const catQuery = isCatObjectId ? { _id: categoryid } : { categoryid: Number(categoryid) };
        const categoryDoc = await Category.findOne(catQuery);

        if (!categoryDoc) {
            return res.status(400).json({ message: "Category not found" });
        }

        const trimmedName = subcategoryname.trim();

        const duplicateQuery = {
            _id: { $ne: existingSelf._id },
            categoryid: categoryDoc.categoryid,
            subcategoryname: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") }
        };
        const duplicate = await SubCategory.findOne(duplicateQuery);
        if (duplicate) {
            return res.status(400).json({ message: "Sub Category Already Exists" });
        }

        const categoryChanged = existingSelf.categoryid !== categoryDoc.categoryid;

        existingSelf.subcategoryname = trimmedName;
        existingSelf.categoryid = categoryDoc.categoryid;
        existingSelf.categoryname = categoryDoc.categoryname;
        if (status !== undefined) {
            existingSelf.status = Boolean(status);
        }
        existingSelf.updatedAt = new Date().toISOString();

        await existingSelf.save();

        if (categoryChanged) {
            // When category changes on subcategory, remove subcategory details from items using this subcategory
            await Item.updateMany(
                { subcategoryid: existingSelf.subcategoryid },
                {
                    $set: {
                        subcategoryid: null,
                        subcategoryname: "",
                        updatedAt: new Date().toISOString()
                    }
                }
            );
        } else {
            // When update subcategory name, update subcategory name on items
            await Item.updateMany(
                { subcategoryid: existingSelf.subcategoryid },
                {
                    $set: {
                        subcategoryname: trimmedName,
                        updatedAt: new Date().toISOString()
                    }
                }
            );
        }

        return res.status(200).json({ message: "Sub Category updated successfully", subcategory: existingSelf });
    } catch (error) {
        console.error("Error updating subcategory:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const delete_subcategory = async (req, res) => {
    const { subcategoryid } = req.params;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(subcategoryid);
        const query = isObjectId ? { _id: subcategoryid } : { subcategoryid: Number(subcategoryid) };
        const deleted = await SubCategory.findOneAndDelete(query);

        if (!deleted) {
            return res.status(404).json({ message: "Sub Category not found" });
        }

        // Remove subcategory details from items that used this subcategory
        await Item.updateMany(
            { subcategoryid: deleted.subcategoryid },
            {
                $set: {
                    subcategoryid: null,
                    subcategoryname: "",
                    updatedAt: new Date().toISOString()
                }
            }
        );

        return res.status(200).json({ message: "Sub Category deleted successfully" });
    } catch (error) {
        console.error("Error deleting subcategory:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    get_subcategories,
    get_active_subcategories,
    add_subcategory,
    edit_subcategory,
    update_subcategory_status,
    update_subcategory,
    delete_subcategory
};