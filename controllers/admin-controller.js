const Employee = require("../models/AdminPanel/User/employee-model");
const AdminLoginActivity = require("../models/loginactivity-model");
const MiscSetting = require("../models/AdminPanel/System/Setting/miscsetting-model");
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
        const userId = decoded.adminId || decoded.employeeId || decoded.id;
        const employee = await Employee.findById(userId);

        if (!employee || employee.Token !== token || employee.status === false) {
            return res.status(401).json({ message: "Invalid or expired session token" });
        }

        const employeeData = employee.toObject();
        delete employeeData.password;

        return res.status(200).json({
            message: "Token is valid",
            role: employee.role,
            employee: employeeData,
            admin: employeeData
        });
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired" });
        }
        console.error("Token verification error:", error);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

// Sign In (Login using Employee table)
const login_admin = async (req, res) => {
    try {
        const { email, password, browserdetails, ipaddress, device, location } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const cleanEmail = email.toLowerCase().trim();
        const employee = await Employee.findOne({ email: cleanEmail });
        if (!employee) {
            return res.status(404).json({ message: "Invalid Email" });
        }

        if (employee.status === false) {
            return res.status(403).json({ message: "Your account is inactive. Please contact administrator." });
        }

        const isPasswordValid = await bcrypt.compare(password, employee.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid Password" });
        }

        const token = employee.generateToken();

        employee.Token = token;
        employee.updatedAt = new Date().toISOString();
        await employee.save();

        // Record login activity
        try {
            const maxActivity = await AdminLoginActivity.findOne().sort({ loginacitivityid: -1 });
            const nextLoginActivityId = maxActivity ? parseInt(maxActivity.loginacitivityid) + 1 : 1;

            const clientIp = ipaddress || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "Unknown";
            const clientBrowser = browserdetails || req.headers["user-agent"] || "Unknown";

            const newActivity = new AdminLoginActivity({
                loginacitivityid: nextLoginActivityId,
                adminid: employee._id,
                browserdetails: clientBrowser,
                ipaddress: clientIp,
                device: device || "Desktop",
                location: location || "Unknown",
                login: new Date().toISOString()
            });

            await newActivity.save();
        } catch (activityError) {
            console.error("Failed to record login activity:", activityError.message);
        }

        const employeeResponse = employee.toObject();
        delete employeeResponse.password;

        return res.status(200).json({
            message: "Login successful",
            token,
            role: employee.role,
            employee: employeeResponse,
            admin: employeeResponse
        });
    } catch (error) {
        console.error("Sign in error:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Fetch User Profile Details
const getAdminDetailsById = async (req, res) => {
    try {
        const userId = req.user?._id || req.admin?._id || req.employee?._id;
        const employee = userId ? await Employee.findById(userId) : await Employee.findOne();

        if (!employee) {
            return res.status(404).json({ message: "User not found" });
        }

        const userDetails = {
            _id: employee._id,
            firstname: employee.firstname || "",
            lastname: employee.lastname || "",
            adminfirstname: employee.firstname || "",
            adminlastname: employee.lastname || "",
            email: employee.email || "",
            phone: employee.phone || "",
            role: employee.role || "Employee",
            status: employee.status,
            gender: employee.gender || "Male",
            address: employee.address || "",
            countryname: employee.countryname || "",
            statename: employee.statename || "",
            cityname: employee.cityname || "",
            countryid: employee.countryid || "",
            stateid: employee.stateid || "",
            cityid: employee.cityid || "",
            profileimage: employee.profileimage || "",
            createdAt: employee.createdAt || "",
            updatedAt: employee.updatedAt || ""
        };

        return res.status(200).json({
            message: "Profile details fetched successfully",
            admin: userDetails,
            employee: userDetails
        });
    } catch (error) {
        console.error("Error fetching profile details:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// Update User Profile Details
const updateAdmin = async (req, res) => {
    try {
        const userId = req.user?._id || req.admin?._id || req.employee?._id;
        const employee = userId ? await Employee.findById(userId) : await Employee.findOne();

        if (!employee) {
            return res.status(404).json({ message: "User not found" });
        }

        uploadToS3("profileimage")(req, res, async function (err) {
            if (err) {
                console.log("Error uploading profile image:", err);
                return res.status(500).json({ message: "Error uploading profile image", error: err.message || err });
            }

            const updateData = req.body;

            if (req.file) {
                if (employee.profileimage) {
                    await deleteImageFromS3(employee.profileimage, "profileimage");
                }
                employee.profileimage = req.file.location;
            }

            employee.firstname = updateData.firstname || updateData.adminfirstname || employee.firstname;
            employee.lastname = updateData.lastname || updateData.adminlastname || employee.lastname;
            employee.email = updateData.email || employee.email;
            employee.phone = updateData.phone || employee.phone;
            employee.address = updateData.address || employee.address;
            employee.gender = updateData.gender || employee.gender;
            employee.countryname = updateData.countryname || employee.countryname;
            employee.statename = updateData.statename || employee.statename;
            employee.cityname = updateData.cityname || employee.cityname;
            employee.countryid = updateData.countryid || employee.countryid;
            employee.stateid = updateData.stateid || employee.stateid;
            employee.cityid = updateData.cityid || employee.cityid;
            employee.updatedAt = new Date().toISOString();

            await employee.save();

            const updatedUser = employee.toObject();
            delete updatedUser.password;

            return res.status(200).json({
                message: "Profile details updated successfully",
                admin: updatedUser,
                employee: updatedUser
            });
        });
    } catch (error) {
        console.error("Error updating profile details:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// Verify Old Password
const verifyOldPassword = async (req, res) => {
    try {
        const { oldPassword } = req.body;
        if (!oldPassword) return res.status(400).json({ message: "Old password is required" });

        const userId = req.user?._id || req.admin?._id || req.employee?._id;
        const employee = userId ? await Employee.findById(userId) : await Employee.findOne();

        if (!employee) return res.status(404).json({ message: "User not found" });

        const isPasswordMatch = await bcrypt.compare(oldPassword, employee.password);
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

        const userId = req.user?._id || req.admin?._id || req.employee?._id;
        const employee = userId ? await Employee.findById(userId) : await Employee.findOne();

        if (!employee) return res.status(404).json({ message: "User not found" });

        employee.password = await bcrypt.hash(newPassword, 10);
        employee.updatedAt = new Date().toISOString();
        await employee.save();

        return res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
        console.error("Error changing password:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

// Get Login Activities
const getAdminLoginActivity = async (req, res) => {
    try {
        const activities = await AdminLoginActivity.find().sort({ login: -1 }).limit(50);
        const miscSettings = await MiscSetting.findOne();

        const dateFormat = miscSettings?.dateFormat || "DD/MM/YYYY";
        const timeFormat = miscSettings?.timeFormat || "hh:mm A";
        const timeZone = miscSettings?.timeZone || "Asia/Kolkata";

        const formattedActivities = activities.map((activity) => {
            const act = activity.toObject();
            const formattedLogin = act.login
                ? moment.tz(act.login, timeZone).format(`${dateFormat} ${timeFormat}`)
                : "";
            return {
                ...act,
                loginFormatted: formattedLogin
            };
        });

        return res.status(200).json({
            message: "Login activity fetched successfully",
            activities: formattedActivities,
            miscSettings: miscSettings ? {
                timeZone: miscSettings.timeZone,
                dateFormat: miscSettings.dateFormat,
                timeFormat: miscSettings.timeFormat
            } : null
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