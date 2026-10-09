const jwt = require("jsonwebtoken");
const Employee = require("../models/AdminPanel/User/employee-model");
const Customer = require("../models/customer-model");

const authMiddleware = async (req, res, next) => {
    const authHeader = req.header("Authorization") || req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: "Unauthorized: Token not provided" });
    }

    const token = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7).trim()
        : authHeader.trim();

    if (!token) {
        return res.status(401).json({ message: "Unauthorized: Token missing in Authorization header" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_KEY || "gemora_diam_secret_jwt_key_2026");

        const userId = decoded.adminId || decoded.employeeId || decoded.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized: Invalid token payload" });
        }

        const employee = await Employee.findById(userId).select("-password");

        if (!employee) {
            return res.status(401).json({ message: "Unauthorized: Account not found" });
        }

        if (employee.status === false) {
            return res.status(401).json({ message: "Unauthorized: Account is inactive" });
        }

        if (employee.Token && employee.Token !== token) {
            return res.status(401).json({ message: "Unauthorized: Token has been invalidated or logged in elsewhere" });
        }

        req.admin = employee;
        req.user = employee;
        req.employee = employee;
        req.token = token;

        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired, please log in again" });
        }
        return res.status(401).json({ message: "Invalid token, please log in again" });
    }
};

/**
 * Combined authentication middleware for APIs called from both:
 * - User side (Gemora website)
 * - Admin side (Admin panel)
 *
 * Rules:
 * - Checks for 'x-user' header in the request.
 * - When 'x-user' is present -> verifies token against the Customer database (customer table).
 * - When 'x-user' is NOT found -> verifies token against the Admin database in the Employee table.
 */
const customerOrAdminAuth = async (req, res, next) => {
    const authHeader = req.header("Authorization") || req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: "Unauthorized: Token not provided" });
    }

    const token = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7).trim()
        : authHeader.trim();

    if (!token) {
        return res.status(401).json({ message: "Unauthorized: Token missing in Authorization header" });
    }

    const rawXUser = req.header("x-user") || req.headers["x-user"];
    const isUserSide = Boolean(
        rawXUser !== undefined &&
        rawXUser !== null &&
        rawXUser !== "" &&
        String(rawXUser).toLowerCase() !== "false" &&
        String(rawXUser).toLowerCase() !== "null"
    );

    if (isUserSide) {
        // User / Customer side verification
        try {
            const decoded = jwt.verify(
                token,
                process.env.CUSTOMER_JWT_KEY || "gemora_diam_secret_jwt_key_2026_customer"
            );

            const customerId = decoded.customerId || decoded.id || decoded._id;
            if (!customerId) {
                return res.status(401).json({ message: "Unauthorized: Invalid customer token payload" });
            }

            const customer = await Customer.findById(customerId).select("-password");

            if (!customer) {
                return res.status(401).json({ message: "Unauthorized: Customer account not found" });
            }

            if (customer.status === false) {
                return res.status(401).json({ message: "Unauthorized: Customer account is inactive" });
            }

            if (customer.Token && customer.Token !== token) {
                return res.status(401).json({ message: "Unauthorized: Customer session expired or logged in elsewhere" });
            }

            req.customer = customer;
            req.user = customer;
            req.isCustomer = true;
            req.isAdmin = false;
            req.token = token;

            return next();
        } catch (error) {
            if (error.name === "TokenExpiredError") {
                return res.status(401).json({ message: "Customer token expired, please sign in again" });
            }
            return res.status(401).json({ message: "Invalid customer token, please sign in again" });
        }
    } else {
        // Admin / Employee side verification (when x-user is not found)
        try {
            const decoded = jwt.verify(
                token,
                process.env.JWT_KEY || "gemora_diam_secret_jwt_key_2026"
            );

            const userId = decoded.adminId || decoded.employeeId || decoded.id;
            if (!userId) {
                return res.status(401).json({ message: "Unauthorized: Invalid admin token payload" });
            }

            const employee = await Employee.findById(userId).select("-password");

            if (!employee) {
                return res.status(401).json({ message: "Unauthorized: Admin/Employee account not found" });
            }

            if (employee.status === false) {
                return res.status(401).json({ message: "Unauthorized: Account is inactive" });
            }

            if (employee.Token && employee.Token !== token) {
                return res.status(401).json({ message: "Unauthorized: Admin token has been invalidated or logged in elsewhere" });
            }

            req.admin = employee;
            req.user = employee;
            req.employee = employee;
            req.isAdmin = true;
            req.isCustomer = false;
            req.token = token;

            return next();
        } catch (error) {
            if (error.name === "TokenExpiredError") {
                return res.status(401).json({ message: "Admin token expired, please sign in again" });
            }
            return res.status(401).json({ message: "Invalid admin token, please sign in again" });
        }
    }
};

module.exports = {
    authMiddleware,
    customerOrAdminAuth
};