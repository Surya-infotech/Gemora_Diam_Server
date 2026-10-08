const Customer = require("../models/customer-model");
const CustomerAddress = require("../models/customer-address-model");
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
            status: true,
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
    } catch (error) {
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
            status: true,
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

module.exports = {
    signup,
    signin,
    verifyToken,
    update_profile,
    get_addresses,
    add_address,
    update_address,
    delete_address,
    set_default_address
};
