const express = require("express");
const mainrouter = express.Router();
const maincontroller = require("../../controllers/AdminPanel/main-controller");
const { authMiddleware } = require("../../middlewares/auth-middleware");

mainrouter.route("/GetDashboard").get(authMiddleware, maincontroller.get_dashboard);
mainrouter.route("/GetDashboard/:fiscalYearId").get(authMiddleware, maincontroller.get_dashboard);

module.exports = mainrouter;