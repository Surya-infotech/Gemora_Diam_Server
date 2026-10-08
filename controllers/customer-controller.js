const Customer = require("../models/customer-model");
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

module.exports = {
    signup,
    signin,
    verifyToken,
    update_profile
};
