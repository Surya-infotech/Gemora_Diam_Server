const Order = require("../../models/order-model");
const Item = require("../../models/AdminPanel/Products/item-model");
const Customer = require("../../models/customer-model");
const FiscalYear = require("../../models/AdminPanel/System/Setting/fiscalyear-model");
const MiscSetting = require("../../models/AdminPanel/System/Setting/miscsetting-model");
const Currency = require("../../models/AdminPanel/System/currency-model");

const get_dashboard = async (req, res) => {
    try {
        const { fiscalYearId } = req.params;

        let activeFy = null;
        let orderFilter = {};

        if (fiscalYearId && fiscalYearId !== "default" && fiscalYearId !== "all" && fiscalYearId !== "null" && fiscalYearId !== "undefined") {
            const numFy = Number(fiscalYearId);
            if (!isNaN(numFy)) {
                orderFilter.fiscalyearid = numFy;
                activeFy = await FiscalYear.findOne({ fiscalyearid: numFy }).lean();
            }
        } else if (fiscalYearId === "default" || !fiscalYearId) {
            activeFy = await FiscalYear.findOne({ status: "Active" }).lean();
            if (activeFy) {
                orderFilter.fiscalyearid = activeFy.fiscalyearid;
            }
        }

        const [orders, allOrdersCount, totalProductsCount, publishedProductsCount, totalCustomersCount] = await Promise.all([
            Order.find(orderFilter).sort({ createdAt: -1 }).lean(),
            Order.countDocuments(),
            Item.countDocuments(),
            Item.countDocuments({ status: "Published" }),
            Customer.countDocuments()
        ]);

        // Revenue details & counts strictly calculated for orders with Order Status 'Delivered' AND Payment Status 'Paid'
        const isDeliveredAndPaid = (o) => {
            const oStatus = String(o.orderstatus || "").trim().toLowerCase();
            const pStatus = String(o.paymentstatus || "").trim().toLowerCase();
            return oStatus === "delivered" && pStatus === "paid";
        };

        const deliveredPaidOrders = orders.filter(isDeliveredAndPaid);
        const deliveredPaidOrdersCount = deliveredPaidOrders.length;
        const totalRevenue = deliveredPaidOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
        const totalSubtotalSum = deliveredPaidOrders.reduce((sum, o) => sum + (Number(o.subtotal) || 0), 0);
        const totalTaxSum = deliveredPaidOrders.reduce((sum, o) => sum + (Number(o.tax) || Number(o.totaltax) || 0), 0);

        // Monthly breakdown: strictly calculate revenue and order counts for Delivered & Paid orders
        const monthlySummary = Array.from({ length: 12 }, (_, i) => {
            const monthNum = i + 1;
            const monthOrders = deliveredPaidOrders.filter(o => {
                if (!o.createdAt) return false;
                const d = new Date(o.createdAt);
                return !isNaN(d.getTime()) && (d.getMonth() + 1) === monthNum;
            });
            const monthlyRevenue = monthOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
            return {
                _id: monthNum,
                monthlyRevenue,
                orderCount: monthOrders.length,
                subscriptionCount: monthOrders.length
            };
        });

        const orderStatusCounts = {
            Pending: orders.filter(o => (o.orderstatus || "").toLowerCase() === "pending").length,
            Confirmed: orders.filter(o => (o.orderstatus || "").toLowerCase() === "confirmed").length,
            Processing: orders.filter(o => (o.orderstatus || "").toLowerCase() === "processing").length,
            Shipped: orders.filter(o => (o.orderstatus || "").toLowerCase() === "shipped").length,
            Delivered: orders.filter(o => (o.orderstatus || "").toLowerCase() === "delivered").length,
            Cancelled: orders.filter(o => (o.orderstatus || "").toLowerCase() === "cancelled").length
        };

        // Recent Orders section: show orders where order status is NOT 'Delivered' and NOT 'Cancelled'
        const recentOrdersRaw = await Order.find({
            orderstatus: {
                $nin: ["Delivered", "Cancelled", "delivered", "cancelled"]
            }
        })
            .sort({ ordernumber: -1, orderid: -1, createdAt: -1 })
            .limit(10)
            .lean();

        const recentOrders = recentOrdersRaw.map(o => ({
            _id: o._id,
            orderid: o.orderid,
            ordernumber: o.ordernumber,
            customername: o.customername || "Valued Client",
            customeremail: o.customeremail || "",
            total: o.total || 0,
            subtotal: o.subtotal || 0,
            orderstatus: o.orderstatus || "Confirmed",
            paymentstatus: o.paymentstatus || "Paid",
            paymentmethod: o.paymentmethod || "Online",
            totalitems: o.totalitems || (o.items ? o.items.length : 1),
            createdAt: o.createdAt,
            currencydetails: o.currencydetails || null
        }));

        const recentCustomersRaw = await Customer.find()
            .select("-password -Token")
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        const recentCustomers = recentCustomersRaw.map(c => ({
            _id: c._id,
            customerid: c.customerid,
            fullname: c.fullname,
            email: c.email,
            phone: c.phone || "",
            status: c.status !== false,
            createdAt: c.createdAt
        }));

        const recentProductsRaw = await Item.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        const recentProducts = recentProductsRaw.map(item => ({
            _id: item._id,
            itemid: item.itemid,
            itemname: item.itemname,
            categoryname: item.categoryname || "",
            subcategoryname: item.subcategoryname || "",
            image: item.image || (item.galleryimages && item.galleryimages[0] ? item.galleryimages[0].imageUrl : ""),
            status: item.status || "Draft",
            createdAt: item.createdAt
        }));

        let currencyDetails = {
            currency: "INR",
            currencysymbol: "\u20B9",
            currencyposition: "right",
            thousandseparator: ",",
            decimalseparator: ".",
            decimal: 2
        };

        try {
            const misc = await MiscSetting.findOne().lean();
            if (misc?.currencyid) {
                const curr = await Currency.findOne({ currencyid: misc.currencyid }).lean();
                if (curr) {
                    currencyDetails = {
                        currencyid: curr.currencyid,
                        currency: curr.currency || "INR",
                        currencysymbol: curr.currencysymbol || "\u20B9",
                        currencyposition: curr.currencyposition || "right",
                        thousandseparator: curr.thousandseparator || ",",
                        decimalseparator: curr.decimalseparator || ".",
                        decimal: curr.decimal !== undefined ? curr.decimal : 2
                    };
                }
            }
        } catch (currErr) {
            console.error("Error fetching currency in dashboard:", currErr);
        }

        return res.status(200).json({
            message: "Dashboard data fetched successfully",
            totalOrdersCount: deliveredPaidOrdersCount,
            allOrdersCount,
            totalRevenue,
            totalSubtotalSum,
            totalTaxSum,
            totalProductsCount,
            publishedProductsCount,
            totalCustomersCount,
            monthlySummary,
            orderStatusCounts,
            recentOrders,
            recentCustomers,
            recentProducts,
            currencyDetails,
            kpiDifferences: {
                ordersDifference: deliveredPaidOrdersCount > 0 ? "+100%" : "0%",
                revenueDifference: totalRevenue > 0 ? "+100%" : "0%",
                productsDifference: totalProductsCount > 0 ? `+${totalProductsCount}` : "0",
                customersDifference: totalCustomersCount > 0 ? `+${totalCustomersCount}` : "0"
            },
            totalOwnerCount: totalCustomersCount,
            totalPriceSum: totalRevenue,
            activeSubscriptionCount: deliveredPaidOrdersCount,
            totalSubscriptionCount: allOrdersCount
        });
    } catch (error) {
        console.error("Error in get_dashboard controller:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    get_dashboard
};