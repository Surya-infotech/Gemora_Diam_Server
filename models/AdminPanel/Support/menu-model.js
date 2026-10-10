const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema({
    label: { type: String, default: "" },
    slug: { type: String, default: "" },
    shape: { type: String, default: "" },
    badge: { type: String, default: "" },
    filterType: { type: String, default: "style" }, // style, category, shape, search, all
    filterValue: { type: mongoose.Schema.Types.Mixed, default: "" }
}, { _id: false });

const menuColumnSchema = new mongoose.Schema({
    title: { type: String, default: "" },
    bottomText: { type: String, default: "" },
    bottomUrl: { type: String, default: "" },
    items: [menuItemSchema]
}, { _id: false });

const menuSchema = new mongoose.Schema({
    menuid: { type: Number, required: true },
    title: { type: String, required: true },
    slug: { type: String, required: true },
    order: { type: Number, default: 1 },
    status: { type: Boolean, default: true },
    column1: { type: menuColumnSchema, default: () => ({}) },
    column2: { type: menuColumnSchema, default: () => ({}) },
    column3: { type: menuColumnSchema, default: () => ({}) },
    banner: {
        eyebrow: { type: String, default: "" },
        title: { type: String, default: "" },
        description: { type: String, default: "" },
        image: { type: String, default: "" },
        buttonText: { type: String, default: "" },
        buttonLink: { type: String, default: "" }
    },
    bottomBar: {
        text: { type: String, default: "" },
        link: { type: String, default: "" }
    },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
});

const MenuModel = mongoose.models.Menu || mongoose.model("Menu", menuSchema);

module.exports = MenuModel;