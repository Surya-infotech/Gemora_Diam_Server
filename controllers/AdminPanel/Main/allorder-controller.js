const mongoose = require("mongoose");
const AllOrder = require("../../../models/AdminPanel/Main/allorder-model");
const FiscalYear = require("../../../models/AdminPanel/System/Setting/fiscalyear-model");
const MiscSetting = require("../../../models/AdminPanel/System/Setting/miscsetting-model");
const Currency = require("../../../models/AdminPanel/System/currency-model");

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

const resolveActiveCurrencyDetails = async (fallbackCurrency) => {
    try {
        const miscSetting = await MiscSetting.findOne().lean();
        if (miscSetting && miscSetting.currencyid) {
            const currDoc = await Currency.findOne({ currencyid: Number(miscSetting.currencyid) }).lean();
            if (currDoc) {
                return {
                    currencyid: currDoc.currencyid,
                    countryname: currDoc.countryname || "",
                    currency: currDoc.currency || "USD",
                    currencysymbol: currDoc.currencysymbol || "$",
                    currencyposition: currDoc.currencyposition || "left",
                    thousandseparator: currDoc.thousandseparator !== undefined && currDoc.thousandseparator !== null ? currDoc.thousandseparator : ",",
                    decimalseparator: currDoc.decimalseparator || ".",
                    decimal: currDoc.decimal !== undefined ? currDoc.decimal : 2
                };
            }
        }
    } catch (err) {
        console.error("Error resolving active currency:", err);
    }
    if (fallbackCurrency && typeof fallbackCurrency === "object") {
        return fallbackCurrency;
    }
    return {
        currencyid: 1,
        countryname: "United States",
        currency: "USD",
        currencysymbol: "$",
        currencyposition: "left",
        thousandseparator: ",",
        decimalseparator: ".",
        decimal: 2
    };
};

const formatManualOrderItems = (items = []) => {
    if (!Array.isArray(items)) return [];
    return items
        .map(item => {
            const itemname = String(item.itemname || "").trim();
            if (!itemname) return null;
            const qty = Math.max(1, parseInt(item.qty, 10) || 1);
            const price = Math.max(0, Number(item.price) || 0);
            return {
                itemid: item.itemid != null && item.itemid !== "" && !isNaN(item.itemid) ? Number(item.itemid) : null,
                itemname,
                sku: String(item.sku || "").trim(),
                image: String(item.image || "").trim(),
                metalname: String(item.metalname || "").trim(),
                stonename: String(item.stonename || "").trim(),
                diamondsize: String(item.diamondsize || "").trim(),
                shapename: String(item.shapename || "").trim(),
                clarityname: String(item.clarityname || "").trim(),
                diamondcolor: String(item.diamondcolor || "").trim(),
                bandcolor: String(item.bandcolor || "").trim(),
                ringsize: String(item.ringsize || "").trim(),
                closuretype: String(item.closuretype || "").trim(),
                specialinstruction: String(item.specialinstruction || "").trim(),
                price,
                qty,
                totalprice: Number((price * qty).toFixed(2))
            };
        })
        .filter(Boolean);
};

const formatAddress = (addr = {}) => ({
    address: String(addr?.address || "").trim(),
    pincode: String(addr?.pincode || "").trim(),
    countryname: String(addr?.countryname || "").trim(),
    countrycode: String(addr?.countrycode || "").trim(),
    statename: String(addr?.statename || "").trim(),
    statecode: String(addr?.statecode || "").trim(),
    cityname: String(addr?.cityname || "").trim()
});

