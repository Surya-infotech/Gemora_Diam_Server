const FAQ = require("../../../models/AdminPanel/Support/faq-model");
const mongoose = require("mongoose");

const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const get_faqs = async (_req, res) => {
    try {
        const faqs = await FAQ.find().sort({ updatedAt: -1 }).lean();
        return res.status(200).json({ faqs });
    } catch (error) {
        console.error("Error fetching FAQs:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const get_active_faqs = async (req, res) => {
    try {
        const { faqtype } = req.query;
        const filter = { status: true };
        if (faqtype) {
            filter.faqtype = faqtype;
        }
        const faqs = await FAQ.find(filter).sort({ faqid: 1 }).lean();
        return res.status(200).json(faqs);
    } catch (error) {
        console.error("Error fetching active FAQs:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const add_faq = async (req, res) => {
    try {
        const { faqtype, question, answer } = req.body;

        if (!faqtype || !faqtype.trim() || !question || !question.trim() || !answer || !answer.trim()) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const validTypes = ["Shipping policy", "Returns and exchanges", "Frequently asked questions"];
        if (!validTypes.includes(faqtype.trim())) {
            return res.status(400).json({ message: "Invalid FAQ type" });
        }

        const trimmedQuestion = question.trim();
        const trimmedType = faqtype.trim();

        const existing = await FAQ.findOne({
            faqtype: trimmedType,
            question: { $regex: new RegExp("^" + escapeRegex(trimmedQuestion) + "$", "i") }
        });

        if (existing) {
            return res.status(400).json({ message: "FAQ Already Exists" });
        }

        const maxItem = await FAQ.findOne().sort({ faqid: -1 });
        const nextId = maxItem ? parseInt(maxItem.faqid) + 1 : 1;

        const now = new Date().toISOString();
        const newFAQ = new FAQ({
            faqid: nextId,
            faqtype: trimmedType,
            question: trimmedQuestion,
            answer: answer.trim(),
            status: true,
            createdAt: now,
            updatedAt: now
        });

        await newFAQ.save();
        return res.status(201).json({ message: "FAQ added successfully", faq: newFAQ });
    } catch (error) {
        console.error("Error adding FAQ:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const edit_faq = async (req, res) => {
    const { faqid } = req.params;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(faqid);
        const query = isObjectId ? { _id: faqid } : { faqid: Number(faqid) };
        const item = await FAQ.findOne(query);

        if (!item) {
            return res.status(404).json({ message: "FAQ not found" });
        }
        return res.status(200).json(item);
    } catch (error) {
        console.error("Error fetching FAQ details:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_faq_status = async (req, res) => {
    const { faqid } = req.params;
    const { status } = req.body;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(faqid);
        const query = isObjectId ? { _id: faqid } : { faqid: Number(faqid) };
        const updated = await FAQ.findOneAndUpdate(
            query,
            { status: Boolean(status), updatedAt: new Date().toISOString() },
            { returnDocument: "after" }
        );

        if (!updated) {
            return res.status(404).json({ message: "FAQ not found" });
        }
        return res.status(200).json(updated);
    } catch (error) {
        console.error("Error updating FAQ status:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const update_faq = async (req, res) => {
    const { faqid } = req.params;
    const { faqtype, question, answer, status } = req.body;

    try {
        if (!faqtype || !faqtype.trim() || !question || !question.trim() || !answer || !answer.trim()) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const validTypes = ["Shipping policy", "Returns and exchanges", "Frequently asked questions"];
        if (!validTypes.includes(faqtype.trim())) {
            return res.status(400).json({ message: "Invalid FAQ type" });
        }

        const isObjectId = mongoose.Types.ObjectId.isValid(faqid);
        const selfQuery = isObjectId ? { _id: faqid } : { faqid: Number(faqid) };
        const existingSelf = await FAQ.findOne(selfQuery);

        if (!existingSelf) {
            return res.status(404).json({ message: "FAQ not found" });
        }

        const trimmedQuestion = question.trim();
        const trimmedType = faqtype.trim();

        const duplicateQuery = {
            _id: { $ne: existingSelf._id },
            faqtype: trimmedType,
            question: { $regex: new RegExp("^" + escapeRegex(trimmedQuestion) + "$", "i") }
        };
        const duplicate = await FAQ.findOne(duplicateQuery);
        if (duplicate) {
            return res.status(400).json({ message: "FAQ Already Exists" });
        }

        existingSelf.faqtype = trimmedType;
        existingSelf.question = trimmedQuestion;
        existingSelf.answer = answer.trim();
        if (status !== undefined) {
            existingSelf.status = Boolean(status);
        }
        existingSelf.updatedAt = new Date().toISOString();

        await existingSelf.save();
        return res.status(200).json({ message: "FAQ updated successfully", faq: existingSelf });
    } catch (error) {
        console.error("Error updating FAQ:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const delete_faq = async (req, res) => {
    const { faqid } = req.params;
    try {
        const isObjectId = mongoose.Types.ObjectId.isValid(faqid);
        const query = isObjectId ? { _id: faqid } : { faqid: Number(faqid) };
        const deleted = await FAQ.findOneAndDelete(query);

        if (!deleted) {
            return res.status(404).json({ message: "FAQ not found" });
        }
        return res.status(200).json({ message: "FAQ deleted successfully" });
    } catch (error) {
        console.error("Error deleting FAQ:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    get_faqs,
    get_active_faqs,
    add_faq,
    edit_faq,
    update_faq_status,
    update_faq,
    delete_faq
};
