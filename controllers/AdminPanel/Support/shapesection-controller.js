const ShapeSection = require("../../../models/AdminPanel/Support/shapesection-model");

const get_shape_section = async (_req, res) => {
    try {
        let section = await ShapeSection.findOne({ sectionid: 1 });
        if (!section) {
            const now = new Date().toISOString();
            section = new ShapeSection({
                sectionid: 1,
                headerEyebrow: "",
                headerTitle: "",
                headerDescription: "",
                designEyebrow: "",
                designTitle: "",
                designDescription: "",
                primaryBtnText: "",
                primaryBtnLink: "",
                secondaryBtnText: "",
                secondaryBtnLink: "",
                step1Num: "",
                step1Title: "",
                step1Desc: "",
                step2Num: "",
                step2Title: "",
                step2Desc: "",
                step3Num: "",
                step3Title: "",
                step3Desc: "",
                shapes: [],
                status: true,
                createdAt: now,
                updatedAt: now
            });
            await section.save();
        }
        return res.status(200).json(section);
    } catch (error) {
        console.error("Error getting shape section:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const get_active_shape_section = async (_req, res) => {
    try {
        let section = await ShapeSection.findOne({ sectionid: 1 });
        if (!section) {
            return res.status(200).json({
                headerEyebrow: "",
                headerTitle: "",
                headerDescription: "",
                designEyebrow: "",
                designTitle: "",
                designDescription: "",
                primaryBtnText: "",
                primaryBtnLink: "",
                secondaryBtnText: "",
                secondaryBtnLink: "",
                step1Num: "",
                step1Title: "",
                step1Desc: "",
                step2Num: "",
                step2Title: "",
                step2Desc: "",
                step3Num: "",
                step3Title: "",
                step3Desc: "",
                shapes: [],
                status: true
            });
        }

        if (!section.status) {
            return res.status(200).json({ status: false, shapes: [] });
        }

        const activeShapes = (section.shapes || [])
            .filter((s) => s.status !== false)
            .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

        const responseData = {
            ...section.toObject(),
            shapes: activeShapes
        };

        return res.status(200).json(responseData);
    } catch (error) {
        console.error("Error getting active shape section:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_shape_section = async (req, res) => {
    try {
        const {
            headerEyebrow,
            headerTitle,
            headerDescription,
            designEyebrow,
            designTitle,
            designDescription,
            primaryBtnText,
            primaryBtnLink,
            secondaryBtnText,
            secondaryBtnLink,
            step1Num,
            step1Title,
            step1Desc,
            step2Num,
            step2Title,
            step2Desc,
            step3Num,
            step3Title,
            step3Desc,
            shapes,
            status
        } = req.body;

        let section = await ShapeSection.findOne({ sectionid: 1 });
        const now = new Date().toISOString();

        if (!section) {
            section = new ShapeSection({
                sectionid: 1,
                createdAt: now,
                updatedAt: now
            });
        }

        if (headerEyebrow !== undefined) section.headerEyebrow = headerEyebrow.trim();
        if (headerTitle !== undefined) section.headerTitle = headerTitle.trim();
        if (headerDescription !== undefined) section.headerDescription = headerDescription.trim();

        if (designEyebrow !== undefined) section.designEyebrow = designEyebrow.trim();
        if (designTitle !== undefined) section.designTitle = designTitle.trim();
        if (designDescription !== undefined) section.designDescription = designDescription.trim();

        if (primaryBtnText !== undefined) section.primaryBtnText = primaryBtnText.trim();
        if (primaryBtnLink !== undefined) section.primaryBtnLink = primaryBtnLink.trim();
        if (secondaryBtnText !== undefined) section.secondaryBtnText = secondaryBtnText.trim();
        if (secondaryBtnLink !== undefined) section.secondaryBtnLink = secondaryBtnLink.trim();

        if (step1Num !== undefined) section.step1Num = step1Num.trim();
        if (step1Title !== undefined) section.step1Title = step1Title.trim();
        if (step1Desc !== undefined) section.step1Desc = step1Desc.trim();

        if (step2Num !== undefined) section.step2Num = step2Num.trim();
        if (step2Title !== undefined) section.step2Title = step2Title.trim();
        if (step2Desc !== undefined) section.step2Desc = step2Desc.trim();

        if (step3Num !== undefined) section.step3Num = step3Num.trim();
        if (step3Title !== undefined) section.step3Title = step3Title.trim();
        if (step3Desc !== undefined) section.step3Desc = step3Desc.trim();

        if (Array.isArray(shapes)) {
            section.shapes = shapes.map((s, idx) => ({
                shapeid: (s.shapeid || s.name || `shape-${idx + 1}`).toLowerCase().replace(/\s+/g, '-'),
                name: s.name ? s.name.trim() : "",
                tagline: s.tagline ? s.tagline.trim() : "",
                description: s.description ? s.description.trim() : "",
                bestFor: s.bestFor ? s.bestFor.trim() : "",
                brilliance: s.brilliance ? s.brilliance.trim() : "",
                shapeIcon: s.shapeIcon ? s.shapeIcon.trim() : "",
                showcaseImage: s.showcaseImage ? s.showcaseImage.trim() : "",
                showcaseTitle: s.showcaseTitle ? s.showcaseTitle.trim() : "",
                buttonLink: s.buttonLink ? s.buttonLink.trim() : "",
                order: s.order !== undefined ? Number(s.order) : idx + 1,
                status: s.status !== false
            }));
        }

        if (status !== undefined) {
            section.status = status === true || status === "true" || status === 1 || status === "1";
        }

        section.updatedAt = now;
        await section.save();

        return res.status(200).json({ message: "Shape section updated successfully", shapeSection: section });
    } catch (error) {
        console.error("Error updating shape section:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const upload_shape_asset = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        return res.status(200).json({ message: "Asset uploaded successfully", url: req.file.location });
    } catch (error) {
        console.error("Error uploading shape asset:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    get_shape_section,
    get_active_shape_section,
    update_shape_section,
    upload_shape_asset
};