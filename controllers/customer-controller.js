const Customer = require("../models/customer-model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const signup = async (req, res) => {
    try {
        const { fullname, name, email, password, phone } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const cleanEmail = email.toLowerCase().trim();

        const existingCustomer = await Customer.findOne({ email: cleanEmail });
        if (existingCustomer) {
            return res.status(400).json({ message: "Email already exists. Please sign in instead." });
        }

        const finalFullName = (fullname || name || cleanEmail.split("@")[0]).trim();

        const maxCustomer = await Customer.findOne().sort({ customerid: -1 });
        const nextCustomerId = maxCustomer && maxCustomer.customerid ? parseInt(maxCustomer.customerid) + 1 : 1;

        const hashedPassword = await bcrypt.hash(password, 10);

        const newCustomer = new Customer({
            customerid: nextCustomerId,
            fullname: finalFullName,
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
        const { fullname, name, phone } = req.body;

        const customer = await Customer.findById(customerId);
        if (!customer) return res.status(404).json({ message: "Customer not found" });

        if (fullname || name) customer.fullname = (fullname || name).trim();
        if (phone !== undefined) customer.phone = phone;
        customer.updatedAt = new Date().toISOString();

        await customer.save();
        const customerData = customer.toObject();
        delete customerData.password;

        return res.status(200).json({ message: "Profile updated", customer: customerData });
    } catch (error) {
        return res.status(500).json({ message: "Error updating profile" });
    }
};

module.exports = {
    signup,
    signin,
    verifyToken,
    update_profile
};
