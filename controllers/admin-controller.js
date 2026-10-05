const Admin = require("../models/admin-model");
const AdminLoginActivity = require("../models/loginactivity-model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const moment = require("moment-timezone");
const { uploadToS3, deleteImageFromS3 } = require("../utils/s3Config-admin");

// Verify Token (Used on page reload / app initialization)
const verifyToken = async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1] || authHeader;

    if (!token) return res.status(401).json({ message: "Token missing" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_KEY || "gemora_diam_secret_jwt_key_2026");
        const admin = await Admin.findById(decoded.adminId);

        if (!admin || admin.Token !== token) {
            return res.status(401).json({ message: "Invalid or expired session token" });
        }

        const adminData = admin.toObject();
        delete adminData.password;

        return res.status(200).json({ message: "Token is valid", admin: adminData });
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired" });
        }
        console.error("Token verification error:", error);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

// Admin Sign In (Login)
const login_admin = async (req, res) => {
    try {
        const { email, password, browserdetails, ipaddress, device, location } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // Single database lookup: no req.db or multi-tenant switching
        const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
        if (!admin) {
            return res.status(404).json({ message: "Invalid Email" });
        }

        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid Password" });
        }

        // Generate JWT token
        const token = await admin.generateToken();

        // Save active token on admin document
        admin.Token = token;
        admin.updatedAt = new Date().toISOString();
        await admin.save();

        // Record Login Activity
        try {
            const maxActivity = await AdminLoginActivity.findOne().sort({ loginacitivityid: -1 });
            const nextLoginActivityId = maxActivity ? parseInt(maxActivity.loginacitivityid) + 1 : 1;

            const clientIp = ipaddress || req.headers["x-forwarded-for"]?.split(",")[0] || req.ip || "Unknown";
            const clientBrowser = browserdetails || req.headers["user-agent"] || "Unknown";

            const newActivity = new AdminLoginActivity({
                loginacitivityid: nextLoginActivityId,
                adminid: admin._id,
                browserdetails: clientBrowser,
                ipaddress: clientIp,
                device: device || "Desktop",
                location: location || "Unknown",
                login: new Date().toISOString()
            });

            await newActivity.save();
        } catch (activityError) {
            console.error("Failed to record admin login activity:", activityError.message);
        }

        const adminResponse = admin.toObject();
        delete adminResponse.password;

        return res.status(200).json({
            message: "Login successful",
            token,
            admin: adminResponse
        });
    } catch (error) {
        console.error("Admin login error:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Fetch Admin Profile Details
const getAdminDetailsById = async (req, res) => {
    try {
        // Admin is retrieved either from authenticated user or first admin record
        const adminId = req.admin?._id;
        const admin = adminId ? await Admin.findById(adminId) : await Admin.findOne();

        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        const adminDetails = {
            _id: admin._id,
            adminfirstname: admin.adminfirstname || "",
            adminlastname: admin.adminlastname || "",
            email: admin.email || "",
            phone: admin.phone || "",
            gender: admin.gender || "",
            address: admin.address || "",
            countryname: admin.countryname || "",
            statename: admin.statename || "",
            cityname: admin.cityname || "",
            countryid: admin.countryid || "",
            stateid: admin.stateid || "",
            cityid: admin.cityid || "",
            profileimage: admin.profileimage || "",
            createdAt: admin.createdAt || "",
            updatedAt: admin.updatedAt || ""
        };

        return res.status(200).json({ message: "Admin details fetched successfully", admin: adminDetails });
    } catch (error) {
        console.error("Error fetching admin details:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// Update Admin Profile Details
const updateAdmin = async (req, res) => {
    try {
        const adminId = req.admin?._id;
        const admin = adminId ? await Admin.findById(adminId) : await Admin.findOne();

        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        uploadToS3("profileimage")(req, res, async function (err) {
            if (err) {
                console.log("Error uploading profile image:", err);
                return res.status(500).json({ message: "Error uploading profile image", error: err.message || err });
            }

            const updateData = req.body;

            if (req.file) {
                if (admin.profileimage) {
                    await deleteImageFromS3(admin.profileimage, "profileimage");
                }
                admin.profileimage = req.file.location;
            }

            // Update admin fields
            admin.adminfirstname = updateData.firstname || admin.adminfirstname;
            admin.adminlastname = updateData.lastname || admin.adminlastname;
            admin.email = updateData.email || admin.email;
            admin.phone = updateData.phone || admin.phone;
            admin.address = updateData.address || admin.address;
            admin.gender = updateData.gender || admin.gender;
            admin.countryname = updateData.countryname || admin.countryname;
            admin.statename = updateData.statename || admin.statename;
            admin.cityname = updateData.cityname || admin.cityname;
            admin.countryid = updateData.countryid || admin.countryid;
            admin.stateid = updateData.stateid || admin.stateid;
            admin.cityid = updateData.cityid || admin.cityid;
            admin.updatedAt = new Date().toISOString();

            await admin.save();

            const updatedAdmin = admin.toObject();
            delete updatedAdmin.password;

            return res.status(200).json({ message: "Admin details updated successfully", admin: updatedAdmin });
        });
    } catch (error) {
        console.error("Error updating admin details:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// Verify Old Password
const verifyOldPassword = async (req, res) => {
    try {
        const { oldPassword } = req.body;
        if (!oldPassword) return res.status(400).json({ message: "Old password is required" });

        const adminId = req.admin?._id;
        const admin = adminId ? await Admin.findById(adminId) : await Admin.findOne();

        if (!admin) return res.status(404).json({ message: "Admin not found" });

        const isPasswordMatch = await bcrypt.compare(oldPassword, admin.password);
        if (!isPasswordMatch) return res.status(401).json({ message: "Incorrect old password" });

        return res.status(200).json({ message: "Old password verified successfully" });
    } catch (error) {
        console.error("Error verifying old password:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// Change Password
const changePassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword) return res.status(400).json({ message: "New password is required" });

        const adminId = req.admin?._id;
        const admin = adminId ? await Admin.findById(adminId) : await Admin.findOne();

        if (!admin) return res.status(404).json({ message: "Admin not found" });

        admin.password = await bcrypt.hash(newPassword, 10);
        admin.updatedAt = new Date().toISOString();
        await admin.save();

        return res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
        console.error("Error changing password:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// Get Admin Login Activities
const getAdminLoginActivity = async (req, res) => {
    try {
        const activities = await AdminLoginActivity.find().sort({ login: -1 }).limit(50);

        const formattedActivities = activities.map((activity) => {
            const act = activity.toObject();
            return {
                ...act,
                loginFormatted: act.login ? moment(act.login).format("DD/MM/YYYY hh:mm A") : ""
            };
        });

        return res.status(200).json({
            message: "Login activity fetched successfully",
            activities: formattedActivities
        });
    } catch (error) {
        console.error("Error fetching login activity:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    verifyToken,
    login_admin,
    getAdminDetailsById,
    updateAdmin,
    verifyOldPassword,
    changePassword,
    getAdminLoginActivity
};