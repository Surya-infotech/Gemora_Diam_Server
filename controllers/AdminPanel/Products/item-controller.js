const Item = require("../../../models/AdminPanel/Products/item-model");
const Category = require("../../../models/AdminPanel/Attributes/category-model");
const mongoose = require("mongoose");
const { uploadToS3, deleteImageFromS3 } = require("../../../utils/s3Config-admin");

const get_items = async (req, res) => {
    try {
        const items = await Item.find().sort({ updatedAt: -1 }).lean();
        return res.status(200).json({ items });
    } catch (error) {
        console.error("Error fetching items:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const get_active_items = async (req, res) => {
    try {
        const items = await Item.find({ status: true }).sort({ itemname: 1 }).lean();
        return res.status(200).json(items);
    } catch (error) {
        console.error("Error fetching active items:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const add_item = async (req, res) => {
    uploadToS3("item")(req, res, async function (err) {
        if (err) {
            console.error("Error uploading item image:", err);
            return res.status(400).json({ message: err.message || "Error uploading image" });
        }

        try {
            const { itemname, categoryid, description } = req.body;

            if (!itemname || !itemname.trim()) {
                if (req.file && req.file.location) {
                    await deleteImageFromS3(req.file.location, "item");
                }
                return res.status(400).json({ message: "Item Name is required" });
            }

            if (!categoryid) {
                if (req.file && req.file.location) {
                    await deleteImageFromS3(req.file.location, "item");
                }
                return res.status(400).json({ message: "Category is required" });
            }

            if (!req.file || !req.file.location) {
                return res.status(400).json({ message: "Image is required" });
            }

            const trimmedName = itemname.trim();

            const existingItem = await Item.findOne({
                itemname: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") }
            });

            if (existingItem) {
                if (req.file && req.file.location) {
                    await deleteImageFromS3(req.file.location, "item");
                }
                return res.status(400).json({ message: "Item Already Exists" });
            }

            // Find category details
            const isCatObjectId = mongoose.Types.ObjectId.isValid(categoryid);
            const catQuery = isCatObjectId ? { _id: categoryid } : { categoryid: Number(categoryid) };
            const categoryDoc = await Category.findOne(catQuery);

            const categoryNameResolved = categoryDoc ? categoryDoc.categoryname : (req.body.categoryname || "");
            const categoryIdResolved = categoryDoc ? categoryDoc.categoryid : Number(categoryid) || 0;

            const maxItem = await Item.findOne().sort({ itemid: -1 });
            const nextItemId = maxItem ? parseInt(maxItem.itemid) + 1 : 1;

            const now = new Date().toISOString();
            const imageUrl = req.file ? req.file.location : (req.body.image || "");

            const newItem = new Item({
                itemid: nextItemId,
                itemname: trimmedName,
                categoryid: categoryIdResolved,
                categoryname: categoryNameResolved,
                description: description ? description.trim() : "",
                image: imageUrl,
                status: true,
                createdAt: now,
                updatedAt: now
            });

            await newItem.save();
            return res.status(201).json({ message: "Item added successfully", item: newItem });
        } catch (error) {
            console.error("Error adding item:", error);
            if (req.file && req.file.location) {
                await deleteImageFromS3(req.file.location, "item");
            }
            return res.status(500).json({ message: "Server error" });
        }
    });
};

const edit_item = async (req, res) => {
    const { itemid } = req.params;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(itemid);
        const query = isObjectId ? { _id: itemid } : { itemid: Number(itemid) };
        const item = await Item.findOne(query);

        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }
        return res.status(200).json(item);
    } catch (error) {
        console.error("Error fetching item details:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_item_status = async (req, res) => {
    const { itemid } = req.params;
    const { status } = req.body;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(itemid);
        const query = isObjectId ? { _id: itemid } : { itemid: Number(itemid) };
        const updated = await Item.findOneAndUpdate(
            query,
            { status: Boolean(status), updatedAt: new Date().toISOString() },
            { returnDocument: "after" }
        );

        if (!updated) {
            return res.status(404).json({ message: "Item not found" });
        }
        return res.status(200).json(updated);
    } catch (error) {
        console.error("Error updating item status:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_item = async (req, res) => {
    uploadToS3("item")(req, res, async function (err) {
        if (err) {
            console.error("Error uploading item image:", err);
            return res.status(400).json({ message: err.message || "Error uploading image" });
        }

        try {
            const { itemid } = req.params;
            const { itemname, categoryid, description, status } = req.body;

            const isObjectId = mongoose.Types.ObjectId.isValid(itemid);
            const selfQuery = isObjectId ? { _id: itemid } : { itemid: Number(itemid) };
            const existingItem = await Item.findOne(selfQuery);

            if (!existingItem) {
                if (req.file && req.file.location) {
                    await deleteImageFromS3(req.file.location, "item");
                }
                return res.status(404).json({ message: "Item not found" });
            }

            if (!itemname || !itemname.trim()) {
                if (req.file && req.file.location) {
                    await deleteImageFromS3(req.file.location, "item");
                }
                return res.status(400).json({ message: "Item Name is required" });
            }

            if (!existingItem.image && (!req.file || !req.file.location)) {
                return res.status(400).json({ message: "Image is required" });
            }

            const trimmedName = itemname.trim();

            const duplicateQuery = {
                _id: { $ne: existingItem._id },
                itemname: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") }
            };
            const duplicate = await Item.findOne(duplicateQuery);
            if (duplicate) {
                if (req.file && req.file.location) {
                    await deleteImageFromS3(req.file.location, "item");
                }
                return res.status(400).json({ message: "Item Already Exists" });
            }

            if (categoryid) {
                const isCatObjectId = mongoose.Types.ObjectId.isValid(categoryid);
                const catQuery = isCatObjectId ? { _id: categoryid } : { categoryid: Number(categoryid) };
                const categoryDoc = await Category.findOne(catQuery);
                if (categoryDoc) {
                    existingItem.categoryid = categoryDoc.categoryid;
                    existingItem.categoryname = categoryDoc.categoryname;
                }
            }

            existingItem.itemname = trimmedName;
            if (description !== undefined) {
                existingItem.description = description ? description.trim() : "";
            }
            if (status !== undefined) {
                existingItem.status = (status === true || status === "true" || status === 1 || status === "1");
            }

            if (req.file && req.file.location) {
                if (existingItem.image) {
                    await deleteImageFromS3(existingItem.image, "item");
                }
                existingItem.image = req.file.location;
            }

            existingItem.updatedAt = new Date().toISOString();
            await existingItem.save();

            return res.status(200).json({ message: "Item updated successfully", item: existingItem });
        } catch (error) {
            console.error("Error updating item:", error);
            if (req.file && req.file.location) {
                await deleteImageFromS3(req.file.location, "item");
            }
            return res.status(500).json({ message: "Server error" });
        }
    });
};

const delete_item = async (req, res) => {
    const { itemid } = req.params;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(itemid);
        const query = isObjectId ? { _id: itemid } : { itemid: Number(itemid) };
        const item = await Item.findOne(query);

        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }

        if (item.image) {
            await deleteImageFromS3(item.image, "item");
        }

        await Item.deleteOne({ _id: item._id });
        return res.status(200).json({ message: "Item deleted successfully" });
    } catch (error) {
        console.error("Error deleting item:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    get_items,
    get_active_items,
    add_item,
    edit_item,
    update_item_status,
    update_item,
    delete_item
};