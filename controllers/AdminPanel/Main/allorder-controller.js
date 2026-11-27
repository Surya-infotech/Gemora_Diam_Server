const mongoose = require("mongoose");
const AllOrder = require("../../../models/AdminPanel/Main/allorder-model");
const FiscalYear = require("../../../models/AdminPanel/System/Setting/fiscalyear-model");
const MiscSetting = require("../../../models/AdminPanel/System/Setting/miscsetting-model");
const { uploadAllOrderFilesToS3, deleteImageFromS3 } = require("../../../utils/s3Config-admin");

const UPLOAD_TYPE = "all-orders";

const resolveFiscalYear = async (requestedFiscalYearId) => {
    if (requestedFiscalYearId != null && requestedFiscalYearId !== "" && !isNaN(requestedFiscalYearId)) {
        const fy = await FiscalYear.findOne({ fiscalyearid: Number(requestedFiscalYearId) }).lean();
        if (fy) return fy;
    }
    const today = new Date().toISOString().split("T")[0];
    let fy = await FiscalYear.findOne({
        startdate: { $lte: today },
        enddate: { $gte: today },
        status: "Active"
    }).lean();
    if (!fy) {
        fy = await FiscalYear.findOne({
            startdate: { $lte: today },
            enddate: { $gte: today }
        }).lean();
    }
    if (!fy) {
        fy = await FiscalYear.findOne({ status: "Active" }).sort({ fiscalyearid: -1 }).lean();
    }
    if (!fy) {
        fy = await FiscalYear.findOne().sort({ fiscalyearid: -1 }).lean();
    }
    if (!fy) {
        const currentYear = new Date().getFullYear();
        fy = await FiscalYear.create({
            fiscalyearid: 1,
            fiscalyear: `${currentYear}-${currentYear + 1}`,
            startdate: `${currentYear}-04-01`,
            enddate: `${currentYear + 1}-03-31`,
            status: "Active",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    }
    return fy;
};

const buildOrderQuery = (id) => (
    mongoose.Types.ObjectId.isValid(id)
        ? { _id: id }
        : { allorderid: Number(id) }
);

const cleanupUploadedFiles = async (files) => {
    if (!files) return;
    const all = [files.photoFile?.[0], files.cadFile?.[0], files.otherFile?.[0]].filter(Boolean);
    await Promise.all(all.map(f => deleteImageFromS3(f.location, UPLOAD_TYPE)));
};

const extractFileAttachment = (files, fieldName, typeLabel) => {
    const file = files?.[fieldName]?.[0];
    if (!file) return null;
    return {
        name: file.originalname || fieldName,
        url: file.location || "",
        type: typeLabel,
        addedAt: new Date().toISOString()
    };
};

const pickOrderFields = (body = {}) => ({
    orderId: String(body.orderId || "").trim(),
    customer: String(body.customer || "").trim(),
    orderDate: String(body.orderDate || "").trim(),
    orderLink: String(body.orderLink || "").trim(),
    shopName: String(body.shopName || "").trim(),
    country: String(body.country || "").trim(),
    jewelryType: String(body.jewelryType || "").trim(),
    product: String(body.product || "").trim(),
    metal: String(body.metal || "").trim(),
    ringSize: String(body.ringSize || "").trim(),
    stoneType: String(body.stoneType || "").trim(),
    stoneShape: String(body.stoneShape || "").trim(),
    centerCarat: String(body.centerCarat || "").trim(),
    sideStoneType: String(body.sideStoneType || "").trim(),
    measurements: String(body.measurements || "").trim(),
    employee: String(body.employee || "").trim(),
    stone: String(body.stone || "").trim(),
    status: String(body.status || "Order Received").trim() || "Order Received",
    targetDate: String(body.targetDate || "").trim(),
    priority: String(body.priority || "Normal").trim() || "Normal",
    productionNotes: String(body.productionNotes || ""),
    conversation: String(body.conversation || ""),
    totalAmount: Math.max(0, Number(body.totalAmount) || 0),
    paidAmount: Math.max(0, Number(body.paidAmount) || 0),
    dispatchDate: String(body.dispatchDate || "").trim(),
    courier: String(body.courier || "").trim(),
    tracking: String(body.tracking || "").trim(),
    trackingLink: String(body.trackingLink || "").trim(),
    deliveryDate: String(body.deliveryDate || "").trim(),
    dispatchNotes: String(body.dispatchNotes || "")
});

const get_all_orders = async (req, res) => {
    try {
        const { fiscalYearId } = req.params;
        const query = {};
        if (fiscalYearId && fiscalYearId !== "all" && fiscalYearId !== "undefined" && fiscalYearId !== "null" && fiscalYearId !== "default") {
            const numericFy = Number(fiscalYearId);
            if (!isNaN(numericFy)) {
                query.fiscalyearid = numericFy;
            }
        }
        const [orders, miscSetting] = await Promise.all([
            AllOrder.find(query).sort({ ordernumber: -1, allorderid: -1, createdAt: -1 }).lean(),
            MiscSetting.findOne().lean()
        ]);

        return res.status(200).json({
            message: "All orders fetched successfully",
            orders,
            miscSettings: miscSetting ? {
                timeZone: miscSetting.timeZone,
                dateFormat: miscSetting.dateFormat,
                timeFormat: miscSetting.timeFormat
            } : null
        });
    } catch (error) {
        console.error("Error fetching all orders:", error);
        return res.status(500).json({ message: error.message || "Server error" });
    }
};

const add_all_order = (req, res) => {
    uploadAllOrderFilesToS3(UPLOAD_TYPE)(req, res, async () => {
        try {
            const fields = pickOrderFields(req.body);
            if (!fields.orderId) {
                await cleanupUploadedFiles(req.files);
                return res.status(400).json({ message: "Etsy Order ID is required" });
            }
            if (!fields.customer) {
                await cleanupUploadedFiles(req.files);
                return res.status(400).json({ message: "Customer name is required" });
            }

            const currentFiscalYear = await resolveFiscalYear(req.body.fiscalyearid);
            const resolvedFyId = currentFiscalYear ? currentFiscalYear.fiscalyearid : 1;

            const [maxOrder, maxOrderByFy] = await Promise.all([
                AllOrder.findOne().sort({ allorderid: -1 }).lean(),
                AllOrder.findOne({ fiscalyearid: resolvedFyId }).sort({ ordernumber: -1 }).lean()
            ]);

            const nextAllOrderId = maxOrder && maxOrder.allorderid ? parseInt(maxOrder.allorderid, 10) + 1 : 1;
            const nextOrderNumber = maxOrderByFy && maxOrderByFy.ordernumber ? parseInt(maxOrderByFy.ordernumber, 10) + 1 : 1;
            const now = new Date().toISOString();

            const newOrder = new AllOrder({
                allorderid: nextAllOrderId,
                fiscalyearid: resolvedFyId,
                ordernumber: nextOrderNumber,
                ...fields,
                photoFile: extractFileAttachment(req.files, "photoFile", "Photo"),
                cadFile: extractFileAttachment(req.files, "cadFile", "CAD"),
                otherFile: extractFileAttachment(req.files, "otherFile", "Document"),
                createdAt: now,
                updatedAt: now
            });

            await newOrder.save();

            return res.status(201).json({
                message: "Order added successfully",
                order: newOrder
            });
        } catch (error) {
            console.error("Error adding manual order:", error);
            await cleanupUploadedFiles(req.files);
            return res.status(500).json({ message: error.message || "Server error" });
        }
    });
};

const get_all_order_details = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await AllOrder.findOne(buildOrderQuery(id)).lean();
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        return res.status(200).json({ order });
    } catch (error) {
        console.error("Error fetching order details:", error);
        return res.status(500).json({ message: error.message || "Server error" });
    }
};

