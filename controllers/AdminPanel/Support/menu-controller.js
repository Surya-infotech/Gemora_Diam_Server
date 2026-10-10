const Menu = require("../../../models/AdminPanel/Support/menu-model");
const { deleteImageFromS3 } = require("../../../utils/s3Config-admin");

function slugify(text) {
    if (!text) return "";
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "")
        .replace(/\-\-+/g, "-");
}

const get_menus = async (_req, res) => {
    try {
        const menus = await Menu.find().sort({ order: 1, menuid: 1 }).lean();
        return res.status(200).json({ menus });
    } catch (error) {
        console.error("Error fetching menus:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const get_active_menus = async (_req, res) => {
    try {
        const menus = await Menu.find({ status: true }).sort({ order: 1, menuid: 1 }).lean();
        return res.status(200).json(menus);
    } catch (error) {
        console.error("Error fetching active menus:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const add_menu = async (req, res) => {
    try {
        const { title, slug, order, column1, column2, column3, banner, bottomBar } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ message: "Menu title is required" });
        }

        const maxItem = await Menu.findOne().sort({ menuid: -1 });
        const nextId = maxItem ? parseInt(maxItem.menuid) + 1 : 1;

        const resolvedSlug = slug && slug.trim() ? (slug.startsWith("/") ? slug.trim() : "/" + slug.trim()) : "/" + slugify(title);

        const bannerObj = typeof banner === "string" ? JSON.parse(banner) : (banner || {});
        if (req.file) {
            bannerObj.image = req.file.location;
        }

        const col1Obj = typeof column1 === "string" ? JSON.parse(column1) : (column1 || {});
        const col2Obj = typeof column2 === "string" ? JSON.parse(column2) : (column2 || {});
        const col3Obj = typeof column3 === "string" ? JSON.parse(column3) : (column3 || {});
        const bottomBarObj = typeof bottomBar === "string" ? JSON.parse(bottomBar) : (bottomBar || {});

        const now = new Date().toISOString();
        const newMenu = new Menu({
            menuid: nextId,
            title: title.trim(),
            slug: resolvedSlug,
            order: order ? Number(order) : nextId,
            status: true,
            column1: col1Obj,
            column2: col2Obj,
            column3: col3Obj,
            banner: bannerObj,
            bottomBar: bottomBarObj,
            createdAt: now,
            updatedAt: now
        });

        await newMenu.save();
        return res.status(201).json({ message: "Menu created successfully", menu: newMenu });
    } catch (error) {
        console.error("Error adding menu:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const edit_menu = async (req, res) => {
    try {
        const { menuid } = req.params;
        const query = isNaN(menuid) ? { _id: menuid } : { menuid: parseInt(menuid) };
        const menu = await Menu.findOne(query).lean();
        if (!menu) {
            return res.status(404).json({ message: "Menu not found" });
        }
        return res.status(200).json({ menu });
    } catch (error) {
        console.error("Error fetching menu:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_menu = async (req, res) => {
    try {
        const { menuid } = req.params;
        const { title, slug, order, status, column1, column2, column3, banner, bottomBar } = req.body;

        const query = isNaN(menuid) ? { _id: menuid } : { menuid: parseInt(menuid) };
        const existing = await Menu.findOne(query);
        if (!existing) {
            return res.status(404).json({ message: "Menu not found" });
        }

        if (title) existing.title = title.trim();
        if (slug) {
            existing.slug = slug.startsWith("/") ? slug.trim() : "/" + slug.trim();
        } else if (title) {
            existing.slug = "/" + slugify(title);
        }
        if (order !== undefined) existing.order = Number(order);
        if (status !== undefined) existing.status = Boolean(status);

        if (column1 !== undefined) {
            existing.column1 = typeof column1 === "string" ? JSON.parse(column1) : column1;
        }
        if (column2 !== undefined) {
            existing.column2 = typeof column2 === "string" ? JSON.parse(column2) : column2;
        }
        if (column3 !== undefined) {
            existing.column3 = typeof column3 === "string" ? JSON.parse(column3) : column3;
        }

        let bannerObj = typeof banner === "string" ? JSON.parse(banner) : (banner || existing.banner);
        if (req.file) {
            bannerObj.image = req.file.location;
        }
        existing.banner = bannerObj;

        if (bottomBar !== undefined) {
            existing.bottomBar = typeof bottomBar === "string" ? JSON.parse(bottomBar) : bottomBar;
        }

        existing.updatedAt = new Date().toISOString();
        await existing.save();

        return res.status(200).json({ message: "Menu updated successfully", menu: existing });
    } catch (error) {
        console.error("Error updating menu:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_menu_status = async (req, res) => {
    try {
        const { menuid } = req.params;
        const { status } = req.body;
        const query = isNaN(menuid) ? { _id: menuid } : { menuid: parseInt(menuid) };

        const menu = await Menu.findOne(query);
        if (!menu) {
            return res.status(404).json({ message: "Menu not found" });
        }

        menu.status = status !== undefined ? Boolean(status) : !menu.status;
        menu.updatedAt = new Date().toISOString();
        await menu.save();

        return res.status(200).json({ message: "Menu status updated successfully", status: menu.status });
    } catch (error) {
        console.error("Error updating menu status:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const delete_menu = async (req, res) => {
    try {
        const { menuid } = req.params;
        const query = isNaN(menuid) ? { _id: menuid } : { menuid: parseInt(menuid) };
        const menu = await Menu.findOne(query);
        if (!menu) {
            return res.status(404).json({ message: "Menu not found" });
        }

        if (menu.banner && menu.banner.image) {
            try {
                await deleteImageFromS3(menu.banner.image);
            } catch (e) {
                console.warn("Could not delete S3 banner image:", e);
            }
        }

        await Menu.deleteOne(query);
        return res.status(200).json({ message: "Menu deleted successfully" });
    } catch (error) {
        console.error("Error deleting menu:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    get_menus,
    get_active_menus,
    add_menu,
    edit_menu,
    update_menu,
    update_menu_status,
    delete_menu
};