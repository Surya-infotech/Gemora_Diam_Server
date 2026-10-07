const Item = require("../../../models/AdminPanel/Products/item-model");
const Category = require("../../../models/AdminPanel/Attributes/category-model");
const SubCategory = require("../../../models/AdminPanel/Attributes/subcategory-model");
const mongoose = require("mongoose");
const { uploadToS3, deleteImageFromS3 } = require("../../../utils/s3Config-admin");
const MiscSetting = require("../../../models/AdminPanel/System/Setting/miscsetting-model");

const get_items = async (_req, res) => {
    try {
        const items = await Item.find().sort({ updatedAt: -1 }).lean();
        return res.status(200).json({ items });
    } catch (error) {
        console.error("Error fetching items:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const get_active_items = async (_req, res) => {
    try {
        const items = await Item.find({ status: "Published" }).sort({ itemname: 1 }).lean();
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

            let subcategoryIdResolved = null;
            let subcategoryNameResolved = "";
            if (req.body.subcategoryid) {
                const isSubCatObjectId = mongoose.Types.ObjectId.isValid(req.body.subcategoryid);
                const subCatQuery = isSubCatObjectId ? { _id: req.body.subcategoryid } : { subcategoryid: Number(req.body.subcategoryid) };
                const subCategoryDoc = await SubCategory.findOne(subCatQuery);
                if (subCategoryDoc) {
                    subcategoryIdResolved = subCategoryDoc.subcategoryid;
                    subcategoryNameResolved = subCategoryDoc.subcategoryname;
                }
            }

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
                subcategoryid: subcategoryIdResolved,
                subcategoryname: subcategoryNameResolved,
                ringsizes: formattedRingSizes,
                shapes: formattedShapes,
                clarities: formattedClarities,
                diamondcolors: formattedDiamondColors,
                bandcolors: formattedBandColors,
                stones: formattedStones,
                styles: formattedStyles,
                description: description ? description.trim() : "",
                image: imageUrl,
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

        const miscSetting = await MiscSetting.findOne().lean();
        const itemObj = item.toObject ? item.toObject() : { ...item };
        if (miscSetting) {
            itemObj.miscSettings = {
                timeZone: miscSetting.timeZone,
                dateFormat: miscSetting.dateFormat,
                timeFormat: miscSetting.timeFormat
            };
        }

        return res.status(200).json(itemObj);
    } catch (error) {
        console.error("Error fetching item details:", error);
        return res.status(500).json({ message: "Server error" });
    }
};


const update_item = async (req, res) => {
    uploadToS3("item")(req, res, async function (err) {
        if (err) {
            console.error("Error uploading item image:", err);
            return res.status(400).json({ message: err.message || "Error uploading image" });
        }

        const { itemid } = req.params;
        const { sku, itemname, categoryid, description } = req.body;

        try {
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

            if (req.body.subcategoryid !== undefined) {
                if (req.body.subcategoryid) {
                    const isSubCatObjectId = mongoose.Types.ObjectId.isValid(req.body.subcategoryid);
                    const subCatQuery = isSubCatObjectId ? { _id: req.body.subcategoryid } : { subcategoryid: Number(req.body.subcategoryid) };
                    const subCategoryDoc = await SubCategory.findOne(subCatQuery);
                    if (subCategoryDoc && subCategoryDoc.categoryid === existingItem.categoryid) {
                        existingItem.subcategoryid = subCategoryDoc.subcategoryid;
                        existingItem.subcategoryname = subCategoryDoc.subcategoryname;
                    } else {
                        existingItem.subcategoryid = null;
                        existingItem.subcategoryname = "";
                    }
                } else {
                    existingItem.subcategoryid = null;
                    existingItem.subcategoryname = "";
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

const update_item_price = async (req, res) => {
    const { itemid } = req.params;
    const {
        priceType,
        metalWisePrices,
        metalWithDiamondCaratPrices,
        metalWithStonePrices,
        metalWithStoneDiamondCaratPrices
    } = req.body;

    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(itemid);
        const query = isObjectId ? { _id: itemid } : { itemid: Number(itemid) };
        const existingItem = await Item.findOne(query);

        if (!existingItem) {
            return res.status(404).json({ message: "Item not found" });
        }

        const validTypes = ['metal_wise', 'metal_with_diamond_carat', 'metal_with_stone', 'metal_with_stone_diamond_carat'];
        if (!priceType || !validTypes.includes(priceType)) {
            return res.status(400).json({ message: "Invalid price type" });
        }

        if (priceType === 'metal_wise') {
            if (!Array.isArray(metalWisePrices) || metalWisePrices.length === 0) {
                return res.status(400).json({ message: "At least one metal price is required" });
            }
            for (const item of metalWisePrices) {
                if (!item.metalid || item.price === undefined || item.price === null || item.price === "" || Number(item.price) < 0) {
                    return res.status(400).json({ message: "All metal price fields are required and must be valid" });
                }
            }
        }

        if (priceType === 'metal_with_diamond_carat') {
            if (!Array.isArray(metalWithDiamondCaratPrices) || metalWithDiamondCaratPrices.length === 0) {
                return res.status(400).json({ message: "At least one metal configuration is required" });
            }
            for (const mg of metalWithDiamondCaratPrices) {
                if (!mg.metalid) {
                    return res.status(400).json({ message: "Metal is required for all sections" });
                }
                if (!Array.isArray(mg.caratPrices) || mg.caratPrices.length === 0) {
                    return res.status(400).json({ message: "At least one diamond carat price is required per metal" });
                }
                for (const cp of mg.caratPrices) {
                    if (!cp.diamondsizeid || cp.price === undefined || cp.price === null || cp.price === "" || Number(cp.price) < 0) {
                        return res.status(400).json({ message: "All diamond carat price fields are required and must be valid" });
                    }
                }
            }
        }

        if (priceType === 'metal_with_stone') {
            if (!Array.isArray(metalWithStonePrices) || metalWithStonePrices.length === 0) {
                return res.status(400).json({ message: "At least one metal configuration is required" });
            }
            for (const mg of metalWithStonePrices) {
                if (!mg.metalid) {
                    return res.status(400).json({ message: "Metal is required for all sections" });
                }
                if (!Array.isArray(mg.stonePrices) || mg.stonePrices.length === 0) {
                    return res.status(400).json({ message: "At least one stone price is required per metal" });
                }
                for (const sp of mg.stonePrices) {
                    if (!sp.stoneid || sp.price === undefined || sp.price === null || sp.price === "" || Number(sp.price) < 0) {
                        return res.status(400).json({ message: "All stone price fields are required and must be valid" });
                    }
                }
            }
        }

        if (priceType === 'metal_with_stone_diamond_carat') {
            if (!Array.isArray(metalWithStoneDiamondCaratPrices) || metalWithStoneDiamondCaratPrices.length === 0) {
                return res.status(400).json({ message: "At least one metal and stone configuration is required" });
            }
            for (const msg of metalWithStoneDiamondCaratPrices) {
                if (!msg.metalid) {
                    return res.status(400).json({ message: "Metal is required for all sections" });
                }
                if (!msg.stoneid) {
                    return res.status(400).json({ message: "Stone is required for all sections" });
                }
                if (!Array.isArray(msg.caratPrices) || msg.caratPrices.length === 0) {
                    return res.status(400).json({ message: "At least one diamond carat price is required per configuration" });
                }
                for (const cp of msg.caratPrices) {
                    if (!cp.diamondsizeid || cp.price === undefined || cp.price === null || cp.price === "" || Number(cp.price) < 0) {
                        return res.status(400).json({ message: "All diamond carat price fields are required and must be valid" });
                    }
                }
            }
        }

        existingItem.pricing = {
            priceType,
            metalWisePrices: (priceType === 'metal_wise' && Array.isArray(metalWisePrices))
                ? metalWisePrices.map(m => ({
                    metalid: Number(m.metalid),
                    metalname: String(m.metalname || ""),
                    metaltype: String(m.metaltype || ""),
                    price: Number(m.price)
                }))
                : [],
            metalWithDiamondCaratPrices: (priceType === 'metal_with_diamond_carat' && Array.isArray(metalWithDiamondCaratPrices))
                ? metalWithDiamondCaratPrices.map(mg => ({
                    metalid: Number(mg.metalid),
                    metalname: String(mg.metalname || ""),
                    metaltype: String(mg.metaltype || ""),
                    caratPrices: Array.isArray(mg.caratPrices) ? mg.caratPrices.map(cp => ({
                        diamondsizeid: Number(cp.diamondsizeid),
                        diamondsize: String(cp.diamondsize || ""),
                        price: Number(cp.price)
                    })) : []
                }))
                : [],
            metalWithStonePrices: (priceType === 'metal_with_stone' && Array.isArray(metalWithStonePrices))
                ? metalWithStonePrices.map(mg => ({
                    metalid: Number(mg.metalid),
                    metalname: String(mg.metalname || ""),
                    metaltype: String(mg.metaltype || ""),
                    stonePrices: Array.isArray(mg.stonePrices) ? mg.stonePrices.map(sp => ({
                        stoneid: Number(sp.stoneid),
                        stonename: String(sp.stonename || ""),
                        price: Number(sp.price)
                    })) : []
                }))
                : [],
            metalWithStoneDiamondCaratPrices: (priceType === 'metal_with_stone_diamond_carat' && Array.isArray(metalWithStoneDiamondCaratPrices))
                ? metalWithStoneDiamondCaratPrices.map(msg => ({
                    metalid: Number(msg.metalid),
                    metalname: String(msg.metalname || ""),
                    metaltype: String(msg.metaltype || ""),
                    stoneid: Number(msg.stoneid),
                    stonename: String(msg.stonename || ""),
                    caratPrices: Array.isArray(msg.caratPrices) ? msg.caratPrices.map(cp => ({
                        diamondsizeid: Number(cp.diamondsizeid),
                        diamondsize: String(cp.diamondsize || ""),
                        price: Number(cp.price)
                    })) : []
                }))
                : []
        };

        existingItem.updatedAt = new Date().toISOString();
        await existingItem.save();

        return res.status(200).json({
            message: "Item price updated successfully",
            pricing: existingItem.pricing,
            item: existingItem
        });
    } catch (error) {
        console.error("Error updating item price:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    get_items,
    get_active_items,
    add_item,
    edit_item,
    update_item,
    delete_item,
    update_item_price
};