const update_all_order = (req, res) => {
    uploadAllOrderFilesToS3(UPLOAD_TYPE)(req, res, async () => {
        try {
            const { id } = req.params;
            const order = await AllOrder.findOne(buildOrderQuery(id));
            if (!order) {
                await cleanupUploadedFiles(req.files);
                return res.status(404).json({ message: "Order not found" });
            }

            const fields = pickOrderFields(req.body);
            if (!fields.orderId) {
                await cleanupUploadedFiles(req.files);
                return res.status(400).json({ message: "Etsy Order ID is required" });
            }
            if (!fields.customer) {
                await cleanupUploadedFiles(req.files);
                return res.status(400).json({ message: "Customer name is required" });
            }

            Object.assign(order, fields);

            const fileConfigs = [
                { field: "photoFile", type: "Photo" },
                { field: "cadFile", type: "CAD" },
                { field: "otherFile", type: "Document" }
            ];
            for (const cfg of fileConfigs) {
                const uploaded = extractFileAttachment(req.files, cfg.field, cfg.type);
                if (uploaded) {
                    if (order[cfg.field]?.url) {
                        await deleteImageFromS3(order[cfg.field].url, UPLOAD_TYPE);
                    }
                    order[cfg.field] = uploaded;
                }
            }

            order.updatedAt = new Date().toISOString();
            await order.save();

            return res.status(200).json({
                message: "Order updated successfully",
                order
            });
        } catch (error) {
            console.error("Error updating order:", error);
            await cleanupUploadedFiles(req.files);
            return res.status(500).json({ message: error.message || "Server error" });
        }
    });
};

const delete_all_order = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await AllOrder.findOneAndDelete(buildOrderQuery(id));
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        const urls = [order.photoFile?.url, order.cadFile?.url, order.otherFile?.url].filter(Boolean);
        await Promise.all(urls.map(u => deleteImageFromS3(u, UPLOAD_TYPE)));

        return res.status(200).json({ message: "Order deleted successfully" });
    } catch (error) {
        console.error("Error deleting order:", error);
        return res.status(500).json({ message: error.message || "Server error" });
    }
};

module.exports = {
    get_all_orders,
    add_all_order,
    get_all_order_details,
    update_all_order,
    delete_all_order
};