const Customer = require("../models/customer-model");
const CustomerAddress = require("../models/customer-address-model");
const Order = require("../models/order-model");
const FiscalYear = require("../models/AdminPanel/System/Setting/fiscalyear-model");
const Item = require("../models/AdminPanel/Products/item-model");
const MiscSetting = require("../models/AdminPanel/System/Setting/miscsetting-model");
const Currency = require("../models/AdminPanel/System/currency-model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const signup = async (req, res) => {
    try {
        const { fullname, email, password, phone } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const cleanEmail = email.toLowerCase().trim();

        const existingCustomer = await Customer.findOne({ email: cleanEmail });
        if (existingCustomer) {
            return res.status(400).json({ message: "Email already exists. Please sign in instead." });
        }

        const maxCustomer = await Customer.findOne().sort({ customerid: -1 });
        const nextCustomerId = maxCustomer && maxCustomer.customerid ? parseInt(maxCustomer.customerid) + 1 : 1;

        const hashedPassword = await bcrypt.hash(password, 10);

        const newCustomer = new Customer({
            customerid: nextCustomerId,
            fullname,
            email: cleanEmail,
            password: hashedPassword,
            phone: phone ? phone.trim() : "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        const token = newCustomer.generateToken();
        newCustomer.Token = token;

        await newCustomer.save();

        const customerData = newCustomer.toObject();
        delete customerData.password;

        return res.status(201).json({
            message: "Account created successfully",
            token,
            customer_id: newCustomer._id.toString(),
            customer: customerData
        });
    } catch (error) {
        console.error("Error during customer signup:", error);
        return res.status(500).json({ message: error.message || "Server error during registration" });
    }
};

const signin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const cleanEmail = email.toLowerCase().trim();
        const customer = await Customer.findOne({ email: cleanEmail });

        if (!customer) {
            return res.status(404).json({ message: "No account found with this email" });
        }

        if (customer.status === false) {
            return res.status(403).json({ message: "Your account is inactive. Please contact support." });
        }

        const isMatch = await bcrypt.compare(password, customer.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const token = customer.generateToken();
        customer.Token = token;
        customer.updatedAt = new Date().toISOString();
        await customer.save();

        const customerData = customer.toObject();
        delete customerData.password;

        return res.status(200).json({
            message: "Signed in successfully",
            token,
            customer_id: customer._id.toString(),
            customer: customerData
        });
    } catch (error) {
        console.error("Error during customer signin:", error);
        return res.status(500).json({ message: error.message || "Server error during sign in" });
    }
};

const verifyToken = async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1] || authHeader;

    if (!token) return res.status(401).json({ message: "Token missing" });

    try {
        const decoded = jwt.verify(token, process.env.CUSTOMER_JWT_KEY);
        const customer = await Customer.findById(decoded.customerId);

        if (!customer || customer.status === false) {
            return res.status(401).json({ message: "Invalid or expired session" });
        }

        const customerData = customer.toObject();
        delete customerData.password;

        return res.status(200).json({
            message: "Token valid",
            customer_id: customer._id.toString(),
            customer: customerData
        });
    } catch {
        return res.status(401).json({ message: "Token expired or invalid" });
    }
};

