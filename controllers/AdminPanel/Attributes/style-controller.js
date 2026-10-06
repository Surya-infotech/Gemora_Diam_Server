const Style = require("../../../models/AdminPanel/Attributes/style-model");
const Item = require("../../../models/AdminPanel/Products/item-model");
const mongoose = require("mongoose");

const get_styles = async (req, res) => {
    try {
        const styles = await Style.find().sort({ updatedAt: -1 }).lean();
        return res.status(200).json({ styles });
    } catch (error) {
        console.error("Error fetching styles:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const get_active_styles = async (req, res) => {
    try {
        const styles = await Style.find({ status: true }).sort({ stylename: 1 }).lean();
        return res.status(200).json(styles);
    } catch (error) {
        console.error("Error fetching active styles:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const add_style = async (req, res) => {
    try {
        const { stylename } = req.body;

        if (!stylename || !stylename.trim()) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const trimmedName = stylename.trim();

        const existing = await Style.findOne({
            stylename: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") }
        });
        if (existing) {
            return res.status(400).json({ message: "Style Already Exists" });
        }

        const maxItem = await Style.findOne().sort({ styleid: -1 });
        const nextId = maxItem ? parseInt(maxItem.styleid) + 1 : 1;

        const now = new Date().toISOString();
        const newStyle = new Style({
            styleid: nextId,
            stylename: trimmedName,
            status: true,
            createdAt: now,
            updatedAt: now
        });

        await newStyle.save();
        return res.status(201).json({ message: "Style added successfully", style: newStyle });
    } catch (error) {
        console.error("Error adding style:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const edit_style = async (req, res) => {
    const { styleid } = req.params;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(styleid);
        const query = isObjectId ? { _id: styleid } : { styleid: Number(styleid) };
        const item = await Style.findOne(query);

        if (!item) {
            return res.status(404).json({ message: "Style not found" });
        }
        return res.status(200).json(item);
    } catch (error) {
        console.error("Error fetching style details:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_style_status = async (req, res) => {
    const { styleid } = req.params;
    const { status } = req.body;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(styleid);
        const query = isObjectId ? { _id: styleid } : { styleid: Number(styleid) };
        const updated = await Style.findOneAndUpdate(
            query,
            { status: Boolean(status), updatedAt: new Date().toISOString() },
            { returnDocument: "after" }
        );

        if (!updated) {
            return res.status(404).json({ message: "Style not found" });
        }
        return res.status(200).json(updated);
    } catch (error) {
        console.error("Error updating style status:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_style = async (req, res) => {
    const { styleid } = req.params;
    const { stylename, status } = req.body;

    try {
        if (!stylename || !stylename.trim()) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const isObjectId = mongoose.Types.ObjectId.isValid(styleid);
        const selfQuery = isObjectId ? { _id: styleid } : { styleid: Number(styleid) };
        const existingSelf = await Style.findOne(selfQuery);

        if (!existingSelf) {
            return res.status(404).json({ message: "Style not found" });
        }

        const trimmedName = stylename.trim();

        const duplicateQuery = {
            _id: { $ne: existingSelf._id },
            stylename: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") }
        };
        const duplicate = await Style.findOne(duplicateQuery);
        if (duplicate) {
            return res.status(400).json({ message: "Style Already Exists" });
        }

        existingSelf.stylename = trimmedName;
        if (status !== undefined) {
            existingSelf.status = Boolean(status);
        }
        existingSelf.updatedAt = new Date().toISOString();

        await existingSelf.save();

        // Update style in Item table
        const targetStyleId = existingSelf.styleid;
        if (targetStyleId !== undefined && targetStyleId !== null) {
            await Item.updateMany(
                {
                    "styles.styleid": {
                        $in: [Number(targetStyleId), String(targetStyleId)]
                    }
                },
                {
                    $set: {
                        "styles.$[elem].stylename": trimmedName,
                        updatedAt: new Date().toISOString()
                    }
                },
                {
                    arrayFilters: [
                        {
                            "elem.styleid": {
                                $in: [Number(targetStyleId), String(targetStyleId)]
                            }
                        }
                    ]
                }
            );
        }

        return res.status(200).json({ message: "Style updated successfully", style: existingSelf });
    } catch (error) {
        console.error("Error updating style:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const delete_style = async (req, res) => {
    const { styleid } = req.params;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(styleid);
        const query = isObjectId ? { _id: styleid } : { styleid: Number(styleid) };
        const deleted = await Style.findOneAndDelete(query);

        if (!deleted) {
            return res.status(404).json({ message: "Style not found" });
        }

        // Remove style details from all items containing this style
        const deletedStyleId = deleted.styleid;
        if (deletedStyleId !== undefined && deletedStyleId !== null) {
            await Item.updateMany(
                {
                    "styles.styleid": {
                        $in: [Number(deletedStyleId), String(deletedStyleId)]
                    }
                },
                {
                    $pull: {
                        styles: {
                            styleid: {
                                $in: [Number(deletedStyleId), String(deletedStyleId)]
                            }
                        }
                    },
                    $set: {
                        updatedAt: new Date().toISOString()
                    }
                }
            );
        }

        return res.status(200).json({ message: "Style deleted successfully" });
    } catch (error) {
        console.error("Error deleting style:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    get_styles,
    get_active_styles,
    add_style,
    edit_style,
    update_style_status,
    update_style,
    delete_style
};
