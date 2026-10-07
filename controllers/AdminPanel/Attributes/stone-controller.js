const Stone = require("../../../models/AdminPanel/Attributes/stone-model");
const Item = require("../../../models/AdminPanel/Products/item-model");
const mongoose = require("mongoose");

const get_stones = async (_req, res) => {
    try {
        const stones = await Stone.find().sort({ updatedAt: -1 }).lean();
        return res.status(200).json({ stones });
    } catch (error) {
        console.error("Error fetching stones:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const get_active_stones = async (_req, res) => {
    try {
        const stones = await Stone.find({ status: true }).sort({ stonename: 1 }).lean();
        return res.status(200).json(stones);
    } catch (error) {
        console.error("Error fetching active stones:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const add_stone = async (req, res) => {
    try {
        const { stonename } = req.body;

        if (!stonename || !stonename.trim()) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const trimmedName = stonename.trim();

        const existing = await Stone.findOne({
            stonename: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") }
        });
        if (existing) {
            return res.status(400).json({ message: "Stone Already Exists" });
        }

        const maxItem = await Stone.findOne().sort({ stoneid: -1 });
        const nextId = maxItem ? parseInt(maxItem.stoneid) + 1 : 1;

        const now = new Date().toISOString();
        const newStone = new Stone({
            stoneid: nextId,
            stonename: trimmedName,
            status: true,
            createdAt: now,
            updatedAt: now
        });

        await newStone.save();
        return res.status(201).json({ message: "Stone added successfully", stone: newStone });
    } catch (error) {
        console.error("Error adding stone:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const edit_stone = async (req, res) => {
    const { stoneid } = req.params;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(stoneid);
        const query = isObjectId ? { _id: stoneid } : { stoneid: Number(stoneid) };
        const item = await Stone.findOne(query);

        if (!item) {
            return res.status(404).json({ message: "Stone not found" });
        }
        return res.status(200).json(item);
    } catch (error) {
        console.error("Error fetching stone details:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_stone_status = async (req, res) => {
    const { stoneid } = req.params;
    const { status } = req.body;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(stoneid);
        const query = isObjectId ? { _id: stoneid } : { stoneid: Number(stoneid) };
        const updated = await Stone.findOneAndUpdate(
            query,
            { status: Boolean(status), updatedAt: new Date().toISOString() },
            { returnDocument: "after" }
        );

        if (!updated) {
            return res.status(404).json({ message: "Stone not found" });
        }
        return res.status(200).json(updated);
    } catch (error) {
        console.error("Error updating stone status:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_stone = async (req, res) => {
    const { stoneid } = req.params;
    const { stonename, status } = req.body;

    try {
        if (!stonename || !stonename.trim()) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const isObjectId = mongoose.Types.ObjectId.isValid(stoneid);
        const selfQuery = isObjectId ? { _id: stoneid } : { stoneid: Number(stoneid) };
        const existingSelf = await Stone.findOne(selfQuery);

        if (!existingSelf) {
            return res.status(404).json({ message: "Stone not found" });
        }

        const trimmedName = stonename.trim();

        const duplicateQuery = {
            _id: { $ne: existingSelf._id },
            stonename: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") }
        };
        const duplicate = await Stone.findOne(duplicateQuery);
        if (duplicate) {
            return res.status(400).json({ message: "Stone Already Exists" });
        }

        existingSelf.stonename = trimmedName;
        if (status !== undefined) {
            existingSelf.status = Boolean(status);
        }
        existingSelf.updatedAt = new Date().toISOString();

        await existingSelf.save();

        // Update stone in Item table
        const targetStoneId = existingSelf.stoneid;
        if (targetStoneId !== undefined && targetStoneId !== null) {
            await Item.updateMany(
                {
                    "stones.stoneid": {
                        $in: [Number(targetStoneId), String(targetStoneId)]
                    }
                },
                {
                    $set: {
                        "stones.$[elem].stonename": trimmedName,
                        updatedAt: new Date().toISOString()
                    }
                },
                {
                    arrayFilters: [
                        {
                            "elem.stoneid": {
                                $in: [Number(targetStoneId), String(targetStoneId)]
                            }
                        }
                    ]
                }
            );
        }

        return res.status(200).json({ message: "Stone updated successfully", stone: existingSelf });
    } catch (error) {
        console.error("Error updating stone:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const delete_stone = async (req, res) => {
    const { stoneid } = req.params;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(stoneid);
        const query = isObjectId ? { _id: stoneid } : { stoneid: Number(stoneid) };
        const deleted = await Stone.findOneAndDelete(query);

        if (!deleted) {
            return res.status(404).json({ message: "Stone not found" });
        }

        // Remove stone details from all items containing this stone
        const deletedStoneId = deleted.stoneid;
        if (deletedStoneId !== undefined && deletedStoneId !== null) {
            await Item.updateMany(
                {
                    "stones.stoneid": {
                        $in: [Number(deletedStoneId), String(deletedStoneId)]
                    }
                },
                {
                    $pull: {
                        stones: {
                            stoneid: {
                                $in: [Number(deletedStoneId), String(deletedStoneId)]
                            }
                        }
                    },
                    $set: {
                        updatedAt: new Date().toISOString()
                    }
                }
            );
        }

        return res.status(200).json({ message: "Stone deleted successfully" });
    } catch (error) {
        console.error("Error deleting stone:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    get_stones,
    get_active_stones,
    add_stone,
    edit_stone,
    update_stone_status,
    update_stone,
    delete_stone
};
