const jwt = require("jsonwebtoken");
const Employee = require("../models/AdminPanel/User/employee-model");

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

module.exports = { authMiddleware };
