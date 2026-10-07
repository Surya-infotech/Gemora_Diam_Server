const Shape = require("../../../models/AdminPanel/Attributes/shape-model");
const Item = require("../../../models/AdminPanel/Products/item-model");
const mongoose = require("mongoose");

const get_shapes = async (_req, res) => {
    try {
        const shapes = await Shape.find().sort({ updatedAt: -1 }).lean();
        return res.status(200).json({ shapes });
    } catch (error) {
        console.error("Error fetching shapes:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const get_active_shapes = async (_req, res) => {
    try {
        const shapes = await Shape.find({ status: true }).sort({ shapename: 1 }).lean();
        return res.status(200).json(shapes);
    } catch (error) {
        console.error("Error fetching active shapes:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const add_shape = async (req, res) => {
    try {
        const { shapename } = req.body;

        if (!shapename || !shapename.trim()) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const trimmedName = shapename.trim();

        const existing = await Shape.findOne({
            shapename: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") }
        });
        if (existing) {
            return res.status(400).json({ message: "Shape Already Exists" });
        }

        const maxItem = await Shape.findOne().sort({ shapeid: -1 });
        const nextId = maxItem ? parseInt(maxItem.shapeid) + 1 : 1;

        const now = new Date().toISOString();
        const newShape = new Shape({
            shapeid: nextId,
            shapename: trimmedName,
            status: true,
            createdAt: now,
            updatedAt: now
        });

        await newShape.save();
        return res.status(201).json({ message: "Shape added successfully", shape: newShape });
    } catch (error) {
        console.error("Error adding shape:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const edit_shape = async (req, res) => {
    const { shapeid } = req.params;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(shapeid);
        const query = isObjectId ? { _id: shapeid } : { shapeid: Number(shapeid) };
        const item = await Shape.findOne(query);

        if (!item) {
            return res.status(404).json({ message: "Shape not found" });
        }
        return res.status(200).json(item);
    } catch (error) {
        console.error("Error fetching shape details:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_shape_status = async (req, res) => {
    const { shapeid } = req.params;
    const { status } = req.body;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(shapeid);
        const query = isObjectId ? { _id: shapeid } : { shapeid: Number(shapeid) };
        const updated = await Shape.findOneAndUpdate(
            query,
            { status: Boolean(status), updatedAt: new Date().toISOString() },
            { returnDocument: "after" }
        );

        if (!updated) {
            return res.status(404).json({ message: "Shape not found" });
        }
        return res.status(200).json(updated);
    } catch (error) {
        console.error("Error updating shape status:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_shape = async (req, res) => {
    const { shapeid } = req.params;
    const { shapename, status } = req.body;

    try {
        if (!shapename || !shapename.trim()) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const isObjectId = mongoose.Types.ObjectId.isValid(shapeid);
        const selfQuery = isObjectId ? { _id: shapeid } : { shapeid: Number(shapeid) };
        const existingSelf = await Shape.findOne(selfQuery);

        if (!existingSelf) {
            return res.status(404).json({ message: "Shape not found" });
        }

        const trimmedName = shapename.trim();

        const duplicateQuery = {
            _id: { $ne: existingSelf._id },
            shapename: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") }
        };
        const duplicate = await Shape.findOne(duplicateQuery);
        if (duplicate) {
            return res.status(400).json({ message: "Shape Already Exists" });
        }

        existingSelf.shapename = trimmedName;
        if (status !== undefined) {
            existingSelf.status = Boolean(status);
        }
        existingSelf.updatedAt = new Date().toISOString();

        await existingSelf.save();

        // Update shape in Item table
        const targetShapeId = existingSelf.shapeid;
        if (targetShapeId !== undefined && targetShapeId !== null) {
            await Item.updateMany(
                {
                    "shapes.shapeid": {
                        $in: [Number(targetShapeId), String(targetShapeId)]
                    }
                },
                {
                    $set: {
                        "shapes.$[elem].shapename": trimmedName,
                        updatedAt: new Date().toISOString()
                    }
                },
                {
                    arrayFilters: [
                        {
                            "elem.shapeid": {
                                $in: [Number(targetShapeId), String(targetShapeId)]
                            }
                        }
                    ]
                }
            );
        }

        return res.status(200).json({ message: "Shape updated successfully", shape: existingSelf });
    } catch (error) {
        console.error("Error updating shape:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const delete_shape = async (req, res) => {
    const { shapeid } = req.params;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(shapeid);
        const query = isObjectId ? { _id: shapeid } : { shapeid: Number(shapeid) };
        const deleted = await Shape.findOneAndDelete(query);

        if (!deleted) {
            return res.status(404).json({ message: "Shape not found" });
        }

        // Remove shape details from all items containing this shape
        const deletedShapeId = deleted.shapeid;
        if (deletedShapeId !== undefined && deletedShapeId !== null) {
            await Item.updateMany(
                {
                    "shapes.shapeid": {
                        $in: [Number(deletedShapeId), String(deletedShapeId)]
                    }
                },
                {
                    $pull: {
                        shapes: {
                            shapeid: {
                                $in: [Number(deletedShapeId), String(deletedShapeId)]
                            }
                        }
                    },
                    $set: {
                        updatedAt: new Date().toISOString()
                    }
                }
            );
        }

        return res.status(200).json({ message: "Shape deleted successfully" });
    } catch (error) {
        console.error("Error deleting shape:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    get_shapes,
    get_active_shapes,
    add_shape,
    edit_shape,
    update_shape_status,
    update_shape,
    delete_shape
};
