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
            const { sku, itemname, categoryid, description } = req.body;

            if (!sku || !sku.trim()) {
                if (req.file && req.file.location) {
                    await deleteImageFromS3(req.file.location, "item");
                }
                return res.status(400).json({ message: "SKU is required" });
            }

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

            const trimmedSku = sku.trim();
            const trimmedName = itemname.trim();

            const existingSku = await Item.findOne({
                sku: { $regex: new RegExp(`^${trimmedSku.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") }
            });

            if (existingSku) {
                if (req.file && req.file.location) {
                    await deleteImageFromS3(req.file.location, "item");
                }
                return res.status(400).json({ message: "SKU Already Exists" });
            }

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

            let parsedRingSizes = [];
            if (req.body.ringsizes) {
                try {
                    parsedRingSizes = typeof req.body.ringsizes === "string" ? JSON.parse(req.body.ringsizes) : req.body.ringsizes;
                } catch {
                    parsedRingSizes = [];
                }
            }
            const formattedRingSizes = Array.isArray(parsedRingSizes) ? parsedRingSizes.map(r => ({
                ringsizeid: Number(r.ringsizeid || r.value),
                ringsize: String(r.ringsize || r.label || "")
            })) : [];

            let parsedShapes = [];
            if (req.body.shapes) {
                try {
                    parsedShapes = typeof req.body.shapes === "string" ? JSON.parse(req.body.shapes) : req.body.shapes;
                } catch {
                    parsedShapes = [];
                }
            }
            const formattedShapes = Array.isArray(parsedShapes) ? parsedShapes.map(s => ({
                shapeid: Number(s.shapeid || s.value),
                shapename: String(s.shapename || s.label || "")
            })) : [];

            let parsedClarities = [];
            if (req.body.clarities) {
                try {
                    parsedClarities = typeof req.body.clarities === "string" ? JSON.parse(req.body.clarities) : req.body.clarities;
                } catch {
                    parsedClarities = [];
                }
            }
            const formattedClarities = Array.isArray(parsedClarities) ? parsedClarities.map(c => ({
                clarityid: Number(c.clarityid || c.value),
                clarityname: String(c.clarityname || c.label || "")
            })) : [];

            let parsedDiamondColors = [];
            if (req.body.diamondcolors) {
                try {
                    parsedDiamondColors = typeof req.body.diamondcolors === "string" ? JSON.parse(req.body.diamondcolors) : req.body.diamondcolors;
                } catch {
                    parsedDiamondColors = [];
                }
            }
            const formattedDiamondColors = Array.isArray(parsedDiamondColors) ? parsedDiamondColors.map(dc => ({
                colorid: Number(dc.colorid || dc.value),
                colorname: String(dc.colorname || dc.label || "")
            })) : [];

            let parsedBandColors = [];
            if (req.body.bandcolors) {
                try {
                    parsedBandColors = typeof req.body.bandcolors === "string" ? JSON.parse(req.body.bandcolors) : req.body.bandcolors;
                } catch {
                    parsedBandColors = [];
                }
            }
            const formattedBandColors = Array.isArray(parsedBandColors) ? parsedBandColors.map(bc => ({
                colorid: Number(bc.colorid || bc.value),
                colorname: String(bc.colorname || bc.label || "")
            })) : [];


            let parsedStones = [];
            if (req.body.stones) {
                try {
                    parsedStones = typeof req.body.stones === "string" ? JSON.parse(req.body.stones) : req.body.stones;
                } catch {
                    parsedStones = [];
                }
            }
            const formattedStones = Array.isArray(parsedStones) ? parsedStones.map(s => ({
                stoneid: Number(s.stoneid || s.value),
                stonename: String(s.stonename || s.label || "")
            })) : [];

            let parsedStyles = [];
            if (req.body.styles) {
                try {
                    parsedStyles = typeof req.body.styles === "string" ? JSON.parse(req.body.styles) : req.body.styles;
                } catch {
                    parsedStyles = [];
                }
            }
            const formattedStyles = Array.isArray(parsedStyles) ? parsedStyles.map(st => ({
                styleid: Number(st.styleid || st.value),
                stylename: String(st.stylename || st.label || "")
            })) : [];

            const now = new Date().toISOString();
            const imageUrl = req.file ? req.file.location : (req.body.image || "");

            const newItem = new Item({
                itemid: nextItemId,
                sku: trimmedSku,
                itemname: trimmedName,
                categoryid: categoryIdResolved,
                categoryname: categoryNameResolved,
                ringsizes: formattedRingSizes,
                shapes: formattedShapes,
                clarities: formattedClarities,
                diamondcolors: formattedDiamondColors,
                bandcolors: formattedBandColors,
                stones: formattedStones,
                styles: formattedStyles,
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
            const { sku, itemname, categoryid, description, status } = req.body;

            const isObjectId = mongoose.Types.ObjectId.isValid(itemid);
            const selfQuery = isObjectId ? { _id: itemid } : { itemid: Number(itemid) };
            const existingItem = await Item.findOne(selfQuery);

            if (!existingItem) {
                if (req.file && req.file.location) {
                    await deleteImageFromS3(req.file.location, "item");
                }
                return res.status(404).json({ message: "Item not found" });
            }

            if (!sku || !sku.trim()) {
                if (req.file && req.file.location) {
                    await deleteImageFromS3(req.file.location, "item");
                }
                return res.status(400).json({ message: "SKU is required" });
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

            const trimmedSku = sku.trim();
            const trimmedName = itemname.trim();

            const duplicateSku = await Item.findOne({
                _id: { $ne: existingItem._id },
                sku: { $regex: new RegExp(`^${trimmedSku.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") }
            });
            if (duplicateSku) {
                if (req.file && req.file.location) {
                    await deleteImageFromS3(req.file.location, "item");
                }
                return res.status(400).json({ message: "SKU Already Exists" });
            }

            const duplicateName = await Item.findOne({
                _id: { $ne: existingItem._id },
                itemname: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") }
            });
            if (duplicateName) {
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

            existingItem.sku = trimmedSku;
            existingItem.itemname = trimmedName;
            if (description !== undefined) {
                existingItem.description = description ? description.trim() : "";
            }
            if (req.body.ringsizes !== undefined) {
                let parsedRingSizes = [];
                try {
                    parsedRingSizes = typeof req.body.ringsizes === "string" ? JSON.parse(req.body.ringsizes) : req.body.ringsizes;
                } catch {
                    parsedRingSizes = [];
                }
                const formattedRingSizes = Array.isArray(parsedRingSizes) ? parsedRingSizes.map(r => ({
                    ringsizeid: Number(r.ringsizeid || r.value),
                    ringsize: String(r.ringsize || r.label || "")
                })) : [];

                existingItem.ringsizes = formattedRingSizes;
            }
            if (req.body.shapes !== undefined) {
                let parsedShapes = [];
                try {
                    parsedShapes = typeof req.body.shapes === "string" ? JSON.parse(req.body.shapes) : req.body.shapes;
                } catch {
                    parsedShapes = [];
                }
                const formattedShapes = Array.isArray(parsedShapes) ? parsedShapes.map(s => ({
                    shapeid: Number(s.shapeid || s.value),
                    shapename: String(s.shapename || s.label || "")
                })) : [];

                existingItem.shapes = formattedShapes;
            }
            if (req.body.clarities !== undefined) {
                let parsedClarities = [];
                try {
                    parsedClarities = typeof req.body.clarities === "string" ? JSON.parse(req.body.clarities) : req.body.clarities;
                } catch {
                    parsedClarities = [];
                }
                const formattedClarities = Array.isArray(parsedClarities) ? parsedClarities.map(c => ({
                    clarityid: Number(c.clarityid || c.value),
                    clarityname: String(c.clarityname || c.label || "")
                })) : [];

                existingItem.clarities = formattedClarities;
            }
            if (req.body.diamondcolors !== undefined) {
                let parsedDiamondColors = [];
                try {
                    parsedDiamondColors = typeof req.body.diamondcolors === "string" ? JSON.parse(req.body.diamondcolors) : req.body.diamondcolors;
                } catch {
                    parsedDiamondColors = [];
                }
                const formattedDiamondColors = Array.isArray(parsedDiamondColors) ? parsedDiamondColors.map(dc => ({
                    colorid: Number(dc.colorid || dc.value),
                    colorname: String(dc.colorname || dc.label || "")
                })) : [];

                existingItem.diamondcolors = formattedDiamondColors;
            }
            if (req.body.bandcolors !== undefined) {
                let parsedBandColors = [];
                try {
                    parsedBandColors = typeof req.body.bandcolors === "string" ? JSON.parse(req.body.bandcolors) : req.body.bandcolors;
                } catch {
                    parsedBandColors = [];
                }
                const formattedBandColors = Array.isArray(parsedBandColors) ? parsedBandColors.map(bc => ({
                    colorid: Number(bc.colorid || bc.value),
                    colorname: String(bc.colorname || bc.label || "")
                })) : [];

                existingItem.bandcolors = formattedBandColors;
            }
            if (req.body.stones !== undefined) {
                let parsedStones = [];
                try {
                    parsedStones = typeof req.body.stones === "string" ? JSON.parse(req.body.stones) : req.body.stones;
                } catch {
                    parsedStones = [];
                }
                const formattedStones = Array.isArray(parsedStones) ? parsedStones.map(s => ({
                    stoneid: Number(s.stoneid || s.value),
                    stonename: String(s.stonename || s.label || "")
                })) : [];

                existingItem.stones = formattedStones;
            }
            if (req.body.styles !== undefined) {
                let parsedStyles = [];
                try {
                    parsedStyles = typeof req.body.styles === "string" ? JSON.parse(req.body.styles) : req.body.styles;
                } catch {
                    parsedStyles = [];
                }
                const formattedStyles = Array.isArray(parsedStyles) ? parsedStyles.map(st => ({
                    styleid: Number(st.styleid || st.value),
                    stylename: String(st.stylename || st.label || "")
                })) : [];

                existingItem.styles = formattedStyles;
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