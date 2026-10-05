const jwt = require("jsonwebtoken");
const Admin = require("../models/admin-model");

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
        const decoded = jwt.verify(token, process.env.JWT_KEY);

        if (!decoded.adminId) {
            return res.status(401).json({ message: "Unauthorized: Invalid token payload" });
        }

        const admin = await Admin.findById(decoded.adminId).select("-password");

        if (!admin) {
            return res.status(401).json({ message: "Unauthorized: Admin account not found" });
        }

        if (admin.Token && admin.Token !== token) {
            return res.status(401).json({ message: "Unauthorized: Token has been invalidated or logged in elsewhere" });
        }

        req.admin = admin;
        req.user = admin;
        req.token = token;

        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired, please log in again" });
        }
        return res.status(401).json({ message: "Invalid token, please log in again" });
    }
};

module.exports = { authMiddleware, authmiddleware: authMiddleware };
