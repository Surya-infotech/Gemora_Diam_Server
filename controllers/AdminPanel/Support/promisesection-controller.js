const PromiseSection = require("../../../models/AdminPanel/Support/promisesection-model");

const get_promise_section = async (_req, res) => {
    try {
        let section = await PromiseSection.findOne({ sectionid: 1 });
        if (!section) {
            const now = new Date().toISOString();
            section = new PromiseSection({
                sectionid: 1,
                status: true,
                headerEyebrow: "",
                headerTitle: "",
                headerHighlightText: "",
                headerDescription: "",
                vowsEyebrow: "",
                vowsTitle: "",
                vowsSubtitle: "",
                vowsImage: "",
                vowsButtonText: "",
                vowsButtonLink: "",
                proposalEyebrow: "",
                proposalTitle: "",
                proposalSubtitle: "",
                proposalImage: "",
                proposalButtonText: "",
                proposalButtonLink: "",
                styleSectionTitle: "",
                styles: [],
                createdAt: now,
                updatedAt: now
            });
            await section.save();
        }
        return res.status(200).json(section);
    } catch (error) {
        console.error("Error getting promise section:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const get_active_promise_section = async (_req, res) => {
    try {
        let section = await PromiseSection.findOne({ sectionid: 1 });
        if (!section) {
            return res.status(200).json({
                status: true,
                headerEyebrow: "",
                headerTitle: "",
                headerHighlightText: "",
                headerDescription: "",
                vowsEyebrow: "",
                vowsTitle: "",
                vowsSubtitle: "",
                vowsImage: "",
                vowsButtonText: "",
                vowsButtonLink: "",
                proposalEyebrow: "",
                proposalTitle: "",
                proposalSubtitle: "",
                proposalImage: "",
                proposalButtonText: "",
                proposalButtonLink: "",
                styleSectionTitle: "",
                styles: []
            });
        }

        if (section.status === false) {
            return res.status(200).json({ status: false, styles: [] });
        }

        const activeStyles = (section.styles || [])
            .filter((s) => s.status !== false)
            .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

        const responseData = {
            ...section.toObject(),
            styles: activeStyles
        };

        return res.status(200).json(responseData);
    } catch (error) {
        console.error("Error getting active promise section:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_promise_section = async (req, res) => {
    try {
        const {
            status,
            headerEyebrow,
            headerTitle,
            headerHighlightText,
            headerDescription,
            vowsEyebrow,
            vowsTitle,
            vowsSubtitle,
            vowsImage,
            vowsButtonText,
            vowsButtonLink,
            proposalEyebrow,
            proposalTitle,
            proposalSubtitle,
            proposalImage,
            proposalButtonText,
            proposalButtonLink,
            styleSectionTitle,
            styles
        } = req.body;

        let section = await PromiseSection.findOne({ sectionid: 1 });
        const now = new Date().toISOString();

        if (!section) {
            section = new PromiseSection({
                sectionid: 1,
                createdAt: now,
                updatedAt: now
            });
        }

        if (status !== undefined) {
            section.status = status === true || status === "true" || status === 1 || status === "1";
        }

        if (headerEyebrow !== undefined) section.headerEyebrow = headerEyebrow.trim();
        if (headerTitle !== undefined) section.headerTitle = headerTitle.trim();
        if (headerHighlightText !== undefined) section.headerHighlightText = headerHighlightText.trim();
        if (headerDescription !== undefined) section.headerDescription = headerDescription.trim();

        if (vowsEyebrow !== undefined) section.vowsEyebrow = vowsEyebrow.trim();
        if (vowsTitle !== undefined) section.vowsTitle = vowsTitle.trim();
        if (vowsSubtitle !== undefined) section.vowsSubtitle = vowsSubtitle.trim();
        if (vowsImage !== undefined) section.vowsImage = vowsImage.trim();
        if (vowsButtonText !== undefined) section.vowsButtonText = vowsButtonText.trim();
        if (vowsButtonLink !== undefined) section.vowsButtonLink = vowsButtonLink.trim();

        if (proposalEyebrow !== undefined) section.proposalEyebrow = proposalEyebrow.trim();
        if (proposalTitle !== undefined) section.proposalTitle = proposalTitle.trim();
        if (proposalSubtitle !== undefined) section.proposalSubtitle = proposalSubtitle.trim();
        if (proposalImage !== undefined) section.proposalImage = proposalImage.trim();
        if (proposalButtonText !== undefined) section.proposalButtonText = proposalButtonText.trim();
        if (proposalButtonLink !== undefined) section.proposalButtonLink = proposalButtonLink.trim();

        if (styleSectionTitle !== undefined) section.styleSectionTitle = styleSectionTitle.trim();

        if (Array.isArray(styles)) {
            section.styles = styles.map((s, idx) => ({
                styleId: s.styleId || (s.name ? s.name.toLowerCase().replace(/\s+/g, '-') : "style-" + (idx + 1)),
                name: s.name ? s.name.trim() : "",
                desc: s.desc ? s.desc.trim() : "",
                img: s.img ? s.img.trim() : "",
                link: s.link ? s.link.trim() : "",
                order: s.order !== undefined ? Number(s.order) : idx + 1,
                status: s.status !== false
            }));
        }

        section.updatedAt = now;
        await section.save();

        return res.status(200).json({ message: "Promise section updated successfully", promiseSection: section });
    } catch (error) {
        console.error("Error updating promise section:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const upload_promise_asset = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        return res.status(200).json({ message: "Asset uploaded successfully", url: req.file.location });
    } catch (error) {
        console.error("Error uploading promise asset:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    get_promise_section,
    get_active_promise_section,
    update_promise_section,
    upload_promise_asset
};