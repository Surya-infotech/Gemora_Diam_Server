const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin-controller");
const { authMiddleware } = require("../middlewares/auth-middleware");

router.route("/Signin").post(adminController.login_admin);
router.route("/verify-token").get(adminController.verifyToken);
router.route("/GetAdminDetails").get(authMiddleware, adminController.getAdminDetailsById);
router.route("/UpdateAdminDetails").put(authMiddleware, adminController.updateAdmin);
router.route("/GetLoginActivity/:EmployeeId").get(authMiddleware, adminController.getAdminLoginActivity);
router.route("/VerifyOldPassword").post(authMiddleware, adminController.verifyOldPassword);
router.route("/ChangePassword").put(authMiddleware, adminController.changePassword);

module.exports = router;