const update_profile = async (req, res) => {
    try {
        const { customerId } = req.params;
        const { fullname, phone, email, currentPassword, newPassword } = req.body;

        let customer = null;
        if (customerId) {
            try {
                customer = await Customer.findById(customerId);
            } catch {
                // ignore
            }
            if (!customer) {
                customer = await Customer.findOne({ customerid: customerId });
            }
        }

        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        if (fullname !== undefined) {
            customer.fullname = String(fullname).trim();
        }
        if (phone !== undefined) {
            customer.phone = String(phone).trim();
        }
        if (email) {
            const cleanEmail = String(email).toLowerCase().trim();
            if (cleanEmail !== customer.email) {
                const existing = await Customer.findOne({ email: cleanEmail });
                if (existing) {
                    return res.status(400).json({ message: "Email is already taken by another account" });
                }
                customer.email = cleanEmail;
            }
        }

        if (newPassword) {
            if (currentPassword) {
                const isMatch = await bcrypt.compare(currentPassword, customer.password);
                if (!isMatch) {
                    return res.status(400).json({ message: "Current password is incorrect" });
                }
            }
            customer.password = await bcrypt.hash(newPassword, 10);
        }

        customer.updatedAt = new Date().toISOString();
        await customer.save();

        const customerData = customer.toObject();
        delete customerData.password;

        return res.status(200).json({
            message: "Profile updated successfully",
            customer_id: customer._id.toString(),
            customer: customerData
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        return res.status(500).json({ message: error.message || "Error updating profile" });
    }
};

// ==========================================
// CUSTOMER ADDRESS CONTROLLER METHODS
// ==========================================

const get_addresses = async (req, res) => {
    try {
        const { customerId } = req.params;
        if (!customerId) {
            return res.status(400).json({ message: "Customer ID is required" });
        }

        let numericCustomerId = null;
        if (!isNaN(customerId)) {
            numericCustomerId = Number(customerId);
        } else {
            let cust = null;
            try {
                cust = await Customer.findById(customerId);
            } catch {
                // ignore
            }
            if (cust && cust.customerid) {
                numericCustomerId = cust.customerid;
            }
        }

        if (!numericCustomerId) {
            return res.status(200).json({
                message: "Addresses fetched successfully",
                addresses: []
            });
        }

        const addresses = await CustomerAddress.find({ customerid: numericCustomerId }).sort({ isDefault: -1, createdAt: -1 });
        return res.status(200).json({
            message: "Addresses fetched successfully",
            addresses
        });
    } catch (error) {
        console.error("Error fetching customer addresses:", error);
        return res.status(500).json({ message: error.message || "Error fetching addresses" });
    }
};

const add_address = async (req, res) => {
    try {
        const {
            customerid,
            customerId,
            address,
            pincode,
            countryname,
            countrycode,
            statename,
            statecode,
            cityname,
            title,
            isDefault
        } = req.body;

        const targetCustId = customerid || customerId;
        if (!targetCustId) {
            return res.status(400).json({ message: "Customer ID is required" });
        }

        if (!address || !pincode || !countryname || !statename || !cityname) {
            return res.status(400).json({ message: "Address, Pincode, Country, State, and City are required" });
        }

        let numericCustomerId = null;
        if (!isNaN(targetCustId)) {
            numericCustomerId = Number(targetCustId);
        } else {
            let foundCust = null;
            try {
                foundCust = await Customer.findById(targetCustId);
            } catch {
                // ignore
            }
            if (foundCust) {
                numericCustomerId = foundCust.customerid;
            }
        }

        if (!numericCustomerId) {
            return res.status(404).json({ message: "Customer not found" });
        }

        const maxAddr = await CustomerAddress.findOne().sort({ addressid: -1 });
        const nextAddressId = maxAddr && maxAddr.addressid ? parseInt(maxAddr.addressid) + 1 : 1;

        const existingCount = await CustomerAddress.countDocuments({ customerid: numericCustomerId });
        const shouldBeDefault = Boolean(isDefault) || existingCount === 0;

        if (shouldBeDefault) {
            await CustomerAddress.updateMany({ customerid: numericCustomerId }, { isDefault: false });
        }

        const newAddress = new CustomerAddress({
            addressid: nextAddressId,
            customerid: numericCustomerId,
            title: title ? String(title).trim() : "Home",
            address: String(address).trim(),
            pincode: String(pincode).trim(),
            countryname: String(countryname).trim(),
            countrycode: countrycode ? String(countrycode).trim() : "",
            statename: String(statename).trim(),
            statecode: statecode ? String(statecode).trim() : "",
            cityname: String(cityname).trim(),
            isDefault: shouldBeDefault,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        await newAddress.save();

        return res.status(201).json({
            message: "Address added successfully",
            address: newAddress
        });
    } catch (error) {
        console.error("Error adding customer address:", error);
        return res.status(500).json({ message: error.message || "Error adding address" });
    }
};

const update_address = async (req, res) => {
    try {
        const { addressId } = req.params;
        const {
            address,
            pincode,
            countryname,
            countrycode,
            statename,
            statecode,
            cityname,
            title,
            isDefault
        } = req.body;

        if (!addressId) {
            return res.status(400).json({ message: "Address ID is required" });
        }

        let addr = null;
        if (!isNaN(addressId)) {
            addr = await CustomerAddress.findOne({ addressid: Number(addressId) });
        }
        if (!addr) {
            try {
                addr = await CustomerAddress.findById(addressId);
            } catch {
                // ignore
            }
        }

        if (!addr) {
            return res.status(404).json({ message: "Address not found" });
        }

        if (isDefault === true && !addr.isDefault) {
            await CustomerAddress.updateMany({ customerid: addr.customerid }, { isDefault: false });
            addr.isDefault = true;
        } else if (isDefault === false && addr.isDefault) {
            addr.isDefault = false;
        }

        if (address !== undefined) addr.address = String(address).trim();
        if (pincode !== undefined) addr.pincode = String(pincode).trim();
        if (countryname !== undefined) addr.countryname = String(countryname).trim();
        if (countrycode !== undefined) addr.countrycode = String(countrycode).trim();
        if (statename !== undefined) addr.statename = String(statename).trim();
        if (statecode !== undefined) addr.statecode = String(statecode).trim();
        if (cityname !== undefined) addr.cityname = String(cityname).trim();
        if (title !== undefined) addr.title = String(title).trim();

        addr.updatedAt = new Date().toISOString();
        await addr.save();

        return res.status(200).json({
            message: "Address updated successfully",
            address: addr
        });
    } catch (error) {
        console.error("Error updating address:", error);
        return res.status(500).json({ message: error.message || "Error updating address" });
    }
};

const delete_address = async (req, res) => {
    try {
        const { addressId } = req.params;
        if (!addressId) {
            return res.status(400).json({ message: "Address ID is required" });
        }

        let addr = null;
        if (!isNaN(addressId)) {
            addr = await CustomerAddress.findOne({ addressid: Number(addressId) });
        }
        if (!addr) {
            try {
                addr = await CustomerAddress.findById(addressId);
            } catch {
                // ignore
            }
        }

        if (!addr) {
            return res.status(404).json({ message: "Address not found" });
        }

        const wasDefault = addr.isDefault;
        const customerId = addr.customerid;

        await CustomerAddress.deleteOne({ _id: addr._id });

        if (wasDefault) {
            const nextAddr = await CustomerAddress.findOne({ customerid: customerId }).sort({ createdAt: -1 });
            if (nextAddr) {
                nextAddr.isDefault = true;
                await nextAddr.save();
            }
        }

        return res.status(200).json({
            message: "Address deleted successfully",
            addressId
        });
    } catch (error) {
        console.error("Error deleting address:", error);
        return res.status(500).json({ message: error.message || "Error deleting address" });
    }
};

const set_default_address = async (req, res) => {
    try {
        const { addressId } = req.params;
        if (!addressId) {
            return res.status(400).json({ message: "Address ID is required" });
        }

        let addr = null;
        if (!isNaN(addressId)) {
            addr = await CustomerAddress.findOne({ addressid: Number(addressId) });
        }
        if (!addr) {
            try {
                addr = await CustomerAddress.findById(addressId);
            } catch {
                // ignore
            }
        }

        if (!addr) {
            return res.status(404).json({ message: "Address not found" });
        }

        await CustomerAddress.updateMany({ customerid: addr.customerid }, { isDefault: false });
        addr.isDefault = true;
        addr.updatedAt = new Date().toISOString();
        await addr.save();

        return res.status(200).json({
            message: "Default address updated",
            address: addr
        });
    } catch (error) {
        console.error("Error setting default address:", error);
        return res.status(500).json({ message: error.message || "Error setting default address" });
    }
};


// ==========================================
// ORDER CONTROLLER METHODS
// ==========================================

const create_order = async (req, res) => {
    try {
        const {
            customerid,
            customerId,
            items,
            subtotal,
            total,
            shippingAddress,
            shippingaddress,
            paymentMethod,
            paymentmethod
        } = req.body;

        let cust = req.customer;
        let numericCustomerId = cust?.customerid;

        if (!numericCustomerId) {
            const targetCustId = customerid || customerId;
            if (targetCustId && !isNaN(targetCustId)) {
                numericCustomerId = Number(targetCustId);
            }
            if (!cust && targetCustId) {
                try {
                    cust = await Customer.findById(targetCustId);
                } catch {
                    // ignore
                }
                if (!cust && numericCustomerId) {
                    cust = await Customer.findOne({ customerid: numericCustomerId });
                }
            }
        }

        if (!numericCustomerId && cust) {
            numericCustomerId = cust.customerid;
        }

        if (!numericCustomerId && !cust) {
            return res.status(400).json({ message: "Customer ID is required to place an order" });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "Order must contain at least one item" });
        }

        const addressData = shippingaddress || shippingAddress;
        if (!addressData || !addressData.address) {
            return res.status(400).json({ message: "Shipping address is required" });
        }

        const today = new Date().toISOString().split("T")[0];
        let currentFiscalYear = await FiscalYear.findOne({
            startdate: { $lte: today },
            enddate: { $gte: today },
            status: "Active"
        }).lean();

        if (!currentFiscalYear) {
            currentFiscalYear = await FiscalYear.findOne({
                startdate: { $lte: today },
                enddate: { $gte: today }
            }).lean();
        }

        if (!currentFiscalYear) {
            currentFiscalYear = await FiscalYear.findOne({ status: "Active" }).sort({ fiscalyearid: -1 }).lean();
        }

        if (!currentFiscalYear) {
            currentFiscalYear = await FiscalYear.findOne().sort({ fiscalyearid: -1 }).lean();
        }

        if (!currentFiscalYear) {
            const currentYear = new Date().getFullYear();
            currentFiscalYear = await FiscalYear.create({
                fiscalyearid: 1,
                fiscalyear: `${currentYear}-${currentYear + 1}`,
                startdate: `${currentYear}-04-01`,
                enddate: `${currentYear + 1}-03-31`,
                status: "Active",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }

        const fiscalyearid = currentFiscalYear ? currentFiscalYear.fiscalyearid : 1;

        const maxOrder = await Order.findOne().sort({ orderid: -1 });
        const nextOrderId = maxOrder && maxOrder.orderid ? parseInt(maxOrder.orderid) + 1 : 1;

        // Fiscal year wise sequential order number
        const maxOrderByFiscalYear = await Order.findOne({ fiscalyearid }).sort({ ordernumber: -1 });
        const nextOrderNumber = maxOrderByFiscalYear && maxOrderByFiscalYear.ordernumber
            ? parseInt(maxOrderByFiscalYear.ordernumber) + 1
            : 1;

        const ordernumber = nextOrderNumber;

        const formattedItems = await Promise.all(items.map(async (it) => {
            const itemPrice = Number(it.price) || 0;
            const itemQty = Number(it.qty) || 1;

            let numericItemId = null;
            if (it.itemid !== undefined && it.itemid !== null && it.itemid !== "" && !isNaN(it.itemid)) {
                numericItemId = Number(it.itemid);
            } else if (it.productId !== undefined && it.productId !== null && it.productId !== "" && !isNaN(it.productId)) {
                numericItemId = Number(it.productId);
            } else if (it.id !== undefined && it.id !== null && it.id !== "" && !isNaN(it.id)) {
                numericItemId = Number(it.id);
            }

            if (!numericItemId && (it.productId || it.id || it.itemid)) {
                try {
                    const lookupKey = it.productId || it.id || it.itemid;
                    const foundItem = await Item.findById(lookupKey).lean();
                    if (foundItem && foundItem.itemid !== undefined && foundItem.itemid !== null) {
                        numericItemId = Number(foundItem.itemid);
                    }
                } catch {
                    // ignore lookup error
                }
            }

            if (!numericItemId) {
                numericItemId = 1;
            }

            return {
                itemid: numericItemId,
                itemname: it.itemname || it.name || "Fine Jewelry Piece",
                image: it.image || "",
                metalname: it.metalname || it.metal || "",
                stonename: it.stonename || it.stone || "",
                diamondsize: it.diamondsize || it.carat || "",
                shapename: it.shapename || it.shape || "",
                clarityname: it.clarityname || it.clarity || "",
                diamondcolor: it.diamondcolor || it.diamondColor || it.diamondcolorname || "",
                bandcolor: it.bandcolor || it.bandColor || it.bandcolorname || "",
                specialinstruction: it.specialinstruction || it.specialInstruction || it.specialinstructions || it.instructions || "",
                price: itemPrice,
                qty: itemQty,
                totalprice: Number(it.totalprice) || (itemPrice * itemQty)
            };
        }));

        const totalitems = formattedItems.reduce((acc, curr) => acc + curr.qty, 0);

                let activeCurrencyDetails = null;
        try {
            const miscSetting = await MiscSetting.findOne().lean();
            if (miscSetting && miscSetting.currencyid) {
                const currDoc = await Currency.findOne({ currencyid: Number(miscSetting.currencyid) }).lean();
                if (currDoc) {
                    activeCurrencyDetails = {
                        currencyid: currDoc.currencyid,
                        countryname: currDoc.countryname || "",
                        currency: currDoc.currency || "INR",
                        currencysymbol: currDoc.currencysymbol || "₹",
                        currencyposition: currDoc.currencyposition || "left",
                        thousandseparator: currDoc.thousandseparator !== undefined && currDoc.thousandseparator !== null ? currDoc.thousandseparator : ",",
                        decimalseparator: currDoc.decimalseparator || ".",
                        decimal: currDoc.decimal !== undefined ? currDoc.decimal : 2
                    };
                }
            }
        } catch (currErr) {
            console.log("Error retrieving currency details from misc setting:", currErr);
        }

        if (!activeCurrencyDetails) {
            if (req.body.currencydetails && typeof req.body.currencydetails === 'object') {
                activeCurrencyDetails = req.body.currencydetails;
            } else {
                activeCurrencyDetails = {
                    currencyid: 1,
                    countryname: "India",
                    currency: "INR",
                    currencysymbol: "₹",
                    currencyposition: "left",
                    thousandseparator: ",",
                    decimalseparator: ".",
                    decimal: 2
                };
            }
        }

        const newOrder = new Order({
            orderid: nextOrderId,
            fiscalyearid,
            ordernumber,
            customerid: numericCustomerId,
            customername: cust?.fullname || req.body.customername || req.body.customerName || "",
            customeremail: cust?.email || req.body.customeremail || req.body.customerEmail || "",
            customerphone: cust?.phone || req.body.customerphone || req.body.customerPhone || "",
            items: formattedItems,
            totalitems,
            subtotal: Number(subtotal) || 0,
            total: Number(total) || Number(subtotal) || 0,
            currencydetails: activeCurrencyDetails,
            shippingaddress: {
                addressid: addressData.addressid || null,
                title: addressData.title || "Home",
                address: String(addressData.address).trim(),
                pincode: String(addressData.pincode).trim(),
                countryname: addressData.countryname ? String(addressData.countryname).trim() : "",
                countrycode: addressData.countrycode ? String(addressData.countrycode).trim() : "",
                statename: addressData.statename ? String(addressData.statename).trim() : "",
                statecode: addressData.statecode ? String(addressData.statecode).trim() : "",
                cityname: addressData.cityname ? String(addressData.cityname).trim() : ""
            },
            orderstatus: "Confirmed",
            statusLogs: [
                {
                    newStatus: "Confirmed",
                    updatedBy: cust?.fullname || req.body.customername || "Customer",
                    updatedAt: new Date().toISOString()
                }
            ],
            paymentstatus: "Paid",
            paymentmethod: paymentmethod || paymentMethod || "Credit/Debit Card",
            status: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        await newOrder.save();

        return res.status(201).json({
            message: "Order placed successfully",
            order: newOrder
        });
    } catch (error) {
        console.error("Error creating order:", error);
        return res.status(500).json({ message: error.message || "Failed to create order" });
    }
};

const get_customer_orders = async (req, res) => {
    try {
        const { customerId } = req.params;
        let numericId = null;
        if (!isNaN(customerId)) {
            numericId = Number(customerId);
        } else {
            const cust = await Customer.findById(customerId);
            if (cust) numericId = cust.customerid;
        }

        if (!numericId && req.customer?.customerid) {
            numericId = req.customer.customerid;
        }

        if (!numericId) {
            return res.status(200).json({ orders: [] });
        }

        const orders = await Order.find({ customerid: numericId }).sort({ orderid: -1 });
        return res.status(200).json({
            message: "Orders fetched successfully",
            orders
        });
    } catch (error) {
        console.error("Error fetching orders:", error);
        return res.status(500).json({ message: error.message || "Error fetching orders" });
    }
};

const get_orders_by_fiscal_year = async (req, res) => {
    try {
        const { fiscalYearId } = req.params;
        let query = {};
        if (fiscalYearId && fiscalYearId !== "all" && fiscalYearId !== "undefined" && fiscalYearId !== "null" && fiscalYearId !== "default") {
            const numericFy = Number(fiscalYearId);
            if (!isNaN(numericFy)) {
                query.fiscalyearid = numericFy;
            }
        }

        const orders = await Order.find(query).sort({ ordernumber: -1, orderid: -1, createdAt: -1 });
        return res.status(200).json({
            message: "Orders fetched successfully",
            orders
        });
    } catch (error) {
        console.error("Error fetching orders by fiscal year:", error);
        return res.status(500).json({ message: error.message || "Error fetching orders" });
    }
};

const update_order_status = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { orderstatus, paymentstatus, status, cancelreason, employeename } = req.body;

        let query = isNaN(orderId) ? { _id: orderId } : { $or: [{ orderid: Number(orderId) }, { _id: orderId }] };
        const order = await Order.findOne(query);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        let updaterName = (employeename && employeename.trim()) || "";
        if (!updaterName) {
            if (req.employee) {
                updaterName = [req.employee.firstname, req.employee.lastname].filter(Boolean).join(" ").trim() || req.employee.email || "Employee";
            } else if (req.user) {
                updaterName = [req.user.firstname, req.user.lastname].filter(Boolean).join(" ").trim() || req.user.name || req.user.email || "User";
            } else {
                updaterName = "Admin";
            }
        }

        const now = new Date().toISOString();

        if (orderstatus !== undefined) {
            const hasChanged = order.orderstatus !== orderstatus;
            order.orderstatus = orderstatus;

            if (!Array.isArray(order.statusLogs)) {
                order.statusLogs = [];
            }

            if (hasChanged || order.statusLogs.length === 0) {
                order.statusLogs.push({
                    newStatus: orderstatus,
                    updatedBy: updaterName,
                    updatedAt: now
                });
            }

            if (orderstatus === "Cancelled") {
                order.cancelledby = updaterName;
                order.cancelledat = now;
                if (cancelreason && cancelreason.trim()) {
                    order.cancelreason = cancelreason.trim();
                }
            }
        }

        if (paymentstatus !== undefined) order.paymentstatus = paymentstatus;
        if (status !== undefined) order.status = status;
        order.updatedAt = now;

        await order.save();
        return res.status(200).json({
            message: "Order updated successfully",
            order
        });
    } catch (error) {
        console.error("Error updating order status:", error);
        return res.status(500).json({ message: error.message || "Failed to update order" });
    }
};

const delete_order = async (req, res) => {
    try {
        const { orderId } = req.params;
        let query = isNaN(orderId) ? { _id: orderId } : { $or: [{ orderid: Number(orderId) }, { _id: orderId }] };
        const order = await Order.findOneAndDelete(query);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        return res.status(200).json({
            message: "Order deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting order:", error);
        return res.status(500).json({ message: error.message || "Failed to delete order" });
    }
};


const get_order_details = async (req, res) => {
    try {
        const { orderId } = req.params;
        let query = isNaN(orderId)
            ? { _id: orderId }
            : { $or: [{ orderid: Number(orderId) }, { ordernumber: Number(orderId) }, { _id: orderId }] };
        const order = await Order.findOne(query);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        return res.status(200).json({
            message: "Order details fetched successfully",
            order
        });
    } catch (error) {
        console.error("Error fetching order details:", error);
        return res.status(500).json({ message: error.message || "Failed to fetch order details" });
    }
};

module.exports = {
    signup,
    signin,
    verifyToken,
    update_profile,
    get_addresses,
    add_address,
    update_address,
    delete_address,
    set_default_address,
    create_order,
    get_customer_orders,
    get_orders_by_fiscal_year,
    get_order_details,
    update_order_status,
    delete_order
};