const buildOrderQuery = (id) => (
    mongoose.Types.ObjectId.isValid(id)
        ? { _id: id }
        : { allorderid: Number(id) }
);

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
        const {
            customerid,
            customername,
            customeremail,
            customerphone,
            items,
            total,
            shippingaddress,
            orderstatus,
            paymentstatus,
            paymentmethod,
            notes,
            orderdate,
            fiscalyearid,
            currencydetails
        } = req.body;

        const trimmedName = String(customername || "").trim();
        if (!trimmedName) {
            return res.status(400).json({ message: "Customer Name is required" });
        }

        const formattedItems = formatManualOrderItems(items);
        if (formattedItems.length === 0) {
            return res.status(400).json({ message: "Order must contain at least one item" });
        }

        const currentFiscalYear = await resolveFiscalYear(fiscalyearid);
        const resolvedFyId = currentFiscalYear ? currentFiscalYear.fiscalyearid : 1;

        const [maxOrder, maxOrderByFy, activeCurrency] = await Promise.all([
            AllOrder.findOne().sort({ allorderid: -1 }).lean(),
            AllOrder.findOne({ fiscalyearid: resolvedFyId }).sort({ ordernumber: -1 }).lean(),
            resolveActiveCurrencyDetails(currencydetails)
        ]);

        const nextAllOrderId = maxOrder && maxOrder.allorderid ? parseInt(maxOrder.allorderid, 10) + 1 : 1;
        const nextOrderNumber = maxOrderByFy && maxOrderByFy.ordernumber ? parseInt(maxOrderByFy.ordernumber, 10) + 1 : 1;

        const totalitems = formattedItems.reduce((acc, item) => acc + item.qty, 0);
        const subtotal = Number(formattedItems.reduce((acc, item) => acc + item.totalprice, 0).toFixed(2));
        const finalTotal = total !== undefined && total !== "" && !isNaN(total) ? Math.max(0, Number(total)) : subtotal;
        const now = new Date().toISOString();

        const newOrder = new AllOrder({
            allorderid: nextAllOrderId,
            fiscalyearid: resolvedFyId,
            ordernumber: nextOrderNumber,
            customerid: customerid != null && customerid !== "" && !isNaN(customerid) ? Number(customerid) : null,
            customername: trimmedName,
            customeremail: String(customeremail || "").trim(),
            customerphone: String(customerphone || "").trim(),
            items: formattedItems,
            totalitems,
            subtotal,
            total: finalTotal,
            currencydetails: activeCurrency,
            shippingaddress: formatAddress(shippingaddress),
            orderstatus: orderstatus || "Confirmed",
            paymentstatus: paymentstatus || "Paid",
            paymentmethod: String(paymentmethod || "Cash").trim(),
            notes: String(notes || "").trim(),
            orderdate: orderdate || now,
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

        const {
            customerid,
            customername,
            customeremail,
            customerphone,
            items,
            total,
            shippingaddress,
            orderstatus,
            paymentstatus,
            paymentmethod,
            notes,
            orderdate
        } = req.body;

        const trimmedName = String(customername !== undefined ? customername : order.customername).trim();
        if (!trimmedName) {
            return res.status(400).json({ message: "Customer Name is required" });
        }

        if (items !== undefined) {
            const formattedItems = formatManualOrderItems(items);
            if (formattedItems.length === 0) {
                return res.status(400).json({ message: "Order must contain at least one item" });
            }
            order.items = formattedItems;
            order.totalitems = formattedItems.reduce((acc, item) => acc + item.qty, 0);
            order.subtotal = Number(formattedItems.reduce((acc, item) => acc + item.totalprice, 0).toFixed(2));
        }

        if (customerid !== undefined) {
            order.customerid = customerid != null && customerid !== "" && !isNaN(customerid) ? Number(customerid) : null;
        }
        order.customername = trimmedName;
        if (customeremail !== undefined) order.customeremail = String(customeremail || "").trim();
        if (customerphone !== undefined) order.customerphone = String(customerphone || "").trim();
        if (total !== undefined && total !== "" && !isNaN(total)) {
            order.total = Math.max(0, Number(total));
        } else if (items !== undefined) {
            order.total = order.subtotal;
        }
        if (shippingaddress !== undefined) order.shippingaddress = formatAddress(shippingaddress);
        if (orderstatus !== undefined) order.orderstatus = orderstatus;
        if (paymentstatus !== undefined) order.paymentstatus = paymentstatus;
        if (paymentmethod !== undefined) order.paymentmethod = String(paymentmethod || "Cash").trim();
        if (notes !== undefined) order.notes = String(notes || "").trim();
        if (orderdate !== undefined && orderdate) order.orderdate = orderdate;
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