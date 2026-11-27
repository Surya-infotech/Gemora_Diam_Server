const mongoose = require("mongoose");
const AllOrder = require("../../../models/AdminPanel/Main/allorder-model");
const FiscalYear = require("../../../models/AdminPanel/System/Setting/fiscalyear-model");
const MiscSetting = require("../../../models/AdminPanel/System/Setting/miscsetting-model");

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

const pickOrderFields = (body = {}) => ({
    orderId: String(body.orderId || "").trim(),
    customer: String(body.customer || "").trim(),
    orderDate: String(body.orderDate || "").trim(),
    orderLink: String(body.orderLink || "").trim(),
    shopName: String(body.shopName || "").trim(),
    metal: String(body.metal || "").trim(),
    employee: String(body.employee || "").trim(),
    status: String(body.status || "Order Received").trim() || "Order Received",
    conversation: String(body.conversation || ""),
    dispatchDate: String(body.dispatchDate || "").trim(),
    courier: String(body.courier || "").trim(),
    tracking: String(body.tracking || "").trim(),
    trackingLink: String(body.trackingLink || "").trim()
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

const add_all_order = async (req, res) => {
    try {
        const fields = pickOrderFields(req.body);
        if (!fields.orderId) {
            return res.status(400).json({ message: "Etsy Order ID is required" });
        }
        if (!fields.customer) {
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
        return res.status(500).json({ message: error.message || "Server error" });
    }
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

const update_all_order = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await AllOrder.findOne(buildOrderQuery(id));
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        const fields = pickOrderFields(req.body);
        if (!fields.orderId) {
            return res.status(400).json({ message: "Etsy Order ID is required" });
        }
        if (!fields.customer) {
            return res.status(400).json({ message: "Customer name is required" });
        }

        Object.assign(order, fields);
        order.updatedAt = new Date().toISOString();
        await order.save();

        return res.status(200).json({
            message: "Order updated successfully",
            order
        });
    } catch (error) {
        console.error("Error updating order:", error);
        return res.status(500).json({ message: error.message || "Server error" });
    }
};

const delete_all_order = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await AllOrder.findOneAndDelete(buildOrderQuery(id));
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
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